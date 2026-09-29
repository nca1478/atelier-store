// Storefront pricing is quoted in whole dollars — no cents anywhere in the
// catalog — so the formatter drops the fraction digits rather than printing
// a trailing ".00" on every price.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return currency.format(value);
}
