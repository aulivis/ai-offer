/**
 * Utility function to get device ID from cookie
 */
export function getDeviceIdFromCookie(name = 'propono_device_id'): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const rawCookie = document.cookie;
  if (!rawCookie) {
    return null;
  }

  const parts = rawCookie.split(';');
  for (const part of parts) {
    const [cookieName, ...rest] = part.trim().split('=');
    if (cookieName === name) {
      const value = rest.join('=');
      if (!value) {
        return null;
      }
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}





