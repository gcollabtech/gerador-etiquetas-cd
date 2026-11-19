import { NextRequest, NextResponse } from "next/server";
import { getMovimentacoes, registrarMovimentacao } from "@/lib/serverArmazenagem";

export async function GET() {
  try {
    const movimentacoes = await getMovimentacoes();
    return NextResponse.json({ success: true, count: movimentacoes.length, movimentacoes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao listar movimentações." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await registrarMovimentacao(body);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao registrar movimentação." },
      { status: 500 }
    );
  }
}
