import Link from "next/link";
import type { Metadata } from "next";
import {
  getCategories,
  getProductListing,
  parseProductSort,
  productSorts,
  type ProductSort,
} from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { ValueStrip } from "@/components/value-strip";
import { firstParam } from "@/lib/search-params";

const sortLabels: Record<ProductSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

/** Chip in the category row: hairline underline when it is the active filter. */
function chipClass(current: boolean): string {
  return `label-caps border-b pb-1 transition-colors ${
    current
      ? "border-ink text-ink"
      : "border-transparent text-stone hover:text-ink"
  }`;
}

/**
 * Listing URLs are built here rather than inside the filter components, so the
 * query shape lives in one place. Defaults are dropped, which keeps the whole
 * catalog at a bare `/products`.
 */
function listingHref({
  category,
  sort,
}: {
  category?: string;
  sort?: ProductSort;
}): string {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (sort && sort !== "featured") query.set("sort", sort);

  const search = query.toString();
  return search ? `/products?${search}` : "/products";
}

/** The category behind a `?category=` slug, if it names one that exists. */
async function findCategory(slug: string | undefined) {
  if (!slug) return undefined;

  const allCategories = await getCategories();
  return allCategories.find((item) => item.slug === slug);
}

export async function generateMetadata(
  props: PageProps<"/products">,
): Promise<Metadata> {
  const { category } = await props.searchParams;
  const active = await findCategory(firstParam(category));

  return {
    title: active ? `${active.name} — Atelier` : "Shop — Atelier",
    description:
      "The full Atelier catalog — outerwear, knitwear, footwear and accessories, produced in small runs from archive fabrics.",
  };
}

// A request-time render: the active category and sort live in the URL, so there
// is no single HTML file to prerender. Filtering in Postgres per request is cheap
// at this catalog size, and unlike the other catalog routes this one does not
// query during `next build`.
export default async function ProductsPage(props: PageProps<"/products">) {
  const { category: categoryParam, sort: sortParam } = await props.searchParams;

  const slug = firstParam(categoryParam);
  const sort = parseProductSort(firstParam(sortParam));

  const [allCategories, products] = await Promise.all([
    getCategories(),
    getProductListing({ category: slug, sort }),
  ]);

  const active = allCategories.find((item) => item.slug === slug);

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
          {active ? (
            <>
              <Link className="link-nav" href="/products">
                Shop
              </Link>
              <span className="label-caps text-stone" aria-hidden="true">
                /
              </span>
              <span className="label-caps text-ink" aria-current="page">
                {active.name}
              </span>
            </>
          ) : (
            <span className="label-caps text-ink" aria-current="page">
              Shop
            </span>
          )}
        </nav>
      </div>

      {/* Page header --------------------------------------------------------- */}
      <section className="container-shell flex flex-col gap-4 pb-10 pt-(--spacing-section)">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="label-caps text-stone">The Collection</span>
            <h1 className="text-4xl">{active ? active.name : "All Pieces"}</h1>
          </div>
          {products.length > 0 && (
            <span className="label-caps text-stone">
              {products.length} {products.length === 1 ? "Piece" : "Pieces"}
            </span>
          )}
        </div>
        <p className="max-w-prose text-base text-ink-soft">
          Every piece in the atelier, in the order we would show them — cut in
          small runs from archive fabrics and made to be worn for years rather
          than seasons.
        </p>
      </section>

      {/* Filters -------------------------------------------------------------- */}
      <div className="divider sticky top-20 z-10 bg-paper">
        <div className="container-shell flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-4">
          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
            aria-label="Filter by category"
          >
            <Link
              className={chipClass(!active)}
              href={listingHref({ sort })}
              aria-current={active ? undefined : "true"}
            >
              All
            </Link>
            {allCategories.map((category) => {
              const current = category.slug === active?.slug;

              return (
                <Link
                  key={category.id}
                  className={chipClass(current)}
                  href={listingHref({ category: category.slug, sort })}
                  aria-current={current ? "true" : undefined}
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>
          <SortSelect
            value={sort}
            options={productSorts.map((value) => ({
              value,
              label: sortLabels[value],
              href: listingHref({ category: active?.slug, sort: value }),
            }))}
          />
        </div>
      </div>

      {/* Grid -------------------------------------------------------------- */}
      <section className="container-shell py-(--spacing-section-sm) lg:py-(--spacing-section)">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-6">
            <p className="text-base text-ink-soft">
              Nothing in this category just yet — the next delivery is on its
              way.
            </p>
            <Link className="btn btn-secondary" href="/products">
              View all pieces
            </Link>
          </div>
        )}
      </section>

      {/* Value strip -------------------------------------------------------- */}
      <ValueStrip />
    </main>
  );
}
