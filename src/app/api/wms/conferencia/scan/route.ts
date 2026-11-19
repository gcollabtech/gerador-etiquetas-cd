// src/app/api/wms/conferencia/scan/route.ts
import { NextResponse } from "next/server";
import { executarBipagemConferencia } from "@/lib/serverConferencia";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      conferencia_id,
      codigo_lido,
      lote_lido,
      validade_lida,
      volume_id,
      quantidade_bipada,
      operador_nome,
    } = body;

    if (!conferencia_id || !codigo_lido) {
      return NextResponse.json(
        { error: "conferencia_id e codigo_lido são obrigatórios para a bipagem." },
        { status: 400 }
      );
    }

    const resultado = executarBipagemConferencia({
      conferencia_id,
      codigo_lido,
      lote_lido,
      validade_lida,
      volume_id,
      quantidade_bipada: Number(quantidade_bipada) || 1,
      operador_nome: operador_nome || "Conferente",
    });

    if (resultado.bloqueado) {
      return NextResponse.json(resultado, { status: 422 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao processar bipagem de conferência." }, { status: 500 });
  }
}
