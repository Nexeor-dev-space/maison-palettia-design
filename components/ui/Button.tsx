import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse" | "inverseGhost" | "sage";
type ButtonSize = "sm" | "md" | "lg";
type ButtonShape = "pill" | "square";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Corner treatment. Defaults to the pill used everywhere on the page body. */
  shape?: ButtonShape;
  className?: string;
}

/**
 * The radius is a named option rather than something a caller overrides
 * through `className`: `cn` only concatenates, so two competing radius
 * utilities would be settled by their order in the generated stylesheet
 * rather than by the order they were written.
 */
const shapeStyles: Record<ButtonShape, string> = {
  pill: "rounded-pill",
  square: "rounded-none",
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium " +
  "transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] " +
  "disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  /* Deep Lilac. The brand offers White Rock or white for the label and this
     takes white: White Rock on Deep Lilac measures 3.95:1, under the 4.5:1 a
     button label owes at this size, where white clears it at 5.1:1. The same
     measurement is why the header's navigation is white rather than cream. */
  primary: "bg-primary text-white hover:bg-primary/90",
  /* Charcoal Slate hairline and Charcoal Slate label, per the brand's
     secondary button. The ring was the pale White Rock line before, which read
     as a disabled control rather than as the quieter of two actions. */
  secondary: "bg-transparent text-text ring-1 ring-inset ring-text/35 hover:bg-cream hover:ring-text/60",
  ghost: "bg-transparent text-text hover:text-primary",
  /**
   * For a saturated or dark ground, where `primary` would vanish. Colours are
   * swapped here rather than passed in through `className`, which would
   * collide with the variant's own colour utilities and lose on source order.
   */
  inverse: "bg-cream text-text hover:bg-surface",
  inverseGhost: "bg-transparent text-white hover:text-cream",
  /** Light Sage fill, for a warmer action on a dark or photographic ground. */
  sage: "bg-sage text-text hover:bg-sage/85",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm tracking-wide",
  lg: "px-8 py-4 text-sm tracking-wide",
};

function buttonClasses({
  variant = "primary",
  size = "md",
  shape = "pill",
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
