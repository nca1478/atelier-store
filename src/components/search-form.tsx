import Form from "next/form";

/**
 * The catalog's search box. `next/form` is what keeps this a Server Component:
 * given a string `action` it encodes the field into the URL as `?q=` and
 * navigates client-side, so there is no router call and no state to keep in
 * sync — and the same form still submits as a plain GET with JavaScript off.
 *
 * The field is uncontrolled (`defaultValue`): the URL is the only source of
 * truth, so typing changes nothing until the form is submitted.
 */
export function SearchForm({ query = "" }: { query?: string }) {
  return (
    <Form
      action="/search"
      className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      <input
        className="input"
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Try “wool”, “leather” or “outerwear”"
        aria-label="Search the catalog"
        autoComplete="off"
        enterKeyHint="search"
      />
      <button className="btn btn-primary shrink-0" type="submit">
        Search
      </button>
    </Form>
  );
}
