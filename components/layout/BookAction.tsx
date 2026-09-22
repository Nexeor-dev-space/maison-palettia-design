import Link from "next/link";

import { PRIMARY_CTA } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BookActionProps {
  /** Closes the mobile overlay when the action is used inside it. */
  onNavigate?: () => void;
  /** "bar" is the header's inline action; "panel" is the larger mobile one. */
  size?: "bar" | "panel";
  className?: string;
}

/**
 * The booking action: a filled square button, and the only solid block of
 * colour in the bar.
 *
 * Carries the site's 8px corner, the same as the shared <Button>.
 * Nothing else on this site is rounded — the photography is hard-edged
 * throughout and the two arches are the deliberate exceptions — so a pill in
 * the corner would be the one soft shape on the page.
 *
 * Filled in Deep Lilac with the light `on-primary` ink — the site's primary
 * button. It was Light Sage while the only place it appears, the mobile
 * menu, was charcoal: sage read instantly against charcoal. The menu is the
 * page's white now, at the client's ask, and sage on white all but loses its
 * edge, where lilac stands clear of it.
 *
 * The label on Deep Lilac measures 4.9:1, clear of the 4.5:1 a label this
 * size owes; the hover lightens the fill slightly. The arrow keeps its drift
 * so the hover answers with movement as well as tone.
 *
 * SIZING IS LOAD-BEARING. The bar sets its own height — see the four header
 * tokens in globals.css — so this can never push the bar taller, but it can
 * overflow it. The tightest case is the settled bar at `sm`, which is 72px.
 * At these paddings the button measures about 45px, leaving roughly 13px of
 * air top and bottom. Do not add vertical padding here without re-measuring
 * against that 72px.
 *
 * It grew with the bar. At 35px in a 64px header it was a control in a strip;
 * the same button in a 104px one would have been a control adrift in a field,
 * which is the failure mode of simply making a header taller.
 */
export function BookAction({ onNavigate, size = "bar", className }: BookActionProps) {
  const bar = size === "bar";

  return (
    <Link
      href={PRIMARY_CTA.href}
      onClick={onNavigate}
      className={cn(
        "group inline-flex items-center justify-center gap-2.5 rounded-sm font-medium uppercase tracking-eyebrow",
        "bg-primary text-on-primary",
        "press-in transition-colors duration-300 ease-soft hover:bg-primary/90",
        // Narrower flanks between 1024 and 1280, where the bar is at its
        // tightest: that is the band in which the inline nav exists and the
        // mark is centred, so the actions are held to exactly half of what the
        // mark and the gaps leave over.
        //
        // Re-measured after Phase 1's type scale, which took this label to a
        // true 12px control size and added about 9px to the button. With a
        // booking held at 1024 the cluster wanted 403.3px of a 402.6px track;
        // twelve here, with twelve in the gaps, clears it. Re-measure at 1024
        // with the basket showing before changing any of it.
        bar ? "px-5 py-4 text-action leading-none lg:px-3 xl:px-6" : "px-6 py-4 text-action leading-none",
        className,
      )}
    >
      {PRIMARY_CTA.label}
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
