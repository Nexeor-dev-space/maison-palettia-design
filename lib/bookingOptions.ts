import { getCreativeExperiences } from "@/lib/experiences";
import { bookingStepHref, getAllWorkshops, isFullyBooked, workshopHref } from "@/lib/workshops";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * WHAT THE "BOOK A SESSION" SHEET OFFERS
 * ==========================================================================
 *
 * One list, derived rather than written: the activities the studio actually
 * sells a date for, each pointing at the furthest-along step the existing
 * booking architecture lets it.
 *
 * ==========================================================================
 * WHY IT IS DERIVED FROM BOTH FILES
 * ==========================================================================
 *
 * The two halves of the answer live apart, and neither is enough on its own:
 *
 *   lib/experiences.ts .. WHAT it is. The name a visitor knows, the one-line
 *                         description, and the photograph. It also carries
 *                         `kind`, which is the only honest definition of
 *                         "bookable online" on this site — `diy` activities
 *                         run whenever the table is open and are never booked.
 *   lib/workshops.ts .... WHEN it runs, and whether a seat is left. An
 *                         activity with no upcoming session is not something a
 *                         visitor can book today, whatever its `kind` says.
 *
 * So this walks the scheduled experiences, asks the schedule what is actually
 * open, and hands back one option per activity. Add a third scheduled activity
 * with a date and it appears here, in the sheet and nowhere else to edit.
 *
 * NOTHING HERE IS INVENTED. No prices, no dates, no availability — the sheet
 * is a way IN to the booking flow, not a second copy of it, and every one of
 * those facts is already on the page this sends a visitor to.
 */
export interface BookingOption {
  slug: string;
  /** The activity's own name, as lib/experiences.ts has it. */
  name: string;
  /** One line, where the data has one. Absent rather than invented. */
  description?: string;
  image?: ImageAsset & { position?: string };
  /**
   * Where choosing it goes.
   *
   * THE DEEPEST STEP THE ARCHITECTURE ALLOWS, which is what "avoid making the
   * user repeat the selection" means in practice:
   *
   *   a session with seats .. `/events/{slug}/book`, the booking step itself.
   *                           The activity is already chosen, so the next
   *                           screen is the form rather than a second list.
   *   anything else ......... `/events/{slug}`, the activity's own page. A
   *                           full session cannot be booked, and sending
   *                           somebody to a booking form for it would be the
   *                           site promising something it cannot do.
   */
  href: string;
  /** What the card's affordance says, which follows `href`. */
  action: string;
  /** Whether a seat is open right now. Drives the label, never a claim. */
  bookable: boolean;
}

export async function getBookingOptions(): Promise<BookingOption[]> {
  const [experiences, workshops] = await Promise.all([
    getCreativeExperiences(),
    getAllWorkshops(),
  ]);

  const now = Date.now();
  /*
    The next session for an activity, if it has one still to come. Sorted
    already by `getAllWorkshops`, so the first match is the soonest.
  */
  const nextFor = (slug: string) =>
    workshops.find(
      (workshop) => workshop.slug === slug && Date.parse(workshop.startsAt) >= now,
    );

  return experiences
    .filter((experience) => experience.kind === "scheduled")
    .map((experience) => {
      const next = nextFor(experience.slug);
      const bookable = next ? !isFullyBooked(next) : false;

      return {
        slug: experience.slug,
        name: experience.name,
        description: experience.description,
        image: experience.image,
        href: next
          ? bookable
            ? bookingStepHref(next)
            : workshopHref(next)
          : `/events/${experience.slug}`,
        action: bookable ? "Choose session" : "See dates",
        bookable,
      } satisfies BookingOption;
    });
}
