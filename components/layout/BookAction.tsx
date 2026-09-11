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
 * Square corners rather than the `rounded-pill` the shared <Button> carries.
 * Nothing else on this site is rounded — the photography is hard-edged
 * throughout and the two arches are the deliberate exceptions — so a pill in
 * the corner would be the one soft shape on the page.
 *
 * Filled in Light Sage, which is the same pairing the shared <Button>'s `sage`
 * variant uses and the same one this action already fell to on hover, so the
 * two read as one system rather than two ideas about what a button is. Sage
 * rather than Deep Lilac because the bar's ground is charcoal: sage is the
 * palest thing in the palette and reads instantly against it, where lilac is
 * dark and would sit into the ground rather than on it.
 *
 * Charcoal on Light Sage measures 9.07:1, and the hover dims the fill to 85%
 * over the charcoal bar, which lands the same type at 6.98:1 — both far clear
 * of the 4.5:1 a label this size owes. The arrow keeps its drift so the hover
 * answers with movement as well as tone.
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
        "group inline-flex items-center justify-center gap-2.5 font-medium uppercase tracking-eyebrow",
        "bg-sage text-text",
        "transition-colors duration-300 ease-soft hover:bg-sage/85",
        // Narrower flanks between 1024 and 1280, where the bar is at its
        // tightest: that is the band in which the inline nav exists and the
        // mark is centred, so the actions are held to exactly half of what the
        // mark and the gaps leave over. Measured there with a booking held,
        // the cluster overran that share by about 6px; these eight pixels are
        // most of what buys it back. See the right track in <HeaderBar>.
        bar ? "px-5 py-4 text-[0.7rem] leading-none lg:px-4 xl:px-6" : "px-6 py-4 text-xs leading-none",
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
