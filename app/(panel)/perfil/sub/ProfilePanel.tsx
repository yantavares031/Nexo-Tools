"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  changeProfilePasswordAction,
  updateProfileAvatarAction,
  updateProfileNameAction,
  type ProfileActionState,
} from "@/app/actions/profile";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { UserCircle } from "lucide-react";

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
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <UserCircle className="size-5 shrink-0 text-blue-600" aria-hidden />
          Foto
        </h2>
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL autenticada da própria API
              <img
                src={avatarSrc}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-slate-400">
                <UserCircle className="size-14" aria-hidden />
              </div>
            )}
          </div>
          <form action={avatarAction} className="max-w-md flex-1 space-y-3">
            <p className="text-sm text-slate-600">
              Você pode trocar sua foto quando quiser.
            </p>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={avatarPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {avatarPending ? "Enviando…" : "Salvar foto"}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Dados</h2>
        <form action={nameAction} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="profile-email"
              type="email"
              value={props.email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-500">O e-mail não pode ser alterado aqui.</p>
          </div>
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              required
              defaultValue={props.defaultName}
              autoComplete="name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={namePending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {namePending ? "Salvando…" : "Salvar nome"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Alterar senha</h2>
        <form action={passwordAction} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-slate-700">
              Senha atual
            </label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
              Nova senha
            </label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-700">
              Confirmar nova senha
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {passwordPending ? "Alterando…" : "Alterar senha"}
          </button>
        </form>
      </section>
    </div>
  );
}
