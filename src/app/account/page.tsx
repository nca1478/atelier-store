import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/auth/session";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Account — Atelier",
  description: "Your Atelier account.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  // Past this line the visitor is signed in. `requireUser` redirects to
  // /sign-in?next=… otherwise — the same decision proxy.ts makes, except this one
  // asks the database rather than trusting the presence of a cookie.
  const { user } = await requireUser();

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
            Account
          </span>
        </nav>
      </div>

      <section className="container-prose flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Your Account</span>
          <h1 className="break-words text-4xl">
            {user.name ? `Hello, ${user.name}` : "Your account"}
          </h1>
        </div>

        <dl className="flex flex-col">
          <div className="divider flex items-baseline justify-between gap-6 py-4">
            <dt className="label-caps text-stone">Name</dt>
            <dd className="text-base">{user.name ?? "—"}</dd>
          </div>
          <div className="divider flex items-baseline justify-between gap-6 py-4">
            <dt className="label-caps text-stone">Email</dt>
            <dd className="break-all text-base">{user.email}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-4">
          {/* The only route to /admin. Showing it to admins alone keeps the
              decision to enter an admin area with the person who has the role. */}
          {user.role === "admin" && (
            <Link className="btn btn-secondary" href="/admin">
              Admin
            </Link>
          )}
          <Link className="btn btn-secondary" href="/account/orders">
            Order history
          </Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
