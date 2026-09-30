import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/auth/session";
import { AdminRestricted } from "@/components/admin-restricted";

export const metadata: Metadata = {
  title: "Admin — Atelier",
  description: "Atelier administration.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireAdmin();

  if (!session) {
    return <AdminRestricted trail={[]} current="Admin" />;
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

        <div className="flex flex-col items-start gap-4">
          <h2 className="text-2xl">Inventory</h2>
          <p className="max-w-prose text-base text-ink-soft">
            Every piece and what is on the shelf, with a ledger of what moved it
            and who did the moving.
          </p>
          <Link className="btn btn-secondary" href="/admin/products">
            Manage inventory
          </Link>
        </div>
      </section>
    </main>
  );
}
