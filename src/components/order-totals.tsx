import { formatPrice } from "@/lib/format";

/**
 * What an order came to. Both figures are the row's own columns rather than a
 * sum of the lines above them: the totals were written once, inside the
 * reservation transaction, and re-adding them here would be a second opinion
 * about money that is already settled.
 *
 * Shipping is a statement rather than a price because nothing is charged for it
 * yet — the day a rate exists it becomes a third row and `total` parts company
 * with `subtotal`.
 */
export function OrderTotals({
  subtotalCents,
  totalCents,
}: {
  subtotalCents: number;
  totalCents: number;
}) {
  return (
    <dl className="flex flex-col">
      <div className="divider flex items-baseline justify-between gap-6 py-4">
        <dt className="label-caps text-stone">Subtotal</dt>
        <dd className="text-lg tabular-nums">{formatPrice(subtotalCents)}</dd>
      </div>
      <div className="divider flex items-baseline justify-between gap-6 py-4">
        <dt className="label-caps text-stone">Shipping</dt>
        <dd className="text-sm text-ink-soft">Included</dd>
      </div>
      <div className="flex items-baseline justify-between gap-6 py-4">
        <dt className="label-caps text-stone">Total</dt>
        <dd className="text-lg tabular-nums">{formatPrice(totalCents)}</dd>
      </div>
    </dl>
  );
}
