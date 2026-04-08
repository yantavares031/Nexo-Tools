import { getOrdensCompraPaginatedAction } from "@/app/actions/ordem-compra";
import type { UserRole } from "@/types/globals";
import { OrdensCompraTable } from "./OrdensCompraTable";
import { OrdensCompraPagination, type OrdensCompraTab } from "./OrdensCompraPagination";

const DEFAULT_PAGE_SIZE = 15;

export async function OrdensCompraListBody({
  page,
  q,
  tab,
  userRole,
}: {
  page: number;
  q: string;
  tab: OrdensCompraTab;
  userRole: UserRole;
}) {
  const status = tab === "assinadas" ? "assinada" : "em_aberto";
  const result = await getOrdensCompraPaginatedAction(page, DEFAULT_PAGE_SIZE, {
    q: q || undefined,
    status,
  });

  return (
    <>
      <OrdensCompraTable ordens={result.items} userRole={userRole} tab={tab} />
      <OrdensCompraPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        limit={result.limit}
        q={q || undefined}
        tab={tab}
      />
    </>
  );
}
