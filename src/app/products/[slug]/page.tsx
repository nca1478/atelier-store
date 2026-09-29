import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/data/products";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { StockStatus } from "@/components/stock-status";
import { ValueStrip } from "@/components/value-strip";

// Prerendered at build from the database, then refreshed in the background at
// most once a minute. Slugs that appear in the catalog later are rendered on
// demand and cached, so a new piece does not need a rebuild.
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Not found — Atelier" };
  }

  return {
    title: `${product.name} — Atelier`,
    description: product.description,
  };
}

export default async function ProductPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.slug);

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
          <span className="label-caps text-stone">{product.category}</span>
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product panel ------------------------------------------------------ */}
      <section className="container-shell grid grid-cols-1 gap-10 py-(--spacing-section) lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-bone">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-2">
            <span className="label-caps text-stone">{product.category}</span>
            <h1 className="text-4xl">{product.name}</h1>
            <span className="text-lg">{formatPrice(product.priceCents)}</span>
          </div>

          <StockStatus stock={product.stock} />

          <p className="max-w-prose text-base text-ink-soft">
            {product.description}
          </p>

          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            disabled={product.stock <= 0}
          >
            {product.stock <= 0 ? "Sold out" : "Add to bag"}
          </button>

          {/* Details */}
          <dl className="divider mt-2 flex flex-col">
            {product.details.map((detail) => (
              <div
                key={detail.label}
                className="flex items-baseline justify-between gap-6 border-b border-line py-3"
              >
                <dt className="label-caps text-stone">{detail.label}</dt>
                <dd className="text-sm text-ink">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Value strip -------------------------------------------------------- */}
      <ValueStrip />

      {/* Related pieces ------------------------------------------------------ */}
      {related.length > 0 && (
        <section className="divider">
          <div className="container-shell flex flex-col gap-10 py-(--spacing-section)">
            <div className="flex flex-col gap-2">
              <span className="label-caps text-stone">You may also like</span>
              <h2 className="text-3xl">Related pieces</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
