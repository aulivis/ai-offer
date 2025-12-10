/**
 * Dashboard configuration constants
 */
export const DASHBOARD_CONFIG = {
  /** Root margin for intersection observer (pixels before bottom to trigger load) */
  INFINITE_SCROLL_ROOT_MARGIN_PX: 200,
  /** Debounce delay for quota refresh (ms) */
  QUOTA_REFRESH_DEBOUNCE_MS: 500,
  /** Delay before session check retry (ms) */
  SESSION_CHECK_DELAY_MS: 100,
  /** Visibility refresh threshold (ms) - refresh if hidden longer than this */
  VISIBILITY_REFRESH_THRESHOLD_MS: 5000,
  /** Debounce delay for localStorage writes (ms) */
  LOCAL_STORAGE_DEBOUNCE_MS: 300,
} as const;
