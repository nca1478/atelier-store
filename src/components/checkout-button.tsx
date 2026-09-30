"use client";

import { useActionState } from "react";
import { startCheckout, type CheckoutState } from "@/app/checkout/actions";

/** `null` is the resting state — no error to show. */
const INITIAL: CheckoutState = null;

/**
 * The bag's checkout control, and the only way into the payment flow.
 *
 * A `<form>` around `startCheckout` rather than an `onClick`, so the button is a
 * real submit: it survives JavaScript being unavailable, and there is no handler
 * that could be made to post a price. The action takes no input from the browser —
 * it re-reads the bag and the catalog on the server — so there is nothing here for
 * a client to tamper with.
 *
 * `useActionState` is what turns the action's return value into the sentence
 * beneath the button: a piece selling out between render and click has to say so,
 * rather than looking like a dead control.
 */
export function CheckoutButton() {
  const [state, formAction, pending] = useActionState(startCheckout, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Taking you to checkout…" : "Checkout"}
      </button>

      {state?.error && (
        <p className="text-sm text-ink-soft" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
