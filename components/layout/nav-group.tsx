"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { isNavHrefActive } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { RailLabel, railItemClassName } from "./rail-item";

const STORAGE_PREFIX = "nexo:nav-group:";
const STORAGE_EVENT = "nexo:nav-group-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function saveStored(key: string, isOpen: boolean) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, isOpen ? "1" : "0");
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // Storage bloqueado (modo privado): o grupo só não lembra o estado.
  }
}

type Props = {
  groupKey: string;
  label: string;
  icon: ReactNode;
  hrefs: string[];
  children: ReactNode;
};

export function NavGroup({ groupKey, label, icon, hrefs, children }: Props) {
  const pathname = usePathname();
  const hasActiveChild = hrefs.some((href) => isNavHrefActive(pathname, href));
  const stored = useSyncExternalStore(subscribe, () => readStored(groupKey), () => null);
  // Escolha manual vale até a próxima navegação; ao trocar de página, o grupo da página atual reabre.
  const [manual, setManual] = useState<{ pathname: string; isOpen: boolean } | null>(null);

  const isOpen =
    manual?.pathname === pathname ? manual.isOpen : hasActiveChild || stored === "1";

  function toggle() {
    const next = !isOpen;
    setManual({ pathname, isOpen: next });
    saveStored(groupKey, next);
  }

  const subId = `nav-group-${groupKey}`;

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={toggle}
        title={label}
        aria-expanded={isOpen}
        aria-controls={subId}
        className={cn(
          railItemClassName,
          "hover:bg-rail-hover hover:text-white",
          hasActiveChild ? "text-white lg:not-group-hover/rail:bg-white/12" : "text-neutral-400",
        )}
      >
        {icon}
        <RailLabel>{label}</RailLabel>
        <ChevronDown
          className={cn(
            "ml-auto size-4 shrink-0 transition-[transform,opacity] duration-200 lg:opacity-0 lg:group-hover/rail:opacity-100 lg:group-has-[:focus-visible]/rail:opacity-100",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          id={subId}
          className="mt-0.5 mb-1.5 ml-[19px] flex flex-col gap-0.5 border-l-[1.5px] border-white/20 pl-3.5 lg:hidden lg:group-hover/rail:flex lg:group-has-[:focus-visible]/rail:flex"
        >
          {children}
        </div>
      )}
    </div>
  );
}
