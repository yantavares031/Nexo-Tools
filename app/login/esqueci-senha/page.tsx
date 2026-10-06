import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { AuthHeading } from "../sub/auth-heading";

export const metadata = { title: "Esqueci minha senha · NEXO Tools" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <>
      <AuthHeading
        title="Esqueci minha senha"
        description="Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
      />

      {sent ? (
        <div className="mt-8 space-y-5">
          <div className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-lime-700" aria-hidden />
            <div className="text-sm text-neutral-700">
              <p className="font-semibold text-neutral-950">Verifique seu e-mail</p>
              <p className="mt-1">
                Se o e-mail estiver cadastrado, você vai receber em instantes um link válido por 60 minutos. Confira
                também a caixa de spam.
              </p>
            </div>
          </div>
          <Link href="/login/esqueci-senha" className="block text-center text-[13px] text-neutral-500 hover:text-neutral-800">
            Não recebeu? Enviar novamente
          </Link>
        </div>
      ) : (
        <form action={requestPasswordResetAction} className="mt-8 flex flex-col gap-5">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              autoFocus
              placeholder="seu@email.com"
            />
          </div>

          <SubmitButton pendingLabel="Enviando..." className="mt-2 h-10 w-full">
            Enviar link
          </SubmitButton>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 hover:text-neutral-950"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para o login
      </Link>
    </>
  );
}
