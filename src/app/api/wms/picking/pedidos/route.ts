import { NextResponse } from "next/server";
import { getPedidosSeparacao, importarPedidosErp, savePedidosSeparacao } from "@/lib/serverPicking";
import { PedidoSeparacao } from "@/lib/wmsPickingTypes";

export async function GET() {
  try {
    const pedidos = getPedidosSeparacao();
    return NextResponse.json({ success: true, pedidos });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "importar_erp") {
      const res = importarPedidosErp();
      return NextResponse.json(res);
    }

    if (body.action === "criar_manual" && body.pedido) {
      const pedidos = getPedidosSeparacao();
      const novoPedido: PedidoSeparacao = {
        ...body.pedido,
        id: `ped-${Date.now()}`,
        status: "pendente",
        data_emissao: new Date().toISOString().split("T")[0],
      };
      pedidos.unshift(novoPedido);
      savePedidosSeparacao(pedidos);
      return NextResponse.json({ success: true, pedido: novoPedido });
    }

    return NextResponse.json({ success: false, error: "Ação não informada ou inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
