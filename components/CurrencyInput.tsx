"use client";

import { useId, useState } from "react";
import { formatBrazilianCurrency, parseBrazilianCurrency } from "@/lib/currency";

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange"
  > {
  name: string;
  defaultValue?: number;
}

export function CurrencyInput({
  name,
  defaultValue = 0,
  id,
  className = "",
  ...rest
}: CurrencyInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [displayValue, setDisplayValue] = useState(() =>
    formatBrazilianCurrency(defaultValue)
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
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
      // Ex: "3,000" -> "30,00" (permite digitar 3 milhões: 3.000.000,00)
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
    setDisplayValue(formatted);
  }

  function handleBlur() {
    const parsed = parseBrazilianCurrency(displayValue);
    setDisplayValue(formatBrazilianCurrency(parsed));
  }

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
        R$
      </span>
      <input
        {...rest}
        type="text"
        id={inputId}
        name={name}
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${className}`}
      />
    </div>
  );
}
