"use client";

import { useState } from "react";
import Link from "next/link";
import { addItem, useCartQuantity } from "@/lib/cart-store";

/**
 * The product detail page's bag control — the button that used to sit here inert,
 * now with a quantity picker.
 *
 * The picker is local state, not the store's: it is a number the visitor is
 * choosing, not one the bag holds yet. `room` is stock minus what the bag already
 * holds, so the picker can never offer a quantity that would push the line past
 * stock — the visitor is prevented rather than corrected afterwards.
 */
export function AddToBag({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const inBag = useCartQuantity(productId);

  if (stock <= 0) {
    return (
      <button type="button" className="btn btn-primary w-full sm:w-auto" disabled>
        Sold out
      </button>
    );
  }

  const room = Math.max(0, stock - inBag);
  const full = room === 0;

  /** Any change to the picker invalidates the confirmation — no timers, so it can
   *  never go stale. */
  function step(next: number) {
    setQuantity(Math.max(1, Math.min(room, next)));
    setAdded(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="stepper">
          <button
            type="button"
            className="stepper-button"
            aria-label="Reduce quantity"
            onClick={() => step(quantity - 1)}
            disabled={quantity <= 1}
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
            onClick={() => step(quantity + 1)}
            disabled={quantity >= room}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          disabled={full}
          onClick={() => {
            // Clamped against the room that is left rather than the picker's number:
            // the bag may have grown since this page was rendered.
            addItem(productId, Math.min(quantity, room), stock);
            setAdded(true);
          }}
        >
          Add to bag
        </button>
      </div>

      {full && (
        <p className="text-sm text-accent">
          Your bag already has all {stock} we have.
        </p>
      )}

      {!full && !added && room < stock && (
        <p className="text-sm text-accent">Only {room} more available.</p>
      )}

      {added && (
        <p className="text-sm text-success">
          Added to your bag —{" "}
          <Link className="link" href="/cart">
            view bag
          </Link>
          .
        </p>
      )}
    </div>
  );
}
