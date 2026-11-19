// src/app/api/wms/conferencia/volumes/route.ts
import { NextResponse } from "next/server";
import { gerarRomaneioConferencia, gerarEtiquetasVolumes } from "@/lib/serverConferencia";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, conferencia_id } = body;

    if (!conferencia_id) {
      return NextResponse.json({ error: "conferencia_id é obrigatório." }, { status: 400 });
    }

    if (action === "gerar_etiquetas") {
      const res = gerarEtiquetasVolumes(conferencia_id);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "gerar_romaneio") {
      const res = gerarRomaneioConferencia(conferencia_id);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao processar volumes/romaneio." }, { status: 500 });
  }
}
