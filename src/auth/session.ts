import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/config";

/**
 * The only place the app reads the session — pages call these instead of reaching
 * for `auth.api` themselves, the same way src/data/products.ts is the only place
 * the storefront reads the catalog.
 *
 * `cache` de-duplicates the lookup within one render pass, so a page and its
 * `generateMetadata` share a single query rather than asking twice.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * The signed-in session, or a redirect to the sign-in form.
 *
 * This is the real check, and it is deliberately not just the proxy: it runs
 * against the database on every render, so a stale cookie whose session has been
 * revoked still lands the visitor on the form.
 */
export async function requireUser() {
  const session = await getSession();

  if (!session) {
    // `x-pathname` is set by src/proxy.ts so the visitor comes back to the page
    // they asked for. It is absent when the proxy did not run, hence the root
    // fallback — worth a landing spot rather than an error.
    const path = (await headers()).get("x-pathname") ?? "/";
    redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  }

  return session;
}

/**
 * Like `requireUser`, but answers `null` for a signed-in visitor who is not an
 * admin instead of throwing. Returning a value rather than an error keeps the
 * decision with the caller: the admin page renders an explicit "not authorized"
 * panel, which says more than a 404 and is what makes the guard visible while
 * the surface is still small.
 */
export async function requireAdmin() {
  const session = await requireUser();

  if (session.user.role !== "admin") {
    return null;
  }

  return session;
}
