function toYmdLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getDefaultDeskfyWorkflowDateRange(): { initialDate: string; endDate: string } {
  const now = new Date();

  const initialDate = new Date(now);
  initialDate.setDate(now.getDate() - 30);

  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 1);

  return {
    initialDate: toYmdLocal(initialDate),
    endDate: toYmdLocal(endDate),
  };
}

