"use client";

import { useId, useState, useEffect, useRef } from "react";
import { formatBrazilianCurrency, parseBrazilianCurrency } from "@/lib/currency";

interface CurrencyInputControlledProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange"
  > {
  value: number;
  onChange: (value: number) => void;
}

export function CurrencyInputControlled({
  value,
  onChange,
  id,
  className = "",
  ...rest
}: CurrencyInputControlledProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const previousValueRef = useRef<string>("");

  const [displayValue, setDisplayValue] = useState(() =>
    formatBrazilianCurrency(value)
  );
  const [isEditing, setIsEditing] = useState(false);
  const lastParsedValueRef = useRef<number>(value);

  // Sincronizar quando o value externo mudar (apenas se não estiver editando)
  useEffect(() => {
    if (!isEditing) {
      const formatted = formatBrazilianCurrency(value);
      // Só atualizar se o valor realmente mudou (evita loops)
      if (formatted !== previousValueRef.current) {
        setDisplayValue(formatted);
        previousValueRef.current = formatted;
      }
    }
  }, [value, isEditing]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsEditing(true);
    const raw = e.target.value;
    
    // Usar a mesma lógica do CurrencyInput original, que funciona corretamente
    const digitsAndComma = raw.replace(/[^\d,]/g, "");
    const parts = digitsAndComma.split(",");
    let intPart = "";
    let decPart = "00";

    if (parts.length === 0) {
      intPart = "0";
    } else if (parts.length === 1) {
      intPart = parts[0].replace(/\D/g, "") || "0";
    } else {
      intPart = parts[0].replace(/\D/g, "") || "0";
      decPart = parts
        .slice(1)
        .join("")
        .replace(/\D/g, "");

      // Quando o usuário digita além de 2 decimais, desloca para a parte inteira
      while (decPart.length > 2) {
        intPart += decPart.charAt(0);
        decPart = decPart.slice(1);
      }
      decPart = decPart.slice(0, 2).padEnd(2, "0");
    }

    // Remove zeros à esquerda (ex: "0500000" -> "500000")
    const intPartNormalized = intPart.replace(/^0+/, "") || "0";

    const withDots = intPartNormalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const formatted = `${withDots},${decPart}`;
    
    // Atualizar display
    setDisplayValue(formatted);
    previousValueRef.current = formatted;

    // Atualizar o valor numérico apenas se mudou significativamente
    const parsed = parseBrazilianCurrency(formatted);
    // Evitar chamar onChange se o valor não mudou (evita loops)
    if (Math.abs(parsed - lastParsedValueRef.current) > 0.001) {
      lastParsedValueRef.current = parsed;
      onChange(parsed);
    }
  }

  function handleBlur() {
    setIsEditing(false);
    
    // Se o campo estiver vazio ou inválido, definir como 0
    if (!displayValue || displayValue.trim() === "" || displayValue === "R$") {
      const formatted = "0,00";
      setDisplayValue(formatted);
      previousValueRef.current = formatted;
      onChange(0);
      return;
    }
    
    const parsed = parseBrazilianCurrency(displayValue);
    const formatted = formatBrazilianCurrency(parsed);
    setDisplayValue(formatted);
    previousValueRef.current = formatted;
    onChange(parsed);
  }

  function handleFocus() {
    setIsEditing(true);
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
        R$
      </span>
      <input
        {...rest}
        type="text"
        id={inputId}
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={`w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${className}`}
      />
    </div>
  );
}
