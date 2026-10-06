"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function Dropdown({
  trigger,
  highlighted = false,
  align = "start",
  children,
}: {
  trigger: ReactNode;
  highlighted?: boolean;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap transition-colors [&_svg]:size-3.5",
          highlighted
            ? "border-neutral-800 bg-neutral-800 text-white"
            : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
          open && !highlighted && "border-neutral-500",
        )}
      >
        {trigger}
        <ChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className={cn(
            "absolute top-full z-20 mt-1.5 max-h-80 min-w-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg shadow-neutral-900/8",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
