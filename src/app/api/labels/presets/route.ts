import { NextRequest, NextResponse } from "next/server";
import {
  getServerPresets,
  saveServerPreset,
  deleteServerPreset,
} from "@/lib/serverLabels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const presets = await getServerPresets();
  return NextResponse.json(
    { success: true, presets },
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
    if (!body.preset) {
      return NextResponse.json(
        { success: false, error: "Nenhum modelo informado." },
        { status: 400 }
      );
    }
    const saved = await saveServerPreset(body.preset);
    return NextResponse.json({ success: true, preset: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao salvar modelo." },
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
        { success: false, error: "ID não fornecido." },
        { status: 400 }
      );
    }
    await deleteServerPreset(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao excluir modelo." },
      { status: 500 }
    );
  }
}
