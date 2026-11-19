// src/app/api/wms/expedicao/cargas/route.ts
import { NextResponse } from "next/server";
import {
  getCargasExpedicao,
  getCargaById,
  criarCargaExpedicao,
  getIndicadoresExpedicao,
} from "@/lib/serverExpedicao";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const carga = getCargaById(id);
      if (!carga) {
        return NextResponse.json({ error: "Carga não encontrada." }, { status: 404 });
      }
      return NextResponse.json(carga);
    }

    const cargas = getCargasExpedicao();
    const indicadores = getIndicadoresExpedicao();
    return NextResponse.json({ cargas, indicadores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao consultar cargas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = criarCargaExpedicao(body);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar carga de expedição." }, { status: 500 });
  }
}
