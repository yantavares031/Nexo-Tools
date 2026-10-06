"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Check, Gauge, History, Info, Percent, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { runCapacityAlertsNowAction, saveCapacityAlertConfigAction } from "@/app/actions/capacity-alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { CapacityAlertPanel } from "@/lib/use-cases/capacity-alert-config.use-case";

const percentFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

interface CapacidadeSectionProps {
  initialPanel: CapacityAlertPanel;
}

export function CapacidadeSection({ initialPanel }: CapacidadeSectionProps) {
  const { config, year, sent } = initialPanel;
  const [state, formAction, isPendingSave] = useActionState(saveCapacityAlertConfigAction, null);
  const [isChecking, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(config.enabled);

  useToastOnActionError(state);

  useEffect(() => {
    if (state?.success) toast.success("Alertas de capacidade salvos.");
  }, [state]);

  function handleCheckNow() {
    startTransition(async () => {
      const response = await runCapacityAlertsNowAction();
      if ("error" in response) {
        toast.error(response.error);
        return;
      }
      const { result } = response;
      if (result.skipped) {
        toast.error(result.skipped);
      } else if (result.alertasEnviados === 0 && result.falhas === 0) {
        toast.success("Nenhuma agência cruzou um novo limite.");
      } else if (result.falhas > 0) {
        toast.error(`${result.alertasEnviados} alerta(s) enviado(s) e ${result.falhas} falha(s) no WhatsApp.`);
      } else {
        toast.success(`${result.alertasEnviados} alerta(s) enviado(s) por WhatsApp.`);
      }
    });
  }

  return (
    <div className="max-w-3xl">
      <form action={formAction}>
        <PanelHeader
          title="Alertas de capacidade"
          description="Aviso por WhatsApp quando uma agência atinge um percentual da capacidade anual."
          actions={
            <Button type="submit" loading={isPendingSave}>
              {!isPendingSave && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
              {isPendingSave ? "Salvando..." : "Salvar"}
            </Button>
          }
        />

        <Callout icon={<Info aria-hidden />} title="Como funciona" className="mb-7">
          O uso é o valor Faturado no ano corrente (pelo mês de referência da demanda) dividido pela capacidade anual cadastrada, como no Dashboard. Ao
          salvar uma demanda, comprovação ou agência, o sistema confere os limites e avisa os números
          configurados na aba WhatsApp. Cada limite é avisado uma vez por agência no ano.
        </Callout>

        <fieldset disabled={isPendingSave}>
          <FormSection icon={<Gauge aria-hidden />} title="Envio">
            <div className="space-y-1">
              <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
              <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
                Enviar alertas de capacidade por WhatsApp
              </Switch>
              <p className="text-xs text-neutral-500">Agências sem capacidade anual cadastrada são ignoradas.</p>
            </div>
          </FormSection>

          <FormSection
            icon={<Percent aria-hidden />}
            title="Limites"
            description="Percentuais da capacidade anual que disparam o alerta."
          >
            <FormField id="capacity-thresholds" label="Limites (%)" hint="Separe por vírgula. Ex.: 80, 100">
              <Input
                id="capacity-thresholds"
                name="thresholds"
                defaultValue={config.thresholds.join(", ")}
                inputMode="numeric"
                className="tabular-nums sm:w-60"
              />
            </FormField>
          </FormSection>
        </fieldset>
      </form>

      <FormSection
        icon={<History aria-hidden />}
        title={`Alertas enviados em ${year}`}
        description="Limites já avisados não são enviados de novo no mesmo ano."
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Agência</TableHeaderCell>
              <TableHeaderCell>Limite</TableHeaderCell>
              <TableHeaderCell>Uso no envio</TableHeaderCell>
              <TableHeaderCell>Enviado em</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-neutral-500">
                  Nenhum alerta enviado neste ano.
                </TableCell>
              </TableRow>
            ) : (
              sent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-neutral-950">{item.agenciaNome ?? "Agência removida"}</TableCell>
                  <TableCell>
                    <Badge tone={item.threshold >= 100 ? "danger" : "warning"}>{item.threshold}%</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{percentFormat.format(item.percentual)}%</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(item.sentAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </FormSection>

      <FormSection
        icon={<RefreshCw aria-hidden />}
        title="Verificar agora"
        description="Confere todas as agências com os limites salvos e envia os alertas pendentes."
      >
        <Button type="button" variant="outline" onClick={handleCheckNow} loading={isChecking} disabled={isPendingSave}>
          {isChecking ? "Verificando…" : "Verificar agora"}
        </Button>
      </FormSection>
    </div>
  );
}
