import type { ReactNode } from "react";

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-950">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
