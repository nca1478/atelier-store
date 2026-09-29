"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/cart-store";

/**
 * The header's bag link, and the second component in the header that has to be
 * client-side — see `account-link.tsx`. `SiteHeader` renders from the root layout,
 * so reading the cart cookie with `cookies()` here would opt *every* route into
 * dynamic rendering and cost the catalog its `revalidate = 60`.
 *
 * What it counts is what the cookie says, not what is still purchasable: a stale
 * cookie inflates this until `/cart` is opened, where `CartReconciler` writes the
 * server's answer back. That is the deliberate trade — an authoritative count would
 * need a server cookie read in the layout, which is the one thing this design must
 * not do.
 */
export function CartCountLink() {
  const count = useCartCount();

  if (count === null) {
    // Invisible and width-matched, like AccountLink's placeholder: the header must
    // not jump when the count arrives.
    return (
      <span className="link-nav invisible" aria-hidden="true">
        Bag (0)
      </span>
    );
  }

  return (
    // `/cart` is dynamic and per-visitor, so prefetching it from the header would
    // fire a cookie-reading RSC request on every page of the site.
    <Link className="link-nav" href="/cart" prefetch={false}>
      Bag ({count})
    </Link>
  );
}
