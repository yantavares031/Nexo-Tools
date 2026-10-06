import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const inputClassName = cn(
  "h-10 rounded-field border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors",
  "placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-900/5",
  "aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/10",
  "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("block w-full", inputClassName, className)} {...props} />;
}
