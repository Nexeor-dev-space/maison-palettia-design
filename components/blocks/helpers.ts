import { ctaProps, type CtaValue } from "@/cms/fields/cta";
import { headingLinesToStrings } from "@/cms/fields/headingLines";
import type { PartnerRecord } from "@/lib/partners";
import type { Media, Venue } from "@/payload-types";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * The small translations every block adapter makes (SPEC §E, §G.1)
 * ==========================================================================
 *
 * A block arrives as Payload stored it — `headingLines` as rows of `{ text }`,
 * a button as `{ label, link: { type, url, anchor } }`, a picture as a Media
 * document — and the section components were written against plain strings,
 * `{ label, href }` and `ImageAsset`. These functions are the whole of that
 * translation, so no adapter re-implements one and no component learns
 * Payload's shapes.
 *
 * THE ONE RULE ABOUT "EMPTY". A component prop left `undefined` means "say
 * what this section has always said" — its default parameter, which is the
 * wording the site shipped with. `null` means "say nothing". Only the launch
 * layout a fixed page falls back to (./layouts.ts — the page's document does
 * not exist yet, e.g. before the seed has run) leaves props `undefined`; an
 * adapter rendering a stored block always passes what the editor left, so
 * clearing an eyebrow in the admin removes it from the page rather than
 * quietly bringing the old wording back. The pattern in every adapter is:
 *
 *     const b = stored(block);            // null for a launch-layout block
 *     <Section eyebrow={b ? text(b.eyebrow) : undefined} … />
 */

/** Marks a block that came from ./layouts.ts rather than from the database. */
export type DefaultBlock = { readonly __default: true };

export function isDefaultBlock(block: object): block is DefaultBlock {
  return (block as Partial<DefaultBlock>).__default === true;
}

/** The stored block, or null for a launch-layout stand-in. */
export function stored<T extends object>(block: T): Exclude<T, DefaultBlock> | null {
  return isDefaultBlock(block) ? null : (block as Exclude<T, DefaultBlock>);
}

/** A stored string with Payload's `null` and the empty string both read as "nothing". */
export function text(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return value.trim() === "" ? null : value;
}

/** `headingLines[] { text }` → the `string[]` <DisplayHeading> takes; null when no row has text. */
export function lines(rows: Array<{ text?: string | null }> | null | undefined): string[] | null {
  const out = headingLinesToStrings(rows);
  return out.length > 0 ? out : null;
}

/** A `cta()` group → `{ label, href }`, or null when either half is missing. */
export function cta(value: CtaValue | null | undefined): { label: string; href: string } | null {
  return ctaProps(value);
}

/**
 * An upload → the site's `ImageAsset`.
 *
 * The ORIGINAL file, not one of the generated sizes: every slot these blocks
 * fill already renders through `next/image` with its own `sizes`, which picks
 * and encodes the width the screen needs. Feeding it the 1200px `plate` would
 * cap the hero and the full-bleed bands below their current sharpness — the
 * parity gate would see it at 1440.
 *
 * The focal point becomes `object-position`, which is what every component's
 * `position` already means. A missing or unpopulated upload is `null` — a
 * deleted photo empties its slot rather than breaking the page (SPEC §D.1).
 */
export function imageOf(value: string | Media | null | undefined): ImageAsset | null {
  if (!value || typeof value === "string" || !value.url) return null;
  const position =
    typeof value.focalX === "number" && typeof value.focalY === "number"
      ? `${round(value.focalX)}% ${round(value.focalY)}%`
      : undefined;
  return {
    src: value.url,
    alt: value.decorative ? "" : (value.alt ?? ""),
    ...(position ? { position } : {}),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** A populated relationship's document, or null when only the id came back. */
export function doc<T extends object>(value: string | T | null | undefined): T | null {
  return value && typeof value === "object" ? value : null;
}

/** The ids (or slugs) of a hasMany relationship, populated or not, in the order picked. */
export function refs<T extends { id: string }>(values: Array<string | T> | null | undefined): string[] {
  return (values ?? []).map((value) => (typeof value === "string" ? value : value.id));
}

/**
 * A venue picked in a block → the site's `PartnerRecord`.
 *
 * The data layer's own record wins when the venue is one it lists (it is
 * the mapper every other surface uses — lib/partners.ts, 2C), so a plate on
 * the homepage and the plate on /locations can never disagree. A venue it
 * does not list — say, an `upcoming` one an editor wants to tease — is
 * mapped here from the fields the plates print.
 */
export function partnerOf(value: string | Venue | null | undefined, known: readonly PartnerRecord[]): PartnerRecord | null {
  const venue = doc(value);
  if (!venue) return null;
  const listed = known.find((partner) => partner.slug === venue.slug);
  if (listed) return listed;
  return {
    slug: venue.slug,
    name: venue.name,
    locality: venue.locality,
    descriptor: venue.descriptor,
    ...(venue.eventDescriptor ? { eventDescriptor: venue.eventDescriptor } : {}),
    ...(venue.locationHref ? { locationHref: venue.locationHref } : {}),
    ...(imageOf(venue.logo) ? { logo: imageOf(venue.logo)! } : {}),
    ...(imageOf(venue.image) ? { image: imageOf(venue.image)! } : {}),
  };
}
