"use client";

import { Lock } from "lucide-react";

export function DashboardBlockedCard() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
      <Lock className="mb-3 size-12 text-slate-400" />
      <p className="text-sm font-medium text-slate-600">
        Você não tem permissão para ver este gráfico
      </p>
    </div>
  );
}
