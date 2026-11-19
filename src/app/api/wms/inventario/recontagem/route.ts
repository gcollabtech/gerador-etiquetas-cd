// src/app/api/wms/inventario/recontagem/route.ts
import { NextResponse } from "next/server";
import { solicitarRecontagemPlano } from "@/lib/serverInventario";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plano_id, novo_operador_nome } = body;

    if (!plano_id) {
      return NextResponse.json({ error: "plano_id é obrigatório." }, { status: 400 });
    }

    const resultado = solicitarRecontagemPlano(plano_id, novo_operador_nome);
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao solicitar recontagem." }, { status: 500 });
  }
}
