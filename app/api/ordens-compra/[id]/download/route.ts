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

    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
    };

    const contentType =
      contentTypeMap[result.file.tipoArquivo.toLowerCase()] || "application/octet-stream";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(result.file.nomeArquivo)}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer download da OC:", error);
    return NextResponse.json(
      { error: "Erro ao fazer download do arquivo" },
      { status: 500 }
    );
  }
}
