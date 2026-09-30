import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export type ProductDetail = { label: string; value: string };

/**
 * Who a piece is cut for. The vocabulary lives here rather than in `src/data/`
 * because the `CHECK` constraint below needs it and the schema must not depend
 * on the data layer; `seed.ts` and `products.ts` import it from here, so the
 * union cannot drift from the column it describes.
 *
 * `unisex` is inclusive, not a third shelf: the listing widens `women` and `men`
 * to include it (see `getProductListing`).
 */
export const audienceValues = ["women", "men", "unisex"] as const;
export type Audience = (typeof audienceValues)[number];

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    // A second classification axis, independent of the category: `Accessories`
    // is a category, `women` is an audience. The default is what makes the
    // migration safe on a table that already has rows — Postgres rejects
    // `ADD COLUMN ... NOT NULL` without one — and it is the neutral value, so
    // any row the seed does not cover is still reachable from both rails.
    audience: varchar("audience", { length: 16 })
      .$type<Audience>()
      .notNull()
      .default("unisex"),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull(),
    description: text("description").notNull(),
    details: jsonb("details").$type<ProductDetail[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("products_price_cents_check", sql`${table.priceCents} >= 0`),
    check("products_stock_check", sql`${table.stock} >= 0`),
    // `varchar` + `CHECK` rather than a `pgEnum`, matching `users.role`: adding
    // a value later is an `ALTER TABLE`, not an `ALTER TYPE ... ADD VALUE`,
    // which cannot run inside a transaction.
    check(
      "products_audience_check",
      sql`${table.audience} in ('women', 'men', 'unisex')`,
    ),
    index("products_category_id_idx").on(table.categoryId),
    index("products_sort_order_idx").on(table.sortOrder),
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
