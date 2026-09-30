"use server";

// The inventory panel's only write: moving a piece's stock by a delta.
//
// The guard lives here and not only on the page around it, and that is not belt
// and braces. A Server Action is a public POST endpoint, and `src/proxy.ts`
// covers browser navigations only — it never runs for a Server Function. So the
// page's `requireAdmin()` decides what an administrator sees, and this one
// decides what may happen.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth/session";
import { adjustProductStock, parseStockDelta } from "@/data/inventory";

/** `null` is the resting state; anything else is a sentence for the admin. */
export type AdjustStockState = { error: string } | { ok: string } | null;

/**
 * Bound to a row's form. Takes `(previousState, formData)` because that is what
 * `useActionState` hands a form action.
 *
 * Nothing the browser sent is believed: the id is re-checked against a uuid
 * shape inside `adjustProductStock`, the delta against a pattern here, and the
 * database guard has the final word. `reason` is not a form field at all — it is
 * fixed to `adjustment` by the data layer, which is why a forged POST cannot
 * write itself into the ledger as a sale.
 */
export async function adjustStock(
  _previous: AdjustStockState,
  formData: FormData,
): Promise<AdjustStockState> {
  // Answers `null` for a signed in visitor without the role rather than
  // throwing, so the result is checked and not merely awaited. The `redirect`
  // that `requireUser` performs inside it works by throwing, so nothing here may
  // sit inside a try/catch.
  const session = await requireAdmin();

  if (!session) {
    return { error: "Your account does not have the admin role." };
  }

  const productId = formData.get("productId");
  const delta = parseStockDelta(formData.get("delta"));

  if (typeof productId !== "string" || delta === null) {
    return { error: "Enter a whole number of pieces to add or remove." };
  }

  const result = await adjustProductStock({
    productId,
    delta,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    switch (result.reason) {
      case "insufficient-stock":
        return {
          error: `Only ${result.stock} on hand, so ${Math.abs(delta)} cannot come off the shelf.`,
        };
      case "not-found":
        return { error: "That piece is no longer in the catalog." };
      case "invalid-delta":
        return { error: "Enter a whole number of pieces to add or remove." };
    }
  }

  // `/`, New Arrivals and the piece's own page are prerendered with
  // `revalidate = 60`, so without this an adjustment would not show on the
  // storefront for up to a minute. The route pattern rather than the slug keeps
  // the value from depending on anything the form sent, and at this catalog size
  // refreshing every product page is cheap.
  revalidatePath("/");
  revalidatePath("/new-arrivals");
  revalidatePath("/products/[slug]", "page");

  return { ok: `Stock is now ${result.stock}.` };
}
