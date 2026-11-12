import fs from "node:fs";
import path from "node:path";

import type { Payload } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({ storage: true }));
vi.mock("@/cms/lib/storage", () => ({
  get STORAGE_ENABLED() {
    return flags.storage;
  },
}));

import { describeMove, movePagePhotos } from "@/cms/lib/pagePhotos";
import { storedFilename } from "@/cms/seed/media";
import { GALLERY_SLOTS, PAGE_PHOTOS, STOCK_PHOTOS, pageGallery, withInFilePagePhotos } from "@/lib/experiencePagePhotos";

/**
 * Issue #201 — the experience pages' photographs moved from the code into
 * the CMS. Two things are pinned here: the rule the site applies until a
 * database has been moved (lib/experiencePagePhotos.ts), and the one-time
 * move itself (cms/lib/pagePhotos.ts), against a small in-memory Payload.
 */

const ALL_PHOTOS = [
  ...Object.values(PAGE_PHOTOS).flatMap((photos) => [...(photos.pageImage ? [photos.pageImage] : []), ...(photos.gallery ?? [])]),
  ...Object.values(GALLERY_SLOTS).flatMap((slots) => Object.values(slots)),
];

describe("the code-held page photographs", () => {
  it("are all files in public/, so the move can upload them", () => {
    const missing = ALL_PHOTOS.map((photo) => photo.src).filter((src) => !fs.existsSync(path.join(process.cwd(), "public", src)));
    expect(missing).toEqual([]);
    expect(ALL_PHOTOS).toHaveLength(26);
  });

  it("name only real files as stock", () => {
    const known = new Set(ALL_PHOTOS.map((photo) => photo.src));
    expect([...STOCK_PHOTOS].filter((src) => !known.has(src))).toEqual([]);
  });
});

describe("pageGallery", () => {
  it("replaces the stored list with the code-held one", () => {
    expect(pageGallery(["a", "b"], ["x", "y", "z"], undefined)).toEqual(["x", "y", "z"]);
  });

  it("lays single slots over the stored list, even past its end", () => {
    expect(pageGallery(["a", "b", "c"], undefined, { 2: "z" })).toEqual(["a", "b", "z"]);
    expect(pageGallery(["a"], undefined, { 2: "z" })).toEqual(["a", "z"]);
  });

  it("returns the stored list when the code held nothing", () => {
    expect(pageGallery(["a", "b"], undefined, undefined)).toEqual(["a", "b"]);
  });
});

