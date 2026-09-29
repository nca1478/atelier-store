import Link from "next/link";
import type { Metadata } from "next";
import { authoritativeCartCookie, getCart } from "@/data/cart";
import { formatPrice } from "@/lib/format";
import { CartLineItem } from "@/components/cart-line-item";
import { CartReconciler } from "@/components/cart-reconciler";
import { ValueStrip } from "@/components/value-strip";

// Dynamic, like /account: it reads the cart cookie. The catalog's static routes are
// unaffected — nothing here renders from the root layout.
export const metadata: Metadata = {
  title: "Bag — Atelier",
  description: "Your Atelier bag.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  // The cookie is the request; every number below is the answer. This is the only
  // page that resolves them, and the only place a cart total is computed.
  const cart = await getCart();

  return (
    <main className="flex-1">
      {/* Writes the server's answer back when the cookie disagrees with it — a piece
          that sold out or left the catalog since the bag was saved. */}
      <CartReconciler authoritative={authoritativeCartCookie(cart)} />

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
            Bag
          </span>
        </nav>
      </div>

      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-3">
            <span className="label-caps text-stone">Your Selection</span>
            <h1 className="text-4xl">Bag</h1>
          </div>
          {/* Only when there is something to count: "0 Pieces" beside "Bag" reads
              like a bug, and the empty state below already says so in words. */}
          {cart.lines.length > 0 && (
            <span className="label-caps text-stone">
              {cart.itemCount} {cart.itemCount === 1 ? "Piece" : "Pieces"}
            </span>
          )}
        </div>

        {cart.hasIssues && (
          <p className="divider bg-bone px-4 py-3 text-sm text-ink-soft">
            Stock changed while your bag was saved — the pieces below have been
            adjusted.
          </p>
        )}

        {cart.lines.length === 0 ? (
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-prose text-base text-ink-soft">
              Nothing in your bag just yet — the collection is a good place to
              start.
            </p>
            <Link className="btn btn-secondary" href="/products">
              View all pieces
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-16 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
            <ul className="flex flex-col">
              {cart.lines.map((line) => (
                <CartLineItem key={line.productId} line={line} />
              ))}
            </ul>

            <aside className="divider flex flex-col gap-6 pt-6 lg:sticky lg:top-28 lg:self-start">
              <h2 className="text-2xl">Summary</h2>

              <dl className="flex flex-col">
                <div className="divider flex items-baseline justify-between gap-6 py-4">
                  <dt className="label-caps text-stone">Subtotal</dt>
                  <dd className="text-lg tabular-nums">
                    {formatPrice(cart.subtotalCents)}
                  </dd>
                </div>
                <div className="divider flex items-baseline justify-between gap-6 py-4">
                  <dt className="label-caps text-stone">Shipping</dt>
                  <dd className="text-sm text-ink-soft">Calculated at checkout</dd>
                </div>
              </dl>

              {/* Deliberately inert: there is no commerce backend and no Stripe yet.
                  `disabled` plus .btn:disabled's pointer-events:none makes it
                  unclickable, and the line below says why, rather than leaving a
                  dead control unexplained. */}
              <button type="button" className="btn btn-primary w-full" disabled>
                Checkout coming soon
              </button>
              <p className="text-sm text-stone">
                Checkout isn&rsquo;t built yet. Your bag is saved in this browser
                only.
              </p>
              <Link className="link self-start text-sm" href="/products">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </section>

      <ValueStrip />
    </main>
  );
}
