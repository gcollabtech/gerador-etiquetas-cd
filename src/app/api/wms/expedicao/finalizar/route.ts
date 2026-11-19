// src/app/api/wms/expedicao/finalizar/route.ts
import { NextResponse } from "next/server";
import { finalizarExpedicaoComAssinatura } from "@/lib/serverExpedicao";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { carga_id, motorista_nome, motorista_cpf, motorista_cnh, assinatura_base64, operador_nome } = body;

    if (!carga_id) {
      return NextResponse.json({ error: "carga_id é obrigatório." }, { status: 400 });
    }

    const resultado = finalizarExpedicaoComAssinatura({
      carga_id,
      motorista_nome,
      motorista_cpf,
      motorista_cnh,
      assinatura_base64,
      operador_nome: operador_nome || "Expedição CD",
    });

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 422 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao finalizar expedição." }, { status: 500 });
  }
}
