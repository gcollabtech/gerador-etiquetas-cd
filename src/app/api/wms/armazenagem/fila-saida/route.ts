import { NextRequest, NextResponse } from "next/server";
import { calcularFilaSaidaEstoque } from "@/lib/serverArmazenagem";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku") || undefined;
    const filas = await calcularFilaSaidaEstoque(sku);
    return NextResponse.json({ success: true, count: filas.length, filas });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao consultar fila de saída de estoque." },
      { status: 500 }
    );
  }
}
