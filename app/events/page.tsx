import { EventsBrowser } from "@/components/events/EventsBrowser";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { getAllWorkshops } from "@/lib/workshops";

// TODO(content): final SEO title and description pending client copy.
export const metadata = buildMetadata({
  title: "Events",
  description:
    "Every upcoming Maison Palettia event — pottery, painting and craft, at fixed times in malls across Dubai. Find a date, see the location, keep a place.",
  path: "/events",
});

/**
 * The programme — every scheduled session. Step one of the booking journey:
 * discover, understand, reserve, pay.
 *
 * A catalogue, not a repeat of the homepage. The homepage section gives three
 * dates equal weight as full-bleed blocks because it has to sell the idea of
 * booking at all; someone who has arrived here has already decided to look at
 * the programme, so the page behaves like an index.
 *
 * THE MASTHEAD IS DELIBERATELY SHORT. It used to open on a two-line display
 * heading at up to 4.25rem with a paragraph beside it and a 7rem gap before
 * the first session, which put the thing a visitor came for below the fold on
 * every laptop. This page is the top of a booking funnel, so it names itself
 * and gets out of the way: one line of type, one line of copy, then the
 * filters. The identity is carried by the eyebrow rule and the typography, not
 * by the height.
 *
 * Server component. Data is fetched here and handed down; only the filtering
 * below is client-side, so the head, the metadata and the query all stay on
 * the server.
 */
export default async function EventsPage() {
  const workshops = await getAllWorkshops();

  // The <main> landmark lives in the root layout; this is only the measure.
  return (
    <Container className="py-[3.5rem] md:py-[4.5rem] lg:py-[5.5rem]">
      <PageHead />
      {workshops.length === 0 ? <NoSessions /> : <EventsBrowser workshops={workshops} />}
    </Container>
  );
}

/**
 * Label, title and one line of orientation, on a single band.
 *
 * The copy sits beside the heading rather than under it so the whole masthead
 * is the height of the tallest of the two rather than the sum — which is most
 * of what shortened it.
 */
function PageHead() {
  return (
    <Reveal>
      <div className="grid grid-cols-12 items-end gap-x-6 gap-y-5 lg:gap-x-10">
        <div className="col-span-12 md:col-span-6">
          <p className="flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            The programme
          </p>

          <h1 className="mt-5 text-[1.9rem] font-light uppercase leading-[1.02] tracking-[-0.02em] sm:text-[2.25rem] lg:text-[2.5rem]">
            Upcoming events
          </h1>
        </div>

        <p className="col-span-12 max-w-[30rem] text-body leading-[1.75] text-text/80 md:col-span-5 md:col-start-8 md:pb-1">
          We bring the studio to a mall near you and run at fixed times. Everything is
          provided — bring nothing but yourself.
        </p>
      </div>
    </Reveal>
  );
}

/**
 * Nothing scheduled at all — distinct from a filter that matched nothing,
 * which the browser handles. The page keeps its shape and says so plainly.
 */
function NoSessions() {
  return (
    <Reveal className="mt-14 border-t border-line pt-12 md:mt-16 md:pt-16">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        The next dates are being set.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        New events are announced as each mall is confirmed.
      </p>
    </Reveal>
  );
}
