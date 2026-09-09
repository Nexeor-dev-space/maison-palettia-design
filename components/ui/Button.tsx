import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse" | "inverseGhost" | "sage";
type ButtonSize = "sm" | "md" | "lg";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium " +
  "transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] " +
  "disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-transparent text-text ring-1 ring-inset ring-line hover:bg-cream",
  ghost: "bg-transparent text-text hover:text-primary",
  /**
   * For a saturated or dark ground, where `primary` would vanish. Colours are
   * swapped here rather than passed in through `className`, which would
   * collide with the variant's own colour utilities and lose on source order.
   */
  inverse: "bg-cream text-text hover:bg-white",
  inverseGhost: "bg-transparent text-white hover:text-cream",
  /** Light Sage fill, for a warmer action on a dark or photographic ground. */
  sage: "bg-sage text-text hover:bg-sage/85",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm tracking-wide",
  lg: "px-8 py-4 text-sm tracking-wide",
};

function buttonClasses({ variant = "primary", size = "md", className }: StyleProps) {
  return cn(base, variantStyles[variant], sizeStyles[size], className);
}

interface ButtonProps
  extends StyleProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
}

/** In-page action. Use <ButtonLink> for navigation. */
export function Button({ children, variant, size, className, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...rest}>
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
  className,
}: ButtonLinkProps) {
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={href}
      onClick={onClick}
      className={buttonClasses({ variant, size, className })}
      {...externalProps}
    >
      {children}
    </Link>
  );
}
