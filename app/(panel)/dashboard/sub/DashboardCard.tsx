import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const iconTones = {
  sky: "bg-sky-50 text-sky-600",
  lime: "bg-lime-100 text-lime-700",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  neutral: "bg-neutral-100 text-neutral-500",
} as const;

export type DashboardIconTone = keyof typeof iconTones;

export function DashboardCard({
  icon,
  iconTone = "sky",
  title,
  description,
  className,
  children,
}: {
  icon: ReactNode;
  iconTone?: DashboardIconTone;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-neutral-200 bg-white p-5", className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className={cn("shrink-0 rounded-lg p-2 [&_svg]:size-4", iconTones[iconTone])}>{icon}</span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function DashboardEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center py-8 text-[13px] text-neutral-500", className)}>{children}</div>
  );
}
