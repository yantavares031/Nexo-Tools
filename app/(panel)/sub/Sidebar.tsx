"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  Users,
  UserPlus,
  Megaphone,
  Lock,
  Tag,
  Plug,
  FileCheck,
  FileSignature,
} from "lucide-react";
import type { UserRole } from "@/types/globals";
import { canAccessRoute } from "@/lib/roles";

const ALL_MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Demandas", icon: Workflow },
  { href: "/comprovacoes", label: "Comprovações", icon: FileCheck },
  { href: "/ordens-compra", label: "Ordens de compra", icon: FileSignature },
  { href: "/agencias", label: "Agências", icon: Megaphone },
  { href: "/solicitantes", label: "Solicitantes", icon: UserPlus },
  { href: "/centros-custo", label: "Centros de Custo", icon: Tag },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/integracoes", label: "Integrações", icon: Plug },
] as const;

interface SidebarProps {
  role?: UserRole | null;
}

export function Sidebar({ role = "operator" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <nav className="flex flex-col gap-0.5 p-3">
        {ALL_MENU_ITEMS.map(({ href, label, icon: Icon }) => {
          const hasAccess = canAccessRoute(role ?? "operator", href);
          const isActive =
            href === "/"
              ? pathname === "/"
              : href === "/dashboard"
                ? pathname === "/dashboard"
                : href === "/integracoes"
                  ? pathname === "/integracoes"
                  : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : hasAccess
                    ? "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    : "text-slate-400 hover:bg-slate-50"
              }`}
              title={!hasAccess ? "Sem permissão para acessar" : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0" />
                {label}
              </span>
              {!hasAccess && (
                <Lock className="size-3.5 shrink-0 text-slate-400" aria-label="Sem permissão" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
