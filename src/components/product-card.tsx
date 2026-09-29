import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.id}`;

  return (
    <article className="card">
      <Link className="card-media" href={href}>
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-col gap-1">
        <span className="label-caps text-stone">{product.category}</span>
        <Link className="link text-base font-medium" href={href}>
          {product.name}
        </Link>
        <span className="text-sm text-ink-soft">
          {formatPrice(product.price)}
        </span>
      </div>
    </article>
  );
}
