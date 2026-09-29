import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, searchProducts, type Category } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { SearchForm } from "@/components/search-form";
import { ValueStrip } from "@/components/value-strip";
import { firstParam } from "@/lib/search-params";

/**
 * What the page offers when there is nothing to list: the same categories the
 * listing filters by, one level up, so a dead end (or an empty box) still has a
 * way out. The hrefs are the listing's own filter shape — search does not
 * duplicate category pages.
 */
function CategoryLinks({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="label-caps text-stone">Browse by Category</span>
      <nav
        className="flex flex-wrap items-center gap-x-6 gap-y-3"
        aria-label="Browse by category"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            className="label-caps border-b border-transparent pb-1 text-stone transition-colors hover:border-ink hover:text-ink"
            href={`/products?category=${category.slug}`}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export async function generateMetadata(
  props: PageProps<"/search">,
): Promise<Metadata> {
  const query = firstParam((await props.searchParams).q)?.trim();

  return {
    title: query ? `${query} — Search — Atelier` : "Search — Atelier",
    description:
      "Search the Atelier catalog by piece, category or fabric — the full collection, down to the cloth each piece is cut from.",
    // One thin page per query string, and none of them is the page that should
    // rank: keep the `?q=` permutations out of the index, links intact.
    robots: { index: false, follow: true },
  };
}

// A request-time render, like the listing: the query lives in the URL, so there
// is no single HTML file to prerender. Reading `searchParams` is what opts the
// route into dynamic rendering — and unlike the other catalog routes, this one
// queries nothing during `next build`.
export default async function SearchPage(props: PageProps<"/search">) {
  const query = firstParam((await props.searchParams).q)?.trim() ?? "";

  // `searchProducts("")` answers without touching the database, so the empty
  // state costs one cached categories query.
  const [categories, results] = await Promise.all([
    getCategories(),
    searchProducts(query),
  ]);

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
            Search
          </span>
        </nav>
      </div>

      {/* Header and search box ---------------------------------------------- */}
      <section className="container-shell flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="label-caps text-stone">The Collection</span>
              {/* A query is shopper input, so it can be any length — break it
                  rather than let a pasted sentence push the layout sideways. */}
              <h1 className="break-words text-4xl">
                {query ? <>Results for “{query}”</> : "Search"}
              </h1>
            </div>
            {results.length > 0 && (
              <span className="label-caps text-stone">
                {results.length} {results.length === 1 ? "Piece" : "Pieces"}
              </span>
            )}
          </div>
          <SearchForm query={query} />
          {!query && (
            <p className="max-w-prose text-base text-ink-soft">
              The whole atelier is searchable by piece, category or fabric — try
              a cloth, a silhouette, or the name of the piece you have in mind.
            </p>
          )}
        </div>

        {/* Results or empty state ------------------------------------------- */}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-8">
            {query && (
              <p className="max-w-prose text-base text-ink-soft">
                No pieces match “{query}” just yet — try a different word, or
                start from a category.
              </p>
            )}
            <CategoryLinks categories={categories} />
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
