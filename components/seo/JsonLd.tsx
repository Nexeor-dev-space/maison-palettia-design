/**
 * Structured data (schema.org JSON-LD) as an inline `<script>`.
 *
 * ALWAYS USE THIS rather than `JSON.stringify` into `dangerouslySetInnerHTML`
 * by hand. `JSON.stringify` leaves `<` as it is, so an editor-written value
 * containing `</script>` would close the element early and whatever follows
 * would run as HTML on the site's origin. Every `<`, `>` and `&` is written
 * as its `\u` escape (still the same JSON to a parser), and so are U+2028
 * and U+2029, which older JavaScript parsers treat as line breaks.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
