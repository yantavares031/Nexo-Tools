"use client";

import { useState } from "react";
import { useConfirm } from "@/lib/confirm-context";
import {
  addDeskfyImportBoardAction,
  removeDeskfyImportBoardAction,
} from "@/app/actions/deskfy-import-boards";
import { toast } from "sonner";
import { Plug } from "lucide-react";
import { Trash2 } from "lucide-react";

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
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Plug className="size-5 shrink-0" />
        Boards Deskfy
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Defina quais boards da Deskfy devem aparecer na importação de demandas. Apenas
        solicitações com status DONE e board nesta lista serão exibidas.
      </p>

      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="novo-board" className="sr-only">
            Nome do board
          </label>
          <input
            id="novo-board"
            type="text"
            value={novoBoard}
            onChange={(e) => setNovoBoard(e.target.value)}
            placeholder="Ex.: AGÊNCIA | MALLMANN"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            disabled={isAdding}
          />
        </div>
        <button
          type="submit"
          disabled={isAdding || !novoBoard.trim()}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:pointer-events-none disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Adicionando…
            </>
          ) : (
            "Adicionar"
          )}
        </button>
      </form>

      {boards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Nenhum board configurado. Adicione os boards permitidos para a importação.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-600">Board</th>
                <th className="w-24 px-4 py-3 font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr
                  key={board.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-4 py-3 text-slate-800">{board.nome}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(board)}
                      className="inline-flex items-center gap-1.5 rounded text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      title="Remover board"
                    >
                      <Trash2 className="size-4" />
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
