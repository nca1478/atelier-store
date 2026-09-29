"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeItem, setQuantity } from "@/lib/cart-store";

/**
 * A bag row's quantity control and its remove button.
 *
 * `quantity` is the number the *server* clamped and handed down, not a local copy:
 * the row and its subtotal must never disagree, and both only ever re-render from a
 * server render. So a change writes the cookie and then asks for the page again.
 *
 * That is why this uses `useTransition` rather than the `useState` pending flag
 * `src/components/auth-form.tsx` uses — `router.refresh()` returns `void`, so a flag
 * cleared after the call would un-stick the controls before the new numbers land.
 * A row that cannot be bought at all (sold out) gets the remove button alone.
 */
export function CartLineControls({
  productId,
  quantity,
  stock,
}: {
  productId: string;
  quantity: number;
  stock: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: number) {
    if (next < 1) {
      removeItem(productId);
    } else {
      setQuantity(productId, next, stock);
    }

    startTransition(() => router.refresh());
  }

  if (stock <= 0) {
    return (
      <button
        type="button"
        className="link-nav"
        onClick={() => change(0)}
        disabled={pending}
      >
        Remove
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${pending ? "opacity-50" : ""}`}>
      <div className="stepper">
        <button
          type="button"
          className="stepper-button"
          aria-label="Reduce quantity"
          onClick={() => change(quantity - 1)}
          disabled={pending}
        >
          −
        </button>
        <span className="stepper-value" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          className="stepper-button"
          aria-label="Increase quantity"
          onClick={() => change(quantity + 1)}
          disabled={pending || quantity >= stock}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className="link-nav"
        onClick={() => change(0)}
        disabled={pending}
      >
        Remove
      </button>
    </div>
  );
}
