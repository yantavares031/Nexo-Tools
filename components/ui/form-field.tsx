import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldError } from "./field-error";
import { Label } from "./label";

export function FormField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <FieldError id={`${id}-error`} message={error} />
      ) : (
        hint && <p className="text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
}
