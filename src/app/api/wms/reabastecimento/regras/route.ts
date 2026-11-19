import { NextRequest, NextResponse } from "next/server";
import { getRegrasReposicao, saveRegraReposicao } from "@/lib/serverReabastecimento";

export async function GET() {
  try {
    const regras = await getRegrasReposicao();
    return NextResponse.json({ success: true, count: regras.length, regras });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao consultar regras de reposição." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.cod_produto || !body.endereco_picking || !body.endereco_pulmao) {
      return NextResponse.json(
        { success: false, error: "Código do produto, endereço de picking e pulmão são obrigatórios." },
        { status: 400 }
      );
    }
    const salva = await saveRegraReposicao(body);
    return NextResponse.json({ success: true, regra: salva });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao salvar regra de reposição." },
      { status: 500 }
    );
  }
}
