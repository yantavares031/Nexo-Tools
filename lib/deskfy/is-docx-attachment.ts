/** Detecta anexo Office Open XML (.docx) para pré-visualização com Mammoth. */
export function isDocxAttachment(
  extension?: string | null,
  contentType?: string | null,
  fileUrl?: string | null
): boolean {
  const e = (extension ?? "").toLowerCase().replace(/^\./, "");
  if (e === "docx") return true;

  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("wordprocessingml") && ct.includes("document")) return true;
  if (ct === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;

  const path = fileUrl?.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".docx")) return true;

  return false;
}
