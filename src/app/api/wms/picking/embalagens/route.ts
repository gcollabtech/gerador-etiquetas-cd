import { NextResponse } from "next/server";
import {
  getEmbalagensPicking,
  saveEmbalagensPicking,
  calcularCubagemEmbalagens,
} from "@/lib/serverPicking";
import { EmbalagemPicking } from "@/lib/wmsPickingTypes";

export async function GET() {
  try {
    const embalagens = getEmbalagensPicking();
    return NextResponse.json({ success: true, embalagens });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "calcular_cubagem" && body.itens) {
      const calculo = calcularCubagemEmbalagens(body.itens);
      return NextResponse.json({ success: true, calculo });
    }

    if (body.action === "salvar" && body.embalagem) {
      const embalagens = getEmbalagensPicking();
      const embInput: EmbalagemPicking = body.embalagem;

      const idx = embalagens.findIndex((e) => e.id === embInput.id);
      if (idx >= 0) {
        embalagens[idx] = embInput;
      } else {
        embalagens.push({
          ...embInput,
          id: embInput.id || `emb-${Date.now()}`,
        });
      }

      saveEmbalagensPicking(embalagens);
      return NextResponse.json({ success: true, embalagens });
    }

    if (body.action === "toggle_ativa" && body.id) {
      const embalagens = getEmbalagensPicking();
      const emb = embalagens.find((e) => e.id === body.id);
      if (emb) {
        emb.ativa = !emb.ativa;
        saveEmbalagensPicking(embalagens);
      }
      return NextResponse.json({ success: true, embalagens });
    }

    return NextResponse.json({ success: false, error: "Ação não informada ou inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
