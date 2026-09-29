import Link from "next/link";
import type { Metadata } from "next";
import { getLatestProducts } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { ValueStrip } from "@/components/value-strip";

export const metadata: Metadata = {
  title: "New Arrivals — Atelier",
  description:
    "The latest additions to the Atelier catalog — ready-to-wear, knitwear, footwear and accessories, newest first.",
};

// Prerendered at build from the database, then refreshed in the background at
// most once a minute — a piece added to the catalog later needs no rebuild.
export const revalidate = 60;

export default async function NewArrivalsPage() {
  const products = await getLatestProducts();

  return (
    <main className="flex-1">
      {/* Breadcrumb -------------------------------------------------------- */}
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
            New Arrivals
          </span>
        </nav>
      </div>

      {/* Page header and grid ----------------------------------------------- */}
      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="label-caps text-stone">Just In</span>
              <h1 className="text-4xl">New Arrivals</h1>
            </div>
            {products.length > 0 && (
              <span className="label-caps text-stone">
                {products.length} {products.length === 1 ? "Piece" : "Pieces"}
              </span>
            )}
          </div>
          <p className="max-w-prose text-base text-ink-soft">
            The most recent additions to the atelier, newest first — small runs
            cut from archive fabrics, made to be worn for years rather than
            seasons.
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-base text-ink-soft">
            Nothing new just yet — the next delivery is on its way.
          </p>
        )}
      </section>

      {/* Value strip -------------------------------------------------------- */}
      <ValueStrip />
    </main>
  );
}
