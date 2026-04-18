import { loginAction } from "@/app/actions/auth";
import { APP_VERSION } from "@/lib/version";
import { FormSubmitButton } from "@/components/FormActionSubmitButton";
import { WorkflowIllustration } from "./sub/WorkflowIllustration";
import { LoginPageClient } from "./sub/LoginPageClient";

const ERROR_MESSAGES: Record<string, string> = {
  empty: "Preencha e-mail e senha.",
  invalid: "E-mail ou senha incorretos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <LoginPageClient />
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Esquerda: área para imagem ou branding */}
        <aside className="flex w-full flex-col items-center justify-center bg-slate-100 px-6 py-10 md:w-1/2 md:px-10 md:py-0">
          <div className="flex max-w-xs flex-col items-center text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-700 md:text-5xl">
              <span className="text-blue-500">NEXO</span> Tools
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 md:mt-2 md:text-sm">
              Fluxos administrativos e financeiros de forma simples e integrada
            </p>
            <span className="mt-2 text-[10px] text-slate-400 md:mt-3">v{APP_VERSION}</span>
            <div className="mt-6 w-full max-w-[160px] md:mt-10 md:max-w-[200px]">
              <WorkflowIllustration className="w-full" />
            </div>
          </div>
        </aside>

        {/* Direita: formulário */}
        <main className="flex w-full flex-col items-center justify-center bg-slate-50/80 px-6 py-10 md:w-1/2 md:px-12">
          <div className="w-full max-w-[280px]">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-medium tracking-tight text-slate-700 md:hidden">
                <span className="text-blue-500">NEXO</span> Tools
              </h1>
              <h1 className="text-xl font-medium tracking-tight text-slate-700">
                Entrar
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Acesse sua conta
              </p>
            </div>

            <form action={loginAction} className="flex flex-col gap-4">
              {error && (
                <p className="text-sm text-rose-500" role="alert">
                  {ERROR_MESSAGES[error] ?? "Erro ao fazer login."}
                </p>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-500"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-700 placeholder-slate-300 outline-none transition-colors focus:border-blue-400"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-slate-500"
                >
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-700 placeholder-slate-300 outline-none transition-colors focus:border-blue-400"
                />
              </div>

              <FormSubmitButton
                pendingLabel="Entrando..."
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-blue-500/90 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50"
              >
                Entrar
              </FormSubmitButton>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
