import { NextResponse } from "next/server";
import { atualizarDestinacaoRnc, getIndicadoresQualidade } from "@/lib/serverQualidade";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = atualizarDestinacaoRnc({
      rncId: body.rncId,
      destinacao: body.destinacao,
      responsavel: body.responsavel,
      parecer: body.parecer,
      liberarBloqueioAssociado: body.liberarBloqueioAssociado,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    const indicadores = getIndicadoresQualidade();
    return NextResponse.json({
      success: true,
      rnc: res.rnc,
      protocoloGerado: res.protocoloGerado,
      indicadores,
    });
  } catch (error) {
    console.error("Erro na rota POST /api/wms/qualidade/destinacoes:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao definir destinação técnica da RNC." },
      { status: 500 }
    );
  }
}
