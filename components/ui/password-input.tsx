"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { inputClassName } from "./input";

export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={cn("block w-full", inputClassName, "pr-20", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 px-3 text-xs text-neutral-500 hover:text-neutral-900"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
