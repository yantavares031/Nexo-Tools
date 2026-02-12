import { Lock } from "lucide-react";
import Link from "next/link";

export function SemPermissao() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
          <Lock className="size-8 text-slate-400" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Sem permissão
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          Voltar às demandas
        </Link>
      </div>
    </div>
  );
}
