import { NextRequest, NextResponse } from "next/server";
import { downloadComprovacaoAction } from "@/app/actions/demanda-comprovacao";
import { appLogger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await downloadComprovacaoAction(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    if (!result.file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    const fileBuffer = result.file.buffer;
    const ext = result.file.tipoArquivo.toLowerCase();

    // Para PDF, retornar como PDF para embed
    if (ext === ".pdf") {
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(result.file.nomeArquivo)}"`,
        },
      });
    }

    // Para TXT, retornar como texto plano
    if (ext === ".txt") {
      return new NextResponse(fileBuffer.toString("utf-8"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Outros tipos não suportados para preview
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado para preview" },
      { status: 400 }
    );
  } catch (error) {
    appLogger.error(
      { event: "api.comprovacoes.preview.error", err: String(error) },
      "Erro ao fazer preview da comprovação"
    );
    return NextResponse.json(
      { error: "Erro ao fazer preview do arquivo" },
      { status: 500 }
    );
  }
}
