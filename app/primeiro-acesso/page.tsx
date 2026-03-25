import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PrimeiroAcessoForm } from "./sub/PrimeiroAcessoForm";
import { ToasterProvider } from "@/components/ToasterProvider";

export default async function PrimeiroAcessoPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!session.mustChangePassword) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/80 px-6 py-10">
      <PrimeiroAcessoForm />
      <ToasterProvider />
    </div>
  );
}
