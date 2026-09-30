import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/auth/session";
import { getProducts } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { AdminRestricted } from "@/components/admin-restricted";
import { AdminStockForm } from "@/components/admin-stock-form";
import { StockStatus } from "@/components/stock-status";

export const metadata: Metadata = {
  title: "Inventory — Atelier",
  description: "Atelier inventory.",
  robots: { index: false, follow: false },
};

/**
 * Every piece and what is on the shelf, with the one control an administrator
 * has: move the number by a delta.
 *
 * The guard is this page's own. Not the layout's, and not `src/proxy.ts` — the
 * proxy only checks that a cookie exists, and the role is a database fact.
 * `requireAdmin` answers `null` instead of throwing so the panel below can be
 * rendered in place of a redirect, which is that function's whole reason for
 * existing.
 */
export default async function AdminProductsPage() {
  const session = await requireAdmin();

  if (!session) {
    return (
      <AdminRestricted
        trail={[{ href: "/admin", label: "Admin" }]}
        current="Inventory"
      />
    );
  }

  const products = await getProducts();

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
          <Link className="link-nav" href="/admin">
            Admin
          </Link>
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            Inventory
          </span>
        </nav>
      </div>

      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Restricted</span>
          <h1 className="text-4xl">Inventory</h1>
          <p className="max-w-prose text-base text-ink-soft">
            Move a piece by a number of pieces: a positive number puts stock back
            on the shelf, a negative one takes it off. Nothing here can push a
            count below zero, and every change is recorded against your account.
          </p>
        </div>

        <ul className="flex flex-col">
          {products.map((product) => (
            <li
              key={product.id}
              className="divider flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <Link
                  className="link text-base font-medium"
                  href={`/admin/products/${product.id}`}
                >
                  {product.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
                  <span>{product.category}</span>
                  <span className="tabular-nums">
                    {formatPrice(product.priceCents)}
                  </span>
                </div>
                <StockStatus stock={product.stock} />
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <span className="label-caps text-ink tabular-nums">
                  {product.stock} on hand
                </span>
                <AdminStockForm
                  productId={product.id}
                  productName={product.name}
                />
              </div>
            </li>
          ))}
        </ul>

        <Link className="link self-start text-sm" href="/admin">
          Back to admin
        </Link>
      </section>
    </main>
  );
}
