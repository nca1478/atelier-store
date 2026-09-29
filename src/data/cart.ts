// The authoritative cart, resolved on the server.
//
// The cookie carries *intent* — which pieces, how many of each. Every number this
// module returns (the price, the line total, the subtotal, and the quantity itself)
// is decided here, from the database. That is why `/cart` is a Server Component and
// why no price is ever computed in the browser. Same rule as `src/data/products.ts`:
// components never see the cookie raw.

import { cookies } from "next/headers";
import { getProductsByIds, type Product } from "@/data/products";
import {
  CART_COOKIE,
  parseCartCookie,
  serializeCartCookie,
  type CartLine,
} from "@/lib/cart";

/**
 * `unavailable` covers both a piece that left the catalog and one that sold out;
 * the UI tells them apart by `product === null`. The enum names the line's problem
 * — it cannot be bought — and the *reason* is a field lookup, not a second state.
 */
export type CartIssue = "unavailable" | "reduced";

export type CartLineView = {
  productId: string;
  /** `null` when the piece is no longer in the catalog. */
  product: Product | null;
  /** What the cookie asked for. */
  requestedQuantity: number;
  /** Clamped to live stock — `0` when the piece cannot be bought at all. */
  quantity: number;
  lineTotalCents: number;
  issue: CartIssue | null;
};

export type CartView = {
  /** Cookie order, unavailable lines included. */
  lines: CartLineView[];
  /** Sum of `quantity` across the available lines — the bag's real size. */
  itemCount: number;
  subtotalCents: number;
  hasIssues: boolean;
};

export async function getCart(): Promise<CartView> {
  const store = await cookies();
  const stored: CartLine[] = parseCartCookie(store.get(CART_COOKIE)?.value);

  const products = await getProductsByIds(stored.map((line) => line.productId));
  const byId = new Map(products.map((product) => [product.id, product]));

  let subtotalCents = 0;
  let itemCount = 0;
  let hasIssues = false;

  const lines = stored.map((line): CartLineView => {
    const product = byId.get(line.productId) ?? null;
    const stock = product?.stock ?? 0;

    // The clamp that matters: it survives a stale page, a hand-edited cookie, and
    // stock changed in the database between renders. `stock` is `CHECK (>= 0)` in
    // the schema, and the requested quantity is capped at 99 by the parser.
    const quantity = Math.max(0, Math.min(line.quantity, stock));
    const lineTotalCents = product ? product.priceCents * quantity : 0;

    const issue: CartIssue | null =
      !product || stock <= 0
        ? "unavailable"
        : line.quantity > stock
          ? "reduced"
          : null;

    if (issue) hasIssues = true;
    subtotalCents += lineTotalCents;
    itemCount += quantity;

    return {
      productId: line.productId,
      product,
      requestedQuantity: line.quantity,
      quantity,
      lineTotalCents,
      issue,
    };
  });

  return { lines, itemCount, subtotalCents, hasIssues };
}

/**
 * The server's answer, re-serialized — what `CartReconciler` writes back to the
 * cookie. Unavailable lines drop out (they contribute no quantity), which is how a
 * deleted or sold-out piece leaves the cookie.
 */
export function authoritativeCartCookie(cart: CartView): string {
  return serializeCartCookie(
    cart.lines
      .filter((line) => line.quantity > 0)
      .map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
  );
}
