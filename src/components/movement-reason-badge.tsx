import type { InventoryMovementReason } from "@/db/schema";

/**
 * Why one row of stock moved, in a person's words rather than the ledger's. The
 * sibling of `order-status-badge.tsx` and `stock-status.tsx`: a dot, a
 * micro-label, and a tone that carries the meaning for anyone who cannot see the
 * color.
 *
 * A `switch` over the union rather than a lookup table, so a reason added to
 * `inventoryMovementReasonValues` is a compile error here instead of a silently
 * blank label — the same posture `audienceFilter` takes toward a new audience.
 */
function describe(reason: InventoryMovementReason): {
  label: string;
  tone: string;
} {
  switch (reason) {
    case "reservation":
      return { label: "Sold", tone: "text-accent" };
    case "release":
      return { label: "Returned", tone: "text-success" };
    case "adjustment":
      return { label: "Adjusted", tone: "text-ink" };
  }
}

export function MovementReasonBadge({
  reason,
}: {
  reason: InventoryMovementReason;
}) {
  const { label, tone } = describe(reason);

  return (
    <p className={`label-caps flex items-center gap-2 ${tone}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </p>
  );
}
