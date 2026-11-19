import { NextResponse } from "next/server";
import {
  criarBloqueioManual,
  desbloquearItem,
  getIndicadoresQualidade,
  getQualidadeData,
} from "@/lib/serverQualidade";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "desbloquear") {
      const res = desbloquearItem({
        bloqueioId: body.bloqueioId,
        responsavel: body.responsavel,
        justificativa: body.justificativa,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      const indicadores = getIndicadoresQualidade();
      return NextResponse.json({
        success: true,
        bloqueio: res.bloqueio,
        indicadores,
      });
    }

    // Criar bloqueio
    const bloqueio = criarBloqueioManual(body);
    const indicadores = getIndicadoresQualidade();
    return NextResponse.json({
      success: true,
      bloqueio,
      indicadores,
    });
  } catch (error) {
    console.error("Erro na rota POST /api/wms/qualidade/bloqueios:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar bloqueio de qualidade." },
      { status: 500 }
    );
  }
}
