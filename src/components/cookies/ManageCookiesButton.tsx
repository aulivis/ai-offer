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
      className="font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
      onClick={() => {
        window.dispatchEvent(new Event('consent:openPreferences'));
      }}
    >
      {label}
    </button>
  );
}
