import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, CalendarDays, CircleDot, FileCheck2, Megaphone, UserRound } from "lucide-react";
import { Button, buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownItem } from "@/components/ui/dropdown-item";
import { SearchPill } from "@/components/ui/search-pill";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { cn } from "@/lib/cn";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { DemandasFilterOptionsSearch, type FilterOptionLink } from "./DemandasFilterOptionsSearch";
import {
  COMPROVACAO_LABELS,
  DEMANDA_STATUS_LABELS,
  demandasHref,
  type DemandasListParams,
} from "./demandas-hrefs";

type FilterKey = Exclude<keyof DemandasListParams, "q" | "page">;

interface DemandasFiltersProps {
  params: Omit<DemandasListParams, "page">;
  options: DemandaFilterOptions;
  /** Oculta o filtro de agência (ex.: usuário agency já vê só as demandas dele). */
  hideAgencyFilter?: boolean;
}

function FilterTrigger({
  icon,
  label,
  value,
  emptyLabel = "Todos",
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  emptyLabel?: string;
}) {
  return (
    <>
      {icon}
      <span className="opacity-70">{label}</span>
      <span className="max-w-40 truncate font-medium">{value ?? emptyLabel}</span>
    </>
  );
}

export function DemandasFilters({ params, options, hideAgencyFilter }: DemandasFiltersProps) {
  const dropdownKey = JSON.stringify(params);
  const hrefWith = (key: FilterKey, value?: string) => demandasHref({ ...params, [key]: value, page: undefined });

  const linksFor = (key: FilterKey, values: string[], labels?: Record<string, string>): FilterOptionLink[] =>
    values.map((value) => ({
      label: labels?.[value] ?? value,
      href: hrefWith(key, value),
      active: params[key] === value,
    }));

  const { q, ...filtersWithoutQ } = params;

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
      <SearchPill
        action="/"
        q={q}
        placeholder="Buscar por demanda, OC/PI ou SEBID"
        label="Buscar demandas"
        hiddenParams={filtersWithoutQ}
        clearHref={demandasHref({ ...params, q: undefined, page: undefined })}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          key={`solicitante-${dropdownKey}`}
          highlighted={!!params.solicitante}
          trigger={
            <FilterTrigger icon={<UserRound aria-hidden />} label="Solicitante" value={params.solicitante} />
          }
        >
          <DemandasFilterOptionsSearch
            placeholder="Buscar solicitante"
            allOption={{ label: "Todos", href: hrefWith("solicitante"), active: !params.solicitante }}
            options={linksFor("solicitante", options.solicitantes)}
          />
        </Dropdown>

        <Dropdown
          key={`unResponsavel-${dropdownKey}`}
          highlighted={!!params.unResponsavel}
          trigger={
            <FilterTrigger
              icon={<Building2 aria-hidden />}
              label="Un. responsável"
              value={params.unResponsavel}
              emptyLabel="Todas"
            />
          }
        >
          <DemandasFilterOptionsSearch
            placeholder="Buscar unidade"
            allOption={{ label: "Todas", href: hrefWith("unResponsavel"), active: !params.unResponsavel }}
            options={linksFor("unResponsavel", options.unResponsaveis)}
          />
        </Dropdown>

        <Dropdown
          key={`status-${dropdownKey}`}
          highlighted={!!params.status}
          trigger={
            <FilterTrigger
              icon={<CircleDot aria-hidden />}
              label="Status"
              value={params.status ? (DEMANDA_STATUS_LABELS[params.status] ?? params.status) : undefined}
            />
          }
        >
          <DropdownItem href={hrefWith("status")} active={!params.status}>
            Todos
          </DropdownItem>
          {linksFor("status", options.statuses, DEMANDA_STATUS_LABELS).map((option) => (
            <DropdownItem key={option.href} href={option.href} active={option.active}>
              {option.label}
            </DropdownItem>
          ))}
        </Dropdown>

        <Dropdown
          key={`comprovacao-${dropdownKey}`}
          highlighted={!!params.comprovacao}
          trigger={
            <FilterTrigger
              icon={<FileCheck2 aria-hidden />}
              label="Comprovação"
              value={params.comprovacao ? COMPROVACAO_LABELS[params.comprovacao] : undefined}
              emptyLabel="Todas"
            />
          }
        >
          <DropdownItem href={hrefWith("comprovacao")} active={!params.comprovacao}>
            Todas
          </DropdownItem>
          {linksFor("comprovacao", Object.keys(COMPROVACAO_LABELS), COMPROVACAO_LABELS).map((option) => (
            <DropdownItem key={option.href} href={option.href} active={option.active}>
              {option.label}
            </DropdownItem>
          ))}
        </Dropdown>

        <Dropdown
          key={`mes-${dropdownKey}`}
          highlighted={!!params.mes}
          trigger={
            <FilterTrigger
              icon={<CalendarDays aria-hidden />}
              label="Mês"
              value={params.mes ? formatMonthYearDisplay(params.mes) : undefined}
              emptyLabel="Todos"
            />
          }
        >
          <Form action="/" className="space-y-2 p-1.5">
            {Object.entries({ ...params, mes: undefined }).map(([name, value]) =>
              value ? <input key={name} type="hidden" name={name} value={value} /> : null,
            )}
            <input
              type="month"
              name="mes"
              defaultValue={params.mes}
              required
              aria-label="Filtrar por mês/ano"
              className="block h-9 w-full rounded-field border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 outline-none focus:border-neutral-700"
            />
            <div className="flex items-center justify-end gap-2">
              {params.mes && (
                <Link href={hrefWith("mes")} className={cn(buttonBaseClassName, buttonVariants.ghost, buttonSizes.sm)}>
                  Limpar
                </Link>
              )}
              <Button type="submit" size="sm">
                Aplicar
              </Button>
            </div>
          </Form>
        </Dropdown>

        {!hideAgencyFilter && (
          <Dropdown
            key={`agencia-${dropdownKey}`}
            highlighted={!!params.agencia}
            trigger={
              <FilterTrigger icon={<Megaphone aria-hidden />} label="Agência" value={params.agencia} emptyLabel="Todas" />
            }
          >
            <DropdownItem href={hrefWith("agencia")} active={!params.agencia}>
              Todas
            </DropdownItem>
            {linksFor("agencia", options.agencias).map((option) => (
              <DropdownItem key={option.href} href={option.href} active={option.active}>
                {option.label}
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>
    </div>
  );
}
