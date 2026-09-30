// Orders, and the only module in the app that writes an order or moves stock.
//
// Same rule as `src/data/products.ts` and `src/data/cart.ts`: the database is the
// authority and everything else observes it. Two consequences shape this file.
//
// The first is that placing an order *reserves* stock. The catalog is small and
// full of pieces with a handful in stock, so the decrement happens in the same
// transaction that creates the order — before Stripe is ever called — and the
// hold is returned when the session expires. Selling the same coat twice is a
// refund and an apology; refusing to sell it twice is a database constraint.
//
// The second is that Stripe is told about our order, never asked about our
// prices. `order_items` snapshots the name, slug and unit price at reservation
// time, so re-running `seed.ts` cannot rewrite what someone bought.
//
// This module is server-only: it imports the secret-key Stripe client and reads
// no cookie and no header.

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  products,
  stripeEvents,
  type OrderStatus,
  type ShippingAddress,
} from "@/db/schema";
import { isUuid, type CartLine } from "@/lib/cart";
import { CHECKOUT_HOLD_SECONDS, getStripe } from "@/lib/stripe";

/** The one currency the catalog is priced in; `format.ts` hardcodes it too. */
const CURRENCY = "USD";

/** The drizzle transaction handle, without importing the internal type. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type OrderItemView = {
  productId: string;
  productName: string;
  productSlug: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type OrderView = {
  id: string;
  userId: string;
  email: string;
  status: OrderStatus;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
};

export type OrderDetail = OrderView & {
  shippingAddress: ShippingAddress | null;
  items: OrderItemView[];
};

/**
 * What Stripe needs to render one line, taken from the same `FOR UPDATE` read that
 * priced the order. `imageUrl` is here and not in `order_items` because it is
 * presentation only: Stripe shows it, and nothing downstream depends on it.
 */
export type CheckoutLine = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string;
};

/**
 * Raised inside the reservation transaction so drizzle rolls the whole thing back,
 * then caught at the edge and turned into a message. A thrown error is the only way
 * to abandon a transaction, which is exactly what "someone else took it" needs.
 */
class OutOfStockError extends Error {
  constructor(readonly productName: string) {
    super(`Out of stock: ${productName}`);
    this.name = "OutOfStockError";
  }
}

export type ReserveResult =
  | { ok: true; order: OrderView; lines: CheckoutLine[] }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "out-of-stock"; productName: string };

const orderColumns = {
  id: orders.id,
  userId: orders.userId,
  email: orders.email,
  status: orders.status,
  subtotalCents: orders.subtotalCents,
  totalCents: orders.totalCents,
  currency: orders.currency,
  createdAt: orders.createdAt,
  paidAt: orders.paidAt,
};

function holdExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + CHECKOUT_HOLD_SECONDS * 1000);
}

/**
 * Whether the Stripe session behind a hold can still take money.
 *
 * Superseding an old order means returning its stock, and that is only safe once
 * Stripe agrees the session is dead — otherwise a shopper with two tabs could be
 * refunded a piece we just put back on the shelf. `expire` is the deliberate act;
 * it refuses a session that is already `complete` or already `expired`, so the
 * catch asks what the session actually is rather than assuming.
 */
async function sessionIsDead(sessionId: string | null): Promise<boolean> {
  // Never reached Stripe — nothing was ever payable.
  if (!sessionId) return true;

  const stripe = getStripe();

  try {
    const expired = await stripe.checkout.sessions.expire(sessionId);
    return expired.status === "expired";
  } catch {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.status === "expired";
  }
}

/**
 * Returns a hold, if it is still held. The `status = 'pending'` guard and the
 * restock live in the same transaction, which is what makes returning stock
 * exactly-once: a second call — a Stripe retry, or the `expired` webhook arriving
 * after we already released it ourselves — updates no rows and so restocks
 * nothing.
 */
async function releaseOrderHold(
  orderId: string,
  status: Extract<OrderStatus, "expired" | "failed" | "cancelled">,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const settled = await tx
      .update(orders)
      .set({ status, updatedAt: sql`now()` })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning({ id: orders.id });

    if (settled.length === 0) return false;

    const held = await tx
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of held) {
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          updatedAt: sql`now()`,
        })
        .where(eq(products.id, item.productId));
    }

    return true;
  });
}

