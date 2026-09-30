"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart-store";

/**
 * Empties the bag once the order is paid, and renders nothing.
 *
 * The server decides when this mounts: the confirmation page renders it only for a
 * `paid` order, so the bag cannot be emptied by landing on the page early or by
 * pasting a session id. It is a client island because the cart lives in a cookie
 * this module is the only writer of — the same reason `cart-reconciler.tsx` is one.
 */
export function CartClearOnSuccess() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
