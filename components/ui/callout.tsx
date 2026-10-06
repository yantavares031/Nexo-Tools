import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Callout({
  icon,
  title,
  children,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-xl bg-sky-50 px-4 py-3.5 text-[13px] text-sky-900 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sky-600",
        className,
      )}
    >
      {icon}
      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>
        {children && <div className="text-sky-800/90">{children}</div>}
      </div>
    </div>
  );
}
