import { Suspense } from "react";
import { listCentrosCustoAction } from "@/app/actions/centro-custo";
import { CentrosCustoSection } from "./sub/CentrosCustoSection";
import { CentrosCustoHeader } from "./sub/CentrosCustoHeader";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentrosCustoPage() {
  const result = await listCentrosCustoAction();
  const centrosCusto = result.centrosCusto || [];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <CentrosCustoHeader />

        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <CentrosCustoSection centrosCusto={centrosCusto} />
      </div>
    </div>
  );
}
