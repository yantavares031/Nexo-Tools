import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  backHref?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
};

export function PageHeader({ title, subtitle, description, eyebrow, backHref, badges, actions, leading }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-[13px] text-neutral-500 sm:pl-8">{eyebrow}</p>}
        <div className="flex items-center gap-2.5">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Voltar"
              className="-ml-1.5 rounded-md p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          {leading}
          <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-950">{title}</h1>
          {badges}
        </div>
        {subtitle && (
          <div className={backHref ? "text-xs text-link sm:pl-8" : "text-xs text-link"}>{subtitle}</div>
        )}
        {description && (
          <div className={backHref ? "mt-4 text-[13px] text-neutral-500 sm:pl-8" : "mt-1 text-[13px] text-neutral-500"}>
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
