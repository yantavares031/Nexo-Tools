"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, IdCard, KeyRound, UserCircle } from "lucide-react";
import {
  changeProfilePasswordAction,
  updateProfileAvatarAction,
  updateProfileNameAction,
  type ProfileActionState,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { PasswordInput } from "@/components/ui/password-input";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";

export function ProfilePanel(props: {
  email: string;
  defaultName: string;
  /** Chave no armazenamento — muda quando a foto muda, para evitar cache do navegador na mesma URL. */
  avatarVersion: string;
}) {
  const router = useRouter();
  const [nameState, nameAction, namePending] = useActionState(
    updateProfileNameAction,
    null as ProfileActionState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changeProfilePasswordAction,
    null as ProfileActionState
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    updateProfileAvatarAction,
    null as ProfileActionState
  );

  useToastOnActionError(nameState);
  useToastOnActionError(passwordState);
  useToastOnActionError(avatarState);

  const nameDone = useRef(false);
  const passwordDone = useRef(false);
  const avatarDone = useRef(false);

  useEffect(() => {
    if (nameState?.ok && !nameDone.current) {
      nameDone.current = true;
      toast.success("Nome atualizado.");
      router.refresh();
    }
    if (!nameState?.ok) nameDone.current = false;
  }, [nameState, router]);

  useEffect(() => {
    if (passwordState?.ok && !passwordDone.current) {
      passwordDone.current = true;
      toast.success("Senha alterada.");
      router.refresh();
    }
    if (!passwordState?.ok) passwordDone.current = false;
  }, [passwordState, router]);

  useEffect(() => {
    if (avatarState?.ok && !avatarDone.current) {
      avatarDone.current = true;
      toast.success("Foto atualizada.");
      router.refresh();
    }
    if (!avatarState?.ok) avatarDone.current = false;
  }, [avatarState, router]);

  const avatarSrc = props.avatarVersion
    ? `/api/profile/avatar?v=${encodeURIComponent(props.avatarVersion)}`
    : null;

  return (
    <div className="max-w-3xl">
      <PanelHeader title="Dados da conta" description="Cada bloco é salvo separadamente." />

      <div>
        <FormSection icon={<Camera aria-hidden />} title="Foto" description="Você pode trocar sua foto quando quiser.">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL autenticada da própria API
                <img src={avatarSrc} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-neutral-400">
                  <UserCircle className="size-12" aria-hidden />
                </div>
              )}
            </div>
            <form action={avatarAction} className="min-w-0 flex-1 space-y-3">
              <label htmlFor="profile-avatar" className="sr-only">
                Nova foto
              </label>
              <input
                id="profile-avatar"
                type="file"
                name="avatar"
                accept="image/*"
                disabled={avatarPending}
                className="block w-full text-[13px] text-neutral-600 file:mr-3 file:h-9 file:cursor-pointer file:rounded-field file:border file:border-neutral-300 file:bg-white file:px-4 file:text-sm file:font-medium file:text-neutral-800 hover:file:bg-neutral-50 disabled:cursor-not-allowed"
              />
              <Button type="submit" loading={avatarPending}>
                {avatarPending ? "Enviando…" : "Salvar foto"}
              </Button>
            </form>
          </div>
        </FormSection>

        <FormSection icon={<IdCard aria-hidden />} title="Dados" description="Nome exibido no sistema.">
          <form action={nameAction}>
            <fieldset disabled={namePending} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="profile-email" label="E-mail" hint="O e-mail não pode ser alterado aqui.">
                  <Input id="profile-email" type="email" value={props.email} readOnly disabled />
                </FormField>
                <FormField id="profile-name" label="Nome">
                  <Input
                    id="profile-name"
                    name="name"
                    type="text"
                    required
                    defaultValue={props.defaultName}
                    autoComplete="name"
                  />
                </FormField>
              </div>
              <Button type="submit" loading={namePending}>
                {namePending ? "Salvando…" : "Salvar nome"}
              </Button>
            </fieldset>
          </form>
        </FormSection>

        <FormSection icon={<KeyRound aria-hidden />} title="Senha" description="Mínimo de 6 caracteres.">
          <form action={passwordAction}>
            <fieldset disabled={passwordPending} className="space-y-4">
              <FormField id="current-password" label="Senha atual" className="sm:max-w-[calc(50%-0.5rem)]">
                <PasswordInput
                  id="current-password"
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="new-password" label="Nova senha">
                  <PasswordInput
                    id="new-password"
                    name="newPassword"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField id="confirm-password" label="Confirmar nova senha">
                  <PasswordInput
                    id="confirm-password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </FormField>
              </div>
              <Button type="submit" loading={passwordPending}>
                {passwordPending ? "Alterando…" : "Alterar senha"}
              </Button>
            </fieldset>
          </form>
        </FormSection>
      </div>
    </div>
  );
}
