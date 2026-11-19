// src/app/api/wms/expedicao/status/route.ts
import { NextResponse } from "next/server";
import { registrarSaidaVeiculoPortaria, registrarStatusEntrega } from "@/lib/serverExpedicao";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, carga_id, motivo_ocorrencia, operador } = body;

    if (!carga_id) {
      return NextResponse.json({ error: "carga_id é obrigatório." }, { status: 400 });
    }

    if (action === "saida_portaria") {
      const res = registrarSaidaVeiculoPortaria(carga_id);
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json(res);
    }

    if (action === "confirmar_entrega") {
      const res = registrarStatusEntrega(carga_id, "entregue", undefined, operador);
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json(res);
    }

    if (action === "ocorrencia_entrega") {
      const res = registrarStatusEntrega(carga_id, "entrega_ocorrencia", motivo_ocorrencia || "Ocorrência em trânsito", operador);
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar status da carga." }, { status: 500 });
  }
}
