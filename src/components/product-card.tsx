import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { CardAddButton } from "@/components/card-add-button";
import { ProductStockBadge } from "@/components/product-stock-badge";
import { describeStock } from "@/components/stock-status";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;
  // The tile of a piece nobody can buy: the image recedes and holds still (see
  // `.card-sold-out` in globals.css). Asked of `describeStock` rather than
  // `stock <= 0` so the class and the badge can never disagree about the state.
  const soldOut = describeStock(product.stock).state === "out";

  return (
    <article className={soldOut ? "card card-sold-out" : "card"}>
      <Link className="card-media" href={href}>
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        <ProductStockBadge stock={product.stock} />
      </Link>
      <div className="flex flex-col gap-1">
        <span className="label-caps text-stone">{product.category}</span>
        <Link className="link text-base font-medium" href={href}>
          {product.name}
        </Link>
        <span className="text-sm text-ink-soft">
          {formatPrice(product.priceCents)}
        </span>
        {/* The card's only client boundary — the tile itself stays a Server
            Component, so a grid of them ships one small island per tile. */}
        <CardAddButton productId={product.id} stock={product.stock} />
      </div>
    </article>
  );
}
