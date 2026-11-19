import { NextResponse } from "next/server";
import { getProdutividadePicking, getIndicadoresPicking } from "@/lib/serverPicking";

export async function GET() {
  try {
    const registros = getProdutividadePicking();
    const indicadores = getIndicadoresPicking();
    return NextResponse.json({ success: true, registros, indicadores });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
