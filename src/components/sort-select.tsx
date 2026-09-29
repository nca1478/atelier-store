"use client";

import { useRouter } from "next/navigation";

export type SortOption = {
  value: string;
  label: string;
  href: string;
};

/**
 * The listing's only interactive control. Every option arrives with its href
 * already built by the page, so the query shape stays in one place and this
 * component is nothing more than a native `<select>` that navigates.
 *
 * A platform select (rather than a custom listbox) buys the OS picker on
 * mobile and correct keyboard behavior for free. It is controlled by the
 * server's `value`, so it can never drift from the URL.
 */
export function SortSelect({
  options,
  value,
}: {
  options: SortOption[];
  value: string;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-3">
      <span className="label-caps text-stone">Sort</span>
      <select
        className="select"
        value={value}
        onChange={(event) => {
          const next = options.find(
            (option) => option.value === event.target.value,
          );
          if (next) {
            router.push(next.href);
          }
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
