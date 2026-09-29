import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/auth/session";
import { safeNextPath } from "@/lib/next-path";

export const metadata: Metadata = {
  title: "Create account — Atelier",
  description: "Create an Atelier account.",
  robots: { index: false, follow: false },
};

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const next = safeNextPath((await props.searchParams).next);

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
            Create account
          </span>
        </nav>
      </div>

      <section className="container-prose flex flex-col gap-10 py-(--spacing-section)">
        <div className="flex flex-col gap-3">
          <span className="label-caps text-stone">Your Account</span>
          <h1 className="text-4xl">Create an account</h1>
          <p className="text-base text-ink-soft">
            An account keeps your details in one place for when the atelier opens
            its checkout.
          </p>
        </div>

        <AuthForm mode="sign-up" next={next} />

        <p className="text-base text-ink-soft">
          Already have an account?{" "}
          <Link
            className="link"
            href={`/sign-in?next=${encodeURIComponent(next)}`}
          >
            Sign in
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
