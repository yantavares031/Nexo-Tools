"use client";

import { useState } from "react";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-provider";
import {
  addDeskfyImportBoardAction,
  removeDeskfyImportBoardAction,
} from "@/app/actions/deskfy-import-boards";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSection } from "@/components/ui/form-section";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";

interface DeskfyImportBoard {
  id: string;
  nome: string;
}

interface ConfiguracoesBoardsSectionProps {
  initialBoards: DeskfyImportBoard[];
}

export function ConfiguracoesBoardsSection({
  initialBoards,
}: ConfiguracoesBoardsSectionProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [novoBoard, setNovoBoard] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { confirm } = useConfirm();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const nome = novoBoard.trim();
    if (!nome) {
      toast.error("Informe o nome do board.");
      return;
    }
    setIsAdding(true);
    try {
      const result = await addDeskfyImportBoardAction(nome);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setBoards((prev) => [...prev, result.board].sort((a, b) => a.nome.localeCompare(b.nome)));
        setNovoBoard("");
        toast.success("Board adicionado.");
      }
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemove(board: DeskfyImportBoard) {
    const ok = await confirm({
      title: "Remover board",
      message: `Remover "${board.nome}" da lista? As demandas deste board deixarão de aparecer na importação.`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    const result = await removeDeskfyImportBoardAction(board.id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      toast.success("Board removido.");
    }
  }

  return (
    <div className="max-w-3xl">
      <PanelHeader
        title="Filtro de boards"
        description="Apenas solicitações com status DONE e board nesta lista aparecem na importação de demandas."
      />

      <div>
        <FormSection
          icon={<LayoutGrid aria-hidden />}
          title="Boards Deskfy"
          description="Defina quais boards da Deskfy devem aparecer na importação."
        >
          <div className="space-y-4">
            <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
              <label htmlFor="novo-board" className="sr-only">
                Nome do board
              </label>
              <Input
                id="novo-board"
                type="text"
                value={novoBoard}
                onChange={(e) => setNovoBoard(e.target.value)}
                placeholder="Ex.: AGÊNCIA | MALLMANN"
                disabled={isAdding}
                className="w-auto min-w-0 flex-1"
              />
              <Button type="submit" loading={isAdding} disabled={!novoBoard.trim()} className="h-10">
                {!isAdding && <Plus className="size-4" aria-hidden />}
                {isAdding ? "Adicionando…" : "Adicionar"}
              </Button>
            </form>

            {boards.length === 0 ? (
              <EmptyState
                icon={<LayoutGrid aria-hidden />}
                title="Nenhum board configurado"
                description="Adicione os boards permitidos para a importação."
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <Table>
                  <TableHead>
                    <TableRow className="bg-neutral-50">
                      <TableHeaderCell>Board</TableHeaderCell>
                      <TableHeaderCell className="w-16">
                        <span className="sr-only">Ações</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {boards.map((board) => (
                      <TableRow key={board.id} className="transition-colors last:border-b-0 hover:bg-sky-50/60">
                        <TableCell className="max-w-96 truncate font-medium text-neutral-950" title={board.nome}>
                          {board.nome}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="Remover board"
                            variant="danger"
                            onClick={() => void handleRemove(board)}
                          >
                            <Trash2 />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </div>
  );
}
