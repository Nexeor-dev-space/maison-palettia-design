import Image from "next/image";
import Link from "next/link";

import type { CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";

/**
 * One activity: the photograph, then its name and line beneath.
 *
 * Shared by the homepage's experience groups and the /events listing, so the
 * same activity never looks two different ways on two pages.
 *
 * WORDS UNDER THE PICTURE, NEVER ON IT. At this size a caption laid over a
 * photograph needs a scrim heavy enough to spoil the image before a 13px line
 * clears 4.5:1. Set beneath, the photograph stays whole and the type sits on
 * the page's own ground at full contrast.
 *
 * The studio's status flag ("Coming soon") is printed in words beside the
 * name. It has to be read, and it has to stop anyone walking to the mall for
 * something that is not running yet — a colour-coded badge would do neither
 * for a reader who cannot see the colour.
 */
export function ExperiencePlate({
  experience,
  aspect,
  sizes,
  large = false,
}: {
  experience: CreativeExperience;
  aspect: string;
  sizes: string;
  large?: boolean;
}) {
  return (
    <Link href={`/events/${experience.slug}`} className="group block">
      <div className={cn("relative overflow-hidden rounded-sm bg-cream", aspect)}>
        {experience.image ? (
          <Image
            src={experience.image.src}
            // The name is set in text directly beneath; the picture illustrates it.
            alt=""
            fill
            sizes={sizes}
            style={{ objectPosition: experience.image.position ?? "50% 50%" }}
            className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "font-medium leading-snug text-text decoration-primary underline-offset-4 group-hover:underline",
              large ? "text-lead md:text-[1.4rem]" : "text-body",
            )}
          >
            {experience.name}
          </p>
          {experience.description ? (
            <p
              className={cn(
                "mt-1.5 leading-[1.6] text-text/80",
                large ? "max-w-[30rem] text-body" : "text-fine",
              )}
            >
              {experience.description}
            </p>
          ) : null}
        </div>
        {experience.status ? (
          <span className="mt-0.5 shrink-0 border border-text/40 px-2 py-1 text-label font-semibold uppercase leading-none tracking-eyebrow text-text">
            {experience.status}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
