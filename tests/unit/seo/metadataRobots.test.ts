import { afterEach, beforeEach, describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { buildMetadata, getDefaultMetadata, getHomeMetadata } from "@/lib/seo";
import { isProductionDeployment, PRODUCTION_HOST, PRODUCTION_ORIGIN } from "@/lib/siteOrigin";

describe("SEO metadata and robots indexing controls", () => {
  const originalServerUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = originalServerUrl;
  });

  describe("isProductionDeployment", () => {
    it("returns true only when NEXT_PUBLIC_SERVER_URL matches PRODUCTION_HOST", () => {
      process.env.NEXT_PUBLIC_SERVER_URL = PRODUCTION_ORIGIN;
      expect(isProductionDeployment()).toBe(true);

      process.env.NEXT_PUBLIC_SERVER_URL = "https://staging-maison-palettia-design.client2.nexeor.com";
      expect(isProductionDeployment()).toBe(false);

      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3200";
      expect(isProductionDeployment()).toBe(false);

      delete process.env.NEXT_PUBLIC_SERVER_URL;
      expect(isProductionDeployment()).toBe(false);
    });
  });

  describe("Staging / non-production environment", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SERVER_URL = "https://staging-maison-palettia-design.client2.nexeor.com";
    });

    it("enforces noindex on buildMetadata for all pages", () => {
      const meta = buildMetadata({
        title: "About",
        description: "About Maison Palettia",
        path: "/about",
      });

      expect(meta.robots).toEqual({ index: false, follow: false });
    });

    it("enforces noindex on getDefaultMetadata", async () => {
      const meta = await getDefaultMetadata();
      expect(meta.robots).toEqual({ index: false, follow: false });
    });

    it("enforces noindex on getHomeMetadata", async () => {
      const meta = await getHomeMetadata();
      expect(meta.robots).toEqual({ index: false, follow: false });
    });

    it("omits sitemap in robots.txt so crawlers are not directed to site tree", async () => {
      const result = await robots();
      expect(result.sitemap).toBeUndefined();
      expect(result.rules).toBeDefined();
    });
  });

  describe("Production environment", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SERVER_URL = `https://${PRODUCTION_HOST}`;
    });

    it("keeps standard pages indexable (no robots tag)", () => {
      const meta = buildMetadata({
        title: "About",
        description: "About Maison Palettia",
        path: "/about",
      });

      expect(meta.robots).toBeUndefined();
    });

    it("honors page-level noindex for transactional pages on production", () => {
      const meta = buildMetadata({
        title: "Checkout",
        description: "Checkout",
        path: "/checkout",
        noindex: true,
      });

      expect(meta.robots).toEqual({ index: false, follow: false });
    });

    it("includes sitemap in robots.txt on production", async () => {
      const result = await robots();
      expect(result.sitemap).toBe(`${PRODUCTION_ORIGIN}/sitemap.xml`);
    });
  });
});
