import type { ComponentProps, ReactNode } from "react";

export function Switch({ children, ...props }: Omit<ComponentProps<"input">, "type"> & { children?: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 select-none">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full bg-neutral-200 transition-colors peer-checked:bg-blue-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-950 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4"
      />
      {children && <span className="text-sm text-neutral-700">{children}</span>}
    </label>
  );
}
