import { useEffect } from "react";

/** Fecha o modal ao pressionar Escape. */
export function useEscapeKey(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, active]);
}
