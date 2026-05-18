import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { AddCertidaoForm } from "./sub/AddCertidaoForm";
import { ArrowLeft } from "lucide-react";

export default async function AddCertidaoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/certidoes"
            className="flex items-center gap-1 text-sm text-slate-600 transition hover:text-slate-800"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-slate-800">Adicionar certidão</h1>

        <AddCertidaoForm />
      </div>
    </div>
  );
}
