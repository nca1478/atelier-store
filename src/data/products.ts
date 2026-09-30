// The catalog, read from Postgres. Every function here returns the `Product`
// view model the storefront renders, so components stay unaware that the data
// comes from a join rather than the static array this module used to hold.

import { cache } from "react";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { audienceValues, categories, products, type Audience } from "@/db/schema";
import { isProductId } from "@/lib/cart";

// The listing page builds its filter chips from the same union the column is
// checked against, exactly as `productSorts` feeds the sort control — one
// definition, two consumers. Re-exported so pages import the vocabulary from
// the data layer rather than reaching into the schema.
export { audienceValues };
export type { Audience };

export type ProductDetail = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  category: string;
  priceCents: number;
  image: string;
  alt: string;
  description: string;
  details: ProductDetail[];
  stock: number;
};

const productColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  categoryId: products.categoryId,
  category: categories.name,
  priceCents: products.priceCents,
  image: products.imageUrl,
  alt: products.imageAlt,
  description: products.description,
  details: products.details,
  stock: products.stock,
};

/**
 * The catalog in editorial order. `id` breaks ties so the order is stable when
 * two pieces share a sort_order.
 */
export async function getProducts(
  options: { limit?: number; offset?: number } = {},
): Promise<Product[]> {
  const { limit = 100, offset = 0 } = options;

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.sortOrder), asc(products.id))
    .limit(limit)
    .offset(offset);
}

/** New Arrivals rail: the first `limit` pieces in editorial order. */
export function getNewArrivals(limit = 4): Promise<Product[]> {
  return getProducts({ limit });
}

export type Category = {
  id: string;
  name: string;
  /** URL form of the name — `Ready-to-Wear` → `ready-to-wear`. */
  slug: string;
};

/**
 * Categories have no slug column: `name` is the unique, human-readable key, so
 * the listing derives the URL form from it rather than putting a uuid in a
 * query string. Both directions go through this one function so the link and
 * the lookup can never disagree.
 */
export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Memoized like `getProductBySlug`: the listing page reads categories for the
 * filter row and again to resolve the active one, and `getProductListing` reads
 * them a third time to turn a slug into an id — all one query per request.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((row) => ({ ...row, slug: categorySlug(row.name) }));
});

/** Display order of the listing's sort control — the union's source of truth. */
export const productSorts = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
] as const;

export type ProductSort = (typeof productSorts)[number];

/** Anything unrecognised in the URL falls back to the editorial order. */
export function parseProductSort(value: string | undefined): ProductSort {
  return productSorts.find((sort) => sort === value) ?? "featured";
}

/**
 * Unlike `parseProductSort`, an unrecognised value falls back to *no filter*
 * rather than to a default: same posture as an unknown category slug, so a
 * hand-edited `?audience=` shows the whole catalog instead of erroring. It is
 * also what keeps `?audience=accessories` out of the audience dimension —
 * `accessories` names a category, never a fourth audience.
 */
export function parseProductAudience(
  value: string | undefined,
): Audience | undefined {
  return audienceValues.find((audience) => audience === value);
}

/**
 * The pieces a rail should show, which for `women` and `men` includes `unisex`:
 * a piece cut for anyone belongs on both, not on a third shelf nobody browses
 * to. The consequence is deliberate — the chips add up to more than the
 * catalog, because a unisex piece is counted by each rail it appears on.
 *
 * A `switch` over the union rather than a ternary so that adding a fourth value
 * to `audienceValues` is a type error here, not a silent omission.
 */
function audienceFilter(audience: Audience): Audience[] {
  switch (audience) {
    case "women":
      return ["women", "unisex"];
    case "men":
      return ["men", "unisex"];
    case "unisex":
      return ["unisex"];
  }
}

