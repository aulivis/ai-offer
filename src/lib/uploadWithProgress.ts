/**
 * Upload utility with progress tracking support.
 * Provides a fetch-like API with upload progress callbacks.
 */

import { ApiError, getCsrfToken, refreshSession } from './api';
import { t } from '@/copy';

export interface UploadProgressOptions extends RequestInit {
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
  errorMessageBuilder?: (status: number) => string;
  defaultErrorMessage?: string;
  authErrorMessage?: string;
}

const DEFAULT_AUTH_ERROR_KEY = 'errors.auth.requestFailed' as const;

/**
 * Uploads a file with progress tracking using XMLHttpRequest.
 * Provides the same API as fetchWithSupabaseAuth but with progress support.
 */
export async function uploadWithProgress(
  url: string,
  options: UploadProgressOptions,
): Promise<Response> {
  const {
    onProgress,
    errorMessageBuilder,
    defaultErrorMessage,
    authErrorMessage,
    headers,
    signal,
    body,
    method = 'POST',
    ...restInit
  } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const requestUrl = typeof url === 'string' ? url : url.toString();

    // Set up abort handling
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    }

    // Set up progress tracking
    if (onProgress && body instanceof FormData) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });
    }

    // Set up response handling
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Create a Response-like object
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(
            xhr
              .getAllResponseHeaders()
              .split('\r\n')
              .filter(Boolean)
              .map((header) => {
                const [key, ...values] = header.split(': ');
                return [key, values.join(': ')] as [string, string];
              }),
          ),
        });
        resolve(response);
      } else if (xhr.status === 401) {
        // Try to refresh session and retry once
        refreshSession(signal)
          .then((refreshed) => {
            if (refreshed) {
              // Retry the request once
              uploadWithProgress(url, { ...options, authErrorMessage: undefined }).then(resolve).catch(reject);
            } else {
              const message = authErrorMessage ?? defaultErrorMessage ?? t(DEFAULT_AUTH_ERROR_KEY);
              reject(new ApiError(message, { status: 401 }));
            }
          })
          .catch(() => {
            const message = authErrorMessage ?? defaultErrorMessage ?? t(DEFAULT_AUTH_ERROR_KEY);
            reject(new ApiError(message, { status: 401 }));
          });
      } else {
        // Extract error message from response
        let message: string | undefined;
        const contentType = xhr.getResponseHeader('Content-Type') ?? '';
        if (contentType.includes('application/json')) {
          try {
            const payload = JSON.parse(xhr.responseText);
            if (payload && typeof payload === 'object') {
              if (typeof payload.error === 'string') {
                message = payload.error;
              } else if (typeof payload.message === 'string') {
                message = payload.message;
              }
            }
          } catch {
            // ignore JSON parse errors
          }
        }

        if (!message) {
          message = errorMessageBuilder
            ? errorMessageBuilder(xhr.status)
            : t('errors.requestStatus', { status: xhr.status });
        }

        reject(new ApiError(message, { status: xhr.status }));
      }
    });

    xhr.addEventListener('error', () => {
      const message =
        defaultErrorMessage ?? (xhr.statusText || t('errors.requestFailed'));
      reject(new ApiError(message, { cause: new Error('Network error') }));
    });

    xhr.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    });

    // Set up request
    xhr.open(method, requestUrl, true);
    xhr.withCredentials = true; // Include credentials

    // Set headers
    const finalHeaders = new Headers(headers ?? undefined);
    if (method !== 'GET' && method !== 'HEAD' && !finalHeaders.has('x-csrf-token')) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        finalHeaders.set('x-csrf-token', csrfToken);
      }
    }

    finalHeaders.forEach((value, key) => {
      xhr.setRequestHeader(key, value);
    });

    // Send request
    if (body) {
      xhr.send(body as BodyInit);
    } else {
      xhr.send();
    }
  });
}

