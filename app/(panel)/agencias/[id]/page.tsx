import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { getAgenciaByIdUseCase } from "@/lib/use-cases/get-agencia-by-id.use-case";
import { getAgenciaRepository, getDeskfyImportBoardRepository } from "@/lib/repositories";
import { AgenciaForm } from "./sub/AgenciaForm";

export default async function AgenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [agenciaRepository, boardRepository] = [
    getAgenciaRepository(),
    getDeskfyImportBoardRepository(),
  ];
  const [agencia, boards] = await Promise.all([
    getAgenciaByIdUseCase(id, { agenciaRepository }),
    boardRepository.findAll(),
  ]);

  if (!agencia) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/agencias"
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-800"
        >
          <ArrowLeft className="size-4" />
          Voltar para agências
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Megaphone className="size-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">
              {agencia.nomeFantasia}
            </h1>
          </div>

          <AgenciaForm agencia={agencia} boards={boards} />
        </div>
      </div>
    </div>
  );
}
