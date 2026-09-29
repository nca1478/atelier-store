"use client";

import { useEffect } from "react";
import { reconcileCart } from "@/lib/cart-store";

/**
 * Keeps the cart cookie honest against the server's answer, and renders nothing.
 *
 * `/cart` has already dropped pieces that left the catalog and clamped every
 * quantity to live stock; this writes that answer back, so the header stops
 * disagreeing with the page beneath it. It only ever applies what the server
 * decided — the client never corrects itself.
 *
 * `authoritative` is a string rather than a list on purpose: it is stable across
 * renders, so the effect runs when the answer actually changes, and the store's
 * no-op test is a single `===`.
 */
export function CartReconciler({ authoritative }: { authoritative: string }) {
  useEffect(() => {
    reconcileCart(authoritative);
  }, [authoritative]);

  return null;
}
