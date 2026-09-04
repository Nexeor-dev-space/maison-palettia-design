import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

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
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm tracking-wide",
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
