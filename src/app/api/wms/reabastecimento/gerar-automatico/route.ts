import { NextRequest, NextResponse } from "next/server";
import { verificarEGerarTarefasAutomaticas } from "@/lib/serverReabastecimento";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await verificarEGerarTarefasAutomaticas({
      ondaId: body.ondaId,
      supervisorNome: body.supervisorNome || "Monitor Inteligente WMS",
    });

    return NextResponse.json({ success: true, ...res });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao verificar e gerar tarefas automáticas." },
      { status: 500 }
    );
  }
}
