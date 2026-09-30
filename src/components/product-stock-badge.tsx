import { describeStock } from "@/components/stock-status";

/**
 * The catalog tile's stock flag, sitting over the image.
 *
 * `StockStatus` is the same fact as a line of text on a page with room for it;
 * this is the grid's version, where a tile has none. Two consequences follow.
 * The chip is an overlay rather than another row of card copy, so a flagged tile
 * keeps the height of its neighbours and the grid does not stagger. And only the
 * exception is drawn: "In stock" is the ordinary state of a shelf, and a shopper
 * scanning a rail is looking for what is left rather than for what is plentiful —
 * three states of micro-copy on every tile would flag nothing.
 *
 * Positioned inside the card's media link, which is already `position: relative`;
 * a later sibling paints over the `fill` image without needing a `z-index`.
 */
export function ProductStockBadge({ stock }: { stock: number }) {
  const { state, label, tone } = describeStock(stock);

  if (state === "in") return null;

  return (
    <span
      className={`label-caps absolute left-3 top-3 border bg-paper px-2 py-1 ${tone} ${
        state === "out" ? "border-line" : "border-accent"
      }`}
    >
      {label}
    </span>
  );
}
