import { NextResponse } from "next/server";
import { getDashboardCompleto } from "@/lib/serverDashboard";
import { FiltrosRelatorio } from "@/lib/dashboardTypes";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filtros: FiltrosRelatorio = {
      periodoPredefinido: (searchParams.get("periodo") as any) || undefined,
      dataInicio: searchParams.get("dataInicio") || undefined,
      dataFim: searchParams.get("dataFim") || undefined,
      loja: searchParams.get("loja") || undefined,
      fornecedor: searchParams.get("fornecedor") || undefined,
      produto: searchParams.get("produto") || undefined,
      categoria: searchParams.get("categoria") || undefined,
      operador: searchParams.get("operador") || undefined,
      setor: searchParams.get("setor") || undefined,
      lote: searchParams.get("lote") || undefined,
      notaFiscal: searchParams.get("notaFiscal") || undefined,
      transportadora: searchParams.get("transportadora") || undefined,
    };

    const dashboard = getDashboardCompleto(filtros);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (err: any) {
    console.error("Erro na rota GET /api/dashboard:", err);
    return NextResponse.json(
      { success: false, error: "Falha ao compilar métricas do Dashboard." },
      { status: 500 }
    );
  }
}
