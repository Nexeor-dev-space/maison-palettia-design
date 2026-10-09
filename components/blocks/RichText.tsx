import { RichText } from "@payloadcms/richtext-lexical/react";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

import { stored } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `richText` → a prose band (SPEC §E.1) — the one block with no section of
 * the site's behind it, for the landing pages an editor builds from scratch
 * (a future journal post is one of these, SPEC §E.2).
 *
 * The type scale is the site's own: paragraphs at `lead`, headings in the
 * script at the compact size the sub-pages use, links underlined in Deep
 * Lilac the way /events' "View location" is. It sits on the page's
 * near-white ground; `width` picks a reading measure or the full container.
 */
const PROSE = cn(
  "text-lead text-text",
  "[&_p]:mt-5 [&_p:first-child]:mt-0",
  "[&_h2]:heading-script [&_h2]:mt-12 [&_h2]:pb-[0.2em] [&_h2]:text-script-compact",
  "[&_h3]:mt-9 [&_h3]:text-h4 [&_h3]:font-semibold",
  "[&_h4]:mt-7 [&_h4]:text-body [&_h4]:font-semibold",
  "[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-2",
  "[&_blockquote]:mt-8 [&_blockquote]:border-l-2 [&_blockquote]:border-terracotta [&_blockquote]:pl-5 [&_blockquote]:text-text/85",
  "[&_a]:underline [&_a]:decoration-primary [&_a]:underline-offset-4",
  "[&_hr]:my-10 [&_hr]:border-line",
);

export function RichTextAdapter({ block }: AdapterProps<"richText">) {
  const b = stored(block);
  if (!b?.body) return null;
  return (
    <section className="relative isolate bg-surface py-[3.5rem] md:py-[4.5rem]">
      <Container>
        <Reveal variant="fadeIn">
          <div className={cn(PROSE, b.width === "wide" ? "max-w-none" : "mx-auto max-w-[44rem]")}>
            <RichText data={b.body as Parameters<typeof RichText>[0]["data"]} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
