"use client";

import { useActionState } from "react";
import { Check, IdCard, Wallet, Workflow } from "lucide-react";
import { updateAgenciaAction } from "@/app/actions/agencia";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { Agencia } from "@/types/globals";

interface BoardOption {
  id: string;
  nome: string;
}

interface AgenciaFormProps {
  agencia: Agencia;
  boards?: BoardOption[];
}

export function AgenciaForm({ agencia, boards = [] }: AgenciaFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateAgenciaAction.bind(null, agencia.id),
    null
  );
  useToastOnActionError(state);

  return (
    <form action={formAction} className="max-w-3xl">
      <fieldset disabled={isPending}>
        <PanelHeader
          title="Dados da agência"
          description="Identificação, orçamento e integração com o Deskfy."
          actions={
            <SubmitButton pendingLabel="Salvando…">
              <Check className="size-4" strokeWidth={2.25} aria-hidden />
              Salvar alterações
            </SubmitButton>
          }
        />

        <FormSection
          icon={<IdCard aria-hidden />}
          title="Identificação"
          description="Como a agência aparece no sistema."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="nomeFantasia" label="Nome fantasia">
              <Input
                id="nomeFantasia"
                name="nomeFantasia"
                required
                defaultValue={agencia.nomeFantasia}
                placeholder="Ex: La Marka"
              />
            </FormField>
            <FormField id="cnpj" label="CNPJ">
              <Input
                id="cnpj"
                name="cnpj"
                required
                defaultValue={agencia.cnpj}
                placeholder="00.000.000/0001-00"
                inputMode="numeric"
                className="tabular-nums"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<Wallet aria-hidden />}
          title="Orçamento"
          description="Limite anual usado para acompanhar faturado vs capacidade."
        >
          <FormField id="orcamentoAnual" label="Limite orçamento anual (R$)" className="sm:max-w-xs">
            <CurrencyInput id="orcamentoAnual" name="orcamentoAnual" defaultValue={agencia.orcamentoAnual} />
          </FormField>
        </FormSection>

        {boards.length > 0 ? (
          <FormSection
            icon={<Workflow aria-hidden />}
            title="Integração Deskfy"
            description="Board usado na importação de demandas desta agência."
          >
            <FormField id="boardId" label="Board Deskfy" className="sm:max-w-sm">
              <Select id="boardId" name="boardId" defaultValue={agencia.boardId ?? ""} className="w-full">
                <option value="">Nenhum</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.nome}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormSection>
        ) : null}
      </fieldset>
    </form>
  );
}
