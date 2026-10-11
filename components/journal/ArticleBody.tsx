import {
  RichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ScriptTitle } from "@/components/ui/SectionHeader";
import { headingId, type JournalBody } from "@/lib/cms/journalShared";
import type { Media } from "@/payload-types";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * The reading column — a post's Lexical body, set in the site's type
 * ==========================================================================
 *
 * The same renderer the `richText` block uses (components/blocks/RichText.tsx)
 * with four converters of our own, because a journal asks more of its
 * body than a landing page does:
 *
 *   PHOTOGRAPHS. An upload node becomes a <figure> through next/image,
 *   sized to the column (or broken out of it when the editor chose "wide"),
 *   with the caption the editor typed under it. The default converter
 *   prints a bare <picture> with every rendition as a `source`, which
 *   defeats the optimiser and prints no caption.
 *
 *   HEADINGS. h2 in the script, as every section heading on the site —
 *   UNLESS it carries a digit, because Hapsha's 7, 8 and 9 are placeholder
 *   marks (components/ui/SectionHeader.tsx); a "3 things to bring" heading
 *   is set in Montserrat instead. Each heading carries the anchor
 *   lib/cms/journalShared.ts' `headingsOf` computes, de-duplicated in the
 *   same document order, so a contents list and the body agree.
 *
 *   QUOTES. A Deep Lilac rule and a script quotation mark — the brand's
 *   pull-quote, not a browser's grey indent.
 *
 *   LINKS. Internal links resolve to the site's own addresses (a post, a
 *   page, an experience); the default converter needs telling how.
 *
 * ~68 characters a line: `max-w-reading` (42rem) at the body size.
 */

type Node = {
  type: string;
  version: number;
  text?: string;
  children?: Node[];
  [key: string]: unknown;
};

const plainText = (node: Node): string =>
  typeof node.text === "string"
    ? node.text
    : node.type === "linebreak"
      ? " "
      : (node.children ?? []).map(plainText).join("");

