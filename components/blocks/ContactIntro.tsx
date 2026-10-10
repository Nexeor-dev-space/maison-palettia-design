import { resolveLink } from "@/cms/fields/link";
import { ContactIntro } from "@/components/sections/contact/ContactIntro";
import { getContact, getSocialLinks } from "@/lib/constants.server";

import { imageOf, lines, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `contactIntro` → <ContactIntro> (SPEC §E.1).
 *
 * The block holds the page's words and its photograph; the address, email,
 * phone and social links are Site settings' (`getContact`, `getSocialLinks`),
 * the same details the footer prints, so they are never typed twice. A
 * detail that is not set is not shown — the page's long-standing rule.
 */
export async function ContactIntroAdapter({ block }: AdapterProps<"contactIntro">) {
  const [contact, social] = await Promise.all([getContact(), getSocialLinks()]);
  const b = stored(block);
  if (!b) return <ContactIntro contact={contact} social={social} />;

  return (
    <ContactIntro
      eyebrow={text(b.eyebrow)}
      lines={lines(b.headingLines) ?? []}
      lead={text(b.lead)}
      findUsHeading={text(b.findUsHeading)}
      whereTerm={text(b.whereTerm) ?? undefined}
      emailTerm={text(b.emailTerm) ?? undefined}
      phoneTerm={text(b.phoneTerm) ?? undefined}
      followTerm={text(b.followTerm) ?? undefined}
      venuesLinkLabel={text(b.venuesLinkLabel)}
      venuesLink={resolveLink(b.venuesLink) ?? "/events"}
      formHeading={text(b.formHeading)}
      formLead={text(b.formLead)}
      portrait={imageOf(b.portrait)}
      contact={contact}
      social={social}
    />
  );
}
