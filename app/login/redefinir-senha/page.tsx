import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { getPasswordResetTokenService } from "@/lib/infra/hmac-password-reset-token.service";
import { getUserRepository } from "@/lib/repositories";
import { isPasswordResetTokenValidUseCase } from "@/lib/use-cases/reset-password-with-token.use-case";
import { AuthHeading } from "../sub/auth-heading";

export const metadata = { title: "Redefinir senha · NEXO Tools" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;

  const isValid =
    token.length > 0 &&
    (await isPasswordResetTokenValidUseCase(
      { token, now: new Date() },
      { userRepository: getUserRepository(), tokenService: getPasswordResetTokenService() }
    ));

  if (!isValid) {
    return (
      <>
        <AuthHeading title="Link expirado" description="Este link de redefinição é inválido, já foi usado ou expirou." />
        <div className="mt-8 space-y-4">
          <Link
            href="/login/esqueci-senha"
            className={cn(buttonBaseClassName, buttonVariants.primary, buttonSizes.md, "h-10 w-full")}
          >
            Pedir um novo link
          </Link>
          <Link href="/login" className="block text-center text-[13px] text-neutral-500 hover:text-neutral-800">
            Voltar para o login
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Criar nova senha" description="Escolha uma senha com pelo menos 6 caracteres." />

      <form action={resetPasswordAction} className="mt-8 flex flex-col gap-5">
        {error && <Alert tone="error">{error}</Alert>}
        <input type="hidden" name="token" value={token} />

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Nova senha</Label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={6}
            autoFocus
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Repita a senha"
          />
        </div>

        <SubmitButton pendingLabel="Salvando..." className="mt-2 h-10 w-full">
          Salvar nova senha
        </SubmitButton>
      </form>

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
