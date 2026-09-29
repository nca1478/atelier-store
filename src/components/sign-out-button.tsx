"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

/**
 * Ends the session through Better Auth's own endpoint, which clears the cookie and
 * deletes the row in `sessions` — so the sign-out is enforced on the server, not
 * just forgotten by the browser.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut();
    // Nothing here reads the session any more, but the account page does: refresh
    // before leaving so the router cache does not hold a signed-in copy of it.
    router.refresh();
    router.push("/");
  }

  return (
    <button
      className="btn btn-secondary"
      type="button"
      onClick={handleSignOut}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
