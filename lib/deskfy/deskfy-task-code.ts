export function parseDeskfyTaskIdFromCode(raw: string): number | null {
  const normalized = raw.trim();
  if (!normalized) return null;

  const match = normalized.match(/^(?:SEB[\s-]*)?(\d+)$/i);
  if (!match) return null;

  const taskId = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(taskId) || taskId <= 0) return null;

  return taskId;
}

