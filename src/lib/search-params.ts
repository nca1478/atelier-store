/**
 * A query param reaches a page as `string | string[]`: Next hands over every
 * repeat of `?q=a&q=b` rather than the first one. No route here reads more than
 * one value, so the collapse lives in a single function instead of each page
 * deciding for itself what a repeated param means.
 */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
