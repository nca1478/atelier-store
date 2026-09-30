import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/auth/session";
import { getOrdersForUser, orderReference } from "@/data/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

// Dynamic, like the rest of /account: it reads the session. Deliberately not
// cached — an order that was just paid should show as paid on the next load.
export const metadata: Metadata = {
  title: "Order history — Atelier",
  description: "Your Atelier orders.",
  robots: { index: false, follow: false },
};

/**
 * The shopper's own orders, and only theirs.
 *
 * `requireUser()` answers "is anyone signed in" and `getOrdersForUser` answers
 * "which orders are theirs" — the second question is put to the database in the
 * `where` clause rather than filtered afterwards, so there is no moment where
 * another account's row is in hand.
 */
export default async function OrderHistoryPage() {
  const { user } = await requireUser();
  const orders = await getOrdersForUser(user.id);

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
          <span className="label-caps text-ink" aria-current="page">
            Orders
          </span>
        </nav>
      </div>

      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Your Account</span>
          <h1 className="text-4xl">Order history</h1>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-prose text-base text-ink-soft">
              No orders yet — when you buy something, it will be listed here with
              its receipt.
            </p>
            <Link className="btn btn-secondary" href="/products">
              View all pieces
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col">
            {orders.map((order) => (
              <li
                key={order.id}
                className="divider flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  {/* The reference is the link: it names the order, and the
                      order is what there is to open. */}
                  <Link
                    className="link text-base font-medium"
                    href={`/account/orders/${order.id}`}
                  >
                    Order {orderReference(order.id)}
                  </Link>
                  <span className="text-sm text-stone">
                    Placed {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:justify-end">
                  <OrderStatusBadge status={order.status} />
                  <span className="label-caps text-stone">
                    {order.itemCount}{" "}
                    {order.itemCount === 1 ? "Piece" : "Pieces"}
                  </span>
                  <span className="text-base tabular-nums sm:w-24 sm:text-right">
                    {formatPrice(order.totalCents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link className="link self-start text-sm" href="/account">
          Back to your account
        </Link>
      </section>
    </main>
  );
}
