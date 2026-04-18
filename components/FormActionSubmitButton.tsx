"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

const spinnerWhite = (
  <span
    className="size-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent"
    aria-hidden
  />
);

export type FormActionSubmitButtonProps = {
  pending: boolean;
  children: ReactNode;
  pendingLabel: string;
  /** Quando o botão fica fora do `<form>` (ex.: rodapé do modal). */
  form?: string;
  /** Ícone ou trecho exibido no estado ocioso (antes do label). */
  idleStart?: ReactNode;
  /** Classes do `<button>` (substituem o estilo padrão azul se passadas por completo). */
  className?: string;
};

const defaultPrimaryClass =
  "flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:pointer-events-none disabled:opacity-50";

/**
 * Botão de submit com spinner e disabled durante a server action.
 * Use com `pending` vindo do terceiro retorno de `useActionState` (especialmente quando o botão está fora do `<form>`).
 */
export function FormActionSubmitButton({
  pending,
  children,
  pendingLabel,
  form,
  idleStart,
  className,
}: FormActionSubmitButtonProps) {
  const btnClass = className?.trim() ? className : defaultPrimaryClass;
  return (
    <button
      type="submit"
      form={form}
      disabled={pending}
      aria-busy={pending}
      className={btnClass}
    >
      {pending ? (
        <>
          {spinnerWhite}
          {pendingLabel}
        </>
      ) : (
        <>
          {idleStart}
          {children}
        </>
      )}
    </button>
  );
}

type FormSubmitButtonProps = Omit<FormActionSubmitButtonProps, "pending">;

/**
 * Mesmo visual que {@link FormActionSubmitButton}, usando `useFormStatus` — só funciona como **filho** do `<form>`.
 */
export function FormSubmitButton(props: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  return <FormActionSubmitButton {...props} pending={pending} />;
}
