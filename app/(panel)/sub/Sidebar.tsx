"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Workflow, Users, UserPlus, Megaphone } from "lucide-react";
import type { UserRole } from "@/types/globals";
import { MENU_ITEMS_BY_ROLE } from "@/lib/roles";

const ALL_MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Demandas", icon: Workflow },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/solicitantes", label: "Solicitantes", icon: UserPlus },
  { href: "/agencias", label: "Agências", icon: Megaphone },
] as const;

interface SidebarProps {
  role?: UserRole | null;
}

export function Sidebar({ role = "operator" }: SidebarProps) {
  const pathname = usePathname();
  const allowedHrefs = new Set(MENU_ITEMS_BY_ROLE[role ?? "operator"]);
  const items = ALL_MENU_ITEMS.filter((item) => allowedHrefs.has(item.href));

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <nav className="flex flex-col gap-0.5 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
          href === "/"
            ? pathname === "/"
            : href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
