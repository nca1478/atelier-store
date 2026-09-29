import Link from "next/link";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/#women", label: "Women" },
  { href: "/#men", label: "Men" },
  { href: "/#accessories", label: "Accessories" },
];

export function SiteHeader() {
  return (
    <header className="divider sticky top-0 z-20 bg-paper/95 backdrop-blur">
      <div className="container-shell flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          <details className="group relative md:hidden">
            <summary className="label-caps flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav className="divider absolute left-0 top-[calc(100%+1.25rem)] z-30 flex w-48 flex-col gap-4 bg-paper p-6 shadow-sm">
              {/* Search is a field-width control on desktop, so on phones it
                  only has a home in here. */}
              <Link className="link-nav" href="/search">
                Search
              </Link>
              {navLinks.map((link) => (
                <Link key={link.href} className="link-nav" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
          <Link className="font-serif text-2xl tracking-tightest" href="/">
            Atelier
          </Link>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} className="link-nav" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <Link className="link-nav hidden sm:inline" href="/search">
            Search
          </Link>
          <a className="link-nav" href="#">
            Bag (0)
          </a>
        </div>
      </div>
    </header>
  );
}
