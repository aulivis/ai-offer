import type { SupabaseClient } from '@supabase/supabase-js';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    if (options && 'cause' in options) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      (this as { cause?: unknown }).cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface AuthenticatedFetchOptions extends RequestInit {
  supabase: SupabaseClient;
  errorMessageBuilder?: (status: number) => string;
  defaultErrorMessage?: string;
  authErrorMessage?: string;
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
  const { supabase, errorMessageBuilder, defaultErrorMessage, authErrorMessage, headers, ...init } = options;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token ?? null;

  if (sessionError || !token) {
    const message =
      authErrorMessage ??
      sessionError?.message ??
      defaultErrorMessage ??
      'Nem sikerült hitelesíteni a kérést.';
    throw new ApiError(message, { status: 401, cause: sessionError ?? undefined });
  }

  const finalHeaders = new Headers(headers ?? undefined);
  finalHeaders.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(input, { ...init, headers: finalHeaders });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    const message =
      defaultErrorMessage ??
      (error instanceof Error && error.message
        ? error.message
        : 'Ismeretlen hiba történt a kérés során.');
    throw new ApiError(message, { cause: error ?? undefined });
  }

  if (response.ok) {
    return response;
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
    message = errorMessageBuilder ? errorMessageBuilder(response.status) : `Hiba a kérés során (${response.status})`;
  }

  throw new ApiError(message, { status: response.status });
}
