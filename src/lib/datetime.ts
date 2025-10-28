function resolveLocale(locale?: string | null): string {
  if (typeof locale === 'string' && locale.trim().length > 0) {
    return locale;
  }
  return 'hu';
}

export function formatOfferIssueDate(date: Date, locale?: string | null): string {
  const safeLocale = resolveLocale(locale);
  try {
    return new Intl.DateTimeFormat(safeLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
