import { describe, expect, it } from "vitest";

import { seededMediaSource } from "@/cms/lib/seededMedia";

describe("seededMediaSource", () => {
  it("resolves a seeded original to its public source", () => {
    expect(seededMediaSource("mobile-hero.png")).toBe("images/mobile-hero.png");
    expect(seededMediaSource("scroll-logo.png")).toBe("images/scroll-logo.png");
  });

  it("resolves a missing generated rendition to its seeded original", () => {
    expect(seededMediaSource("mobile-hero-1200x630.webp")).toBe("images/mobile-hero.png");
    expect(seededMediaSource("experiences-CERAMIC_PAINTING-1024x1024.webp")).toBe("images/experiences/CERAMIC_PAINTING.jpg");
  });

  it("does not fall back for unknown uploads", () => {
    expect(seededMediaSource("owner-upload.png")).toBeUndefined();
  });
});
