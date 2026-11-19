// src/app/api/wms/inventario/ajustes/route.ts
import { NextResponse } from "next/server";
import { submeterAjusteInventario, aprovarAjusteEIntegrarErp } from "@/lib/serverInventario";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, plano_id, item_id, justificativa, aprovador_nome } = body;

    if (!plano_id || !item_id) {
      return NextResponse.json({ error: "plano_id e item_id são obrigatórios." }, { status: 400 });
    }

    if (action === "submeter") {
      const res = submeterAjusteInventario(plano_id, item_id, justificativa);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === "aprovar") {
      const res = aprovarAjusteEIntegrarErp(plano_id, item_id, aprovador_nome || "Supervisor WMS");
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Ação não informada ou inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no fluxo de ajustes de inventário." }, { status: 500 });
  }
}
