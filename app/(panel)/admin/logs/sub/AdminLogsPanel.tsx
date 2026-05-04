import Link from "next/link";
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

function pinoLevelToLabel(level: unknown): { label: string; className: string } {
  const n = typeof level === "number" ? level : parseInt(String(level), 10);
  if (Number.isNaN(n)) return { label: String(level ?? "—"), className: "bg-slate-100 text-slate-700" };
  if (n >= 60) return { label: "FATAL", className: "bg-red-900 text-white" };
  if (n >= 50) return { label: "ERROR", className: "bg-red-600 text-white" };
  if (n >= 40) return { label: "WARN", className: "bg-amber-500 text-white" };
  if (n >= 30) return { label: "INFO", className: "bg-blue-600 text-white" };
  if (n >= 20) return { label: "DEBUG", className: "bg-slate-600 text-white" };
  return { label: "TRACE", className: "bg-slate-400 text-white" };
}

interface AdminLogsPanelProps {
  data: GetAppLogsPageResult;
  searchQuery: string;
}

export function AdminLogsPanel({ data, searchQuery }: AdminLogsPanelProps) {
  const { lines, page, pageSize, totalLines, totalPages, truncatedSnapshot, totalFileSize, logPath } =
    data;
  const q = searchQuery;
  const showingFrom = totalLines === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalLines);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-700">Arquivo atual:</span>{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{logPath}</code>
        {totalFileSize > 0 && (
          <span className="ml-2">· {(totalFileSize / 1024).toFixed(1)} KB no disco</span>
        )}
      </p>
      {truncatedSnapshot && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>Leitura parcial:</strong> o arquivo excede o limite de leitura (últimos 32 MB). Só
          as linhas desse trecho entram na busca e na paginação; entradas mais antigas podem não
          aparecer.
        </p>
      )}

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="log-q" className="mb-1 block text-xs font-medium text-slate-500">
            Filtrar por texto (mensagem, usuário, IP, ação…)
          </label>
          <input
            id="log-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Ex.: login, userId, 192.168, server_action.error…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Buscar
        </button>
        {q ? (
          <Link
            href="/admin/logs"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <p className="text-sm text-slate-600">
        {totalLines === 0 ? (
          "Nenhuma linha neste trecho."
        ) : (
          <>
            Ordem: mais recentes primeiro. {totalLines} linha(s) correspondem
            {totalPages > 1 ? ` · Página ${page} de ${totalPages}` : null}
            {totalLines > 0 ? (
              <>
                {" "}
                · Mostrando {showingFrom}–{showingTo}
              </>
            ) : null}
          </>
        )}
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-800">Data / hora</th>
              <th className="px-3 py-2 font-semibold text-slate-800">Nível</th>
              <th className="min-w-[140px] px-3 py-2 font-semibold text-slate-800">Mensagem</th>
              <th className="min-w-[280px] px-3 py-2 font-semibold text-slate-800">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={4}>
                  Sem registros para os filtros atuais.
                </td>
              </tr>
            ) : (
              lines.map((line, i) => {
                const lev = line.ok ? pinoLevelToLabel(line.json.level) : null;
                const entries = getDetailEntries(line);
                return (
                  <tr key={`${page}-${i}`} className="border-b border-slate-100 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {formatLineTime(line)}
                    </td>
                    <td className="px-3 py-2">
                      {lev ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${lev.className}`}
                        >
                          {lev.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-xs px-3 py-2 text-slate-800">{cellMsg(line)}</td>
                    <td className="max-w-xl px-3 py-2 text-slate-800">
                      {entries.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="space-y-1 text-xs">
                          {entries.map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="shrink-0 font-medium text-slate-500">{k}:</span>
                              <span className="min-w-0 break-all font-mono text-slate-800">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-blue-600">
                          JSON bruto
                        </summary>
                        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                          {line.raw}
                        </pre>
                      </details>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={buildAdminLogsUrl(Math.max(1, page - 1), q)}
            className={`rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-slate-700 hover:bg-slate-50"
            }`}
            aria-disabled={page <= 1}
          >
            Anterior
          </Link>
          <Link
            href={buildAdminLogsUrl(Math.min(totalPages, page + 1), q)}
            className={`rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium ${
              page >= totalPages ? "pointer-events-none opacity-40" : "text-slate-700 hover:bg-slate-50"
            }`}
            aria-disabled={page >= totalPages}
          >
            Próxima
          </Link>
        </div>
      )}
    </div>
  );
}
