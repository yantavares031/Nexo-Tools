import { Megaphone } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownItem } from "@/components/ui/dropdown-item";
import { CertidoesMonthFilter } from "./CertidoesMonthFilter";
import { certidoesHref, type CertidoesFilterParams } from "./hrefs";

export interface CertidaoAgenciaOption {
  id: string;
  nomeFantasia: string;
}

interface CertidoesFiltersProps {
  filters: CertidoesFilterParams;
  agencias: CertidaoAgenciaOption[];
  hideAgencyFilter?: boolean;
}

export function CertidoesFilters({ filters, agencias, hideAgencyFilter = false }: CertidoesFiltersProps) {
  const { q, mes, agenciaId } = filters;
  const agenciaLabel = agencias.find((a) => a.id === agenciaId)?.nomeFantasia ?? "Todas";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CertidoesMonthFilter q={q} mes={mes} agenciaId={agenciaId} />

      {!hideAgencyFilter && (
        <Dropdown
          key={`agencia-${q}-${mes}-${agenciaId}`}
          highlighted={Boolean(agenciaId)}
          trigger={
            <>
              <Megaphone aria-hidden />
              <span className="opacity-70">Agência</span>
              <span className="max-w-40 truncate font-medium">{agenciaLabel}</span>
            </>
          }
        >
          <DropdownItem href={certidoesHref({ q, mes })} active={!agenciaId}>
            Todas
          </DropdownItem>
          {agencias.map((a) => (
            <DropdownItem key={a.id} href={certidoesHref({ q, mes, agenciaId: a.id })} active={agenciaId === a.id}>
              {a.nomeFantasia}
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </div>
  );
}
