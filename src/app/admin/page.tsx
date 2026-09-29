import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/auth/session";

export const metadata: Metadata = {
  title: "Admin — Atelier",
  description: "Atelier administration.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireAdmin();

  // Signed in, but without the role. This is shown rather than hidden behind a
  // 404: an admin area that silently pretends not to exist is harder to reason
  // about, and the difference between "not signed in" (a redirect to the form)
  // and "not allowed" (this) is the whole point of having a role.
  if (!session) {
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
            <span className="label-caps text-stone" aria-hidden="true">
              /
            </span>
            <span className="label-caps text-ink" aria-current="page">
              Admin
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
          <span className="label-caps text-stone" aria-hidden="true">
            /
          </span>
          <span className="label-caps text-ink" aria-current="page">
            Admin
          </span>
        </nav>
      </div>

      <section className="container-prose flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Restricted</span>
          <h1 className="break-words text-4xl">Admin</h1>
          <p className="text-base text-ink-soft">
            Signed in as {session.user.email}, with the admin role.
          </p>
        </div>

        <p className="text-base text-ink-soft">
          There is nothing to manage here yet — the catalog is still read-only and
          has no write path outside <code className="text-ink">src/db/seed.ts</code>.
          This page exists so the role has somewhere to prove itself.
        </p>
      </section>
    </main>
  );
}
