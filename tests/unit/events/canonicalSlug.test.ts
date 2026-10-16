import { describe, expect, it } from "vitest";

import { canonicalSlugOf } from "@/lib/eventDetail";
import type { CreativeExperience } from "@/lib/experiences";
import type { WorkshopType } from "@/lib/workshopTypes";
import type { Workshop } from "@/types";

/**
 * Which page a dated session names as canonical (lib/eventDetail.ts): its
 * published workshop type, else its published activity, else itself.
 */
const session = {
  slug: "crochet-beginners-2026-11-16-1100",
  experienceSlug: "crocheting",
  workshopType: { slug: "crochet-beginners", name: "Crochet — Beginners" },
} as Workshop & { experienceSlug: string };

const types = [{ slug: "crochet-beginners" }] as WorkshopType[];
const experiences = [{ slug: "crocheting" }] as CreativeExperience[];

describe("canonicalSlugOf", () => {
  it("defers to the session's workshop type page", () => {
    expect(canonicalSlugOf(session, types, experiences)).toBe("crochet-beginners");
  });

  it("falls back to the activity page when the type is not published", () => {
    expect(canonicalSlugOf(session, [], experiences)).toBe("crocheting");
  });

  it("is its own canonical with nothing published to defer to", () => {
    expect(canonicalSlugOf(session, [], [])).toBe(session.slug);
  });
});
