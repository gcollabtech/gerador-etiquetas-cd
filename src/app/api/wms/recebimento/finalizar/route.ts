import { NextRequest, NextResponse } from "next/server";
import { finalizarRecebimento } from "@/lib/serverRecebimento";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { sucesso: false, error: "ID do recebimento é obrigatório." },
        { status: 400 }
      );
    }

    const resultado = await finalizarRecebimento(id, {
      supervisorNome: body.supervisorNome,
      observacoes: body.observacoes,
    });

    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error("POST /api/wms/recebimento/finalizar erro:", err);
    return NextResponse.json(
      { sucesso: false, error: err.message || "Erro ao finalizar recebimento" },
      { status: 500 }
    );
  }
}
