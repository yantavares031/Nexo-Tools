import type { ReactNode } from "react";

export function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-neutral-200 py-7 first:border-t-0 first:pt-0">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-950 [&_svg]:size-4 [&_svg]:text-neutral-700">
          {icon}
          {title}
        </h3>
        {description && <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}
