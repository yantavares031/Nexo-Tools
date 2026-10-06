import { Lock } from "lucide-react";

export function DashboardBlockedCard() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
      <span className="rounded-full bg-neutral-100 p-3 text-neutral-400">
        <Lock className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-neutral-950">Conteúdo restrito</p>
      <p className="text-[13px] text-neutral-500">Você não tem permissão para ver este gráfico.</p>
    </div>
  );
}
