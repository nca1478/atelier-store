import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { OrderItemView } from "@/data/orders";

/**
 * The pieces on one order. Shared by the confirmation page and the account's
 * order detail, because they answer the same question with the same numbers.
 *
 * Everything here is a snapshot — `order_items` copies the name, slug and unit
 * price at reservation time — so an order reads the same after the catalog is
 * reseeded, repriced or re-slugged.
 */
export function OrderLines({ items }: { items: OrderItemView[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li
          // `order_items` is unique on (order_id, product_id), so a piece can
          // appear on an order exactly once and this key cannot repeat.
          key={item.productId}
          className="divider flex items-baseline justify-between gap-6 py-5"
        >
          <div className="flex flex-col gap-1">
            <Link
              className="link-nav text-ink"
              href={`/products/${item.productSlug}`}
            >
              {item.productName}
            </Link>
            <span className="text-sm text-stone">
              {item.quantity} × {formatPrice(item.unitPriceCents)}
            </span>
          </div>
          <span className="text-base tabular-nums">
            {formatPrice(item.lineTotalCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
