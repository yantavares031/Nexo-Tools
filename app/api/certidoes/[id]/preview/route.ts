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

    const fileBuffer = result.file.buffer;
    const ext = result.file.tipoArquivo.toLowerCase();

    if (ext === ".pdf") {
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(result.file.nomeArquivo)}"`,
        },
      });
    }

    if (ext === ".txt") {
      return new NextResponse(fileBuffer.toString("utf-8"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    return NextResponse.json(
      { error: "Tipo de arquivo não suportado para preview" },
      { status: 400 }
    );
  } catch (error) {
    appLogger.error(
      { event: "api.certidoes.preview.error", err: String(error) },
      "Erro ao fazer preview da certidão"
    );
    return NextResponse.json(
      { error: "Erro ao fazer preview do arquivo" },
      { status: 500 }
    );
  }
}
