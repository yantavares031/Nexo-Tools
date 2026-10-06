"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Guarda a rota em que o menu foi aberto: ao navegar, a rota muda e o menu fecha sozinho.
export function SidebarDrawer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const close = () => setOpenedAt(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenedAt(pathname)}
        className="fixed top-3 left-3 z-30 rounded-field bg-rail p-2 text-white lg:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        <Menu className="size-5" />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-neutral-950/30 lg:hidden" onClick={close} aria-hidden />}

      <aside
        id="app-sidebar"
        className={cn(
          "group/rail fixed inset-y-0 left-0 z-50 flex w-60 flex-col overflow-hidden bg-rail text-white",
          "transition-[transform,width,box-shadow] duration-200 ease-out",
          "lg:w-16 lg:translate-x-0 lg:hover:w-60 lg:hover:shadow-2xl lg:has-[:focus-visible]:w-60",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {open && (
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-3 rounded-field p-1.5 text-neutral-400 hover:bg-rail-hover hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        )}
        {children}
      </aside>
    </>
  );
}
