import { NextRequest, NextResponse } from "next/server";
import { executarPassoColetor } from "@/lib/serverReabastecimento";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tarefaId || !body.passo) {
      return NextResponse.json(
        { success: false, error: "ID da tarefa e passo operacional são obrigatórios." },
        { status: 400 }
      );
    }

    const res = await executarPassoColetor({
      tarefaId: body.tarefaId,
      passo: body.passo,
      valorBipado: body.valorBipado,
      quantidadeInformada: body.quantidadeInformada,
      operadorNome: body.operadorNome || "Operador WMS",
      divergenciaMotivo: body.divergenciaMotivo,
    });

    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao executar etapa no coletor." },
      { status: 500 }
    );
  }
}
