import type { UserRole } from "@/types/globals";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  operator: "Operador",
  agency: "Agência",
};

export const ROLE_FILTER_VALUES = ["admin", "operator", "agency"] as const satisfies readonly UserRole[];

export function parseRoleFilter(value: string | undefined): UserRole | undefined {
  return ROLE_FILTER_VALUES.find((role) => role === value);
}

export function usuariosHref({ q, perfil }: { q?: string; perfil?: UserRole }): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (perfil) params.set("perfil", perfil);
  const query = params.toString();
  return query ? `/usuarios?${query}` : "/usuarios";
}
