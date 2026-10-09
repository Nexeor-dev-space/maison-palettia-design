import Image from "next/image";

import { BlobButton } from "@/components/ui/BlobButton";
import { PeelNote } from "@/components/ui/PeelNote";
import { StitchButton } from "@/components/ui/StitchButton";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Button preview",
  description: "Temporary: the two candidates for the hero's secondary action.",
  path: "/button-preview",
  noindex: true,
});

/*
  TEMPORARY. Both candidates for the hero's "Plan a private event", beside the
  real primary, on the two grounds the banner shows them on: the shaded
  photograph once it has opened, and Light Sage before it does. Delete this
  route once the choice is made.
*/
const PAIR = "min-h-[3.25rem] px-9 md:min-h-[3.75rem]";

function Pair({ option }: { option: "stitch" | "note" }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
      <BlobButton href="/events" tone="sage" className={PAIR}>
        Explore experiences
      </BlobButton>
      {option === "stitch" ? (
        <StitchButton href="/private-events" className={PAIR}>
          Plan a private event
        </StitchButton>
      ) : (
        <PeelNote href="/private-events" className={PAIR}>
          Plan a private event
        </PeelNote>
      )}
    </div>
  );
}

export default function ButtonPreviewPage() {
  return (
    <div className="space-y-0">
      {(["stitch", "note"] as const).map((option, i) => (
        <section key={option} data-option={option} className="grid md:grid-cols-2">
          <div className="relative flex min-h-[22rem] flex-col items-center justify-center gap-6 overflow-hidden px-4 py-12">
            <Image src="/images/image.png" alt="" fill sizes="50vw" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-[rgb(35_31_32/0.45)]" />
            <p className="relative text-label uppercase tracking-eyebrow text-cream">
              Choice {i + 1} · {option === "stitch" ? "Stitched" : "Sticky note"} · on the photograph
            </p>
            <div className="relative" data-pair="photo">
              <Pair option={option} />
            </div>
          </div>
          <div className="flex min-h-[22rem] flex-col items-center justify-center gap-6 bg-sage px-4 py-12">
            <p className="text-label uppercase tracking-eyebrow text-text">
              Choice {i + 1} · on Light Sage
            </p>
            <div data-pair="sage">
              <Pair option={option} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
