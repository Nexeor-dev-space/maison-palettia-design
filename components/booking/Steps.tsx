import { Reveal } from "@/components/motion/Reveal";

/**
 * Where the visitor is in the journey.
 *
 * Two steps, stated plainly. A booking flow that hides its own length is the
 * quickest way to lose someone at the second screen; one that shows two short
 * steps is asking for something finite.
 *
 * Its own file rather than an export from the booking route: importing a
 * component out of a `page.tsx` pulls that whole route module — metadata,
 * `generateStaticParams` and all — into the bundle of everything that uses it.
 */
export function Steps({ current }: { current: 1 | 2 }) {
  const steps = ["Your details", "Payment"] as const;

  return (
    <Reveal variant="fadeIn">
      <ol className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line pt-6 md:mt-14">
        {steps.map((label, i) => {
          const n = (i + 1) as 1 | 2;
          const active = n === current;
          return (
            <li key={label} className="flex items-center gap-3">
              {/*
                The current step is marked by a rule, not by its ink. Deep
                Lilac on the page ground measures 3.6:1 at this size, under the
                4.5:1 a 10px label owes — and colour alone should not be
                carrying state in any case. Charcoal for both, with the lilac
                underline doing the pointing.
              */}
              <span
                aria-current={active ? "step" : undefined}
                className={
                  active
                    ? "border-b-2 border-primary pb-1.5 text-[0.62rem] font-semibold uppercase tracking-eyebrow text-text"
                    : "pb-1.5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/70"
                }
              >
                {String(n).padStart(2, "0")} &nbsp;{label}
              </span>
              {i < steps.length - 1 ? <span aria-hidden className="h-px w-8 bg-line" /> : null}
            </li>
          );
        })}
      </ol>
    </Reveal>
  );
}
