"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const copy = {
  "sign-in": { submit: "Sign in", pending: "Signing in…" },
  "sign-up": { submit: "Create account", pending: "Creating account…" },
} as const;

/**
 * One form for both entry points: the fields, the error handling and the
 * redirect are the same, and only the endpoint and two labels differ, so a
 * component per mode would be this file twice.
 *
 * `next` is not sanitised here — it arrived as a prop already passed through
 * src/lib/next-path.ts on the server, which is the only place that can be
 * trusted with it.
 */
export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setPending(true);
    setError(null);

    // Signing up signs the visitor in as well (Better Auth's `autoSignIn`), so
    // both branches end up authenticated and share the redirect below.
    const { error: failure } =
      mode === "sign-up"
        ? await signUp.email({
            email,
            password,
            name: String(formData.get("name") ?? ""),
          })
        : await signIn.email({ email, password });

    if (failure) {
      setError(failure.message || "Something went wrong. Please try again.");
      setPending(false);
      return;
    }

    // The page we are heading to is a Server Component that read the session on
    // the way in; refreshing first keeps a stale copy of it out of the client
    // cache on the way back.
    router.refresh();
    router.push(next);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {mode === "sign-up" && (
        <div className="flex flex-col gap-2">
          <label className="label-caps text-stone" htmlFor="name">
            Name
          </label>
          <input
            className="input"
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="label-caps text-stone" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="label-caps text-stone" htmlFor="password">
          Password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          minLength={8}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          required
        />
        {mode === "sign-up" && (
          <p className="text-sm text-stone">At least 8 characters.</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="btn btn-primary self-start"
        type="submit"
        disabled={pending}
      >
        {pending ? copy[mode].pending : copy[mode].submit}
      </button>
    </form>
  );
}
