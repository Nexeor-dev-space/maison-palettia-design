import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import { TAGS } from "@/lib/cms/cache";

import { bootPayload, contentFixture, hasDb, makeSession, revalidationMark, revalidationsSince, staff, SYSTEM } from "../setup/payload";

/**
 * Content → live site without a rebuild (SPEC §G.4, §K integration rows
 * "revalidation hook paths map", "draft autosave triggers nothing",
 * "redirects row created on published slug rename").
 *
 * Real Payload, real hooks, throwaway database. `revalidatePath` and
 * `revalidateTag` are recorded instead of run (tests/integration/setup/
 * environment.ts), so each test reads exactly which routes and tags a save
 * purged.
 */

let payload: Payload;

beforeAll(async () => {
  if (hasDb) payload = await bootPayload();
});

const paths = (mark: number) => revalidationsSince(mark).filter((r) => r.kind === "path").map((r) => (r.arg ? `${r.value} (${r.arg})` : r.value));
const tags = (mark: number) => revalidationsSince(mark).filter((r) => r.kind === "tag").map((r) => r.value);

describe.skipIf(!hasDb)("revalidation on publish", () => {
  it("a draft session purges nothing; publishing it purges its pages, the listings and the sessions tag", async () => {
    const { experienceSlug } = await contentFixture(payload);
    const admin = await staff(payload, "admin");

    let mark = revalidationMark();
    const draft = await makeSession(payload, { status: "draft", context: {} });
    expect(revalidationsSince(mark)).toEqual([]);

    mark = revalidationMark();
    await payload.update({ collection: "sessions", id: draft.id, data: { _status: "published" } as never, user: admin, overrideAccess: false });
    expect(tags(mark)).toContain(TAGS.sessions);
    expect(paths(mark)).toEqual(
      expect.arrayContaining(["/", "/events", `/events/${draft.slug}`, `/events/${draft.slug}/book`, `/events/${experienceSlug}`, "/sitemap.xml"]),
    );
  });

  it("a draft autosave over a published session purges nothing (the live row did not change)", async () => {
    const admin = await staff(payload, "admin");
    const live = await makeSession(payload, { status: "published" });

    const mark = revalidationMark();
    await payload.update({
      collection: "sessions",
      id: live.id,
      data: { internalNotes: "autosaved note" } as never,
      draft: true,
      autosave: true,
      user: admin,
      overrideAccess: false,
    });
    expect(revalidationsSince(mark)).toEqual([]);
  });

  it("unpublishing purges the address visitors had", async () => {
    const admin = await staff(payload, "admin");
    const live = await makeSession(payload, { status: "published" });

    const mark = revalidationMark();
    await payload.update({ collection: "sessions", id: live.id, data: { _status: "draft" } as never, user: admin, overrideAccess: false });
    expect(paths(mark)).toContain(`/events/${live.slug}`);
  });

  it("a content global save purges its tag and the layout (header/footer read it)", async () => {
    const editor = await staff(payload, "editor");
    const mark = revalidationMark();
    await payload.updateGlobal({ slug: "brand-copy", data: { tagline: "A Palette of Creativity for Everyone" } as never, user: editor, overrideAccess: false });
    expect(tags(mark)).toContain(TAGS.brand);
    expect(paths(mark)).toContain("/ (layout)");
  });

  it("server writes that opt out (inventory updates, seeds) purge nothing", async () => {
    const mark = revalidationMark();
    await makeSession(payload, { status: "published", context: SYSTEM });
    expect(revalidationsSince(mark)).toEqual([]);
  });
});

describe.skipIf(!hasDb)("redirects on a published slug rename", () => {
  const redirectsFrom = async (from: string) =>
    (await payload.find({ collection: "redirects", where: { from: { equals: from } }, depth: 0, overrideAccess: true })).docs as Array<{ from: string; to: string; permanent?: boolean }>;

  it("renaming a live experience leaves a permanent redirect, keeps chains one hop, and a rename back removes the loop", async () => {
    const admin = await staff(payload, "admin");
    const tag = Math.random().toString(36).slice(2, 7);
    const exp = await payload.create({
      collection: "experiences",
      data: { name: `Rename ${tag}`, kind: "scheduled", description: "Test", slug: `rename-a-${tag}`, order: 9, _status: "published" } as never,
      overrideAccess: true,
      context: SYSTEM,
    });

    await payload.update({ collection: "experiences", id: exp.id, data: { slug: `rename-b-${tag}`, _status: "published" } as never, user: admin, overrideAccess: false });
    expect(await redirectsFrom(`/events/rename-a-${tag}`)).toEqual([expect.objectContaining({ to: `/events/rename-b-${tag}`, permanent: true })]);

    await payload.update({ collection: "experiences", id: exp.id, data: { slug: `rename-c-${tag}`, _status: "published" } as never, user: admin, overrideAccess: false });
    // A → C directly, not A → B → C.
    expect((await redirectsFrom(`/events/rename-a-${tag}`))[0]?.to).toBe(`/events/rename-c-${tag}`);
    expect((await redirectsFrom(`/events/rename-b-${tag}`))[0]?.to).toBe(`/events/rename-c-${tag}`);

    await payload.update({ collection: "experiences", id: exp.id, data: { slug: `rename-a-${tag}`, _status: "published" } as never, user: admin, overrideAccess: false });
    // The original address is a live page again: no redirect may leave it.
    expect(await redirectsFrom(`/events/rename-a-${tag}`)).toEqual([]);
    expect((await redirectsFrom(`/events/rename-c-${tag}`))[0]?.to).toBe(`/events/rename-a-${tag}`);
  });

  it("a draft rename writes no redirect until it is published", async () => {
    const admin = await staff(payload, "admin");
    const tag = Math.random().toString(36).slice(2, 7);
    const exp = await payload.create({
      collection: "experiences",
      data: { name: `Draft ${tag}`, kind: "scheduled", description: "Test", slug: `draft-a-${tag}`, order: 9, _status: "published" } as never,
      overrideAccess: true,
      context: SYSTEM,
    });
    await payload.update({ collection: "experiences", id: exp.id, data: { slug: `draft-b-${tag}` } as never, draft: true, user: admin, overrideAccess: false });
    expect(await redirectsFrom(`/events/draft-a-${tag}`)).toEqual([]);
  });

  it("an editor cannot move a live page's address (only admins rename what visitors already use)", async () => {
    const editor = await staff(payload, "editor");
    const tag = Math.random().toString(36).slice(2, 7);
    const exp = await payload.create({
      collection: "experiences",
      data: { name: `Locked ${tag}`, kind: "scheduled", description: "Test", slug: `locked-a-${tag}`, order: 9, _status: "published" } as never,
      overrideAccess: true,
      context: SYSTEM,
    });
    await expect(
      payload.update({ collection: "experiences", id: exp.id, data: { slug: `locked-b-${tag}`, _status: "published" } as never, user: editor, overrideAccess: false }),
    ).rejects.toThrow();
    expect(await redirectsFrom(`/events/locked-a-${tag}`)).toEqual([]);
  });
});
