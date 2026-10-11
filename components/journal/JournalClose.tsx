import { JOURNAL_COPY } from "@/components/journal/copy";
import { ClosingCta } from "@/components/sections/ClosingCta";

/** The Deep Lilac close under the Journal — the site's own close (the /gallery composition), with the Journal's words. */
export function JournalClose() {
  const { lines, body, primary, secondary } = JOURNAL_COPY.close;
  return (
    <ClosingCta
      variant="gallery"
      lines={lines}
      body={body}
      primary={primary}
      secondary={secondary}
    />
  );
}
