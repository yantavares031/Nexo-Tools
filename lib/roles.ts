import type { UserRole } from "@/types/globals";

/** Rotas que operator não pode acessar (exclusivas de admin). */
const FORBIDDEN_FOR_OPERATOR = ["/agencias", "/usuarios"];

/** Rotas que agency não pode acessar (só vê dashboard e demandas). */
const FORBIDDEN_FOR_AGENCY = ["/agencias", "/usuarios", "/solicitantes"];

/** Verifica se o role pode acessar a rota. */
export function canAccessRoute(role: UserRole | null, pathname: string): boolean {
  if (!role || role === "admin") return true;
  if (role === "agency") {
    return !FORBIDDEN_FOR_AGENCY.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
  }
  return !FORBIDDEN_FOR_OPERATOR.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
}

/** Itens de menu permitidos por role. */
export const MENU_ITEMS_BY_ROLE: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/", "/usuarios", "/solicitantes", "/agencias"],
  operator: ["/dashboard", "/", "/solicitantes"],
  agency: ["/dashboard", "/"],
};
