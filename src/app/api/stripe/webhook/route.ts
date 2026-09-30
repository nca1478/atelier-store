import { headers } from "next/headers";
import { applyStripeEvent } from "@/data/orders";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    console.error("Rejected a Stripe webhook with an invalid signature", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await applyStripeEvent(event);
  } catch (error) {
    console.error(`Failed to apply Stripe event ${event.id}`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
