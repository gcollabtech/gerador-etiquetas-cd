import { NextResponse } from "next/server";
import { getOndasSeparacao, criarOndaSeparacao } from "@/lib/serverPicking";

export async function GET() {
  try {
    const ondas = getOndasSeparacao();
    return NextResponse.json({ success: true, ondas });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = criarOndaSeparacao(body);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
