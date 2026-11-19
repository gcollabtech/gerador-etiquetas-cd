// src/app/api/wms/expedicao/carregamento-scan/route.ts
import { NextResponse } from "next/server";
import { executarBipagemCarregamento, iniciarCarregamento } from "@/lib/serverExpedicao";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, carga_id, codigo_lido, operador_nome } = body;

    if (!carga_id) {
      return NextResponse.json({ error: "carga_id é obrigatório." }, { status: 400 });
    }

    if (action === "iniciar") {
      const res = iniciarCarregamento(carga_id);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (!codigo_lido) {
      return NextResponse.json({ error: "codigo_lido é obrigatório para bipagem." }, { status: 400 });
    }

    const resultado = executarBipagemCarregamento({
      carga_id,
      codigo_lido,
      operador_nome: operador_nome || "Conferente de Doca",
    });

    if (resultado.bloqueado) {
      return NextResponse.json(resultado, { status: 422 });
    }

    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro na bipagem de carregamento." }, { status: 500 });
  }
}
