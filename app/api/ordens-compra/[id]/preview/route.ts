import { NextRequest, NextResponse } from "next/server";
import { downloadOrdemCompraAction } from "@/app/actions/ordem-compra";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versao =
      request.nextUrl.searchParams.get("versao") === "assinada" ? "assinada" : "original";
    const result = await downloadOrdemCompraAction(id, { versao });

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

    return NextResponse.json(
      { error: "Tipo de arquivo não suportado para preview" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao fazer preview da OC:", error);
    return NextResponse.json(
      { error: "Erro ao fazer preview do arquivo" },
      { status: 500 }
    );
  }
}