describe("withInFilePagePhotos", () => {
  const own = [{ src: "/cms/1.jpg", alt: "one" }, { src: "/cms/2.jpg", alt: "two" }, { src: "/cms/3.jpg", alt: "three" }];

  it("puts the code-held banner and frames over an experience's own", () => {
    const result = withInFilePagePhotos({ slug: "crocheting", pageImage: { src: "/cms/banner.jpg", alt: "" }, gallery: own });
    expect(result.pageImage).toEqual(PAGE_PHOTOS.crocheting.pageImage);
    expect(result.gallery).toEqual(PAGE_PHOTOS.crocheting.gallery);
  });

  it("keeps glass painting's first two frames and swaps the third", () => {
    const result = withInFilePagePhotos({ slug: "glass-painting", gallery: own });
    expect(result.gallery).toEqual([own[0], own[1], GALLERY_SLOTS["glass-painting"][2]]);
  });

  it("leaves an experience the code held nothing for exactly as it is", () => {
    const experience = { slug: "something-new", gallery: own };
    expect(withInFilePagePhotos(experience)).toBe(experience);
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* The move, against an in-memory Payload                                     */
/* ────────────────────────────────────────────────────────────────────────── */

type Row = Record<string, unknown> & { id: string; _status: "published" | "draft" };

function fakePayload(seed: { experiences: Array<{ live: Row; latest?: Row }>; media?: string[]; stamp?: string }) {
  const experiences = new Map(seed.experiences.map((entry) => [entry.live.id, { live: entry.live, latest: entry.latest ?? entry.live }]));
  const media = new Map<string, string>((seed.media ?? []).map((filename) => [filename, `existing:${filename}`]));
  const state: { pagePhotosMovedAt?: string } = { pagePhotosMovedAt: seed.stamp };
  const writes: Array<{ id: string; draft: boolean; data: Record<string, unknown> }> = [];
  const uploads: Array<{ filename: string; data: Record<string, unknown> }> = [];

  const payload = {
    collections: {
      experiences: {
        config: {
          flattenedFields: [
            { name: "name", type: "text" },
            { name: "slug", type: "text" },
            { name: "pageImage", type: "upload" },
            { name: "gallery", type: "upload" },
            { name: "_status", type: "select" },
          ],
        },
      },
    },
    findGlobal: async () => state,
    updateGlobal: async ({ data }: { data: { pagePhotosMovedAt: string } }) => Object.assign(state, data),
    find: async ({ collection, where }: { collection: string; where: Record<string, { equals: string }> }) => {
      if (collection === "media") {
        const id = media.get(where.filename.equals);
        return { docs: id ? [{ id }] : [] };
      }
      const entry = [...experiences.values()].find((row) => row.live.slug === where.slug.equals);
      return { docs: entry ? [entry.live] : [] };
    },
    findByID: async ({ id }: { id: string }) => experiences.get(id)!.latest,
    create: async ({ data, file }: { data: Record<string, unknown>; file: { name: string } }) => {
      const id = `new:${file.name}`;
      media.set(file.name, id);
      uploads.push({ filename: file.name, data });
      return { id, filename: file.name };
    },
    update: async ({ id, data, draft }: { id: string; data: Record<string, unknown>; draft: boolean }) => {
      writes.push({ id, draft, data });
      const entry = experiences.get(id)!;
      const next = { ...data, id } as Row;
      if (draft) entry.latest = next;
      else entry.live = entry.latest = next;
      return next;
    },
  };
  return { payload: payload as unknown as Payload, experiences, state, writes, uploads };
}

const published = (slug: string, extra: Record<string, unknown> = {}): Row => ({ id: slug, slug, name: slug, pageImage: null, gallery: [], _status: "published", ...extra });
const idFor = (src: string, prefix = "new") => `${prefix}:${storedFilename(src.replace(/^\//, ""))}`;

describe("movePagePhotos", () => {
  beforeEach(() => {
    flags.storage = true;
  });

  it("uploads the photographs, sets them on each experience and stamps the database", async () => {
    const slugs = Object.keys(PAGE_PHOTOS);
    const db = fakePayload({ experiences: slugs.map((slug) => ({ live: published(slug, slug === "glass-painting" ? { gallery: ["g1", "g2", "g3"] } : {}) })) });

    const result = await movePagePhotos(db.payload);

    expect(result.state).toBe("moved");
    expect(result.uploaded).toBe(26);
    expect(result.moved.sort()).toEqual([...slugs].sort());
    expect(db.state.pagePhotosMovedAt).toBeTruthy();

    const tote = db.experiences.get("tote-bag-painting")!.live;
    expect(tote._status).toBe("published");
    expect(tote.pageImage).toBe(idFor(PAGE_PHOTOS["tote-bag-painting"].pageImage!.src));
    expect(tote.gallery).toEqual(PAGE_PHOTOS["tote-bag-painting"].gallery!.map((frame) => idFor(frame.src)));

    // Glass painting keeps the CMS's first two frames; only the third is the code-held one.
    const glass = db.experiences.get("glass-painting")!.live;
    expect(glass.gallery).toEqual(["g1", "g2", idFor(GALLERY_SLOTS["glass-painting"][2].src)]);
  });

  it("records the focal point and where each photograph came from", async () => {
    const db = fakePayload({ experiences: [{ live: published("candle-making") }] });
    await movePagePhotos(db.payload);

    const hero = db.uploads.find((upload) => upload.filename.endsWith("candle-making-hero.jpg"))!;
    expect(hero.data).toMatchObject({ provenance: "stock", tags: ["hero"], focalX: 55, focalY: 55 });
    const table = db.uploads.find((upload) => upload.filename.endsWith("candle-making-table.jpg"))!;
    expect(table.data).toMatchObject({ provenance: "client-supplied", tags: ["experience-gallery"] });
    expect(table.data.alt).toBe(PAGE_PHOTOS["candle-making"].gallery![0].alt);
  });

  it("does not upload a photograph the library already has", async () => {
    const hero = storedFilename(PAGE_PHOTOS.bedazzling.pageImage!.src.replace(/^\//, ""));
    const db = fakePayload({ experiences: [{ live: published("bedazzling") }], media: [hero] });

    const result = await movePagePhotos(db.payload);

    expect(result.uploaded).toBe(3);
    expect(db.experiences.get("bedazzling")!.live.pageImage).toBe(`existing:${hero}`);
  });

  it("leaves an experience that already has a Page photograph alone", async () => {
    const db = fakePayload({ experiences: [{ live: published("crocheting", { pageImage: "editors-choice", gallery: ["e1"] }) }] });

    const result = await movePagePhotos(db.payload);

    expect(result.kept).toEqual(["crocheting"]);
    expect(db.writes).toEqual([]);
    expect(result.uploaded).toBe(0);
  });

  it("reports an experience that is not in the database and carries on", async () => {
    const db = fakePayload({ experiences: [{ live: published("bedazzling") }] });
    const result = await movePagePhotos(db.payload);

    expect(result.moved).toEqual(["bedazzling"]);
    expect(result.absent).toContain("crocheting");
    expect(db.state.pagePhotosMovedAt).toBeTruthy();
  });

  it("does not publish someone's unpublished edits", async () => {
    const live = published("ceramic-painting", { name: "Ceramic Painting" });
    const latest: Row = { ...live, name: "A half-written new name", _status: "draft" };
    const db = fakePayload({ experiences: [{ live, latest }] });

    await movePagePhotos(db.payload);

    const after = db.experiences.get("ceramic-painting")!;
    const hero = idFor(PAGE_PHOTOS["ceramic-painting"].pageImage!.src);
    // The live row: its own name, published, with the photographs.
    expect(db.writes[0]).toMatchObject({ draft: false, data: { name: "Ceramic Painting", _status: "published", pageImage: hero } });
    // The draft, back on top: still a draft, still the editor's wording, with the photographs too.
    expect(after.latest).toMatchObject({ name: "A half-written new name", _status: "draft", pageImage: hero });
  });

  it("keeps a never-published experience a draft", async () => {
    const db = fakePayload({ experiences: [{ live: { ...published("mandala-painting"), _status: "draft" } }] });
    await movePagePhotos(db.payload);

    expect(db.writes).toHaveLength(1);
    expect(db.writes[0]).toMatchObject({ draft: true, data: { _status: "draft" } });
  });

  it("runs once: a stamped database is not touched again", async () => {
    const db = fakePayload({ experiences: [{ live: published("bedazzling") }], stamp: "2026-11-10T06:53:14.604Z" });
    const result = await movePagePhotos(db.payload);

    expect(result.state).toBe("already-moved");
    expect(db.writes).toEqual([]);
    expect(db.uploads).toEqual([]);
  });

  it("a dry run counts and writes nothing", async () => {
    const db = fakePayload({ experiences: [{ live: published("bedazzling") }] });
    const result = await movePagePhotos(db.payload, { dryRun: true });

    expect(result).toMatchObject({ state: "dry-run", uploaded: 4, moved: ["bedazzling"] });
    expect(db.writes).toEqual([]);
    expect(db.uploads).toEqual([]);
    expect(db.state.pagePhotosMovedAt).toBeUndefined();
    expect(describeMove(result)).toContain("would upload 4 photographs");
  });

  it("refuses where uploads would land on a laptop's disk", async () => {
    flags.storage = false;
    const db = fakePayload({ experiences: [{ live: published("bedazzling") }] });
    const result = await movePagePhotos(db.payload);

    expect(result.state).toBe("refused");
    expect(db.writes).toEqual([]);
    expect(db.state.pagePhotosMovedAt).toBeUndefined();
  });
});
