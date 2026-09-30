// Storefront pricing is quoted in whole dollars — no cents anywhere in the
// catalog — so the formatter drops the fraction digits rather than printing
// a trailing ".00" on every price.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** `cents` is the unit prices are stored in — see `products.price_cents`. */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

// Order dates read in the shop's own voice — "12 September 2026", not "9/12/26"
// — and pinned to UTC because these render on the server: a date formatted in
// whatever timezone the machine happens to be in would move between deploys, and
// an order placed late in the evening would land on the wrong day.
const date = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: Date): string {
  return date.format(value);
}
