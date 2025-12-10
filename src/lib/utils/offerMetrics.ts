/**
 * Utility functions for formatting and displaying offer metrics
 */

/**
 * Format view count with appropriate label
 */
export function formatViewCount(count: number | undefined): string {
  if (count === undefined || count === 0) {
    return '0';
  }
  if (count < 1000) {
    return count.toString();
  }
  if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Format acceptance time in a human-readable way
 */
export function formatAcceptanceTime(days: number | null | undefined): string {
  if (days === null || days === undefined) {
    return '—';
  }
  if (days === 0) {
    return '< 1 nap';
  }
  if (days === 1) {
    return '1 nap';
  }
  if (days < 7) {
    return `${days} nap`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return weeks === 1 ? '1 hét' : `${weeks} hét`;
    }
    return `${weeks} hét ${remainingDays} nap`;
  }
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  if (remainingDays === 0) {
    return months === 1 ? '1 hónap' : `${months} hónap`;
  }
  return `${months} hónap ${remainingDays} nap`;
}

/**
 * Get share expiry status display info
 */
export function getShareExpiryInfo(
  status: 'active' | 'expired' | 'none' | undefined,
  earliestExpiresAt: string | null | undefined,
): {
  label: string;
  color: string;
  bgColor: string;
  icon: 'active' | 'expired' | 'none';
} {
  if (status === 'expired') {
    return {
      label: 'Lejárt',
      color: 'text-danger',
      bgColor: 'bg-danger/10 border-danger/30',
      icon: 'expired',
    };
  }
  if (status === 'active') {
    if (earliestExpiresAt) {
      const expiresDate = new Date(earliestExpiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysUntilExpiry <= 7) {
        return {
          label: `Lejár: ${daysUntilExpiry} nap`,
          color: 'text-warning',
          bgColor: 'bg-warning/10 border-warning/30',
          icon: 'active',
        };
      }
      return {
        label: 'Aktív',
        color: 'text-success',
        bgColor: 'bg-success/10 border-success/30',
        icon: 'active',
      };
    }
    return {
      label: 'Aktív',
      color: 'text-success',
      bgColor: 'bg-success/10 border-success/30',
      icon: 'active',
    };
  }
  return {
    label: 'Nincs megosztás',
    color: 'text-fg-muted',
    bgColor: 'bg-bg-muted border-border',
    icon: 'none',
  };
}

/**
 * Format date relative to now (e.g., "2 napja", "1 hete")
 */
export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return '—';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Jövőben';
  if (diffDays === 0) return 'Ma';
  if (diffDays === 1) return 'Tegnap';
  if (diffDays < 7) return `${diffDays} napja`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 hete' : `${weeks} hete`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 hónapja' : `${months} hónapja`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 éve' : `${years} éve`;
}
