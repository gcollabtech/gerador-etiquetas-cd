import { NextResponse } from "next/server";
import {
  getQualidadeData,
  getIndicadoresQualidade,
  criarInspecao,
} from "@/lib/serverQualidade";

export async function GET() {
  try {
    const data = getQualidadeData();
    const indicadores = getIndicadoresQualidade();
    return NextResponse.json({
      success: true,
      data,
      indicadores,
    });
  } catch (error) {
    console.error("Erro na rota GET /api/wms/qualidade:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar dados do Controle de Qualidade." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inspecao = criarInspecao(body);
    const indicadores = getIndicadoresQualidade();
    return NextResponse.json({
      success: true,
      inspecao,
      indicadores,
    });
  } catch (error) {
    console.error("Erro na rota POST /api/wms/qualidade:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao registrar inspeção de qualidade." },
      { status: 500 }
    );
  }
}
