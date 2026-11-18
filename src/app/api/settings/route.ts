import { NextRequest, NextResponse } from "next/server";
import { getServerSettings, saveServerSettings } from "@/lib/serverSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const settings = await getServerSettings();
  return NextResponse.json(
    { success: true, settings },
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
    if (!body.settings) {
      return NextResponse.json(
        { success: false, error: "Nenhum parâmetro de configuração informado." },
        { status: 400 }
      );
    }
    const updated = await saveServerSettings(body.settings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao salvar configurações." },
      { status: 500 }
    );
  }
}
