import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { currencyFormat, formatDocument } from "@/lib/format";
import type { Agencia } from "@/types/globals";
import { RemoveAgenciaButton } from "./RemoveAgenciaButton";

interface AgenciasTableProps {
  agencias: Agencia[];
  boards: { id: string; nome: string }[];
  emptyMessage?: string;
}

export function AgenciasTable({ agencias, boards, emptyMessage }: AgenciasTableProps) {
  const boardNames = new Map(boards.map((board) => [board.id, board.nome]));

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Agência</TableHeaderCell>
          <TableHeaderCell>CNPJ</TableHeaderCell>
          <TableHeaderCell>Orçamento anual</TableHeaderCell>
          <TableHeaderCell>Board Deskfy</TableHeaderCell>
          <TableHeaderCell className="w-16">
            <span className="sr-only">Ações</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {agencias.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-neutral-500">
              {emptyMessage ?? "Nenhuma agência cadastrada."}
            </TableCell>
          </TableRow>
        ) : (
          agencias.map((agencia) => {
            const boardName = agencia.boardId ? boardNames.get(agencia.boardId) : undefined;
            return (
              <TableRow
                key={agencia.id}
                className="relative transition-colors hover:bg-sky-50/60 has-[a:focus-visible]:bg-sky-50/60"
              >
                <TableCell className="max-w-72" title={agencia.nomeFantasia}>
                  <p className="truncate font-medium text-neutral-950">
                    <Link
                      href={`/agencias/${agencia.id}`}
                      className="outline-none after:absolute after:inset-0 after:content-['']"
                    >
                      {agencia.nomeFantasia}
                    </Link>
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDocument(agencia.cnpj)}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {currencyFormat.format(agencia.orcamentoAnual)}
                </TableCell>
                <TableCell className="max-w-56 truncate" title={boardName}>
                  {boardName ? <span className="text-link">{boardName}</span> : "—"}
                </TableCell>
                <TableCell>
                  <RemoveAgenciaButton id={agencia.id} nome={agencia.nomeFantasia} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
