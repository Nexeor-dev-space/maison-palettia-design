import config from "@payload-config";
import { getPayload } from "payload";

/**
 * Temporary demo data for the guide's Journal screenshots: `create` or `delete`.
 * Everything is named zz-docs-…, the post stays a draft, and the category has
 * no published posts (so it never shows on the site). Delete straight after.
 */
const mode = process.argv[2];
const ctx = { context: { skipRevalidate: true }, overrideAccess: true } as const;
const payload = await getPayload({ config });

const text = (t: string) => ({ type: "text", text: t, version: 1, detail: 0, format: 0, mode: "normal", style: "" });
const para = (t: string) => ({ type: "paragraph", version: 1, children: [text(t)], direction: "ltr", format: "", indent: 0, textFormat: 0, textStyle: "" });
const h2 = (t: string) => ({ type: "heading", tag: "h2", version: 1, children: [text(t)], direction: "ltr", format: "", indent: 0 });

const findPosts = () => payload.find({ collection: "posts", where: { slug: { like: "zz-docs" } }, draft: true, depth: 0, limit: 10, ...ctx });
const findCats = () => payload.find({ collection: "post-categories", where: { slug: { like: "zz-docs" } }, depth: 0, limit: 10, ...ctx });

if (mode === "delete") {
  for (const p of (await findPosts()).docs) await payload.delete({ collection: "posts", id: p.id, ...ctx });
  for (const c of (await findCats()).docs) await payload.delete({ collection: "post-categories", id: c.id, ...ctx });
  console.log("deleted", (await findPosts()).totalDocs, (await findCats()).totalDocs);
  process.exit(0);
}

let cat = (await findCats()).docs[0];
if (!cat) {
  cat = await payload.create({
    collection: "post-categories",
    data: { name: "zz-docs Studio notes", colour: "lilac", description: "zz-docs Behind the scenes at the studio: new themes, materials and the people who teach them.", slug: "zz-docs-studio-notes" } as never,
    ...ctx,
  });
}
let post = (await findPosts()).docs[0];
if (!post) {
  post = await payload.create({
    collection: "posts",
    draft: true,
    data: {
      _status: "draft",
      title: "zz-docs Three scents for autumn evenings",
      slug: "zz-docs-three-scents",
      excerpt: "Fig, cedar and a little smoke: the blends we keep coming back to as the evenings cool down, and how to pour them at home.",
      coverImage: "f8934970-191f-4388-bec8-7a63e1b75935",
      category: cat.id,
      tags: ["candles", "autumn"],
      author: { name: "Maison Palettia", role: "Workshop host" },
      body: {
        root: {
          type: "root", version: 1, direction: "ltr", format: "", indent: 0,
          children: [
            para("When the first cool evening arrives, the studio smells different. These are the three blends we reach for every year."),
            h2("Fig and cedar"),
            para("Warm, a little green, and calm enough for a reading corner. Pour it in a heavy glass so the scent carries."),
            h2("Smoked vanilla"),
            para("A soft, low note for dinner tables. Keep the wick short for a steady flame."),
          ],
        },
      },
    } as never,
    ...ctx,
  });
}
console.log("post", post.id, "category", cat.id);
process.exit(0);
