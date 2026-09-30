import type { OrderStatus } from "@/db/schema";

/**
 * One order's payment state, in the shopper's words rather than the database's.
 * The sibling of `stock-status.tsx`: a dot, a micro-label, and a tone that
 * carries the meaning for anyone who cannot see the color.
 *
 * A `switch` over the union rather than a lookup table, so a status added to
 * `orderStatusValues` is a compile error here instead of a silently blank label
 * — the same posture `audienceFilter` takes toward a new audience.
 */
function describe(status: OrderStatus): { label: string; tone: string } {
  switch (status) {
    case "paid":
      return { label: "Paid", tone: "text-success" };
    case "pending":
      // The ordinary state of a checkout in flight: the reservation exists, the
      // webhook has not confirmed the money yet.
      return { label: "Awaiting payment", tone: "text-accent" };
    case "failed":
      return { label: "Payment failed", tone: "text-error" };
    case "expired":
      return { label: "Expired", tone: "text-stone" };
    case "cancelled":
      return { label: "Cancelled", tone: "text-stone" };
  }
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = describe(status);

  return (
    <p className={`label-caps flex items-center gap-2 ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </p>
  );
}
