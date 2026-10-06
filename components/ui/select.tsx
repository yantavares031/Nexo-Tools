import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { inputClassName } from "./input";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClassName, "pr-8", className)} {...props} />;
}
