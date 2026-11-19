// src/app/api/wms/conferencia/route.ts
import { NextResponse } from "next/server";
import {
  getConferencias,
  getConferenciaById,
  iniciarConferencia,
  registrarDivergenciaManual,
  enviarDivergenciaParaAnalise,
  liberarParaExpedicao,
  getIndicadoresConferencia,
} from "@/lib/serverConferencia";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const conf = getConferenciaById(id);
      if (!conf) {
        return NextResponse.json({ error: "Conferência não encontrada." }, { status: 404 });
      }
      return NextResponse.json(conf);
    }

    const conferencias = getConferencias();
    const indicadores = getIndicadoresConferencia();
    return NextResponse.json({ conferencias, indicadores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao consultar conferências." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "iniciar") {
      const { id, operador_id, operador_nome, tipo } = body;
      const res = iniciarConferencia(id, operador_id || "usr-03", operador_nome || "Operador", tipo || "dirigida");
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "divergencia_manual") {
      const { conferencia_id, item_id, tipo, motivo, operador_nome, foto_url } = body;
      const res = registrarDivergenciaManual({
        conferencia_id,
        item_id,
        tipo,
        motivo,
        operador_nome: operador_nome || "Conferente",
        foto_url,
      });
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "analise_quarentena") {
      const { conferencia_id, divergencia_id, resolucao } = body;
      const res = enviarDivergenciaParaAnalise(conferencia_id, divergencia_id, resolucao || "corrigido");
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "liberar_expedicao") {
      const { conferencia_id } = body;
      const res = liberarParaExpedicao(conferencia_id);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Ação não informada ou inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no processamento da conferência." }, { status: 500 });
  }
}
