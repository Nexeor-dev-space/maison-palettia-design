import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse" | "inverseGhost" | "sage";
type ButtonSize = "sm" | "md" | "lg";
type ButtonShape = "soft" | "square";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Corner treatment. Defaults to the 8px radius used everywhere on the site. */
  shape?: ButtonShape;
  className?: string;
}

/**
 * The radius is a named option rather than something a caller overrides
 * through `className`: `cn` only concatenates, so two competing radius
 * utilities would be settled by their order in the generated stylesheet
 * rather than by the order they were written.
 *
 * `soft` is the site's radius — 8px, `--radius-sm` — and it is what every
 * button and every image plate now carries. It replaced a full pill, which was
 * the one corner treatment on the site that could not sit beside a photograph
 * without the two disagreeing.
 */
const shapeStyles: Record<ButtonShape, string> = {
  soft: "rounded-sm",
  square: "rounded-none",
};

/*
  Every button presses. It is one pixel and 120ms — the smallest amount of
  travel that still reads as contact, and the client has twice ruled out
  anything that bounces or scales.
*/
const base =
  "press-in inline-flex items-center justify-center gap-2 font-medium " +
  "transition-colors duration-200 ease-soft " +
  "disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  /* Deep Lilac, with the one light ink that survives it.
     ---------------------------------------------------------------------
     The note that used to sit here had the measurement right and the token
     wrong: it said White Rock is 3.95:1 on Deep Lilac and fails, and then set
     the label in `on-dark`, which is White Rock. Every primary action on the
     site shipped at 3.95:1.

     `on-primary` is the page's own ground — White Rock taken toward white —
     and measures 4.90:1 here. See the token for why that is the answer rather
     than pure white. */
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  /* Charcoal Slate hairline and Charcoal Slate label, per the brand's
     secondary button. The ring was the pale White Rock line before, which read
     as a disabled control rather than as the quieter of two actions. */
  /* The quiet buttons take the sweep rather than a flat colour swap: the fill
     arrives from the left, the direction everything else on the site moves
     in. `--sweep` names the colour from the palette. */
  secondary:
    "action-sweep [--sweep:var(--color-cream)] bg-transparent text-text ring-1 ring-inset ring-text/35 hover:ring-text/60",
  ghost: "bg-transparent text-text hover:text-primary",
  /**
   * For a saturated or dark ground, where `primary` would vanish. Colours are
   * swapped here rather than passed in through `className`, which would
   * collide with the variant's own colour utilities and lose on source order.
   */
  inverse: "bg-cream text-text hover:bg-surface",
  inverseGhost: "bg-transparent text-on-dark hover:text-cream",
  /** Light Sage fill, for a warmer action on a dark or photographic ground. */
  sage: "bg-sage text-text hover:bg-sage/85",
};

/**
 * Sizes, set in the project's own type scale.
 *
 * These were `text-sm` with `tracking-wide` — a Tailwind default and a
 * Tailwind tracking, on the one component whose whole job is to be the site's
 * button. `text-action` is the scale's step for exactly this (12px, and
 * deliberately one above the caption size a control should never be set at),
 * and `tracking-eyebrow` is the letterspacing every hand-rolled button on the
 * site already uses. The type is now the same as the buttons around it.
 *
 * Padding is generous on purpose: a premium control is mostly air. `lg` is the
 * page-level action and matches the 8/5 the booking and enquiry flows set by
 * hand.
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-5 py-3 text-action uppercase tracking-eyebrow",
  md: "px-7 py-4 text-action uppercase tracking-eyebrow",
  lg: "px-8 py-5 text-action uppercase tracking-eyebrow",
};

function buttonClasses({
  variant = "primary",
  size = "md",
  shape = "soft",
  className,
}: StyleProps) {
  return cn(base, variantStyles[variant], sizeStyles[size], shapeStyles[shape], className);
}

interface ButtonProps
  extends StyleProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
}

/** In-page action. Use <ButtonLink> for navigation. */
export function Button({ children, variant, size, shape, className, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, shape, className })} {...rest}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends StyleProps {
  children: ReactNode;
  href: string;
  /** Opens in a new tab with the appropriate rel attributes. */
  external?: boolean;
  /** Optional side effect on navigation, e.g. closing the mobile menu. */
  onClick?: () => void;
}

/** Navigation styled as a button — renders a real anchor for correct semantics. */
export function ButtonLink({
  children,
  href,
  external,
  onClick,
  variant,
  size,
  shape,
  className,
}: ButtonLinkProps) {
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={href}
      onClick={onClick}
      className={buttonClasses({ variant, size, shape, className })}
      {...externalProps}
    >
      {children}
    </Link>
  );
}
