const promises = [
  "Complimentary Shipping",
  "30-Day Returns",
  "Made to Last",
];

export function ValueStrip() {
  return (
    <section className="divider">
      <div className="container-shell grid grid-cols-1 divide-y divide-line py-(--spacing-section-sm) text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {promises.map((promise) => (
          <p key={promise} className="label-caps py-4 text-stone sm:py-0">
            {promise}
          </p>
        ))}
      </div>
    </section>
  );
}
