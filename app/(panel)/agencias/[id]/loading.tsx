export default function AgenciaEditLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div
          className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"
          aria-hidden
        />
        <p className="text-sm text-slate-500">Carregando formulário...</p>
      </div>
    </div>
  );
}
