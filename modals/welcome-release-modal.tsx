"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  FileUp,
  KeyRound,
  LayoutPanelLeft,
  ListFilter,
  PartyPopper,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/globals";

/** Trocar a chave a cada nova versão que mereça boas-vindas: quem já viu a anterior vê de novo. */
const RELEASE_KEY = "nexo-welcome-2026-10";
const STORAGE_EVENT = "nexo:welcome-release-change";
const TOTAL_STEPS = 2;
const CONFETTI_DURATION_MS = 3000;
const STEP_TITLES: Record<number, string> = {
  1: "Bem-vindo ao novo NEXO Tools!",
  2: "Novidades da nova versão",
};

type Highlight = { icon: LucideIcon; title: string; text: ReactNode; isInternalOnly?: boolean };

const HIGHLIGHTS: Highlight[] = [
  {
    icon: LayoutPanelLeft,
    title: "Visual novo e menu organizado",
    text: (
      <>
        Todas as telas foram redesenhadas e o menu agora agrupa as páginas em <strong>Demandas</strong>,{" "}
        <strong>Documentos</strong> e <strong>Cadastros</strong>, para achar tudo mais rápido.
      </>
    ),
  },
  {
    icon: Search,
    title: "Busca rápida com ⌘K",
    text: (
      <>
        Aperte <strong>⌘K</strong> (ou <strong>Ctrl K</strong>) em qualquer tela para procurar{" "}
        <strong>demandas, OC/PI, solicitantes, agências</strong> e páginas do sistema.
      </>
    ),
  },
  {
    icon: ListFilter,
    title: "Listagens com filtros",
    text: (
      <>
        As listagens ganharam <strong>busca</strong>, <strong>filtros</strong> e etiquetas com o que está aplicado.
        Para tirar um filtro, é só clicar no <strong>×</strong> da etiqueta.
      </>
    ),
  },
  {
    icon: KeyRound,
    title: "Esqueci minha senha",
    text: (
      <>
        Na tela de login, o link <strong>Esqueci minha senha</strong> envia um e-mail para você criar uma nova senha
        sem precisar chamar o suporte.
      </>
    ),
  },
  {
    icon: FileUp,
    title: "Importação do Deskfy mais limpa",
    text: (
      <>
        Solicitações <strong>arquivadas no Deskfy</strong> não aparecem mais na importação de demandas.
      </>
    ),
    isInternalOnly: true,
  },
];

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

function hasSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Sem localStorage (modo privado restrito) o modal volta a aparecer; não há o que fazer.
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/** `?welcometest` na URL abre o modal para testes, sem ler nem gravar o localStorage. */
const TEST_PARAM = "welcometest";

function subscribeToUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function isWelcomeTestUrl(): boolean {
  return new URLSearchParams(window.location.search).has(TEST_PARAM);
}

function fireConfetti() {
  const end = Date.now() + CONFETTI_DURATION_MS;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  const timer = window.setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(timer);
      return;
    }
    const particleCount = 50 * (timeLeft / CONFETTI_DURATION_MS);
    confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);

  return () => window.clearInterval(timer);
}

type Props = {
  userId: string;
  userName: string;
  role: UserRole;
};

