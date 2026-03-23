import { Suspense } from "react";
import { listSolicitantesUseCase } from "@/lib/use-cases/list-solicitantes.use-case";
import { getSolicitanteRepository } from "@/lib/repositories";
import { SolicitantesSection } from "./sub/SolicitantesSection";
import { SolicitantesHeader } from "./sub/SolicitantesHeader";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";
import { getUnidades } from "@/lib/unidades";

export default async function SolicitantesPage() {
  const solicitanteRepository = getSolicitanteRepository();
  const [solicitantes, unidades] = await Promise.all([
    listSolicitantesUseCase({ solicitanteRepository }),
    getUnidades(),
  ]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <SolicitantesHeader unidades={unidades} />

        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <SolicitantesSection solicitantes={solicitantes} />
      </div>
    </div>
  );
}
