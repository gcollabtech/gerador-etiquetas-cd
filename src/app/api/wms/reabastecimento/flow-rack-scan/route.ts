import { NextRequest, NextResponse } from "next/server";
import { consultarFlowRackPorBipagem } from "@/lib/serverReabastecimento";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.endereco) {
      return NextResponse.json(
        { success: false, error: "Endereço do Flow Rack é obrigatório." },
        { status: 400 }
      );
    }

    const info = await consultarFlowRackPorBipagem(body.endereco);
    if (!info) {
      return NextResponse.json(
        {
          success: false,
          error: `Endereço [${body.endereco}] não possui regra de Flow Rack ou SKU fixo vinculado.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, info });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao consultar Flow Rack por bipagem." },
      { status: 500 }
    );
  }
}
