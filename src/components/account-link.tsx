"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

/**
 * The header's account affordance.
 *
 * This is a Client Component on purpose, and it is the one place in the app where
 * that choice is load-bearing rather than stylistic. `SiteHeader` renders in the
 * root layout, which every route shares, and reading `cookies()` anywhere in a
 * layout opts that route into dynamic rendering — which would undo the
 * prerendering the catalog routes rely on (`revalidate = 60`, see CLAUDE.md).
 * Asking the session on the client keeps every server route exactly as it was.
 *
 * The placeholder matches the width of the labels that replace it, so the header
 * does not twitch when the answer arrives.
 */
export function AccountLink() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <span className="link-nav invisible" aria-hidden="true">
        Account
      </span>
    );
  }

  if (session) {
    return (
      <Link className="link-nav" href="/account">
        Account
      </Link>
    );
  }

  return (
    <Link className="link-nav" href="/sign-in">
      Sign in
    </Link>
  );
}
