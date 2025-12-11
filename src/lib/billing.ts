/**
 * Billing utilities for calculating pricing and handling billing intervals
 */

export type BillingInterval = 'monthly' | 'annual';

/**
 * Calculate annual price with discount
 * Typical discount: 10-20% off when paying annually
 *
 * @param monthlyPrice - Monthly price in HUF
 * @param discountPercent - Discount percentage (default: 17%, which is 2 months free)
 * @returns Annual price in HUF
 */
export function calculateAnnualPrice(monthlyPrice: number, discountPercent: number = 17): number {
  const yearlyPrice = monthlyPrice * 12;
  const discount = (yearlyPrice * discountPercent) / 100;
  return Math.round(yearlyPrice - discount);
}

/**
 * Calculate effective monthly price for annual billing
 *
 * @param monthlyPrice - Monthly price in HUF
 * @param discountPercent - Discount percentage
 * @returns Effective monthly price when paying annually
 */
export function calculateEffectiveMonthlyPrice(
  monthlyPrice: number,
  discountPercent: number = 17,
): number {
  const annualPrice = calculateAnnualPrice(monthlyPrice, discountPercent);
  return Math.round(annualPrice / 12);
}

/**
 * Calculate savings when switching to annual billing
 *
 * @param monthlyPrice - Monthly price in HUF
 * @param discountPercent - Discount percentage
 * @returns Total savings per year and percentage saved
 */
export function calculateAnnualSavings(
  monthlyPrice: number,
  discountPercent: number = 17,
): { totalSavings: number; percentageSaved: number; monthsFree: number } {
  const yearlyPrice = monthlyPrice * 12;
  const annualPrice = calculateAnnualPrice(monthlyPrice, discountPercent);
  const totalSavings = yearlyPrice - annualPrice;
  const percentageSaved = discountPercent;
  const monthsFree = Math.round((totalSavings / monthlyPrice) * 10) / 10; // Round to 1 decimal

  return { totalSavings, percentageSaved, monthsFree };
}

/**
 * Format price with thousand separators for Hungarian locale
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price);
}