/**
 * Puts a shopper's own stale hold back on the shelf before they start a new one.
 *
 * Without this, someone who cancels and returns within the hold window is told the
 * piece they are currently holding is sold out — to themselves. Only *this user's*
 * pending orders are considered, and only ones Stripe confirms are dead.
 */
async function supersedeStaleOrders(userId: string): Promise<void> {
  const stale = await db
    .select({ id: orders.id, sessionId: orders.stripeCheckoutSessionId })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "pending")));

  for (const order of stale) {
    if (!(await sessionIsDead(order.sessionId))) continue;
    await releaseOrderHold(order.id, "expired");
  }
}

/**
 * Creates the order and takes the stock, in one transaction. `lines` are the
 * *clamped* quantities `src/data/cart.ts` produced — but this re-reads price and
 * stock under `FOR UPDATE` rather than trusting them, because the page that
 * produced them may be seconds old.
 */
export async function createOrderForCart({
  userId,
  email,
  lines,
}: {
  userId: string;
  email: string;
  lines: CartLine[];
}): Promise<ReserveResult> {
  if (lines.length === 0) return { ok: false, reason: "empty" };

  await supersedeStaleOrders(userId);

  try {
    const reserved = await db.transaction(async (tx) => {
      const locked = await tx
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          priceCents: products.priceCents,
          stock: products.stock,
          imageUrl: products.imageUrl,
        })
        .from(products)
        .where(
          inArray(
            products.id,
            lines.map((line) => line.productId),
          ),
        )
        .for("update");

      const byId = new Map(locked.map((product) => [product.id, product]));

      const items = lines.map((line) => {
        const product = byId.get(line.productId);

        if (!product || product.stock < line.quantity) {
          // A piece that left the catalog is as unbuyable as one that sold out;
          // the message names it either way.
          throw new OutOfStockError(product?.name ?? "This piece");
        }

        return {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          unitPriceCents: product.priceCents,
          quantity: line.quantity,
          lineTotalCents: product.priceCents * line.quantity,
        };
      });

      const subtotalCents = items.reduce(
        (total, item) => total + item.lineTotalCents,
        0,
      );

      const [created] = await tx
        .insert(orders)
        .values({
          userId,
          email,
          status: "pending",
          subtotalCents,
          // No shipping is charged yet, so the two agree. They are separate
          // columns because the first shipping rate changes only one of them.
          totalCents: subtotalCents,
          currency: CURRENCY,
          expiresAt: holdExpiry(),
        })
        .returning(orderColumns);

      await tx
        .insert(orderItems)
        .values(items.map((item) => ({ ...item, orderId: created.id })));

      for (const item of items) {
        // The guard is what makes this safe under concurrency: the `FOR UPDATE`
        // read above already serialized us against another checkout, and this
        // still refuses to drive stock negative if anything slipped past it.
        const decremented = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: sql`now()`,
          })
          .where(
            and(
              eq(products.id, item.productId),
              gte(products.stock, item.quantity),
            ),
          )
          .returning({ id: products.id });

        if (decremented.length === 0) {
          throw new OutOfStockError(item.productName);
        }
      }

      return { created, items, locked: byId };
    });

    const { created, items, locked } = reserved;

    return {
      ok: true,
      order: created,
      lines: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        imageUrl: locked.get(item.productId)?.imageUrl ?? "",
      })),
    };
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return { ok: false, reason: "out-of-stock", productName: error.productName };
    }
    throw error;
  }
}

/** Records the session Stripe just handed back. The order is `pending` until the webhook says otherwise. */
export async function attachCheckoutSession(
  orderId: string,
  sessionId: string,
  expiresAt: Date,
): Promise<void> {
  await db
    .update(orders)
    .set({
      stripeCheckoutSessionId: sessionId,
      expiresAt,
      updatedAt: sql`now()`,
    })
    .where(eq(orders.id, orderId));
}

/**
 * Undoes a reservation whose Stripe session never came into being. A hold must not
 * outlive the call that failed — there is no session to expire, and so no webhook
 * that would ever release it.
 */
