function toYmdLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Dias retroativos a partir de hoje (0–180). Data final do intervalo: amanhã. */
export function getDeskfyWorkflowDateRangeFromLookbackDays(lookbackDays: number): {
  initialDate: string;
  endDate: string;
} {
  const daysBack = Math.min(180, Math.max(0, Math.floor(lookbackDays)));
  const now = new Date();

  const initialDate = new Date(now);
  initialDate.setDate(now.getDate() - daysBack);

  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 1);

  return {
    initialDate: toYmdLocal(initialDate),
    endDate: toYmdLocal(endDate),
  };
}

