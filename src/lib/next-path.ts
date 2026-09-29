import { firstParam } from "@/lib/search-params";

/**
 * Where to send someone once they are signed in. The value arrives from `?next=`,
 * which makes it user input, so it is not enough for it to start with `/`:
 * browsers read `//evil.com` and `/\evil.com` as protocol-relative URLs and would
 * carry the visitor off the site. Anything that is not a plain same-site path
 * falls back to the account page, so a bad value costs a redirect rather than a
 * phishing hop.
 */
export function safeNextPath(value: string | string[] | undefined): string {
  const path = firstParam(value);

  if (!path?.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return "/account";
  }

  return path;
}
