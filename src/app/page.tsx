import Image from "next/image";
import { collections, products } from "@/data/products";
import { ProductCard } from "@/components/product-card";

const newArrivals = products.slice(0, 4);
const bestSellers = products.slice(4, 8);

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="divider sticky top-0 z-20 bg-paper/95 backdrop-blur">
        <div className="container-shell flex h-20 items-center justify-between">
          <span className="font-serif text-2xl tracking-tightest">
            Atelier
          </span>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="link-nav" href="#new-arrivals">
              New Arrivals
            </a>
            <a className="link-nav" href="#women">
              Women
            </a>
            <a className="link-nav" href="#men">
              Men
            </a>
            <a className="link-nav" href="#accessories">
              Accessories
            </a>
          </nav>
          <div className="flex items-center gap-6">
            <a className="link-nav hidden sm:inline" href="#">
              Search
            </a>
            <a className="link-nav" href="#">
              Bag (0)
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero ---------------------------------------------------------- */}
        <section className="relative flex h-[92vh] min-h-[38rem] items-end overflow-hidden bg-ink">
          <Image
            src="https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=2000&auto=format&fit=crop"
            alt="Model in a tailored teal jumpsuit against an architectural backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(26,24,21,0.75) 0%, rgba(26,24,21,0.15) 55%, rgba(26,24,21,0.05) 100%)",
            }}
          />
          <div className="container-shell relative flex flex-col items-start gap-6 pb-(--spacing-section)">
            <span className="label-caps text-bone">Fall / Winter</span>
            <h1 className="max-w-2xl text-5xl text-paper">
              Quiet craft, considered detail.
            </h1>
            <p className="max-w-prose text-base text-bone/90">
              A storefront built on restraint: generous whitespace, hairline
              borders, and typography that lets the product speak.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a className="btn btn-primary" href="#new-arrivals">
                Shop the edit
              </a>
              <a
                className="btn border-paper text-paper hover:bg-paper hover:text-ink btn-secondary"
                href="#editorial"
              >
                View lookbook
              </a>
            </div>
          </div>
        </section>

        {/* Value strip ----------------------------------------------------- */}
        <section className="divider">
          <div className="container-shell grid grid-cols-1 gap-6 py-8 text-center sm:grid-cols-3">
            <p className="label-caps text-stone">Complimentary Shipping</p>
            <p className="label-caps text-stone">30-Day Returns</p>
            <p className="label-caps text-stone">Made to Last</p>
          </div>
        </section>

        {/* Featured collections --------------------------------------------- */}
        <section className="divider">
          <div className="container-shell flex flex-col gap-10 py-(--spacing-section)">
            <div className="flex flex-col gap-2">
              <span className="label-caps text-stone">Shop by Collection</span>
              <h2 className="text-3xl">Curated for every wardrobe</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {collections.map((collection) => (
                <a
                  key={collection.id}
                  id={collection.id}
                  href={collection.href}
                  className="group relative flex aspect-[3/4] items-end overflow-hidden bg-bone"
                >
                  <Image
                    src={collection.image}
                    alt={collection.alt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-slow ease-(--ease-editorial) group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(26,24,21,0.55) 0%, rgba(26,24,21,0) 45%)",
                    }}
                  />
                  <span className="relative flex w-full items-center justify-between p-6 text-paper">
                    <span className="font-serif text-2xl">
                      {collection.title}
                    </span>
                    <span className="label-caps">Shop now</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* New arrivals ------------------------------------------------------ */}
        <section className="divider" id="new-arrivals">
          <div className="container-shell flex flex-col gap-10 py-(--spacing-section)">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="label-caps text-stone">Just In</span>
                <h2 className="text-3xl">New Arrivals</h2>
              </div>
              <a className="link text-sm" href="#">
                View all
              </a>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Editorial banner ---------------------------------------------------- */}
        <section className="divider relative" id="editorial">
          <div className="relative grid grid-cols-1 lg:grid-cols-2">
            <div className="relative aspect-[4/5] lg:aspect-auto">
              <Image
                src="https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=1600&auto=format&fit=crop"
                alt="Two models in embellished red evening wear, an editorial campaign shot"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex items-center bg-bone">
              <div className="flex flex-col items-start gap-6 px-(--container-gutter) py-(--spacing-section) lg:px-(--container-gutter-lg)">
                <span className="label-caps text-stone">The Atelier Edit</span>
                <h2 className="max-w-md text-4xl">
                  Evening, reimagined.
                </h2>
                <p className="max-w-prose text-base text-ink-soft">
                  A capsule of occasion pieces cut from archive fabrics —
                  produced in small runs with the same ateliers behind our
                  ready-to-wear.
                </p>
                <a className="btn btn-primary" href="#">
                  Explore the campaign
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Best sellers -------------------------------------------------------- */}
        <section className="divider">
          <div className="container-shell flex flex-col gap-10 py-(--spacing-section)">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="label-caps text-stone">Most Loved</span>
                <h2 className="text-3xl">Best Sellers</h2>
              </div>
              <a className="link text-sm" href="#">
                View all
              </a>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter ------------------------------------------------------------ */}
        <section className="divider bg-bone">
          <div className="container-shell flex flex-col items-center gap-6 py-(--spacing-section) text-center">
            <span className="label-caps text-stone">Stay in Touch</span>
            <h2 className="max-w-lg text-3xl">
              Join the list for early access and private sales.
            </h2>
            <form className="flex w-full max-w-md flex-col gap-3 pt-2 sm:flex-row">
              <input
                type="email"
                required
                placeholder="Email address"
                className="input"
                aria-label="Email address"
              />
              <button type="submit" className="btn btn-primary shrink-0">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="divider">
        <div className="container-shell grid grid-cols-2 gap-10 py-(--spacing-section) sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-1">
            <span className="font-serif text-xl tracking-tightest">
              Atelier
            </span>
            <p className="max-w-xs text-sm text-ink-soft">
              Quiet craft, considered detail. Ready-to-wear and accessories
              made to last.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="label-caps text-ink">Shop</span>
            <a className="link-nav" href="#women">
              Women
            </a>
            <a className="link-nav" href="#men">
              Men
            </a>
            <a className="link-nav" href="#accessories">
              Accessories
            </a>
            <a className="link-nav" href="#new-arrivals">
              New Arrivals
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="label-caps text-ink">Help</span>
            <a className="link-nav" href="#">
              Shipping
            </a>
            <a className="link-nav" href="#">
              Returns
            </a>
            <a className="link-nav" href="#">
              Size Guide
            </a>
            <a className="link-nav" href="#">
              Contact
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="label-caps text-ink">Company</span>
            <a className="link-nav" href="#">
              About
            </a>
            <a className="link-nav" href="#">
              Journal
            </a>
            <a className="link-nav" href="#">
              Careers
            </a>
          </div>
        </div>
        <div className="divider">
          <div className="container-shell flex flex-col gap-2 py-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Atelier. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="link-nav" href="#">
                Privacy
              </a>
              <a className="link-nav" href="#">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
