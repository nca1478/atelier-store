// The catalog, read from Postgres. Every function here returns the `Product`
// view model the storefront renders, so components stay unaware that the data
// comes from a join rather than the static array this module used to hold.

import { cache } from 'react';
import { asc, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, products } from '@/db/schema';

export type ProductDetail = { label: string; value: string };

export type Product = {
  id: string;
  name: string;
  /** FK to categories.id — ranks the related rail. */
  categoryId: string;
  /** categories.name — the label shown on cards and breadcrumbs. */
  category: string;
  /** Whole cents; see `formatPrice`. */
  priceCents: number;
  image: string;
  alt: string;
  description: string;
  details: ProductDetail[];
  /** Units on hand. 0 means the piece is sold out. */
  stock: number;
};

// One select list for every query below, so the SQL projection and the view
// model cannot drift apart: `category` is the joined label, not a products column.
const productColumns = {
  id: products.id,
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
export const getProductById = cache(
  async (id: string): Promise<Product | undefined> => {
    const [product] = await db
      .select(productColumns)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    return product;
  },
);

/** Every id in the catalog — the input for `generateStaticParams`. */
export async function getProductIds(): Promise<string[]> {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.id));

  return rows.map((row) => row.id);
}

/**
 * Same-category pieces first, then filled out from the wider catalog so the
 * related rail never looks sparse for a one-of-a-kind category. The boolean
 * sort key works because Postgres orders false before true, so DESC puts the
 * matching category on top.
 */
export async function getRelatedProducts(
  id: string,
  limit = 4,
): Promise<Product[]> {
  const current = await getProductById(id);
  if (!current) return [];

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(ne(products.id, id))
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