/** Every ordering keeps `sortOrder` then `id` as tie-breaks, so it is stable. */
function listingOrder(sort: ProductSort) {
  switch (sort) {
    case "newest":
      return [
        desc(products.createdAt),
        asc(products.sortOrder),
        asc(products.id),
      ];
    case "price-asc":
      return [
        asc(products.priceCents),
        asc(products.sortOrder),
        asc(products.id),
      ];
    case "price-desc":
      return [
        desc(products.priceCents),
        asc(products.sortOrder),
        asc(products.id),
      ];
    default:
      return [asc(products.sortOrder), asc(products.id)];
  }
}

/**
 * The listing page's query. `category` is a category *slug*, not an id — an
 * unknown slug (a hand-edited URL, a category that has been renamed) filters
 * nothing rather than erroring, so the page falls back to the full catalog.
 * `audience` widens the same way: no value means no constraint.
 *
 * The two filters are independent and compose, which is the whole point of
 * having them side by side: Women + Outerwear narrows twice, and clearing one
 * leaves the other standing.
 */
export async function getProductListing(
  options: {
    category?: string;
    audience?: Audience;
    sort?: ProductSort;
    limit?: number;
  } = {},
): Promise<Product[]> {
  const { category, audience, sort = "featured", limit = 100 } = options;
  const allCategories = await getCategories();
  const match = allCategories.find((item) => item.slug === category);

  // A predicate per active dimension. `and()` of nothing but `undefined`
  // returns `undefined`, which `.where()` accepts as "no constraint" — the
  // same shape the single-condition version had.
  const conditions = [
    match ? eq(products.categoryId, match.id) : undefined,
    audience ? inArray(products.audience, audienceFilter(audience)) : undefined,
  ];

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(...listingOrder(sort))
    .limit(limit);
}

/**
 * The query is bounded rather than unbounded: only the first few words are
 * required, so a pasted sentence runs as "the first six words, all present"
 * instead of an AND of thirty conditions. Terms arrive in the order they were
 * typed, which is the order a shopper narrows in.
 */
const SEARCH_TERM_LIMIT = 6;

/**
 * `%` and `_` are LIKE syntax, not text: someone typing "50%" means the literal
 * characters, and an unescaped pattern would match the whole catalog. Postgres
 * reads `\` as the LIKE escape character by default, and the pattern is bound as
 * a parameter rather than interpolated, so the backslash survives intact.
 */
function searchPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * Free-text search over the fields a shopper can actually see: the piece's
 * name, its category, and its description. Multi-word queries are ANDed term by
 * term — every word has to appear somewhere — which is what lets "coat wool"
 * find the Structured Wool Coat that a whole-phrase match would miss.
 *
 * Matching is `ILIKE` over sequential scans, which is deliberately the simple
 * thing at this catalog size; a `pg_trgm` index is the change to make if the
 * catalog ever grows enough for that to show.
 */
export async function searchProducts(
  query: string,
  options: { limit?: number } = {},
): Promise<Product[]> {
  const { limit = 100 } = options;

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, SEARCH_TERM_LIMIT);

  // An empty box (`?q=`, whitespace) is a question the catalog cannot answer:
  // return nothing rather than the whole catalog dressed up as results.
  if (terms.length === 0) return [];

  const matches = terms.map((term) => {
    const pattern = searchPattern(term);
    return or(
      ilike(products.name, pattern),
      ilike(categories.name, pattern),
      ilike(products.description, pattern),
    );
  });

  // Best match first: a piece whose *name* contains what was typed, then one
  // whose category does, then a description-only hit — so "coat" leads with the
  // coats rather than with the poncho that mentions one. Ties fall back to
  // editorial order, which keeps the result list stable for the same query.
  const phrase = searchPattern(query.trim().toLowerCase());
  const relevance = sql`case
    when ${products.name} ilike ${phrase} then 0
    when ${categories.name} ilike ${phrase} then 1
    else 2
  end`;

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...matches))
    .orderBy(relevance, asc(products.sortOrder), asc(products.id))
    .limit(limit);
}

/**
 * The catalog by recency, newest first — what the New Arrivals page lists, and
 * the only query here that is not editorial order.
 *
 * `createdAt` on its own does not sort the seeded catalog: `seed.ts` inserts
 * every row in one statement, so they all share a timestamp and the tie-break
 * on `sortOrder` is what produces the editorial order the homepage shows. A
 * piece added to the catalog later therefore leads this list.
 */
