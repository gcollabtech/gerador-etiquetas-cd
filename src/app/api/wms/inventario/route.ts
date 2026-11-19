// src/app/api/wms/inventario/route.ts
import { NextResponse } from "next/server";
import {
  getPlanosInventario,
  getPlanoById,
  criarPlanoInventario,
  getIndicadoresInventario,
} from "@/lib/serverInventario";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const plano = getPlanoById(id);
      if (!plano) {
        return NextResponse.json({ error: "Plano de inventário não encontrado." }, { status: 404 });
      }
      return NextResponse.json(plano);
    }

    const planos = getPlanosInventario();
    const indicadores = getIndicadoresInventario();
    return NextResponse.json({ planos, indicadores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao consultar inventários." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = criarPlanoInventario(body);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar plano de inventário." }, { status: 500 });
  }
}
