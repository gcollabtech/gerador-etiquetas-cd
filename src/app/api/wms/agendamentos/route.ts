import { NextRequest, NextResponse } from "next/server";
import {
  getServerAgendamentos,
  saveOrUpdateServerAgendamento,
  deleteServerAgendamento,
} from "@/lib/serverWms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const agendamentos = await getServerAgendamentos();
  return NextResponse.json(
    { success: true, agendamentos },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.agendamento) {
      return NextResponse.json(
        { success: false, error: "Nenhum agendamento informado." },
        { status: 400 }
      );
    }
    const saved = await saveOrUpdateServerAgendamento(body.agendamento);
    return NextResponse.json({ success: true, agendamento: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao salvar agendamento." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID não informado." },
        { status: 400 }
      );
    }
    await deleteServerAgendamento(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao excluir agendamento." },
      { status: 500 }
    );
  }
}
