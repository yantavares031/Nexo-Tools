import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AuthHeading } from "./sub/auth-heading";

const ERROR_MESSAGES: Record<string, string> = {
  empty: "Preencha e-mail e senha.",
  invalid: "E-mail ou senha incorretos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <>
      <AuthHeading title="Bem-vindo de volta" description="Use seu e-mail e senha." />

      <form action={loginAction} className="mt-8 flex flex-col gap-5">
        {error && <Alert tone="error">{ERROR_MESSAGES[error] ?? "Erro ao fazer login."}</Alert>}
        {!error && reset && <Alert tone="success">Senha redefinida. Entre com a nova senha.</Alert>}

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
            aria-invalid={error ? true : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/login/esqueci-senha"
              className="text-[13px] font-medium text-link transition-colors hover:text-link-hover hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="••••••••"
          />
        </div>

        <SubmitButton pendingLabel="Entrando..." className="mt-2 h-10 w-full">
          Entrar
        </SubmitButton>
      </form>
    </>
  );
}
