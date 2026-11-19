import { NextRequest, NextResponse } from "next/server";
import { getRecebimentos, saveRecebimento } from "@/lib/serverRecebimento";
import { RecebimentoNfe } from "@/lib/wmsRecebimentoTypes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const doca = searchParams.get("doca") || undefined;

    const list = await getRecebimentos({ status, search, doca });
    return NextResponse.json({
      sucesso: true,
      total: list.length,
      recebimentos: list,
    });
  } catch (err: any) {
    console.error("GET /api/wms/recebimento erro:", err);
    return NextResponse.json(
      { sucesso: false, error: err.message || "Erro ao consultar recebimentos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: RecebimentoNfe = await req.json();

    if (!body.chave_nfe || !body.numero_nfe || !body.fornecedor_nome) {
      return NextResponse.json(
        { sucesso: false, error: "Dados obrigatórios da NF-e ausentes (chave, número, fornecedor)." },
        { status: 400 }
      );
    }

    const saved = await saveRecebimento(body);
    return NextResponse.json({
      sucesso: true,
      recebimento: saved,
      mensagem: "Recebimento iniciado e gravado com sucesso!",
    });
  } catch (err: any) {
    console.error("POST /api/wms/recebimento erro:", err);
    return NextResponse.json(
      { sucesso: false, error: err.message || "Erro ao gravar recebimento" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body: RecebimentoNfe = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { sucesso: false, error: "ID do recebimento é obrigatório para atualização." },
        { status: 400 }
      );
    }

    const saved = await saveRecebimento(body);
    return NextResponse.json({
      sucesso: true,
      recebimento: saved,
      mensagem: "Conferência de recebimento atualizada com sucesso!",
    });
  } catch (err: any) {
    console.error("PUT /api/wms/recebimento erro:", err);
    return NextResponse.json(
      { sucesso: false, error: err.message || "Erro ao atualizar recebimento" },
      { status: 500 }
    );
  }
}