export async function cancelOrder(orderId: string): Promise<void> {
  await releaseOrderHold(orderId, "cancelled");
}

function paymentIntentIdOf(session: Stripe.Checkout.Session): string | null {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? null);
}

function shippingAddressOf(
  session: Stripe.Checkout.Session,
): ShippingAddress | null {
  const address = session.collected_information?.shipping_details?.address;
  if (!address) return null;

  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
  };
}

/**
 * `pending → paid`. Guarded like the release above, so a duplicate delivery
 * changes nothing and, more importantly, a second one can never touch stock.
 */
async function payOrder(
  tx: Tx,
  orderId: string,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const address = shippingAddressOf(session);
  const email = session.customer_details?.email;

  await tx
    .update(orders)
    .set({
      status: "paid",
      paidAt: sql`now()`,
      updatedAt: sql`now()`,
      ...(email ? { email } : {}),
      ...(address ? { shippingAddress: address } : {}),
      ...(paymentIntentIdOf(session)
        ? { stripePaymentIntentId: paymentIntentIdOf(session) }
        : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

/**
 * A session that completed without being paid — a delayed payment method that has
 * not settled yet. The PaymentIntent is worth recording; the status is not ours to
 * advance until `async_payment_succeeded` arrives.
 */
async function recordSession(
  tx: Tx,
  orderId: string,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const address = shippingAddressOf(session);

  await tx
    .update(orders)
    .set({
      updatedAt: sql`now()`,
      ...(address ? { shippingAddress: address } : {}),
      ...(paymentIntentIdOf(session)
        ? { stripePaymentIntentId: paymentIntentIdOf(session) }
        : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

/** The session behind a Checkout event, or `null` for an event we ignore. */
function checkoutSessionOf(event: Stripe.Event): Stripe.Checkout.Session | null {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      return event.data.object;
    default:
      return null;
  }
}

/**
 * Applies one verified Stripe event, exactly once.
 *
 * The dedupe row and the state change share a transaction, which is the whole
 * design: if the handler throws halfway, both roll back and Stripe's retry replays
 * as if nothing had happened. If it succeeds, the `evt_…` id is on record and the
 * retry is a no-op. Committing the id first and mutating afterwards would leave a
 * window where a crash loses the event for good.
 *
 * The events are the Checkout Session's own — `payment_intent.*` is deliberately
 * not subscribed to, because a purchase made through Checkout has one source of
 * truth and a second feed is a second way to be wrong.
 */
export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  await db.transaction(async (tx) => {
    const claimed = await tx
      .insert(stripeEvents)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: stripeEvents.id });

    // Seen before: this is a retry, and the work is already done.
    if (claimed.length === 0) return;

    const session = checkoutSessionOf(event);
    if (!session) return;

    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    // We write this value ourselves, but it arrives over HTTP: a malformed uuid
    // reaching `where id = $1` is a `22P02`, i.e. a 500 that Stripe would retry
    // forever. A session we do not recognise is simply not ours to act on.
    if (!orderId || !isUuid(orderId)) return;

    switch (event.type) {
      case "checkout.session.completed":
        // Paid now, or completed-but-unsettled for a delayed method.
        if (session.payment_status === "paid") {
          await payOrder(tx, orderId, session);
        } else {
          await recordSession(tx, orderId, session);
        }
        break;
      case "checkout.session.async_payment_succeeded":
        await payOrder(tx, orderId, session);
        break;
      case "checkout.session.async_payment_failed":
        await releaseOrderHold(orderId, "failed");
        break;
      case "checkout.session.expired":
        await releaseOrderHold(orderId, "expired");
        break;
      default:
        break;
    }
  });
}

/** The confirmation page's read. Ownership is checked by the caller, not here. */
export async function getOrderBySessionId(
  sessionId: string,
): Promise<OrderDetail | undefined> {
  const [order] = await db
    .select({ ...orderColumns, shippingAddress: orders.shippingAddress })
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1);

  if (!order) return undefined;

  const items = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      productSlug: orderItems.productSlug,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
      lineTotalCents: orderItems.lineTotalCents,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}
