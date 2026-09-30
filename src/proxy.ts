import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next 16 renamed the `middleware` file convention to `proxy`; this exports
 * `proxy`, not `middleware`, and runs on the Node.js runtime by default — which
 * is what lets it read Better Auth's cookie at all.
 *
 * The check here is *optimistic*: it asks whether a session cookie is present,
 * never whether the session behind it is still valid, so it can only ever save
 * the visitor a round trip. Authorization proper lives in src/auth/session.ts,
 * next to the data, because this file does not run for Server Functions — a
 * matcher change could quietly remove the coverage without anything failing.
 */
const protectedPrefixes = ["/account", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const path = `${pathname}${search}`;

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!getSessionCookie(request)) {
      const signIn = new URL("/sign-in", request.nextUrl);
      signIn.searchParams.set("next", path);
      return NextResponse.redirect(signIn);
    }
  }

  // Request headers set here reach the app; response headers would not. This is
  // how `requireUser()` learns the page that was asked for, so it can send the
  // visitor back to it after signing in.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Everything except Next's build output, the image optimizer and public
    // files. `/api` stays in scope: only the two prefixes above redirect, and
    // matching it means the auth handler gets `x-pathname` like every other
    // request instead of being a special case.
    //
    // The Stripe webhook is the one exception, and it earns it by being the one
    // endpoint that is not a browser request. It wants no `x-pathname`, has no
    // session cookie to reason about, and carries a body whose exact bytes are a
    // signature. Keeping the payment-critical path out of the one piece of code
    // that runs on every navigation is worth the special case.
    "/((?!api/stripe/webhook|_next/static|_next/image|.*\\..*).*)",
  ],
};
