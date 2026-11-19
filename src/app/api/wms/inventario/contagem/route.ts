// src/app/api/wms/inventario/contagem/route.ts
import { NextResponse } from "next/server";
import { registrarContagemColetor } from "@/lib/serverInventario";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plano_id, item_id, quantidade_contada, lote_contado, validade_contada, operador_id, operador_nome } = body;

    if (!plano_id || !item_id || quantidade_contada === undefined) {
      return NextResponse.json(
        { error: "plano_id, item_id e quantidade_contada são obrigatórios para a contagem." },
        { status: 400 }
      );
    }

    const resultado = registrarContagemColetor({
      plano_id,
      item_id,
      quantidade_contada: Number(quantidade_contada),
      lote_contado,
      validade_contada,
      operador_id: operador_id || "usr-03",
      operador_nome: operador_nome || "Auditor de Inventário",
    });

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.mensagem }, { status: 400 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao processar contagem de inventário." }, { status: 500 });
  }
}
