import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export const buttonVariants = {
  primary:
    "bg-neutral-800 text-white hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400 focus-visible:outline-neutral-800",
  outline:
    "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 disabled:text-neutral-400",
  ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:text-neutral-300",
} as const;

export const buttonSizes = {
  md: "h-9 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  icon: "size-9",
} as const;

export const buttonBaseClassName =
  "inline-flex items-center justify-center gap-2 rounded-field font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

type Props = ComponentProps<"button"> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonBaseClassName, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
