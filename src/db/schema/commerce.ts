import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./catalog";
import { users } from "./users";

/**
 * Where an order is in its life. The vocabulary lives here rather than in
 * `src/data/` because the `CHECK` constraint below needs it, the same way
 * `audienceValues` serves `products.audience`.
 *
 * `paid` is terminal — nothing returns stock from it. A refund or a cancellation
 * of a paid order is a deliberate later addition, not a state this table is
 * quietly waiting for.
 */
export const orderStatusValues = [
  "pending",
  "paid",
  "failed",
  "expired",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatusValues)[number];

/** Stripe's `shipping_details.address`, snapshotted — it is not a value we query by. */
export type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Signed-in checkout only, so this is never null. `restrict` rather than a
    // cascade: an order outlives the account's usefulness and must not vanish
    // with it.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // A snapshot. Stripe collects a receipt address that can differ from the
    // account's, so the order keeps whichever one was current when it was placed.
    email: varchar("email", { length: 255 }).notNull(),
    status: varchar("status", { length: 16 })
      .$type<OrderStatus>()
      .notNull()
      .default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    // No shipping is charged yet, so `total` equals `subtotal` today. Both exist
    // anyway: the moment a shipping rate appears only one of them changes, and a
    // single column would have to be reinterpreted.
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    // Null between the order's insert and Stripe's answer. Unique because a
    // session identifies at most one order.
    stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }).unique(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    // When the stock hold lapses. Stripe expires the session at the same moment,
    // and `checkout.session.expired` is what actually returns the stock.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "orders_status_check",
      sql`${table.status} in ('pending', 'paid', 'failed', 'expired', 'cancelled')`,
    ),
    check("orders_subtotal_cents_check", sql`${table.subtotalCents} >= 0`),
    check("orders_total_cents_check", sql`${table.totalCents} >= 0`),
    // The "does this shopper already have an open order" lookup that every
    // checkout starts with.
    index("orders_user_id_status_idx").on(table.userId, table.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Name, slug and unit price are copied, not joined. The bag was priced from
    // `products` when the order was placed and `seed.ts` can reseed the catalog
    // afterwards — an order must not change because someone re-ran the seed, and
    // a piece that later leaves the catalog must still read correctly on the
    // order it appeared in.
    productName: varchar("product_name", { length: 200 }).notNull(),
    productSlug: varchar("product_slug", { length: 120 }).notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [
    check("order_items_unit_price_cents_check", sql`${table.unitPriceCents} >= 0`),
    check("order_items_quantity_check", sql`${table.quantity} > 0`),
    check("order_items_line_total_cents_check", sql`${table.lineTotalCents} >= 0`),
    // One row per piece, the same way the cart cookie holds one line per id.
    unique("order_items_order_id_product_id_unique").on(table.orderId, table.productId),
    index("order_items_order_id_idx").on(table.orderId),
  ],
);

/**
 * The webhook idempotency ledger: one row per Stripe event we have already acted
 * on, inserted in the same transaction as that action. Stripe retries deliveries
 * and can deliver the same event twice, so "have I seen `evt_…` before" has to be
 * answerable inside the transaction that would otherwise act on it again.
 */
export const stripeEvents = pgTable("stripe_events", {
  // Stripe's own `evt_…` id, which is stable across retries of the same event.
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 120 }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Why a row of stock moved. The vocabulary lives here rather than in `src/data/`
 * for the same reason `orderStatusValues` does: the `CHECK` below needs it, and
 * a constant the schema cannot import would let the two drift.
 *
 *   reservation — a checkout took stock (`createOrderForCart`)
 *   release     — a hold came back (`releaseOrderHold`: expired, failed, cancelled)
 *   adjustment  — an administrator moved the number by hand
 */
export const inventoryMovementReasonValues = [
  "reservation",
  "release",
  "adjustment",
] as const;
export type InventoryMovementReason =
  (typeof inventoryMovementReasonValues)[number];

/**
 * The stock ledger: every change to `products.stock`, and who made it.
 *
 * This is a record *beside* the column, not a replacement for it.
 * `products.stock` stays the authority — the number a shopper is sold against —
 * and this table is what answers "why is the stock 7?". Never sum `delta` to
 * rebuild the column: `seed.ts` writes stock without a movement, and a ledger
 * that is treated as the source of truth would be wrong the first time it ran.
 *
 * Append only, like `stripe_events`: no `updatedAt`, no updates, no deletes. A
 * movement is a fact about a moment, and a fact does not get revised.
 */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // `restrict` mirrors `order_items.product_id`: a piece with any history —
    // an order or a single adjustment — cannot be hard deleted. Retire a piece
    // by driving its stock to zero, do not delete it.
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Signed, and never zero: a movement that moved nothing is not a movement.
    // Negative takes stock off the shelf, positive puts it back.
    delta: integer("delta").notNull(),
    reason: varchar("reason", { length: 32 })
      .$type<InventoryMovementReason>()
      .notNull(),
    // Null for an adjustment, which has no order behind it. `restrict` rather
    // than `set null`: nothing deletes orders today, and the attribution must
    // not vanish quietly if something ever does.
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "restrict",
    }),
    // Null for an automatic movement — a reservation or a release has no human
    // behind it. Matches `orders.user_id`: the account outlives its usefulness.
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    // An observation, written from the same `UPDATE`'s `RETURNING` in the same
    // transaction, so it is true for this row. Cheap to read, and the `CHECK`
    // below catches a bug that would compute it wrongly. Not a source of truth.
    stockAfter: integer("stock_after").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("inventory_movements_delta_check", sql`${table.delta} <> 0`),
    check(
      "inventory_movements_stock_after_check",
      sql`${table.stockAfter} >= 0`,
    ),
    check(
      "inventory_movements_reason_check",
      sql`${table.reason} in ('reservation', 'release', 'adjustment')`,
    ),
    // "This piece's movements, newest first" — the admin history view's query.
    index("inventory_movements_product_id_created_at_idx").on(
      table.productId,
      table.createdAt,
    ),
    // "The movements behind this order" — the drill-down from an order.
    index("inventory_movements_order_id_idx").on(table.orderId),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  movements: many(inventoryMovements),
}));

export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryMovements.productId],
      references: [products.id],
    }),
    order: one(orders, {
      fields: [inventoryMovements.orderId],
      references: [orders.id],
    }),
    actor: one(users, {
      fields: [inventoryMovements.actorUserId],
      references: [users.id],
    }),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
