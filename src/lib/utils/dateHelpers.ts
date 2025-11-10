/**
 * Compute the first day of the current month in YYYY-MM-DD format.
 * This helper is used to determine the billing period for usage counters.
 *
 * This is a pure utility function that can be safely used in both client
 * and server components.
 */
export function currentMonthStart(): { date: Date; iso: string } {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const iso = date.toISOString().slice(0, 10);
  return { date, iso };
}

