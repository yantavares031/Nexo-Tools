import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import Link from "next/link";
import { CircleDot, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { canAccessOrdensCompra } from "@/lib/roles";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout/page-header";
import { buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownItem } from "@/components/ui/dropdown-item";
import { SearchPill } from "@/components/ui/search-pill";
import { OrdensCompraListBody } from "./sub/OrdensCompraListBody";
import { OrdensCompraContentSkeleton } from "./sub/OrdensCompraContentSkeleton";
import { ORDENS_COMPRA_TAB_OPTIONS, ordensCompraHref, parseOrdensCompraTab } from "./sub/hrefs";

export default async function OrdensCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (!canAccessOrdensCompra(session.role)) redirect("/");

  const { page: pageParam, q, tab: tabRaw } = await searchParams;
  const tab = parseOrdensCompraTab(tabRaw);
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const qValue = (q ?? "").trim();
  const tabLabel = ORDENS_COMPRA_TAB_OPTIONS.find((option) => option.value === tab)?.label;

  const showAdd = session.role === "agency";

  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          title="Ordens de compra"
          description="PDFs de OC vinculados às demandas, para assinatura digital do gerente."
          actions={
            showAdd && (
              <Link
                href="/ordens-compra/adicionar"
                className={cn(buttonBaseClassName, buttonVariants.primary, buttonSizes.md)}
              >
                <Plus className="size-4" strokeWidth={2.25} aria-hidden />
                Nova ordem de compra
              </Link>
            )
          }
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchPill
            action="/ordens-compra"
            q={qValue || undefined}
            placeholder="Buscar por demanda, OC/PI ou arquivo"
            label="Buscar ordens de compra"
            hiddenParams={{ tab: tab === "assinadas" ? "assinadas" : undefined }}
            clearHref={ordensCompraHref({ tab })}
          />
          <Dropdown
            key={`status-${qValue}-${tab}`}
            highlighted={tab !== "abertas"}
            trigger={
              <>
                <CircleDot aria-hidden />
                <span className="opacity-70">Status</span>
                <span className="font-medium">{tabLabel}</span>
              </>
            }
          >
            {ORDENS_COMPRA_TAB_OPTIONS.map((option) => (
              <DropdownItem
                key={option.value}
                href={ordensCompraHref({ q: qValue || undefined, tab: option.value })}
                active={tab === option.value}
              >
                {option.label}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>

        <Suspense key={`${tab}-${page}-${qValue}`} fallback={<OrdensCompraContentSkeleton />}>
          <OrdensCompraListBody page={page} q={qValue} tab={tab} userRole={session.role} />
        </Suspense>
      </div>
    </div>
  );
}
