import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { listUsersUseCase } from "@/lib/use-cases/list-users.use-case";
import { listAgenciasUseCase } from "@/lib/use-cases/list-agencias.use-case";
import { getAgenciaRepository, getUserRepository } from "@/lib/repositories";
import { sanitizeUserForClient } from "@/lib/sanitize-user";
import { integerFormat } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownItem } from "@/components/ui/dropdown-item";
import { FilterChip } from "@/components/ui/filter-chip";
import { SearchPill } from "@/components/ui/search-pill";
import { UsuariosHeader } from "./sub/UsuariosHeader";
import { UsuariosTable } from "./sub/UsuariosTable";
import { SearchParamsToaster } from "./sub/SearchParamsToaster";
import { ROLE_FILTER_VALUES, ROLE_LABELS, parseRoleFilter, usuariosHref } from "./sub/user-roles";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; perfil?: string }>;
}) {
  const { q, perfil: perfilParam } = await searchParams;
  const searchQuery = q?.trim() || undefined;
  const perfil = parseRoleFilter(perfilParam);

  const userRepository = getUserRepository();
  const agenciaRepository = getAgenciaRepository();
  const [usersRaw, agencias] = await Promise.all([
    listUsersUseCase({ userRepository }),
    listAgenciasUseCase({ agenciaRepository }),
  ]);
  const users = usersRaw.map(sanitizeUserForClient);

  const term = searchQuery?.toLowerCase();
  const matchingSearch = term
    ? users.filter(
        (user) => (user.name ?? "").toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
      )
    : users;
  const filtered = perfil ? matchingSearch.filter((user) => user.role === perfil) : matchingSearch;

  const countByRole = (role: (typeof ROLE_FILTER_VALUES)[number]) =>
    matchingSearch.filter((user) => user.role === role).length;

  return (
    <div className="w-full">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <SearchParamsToaster />
        </Suspense>

        <PageHeader
          title="Usuários"
          description="Quem acessa o sistema, com perfil e situação de acesso."
          actions={<UsuariosHeader agencias={agencias} />}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchPill
            action="/usuarios"
            q={searchQuery}
            placeholder="Buscar por nome ou e-mail"
            label="Buscar usuários"
            hiddenParams={{ perfil }}
            clearHref={usuariosHref({ perfil })}
          />
          <Dropdown
            key={`perfil-${searchQuery ?? ""}-${perfil ?? "all"}`}
            highlighted={!!perfil}
            trigger={
              <>
                <ShieldCheck aria-hidden />
                <span className="opacity-70">Perfil</span>
                <span className="font-medium">{perfil ? ROLE_LABELS[perfil] : "Todos"}</span>
              </>
            }
          >
            <DropdownItem href={usuariosHref({ q: searchQuery })} active={!perfil} count={matchingSearch.length}>
              Todos
            </DropdownItem>
            {ROLE_FILTER_VALUES.map((role) => (
              <DropdownItem
                key={role}
                href={usuariosHref({ q: searchQuery, perfil: role })}
                active={perfil === role}
                count={countByRole(role)}
              >
                {ROLE_LABELS[role]}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <Badge tone="dark" className="px-2.5 py-1">
              <span className="tabular-nums">{integerFormat.format(filtered.length)}</span>
              {filtered.length === 1 ? "usuário" : "usuários"}
            </Badge>
            {searchQuery && (
              <FilterChip label="busca" removeHref={usuariosHref({ perfil })}>
                “{searchQuery}”
              </FilterChip>
            )}
            {perfil && (
              <FilterChip label="perfil" removeHref={usuariosHref({ q: searchQuery })}>
                {ROLE_LABELS[perfil]}
              </FilterChip>
            )}
          </div>

          <UsuariosTable
            users={filtered}
            agencias={agencias}
            emptyMessage={
              searchQuery || perfil ? "Nenhum usuário encontrado para os filtros aplicados." : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
