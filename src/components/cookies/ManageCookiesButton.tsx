'use client';

export function ManageCookiesButton({ label }: { label: string }) {
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
