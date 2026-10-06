"use client";

import { useActionState, useEffect, useRef } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { sendRealtimeNoticeAction } from "@/app/actions/realtime";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input, inputClassName } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/roles";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { RealtimeOnlineUser } from "@/lib/use-cases/realtime-connections.use-case";

export function SendNoticeForm({ onlineUsers }: { onlineUsers: RealtimeOnlineUser[] }) {
  const [state, formAction, isPending] = useActionState(sendRealtimeNoticeAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useToastOnActionError(state);

  useEffect(() => {
    if (!state?.success) return;
    toast.success(state.success);
    formRef.current?.reset();
  }, [state]);

  return (
    <FormSection
      icon={<Megaphone aria-hidden />}
      title="Enviar aviso"
      description="Aparece na hora como notificação para quem está com o painel aberto."
    >
      <form ref={formRef} action={formAction} className="max-w-3xl space-y-4">
        <fieldset disabled={isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="notice-target" label="Para quem">
            <Select id="notice-target" name="target" defaultValue="all" className="w-full">
              <option value="all">Todos online</option>
              <optgroup label="Por perfil">
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={`role:${role}`}>
                    {label}
                  </option>
                ))}
              </optgroup>
              {onlineUsers.length > 0 && (
                <optgroup label="Usuário online">
                  {onlineUsers.map((user) => (
                    <option key={user.userId} value={`user:${user.userId}`}>
                      {user.userName}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </FormField>

          <FormField id="notice-variant" label="Tipo">
            <Select id="notice-variant" name="variant" defaultValue="info" className="w-full">
              <option value="info">Informação</option>
              <option value="success">Sucesso</option>
              <option value="warning">Atenção</option>
            </Select>
          </FormField>

          <FormField id="notice-title" label="Título" className="sm:col-span-2">
            <Input id="notice-title" name="title" maxLength={80} required placeholder="Ex.: Manutenção às 18h" />
          </FormField>

          <FormField id="notice-message" label="Mensagem" hint="Até 300 caracteres." className="sm:col-span-2">
            <textarea
              id="notice-message"
              name="message"
              rows={3}
              maxLength={300}
              required
              className={cn("block h-auto w-full resize-y py-2", inputClassName)}
              placeholder="Ex.: O sistema ficará indisponível por 10 minutos."
            />
          </FormField>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            {!isPending && <Send className="size-4" strokeWidth={2.25} aria-hidden />}
            {isPending ? "Enviando..." : "Enviar aviso"}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}
