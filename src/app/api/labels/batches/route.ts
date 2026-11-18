import { NextRequest, NextResponse } from "next/server";
import {
  getServerBatches,
  addServerBatch,
  clearServerBatches,
} from "@/lib/serverLabels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const batches = await getServerBatches();
  return NextResponse.json(
    { success: true, history: batches },
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
    if (!body.batch) {
      return NextResponse.json(
        { success: false, error: "Nenhum lote informado." },
        { status: 400 }
      );
    }
    await addServerBatch(body.batch);
    const updated = await getServerBatches();
    return NextResponse.json({ success: true, history: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao salvar histórico de lote." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearServerBatches();
    return NextResponse.json({ success: true, history: [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao limpar histórico." },
      { status: 500 }
    );
  }
}
