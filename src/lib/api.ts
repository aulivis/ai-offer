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
          return true;
        }

        if (response.status === 401) {
          return false;
        }

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

  if (response.status === 401) {
    const refreshed = await refreshSession(requestSignal);
    if (refreshed) {
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
