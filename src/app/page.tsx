export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="divider">
        <div className="container-shell flex h-20 items-center justify-between">
          <span className="font-serif text-2xl tracking-tightest">
            Atelier
          </span>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="link-nav" href="#">
              New Arrivals
            </a>
            <a className="link-nav" href="#">
              Women
            </a>
            <a className="link-nav" href="#">
              Men
            </a>
            <a className="link-nav" href="#">
              Accessories
            </a>
          </nav>
          <div className="flex items-center gap-6">
            <a className="link-nav" href="#">
              Search
            </a>
            <a className="link-nav" href="#">
              Bag (0)
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container-shell flex flex-col items-start gap-6 py-(--spacing-section-lg)">
          <span className="label-caps text-stone">Fall / Winter</span>
          <h1 className="max-w-2xl text-5xl">
            Quiet craft, considered detail.
          </h1>
          <p className="max-w-prose text-base text-ink-soft">
            A storefront built on restraint: generous whitespace, hairline
            borders, and typography that lets the product speak.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button className="btn btn-primary">Shop the edit</button>
            <button className="btn btn-secondary">View lookbook</button>
          </div>
        </section>

        <section className="divider">
          <div className="container-shell grid grid-cols-2 gap-x-6 gap-y-10 py-(--spacing-section) sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <article className="card" key={i}>
                <div className="card-media" />
                <div className="flex flex-col gap-1">
                  <span className="label-caps text-stone">Ready-to-wear</span>
                  <a className="link text-sm" href="#">
                    Structured wool coat
                  </a>
                  <span className="text-sm text-ink-soft">$2,400</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="divider">
        <div className="container-shell flex flex-col gap-4 py-(--spacing-section-sm) text-sm text-ink-soft">
          <span className="label-caps text-ink">Atelier</span>
          <p>&copy; {new Date().getFullYear()} Atelier. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
