import { NextRequest, NextResponse } from "next/server";
import { downloadCertidaoAction } from "@/app/actions/certidao";
import { appLogger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await downloadCertidaoAction(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    if (!result.file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".xml": "application/xml",
      ".txt": "text/plain",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    const contentType =
      contentTypeMap[result.file.tipoArquivo.toLowerCase()] || "application/octet-stream";

    return new NextResponse(new Uint8Array(result.file.buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(result.file.nomeArquivo)}"`,
      },
    });
  } catch (error) {
    appLogger.error(
      { event: "api.certidoes.download.error", err: String(error) },
      "Erro ao fazer download da certidão"
    );
    return NextResponse.json(
      { error: "Erro ao fazer download do arquivo" },
      { status: 500 }
    );
  }
}
