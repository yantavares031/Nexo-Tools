import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("block text-[13px] text-neutral-700", className)} {...props} />;
}
