import { Spinner } from "@/components/ui/spinner";

export function PageLoading() {
  return (
    <div role="status" className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 p-6">
      <Spinner className="size-8 text-neutral-400" />
      <p className="text-sm text-neutral-500">Carregando...</p>
    </div>
  );
}
