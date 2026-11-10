import fs from "node:fs";
import path from "node:path";

import type { Payload } from "payload";
import { describe, expect, it } from "vitest";

import { describeMove, movePagePhotos } from "@/cms/lib/pagePhotos";
import { storedFilename } from "@/cms/seed/media";
import { EXPERIENCES } from "@/cms/seed/strings/experiences";
import { MEDIA } from "@/cms/seed/strings/media";
import { toCreativeExperience } from "@/lib/cms/mappers";
import { CMS_FRAMES_KEPT, pageGallery } from "@/lib/pagePhotosTransition";

/**
 * The experience pages' photographs moving from the code into the CMS
 * (cms/lib/pagePhotos.ts). No database: the move runs against a fake Payload
 * that records what it was asked to write, because what matters here is
 * WHICH writes it makes to a live document — never an editor's unpublished
 * draft published by accident, never an experience already set in the admin.
 */

const PUBLIC = path.resolve(__dirname, "../../public");

describe("pageGallery — how the code-held frames sat over the CMS ones", () => {
  it("replaces the whole list for an experience that kept none", () => {
    expect(pageGallery("crocheting", ["old"], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
    expect(pageGallery("bedazzling", [], ["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("keeps glass painting's first two CMS frames and sets the third", () => {
    expect(CMS_FRAMES_KEPT["glass-painting"]).toBe(2);
    expect(pageGallery("glass-painting", ["cms1", "cms2", "cms3"], ["h1", "h2", "bottle"])).toEqual(["cms1", "cms2", "bottle"]);
  });

  it("still adds the held frame when the CMS list is shorter", () => {
    expect(pageGallery("glass-painting", ["cms1"], ["h1", "h2", "bottle"])).toEqual(["cms1", "bottle"]);
    expect(pageGallery("glass-painting", [], ["h1", "h2", "bottle"])).toEqual(["bottle"]);
  });
});

describe("the seed's page photographs", () => {
  const byPath = new Map(MEDIA.map((seed) => [seed.path, seed]));

  it("gives every experience a page photograph and at most three About frames", () => {
    expect(EXPERIENCES).toHaveLength(7);
    for (const experience of EXPERIENCES) {
      expect(experience.pageImage, experience.slug).toBeTruthy();
      expect(experience.gallery.length, experience.slug).toBeLessThanOrEqual(3);
      expect(experience.gallery, experience.slug).not.toContain(experience.pageImage);
      expect(experience.gallery, experience.slug).not.toContain(experience.image);
    }
  });

  it("names only files that are in the media list, and the move's own are on disk", () => {
    for (const experience of EXPERIENCES) {
      for (const file of [experience.pageImage as string, ...experience.gallery]) {
        expect(byPath.has(file), `${file} is not in cms/seed/strings/media.ts`).toBe(true);
      }
      // The frames the CMS kept (glass painting's first two) are already in the library; the rest are uploaded from here.
      const uploaded = [experience.pageImage as string, ...experience.gallery.slice(CMS_FRAMES_KEPT[experience.slug] ?? 0)];
      for (const file of uploaded) expect(fs.existsSync(path.join(PUBLIC, file)), `${file} is not under public/`).toBe(true);
    }
  });

  it("aims every banner, and stores each file under a name of its own", () => {
    for (const experience of EXPERIENCES) {
      expect(byPath.get(experience.pageImage as string)?.focal, experience.slug).toHaveLength(2);
    }
    const names = MEDIA.map((seed) => storedFilename(seed.path).toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("records where the stock photographs came from, within the field's length", () => {
    const stock = MEDIA.filter((seed) => seed.path.startsWith("images/experiences/") && seed.provenance === "stock");
    expect(stock).toHaveLength(7);
    for (const seed of stock) {
      expect(seed.licence, seed.path).toMatch(/^Shutterstock — /);
      expect((seed.licence as string).length, seed.path).toBeLessThanOrEqual(200);
    }
    for (const seed of MEDIA) expect(seed.alt.length, seed.path).toBeLessThanOrEqual(300);
  });
});

describe("toCreativeExperience — the page photograph", () => {
  const base = { id: "e1", slug: "crocheting", name: "Crocheting", kind: "scheduled", description: "A hook.", updatedAt: "", createdAt: "" };
  const media = (extra: Record<string, unknown>) => ({ id: "m1", alt: "Hands on a hook.", url: "/api/media/file/hero.jpg", updatedAt: "", createdAt: "", ...extra });

  it("is absent when the experience has none, so readers fall back to the main photograph", () => {
    expect(toCreativeExperience(base as never).pageImage).toBeUndefined();
  });

  it("uses the widest rendition, with the focal point as its position", () => {
    const doc = { ...base, pageImage: media({ focalX: 50, focalY: 32, sizes: { hero: { url: "/api/media/file/hero-2000.webp" }, plate: { url: "/api/media/file/hero-1200.webp" } } }) };
    expect(toCreativeExperience(doc as never).pageImage).toMatchObject({ src: "/api/media/file/hero-2000.webp", alt: "Hands on a hook.", position: "50% 32%" });
  });

  it("falls back to the original when the file is too small for that rendition", () => {
    const doc = { ...base, pageImage: media({ sizes: { hero: { url: null } } }) };
    expect(toCreativeExperience(doc as never).pageImage?.src).toBe("/api/media/file/hero.jpg");
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* The move, against a fake Payload                                           */
/* ────────────────────────────────────────────────────────────────────────── */

type Row = Record<string, unknown> & { id: string };
type Write = { collection: string; id?: string; draft?: boolean; data: Record<string, unknown> };

const FIELDS = [
  { name: "name", type: "text" },
  { name: "slug", type: "text" },
  { name: "image", type: "upload" },
  { name: "pageImage", type: "upload" },
  { name: "gallery", type: "upload" },
  { name: "status", type: "text" },
  { name: "meta", type: "tab", flattenedFields: [{ name: "title", type: "text" }, { name: "description", type: "textarea" }] },
];

const live = (slug: string, extra: Record<string, unknown> = {}): Row => ({
  id: `id-${slug}`,
  slug,
  name: `Live ${slug}`,
  image: `main-${slug}`,
  gallery: [],
  meta: { title: `Title ${slug}` },
  _status: "published",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...extra,
});

function fake(options: { moved?: boolean; experiences?: Row[]; drafts?: Record<string, Row>; library?: string[] } = {}) {
  const experiences = options.experiences ?? EXPERIENCES.map((seed) => live(seed.slug));
  const drafts = options.drafts ?? {};
  const library = new Set(options.library ?? []);
  const writes: Write[] = [];
  const state: { pagePhotosMovedAt?: string } = options.moved ? { pagePhotosMovedAt: "2026-11-01T00:00:00.000Z" } : {};

  const payload = {
    collections: { experiences: { config: { flattenedFields: FIELDS } } },
    findGlobal: async () => state,
    updateGlobal: async ({ data }: { data: typeof state }) => {
      Object.assign(state, data);
      writes.push({ collection: "system-state", data });
    },
    find: async ({ collection, where }: { collection: string; where: Record<string, { equals: string }> }) => {
      if (collection === "media") {
        const filename = where.filename.equals;
        return { docs: library.has(filename) ? [{ id: `media:${filename}`, filename }] : [] };
      }
      return { docs: experiences.filter((row) => row.slug === where.slug.equals) };
    },
    findByID: async ({ id }: { id: string }) => drafts[id] ?? experiences.find((row) => row.id === id),
    create: async ({ file }: { file: { name: string } }) => {
      library.add(file.name);
      writes.push({ collection: "media", data: { filename: file.name } });
      return { id: `media:${file.name}`, filename: file.name };
    },
    update: async ({ collection, id, draft, data }: Write) => {
      writes.push({ collection, id, draft, data });
    },
  };
  return { payload: payload as unknown as Payload, writes, state, experienceWrites: () => writes.filter((w) => w.collection === "experiences") };
}

const mediaOf = (publicPath: string) => `media:${storedFilename(publicPath)}`;
const seedOf = (slug: string) => EXPERIENCES.find((seed) => seed.slug === slug)!;

describe("movePagePhotos", () => {
  it("does nothing once the database is stamped", async () => {
    const { payload, writes } = fake({ moved: true });
    const result = await movePagePhotos(payload, { force: true });
    expect(result.state).toBe("already-moved");
    expect(writes).toEqual([]);
  });

  it("refuses off the server, where the uploads would be rows without files", async () => {
    const { payload, writes } = fake();
    const result = await movePagePhotos(payload);
    expect(result.state).toBe("refused");
    expect(describeMove(result)).toMatch(/Run it on the server/);
    expect(writes).toEqual([]);
  });

  it("reports without writing in a dry run", async () => {
    const { payload, writes } = fake();
    const result = await movePagePhotos(payload, { dryRun: true });
    expect(result).toMatchObject({ state: "dry-run", uploaded: 26 });
    expect(result.moved).toHaveLength(7);
    expect(writes).toEqual([]);
  });

  it("uploads the 26 photographs, sets all seven experiences, and stamps the database", async () => {
    const { payload, writes, state, experienceWrites } = fake();
    const result = await movePagePhotos(payload, { force: true });

    expect(result).toMatchObject({ state: "moved", uploaded: 26, kept: [], absent: [] });
    expect(writes.filter((w) => w.collection === "media")).toHaveLength(26);
    expect(experienceWrites()).toHaveLength(7);
    expect(state.pagePhotosMovedAt).toBeTruthy();
    expect(writes.at(-1)?.collection).toBe("system-state");

    const crochet = experienceWrites().find((w) => w.id === "id-crocheting")!;
    const seed = seedOf("crocheting");
    expect(crochet.draft).toBe(false);
    expect(crochet.data).toMatchObject({
      _status: "published",
      name: "Live crocheting",
      image: "main-crocheting",
      pageImage: mediaOf(seed.pageImage as string),
      gallery: seed.gallery.map(mediaOf),
      // Explicit, so nothing is inherited from whatever version Payload merges over.
      status: null,
      meta: { title: "Title crocheting", description: null },
    });
    expect(crochet.data).not.toHaveProperty("id");
    expect(crochet.data).not.toHaveProperty("updatedAt");
  });

  it("does not upload a photograph the library already has", async () => {
    const seed = seedOf("bedazzling");
    const { payload, writes } = fake({ library: [storedFilename(seed.pageImage as string)] });
    const result = await movePagePhotos(payload, { force: true });
    expect(result.uploaded).toBe(25);
    expect(writes.filter((w) => w.collection === "media")).toHaveLength(25);
  });

  it("keeps glass painting's first two frames as the admin has them", async () => {
    const rows = EXPERIENCES.map((seed) => (seed.slug === "glass-painting" ? live(seed.slug, { gallery: ["editor-1", "editor-2", "editor-3"] }) : live(seed.slug)));
    const { payload, experienceWrites } = fake({ experiences: rows });
    await movePagePhotos(payload, { force: true });
    const glass = experienceWrites().find((w) => w.id === "id-glass-painting")!;
    expect(glass.data.gallery).toEqual(["editor-1", "editor-2", mediaOf("images/experiences/glass-painting/glass-painting-bottle.jpg")]);
  });

  it("leaves an experience that already has a page photograph exactly as it is", async () => {
    const rows = EXPERIENCES.map((seed) => (seed.slug === "candle-making" ? live(seed.slug, { pageImage: "editors-choice", gallery: ["theirs"] }) : live(seed.slug)));
    const { payload, experienceWrites, state } = fake({ experiences: rows });
    const result = await movePagePhotos(payload, { force: true });
    expect(result.kept).toEqual(["candle-making"]);
    expect(experienceWrites().some((w) => w.id === "id-candle-making")).toBe(false);
    expect(state.pagePhotosMovedAt).toBeTruthy();
  });

  it("never publishes an editor's unpublished changes", async () => {
    const draft: Row = { ...live("tote-bag-painting"), name: "Unfinished rename", status: "Coming soon", _status: "draft" };
    const { payload, experienceWrites } = fake({ drafts: { "id-tote-bag-painting": draft } });
    await movePagePhotos(payload, { force: true });

    const [published, resaved] = experienceWrites().filter((w) => w.id === "id-tote-bag-painting");
    const hero = mediaOf(seedOf("tote-bag-painting").pageImage as string);

    // The live row is written from the live row's own values…
    expect(published).toMatchObject({ draft: false, data: { _status: "published", name: "Live tote-bag-painting", status: null, pageImage: hero } });
    // …and the draft goes back on top of it, with the photographs added.
    expect(resaved).toMatchObject({ draft: true, data: { _status: "draft", name: "Unfinished rename", status: "Coming soon", pageImage: hero } });
  });

  it("keeps a never-published experience a draft", async () => {
    const rows = EXPERIENCES.map((seed) => (seed.slug === "mandala-painting" ? live(seed.slug, { _status: "draft" }) : live(seed.slug)));
    const { payload, experienceWrites } = fake({ experiences: rows });
    await movePagePhotos(payload, { force: true });
    const writes = experienceWrites().filter((w) => w.id === "id-mandala-painting");
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ draft: true, data: { _status: "draft" } });
  });

  it("says so when an experience is not in the database under its slug", async () => {
    const { payload } = fake({ experiences: EXPERIENCES.filter((seed) => seed.slug !== "bedazzling").map((seed) => live(seed.slug)) });
    const result = await movePagePhotos(payload, { force: true });
    expect(result.absent).toEqual(["bedazzling"]);
    expect(result.moved).toHaveLength(6);
    expect(describeMove(result)).toMatch(/found no experience called bedazzling/);
  });
});
