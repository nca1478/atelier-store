"use server";

// Starting a checkout. The one place a bag becomes an order.
//
// Two rules hold everything here together. The request is never trusted: the
// action re-derives the bag from the database and asks for nothing but "please
// checkout". And Stripe is never asked what something costs: the line items are
// built from `order_items`, which was written from `products` a few lines earlier.

import { redirect } from "next/navigation";
import { getSession } from "@/auth/session";
import { getCart } from "@/data/cart";
import {
  attachCheckoutSession,
  cancelOrder,
  createOrderForCart,
  type CheckoutLine,
} from "@/data/orders";
import { checkoutExpiresAt, SHIPPING_COUNTRIES, appUrl, getStripe } from "@/lib/stripe";

/** `null` is the resting state; anything else is a sentence for the shopper. */
export type CheckoutState = { error: string } | null;

/**
 * Builds the hosted Checkout session for an order that has already been reserved.
 *
 * `price_data` rather than stored `Price` objects: the catalog lives in Postgres
 * and this keeps it the only catalog, instead of a second one in Stripe to keep in
 * step. Stripe renders our prices; it does not hold them.
 */
async function createCheckoutSession(
  orderId: string,
  lines: CheckoutLine[],
): Promise<{ id: string; url: string; expiresAt: Date }> {
  const stripe = getStripe();
  const expiresAt = checkoutExpiresAt();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Both carry the order id, and the webhook reads it back off either. Keying on
    // the order rather than the session is what lets an early event — one that
    // arrives before we have stored the session id — still find its order.
    client_reference_id: orderId,
    metadata: { orderId },
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    line_items: lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "usd",
        unit_amount: line.unitPriceCents,
        product_data: {
          name: line.productName,
          ...(line.imageUrl ? { images: [line.imageUrl] } : {}),
          metadata: { productId: line.productId },
        },
      },
    })),
    shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
    success_url: appUrl("/checkout/success?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: appUrl("/cart?checkout=cancelled"),
  });

  if (!session.url) {
    throw new Error(`Stripe returned a session without a URL: ${session.id}`);
  }

  return { id: session.id, url: session.url, expiresAt };
}

/**
 * Bound to the bag's checkout form. Signed-in shoppers only, and the guard is here
 * rather than only in the page — a Server Action is a public endpoint whatever the
 * page around it rendered.
 *
 * It takes no arguments on purpose. React hands a form action
 * `(previousState, formData)`, and accepting them would imply this function reads
 * them; it reads the bag from the cookie and the catalog instead, and there is
 * nothing a form could send that would be believed.
 */
export async function startCheckout(): Promise<CheckoutState> {
  const session = await getSession();

  if (!session) {
    // Outside the try/catch below: `redirect` works by throwing, and a catch would
    // swallow it.
    redirect(`/sign-in?next=${encodeURIComponent("/cart")}`);
  }

  // The cookie asked for pieces and quantities. Every number from here on is the
  // database's, and nothing the browser said about money survives this line.
  const cart = await getCart();

  if (cart.itemCount === 0) {
    return { error: "Your bag is empty." };
  }

  if (cart.hasIssues) {
    // Something shifted between the page and the click — a piece sold out, or the
    // bag was edited in another tab. Reconciling is the page's job and it will have
    // the right numbers on the next render.
    return {
      error:
        "Stock changed while your bag was open. Reload the bag to see what is still available.",
    };
  }

  const reserved = await createOrderForCart({
    userId: session.user.id,
    email: session.user.email,
    lines: cart.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    })),
  });

  if (!reserved.ok) {
    if (reserved.reason === "out-of-stock") {
      return {
        error: `${reserved.productName} sold out before your checkout started — nothing has been charged.`,
      };
    }

    return { error: "Your bag is empty." };
  }

  let checkoutUrl: string;

  try {
    const created = await createCheckoutSession(reserved.order.id, reserved.lines);

    await attachCheckoutSession(reserved.order.id, created.id, created.expiresAt);
    checkoutUrl = created.url;
  } catch (error) {
    // The reservation is already in the database and no session exists to ever
    // expire it, so nothing else would give the stock back. A hold must not
    // outlive the call that failed.
    await cancelOrder(reserved.order.id);
    console.error("Failed to start Stripe checkout", error);

    return {
      error: "We couldn't start checkout just now. Nothing has been charged — please try again.",
    };
  }

  redirect(checkoutUrl);
}
