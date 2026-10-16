import Link from "next/link";

import { TrackCredit } from "@/components/layout/TrackCredit";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getMusicTracks } from "@/lib/music.server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Music credits",
  description: "The music played on the Maison Palettia website, and the artists who made it.",
  path: "/music-credits",
});

/**
 * /music-credits — every track in the player's playlist, credited.
 *
 * The licences most free music comes under (Creative Commons BY above all)
 * ask for the creator's credit to be reasonably findable, not only visible
 * while their track happens to be playing. The player's panel links here and
 * the footer's legal row carries the link while the player is on.
 *
 * Every active track is listed, credit required or not: it costs nothing and
 * it is the courteous thing. Cached under `collection:music-tracks`, purged
 * by any change to a track (cms/collections/content/revalidation.ts).
 */
export default async function MusicCreditsPage() {
  const tracks = await getMusicTracks();

  return (
    <section aria-labelledby="music-credits-title" className="bg-sage py-[4rem] md:py-section lg:py-section-lg">
      <Container>
        <Eyebrow>Studio sounds</Eyebrow>
        <DisplayHeading as="h1" id="music-credits-title" className="mt-7 md:mt-9" lines={["Music", "credits."]} />

        {tracks.length > 0 ? (
          <>
            <p className="mt-7 max-w-[38rem] text-lead text-text/80">
              The music you can play on this site is shared by its creators under the licences below. Thank you to every one of
              them.
            </p>
            <ol className="mt-12 grid max-w-[46rem] gap-5">
              {tracks.map((track) => (
                <li key={track.id} className="rounded-[1.25rem] bg-cream p-6 md:p-7">
                  <p className="text-body font-medium text-text">{track.title}</p>
                  <p className="text-fine text-text/70">{track.artist}</p>
                  <p className="mt-3 text-fine leading-relaxed text-text/85">
                    <TrackCredit track={track} />
                  </p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-7 max-w-[38rem] text-lead text-text/80">
            No music is playing on the site at the moment.{" "}
            <Link href="/" className="border-b border-terracotta/50 pb-0.5 hover:border-terracotta">
              Back to the homepage
            </Link>
            .
          </p>
        )}
      </Container>
    </section>
  );
}
