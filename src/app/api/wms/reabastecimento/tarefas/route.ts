import { NextRequest, NextResponse } from "next/server";
import {
  getTarefasReabastecimento,
  saveTarefaReabastecimento,
  alocarOperadorTarefa,
  cancelarTarefaReabastecimento,
} from "@/lib/serverReabastecimento";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const prioridade = searchParams.get("prioridade") || undefined;

    const tarefas = await getTarefasReabastecimento({ status, prioridade });
    return NextResponse.json({ success: true, count: tarefas.length, tarefas });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao consultar tarefas de reabastecimento." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const salva = await saveTarefaReabastecimento(body);
    return NextResponse.json({ success: true, tarefa: salva });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao criar tarefa de reabastecimento." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "alocar") {
      const res = await alocarOperadorTarefa(
        body.tarefaId,
        body.operadorNome || "Operador WMS",
        body.supervisorNome || "Supervisor WMS"
      );
      return NextResponse.json(res);
    }

    if (body.action === "cancelar") {
      const res = await cancelarTarefaReabastecimento(
        body.tarefaId,
        body.motivo || "Cancelamento pelo supervisor",
        body.supervisorNome || "Supervisor WMS"
      );
      return NextResponse.json(res);
    }

    const salva = await saveTarefaReabastecimento(body);
    return NextResponse.json({ success: true, tarefa: salva });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao atualizar tarefa." },
      { status: 500 }
    );
  }
}
