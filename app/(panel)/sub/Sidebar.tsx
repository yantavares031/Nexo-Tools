"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  Users,
  UserPlus,
  UserCircle,
  Megaphone,
  Lock,
  Tag,
  Plug,
  FileCheck,
  FileSignature,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { UserRole } from "@/types/globals";
import { canAccessRoute, MENU_ITEMS_BY_ROLE } from "@/lib/roles";

const ALL_MENU_ITEMS = [
  { href: "/", label: "Demandas", icon: Workflow },
  { href: "/comprovacoes", label: "Comprovações", icon: FileCheck },
  { href: "/certidoes", label: "Certidões", icon: ShieldCheck },
  { href: "/ordens-compra", label: "Ordens de compra", icon: FileSignature },
  { href: "/agencias", label: "Agências", icon: Megaphone },
  { href: "/solicitantes", label: "Solicitantes", icon: UserPlus },
  { href: "/centros-custo", label: "Centros de Custo", icon: Tag },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/integracoes", label: "Integrações", icon: Plug },
] as const;

const DASHBOARD_MENU_ITEM = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
} as const;

const ADMIN_MENU_ITEMS = [
  { href: "/admin/logs", label: "Logs do sistema", icon: ScrollText },
] as const;

/** Perfil fica antes de “Logs do sistema” (admin); nos demais perfis, no final do menu. */
const PERFIL_MENU_ITEM = {
  href: "/perfil",
  label: "Perfil",
  icon: UserCircle,
} as const;

interface SidebarProps {
  role?: UserRole | null;
}

function isMenuHrefAllowedForRole(role: UserRole, href: string): boolean {
  const allowed = MENU_ITEMS_BY_ROLE[role];
  return allowed.some((path) => path === href || path.startsWith(`${href}/`));
}

export function Sidebar({ role = "operator" }: SidebarProps) {
  const pathname = usePathname();
  const roleKey = role ?? "operator";

  const mainMenuItems = ALL_MENU_ITEMS.filter((item) =>
    isMenuHrefAllowedForRole(roleKey, item.href)
  );

  const showDashboard = isMenuHrefAllowedForRole(roleKey, DASHBOARD_MENU_ITEM.href);

  const navItems =
    roleKey === "admin"
      ? [
          ...mainMenuItems,
          ...(showDashboard ? [DASHBOARD_MENU_ITEM] : []),
          PERFIL_MENU_ITEM,
          ...ADMIN_MENU_ITEMS,
        ]
      : [
          ...mainMenuItems,
          ...(showDashboard ? [DASHBOARD_MENU_ITEM] : []),
          PERFIL_MENU_ITEM,
        ];

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const hasAccess = canAccessRoute(role ?? "operator", href);
          const isActive =
            href === "/"
              ? pathname === "/"
              : href === "/dashboard"
                ? pathname === "/dashboard"
                : href === "/perfil"
                  ? pathname === "/perfil"
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
