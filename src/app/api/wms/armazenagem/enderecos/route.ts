import { NextRequest, NextResponse } from "next/server";
import {
  getEnderecos,
  saveEndereco,
  gerarLayoutEmMassa,
  bloquearEndereco,
  desbloquearEndereco,
} from "@/lib/serverArmazenagem";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rua = searchParams.get("rua");
    const setor = searchParams.get("setor");
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");

    let lista = await getEnderecos();

    if (rua && rua !== "todas") {
      lista = lista.filter((e) => e.rua === rua);
    }
    if (setor && setor !== "todos") {
      lista = lista.filter((e) => e.setor === setor);
    }
    if (tipo && tipo !== "todos") {
      lista = lista.filter((e) => e.tipo === tipo);
    }
    if (status && status !== "todos") {
      lista = lista.filter((e) => e.status === status);
    }

    return NextResponse.json({ success: true, count: lista.length, enderecos: lista });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao consultar endereços." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Se for geração de layout em massa
    if (body.action === "gerar_em_massa") {
      const res = await gerarLayoutEmMassa({
        setor: body.setor || "A",
        ruaInicio: Number(body.ruaInicio) || 1,
        ruaFim: Number(body.ruaFim) || 3,
        predioInicio: Number(body.predioInicio) || 1,
        predioFim: Number(body.predioFim) || 4,
        niveis: Array.isArray(body.niveis) ? body.niveis : [1, 2, 3, 4],
        posicoesPorNivel: Array.isArray(body.posicoesPorNivel) ? body.posicoesPorNivel : [1, 2],
        tipoPadrao: body.tipoPadrao || "porta_paletes",
        pesoMaximoKg: Number(body.pesoMaximoKg) || 1200,
        volumeMaximoM3: Number(body.volumeMaximoM3) || 2.4,
      });
      return NextResponse.json({ success: true, ...res });
    }

    // Cadastro individual
    const salvo = await saveEndereco(body);
    return NextResponse.json({ success: true, endereco: salvo });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao salvar endereço." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "bloquear") {
      const res = await bloquearEndereco(
        body.codigo,
        body.motivo || "Bloqueio operacional",
        body.operadorNome || "Supervisor WMS"
      );
      return NextResponse.json(res);
    }

    if (body.action === "desbloquear") {
      const res = await desbloquearEndereco(
        body.codigo,
        body.operadorNome || "Supervisor WMS"
      );
      return NextResponse.json(res);
    }

    const salvo = await saveEndereco(body);
    return NextResponse.json({ success: true, endereco: salvo });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao atualizar endereço." },
      { status: 500 }
    );
  }
}
