import { NextResponse } from "next/server";
import { registrarNaoConformidadeManual, getIndicadoresQualidade } from "@/lib/serverQualidade";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rnc = registrarNaoConformidadeManual(body);
    const indicadores = getIndicadoresQualidade();
    return NextResponse.json({
      success: true,
      rnc,
      indicadores,
    });
  } catch (error) {
    console.error("Erro na rota POST /api/wms/qualidade/nao-conformidades:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao registrar Não Conformidade (RNC)." },
      { status: 500 }
    );
  }
}
