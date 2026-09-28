import Image from "next/image";
import type { Product } from "@/data/products";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <a className="card-media" href="#">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      </a>
      <div className="flex flex-col gap-1">
        <span className="label-caps text-stone">{product.category}</span>
        <a className="link text-base font-medium" href="#">
          {product.name}
        </a>
        <span className="text-sm text-ink-soft">
          {currency.format(product.price)}
        </span>
      </div>
    </article>
  );
}
