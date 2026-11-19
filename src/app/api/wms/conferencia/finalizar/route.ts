// src/app/api/wms/conferencia/finalizar/route.ts
import { NextResponse } from "next/server";
import { finalizarConferencia } from "@/lib/serverConferencia";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferencia_id, usuario_nome } = body;

    if (!conferencia_id) {
      return NextResponse.json({ error: "conferencia_id é obrigatório." }, { status: 400 });
    }

    const resultado = finalizarConferencia(conferencia_id, usuario_nome || "Conferente");

    if (!resultado.success) {
      // Retorna 422 Unprocessable Entity com a mensagem da trava da Regra 6.4
      return NextResponse.json({ error: resultado.error }, { status: 422 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao finalizar conferência." }, { status: 500 });
  }
}
