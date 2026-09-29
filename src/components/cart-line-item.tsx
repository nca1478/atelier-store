import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { CartLineControls } from "@/components/cart-line-controls";
import type { CartLineView } from "@/data/cart";

/**
 * One row of `/cart`. A Server Component: everything numbers-shaped in it — the
 * unit price, the line total — is resolved from the database before it renders, and
 * only the controls island beside it is interactive. That is what lets the page show
 * current prices with JavaScript disabled.
 */
export function CartLineItem({ line }: { line: CartLineView }) {
  const { product, quantity, requestedQuantity, lineTotalCents, issue } = line;

  return (
    <li className="divider flex gap-4 py-6 sm:gap-6">
      {product ? (
        <Link
          className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-bone sm:w-24"
          href={`/products/${product.slug}`}
        >
          <Image
            src={product.image}
            alt={product.alt}
            fill
            sizes="96px"
            className="object-cover"
          />
        </Link>
      ) : (
        <div className="flex aspect-[3/4] w-20 shrink-0 items-center justify-center bg-bone p-2 sm:w-24">
          <span className="label-caps text-center text-stone">Unavailable</span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {product && (
          <span className="label-caps text-stone">{product.category}</span>
        )}

        {product ? (
          <Link
            className="link text-base font-medium"
            href={`/products/${product.slug}`}
          >
            {product.name}
          </Link>
        ) : (
          <span className="text-base font-medium text-stone">
            This piece is no longer available
          </span>
        )}

        {product && (
          <span className="text-sm text-ink-soft">
            {formatPrice(product.priceCents)}
          </span>
        )}

        {issue === "reduced" && product && (
          <p className="text-sm text-accent">
            Only {product.stock} left — reduced from {requestedQuantity}.
          </p>
        )}

        {issue === "unavailable" && product && (
          <p className="text-sm text-stone">
            Sold out — remove it from your bag.
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-3">
        <span className="text-base tabular-nums">
          {formatPrice(lineTotalCents)}
        </span>
        <CartLineControls
          productId={line.productId}
          quantity={quantity}
          stock={product?.stock ?? 0}
        />
      </div>
    </li>
  );
}
