export default function AdminLogsLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto flex min-h-[40vh] max-w-6xl flex-col items-center justify-center gap-4">
        <div
          className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"
          aria-hidden
        />
        <p className="text-sm text-slate-500">Carregando logs…</p>
      </div>
    </div>
  );
}
