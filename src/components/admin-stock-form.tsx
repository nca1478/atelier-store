"use client";

import { useActionState } from "react";
import {
  adjustStock,
  type AdjustStockState,
} from "@/app/admin/products/actions";

/** `null` is the resting state — nothing to say yet. */
const INITIAL: AdjustStockState = null;

/**
 * One piece's stock control.
 *
 * A `<form>` around the action rather than an `onClick`, so it is a real submit
 * that still works with JavaScript unavailable, and `useActionState` is what
 * gives a refusal somewhere to appear without leaving the page — the same shape
 * `checkout-button.tsx` takes, for the same reason: a change that did not happen
 * has to say so rather than looking like a dead button.
 *
 * The product id travels in a hidden field, and is still not trusted: the action
 * re-checks it as a uuid and the database guard decides in the end.
 */
export function AdminStockForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [state, formAction, pending] = useActionState(adjustStock, INITIAL);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="productId" value={productId} />

      <input
        className="input w-28"
        id={`delta-${productId}`}
        name="delta"
        type="number"
        step="1"
        required
        placeholder="5 or -2"
        aria-label={`Adjust stock for ${productName}`}
      />

      <button className="btn btn-secondary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Apply"}
      </button>

      {state && "error" in state && (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      {state && "ok" in state && (
        <p className="text-sm text-success" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
