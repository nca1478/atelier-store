// Single low-stock threshold for the whole storefront — anything at or below
// this reads as "only a few left" rather than a comfortable in-stock state.
const LOW_STOCK_THRESHOLD = 3;

/**
 * Which of the three states a count is in. A `state` beside the label rather
 * than a sentence a caller has to pattern-match: the tile needs to ask "is this
 * sold out?" to dim its image, and the answer has to be the same one the label
 * was built from.
 */
export type StockState = "out" | "low" | "in";

/**
 * The one place a stock count becomes words. `StockStatus` renders it as a line
 * and `ProductStockBadge` as a chip over a tile — two presentations of one fact,
 * so they read the count through this rather than each deciding for itself what
 * "low" means.
 */
export function describeStock(stock: number): {
  state: StockState;
  label: string;
  tone: string;
} {
  if (stock <= 0) {
    return { state: "out", label: "Out of stock", tone: "text-stone" };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { state: "low", label: `Only ${stock} left`, tone: "text-accent" };
  }
  return { state: "in", label: "In stock", tone: "text-success" };
}

export function StockStatus({ stock }: { stock: number }) {
  const { label, tone } = describeStock(stock);

  return (
    <p className={`label-caps flex items-center gap-2 ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </p>
  );
}
