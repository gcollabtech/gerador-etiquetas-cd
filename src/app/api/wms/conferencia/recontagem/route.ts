// src/app/api/wms/conferencia/recontagem/route.ts
import { NextResponse } from "next/server";
import { solicitarRecontagem } from "@/lib/serverConferencia";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferencia_id, novo_operador_id, novo_operador_nome, motivo } = body;

    if (!conferencia_id || !novo_operador_id) {
      return NextResponse.json(
        { error: "conferencia_id e novo_operador_id são obrigatórios para a recontagem." },
        { status: 400 }
      );
    }

    const resultado = solicitarRecontagem(
      conferencia_id,
      novo_operador_id,
      novo_operador_nome || "Segundo Conferente",
      motivo
    );

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao solicitar recontagem." }, { status: 500 });
  }
}
