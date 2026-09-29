import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1">
      <div className="container-shell flex flex-col items-start gap-6 py-(--spacing-section-lg)">
        <span className="label-caps text-stone">Error 404</span>
        <h1 className="max-w-lg text-4xl">
          This piece is no longer in the collection.
        </h1>
        <p className="max-w-prose text-base text-ink-soft">
          The page you were looking for has moved, sold out, or never existed.
          Browse the current edit instead.
        </p>
        <Link className="btn btn-primary" href="/">
          Back to the store
        </Link>
      </div>
    </main>
  );
}
