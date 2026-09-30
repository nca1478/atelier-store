import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/auth/session";
import { authoritativeCartCookie, getCart } from "@/data/cart";
import { formatPrice } from "@/lib/format";
import { firstParam } from "@/lib/search-params";
import { CartLineItem } from "@/components/cart-line-item";
import { CartReconciler } from "@/components/cart-reconciler";
import { CheckoutButton } from "@/components/checkout-button";
import { ValueStrip } from "@/components/value-strip";

// Dynamic, like /account: it reads the cart cookie. The catalog's static routes are
// unaffected — nothing here renders from the root layout.
export const metadata: Metadata = {
  title: "Bag — Atelier",
  description: "Your Atelier bag.",
  robots: { index: false, follow: false },
};

export default async function CartPage(props: PageProps<"/cart">) {
  // The cookie is the request; every number below is the answer. This is the only
  // page that resolves them, and the only place a cart total is computed.
  //
  // The session is read here only to choose between "Checkout" and "Sign in to
  // check out". It is *not* the authorization: `startCheckout` guards itself, and
  // this page has always been dynamic, so reading it costs the catalog nothing.
  const [cart, session] = await Promise.all([getCart(), getSession()]);
  const cancelled = firstParam((await props.searchParams).checkout) === "cancelled";

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

        {/* Coming back from Stripe with nothing bought. Informational only: the
            hold is released by `checkout.session.expired`, never by this URL. */}
        {cancelled && (
          <p className="divider bg-bone px-4 py-3 text-sm text-ink-soft">
            Checkout was cancelled and nothing was charged. Your bag is exactly as
            you left it.
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
                  <dd className="text-sm text-ink-soft">Included</dd>
                </div>
              </dl>

              {/* Checkout is for account holders: an order belongs to someone, and
                  so does the receipt. The alternative is a link, not a disabled
                  button — a shopper who wants to buy should be able to get on with
                  it. */}
              {session ? (
                <CheckoutButton />
              ) : (
                <>
                  <Link
                    className="btn btn-primary w-full"
                    href={`/sign-in?next=${encodeURIComponent("/cart")}`}
                  >
                    Sign in to check out
                  </Link>
                  <p className="text-sm text-stone">
                    Checkout is for account holders. Your bag will be waiting.
                  </p>
                </>
              )}

              <p className="text-sm text-stone">
                Your address is collected securely by Stripe. We never see your card
                details.
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
