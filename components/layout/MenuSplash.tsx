import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { cn } from "@/lib/utils";

/**
 * The scatter of brand cut-outs along the foot of a megamenu.
 *
 * ==========================================================================
 * WHAT IT IS FOR
 * ==========================================================================
 *
 * The menus were a near-white field with rows of text on it — correct, and
 * indistinguishable from any other site's dropdown. This is the one place the
 * panel gets to look like the Maison: the deck scatters its cut-outs along
 * the foot of a page, and so does this.
 *
 * ==========================================================================
 * THREE RULES IT KEEPS
 * ==========================================================================
 *
 * IT NEVER SITS UNDER TEXT. The panel reserves a band of bottom padding for
 * this and the marks live in it. Decoration behind a menu row is decoration
 * that costs you the row — the contrast stops being a number you can check,
 * because it becomes a different number over every mark.
 *
 * THE SCATTER IS FIXED, NOT RANDOM. Every position, size, angle and colour
 * below is written down. A scatter generated at render time changes on every
 * paint, which is the "constant floating" the brief rules out, and it would
 * differ between the server and the client.
 *
 * THEY BREAK THE EDGE. Most sit low enough to be cut by the panel's own
 * bottom, which is how the deck lays a cut-out — over an edge, never floating
 * in clear space. The panel clips them, so nothing escapes the menu.
 *
 * ==========================================================================
 * AND IT ARRIVES AFTER THE PANEL DOES
 * ==========================================================================
 *
 * `shown` is the panel's own flag. The marks rise and fade in behind the rows
 * rather than with them, so the order a visitor reads is: the surface, then
 * what is on it, then the flourish. Starting them together would put movement
 * at the foot of the panel at the exact moment the eye is trying to find the
 * first link.
 */
export function MenuSplash({ shown, className }: { shown: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        // `-z-10` puts it behind the rows; the panel is `isolate` so this
        // cannot slip behind the panel's own ground and disappear.
                // The band's weight lives here, once, rather than on eleven marks:
        // this is a texture at the foot of the panel, not a second thing to
        // look at, and at full strength the cut-outs start competing with the
        // links above them.
        "pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-[5.5rem] select-none opacity-[0.55] md:block lg:h-[6.5rem]",
        className,
      )}
    >
      {SCATTER.map((mark, i) => (
        <span
          key={`${mark.name}-${i}`}
          className={cn(
            "absolute block",
            // The lift is the wrapper's; the drawing is the mark's own. Two
            // properties only, both composited.
            "transition-[opacity,translate] ease-editorial motion-reduce:transition-none",
            shown
              ? "translate-y-0 opacity-100 duration-[520ms]"
              : "translate-y-3 opacity-0 duration-[200ms]",
          )}
          style={{
            left: `${mark.left}%`,
            bottom: `${mark.bottom}rem`,
            width: `${mark.size}rem`,
            rotate: `${mark.turn}deg`,
            transitionDelay: shown ? `${260 + i * 48}ms` : "0ms",
          }}
        >
          {/*
            THEY DRAW THEMSELVES, one after another.

            `stamp` was a static shape that faded in — a picture of a doodle
            rather than a doodle being made. `draw` is the brand's own
            gesture: the outline runs round the shape and the fill arrives
            behind it, which is the same mark the rest of the site makes.

            `trigger="state"` and `on={shown}` because the panel owns the
            moment. The default trigger is a view timeline, and a timeline
            inside this panel resolves against the panel itself — a scroll
            container that never scrolls — so every mark would report as
            covered and sit permanently drawn. Measured that exact failure on
            the home page's marks before this prop existed.

            The delay is the wrapper's stagger plus a beat, so a mark lifts
            into place and then draws, rather than drawing on its way in.
          */}
          <DoodleMark
            name={mark.name}
            color={mark.color}
            treatment="draw"
            trigger="state"
            on={shown}
            delay={shown ? 300 + i * 48 : 0}
          />
        </span>
      ))}
    </span>
  );
}

/*
  THE SCATTER.

  Eleven marks across the full width, none of them evenly spaced — the gaps
  run 6, 8, 5, 11, 7, 9, 6, 10, 8, 7 per cent, so the eye never finds a
  rhythm. Sizes alternate broadly rather than in a pattern, and every angle is
  a different number.

  `bottom` is mostly negative: a mark set below the panel's floor is cut by it,
  which is the deck's own treatment and what keeps this reading as a torn
  band rather than as a row of stickers.

  COLOURS. Deep Lilac, Soft Lavender and Warm Terracotta only. White Rock is
  the panel's ground now, so a White Rock cut-out on it is an invisible one,
  and Charcoal Slate at this size reads as dirt rather than as paint.
  Terracotta is the accent the brand guide calls a highlight, so it is the
  rarest of the three.
*/
const SCATTER: readonly {
  name: DoodleName;
  color: string;
  left: number;
  bottom: number;
  size: number;
  turn: number;
}[] = [
  { name: "splash", color: INK.lavender, left: 2, bottom: -1.4, size: 4.5, turn: -12 },
  { name: "starleaf", color: INK.lilac, left: 8, bottom: -0.4, size: 2.6, turn: 18 },
  { name: "wave", color: INK.lavender, left: 16, bottom: -1.9, size: 5.4, turn: -5 },
  { name: "dot", color: INK.terracotta, left: 21, bottom: 1.1, size: 1.1, turn: 0 },
  { name: "bean", color: INK.lilac, left: 32, bottom: -1.2, size: 3.4, turn: 26 },
  { name: "starburst", color: INK.lavender, left: 41, bottom: -1.7, size: 4.8, turn: -20 },
  { name: "zigzag", color: INK.lilac, left: 52, bottom: -0.7, size: 3.9, turn: 9 },
  { name: "splash", color: INK.terracotta, left: 61, bottom: -1.5, size: 3.1, turn: 33 },
  { name: "coral", color: INK.lavender, left: 71, bottom: -1.8, size: 5.1, turn: -14 },
  { name: "starleaf", color: INK.lilac, left: 82, bottom: -0.9, size: 2.9, turn: 22 },
  { name: "cutout", color: INK.lavender, left: 90, bottom: -1.6, size: 4.6, turn: -8 },
];
