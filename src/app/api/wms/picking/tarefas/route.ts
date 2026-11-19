import { NextResponse } from "next/server";
import {
  getTarefasPicking,
  alocarTarefaOperador,
  finalizarTarefaPicking,
} from "@/lib/serverPicking";

export async function GET() {
  try {
    const tarefas = getTarefasPicking();
    return NextResponse.json({ success: true, tarefas });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "alocar") {
      const res = alocarTarefaOperador(body.tarefa_id, body.operador_id, body.operador_nome);
      if (!res.success) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (body.action === "finalizar") {
      const res = finalizarTarefaPicking(body.tarefa_id, {
        volumes_embalagens_utilizados: body.volumes_embalagens_utilizados,
        embalagem_id: body.embalagem_id,
        observacoes: body.observacoes,
      });
      if (!res.success) {
        return NextResponse.json(res, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
