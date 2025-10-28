'use client';

import { t } from '@/copy';

type ManageCookiesButtonProps = {
  label?: string;
};

export function ManageCookiesButton({
  label = t('app.footer.manageCookies'),
}: ManageCookiesButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground transition hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={label}
      title={label}
      onClick={() => {
        window.dispatchEvent(new Event('consent:openPreferences'));
      }}
    >
      <span aria-hidden className="text-lg">🍪</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
