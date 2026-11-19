// src/app/api/wms/expedicao/docas/route.ts
import { NextResponse } from "next/server";
import { getDocasExpedicao, alocarDocaCarga } from "@/lib/serverExpedicao";

export async function GET() {
  try {
    const docas = getDocasExpedicao();
    return NextResponse.json({ docas });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao consultar docas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { carga_id, doca_id, horario_previsto } = body;

    if (!carga_id || !doca_id) {
      return NextResponse.json({ error: "carga_id e doca_id são obrigatórios." }, { status: 400 });
    }

    const res = alocarDocaCarga(carga_id, doca_id, horario_previsto || "14:00");
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao alocar doca." }, { status: 500 });
  }
}
