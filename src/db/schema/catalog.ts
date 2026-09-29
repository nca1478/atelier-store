import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/** A label/value row, rendered by the product page in this order. */
export type ProductDetail = { label: string; value: string };

export const categories = pgTable('categories', {
  /** URL-safe key, e.g. 'outerwear'. */
  id: text('id').primaryKey(),
  /** Display label shown on cards and breadcrumbs, e.g. 'Outerwear'. */
  name: varchar('name', { length: 120 }).notNull().unique(),
  /** Editorial order for category rails. */
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable(
  'products',
  {
    /** URL slug — the storefront links to /products/<id>. */
    id: text('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    categoryId: text('category_id')
      .notNull()
      // Restrict rather than cascade: deleting a category that still holds pieces
      // should fail loudly instead of quietly emptying the catalog.
      .references(() => categories.id, { onDelete: 'restrict' }),
    /** Whole cents, so no float ever holds a price. See `formatPrice`. */
    priceCents: integer('price_cents').notNull(),
    /** Units on hand. 0 means the piece is sold out. */
    stock: integer('stock').notNull().default(0),
    imageUrl: text('image_url').notNull(),
    imageAlt: text('image_alt').notNull(),
    description: text('description').notNull(),
    /** {@link ProductDetail}[] — order is meaningful, hence jsonb over a join table. */
    details: jsonb('details').$type<ProductDetail[]>().notNull().default([]),
    /** Editorial order behind the New Arrivals / Best Sellers rails. */
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check('products_price_cents_check', sql`${table.priceCents} >= 0`),
    check('products_stock_check', sql`${table.stock} >= 0`),
    index('products_category_id_idx').on(table.categoryId),
    index('products_sort_order_idx').on(table.sortOrder),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