type UploadNode = Node & {
  value?: string | Media | null;
  fields?: { caption?: string | null; width?: "text" | "wide" | null } | null;
};
type LinkNode = Node & {
  fields: {
    linkType?: string;
    url?: string;
    newTab?: boolean;
    doc?: {
      relationTo: string;
      value: string | { slug?: string; id: string };
    } | null;
  };
};
type HeadingNode = Node & { tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" };

/** Where an internal link goes, per collection the editor may link to (cms/collections/content/Posts.ts `journalEditor`). */
function internalHref(doc: LinkNode["fields"]["doc"]): string {
  if (!doc || typeof doc.value !== "object" || !doc.value.slug) return "#";
  const slug = doc.value.slug;
  switch (doc.relationTo) {
    case "posts":
      return `/journal/${slug}`;
    case "experiences":
      return `/events/${slug}`;
    case "pages":
      return slug === "home" ? "/" : `/${slug}`;
    default:
      return "#";
  }
}

/** The default converters (paragraph, text, lists, rule…) with ours over them. One closure per render: the heading anchors count in document order. */
function converters(): JSXConvertersFunction {
  const seen = new Map<string, number>();
  return ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const heading = node as HeadingNode;
      const text = plainText(heading).replace(/\s+/g, " ").trim();
      let id: string | undefined;
      if (text) {
        const base = headingId(text);
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        id = n === 1 ? base : `${base}-${n}`;
      }
      const children = nodesToJSX({ nodes: heading.children ?? [] });
      const scriptSafe = !/\d/.test(text);
      if (heading.tag === "h2") {
        return scriptSafe ? (
          <h2
            id={id}
            className="heading-script mt-14 scroll-mt-28 pb-[0.15em] text-script-compact text-text"
          >
            <ScriptTitle>{text}</ScriptTitle>
          </h2>
        ) : (
          <h2
            id={id}
            className="mt-14 scroll-mt-28 text-h3 font-semibold tracking-display text-text"
          >
            {children}
          </h2>
        );
      }
      if (heading.tag === "h3") {
        return (
          <h3
            id={id}
            className="mt-10 scroll-mt-28 text-h4 font-semibold tracking-display text-text"
          >
            {children}
          </h3>
        );
      }
      return (
        <h4
          id={id}
          className="mt-8 scroll-mt-28 text-label font-semibold uppercase tracking-eyebrow text-text"
        >
          {children}
        </h4>
      );
    },

    quote: ({ node, nodesToJSX }) => (
      <blockquote className="relative mt-10 border-l-2 border-primary pb-1 pl-6 pt-9 md:pl-8 md:pt-10">
        {/* The mark sits in the quote's own top padding, inside the rule — never above it. The script's quote glyph rides high in its em box, hence the nudge down. */}
        <span
          aria-hidden
          className="heading-script pointer-events-none absolute left-6 top-0 translate-y-[0.3em] select-none text-[4.5rem] leading-[0.8] text-primary md:left-8 md:text-[5rem]"
        >
          &quot;
        </span>
        <div className="text-statement text-text/85">
          {nodesToJSX({ nodes: (node as Node).children ?? [] })}
        </div>
      </blockquote>
    ),

    upload: ({ node }) => <Figure node={node as UploadNode} />,

    link: ({ node, nodesToJSX }) => {
      const link = node as LinkNode;
      const children = nodesToJSX({ nodes: link.children ?? [] });
      const href =
        link.fields.linkType === "internal"
          ? internalHref(link.fields.doc)
          : (link.fields.url ?? "#");
      const external =
        link.fields.linkType !== "internal" && /^https?:/i.test(href);
      const classes =
        "underline decoration-primary decoration-[1.5px] underline-offset-4 transition-colors duration-300 ease-soft hover:text-primary focus-visible:text-primary";
      if (external || link.fields.newTab) {
        return (
          <a
            href={href}
            className={classes}
            target={link.fields.newTab ? "_blank" : undefined}
            rel={link.fields.newTab ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    },
  });
}

/** A photograph in the column, with its caption. Wide ones break out of the measure from `lg`. */
function Figure({ node }: { node: UploadNode }) {
  const media = node.value;
  if (
    !media ||
    typeof media !== "object" ||
    !media.url ||
    !media.mimeType?.startsWith("image")
  )
    return null;
  const wide = node.fields?.width === "wide";
  const caption = node.fields?.caption?.trim() || media.caption?.trim() || "";
  const alt = media.decorative ? "" : (media.alt ?? "");
  const width = media.width ?? 1600;
  const height = media.height ?? 1067;
  return (
    <figure className={cn("my-10 md:my-12", wide ? "lg:-mx-[9rem]" : null)}>
      <span className="plate block overflow-clip rounded-[1.25rem] bg-cream">
        <Image
          src={media.url}
          alt={alt}
          width={width}
          height={height}
          sizes={
            wide
              ? "(min-width: 1024px) 60rem, 92vw"
              : "(min-width: 768px) 42rem, 92vw"
          }
          style={{ objectPosition: focalOf(media) }}
          className="h-auto w-full"
        />
      </span>
      {caption ? (
        <figcaption className="mt-3 text-fine text-text/75">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function focalOf(media: Media): string | undefined {
  return typeof media.focalX === "number" && typeof media.focalY === "number"
    ? `${media.focalX}% ${media.focalY}%`
    : undefined;
}

const PROSE = cn(
  "text-body text-text",
  "[&_p]:mt-6 [&_p:first-child]:mt-0",
  "[&_ul]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-2 [&_li]:pl-1 [&_li::marker]:text-primary",
  "[&_strong]:font-semibold [&_hr]:my-12 [&_hr]:border-0 [&_hr]:h-px [&_hr]:bg-line",
  "[&_p:has(+h2)]:mb-0",
);

export function ArticleBody({
  body,
  children,
  className,
}: {
  body: JournalBody;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(PROSE, "mx-auto w-full max-w-reading", className)}>
      <RichText
        data={body as Parameters<typeof RichText>[0]["data"]}
        converters={converters()}
        disableContainer
      />
      {children}
    </div>
  );
}
