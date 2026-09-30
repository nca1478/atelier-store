// Stripe's callback. The only writer of a payment outcome in the app.
//
// A Route Handler rather than a Server Action: this is an external POST from
// Stripe, and Server Actions only accept Next's own encrypted action protocol.
//
// The whole job here is to authenticate the caller and hand the event to
// `src/data/orders.ts`. Signature verification is real authorization — anyone who
// can reach this URL can otherwise mark their own order paid.

import { headers } from "next/headers";
import { applyStripeEvent } from "@/data/orders";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

// `constructEvent` verifies the signature with Node's crypto, so this route has to
// stay on the Node.js runtime. Pinned rather than assumed.
export const runtime = "nodejs";

// No `dynamic`/`revalidate` needed: `POST` handlers are never cached.

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // The *unparsed* body. Signature verification signs the exact bytes Stripe sent,
  // so reading it as JSON first — or letting anything else consume the stream —
  // makes every signature fail.
  const body = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    // An unverifiable event is not an event. Log it, act on nothing.
    console.error("Rejected a Stripe webhook with an invalid signature", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await applyStripeEvent(event);
  } catch (error) {
    // Answering 500 is deliberate: the handler's transaction rolled back with the
    // idempotency row, so Stripe's retry will genuinely replay this event rather
    // than being deduplicated against a half-finished attempt.
    console.error(`Failed to apply Stripe event ${event.id}`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
