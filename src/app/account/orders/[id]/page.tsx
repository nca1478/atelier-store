import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/auth/session";
import { getOrderForUser, orderReference } from "@/data/orders";
import { formatDate } from "@/lib/format";
import { OrderLines } from "@/components/order-lines";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTotals } from "@/components/order-totals";

export const metadata: Metadata = {
  title: "Order — Atelier",
  description: "One of your Atelier orders.",
  robots: { index: false, follow: false },
};

/**
 * A single order from the shopper's history.
 *
 * The id in the URL is not a capability. `getOrderForUser` puts the signed-in
 * account in the `where` clause, so somebody else's order is not a row this page
 * can reach and it renders the 404 instead — the same answer as an id that never
 * existed, which is also what keeps the page from confirming that a given order
 * is real.
 */
export default async function OrderDetailPage(
  props: PageProps<"/account/orders/[id]">,
) {
  const { id } = await props.params;

  const { user } = await requireUser();
  const order = await getOrderForUser(id, user.id);

  if (!order) notFound();

  return (
    <main className="flex-1">
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
          <Link className="link-nav" href="/account">
            Account
          </Link>
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <Link className="link-nav" href="/account/orders">
            Orders
          </Link>
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            {orderReference(order.id)}
          </span>
        </nav>
      </div>

      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Your Account</span>
          <h1 className="break-words text-4xl">
            Order {orderReference(order.id)}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm text-stone">
              Placed {formatDate(order.createdAt)}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          {order.status === "pending" && (
            // Read-only, exactly like the confirmation page: payment state is the
            // webhook's to write, so there is nothing here to press.
            <p className="max-w-prose text-base text-ink-soft">
              We are waiting on the payment to settle. Nothing more is needed from
              you — this page will catch up on its own.
            </p>
          )}
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

            <Link className="link self-start text-sm" href="/account/orders">
              Back to order history
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
