// Single low-stock threshold for the whole storefront — anything at or below
// this reads as "only a few left" rather than a comfortable in-stock state.
const LOW_STOCK_THRESHOLD = 3;

function describe(stock: number): { label: string; tone: string } {
  if (stock <= 0) {
    return { label: "Out of stock", tone: "text-stone" };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: `Only ${stock} left`, tone: "text-accent" };
  }
  return { label: "In stock", tone: "text-success" };
}

export function StockStatus({ stock }: { stock: number }) {
  const { label, tone } = describe(stock);

  return (
    <p className={`label-caps flex items-center gap-2 ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </p>
  );
}