export async function getLatestProducts(limit = 12): Promise<Product[]> {
  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(
      desc(products.createdAt),
      asc(products.sortOrder),
      asc(products.id),
    )
    .limit(limit);
}

/**
 * Best Sellers rail: the next `limit` pieces in editorial order. Editorial
 * only — sort_order stands in for sales ranking until orders exist.
 */
export function getBestSellers(limit = 4): Promise<Product[]> {
  return getProducts({ limit, offset: limit });
}

/**
 * Memoized with React's `cache`, so `generateMetadata` and the page share one
 * query per request instead of reading the same row twice.
 */
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    const [product] = await db
      .select(productColumns)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug))
      .limit(1);

    return product;
  },
);

/**
 * One piece by its uuid — a lookup only the admin surfaces need, since a
 * storefront URL carries a slug and never an id.
 *
 * The uuid guard is the one `getProductsByIds` applies: a malformed id reaching
 * `where id = $1` is a `22P02`, i.e. a 500, where the caller wanted the same
 * "no such piece" a missing row gives it. Memoized like `getProductBySlug` so a
 * page and its metadata share one query.
 */
export const getProductById = cache(
  async (id: string): Promise<Product | undefined> => {
    if (!isProductId(id)) return undefined;

    const [product] = await db
      .select(productColumns)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    return product;
  },
);

/**
 * The rows behind a bag. Ids arrive from a client-written cookie, so anything that
 * is not a uuid is dropped *here*, before Postgres sees it: `where id in (…)` with a
 * malformed uuid raises `invalid input syntax for type uuid` (22P02), which would
 * turn a tampered cookie into a 500 on `/cart`. The parser rejects the same shapes —
 * two checks on untrusted input reaching SQL is the right amount of paranoia.
 *
 * Order is not meaningful: the caller re-orders by the cookie's line order, so no
 * `orderBy` is applied. An id with no row simply does not come back, which is how a
 * piece that has left the catalog is detected.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const wanted = [...new Set(ids.filter(isProductId))];

  // `inArray(x, [])` degenerates into invalid SQL, so the empty case never reaches it.
  if (wanted.length === 0) return [];

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(products.id, wanted));
}

/** Every slug in the catalog — the input for `generateStaticParams`. */
export async function getProductSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.id));

  return rows.map((row) => row.slug);
}

/**
 * Same-category pieces first, then filled out from the wider catalog so the
 * related rail never looks sparse for a one-of-a-kind category. The boolean
 * sort key works because Postgres orders false before true, so DESC puts the
 * matching category on top.
 */
export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<Product[]> {
  const current = await getProductBySlug(slug);
  if (!current) return [];

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(ne(products.slug, slug))
    .orderBy(
      sql`${products.categoryId} = ${current.categoryId} desc`,
      asc(products.sortOrder),
      asc(products.id),
    )
    .limit(limit);
}

export type Collection = {
  id: string;
  title: string;
  href: string;
  image: string;
  alt: string;
};

/**
 * Marketing tiles for the homepage — not the catalog's categories (nothing here
 * maps to Outerwear or Knitwear), but they do name the same axis the header's
 * collection links do. Pointing them at the listing's own filter URLs makes the
 * "Shop now" land somewhere real instead of a dead `#`.
 */
export const collections: Collection[] = [
  {
    id: "women",
    title: "Women",
    href: "/products?audience=women",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
    alt: "Woman in a burgundy wool coat carrying shopping bags",
  },
  {
    id: "men",
    title: "Men",
    href: "/products?audience=men",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop",
    alt: "Man in a tan leather jacket and sunglasses",
  },
  {
    id: "accessories",
    title: "Accessories",
    href: "/products?category=accessories",
    image:
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1000&auto=format&fit=crop",
    alt: "Gold pendant necklace detail",
  },
];
