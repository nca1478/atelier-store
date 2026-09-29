"use client";

import { addItem, useCartQuantity } from "@/lib/cart-store";

/**
 * The compact add button a product card embeds. The card itself stays a Server
 * Component — this is the only client boundary in it, so the grids that reuse
 * ProductCard (home, /products, /search, the related rail) ship one small island per
 * tile rather than a hydrated card.
 *
 * A card has no room for a quantity picker, so it adds one at a time and reports how
 * many are already in the bag instead.
 */
export function CardAddButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const inBag = useCartQuantity(productId);

  if (stock <= 0) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm mt-2 self-start"
        disabled
      >
        Sold out
      </button>
    );
  }

  const full = inBag >= stock;

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm mt-2 self-start"
      disabled={full}
      onClick={() => addItem(productId, 1, stock)}
    >
      {full ? "In bag" : inBag > 0 ? `Add another (${inBag})` : "Add to bag"}
    </button>
  );
}
