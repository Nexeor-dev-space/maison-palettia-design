import { cn } from "@/lib/utils";

/**
 * Placeholder for the collection while workshop data is in flight.
 *
 * Not mounted yet. The homepage awaits its workshops in place — see the note
 * in <UpcomingWorkshops> on why a <Suspense> boundary is the wrong trade while
 * the data is local — so this is here for the two places that will need it:
 * that boundary, once the CMS call is real, and the workshop listing page.
 *
 * Only the collection: the section's label, heading and introduction are
 * static copy and are already on screen, so skeletoning them would make the
 * page flicker for no information gained.
 *
 * It traces the real composition — one wide plate off the left edge, two
 * offset entries of different proportions — rather than showing three equal
 * bars, so the layout does not visibly rearrange itself when the content
 * lands. Plain boxes and one shared pulse; a skeleton that costs a library is
 * a skeleton that has missed the point.
 */
export function WorkshopsSkeleton() {
  return (
    <div aria-hidden className="mt-16 animate-pulse md:mt-24 lg:mt-28">
      <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
        <div className="col-span-12 -mx-gutter lg:col-span-8 lg:-ml-gutter lg:mr-0">
          <Block className="aspect-[4/3] sm:aspect-[3/2]" />
        </div>

        <div className="col-span-12 mt-9 max-w-[34rem] md:ml-[8%] lg:col-span-4 lg:ml-0 lg:mt-0">
          <Block className="h-2 w-24" />
          <Block className="mt-7 h-6 w-3/4" />
          <Block className="mt-5 h-3 w-full" />
          <Block className="mt-2.5 h-3 w-5/6" />
          <Block className="mt-9 h-10 w-2/3" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
        <div className="col-span-12 mr-10 mt-16 md:col-span-5 md:col-start-2 md:mr-0 md:mt-24 lg:mt-28">
          <Block className="aspect-[4/5]" />
          <Block className="mt-6 h-5 w-2/3" />
          <Block className="mt-4 h-3 w-full" />
        </div>

        <div className="col-span-12 ml-10 mt-14 md:col-span-5 md:col-start-8 md:ml-0 md:mt-44 lg:col-span-4 lg:col-start-9 lg:mt-64">
          <Block className="aspect-square" />
          <Block className="mt-6 h-5 w-2/3" />
          <Block className="mt-4 h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

function Block({ className }: { className?: string }) {
  return <div className={cn("w-full bg-text/6", className)} />;
}