export function WelcomeReleaseModal({ userId, userName, role }: Props) {
  const storageKey = `${RELEASE_KEY}:${userId}`;
  // No servidor conta como "já visto" para não piscar o modal antes de ler o localStorage.
  const isSeen = useSyncExternalStore(subscribe, () => hasSeen(storageKey), () => true);
  const isTestMode = useSyncExternalStore(subscribeToUrl, isWelcomeTestUrl, () => false);
  const [isTestDismissed, setIsTestDismissed] = useState(false);
  const isOpen = isTestMode ? !isTestDismissed : !isSeen;
  const [step, setStep] = useState(1);
  const [hasSeenAllSteps, setHasSeenAllSteps] = useState(false);

  const firstName = userName.trim().split(/\s+/)[0] || "Visitante";
  const highlights = HIGHLIGHTS.filter((item) => !item.isInternalOnly || role !== "agency");

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("overflow-hidden");
    const stopConfetti = fireConfetti();
    return () => {
      document.body.classList.remove("overflow-hidden");
      stopConfetti();
    };
  }, [isOpen]);

  function goTo(next: number) {
    setStep(next);
    if (next === TOTAL_STEPS) setHasSeenAllSteps(true);
  }

  function finish() {
    if (!hasSeenAllSteps) return;
    if (!isTestMode) {
      markSeen(storageKey);
      return;
    }
    setIsTestDismissed(true);
    const url = new URL(window.location.href);
    url.searchParams.delete(TEST_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <Modal
      open={isOpen}
      onClose={finish}
      maxWidth="xl"
      ariaLabelledby="welcome-release-title"
      closeOnOverlayClick={false}
      innerClassName="flex max-h-[min(720px,calc(100dvh-32px))] flex-col"
    >
      <Modal.Header>
        <div className="flex flex-col items-start gap-2 py-1">
          <h2 id="welcome-release-title" className="flex items-center gap-2.5 text-lg font-semibold text-neutral-950">
            <PartyPopper className="size-5 shrink-0 text-accent" aria-hidden />
            {STEP_TITLES[step]}
          </h2>
          <Badge tone="muted">
            Passo {step} de {TOTAL_STEPS}
          </Badge>
        </div>
      </Modal.Header>

      <Modal.Body className="flex-1 p-6">
        {step === 1 ? (
          <section className="flex flex-col items-center gap-5 rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-center sm:flex-row sm:items-start sm:text-left">
            {/* O logo da Ytech tem texto branco: precisa de fundo escuro sólido. */}
            <span className="flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-rail shadow-lg">
              <Image src="/ytech-logo.png" alt="Ytech Solution" width={88} height={88} className="size-full scale-[1.35] object-contain" />
            </span>

            <div className="flex min-w-0 flex-col gap-3 text-sm leading-relaxed text-neutral-700">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-neutral-900">Ytech Solution</h3>
                <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">Desenvolvimento</span>                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">Suporte</span>
                </div>
              </div>
              <p>
                Olá, <strong>{firstName}</strong>! É com grande satisfação que apresentamos a <strong>versão 2.0</strong> do{" "}
                <strong>NEXO Tools</strong>, a ferramenta do Sebrae MA para acompanhar demandas, ordens de compra,
                comprovações e certidões.
              </p>
              <p>
                A nova versão chega com <strong>visual renovado</strong>, navegação mais simples e novos recursos para
                deixar o seu dia a dia mais rápido.
              </p>
              <p>Se encontrar dificuldades ou tiver dúvidas, estamos à disposição no suporte. Um excelente trabalho a todos!</p>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              Separamos os <strong className="font-semibold text-neutral-900">destaques</strong> que vão facilitar o seu dia a
              dia. Vale a pena conferir!
            </p>
            <ul className="flex flex-col gap-2.5">
              {highlights.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3.5 rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-rail text-white" aria-hidden>
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1 text-[13px] leading-relaxed text-neutral-600 [&_strong]:font-semibold [&_strong]:text-neutral-900">
                    <p className="text-sm font-semibold text-neutral-900">{title}</p>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step > 1 && (
          <Button variant="ghost" onClick={() => goTo(step - 1)}>
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Button>
        )}
        {step < TOTAL_STEPS && (
          <Button variant="outline" onClick={() => goTo(step + 1)} autoFocus>
            Próximo
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
        <Button
          onClick={finish}
          disabled={!hasSeenAllSteps}
          title={hasSeenAllSteps ? undefined : "Veja todos os passos para concluir"}
        >
          <CircleCheck className="size-4" aria-hidden />
          Concluir
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
