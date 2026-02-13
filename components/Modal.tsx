"use client";

import { X } from "lucide-react";
import { useEscapeKey } from "@/lib/use-escape-key";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  maxWidth?: MaxWidth;
  /** Id do elemento que descreve o título (aria-labelledby) */
  ariaLabelledby?: string;
  /** Se false, ESC não fecha o modal (ex.: durante remoção ou com submodal aberto). Default true. */
  escapeEnabled?: boolean;
  /** Se false, clique no overlay não fecha (ex.: durante remoção). Default true. */
  closeOnOverlayClick?: boolean;
  /** Classes extras no container interno do diálogo (ex.: max-h-[90vh] flex flex-col overflow-hidden). */
  innerClassName?: string;
}

function ModalRoot({
  children,
  open,
  onClose,
  maxWidth = "md",
  ariaLabelledby = "modal-title",
  escapeEnabled = true,
  closeOnOverlayClick = true,
  innerClassName = "",
}: ModalProps) {
  useEscapeKey(onClose, open && escapeEnabled);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh min-w-full items-center justify-center p-4">
      <div
        className="absolute inset-0 min-h-dvh min-w-full bg-black/40"
        onClick={closeOnOverlayClick ? onClose : () => {}}
        aria-hidden
      />
      <div
        className={`relative z-10 w-full rounded-xl border border-slate-200 bg-white shadow-xl ${maxWidthClasses[maxWidth]} ${innerClassName}`}
        role="dialog"
        aria-labelledby={ariaLabelledby}
        aria-modal
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  /** Desabilita o botão de fechar (ex.: durante remoção). */
  closeDisabled?: boolean;
}

function ModalHeader({ children, onClose, closeDisabled }: ModalHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-3">
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="ml-2 shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  /** Use quando o conteúdo for um form com scroll (ex.: max-h-[70vh]) */
  className?: string;
  as?: "div" | "form";
  [key: string]: unknown;
}

function ModalBody({ children, className = "", as: Component = "div", ...rest }: ModalBodyProps) {
  return (
    <Component
      className={className ? `overflow-y-auto ${className}` : "overflow-y-auto max-h-[70vh] p-6"}
      {...rest}
    >
      {children}
    </Component>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
}

function ModalFooter({ children }: ModalFooterProps) {
  return <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-3">{children}</div>;
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
