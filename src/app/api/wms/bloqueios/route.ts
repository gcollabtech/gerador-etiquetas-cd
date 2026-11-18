import { NextRequest, NextResponse } from "next/server";
import {
  getServerBloqueios,
  saveOrUpdateServerBloqueio,
  deleteServerBloqueio,
} from "@/lib/serverWms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const bloqueios = await getServerBloqueios();
  return NextResponse.json(
    { success: true, bloqueios },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.bloqueio) {
      return NextResponse.json(
        { success: false, error: "Nenhum bloqueio informado." },
        { status: 400 }
      );
    }
    const saved = await saveOrUpdateServerBloqueio(body.bloqueio);
    return NextResponse.json({ success: true, bloqueio: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao salvar bloqueio." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID não informado." },
        { status: 400 }
      );
    }
    await deleteServerBloqueio(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao excluir bloqueio." },
      { status: 500 }
    );
  }
}
