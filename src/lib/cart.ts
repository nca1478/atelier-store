// The cart's cookie format and its line operations — pure, and importable from
// both the server and the browser.
//
// This module only knows how to turn the cart cookie into lines and back, so it
// must stay free of React, `document`, `next/headers` and drizzle: it is imported
// by `src/data/cart.ts` (server) and by `src/lib/cart-store.ts` (client), and a
// server-only import here would end up in the browser bundle.
//
// What the cookie holds is *intent*: which pieces, and how many of each. Nothing in
// it is trusted — `src/data/cart.ts` re-derives every price, stock and total from
// the database. The cookie is deliberately readable by JavaScript (not `httpOnly`)
// because the header's bag count has to read it in the browser; see
// `src/components/cart-count-link.tsx` for why that constraint exists. Do not
// "harden" it: an `httpOnly` cart cookie would force a server read in the root
// layout and cost every catalog route its `revalidate = 60`.

/** Namespaced like better-auth's own cookies, so the two cannot collide. */
export const CART_COOKIE = "atelier_cart";

/** 30 days — a guest bag that dies with the tab is a worse storefront. */
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * 20 lines is roughly 800 bytes serialized: a fifth of the ~4 KB per-cookie
 * ceiling. The cookie travels on *every* request, so this cap is what keeps that
 * cost bounded — it is not an arbitrary limit.
 */
export const MAX_CART_LINES = 20;

/**
 * Clamped, not rejected: the cookie must never hold an absurd number even before
 * stock is consulted.
 */
export const MAX_LINE_QUANTITY = 99;

/** Longer than this is refused wholesale, before any parsing. */
export const MAX_COOKIE_LENGTH = 2048;

export type CartLine = { productId: string; quantity: number };

/**
 * `~` separates lines and `.` separates an id from its quantity. Both are legal
 * `cookie-octet`s — RFC 6265 excludes `,`, `;`, `"`, `\` and space, but not these —
 * so the value is never percent-encoded: `document.cookie` round-trips it verbatim
 * and DevTools shows it legibly.
 */
const LINE_SEPARATOR = "~";
const PAIR_SEPARATOR = ".";

/**
 * `products.id` is a uuid, and a client-written cookie is the only untrusted source
 * of one. This check matters at the SQL boundary as much as here: `where id in (…)`
 * with a malformed uuid raises `invalid input syntax for type uuid` (22P02), which
 * would turn a tampered cookie into a 500 on `/cart`.
 */
const PRODUCT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Digits only, 1 to 99. A pattern rather than `Number`: `1e3` passes
 * `Number.isInteger` but is not a quantity anyone typed, and `Number(" 2 ")` is `2`,
 * which is not what the cookie said. Same allowlist-and-fallback shape as
 * `parseProductSort` in `src/data/products.ts`.
 */
const QUANTITY_PATTERN = /^[1-9][0-9]{0,2}$/;

export function isProductId(value: string): boolean {
  return PRODUCT_ID_PATTERN.test(value);
}

/**
 * A cookie value into lines. A missing, corrupt or hostile value is an empty bag,
 * never a thrown error: every rejection below is a `continue`, so one bad line
 * costs that line and not the rest of the cart.
 */
export function parseCartCookie(raw: string | undefined): CartLine[] {
  if (!raw || raw.length > MAX_COOKIE_LENGTH) return [];

  const lines: CartLine[] = [];
  const seen = new Set<string>();

  for (const pair of raw.split(LINE_SEPARATOR)) {
    if (lines.length >= MAX_CART_LINES) break;

    const parts = pair.split(PAIR_SEPARATOR);
    // A well-formed line has exactly two parts, so "id", "id.2.3" and "" are all
    // rejected rather than guessed at.
    if (parts.length !== 2) continue;

    const [productId, quantityText] = parts;
    if (!isProductId(productId)) continue;
    if (seen.has(productId)) continue; // a repeated id is the same line, counted once
    if (!QUANTITY_PATTERN.test(quantityText)) continue;

    seen.add(productId);
    lines.push({ productId, quantity: Number(quantityText) });
  }

  return lines;
}

/** Lines into a cookie value. A line that could not be a line is dropped, not fixed. */
export function serializeCartCookie(lines: CartLine[]): string {
  return lines
    .filter((line) => isProductId(line.productId) && line.quantity > 0)
    .slice(0, MAX_CART_LINES)
    .map(
      (line) =>
        `${line.productId}${PAIR_SEPARATOR}${Math.min(line.quantity, MAX_LINE_QUANTITY)}`,
    )
    .join(LINE_SEPARATOR);
}

export function cartLineQuantity(lines: CartLine[], productId: string): number {
  return lines.find((line) => line.productId === productId)?.quantity ?? 0;
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/**
 * Adds to a line, or creates it, clamping the *result* rather than the increment:
 * adding 3 to a bag that already holds 2 when stock is 4 lands on 4, not 5. A new
 * line is appended, so the cookie's order is the order the visitor built the bag in.
 */
export function upsertCartLine(
  lines: CartLine[],
  productId: string,
  quantity: number,
  maxQuantity: number,
): CartLine[] {
  const cap = Math.min(maxQuantity, MAX_LINE_QUANTITY);
  const existing = cartLineQuantity(lines, productId);
  const next = Math.max(0, Math.min(existing + quantity, cap));

  // Capped to nothing means the piece cannot be bought at all: keep the line out
  // rather than parking a zero-quantity line in the cookie.
  if (next < 1) return removeCartLine(lines, productId);

  return lines.some((line) => line.productId === productId)
    ? lines.map((line) =>
        line.productId === productId ? { ...line, quantity: next } : line,
      )
    : [...lines, { productId, quantity: next }];
}

/**
 * Sets a line's quantity outright. `0` or less removes it, so the bag stepper's `-`
 * at 1 is a removal expressed once rather than a second code path.
 */
export function setCartLineQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
  maxQuantity: number,
): CartLine[] {
  if (quantity < 1) return removeCartLine(lines, productId);

  const next = Math.min(quantity, maxQuantity, MAX_LINE_QUANTITY);

  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: next } : line,
  );
}

export function removeCartLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}
