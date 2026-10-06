import { Check, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function FormActions({
  readOnly = false,
  submitLabel = "Salvar alterações",
}: {
  readOnly?: boolean;
  submitLabel?: string;
}) {
  return (
    <>
      {readOnly && (
        <p className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500">
          <Lock className="size-3.5" aria-hidden />
          Edição desabilitada
        </p>
      )}
      <Button type="reset" variant="ghost">
        <RotateCcw className="size-4" aria-hidden />
        Descartar
      </Button>
      <SubmitButton pendingLabel="Salvando…">
        <Check className="size-4" strokeWidth={2.25} aria-hidden />
        {submitLabel}
      </SubmitButton>
    </>
  );
}
