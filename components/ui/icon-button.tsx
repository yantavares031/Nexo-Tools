import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const variants = {
  default: "hover:bg-neutral-100 hover:text-neutral-800",
  danger: "hover:bg-red-50 hover:text-red-600",
} as const;

type Props = ComponentProps<"button"> & {
  /** Obrigatório: o botão só tem ícone. */
  "aria-label": string;
  variant?: keyof typeof variants;
};

/** Ação por ícone em linhas de tabela e cards (editar, remover, baixar...). */
export function IconButton({ variant = "default", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      title={props["aria-label"]}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-field text-neutral-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
