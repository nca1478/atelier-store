import Link from "next/link";

const shopLinks = [
  { href: "/#women", label: "Women" },
  { href: "/#men", label: "Men" },
  { href: "/#accessories", label: "Accessories" },
  { href: "/new-arrivals", label: "New Arrivals" },
];

const helpLinks = ["Shipping", "Returns", "Size Guide", "Contact"];
const companyLinks = ["About", "Journal", "Careers"];

export function SiteFooter() {
  return (
    <footer className="divider">
      <div className="container-shell grid grid-cols-2 gap-10 py-(--spacing-section) sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-4 sm:col-span-1">
          <span className="font-serif text-xl tracking-tightest">Atelier</span>
          <p className="max-w-xs text-sm text-ink-soft">
            Quiet craft, considered detail. Ready-to-wear and accessories made
            to last.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <span className="label-caps text-ink">Shop</span>
          {shopLinks.map((link) => (
            <Link key={link.href} className="link-nav" href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <span className="label-caps text-ink">Help</span>
          {helpLinks.map((label) => (
            <a key={label} className="link-nav" href="#">
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <span className="label-caps text-ink">Company</span>
          {companyLinks.map((label) => (
            <a key={label} className="link-nav" href="#">
              {label}
            </a>
          ))}
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
  );
}
