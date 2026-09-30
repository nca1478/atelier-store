import { Fragment } from "react";
import Link from "next/link";

/**
 * What a signed in visitor without the admin role sees in place of an admin
 * page.
 *
 * Shown rather than hidden behind a 404: an admin area that silently pretends
 * not to exist is harder to reason about, and the difference between "not signed
 * in" (a redirect to the form) and "not allowed" (this) is the whole point of
 * having a role. Extracted from `admin/page.tsx` once a second admin page needed
 * the same paragraph, so the two cannot drift into saying different things.
 *
 * `trail` is every crumb before the current page; `current` is the page itself.
 */
export function AdminRestricted({
  trail,
  current,
}: {
  trail: { href: string; label: string }[];
  current: string;
}) {
  return (
    <main className="flex-1">
      <div className="divider">
        <nav
          className="container-shell flex flex-wrap items-center gap-2 py-4"
          aria-label="Breadcrumb"
        >
          <Link className="link-nav" href="/">
            Home
          </Link>
          {trail.map((crumb) => (
            <Fragment key={crumb.href}>
              <span className="label-caps text-stone" aria-hidden="true">
                /
              </span>
              <Link className="link-nav" href={crumb.href}>
                {crumb.label}
              </Link>
            </Fragment>
          ))}
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            {current}
          </span>
        </nav>
      </div>

      <section className="container-prose flex flex-col items-start gap-6 py-(--spacing-section)">
        <span className="label-caps text-stone">Restricted</span>
        <h1 className="text-4xl">Not authorized</h1>
        <p className="text-base text-ink-soft">
          This area is limited to administrators. Your account is signed in, but
          does not carry the <code className="text-ink">admin</code> role.
        </p>
        <Link className="btn btn-secondary" href="/account">
          Back to your account
        </Link>
      </section>
    </main>
  );
}
