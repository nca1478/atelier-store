import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/auth/session";
import { safeNextPath } from "@/lib/next-path";

export const metadata: Metadata = {
  title: "Sign in — Atelier",
  description: "Sign in to your Atelier account.",
  // A form is not a landing page: keep it out of the index entirely.
  robots: { index: false, follow: false },
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const next = safeNextPath((await props.searchParams).next);

  // Someone who is already signed in has no business on the form. Sending them
  // where a successful sign-in would have gone keeps the two paths identical.
  if (await getSession()) {
    redirect(next);
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
            Sign in
          </span>
        </nav>
      </div>

      <section className="container-prose flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Your Account</span>
          <h1 className="text-4xl">Welcome back</h1>
          <p className="text-base text-ink-soft">
            Sign in to reach your account.
          </p>
        </div>

        <AuthForm mode="sign-in" next={next} />

        <p className="text-base text-ink-soft">
          No account yet?{" "}
          {/* `next` rides along so that creating an account lands in the same
              place signing in would have. */}
          <Link
            className="link"
            href={`/sign-up?next=${encodeURIComponent(next)}`}
          >
            Create one
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
