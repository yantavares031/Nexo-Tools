import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-6 py-14 text-center">
      <span className="rounded-full bg-neutral-100 p-3 text-neutral-400 [&_svg]:size-5">{icon}</span>
      <p className="text-sm font-medium text-neutral-950">{title}</p>
      {description && <p className="text-[13px] text-neutral-500">{description}</p>}
    </div>
  );
}
