"use client";

// The cart, in the browser: a module-level store read through
// `useSyncExternalStore`, and the only place in the app that writes
// `document.cookie`.
//
// Not a React context provider in the root layout. The header is the only shared
// consumer, and the layout is a Server Component shared by every route — wrapping
// all of `{children}` in a client boundary for something three islands need would
// put a hydration layer under the static catalog pages for nothing. A module store
// reaches those islands directly and leaves `src/app/layout.tsx` untouched.
//
// It lives in a cookie rather than in state alone so it survives a reload and the
// round trip through sign-in. See `src/lib/cart.ts` for the format, the limits, and
// why the cookie is not `httpOnly`.

import { useSyncExternalStore } from "react";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  cartItemCount,
  cartLineQuantity,
  parseCartCookie,
  removeCartLine,
  serializeCartCookie,
  setCartLineQuantity,
  upsertCartLine,
  type CartLine,
} from "@/lib/cart";

/**
 * `unknown` is the bag before the cookie has been read. It exists so the server
 * render and the hydration render can agree: the server has no `document` and
 * returns this, and so does the first client render — no mismatch, and no
 * `useState`/`useEffect` mounted flag needed.
 */
type CartSnapshot = { status: "unknown" } | { status: "ready"; lines: CartLine[] };

/**
 * A module constant, not a fresh object per call. `getSnapshot` has to return a
 * cached reference or React re-renders forever ("The result of getSnapshot should
 * be cached").
 */
const UNKNOWN: CartSnapshot = { status: "unknown" };

let snapshot: CartSnapshot = UNKNOWN;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Nothing is encoded on the way in, so nothing is decoded on the way out. */
function readCookieValue(): string | undefined {
  const prefix = `${CART_COOKIE}=`;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));

  return entry?.slice(prefix.length);
}

/**
 * The first read is deferred to the first subscriber, i.e. to an effect, i.e. to
 * the browser: nothing here may touch `document` during a server render, where it
 * does not exist.
 */
function ensureReady(): { status: "ready"; lines: CartLine[] } {
  if (snapshot.status === "unknown") {
    snapshot = { status: "ready", lines: parseCartCookie(readCookieValue()) };
  }

  return snapshot;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (snapshot.status === "unknown") {
    ensureReady();
    emit();
  }

  return () => {
    listeners.delete(listener);
  };
}

/**
 * The cached snapshot, and nothing else. This must never read `document.cookie` and
 * must never build a fresh object: reading the cookie here would make the hydration
 * render disagree with the server HTML, and a new object every call would re-render
 * on a loop.
 */
function getSnapshot(): CartSnapshot {
  return snapshot;
}

function getServerSnapshot(): CartSnapshot {
  return UNKNOWN;
}

/**
 * The one write. An empty bag writes `max-age=0` instead of an empty value — a bag
 * with nothing in it has no cookie at all, which is one fewer thing to explain in a
 * request log.
 */
function commit(next: CartLine[]): void {
  const value = serializeCartCookie(next);
  const secure = location.protocol === "https:" ? "; secure" : "";

  document.cookie =
    `${CART_COOKIE}=${value}; path=/; ` +
    `max-age=${value ? CART_COOKIE_MAX_AGE : 0}; samesite=lax${secure}`;

  snapshot = { status: "ready", lines: next };
  emit();
}

/**
 * Adds to a line, or creates it. `maxQuantity` is the room the caller knows about —
 * stock, or stock minus what the bag already holds — so clamping here means the
 * cookie is never written with a quantity above the stock the page was rendered
 * from. The server clamps again on read: this is the courtesy, that is the truth.
 */
export function addItem(
  productId: string,
  quantity: number,
  maxQuantity: number,
): void {
  if (quantity < 1 || maxQuantity < 1) return;

  commit(upsertCartLine(ensureReady().lines, productId, quantity, maxQuantity));
}

export function setQuantity(
  productId: string,
  quantity: number,
  maxQuantity: number,
): void {
  commit(
    setCartLineQuantity(ensureReady().lines, productId, quantity, maxQuantity),
  );
}

export function removeItem(productId: string): void {
  commit(removeCartLine(ensureReady().lines, productId));
}

/**
 * The whole bag, gone. Only the confirmation page calls this, and only once the
 * server has said the order is paid — the pieces now belong to an order, and the
 * cookie holding them would offer to sell them a second time.
 */
export function clearCart(): void {
  commit([]);
}

/**
 * The one automatic write-back, and it only ever applies the server's answer.
 * `/cart` has already dropped pieces that no longer exist and clamped every quantity
 * to live stock; this makes the cookie agree, so the header stops disagreeing with
 * the page beneath it. The comparison is string equality, so it is a no-op when the
 * two already match — which is also why it cannot loop.
 */
export function reconcileCart(authoritative: string): void {
  if (serializeCartCookie(ensureReady().lines) === authoritative) return;

  commit(parseCartCookie(authoritative));
}

/** The bag's size, or `null` while the client has not read the cookie yet. */
export function useCartCount(): number | null {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return value.status === "ready" ? cartItemCount(value.lines) : null;
}

/** How many of one piece the bag holds — `0` while the count is still unknown. */
export function useCartQuantity(productId: string): number {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return value.status === "ready" ? cartLineQuantity(value.lines, productId) : 0;
}
