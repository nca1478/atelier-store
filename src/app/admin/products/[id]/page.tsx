import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { getProductById } from "@/data/products";
import { getMovementsForProduct } from "@/data/inventory";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminRestricted } from "@/components/admin-restricted";
import { AdminStockForm } from "@/components/admin-stock-form";
import { MovementReasonBadge } from "@/components/movement-reason-badge";
import { StockStatus } from "@/components/stock-status";

export const metadata: Metadata = {
  title: "Inventory — Atelier",
  description: "One piece's stock history.",
  robots: { index: false, follow: false },
};

/**
 * One piece, its current stock, and the ledger that explains it — the answer to
 * "why is the stock 7?" that the column alone cannot give.
 *
 * The uuid in the URL is not a capability, but it is also not trusted:
 * `getProductById` drops anything that is not a uuid shape before it reaches
 * Postgres, so a hand-edited URL is the 404 rather than a `22P02` that would
 * turn the page into a 500.
 */
export default async function AdminProductDetailPage(
  props: PageProps<"/admin/products/[id]">,
) {
  const { id } = await props.params;

  const session = await requireAdmin();

  if (!session) {
    return (
      <AdminRestricted
        trail={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/products", label: "Inventory" },
        ]}
        current="Piece"
      />
    );
  }

  const product = await getProductById(id);

  if (!product) notFound();

  const movements = await getMovementsForProduct(id);

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
          <Link className="link-nav" href="/admin/products">
            Inventory
          </Link>
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            {product.name}
          </span>
        </nav>
      </div>

      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Restricted</span>
          <h1 className="break-words text-4xl">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm text-stone">{product.category}</span>
            <span className="text-sm text-stone tabular-nums">
              {formatPrice(product.priceCents)}
            </span>
            <StockStatus stock={product.stock} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl">Adjust</h2>
          <AdminStockForm productId={product.id} productName={product.name} />
          <p className="text-sm text-stone">
            This is the number the storefront sells against. A change here is
            live on the catalog within the minute, and it is recorded below with
            your account against it.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl">History</h2>

          {movements.length === 0 ? (
            <p className="max-w-prose text-base text-ink-soft">
              Nothing has moved this piece yet. Sales, returns and hand
              adjustments all appear here as they happen.
            </p>
          ) : (
            <ul className="flex flex-col">
              {movements.map((movement) => (
                <li
                  key={movement.id}
                  className="divider flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <MovementReasonBadge reason={movement.reason} />
                    <span className="text-sm text-stone">
                      {formatDate(movement.createdAt)}
                      {movement.actorEmail
                        ? ` · ${movement.actorEmail}`
                        : " · automatic"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
                    <span
                      className={`text-base tabular-nums ${
                        movement.delta > 0 ? "text-success" : "text-ink"
                      }`}
                    >
                      {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                    </span>
                    <span className="label-caps text-stone tabular-nums">
                      {movement.stockAfter} after
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <Link className="link text-sm" href="/admin/products">
            Back to inventory
          </Link>
          <Link className="link text-sm" href={`/products/${product.slug}`}>
            View on the storefront
          </Link>
        </div>
      </section>
    </main>
  );
}
