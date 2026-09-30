// The Stripe client, and the handful of constants the checkout flow is written
// against.
//
// Server-only: `stripe` is the secret-key SDK, and nothing here may reach the
// browser bundle. The storefront needs no Stripe.js at all — checkout is a hosted
// page we redirect to, so there is no publishable key, no client-side script and
// no card data anywhere near this app. That is the whole reason the redirect flow
// was chosen over Elements.

import Stripe from "stripe";

/**
 * How long a checkout holds a piece. Stripe's minimum `expires_at` is 30 minutes
 * from creation, and this is exactly it: the catalog is small and low-stock, so a
 * hold that outlives a shopper's attention is worse than one they have to restart.
 *
 * Two things key off this number: the session's `expires_at`, and the order's
 * `expiresAt` — they are set from the same value so the row and the session agree
 * about when the hold lapses.
 */
export const CHECKOUT_HOLD_SECONDS = 30 * 60;

/**
 * Slack on top of the hold when computing `expires_at`.
 *
 * Stripe rejects an `expires_at` less than 30 minutes from *its* clock at the
 * moment the request lands — and the hold's start is stamped a few hundred
 * milliseconds earlier, while we were writing the order. Without this the very
 * first checkout of a slow request can be refused as too short.
 */
const EXPIRY_SLACK_SECONDS = 60;

/** When a checkout started now should lapse. One value feeding both Stripe and `orders.expires_at`. */
export function checkoutExpiresAt(now: number = Date.now()): Date {
  return new Date(now + (CHECKOUT_HOLD_SECONDS + EXPIRY_SLACK_SECONDS) * 1000);
}

/**
 * Where Checkout will accept a delivery address. Stripe requires an explicit
 * allowlist, so widening (or narrowing) shipping is this one line rather than a
 * dashboard setting nobody can find later.
 */
export const SHIPPING_COUNTRIES = [
  "US", "CA", "MX",
  "GB", "IE", "FR", "DE", "ES", "IT", "PT", "NL", "BE", "AT",
  "SE", "DK", "NO", "FI",
  "AU", "NZ", "JP",
] as const;

/**
 * Built on first use rather than at module load, for the same reason
 * `src/db/connection.ts` defers its client: `next build` evaluates every route
 * module, so importing this file must not require a key to exist.
 */
let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. See .env.example for the expected shape.",
      );
    }
    client = new Stripe(key);
  }
  return client;
}

/**
 * The endpoint secret from `stripe listen` (or the Dashboard webhook), read at
 * call time so a rotated secret does not need a rebuild.
 */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the whsec_ it prints.",
    );
  }
  return secret;
}

/**
 * An absolute URL back into this app. Stripe redirects the browser, so a relative
 * path is not enough, and the origin has to be the deployed one rather than
 * whatever host the request happened to arrive on.
 *
 * `BETTER_AUTH_URL` is already the app's canonical origin, so there is no second
 * variable to keep in step. The localhost fallback matches `.env.example`.
 */
export function appUrl(path: string): string {
  const base = (
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
