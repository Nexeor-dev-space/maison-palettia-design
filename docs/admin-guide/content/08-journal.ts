import type { Chapter } from "./types";

export const journal: Chapter = {
  slug: "journal",
  number: 7,
  title: "The Journal",
  lede: "The Journal is the studio's blog: stories, new themes, behind the scenes. You write a post like a short letter, add a cover photo, and publish.",
  blurb: "Write a post, sort posts into categories, feature a story, and show the latest on any page.",
  summary: [
    "{{Content > Journal}} holds your posts. {{Content > Journal categories}} holds the sections they sit in.",
    "Every post needs a **title**, a **cover photograph** and some text. Everything else is optional.",
    "Posts are drafts until you press [[Publish changes]], just like pages. Categories have a plain [[Save]].",
    "Tick **Feature at the top of the Journal** to show a post large at the top of the Journal page.",
    "Add the **Latest from the Journal** section to any page to show your newest stories there.",
  ],
  roles: ["admin", "editor"],
  keywords: "blog journal post article story news category featured",
  intro: [
    {
      type: "mock",
      label: "Where the Journal shows on the website",
      html: "<div class=\"split\"><div class=\"panel\"><span class=\"muted\">maisonpalettia.com/journal</span><h4>The Journal page</h4><p class=\"muted\">The featured post large at the top, then every other post as a card, newest first. A row of category buttons filters them.</p></div><div class=\"panel\"><span class=\"muted\">Each post</span><div class=\"row\"><span class=\"chip\">/journal/three-scents</span><span>its own page</span></div><div class=\"row\"><span class=\"chip\">/journal/category/studio-notes</span><span>one page per category</span></div><div class=\"row\"><span class=\"chip\">Menu · Footer</span><span>linked under About</span></div></div></div>",
    },
    {
      type: "info",
      title: "Today",
      text: [
        "The Journal is ready but empty: no categories and no published posts yet. Until the first post is published, the Journal page shows a short note instead of cards.",
      ],
    },
  ],
  sections: [
    {
      id: "journal-categories",
      title: "Make your categories first",
      path: "Content > Journal categories",
      who: "Admin · Editor",
      keywords: "category section label colour filter",
      blocks: [
        {
          type: "paragraph",
          text: "Categories are the sections of the Journal, such as *Studio notes*, *New themes* or *Gift ideas*. Two to four is plenty. Each post sits in one, and the category's colour becomes the little label on its card.",
        },
        {
          type: "steps",
          items: [
            "Open {{Content > Journal categories}} and press [[Create New]] (the first picture).",
            "Type the name ((1)): short, because it is a label on a card.",
            "Choose a **Label colour** ((2)): Deep Lilac, Light Sage, Warm Terracotta, White Rock (cream) or Soft Lavender.",
            "Write one sentence for the top of the category's own page ((3)). Optional.",
            "Leave the **Web address** ((4)) empty: it is made from the name. **Display order** ((5)) sets its place in the filter row.",
            "Press [[Save]] ((6)). Categories have no drafts.",
          ],
        },
        {
          type: "screenshot",
          file: "35-journal-categories-list.webp",
          width: 1200,
          height: 367,
          caption: "Content → Journal categories. Create New adds one; click a name to change it.",
          title: "Journal categories",
          callouts: [
            { n: 1, label: "Create New — add a category" },
            { n: 2, label: "Click a category to open it" },
          ],
        },
        {
          type: "screenshot",
          file: "35-journal-category.webp",
          width: 1200,
          height: 467,
          caption: "A category: its name, the colour of its label, one sentence for its page, and its place in the filter row. Save puts it live, but a category only appears on the website once it has a published post.",
          title: "Journal categories",
          callouts: [
            { n: 1, label: "Name — short, it is a label on a card" },
            { n: 2, label: "Label colour" },
            { n: 3, label: "Description — one sentence for the category page" },
            { n: 4, label: "Web address — /journal/category/…" },
            { n: 5, label: "Display order in the filter row" },
            { n: 6, label: "Save — no drafts here" },
          ],
        },
        {
          type: "tip",
          text: [
            "A category with no published posts stays hidden on the website, so you can set them all up before your first story is ready.",
          ],
        },
      ],
    },
    {
      id: "journal-write",
      title: "Write a journal post",
      path: "Content > Journal > Create New",
      who: "Admin · Editor",
      keywords: "new post write article blog",
      blocks: [
        {
          type: "paragraph",
          text: "Start from {{Content > Journal}} and press [[Create New]] ((1)), or use [[Write a journal post]] on the dashboard or in [⌘K](#cmdk).",
        },
        {
          type: "screenshot",
          file: "35-journal-list.webp",
          width: 1200,
          height: 433,
          caption: "Content → Journal lists every post with its cover, category and status. Click a post to open it.",
          title: "Journal",
          callouts: [
            { n: 1, label: "Create New — write a post" },
            { n: 2, label: "Click a post to open it" },
            { n: 3, label: "Status — Draft or Published" },
          ],
        },
        {
          type: "steps",
          items: [
            "Type the **Title** ((1)). Up to 90 characters; shorter reads better on the cards.",
            "Write a **Short summary** ((2)) for the card and for Google, or leave it empty to use the opening lines of the post.",
            "Choose a **Cover photograph** ((3)): landscape, at least 1600 pixels wide. It is required.",
            "Write the post ((4)). Use **Heading 2** for each part of the story.",
            "In the right-hand column choose a **Category** ((7)). The **Web address** ((5)) is made from the title, and the **Publish date** ((6)) fills itself in when you publish.",
            "Tick **Feature at the top of the Journal** ((8)) if this is the story to show first.",
            "Check **Written by** ((9)). It says *Maison Palettia* unless you change it; add a role and a round photo for a personal post.",
            "Press the eye ((10)) to preview, then [[Publish changes]] ((11)).",
          ],
        },
        {
          type: "screenshot",
          file: "35-journal-post.webp",
          width: 1200,
          height: 1083,
          caption: "A journal post: title, short summary, cover photograph and the text on the left; web address, publish date, category, featured, tags and the author on the right. It saves as a draft until you press Publish changes.",
          title: "Journal post",
          callouts: [
            { n: 1, label: "Title" },
            { n: 2, label: "Short summary (optional)" },
            { n: 3, label: "Cover photograph — required, landscape" },
            { n: 4, label: "The post — headings, lists, quotes, links and photos" },
            { n: 5, label: "Web address — /journal/…" },
            { n: 6, label: "Publish date — filled in when you publish" },
            { n: 7, label: "Category — one per post" },
            { n: 8, label: "Feature at the top of the Journal" },
            { n: 9, label: "Written by — name, role, photo" },
            { n: 10, label: "Preview" },
            { n: 11, label: "Publish changes" },
          ],
        },
        {
          type: "warning",
          text: [
            "**Careful:** pressing [[Create New]] saves an empty *Untitled* draft straight away. If you change your mind, the draft is harmless and never public; delete it from the list (tick its box, then [[Delete]]) to keep the dashboard tidy.",
          ],
        },
        {
          type: "tip",
          text: [
            "**Tags** (in the right-hand column) are short words such as *candles* or *kids*. Press <<Enter>> after each one. **Reading time** works itself out when you save.",
          ],
        },
      ],
    },
    {
      id: "journal-text",
      title: "Headings, photos and links inside a post",
      keywords: "rich text editor heading quote list link photo image caption wide divider upload",
      blocks: [
        {
          type: "list",
          items: [
            "**Headings:** select a line and choose Heading 2 (a new part of the story), Heading 3 or Heading 4 from the [[T]] menu.",
            "**Bold, italic, links:** select words and use the small toolbar. A link to another page of your site can start with `/`, for example `/events`.",
            "**Lists, a quote or a divider:** press [[+]] at the start of an empty line and choose one.",
            "**A photo:** press [[+]] on an empty line, or type `/upload`, then choose a photo from Media. Give it a caption if you like, and choose **Text width** or **Wide** (it breaks out of the text column).",
            "**Read next** (under the post): pick up to three posts to suggest at the end. Leave it empty and the newest posts in the same category are suggested.",
          ],
        },
        {
          type: "tip",
          text: [
            "Photos placed in a post come from {{Content > Media}}, so give them a good description there. “Used on” on the photo lists the post, and the photo can't be deleted while the post uses it.",
          ],
        },
      ],
    },
    {
      id: "journal-publish",
      title: "Publish, schedule or feature a story",
      keywords: "publish schedule featured backdate unpublish",
      blocks: [
        {
          type: "steps",
          items: [
            "Press [[Publish changes]]. The post appears on the Journal page within a second or two, newest first.",
            "Or use the arrow beside it and [[Schedule Publish]] to choose a date and time (see [Schedule a change for later](#schedule)).",
            "To show a post large at the top of the Journal, tick **Feature at the top of the Journal**. If several are ticked, the newest featured one is shown.",
            "To backdate a story, change its **Publish date**. The date is printed on the post and decides its place in the list.",
            "To take a post down, open the [[⋮]] menu at the top right and choose [[Unpublish]]. It goes back to being a draft.",
          ],
        },
        {
          type: "warning",
          text: [
            "The cover photograph follows the same rule as hero photos: a photo marked AI-generated or of unknown origin can't be published as a cover unless AI imagery is allowed under {{Settings > Site details}} › Advanced. Use your own studio photos.",
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "Every published post gets its own share picture for WhatsApp and social media, made automatically. Renaming a published post adds a [redirect](#redirects) from the old address for you.",
          ],
        },
      ],
    },
    {
      id: "journal-on-pages",
      title: "Show your newest stories on another page",
      keywords: "latest from the journal block section homepage",
      blocks: [
        {
          type: "paragraph",
          text: "The page section **Latest from the Journal** shows your newest stories as cards on any page, such as the homepage or About. It is not on any page yet. See [Latest from the Journal](#latest-journal-block) for how to add it.",
        },
      ],
    },
    {
      id: "journal-tidy",
      title: "Rename, move or delete",
      who: "Admin · Editor (deleting a category: Admin)",
      keywords: "delete category move rename",
      blocks: [
        {
          type: "list",
          items: [
            "**Rename a category:** open it, change the name and [[Save]]. Its posts follow, and a redirect is added from its old address.",
            "**Delete a category:** only the owner (Admin) can, and only when no post uses it. Otherwise the message says, for example, “2 journal posts use this category. Move them to another category first.”",
            "**Delete a post:** tick it in the list and press [[Delete]]. Usually it is better to [[Unpublish]] it, so you can bring it back.",
            "The Journal also has an RSS feed (`/journal/rss.xml`) that news readers pick up by themselves. Nothing to set.",
          ],
        },
      ],
    },
  ],
};
