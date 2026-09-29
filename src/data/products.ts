// The catalog, read from Postgres. Every function here returns the `Product`
// view model the storefront renders, so components stay unaware that the data
// comes from a join rather than the static array this module used to hold.

import { cache } from "react";
import { asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/db/schema";

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
 */
export async function getProductListing(
  options: { category?: string; sort?: ProductSort; limit?: number } = {},
): Promise<Product[]> {
  const { category, sort = "featured", limit = 100 } = options;
  const allCategories = await getCategories();
  const match = allCategories.find((item) => item.slug === category);

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(match ? eq(products.categoryId, match.id) : undefined)
    .orderBy(...listingOrder(sort))
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
 * maps to Outerwear or Knitwear). Stays in code until there are collection
 * landing pages to point at.
 */
export const collections: Collection[] = [
  {
    id: "women",
    title: "Women",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
    alt: "Woman in a burgundy wool coat carrying shopping bags",
  },
  {
    id: "men",
    title: "Men",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=1000&auto=format&fit=crop",
    alt: "Man in a tan leather jacket and sunglasses",
  },
  {
    id: "accessories",
    title: "Accessories",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1000&auto=format&fit=crop",
    alt: "Gold pendant necklace detail",
  },
];
