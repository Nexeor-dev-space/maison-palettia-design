/**
 * Blurred stand-ins for photographs held in code rather than the CMS.
 *
 * A few content seams lay photographs from public/images/ over what the CMS
 * answers (the activities' own pages, the programme banners). Those have no
 * media document, so no `blurDataURL`; this fills `blur` in on every
 * `{ src, alt }` in the data that has none, from the table
 * scripts/generate-image-blurs.mjs writes.
 *
 * THE TABLE IS LOADED HERE, ON DEMAND, AND ONLY HERE. These seams are also
 * imported by client components for their types and constants, so a static
 * import would put ~20KB of base64 into the browser bundle of every page.
 * Behind `import()` it is a separate chunk that only the server ever asks
 * for, because only the server calls the getters this is used in.
 */
export async function withStaticBlurs<T>(value: T): Promise<T> {
  const { STATIC_BLURS } = await import("@/lib/staticBlurs.generated");
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== "object" || Object.getPrototypeOf(node) !== Object.prototype) return node;
    const record = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(record)) out[key] = visit(child);
    if (typeof record.src === "string" && typeof record.alt === "string" && !record.blur) {
      const blur = STATIC_BLURS[record.src];
      if (blur) out.blur = blur;
    }
    return out;
  };
  return visit(value) as T;
}
