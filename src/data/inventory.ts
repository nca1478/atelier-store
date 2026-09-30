// The stock adjustments an administrator makes by hand, and the read of the
// ledger those adjustments share with the checkout.
//
// The rule from the rest of `src/data/` holds here: the database is the
// authority. `products.stock` is still the number a shopper is sold against —
// this module moves that number and writes the *record* beside it, and the
// record is never the source of truth. `seed.ts` writes stock without a
// movement, so a ledger summed to rebuild the column would be wrong the first
// time it ran. Never do that.
//
// Server-only, and caller-authenticated: it reads no session of its own. The
// Server Action above it has already run `requireAdmin()` and passes the actor's
// id, which keeps the authorization decision in one place.

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventoryMovements, products, users } from "@/db/schema";
import { isUuid } from "@/lib/cart";

/**
 * The bound above which a hand-typed number is a typo rather than an intention.
 * A correction to a stock count is a handful of pieces; ten thousand is a slip
 * of the keyboard, and letting it through would be a `stock_after` nobody can
 * explain afterwards.
 */
export const MAX_ADJUSTMENT = 100_000;

/**
 * Digits, optionally signed — allowlist and fallback, the same shape as
 * `QUANTITY_PATTERN` in `src/lib/cart.ts`. A pattern rather than `Number`:
 * `Number("3.7")` is 3.7, which is not a stock; `Number(" 2 ")` is 2, which is
 * not what was typed; and `"1e3"` is 1000 to `Number` and nonsense to a reader.
 */
const DELTA_PATTERN = /^-?\d{1,6}$/;

export type AdjustStockResult =
  | { ok: true; stock: number }
  | { ok: false; reason: "invalid-delta" }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "insufficient-stock"; stock: number };

/**
 * A form field into a delta, or `null` when it is not one. The input's
 * `type="number"` / `min` / `max` attributes are browser comfort and are not
 * consulted; this runs on whatever actually arrived.
 */
export function parseStockDelta(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !DELTA_PATTERN.test(value)) return null;

  const delta = Number(value);

  if (delta === 0 || Math.abs(delta) > MAX_ADJUSTMENT) return null;

  return delta;
}

/**
 * Moves one piece's stock by `delta`, and records who did it and what the stock
 * became, in the same transaction.
 *
 * The `stock + delta >= 0` guard is the real validation: it is what keeps
 * `products_stock_check` from ever firing, so a refusal is a value this returns
 * rather than a `23514` the caller would have to turn into a 500. The read that
 * follows a refused update only exists to tell "no such piece" apart from "that
 * would leave it negative", so the page can say which.
 *
 * The movement is written *after* the update and behind its guard, the same
 * order `orders.ts` uses: an update that changed no rows writes no ledger row,
 * so the ledger can never disagree with the column.
 */
export async function adjustProductStock({
  productId,
  delta,
  actorUserId,
}: {
  productId: string;
  delta: number;
  actorUserId: string;
}): Promise<AdjustStockResult> {
  // The same paranoia `getProductsByIds` applies: a malformed uuid reaching
  // `where id = $1` is a `22P02`, i.e. a 500, not an empty result.
  if (!isUuid(productId)) return { ok: false, reason: "not-found" };

  if (
    !Number.isInteger(delta) ||
    delta === 0 ||
    Math.abs(delta) > MAX_ADJUSTMENT
  ) {
    return { ok: false, reason: "invalid-delta" };
  }

  return db.transaction(async (tx): Promise<AdjustStockResult> => {
    const updated = await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${delta}`,
        updatedAt: sql`now()`,
      })
      .where(
        and(eq(products.id, productId), sql`${products.stock} + ${delta} >= 0`),
      )
      .returning({ stock: products.stock });

    if (updated.length === 0) {
      // One guard, two causes. A cheap read tells them apart rather than making
      // the caller guess which sentence to show.
      const [row] = await tx
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!row) return { ok: false, reason: "not-found" };

      return { ok: false, reason: "insufficient-stock", stock: row.stock };
    }

    await tx.insert(inventoryMovements).values({
      productId,
      delta,
      reason: "adjustment",
      // An adjustment has no order behind it, and this is the one movement a
      // human did make.
      orderId: null,
      actorUserId,
      stockAfter: updated[0].stock,
    });

    return { ok: true, stock: updated[0].stock };
  });
}

export type InventoryMovementView = {
  id: string;
  delta: number;
  reason: (typeof inventoryMovements.$inferSelect)["reason"];
  orderId: string | null;
  stockAfter: number;
  createdAt: Date;
  /** Null for a movement the system made on its own. */
  actorEmail: string | null;
};

/**
 * One piece's movements, newest first — the whole point of the ledger, which is
 * to answer "why is the stock 7?" without guessing.
 *
 * The actor is a `leftJoin`, not a second query per row: most movements are
 * automatic and have no actor at all, which is exactly what a left join is for.
 * `id` breaks ties so the order is stable when two movements share a timestamp,
 * the same tie-break the order history uses.
 */
export async function getMovementsForProduct(
  productId: string,
  limit = 50,
): Promise<InventoryMovementView[]> {
  if (!isUuid(productId)) return [];

  return db
    .select({
      id: inventoryMovements.id,
      delta: inventoryMovements.delta,
      reason: inventoryMovements.reason,
      orderId: inventoryMovements.orderId,
      stockAfter: inventoryMovements.stockAfter,
      createdAt: inventoryMovements.createdAt,
      actorEmail: users.email,
    })
    .from(inventoryMovements)
    .leftJoin(users, eq(inventoryMovements.actorUserId, users.id))
    .where(eq(inventoryMovements.productId, productId))
    .orderBy(desc(inventoryMovements.createdAt), desc(inventoryMovements.id))
    .limit(limit);
}
