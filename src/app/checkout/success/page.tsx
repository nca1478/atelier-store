import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/auth/session";
import { getOrderBySessionId, orderReference } from "@/data/orders";
import { firstParam } from "@/lib/search-params";
import { CartClearOnSuccess } from "@/components/cart-clear-on-success";
import { OrderLines } from "@/components/order-lines";
import { OrderTotals } from "@/components/order-totals";
import { ValueStrip } from "@/components/value-strip";

// Dynamic: it reads `searchParams` and the session. robots noindex, like the bag —
// an order confirmation is one shopper's business.
export const metadata: Metadata = {
  title: "Order confirmed — Atelier",
  description: "Your Atelier order.",
  robots: { index: false, follow: false },
};

/**
 * Where Checkout sends the customer after paying — and a page that writes nothing.
 *
 * The redirect back here is not evidence of anything: the URL is guessable, and a
 * customer who pays can lose the connection before it loads. So every fact on this
 * page comes from the `orders` row the webhook wrote, and the only thing that
 * changes as a result of a visit is the bag being emptied — and only once the
 * server has said the order is `paid`.
 */
export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const sessionId = firstParam((await props.searchParams).session_id);

  if (!sessionId) notFound();

  // Signed-in checkout, so the confirmation belongs to an account. `requireUser`
  // also solves the anonymous case: a session that expired between paying and
  // landing gets sent to sign in and returned here, with the session id intact.
  const session = await requireUser();

  const order = await getOrderBySessionId(sessionId);

  // A session id is not a capability. Without this check, anyone could paste a
  // `cs_…` they saw in a Stripe email and read a stranger's name, address and
  // order. Not ours to show, so it does not exist.
  if (!order || order.userId !== session.user.id) notFound();

  const reference = orderReference(order.id);
  const pending = order.status === "pending";
  const paid = order.status === "paid";

  return (
    <main className="flex-1">
      {/* Mounted only for a settled, paid order: the bag is emptied because the
          pieces now belong to this order, not because the page was opened. */}
      {paid && <CartClearOnSuccess />}

      <div className="divider">
        <nav
          className="container-shell flex flex-wrap items-center gap-2 py-4"
          aria-label="Breadcrumb"
        >
          <Link className="link-nav" href="/">
            Home
          </Link>
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            Order
          </span>
        </nav>
      </div>

      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">
            {paid ? "Order confirmed" : "Order received"}
          </span>
          <h1 className="text-4xl">
            {paid ? "Thank you" : "Almost there"}
          </h1>
          <p className="max-w-prose text-base text-ink-soft">
            {paid
              ? "Your order is confirmed and a receipt is on its way from Stripe. We'll be in touch as soon as it ships."
              : "We've received your order and we're waiting on the payment to settle. Nothing more is needed from you — this page will catch up on its own."}
          </p>
          <p className="label-caps text-stone">Reference {reference}</p>
        </div>

        <div className="flex flex-col gap-16 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
          <OrderLines items={order.items} />

          <aside className="divider flex flex-col gap-6 pt-6 lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-2xl">Summary</h2>

            <OrderTotals
              subtotalCents={order.subtotalCents}
              totalCents={order.totalCents}
            />

            {order.shippingAddress && (
              <div className="divider flex flex-col gap-1 pt-6 text-sm text-ink-soft">
                <span className="label-caps text-stone">Delivery</span>
                <address className="not-italic">
                  {[
                    order.shippingAddress.line1,
                    order.shippingAddress.line2,
                    order.shippingAddress.city,
                    order.shippingAddress.state,
                    order.shippingAddress.postalCode,
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </address>
              </div>
            )}

            {pending && (
              // The ordinary race: the browser beat the webhook back, not an error.
              // A plain anchor rather than `Link` on purpose — this is a request for
              // a fresh server render, and a client-side navigation to the URL we are
              // already on is exactly the thing that might not be one.
              <a
                className="btn btn-secondary w-full"
                href={`/checkout/success?session_id=${encodeURIComponent(sessionId)}`}
              >
                Check again
              </a>
            )}

            <Link className="link self-start text-sm" href="/products">
              Continue shopping
            </Link>
          </aside>
        </div>
      </section>

      <ValueStrip />
    </main>
  );
}
