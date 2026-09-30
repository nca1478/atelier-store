import Link from "next/link";
import type { Metadata } from "next";
import {
  audienceValues,
  getCategories,
  getProductListing,
  parseProductAudience,
  parseProductSort,
  productSorts,
  type Audience,
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

/** Chip label and heading word for each collection — "Women", not "women". */
const audienceLabels: Record<Audience, string> = {
  women: "Women",
  men: "Men",
  unisex: "Unisex",
};

/** Chip in a filter row: hairline underline when it is the active filter. */
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
 *
 * Every caller passes all three dimensions, which is what keeps the filters
 * independent: the "All" chip of one row simply omits its own dimension and
 * hands the others straight back.
 */
function listingHref({
  audience,
  category,
  sort,
}: {
  audience?: Audience;
  category?: string;
  sort?: ProductSort;
}): string {
  const query = new URLSearchParams();
  if (audience) query.set("audience", audience);
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

/**
 * The listing's title when a filter is on — `Women · Outerwear` — and
 * `undefined` when none is. Shared by the page heading and the metadata so the
 * tab and the `<h1>` can never disagree; an unrecognised value narrows nothing,
 * so it names nothing either.
 */
function listingHeading(
  audience: Audience | undefined,
  categoryName: string | undefined,
): string | undefined {
  const parts = [audience ? audienceLabels[audience] : undefined, categoryName];
  return parts.filter(Boolean).join(" · ") || undefined;
}

export async function generateMetadata(
  props: PageProps<"/products">,
): Promise<Metadata> {
  const { audience, category } = await props.searchParams;
  const active = await findCategory(firstParam(category));
  const heading = listingHeading(
    parseProductAudience(firstParam(audience)),
    active?.name,
  );

  return {
    title: heading ? `${heading} — Atelier` : "Shop — Atelier",
    description:
      "The full Atelier catalog — outerwear, knitwear, footwear and accessories, produced in small runs from archive fabrics.",
  };
}

// A request-time render: the active filters and sort live in the URL, so there
// is no single HTML file to prerender. Filtering in Postgres per request is cheap
// at this catalog size, and unlike the other catalog routes this one does not
// query during `next build`.
export default async function ProductsPage(props: PageProps<"/products">) {
  const {
    audience: audienceParam,
    category: categoryParam,
    sort: sortParam,
  } = await props.searchParams;

  const slug = firstParam(categoryParam);
  const audience = parseProductAudience(firstParam(audienceParam));
  const sort = parseProductSort(firstParam(sortParam));

  const [allCategories, products] = await Promise.all([
    getCategories(),
    getProductListing({ category: slug, audience, sort }),
  ]);

  const active = allCategories.find((item) => item.slug === slug);
  const heading = listingHeading(audience, active?.name);

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
          {audience || active ? (
            <>
              <Link className="link-nav" href="/products">
                Shop
              </Link>
              <span className="label-caps text-stone" aria-hidden="true">
                /
              </span>
              {audience && (
                <>
                  <Link className="link-nav" href={listingHref({ audience })}>
                    {audienceLabels[audience]}
                  </Link>
                  {active && (
                    <span className="label-caps text-stone" aria-hidden="true">
                      /
                    </span>
                  )}
                </>
              )}
              {active && (
                <span className="label-caps text-ink" aria-current="page">
                  {active.name}
                </span>
              )}
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
            <h1 className="text-4xl">{heading ?? "All Pieces"}</h1>
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
      {/* One sticky bar, not two: the header is `z-20` and `h-20`, so a second
          stacked bar would fight it for the same offset. */}
      <div className="divider sticky top-20 z-10 bg-paper">
        <div className="container-shell flex flex-wrap items-start justify-between gap-x-8 gap-y-4 py-4">
          <div className="flex flex-col gap-3">
            <nav
              className="flex flex-wrap items-center gap-x-6 gap-y-3"
              aria-label="Filter by collection"
            >
              <span className="label-caps text-stone">For</span>
              <Link
                className={chipClass(!audience)}
                href={listingHref({ category: active?.slug, sort })}
                aria-current={audience ? undefined : "true"}
              >
                All
              </Link>
              {audienceValues.map((value) => {
                const current = value === audience;

                return (
                  <Link
                    key={value}
                    className={chipClass(current)}
                    href={listingHref({
                      audience: value,
                      category: active?.slug,
                      sort,
                    })}
                    aria-current={current ? "true" : undefined}
                  >
                    {audienceLabels[value]}
                  </Link>
                );
              })}
            </nav>
            <nav
              className="flex flex-wrap items-center gap-x-6 gap-y-3"
              aria-label="Filter by category"
            >
              <span className="label-caps text-stone">Category</span>
              <Link
                className={chipClass(!active)}
                href={listingHref({ audience, sort })}
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
                    href={listingHref({
                      audience,
                      category: category.slug,
                      sort,
                    })}
                    aria-current={current ? "true" : undefined}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <SortSelect
            value={sort}
            options={productSorts.map((value) => ({
              value,
              label: sortLabels[value],
              href: listingHref({ audience, category: active?.slug, sort: value }),
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
            {/* A filter combination with no pieces in it is a valid URL, so the
                copy cannot blame the category — the way out is any filter. */}
            <p className="text-base text-ink-soft">
              Nothing here just yet — try clearing a filter, the next delivery
              is on its way.
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
