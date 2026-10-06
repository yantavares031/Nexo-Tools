import {
  BookUser,
  FileCheck,
  FileSignature,
  FileUp,
  FolderOpen,
  LayoutDashboard,
  List,
  Megaphone,
  Plug,
  ScrollText,
  ShieldCheck,
  Tag,
  UserCircle,
  UserPlus,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { MENU_ITEMS_BY_ROLE } from "@/lib/roles";
import type { UserRole } from "@/types/globals";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  /** Restringe o item a estes perfis; sem isso, vale `MENU_ITEMS_BY_ROLE`. */
  roles?: UserRole[];
};

export type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  children: NavItem[];
};

export type NavNode = NavItem | NavGroup;

export type NavSection = {
  label?: string;
  items: NavNode[];
};

const INTERNAL_ROLES: UserRole[] = ["admin", "operator"];

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, enabled: true },
      {
        key: "demandas",
        label: "Demandas",
        icon: Workflow,
        children: [
          { label: "Todas as demandas", href: "/", icon: List, enabled: true },
          {
            label: "Importar do Deskfy",
            href: "/demandas/importar",
            icon: FileUp,
            enabled: true,
            roles: INTERNAL_ROLES,
          },
        ],
      },
      {
        key: "documentos",
        label: "Documentos",
        icon: FolderOpen,
        children: [
          { label: "Comprovações", href: "/comprovacoes", icon: FileCheck, enabled: true },
          { label: "Certidões", href: "/certidoes", icon: ShieldCheck, enabled: true },
          { label: "Ordens de compra", href: "/ordens-compra", icon: FileSignature, enabled: true },
        ],
      },
      {
        key: "cadastros",
        label: "Cadastros",
        icon: BookUser,
        children: [
          { label: "Agências", href: "/agencias", icon: Megaphone, enabled: true },
          { label: "Solicitantes", href: "/solicitantes", icon: UserPlus, enabled: true },
          { label: "Centros de Custo", href: "/centros-custo", icon: Tag, enabled: true },
        ],
      },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Usuários", href: "/usuarios", icon: Users, enabled: true },
      { label: "Integrações", href: "/integracoes", icon: Plug, enabled: true },
      { label: "Logs do sistema", href: "/admin/logs", icon: ScrollText, enabled: true },
    ],
  },
];

/** Fora do menu lateral (o rodapé do menu já leva ao perfil), mas aparece na busca ⌘K. */
const PROFILE_ITEM: NavItem = { label: "Perfil", href: "/perfil", icon: UserCircle, enabled: true };

export function isNavGroup(node: NavNode): node is NavGroup {
  return "children" in node;
}

export function isNavHrefActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function canSeeItem(role: UserRole, item: NavItem): boolean {
  if (item.roles) return item.roles.includes(role);
  return MENU_ITEMS_BY_ROLE[role].some((path) => path === item.href || path.startsWith(`${item.href}/`));
}

/**
 * Menu lateral filtrado pelo perfil. Grupo sem itens visíveis some; grupo com um só item
 * vira link direto com o nome e o ícone do grupo.
 */
export function getNavSectionsForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.flatMap((node): NavNode[] => {
      if (!isNavGroup(node)) return canSeeItem(role, node) ? [node] : [];
      const children = node.children.filter((child) => canSeeItem(role, child));
      if (children.length === 0) return [];
      if (children.length === 1) return [{ ...children[0], label: node.label, icon: node.icon }];
      return [{ ...node, children }];
    }),
  })).filter((section) => section.items.length > 0);
}

/** Lista plana das páginas acessíveis (usada na busca ⌘K). */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  const items = getNavSectionsForRole(role).flatMap((section) =>
    section.items.flatMap((node) => (isNavGroup(node) ? node.children : [node])),
  );
  return [...items, PROFILE_ITEM];
}
