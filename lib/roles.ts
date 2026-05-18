import type { UserRole } from "@/types/globals";

/** Rotas que operator não pode acessar (exclusivas de admin). */
const FORBIDDEN_FOR_OPERATOR = [
  "/agencias",
  "/usuarios",
  "/integracoes",
  "/ordens-compra",
];

/** Rotas que agency não pode acessar (só vê dashboard e demandas). */
const FORBIDDEN_FOR_AGENCY = ["/agencias", "/usuarios", "/solicitantes", "/centros-custo", "/integracoes"];

/** OC: apenas admin e agência. */
export function canAccessOrdensCompra(role: UserRole | null): boolean {
  return role === "admin" || role === "agency";
}

/** Verifica se o role pode acessar a rota. */
export function canAccessRoute(role: UserRole | null, pathname: string): boolean {
  if (pathname === "/perfil" || pathname.startsWith("/perfil/")) {
    return Boolean(role);
  }
  if (pathname === "/admin/logs" || pathname.startsWith("/admin/")) {
    return role === "admin";
  }
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
  admin: [
    "/dashboard",
    "/",
    "/comprovacoes",
    "/certidoes",
    "/ordens-compra",
    "/usuarios",
    "/solicitantes",
    "/agencias",
    "/centros-custo",
    "/integracoes",
    "/perfil",
    "/admin/logs",
  ],
  operator: ["/dashboard", "/", "/comprovacoes", "/certidoes", "/solicitantes", "/centros-custo", "/perfil"],
  agency: [
    "/dashboard",
    "/",
    "/comprovacoes",
    "/comprovacoes/adicionar",
    "/certidoes",
    "/certidoes/adicionar",
    "/ordens-compra",
    "/ordens-compra/adicionar",
    "/perfil",
  ],
};
