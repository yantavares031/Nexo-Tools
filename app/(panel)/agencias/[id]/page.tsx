import { notFound } from "next/navigation";
import { getAgenciaByIdUseCase } from "@/lib/use-cases/get-agencia-by-id.use-case";
import { getAgenciaRepository, getDeskfyImportBoardRepository } from "@/lib/repositories";
import { PageHeader } from "@/components/layout/page-header";
import { MetaList } from "@/components/ui/meta-list";
import { currencyFormat, formatDocument } from "@/lib/format";
import { AgenciaForm } from "../sub/AgenciaForm";

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

  const boardName = agencia.boardId
    ? boards.find((board) => board.id === agencia.boardId)?.nome
    : undefined;

  return (
    <div className="w-full">
      <div className="space-y-12">
        <PageHeader
          eyebrow="Agências"
          backHref="/agencias"
          title={agencia.nomeFantasia}
          description={
            <MetaList
              items={[
                { label: "CNPJ", value: formatDocument(agencia.cnpj) },
                { label: "Orçamento anual", value: currencyFormat.format(agencia.orcamentoAnual) },
                { label: "Board Deskfy", value: boardName ?? "—" },
              ]}
            />
          }
        />

        <AgenciaForm agencia={agencia} boards={boards} />
      </div>
    </div>
  );
}
