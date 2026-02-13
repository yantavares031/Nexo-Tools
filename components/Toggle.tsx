"use client";

import { useId } from "react";

interface ToggleProps {
  /** Quando informado, um input hidden é renderizado para envio no form (value "true" ou "false"). */
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Componente on/off para habilitar ou desabilitar opções. */
export function Toggle({ name, checked, onChange, label, disabled }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      {name && (
        <input type="hidden" name={name} value={checked ? "true" : "false"} />
      )}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 ${
          checked ? "bg-blue-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
          style={{ marginTop: 1 }}
        />
      </button>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
    </div>
  );
}
