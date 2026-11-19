import { NextRequest, NextResponse } from "next/server";
import { consultarErpNfe } from "@/lib/serverRecebimento";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chaveNfe = String(body.chaveNfe || "").trim();

    if (!chaveNfe) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Informe a chave de acesso da NF-e (44 dígitos)." },
        { status: 400 }
      );
    }

    const resultado = await consultarErpNfe(chaveNfe);
    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error("POST /api/wms/recebimento/erp-consultar erro:", err);
    return NextResponse.json(
      { sucesso: false, mensagem: err.message || "Erro na integração com o ERP" },
      { status: 500 }
    );
  }
}
