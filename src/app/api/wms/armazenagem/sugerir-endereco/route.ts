import { NextRequest, NextResponse } from "next/server";
import { sugerirMelhorEndereco } from "@/lib/serverArmazenagem";
import { SugestaoSlottingInput } from "@/lib/wmsArmazenagemTypes";

export async function POST(req: NextRequest) {
  try {
    const body: SugestaoSlottingInput = await req.json();
    if (!body.cod_produto) {
      return NextResponse.json(
        { success: false, error: "Código do produto é obrigatório." },
        { status: 400 }
      );
    }

    const sugestoes = await sugerirMelhorEndereco({
      cod_produto: body.cod_produto,
      descricao: body.descricao || body.cod_produto,
      categoria: body.categoria || "Geral",
      curva_abc: body.curva_abc || "A",
      quantidade: Number(body.quantidade) || 1,
      peso_total_kg: Number(body.peso_total_kg) || 10,
      volume_total_m3: Number(body.volume_total_m3) || 0.1,
      dimensoes: body.dimensoes,
      lote: body.lote,
      data_validade: body.data_validade,
      exige_refrigeracao: Boolean(body.exige_refrigeracao),
      inflamavel_quimico: Boolean(body.inflamavel_quimico),
    });

    return NextResponse.json({ success: true, count: sugestoes.length, sugestoes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao calcular sugestão de slotting." },
      { status: 500 }
    );
  }
}
