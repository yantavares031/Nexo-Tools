import { redirect } from "next/navigation";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { AddCertidaoForm } from "./sub/AddCertidaoForm";

export default async function AddCertidaoPage() {
  const session = await getSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);

  return (
    <div className="w-full">
      <div className="space-y-12">
        <PageHeader
          eyebrow="Certidões"
          backHref="/certidoes"
          title="Nova certidão"
          description="Envie um ou mais arquivos de certidão com uma descrição opcional."
        />

        <AddCertidaoForm />
      </div>
    </div>
  );
}
