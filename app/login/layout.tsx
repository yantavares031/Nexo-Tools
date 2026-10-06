import { Workflow } from "lucide-react";
import { AppFooter } from "@/components/layout/app-footer";
import { APP_CONFIG } from "@/config/app";
import { APP_VERSION } from "@/lib/version";
import { LoginIllustration } from "./sub/login-illustration";
import { TypingHeadline } from "./sub/typing-headline";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-white p-3 lg:h-dvh lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:grid-rows-none lg:p-4">
      <aside className="flex flex-col overflow-hidden rounded-2xl bg-login-panel/60 px-6 py-5 text-neutral-500 lg:gap-8 lg:rounded-3xl lg:px-12 lg:py-10">
        <div>
          <div className="flex items-center gap-2.5">
            <Workflow className="size-7 shrink-0 text-rail lg:size-8" strokeWidth={2.25} aria-hidden />
            <p className="text-2xl leading-none font-extrabold tracking-tighter text-rail lg:text-[28px]">
              NEXO <span className="font-light tracking-tight">Tools</span>
            </p>
          </div>
          <p className="mt-1.5 text-[11px] font-medium tracking-[0.14em] uppercase lg:mt-2">
            Fluxos administrativos e financeiros
          </p>
        </div>

        <figure className="relative m-0 hidden min-h-0 flex-1 lg:block">
          <span className="absolute inset-x-[10%] inset-y-[8%] rounded-full bg-white/70 blur-3xl" aria-hidden />
          <LoginIllustration />
        </figure>

        <div className="hidden text-center lg:block">
          <TypingHeadline
            className="mx-auto max-w-md text-[22px] leading-snug tracking-tight text-neutral-900"
            segments={[
              { text: "Demandas, ordens de compra e comprovações " },
              { text: "em um só lugar", isBold: true },
            ]}
          />
          <p className="mt-4 text-xs">
            © {new Date().getFullYear()} {APP_CONFIG.company} · v{APP_VERSION}
          </p>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col lg:overflow-y-auto">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <AppFooter showCredit />
      </div>
    </div>
  );
}
