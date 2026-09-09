import { cn } from "@/lib/utils";

/**
 * Which ground the signature is set on. The tone picks the ink, because on
 * this palette the ink is not a free choice — see the contract below.
 */
type SignatureGround = "warm" | "sage" | "lilac";

/**
 * Ink per ground, and the reason it is not a prop the caller passes freely.
 *
 * Every pairing here is a measured one. Against the Maison's own colours the
 * accents are mid-tone and the surfaces are pale, so most combinations land
 * between 3 and 4:1 — comfortably legible at display size and not legible
 * enough at body size. That is the whole reason a signature is set at
 * `SIGNATURE_SIZE` and never smaller:
 *
 *   Deep Lilac on White Rock ....... 3.95:1
 *   Deep Lilac on Light Sage ....... 3.83:1
 *   Light Sage on Deep Lilac ....... 3.83:1
 *
 * All three clear the 3:1 that text at 24px and above owes, and all three fail
 * the 4.5:1 owed below it. Shrink one of these and it stops being accessible;
 * that is a property of the palette, not of this component.
 */
const GROUNDS: Record<SignatureGround, string> = {
  /** White Rock or the off-white page: Deep Lilac. */
  warm: "text-primary",
  /** Light Sage: Deep Lilac again — Terracotta is 2.36:1 here and fails both bars. */
  sage: "text-primary",
  /** Deep Lilac: Light Sage, the pairing off the Maison's own packaging. */
  lilac: "text-sage",
};

/**
 * The smallest this may be set. 24px is where WCAG's large-text threshold
 * starts, and every ink pairing above depends on being over it.
 */
const SIGNATURE_SIZE = "text-[1.55rem] md:text-[1.7rem] lg:text-[1.85rem]";

interface SignatureProps {
  children: string;
  ground: SignatureGround;
  /** Placement only — margins and column spans. Never colour or size. */
  className?: string;
}

/**
 * The Maison's signage voice: a few words, set wide and in caps, marking a
 * section the way a painted sign marks a doorway.
 *
 * These were the script face until the brand pass. The script is the brand's
 * rarest gesture and it had reached every section on the homepage, which is
 * the one thing guaranteed to stop it feeling rare; it now appears three times
 * on the page — the hero, the experience, and the closing invitation — and
 * everywhere else that register is carried by this instead.
 *
 * Deliberately not a heading. It labels nothing and heads nothing; it is an
 * aside in the brand's own handwriting, so it stays a paragraph and keeps out
 * of the document outline.
 */
export function Signature({ children, ground, className }: SignatureProps) {
  return (
    <p
      className={cn(
        SIGNATURE_SIZE,
        GROUNDS[ground],
        "font-normal uppercase leading-[1.25] tracking-[0.22em]",
        className,
      )}
    >
      {children}
    </p>
  );
}
