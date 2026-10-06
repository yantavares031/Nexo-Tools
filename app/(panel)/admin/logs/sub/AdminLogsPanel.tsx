import { TriangleAlert } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { FilterChip } from "@/components/ui/filter-chip";
import { Pagination } from "@/components/ui/pagination";
import { SearchPill } from "@/components/ui/search-pill";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { integerFormat } from "@/lib/format";
import type {
  GetAppLogsPageResult,
  ParsedLogLine,
} from "@/lib/use-cases/get-app-logs-page.use-case";

function buildAdminLogsUrl(page: number, q: string): string {
  const p = new URLSearchParams();
  const trimmed = q.trim();
  if (trimmed) p.set("q", trimmed);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/admin/logs?${s}` : "/admin/logs";
}

/** Chaves Pino / internas exibidas na coluna "Detalhes" (time, level, msg vão em outras colunas). */
const PINO_TOP_LEVEL_SKIP = new Set([
  "time",
  "level",
  "msg",
  "pid",
  "hostname",
  "v",
]);

const DETAIL_KEY_ORDER: string[] = [
  "action",
  "event",
  "useCase",
  "userId",
  "username",
  "email",
  "ip",
  "role",
  "agenciaId",
  "demandaId",
  "errName",
  "errMessage",
  "stack",
];

function sortDetailKeys(keys: string[]): string[] {
  const pri = new Set(DETAIL_KEY_ORDER);
  const first = DETAIL_KEY_ORDER.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !pri.has(k)).sort((a, b) => a.localeCompare(b));
  return [...first, ...rest];
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getDetailEntries(line: ParsedLogLine): [string, string][] {
  if (!line.ok) return [];
  const json = line.json;
  const keys = Object.keys(json).filter((k) => !PINO_TOP_LEVEL_SKIP.has(k));
  return sortDetailKeys(keys).map((k) => [k, formatDetailValue(json[k])]);
}

function formatLineTime(line: ParsedLogLine): string {
  if (!line.ok) return "—";
  const t = line.json.time;
  try {
    if (typeof t === "number") return new Date(t).toLocaleString("pt-BR");
    if (typeof t === "string") return new Date(t).toLocaleString("pt-BR");
  } catch {
    /* ignore */
  }
  return "—";
}

function cellMsg(line: ParsedLogLine): string {
  if (!line.ok) return "(linha não JSON)";
  const m = line.json.msg;
  return typeof m === "string" ? m : String(m ?? "—");
}

function pinoLevelToLabel(level: unknown): { label: string; tone: BadgeTone } {
  const n = typeof level === "number" ? level : parseInt(String(level), 10);
  if (Number.isNaN(n)) return { label: String(level ?? "—"), tone: "neutral" };
  if (n >= 60) return { label: "FATAL", tone: "danger" };
  if (n >= 50) return { label: "ERROR", tone: "danger" };
  if (n >= 40) return { label: "WARN", tone: "warning" };
  if (n >= 30) return { label: "INFO", tone: "info" };
  if (n >= 20) return { label: "DEBUG", tone: "muted" };
  return { label: "TRACE", tone: "muted" };
}

interface AdminLogsPanelProps {
  data: GetAppLogsPageResult;
  searchQuery: string;
}

export function AdminLogsPanel({ data, searchQuery }: AdminLogsPanelProps) {
  const { lines, page, pageSize, totalLines, totalPages, truncatedSnapshot, totalFileSize, logPath } =
    data;
  const q = searchQuery;

  return (
    <div className="space-y-6">
      {truncatedSnapshot && (
        <Callout icon={<TriangleAlert aria-hidden />} title="Leitura parcial">
          O arquivo excede o limite de leitura (últimos 32 MB). Só as linhas desse trecho entram na busca e
          na paginação; entradas mais antigas podem não aparecer.
        </Callout>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchPill
          action="/admin/logs"
          q={q || undefined}
          placeholder="Mensagem, usuário, IP, ação…"
          label="Filtrar logs por texto"
          clearHref={buildAdminLogsUrl(1, "")}
          className="sm:w-96"
        />
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
          <span className="shrink-0">Arquivo:</span>
          <code
            className="truncate rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700"
            title={logPath}
          >
            {logPath}
          </code>
          {totalFileSize > 0 && (
            <span className="shrink-0 whitespace-nowrap tabular-nums">
              · {(totalFileSize / 1024).toFixed(1)} KB no disco
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <Badge tone="dark" className="px-2.5 py-1">
            <span className="tabular-nums">{integerFormat.format(totalLines)}</span>
            {totalLines === 1 ? "linha" : "linhas"}
          </Badge>
          {q && (
            <FilterChip label="busca" removeHref={buildAdminLogsUrl(1, "")}>
              “{q}”
            </FilterChip>
          )}
        </div>

        <Table className="min-w-[800px]">
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-44">Data / hora</TableHeaderCell>
              <TableHeaderCell className="w-24">Nível</TableHeaderCell>
              <TableHeaderCell className="min-w-[140px]">Mensagem</TableHeaderCell>
              <TableHeaderCell className="min-w-[280px]">Detalhes</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-neutral-500">
                  {q ? "Sem registros para os filtros atuais." : "Nenhuma linha neste trecho."}
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, i) => {
                const lev = line.ok ? pinoLevelToLabel(line.json.level) : null;
                const entries = getDetailEntries(line);
                const msg = cellMsg(line);
                return (
                  <TableRow key={`${page}-${i}`} className="align-top transition-colors hover:bg-sky-50/60">
                    <TableCell className="align-top whitespace-nowrap tabular-nums">{formatLineTime(line)}</TableCell>
                    <TableCell className="align-top">
                      {lev ? <Badge tone={lev.tone}>{lev.label}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs align-top" title={msg}>
                      <p className="truncate font-medium text-neutral-950">{msg}</p>
                    </TableCell>
                    <TableCell className="max-w-xl align-top">
                      {entries.length === 0 ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        <dl className="space-y-1 text-xs">
                          {entries.map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <dt className="shrink-0 font-medium text-neutral-500">{k}:</dt>
                              <dd className="min-w-0 font-mono break-all text-neutral-800">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-link hover:text-link-hover">
                          JSON bruto
                        </summary>
                        <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-neutral-50 p-2 text-[11px] break-all whitespace-pre-wrap text-neutral-600">
                          {line.raw}
                        </pre>
                      </details>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {totalLines > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalLines}
            pageSize={pageSize}
            hrefForPage={(target) => buildAdminLogsUrl(target, q)}
          />
        )}
      </div>
    </div>
  );
}
