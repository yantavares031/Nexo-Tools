/** Skeleton da tabela + rodapé de paginação (Suspense / loading da rota). */
export function OrdensCompraContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando lista">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="min-w-[880px] animate-pulse">
          <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="h-4 w-[20%] rounded bg-slate-200" />
            <div className="h-4 w-[18%] rounded bg-slate-200" />
            <div className="h-4 w-[12%] rounded bg-slate-200" />
            <div className="h-4 w-[12%] rounded bg-slate-200" />
            <div className="h-4 w-[10%] rounded bg-slate-200" />
            <div className="h-4 w-[12%] rounded bg-slate-200" />
            <div className="h-4 w-[8%] rounded bg-slate-200" />
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-4">
              <div className="flex w-[20%] items-center gap-2">
                <div className="size-8 shrink-0 rounded-lg bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-full max-w-[180px] rounded bg-slate-100" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-3.5 w-[18%] rounded bg-slate-100" />
              <div className="h-3.5 w-[12%] rounded bg-slate-100" />
              <div className="h-3.5 w-[12%] rounded bg-slate-100" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
              <div className="h-3.5 w-[12%] rounded bg-slate-100" />
              <div className="flex w-[8%] justify-start gap-1">
                <div className="size-8 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-pulse">
        <div className="h-4 w-52 rounded bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-slate-200" />
          <div className="h-9 w-9 rounded-lg bg-slate-300" />
          <div className="h-9 w-24 rounded-lg bg-slate-200" />
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">Carregando...</p>
    </div>
  );
}
