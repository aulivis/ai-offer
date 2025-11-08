import { t } from '@/copy';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    if (options?.status !== undefined) {
      this.status = options.status;
    }
    if (options && 'cause' in options) {
      (this as { cause?: unknown }).cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface AuthenticatedFetchOptions extends RequestInit {
  errorMessageBuilder?: (status: number) => string;
  defaultErrorMessage?: string;
  authErrorMessage?: string;
}

const DEFAULT_AUTH_ERROR_KEY = 'errors.auth.requestFailed' as const;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const pattern = new RegExp(`(?:^|; )${name}=([^;]*)`);
  const match = pattern.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

function hasRefreshToken(): boolean {
  const refreshToken = readCookie('propono_rt');
  return refreshToken !== null && refreshToken.length > 0;
}

export function getCsrfToken(): string | null {
  const cookieValue = readCookie('XSRF-TOKEN');
  if (!cookieValue) {
    return null;
  }

  const delimiterIndex = cookieValue.indexOf('.');
  if (delimiterIndex <= 0) {
    return null;
  }

  return cookieValue.slice(0, delimiterIndex);
}

const REFRESH_ENDPOINT = '/api/auth/refresh';

let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(signal?: AbortSignal): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrfToken = getCsrfToken();
      const headers = new Headers({ 'x-csrf-token': csrfToken ?? '' });

      try {
        const requestInit: RequestInit = {
          method: 'POST',
          credentials: 'include',
          headers,
        };
        if (signal) {
          requestInit.signal = signal;
        }

        const response = await fetch(REFRESH_ENDPOINT, requestInit);

        if (response.ok) {
          // Small delay to ensure cookies are propagated before subsequent requests
          // This helps prevent race conditions where the browser hasn't processed Set-Cookie headers yet
          await new Promise((resolve) => setTimeout(resolve, 0));
          return true;
        }

        // 401: Unauthorized - refresh token invalid/expired
        if (response.status === 401) {
          return false;
        }

        // 403: Forbidden - CSRF token invalid
        // This can happen if CSRF cookie is missing or expired
        // Return false to indicate refresh failed
        if (response.status === 403) {
          return false;
        }

        // Other errors - refresh failed
        return false;
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  if (typeof error === 'object' && 'name' in error) {
    const { name } = error as { name?: unknown };
    return name === 'AbortError';
  }

  return false;
}

export async function fetchWithSupabaseAuth(
  input: RequestInfo | URL,
  options: AuthenticatedFetchOptions,
): Promise<Response> {
  const {
    errorMessageBuilder,
    defaultErrorMessage,
    authErrorMessage,
    headers,
    signal,
    ...restInit
  } = options;

  const finalHeaders = new Headers(headers ?? undefined);
  const method = (restInit.method ?? 'GET').toString().toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && !finalHeaders.has('x-csrf-token')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      finalHeaders.set('x-csrf-token', csrfToken);
    }
  }

  const requestSignal = signal ?? undefined;

  async function attemptFetch(): Promise<Response> {
    try {
      // Re-read CSRF token on each attempt to ensure we have the latest value
      // This is critical after a refresh when the CSRF cookie is updated
      const method = (restInit.method ?? 'GET').toString().toUpperCase();
      if (method !== 'GET' && method !== 'HEAD') {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          finalHeaders.set('x-csrf-token', csrfToken);
        } else if (!finalHeaders.has('x-csrf-token')) {
          // Only set empty if not already set (preserve explicit empty values)
          finalHeaders.set('x-csrf-token', '');
        }
      }

      const requestInit: RequestInit = {
        ...restInit,
        credentials: restInit.credentials ?? 'include',
        headers: finalHeaders,
      };
      if (requestSignal !== undefined) {
        requestInit.signal = requestSignal;
      }

      return await fetch(input, requestInit);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw error;
      }

      const message =
        defaultErrorMessage ??
        (error instanceof Error && error.message ? error.message : t('errors.requestFailed'));
      throw new ApiError(message, { cause: error ?? undefined });
    }
  }

  let response: Response;
  response = await attemptFetch();

  // Only attempt refresh if we have a refresh token cookie
  // This prevents infinite refresh loops when the user is not logged in
  if (response.status === 401 && hasRefreshToken()) {
    const refreshed = await refreshSession(requestSignal);
    if (refreshed) {
      // Small delay to ensure cookies are propagated after refresh
      // This helps prevent race conditions where the browser hasn't processed Set-Cookie headers yet
      await new Promise((resolve) => setTimeout(resolve, 0));
      response = await attemptFetch();
    }
  }

  if (response.ok) {
    return response;
  }

  if (response.status === 401) {
    const message = authErrorMessage ?? defaultErrorMessage ?? t(DEFAULT_AUTH_ERROR_KEY);
    throw new ApiError(message, { status: 401 });
  }

  // 403 typically indicates CSRF token failure
  // This is not recoverable via refresh since refresh itself requires CSRF
  if (response.status === 403) {
    let message: string | undefined;
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        const payload = await response.clone().json();
        if (payload && typeof payload === 'object') {
          const record = payload as Record<string, unknown>;
          if (typeof record.error === 'string') {
            message = record.error;
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }
    throw new ApiError(
      message ?? errorMessageBuilder?.(403) ?? t('errors.requestStatus', { status: 403 }),
      { status: 403 },
    );
  }

  let message: string | undefined;
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const payload = await response.clone().json();
      if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        if (typeof record.error === 'string') {
          message = record.error;
        } else if (typeof record.message === 'string') {
          message = record.message;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  if (!message) {
    message = errorMessageBuilder
      ? errorMessageBuilder(response.status)
      : t('errors.requestStatus', { status: response.status });
  }

  throw new ApiError(message, { status: response.status });
}
