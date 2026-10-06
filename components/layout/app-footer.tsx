import { APP_CONFIG } from "@/config/app";
import { APP_VERSION } from "@/lib/version";
import { DeveloperCredit } from "./developer-credit";

type Props = {
  /** No painel o crédito fica na topbar; no login, aparece no rodapé. */
  showCredit?: boolean;
};

export function AppFooter({ showCredit = false }: Props) {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-6 py-5 text-xs text-neutral-400 sm:flex-row lg:px-12">
      <p>
        © {new Date().getFullYear()} {APP_CONFIG.company} · v{APP_VERSION}
      </p>
      {showCredit && <DeveloperCredit />}
    </footer>
  );
}
