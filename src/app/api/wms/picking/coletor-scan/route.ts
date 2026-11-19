import { NextResponse } from "next/server";
import { executarBipagemSeparacao } from "@/lib/serverPicking";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = executarBipagemSeparacao(body);

    if (res.bloqueado) {
      return NextResponse.json(res, { status: 422 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, bloqueado: true, motivo_bloqueio: err.message },
      { status: 500 }
    );
  }
}
