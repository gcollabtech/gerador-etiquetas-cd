// src/lib/wmsInventarioService.ts
// Serviço client-side para o MÓDULO 08 — INVENTÁRIO

import {
  PlanoInventario,
  IndicadoresInventario,
  TipoInventario,
  ModoContagem,
  PLANOS_INVENTARIO_SEED,
} from "./wmsInventarioTypes";

export async function fetchPlanosEIndicadores(): Promise<{
  planos: PlanoInventario[];
  indicadores: IndicadoresInventario;
}> {
  try {
    const res = await fetch(`/api/wms/inventario?t=${Date.now()}`);
    if (!res.ok) throw new Error("Falha ao carregar inventários.");
    const data = await res.json();
    return {
      planos: data.planos || PLANOS_INVENTARIO_SEED,
      indicadores: data.indicadores || {
        acuracidadeGeralPct: 98.4,
        acuracidadePorSetor: {
          portaPaletes: 99.1,
          flowRack: 97.8,
          pulmao: 98.9,
          picking: 97.4,
        },
        totalItensInventariados: 12,
        totalDivergenciasAtivas: 1,
        valorTotalSobras: 0,
        valorTotalFaltas: 25.0,
        valorLiquidoDiferenca: -25.0,
        totalRecontagensRealizadas: 1,
        planosAtivos: 1,
        taxaAprovacaoAjustesPct: 94.2,
      },
    };
  } catch (err) {
    console.error("fetchPlanosEIndicadores error:", err);
    return {
      planos: PLANOS_INVENTARIO_SEED,
      indicadores: {
        acuracidadeGeralPct: 98.4,
        acuracidadePorSetor: {
          portaPaletes: 99.1,
          flowRack: 97.8,
          pulmao: 98.9,
          picking: 97.4,
        },
        totalItensInventariados: 12,
        totalDivergenciasAtivas: 1,
        valorTotalSobras: 0,
        valorTotalFaltas: 25.0,
        valorLiquidoDiferenca: -25.0,
        totalRecontagensRealizadas: 1,
        planosAtivos: 1,
        taxaAprovacaoAjustesPct: 94.2,
      },
    };
  }
}

export async function criarPlanoInventarioService(
  body: any
): Promise<{ success: boolean; plano?: PlanoInventario; error?: string }> {
  try {
    const res = await fetch("/api/wms/inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao criar plano de inventário.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function registrarContagemService(params: {
  plano_id: string;
  item_id: string;
  quantidade_contada: number;
  lote_contado?: string;
  validade_contada?: string;
  operador_id: string;
  operador_nome: string;
}): Promise<{
  success: boolean;
  mensagem: string;
  divergente: boolean;
  plano?: PlanoInventario;
  error?: string;
}> {
  try {
    const res = await fetch("/api/wms/inventario/contagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao registrar contagem.");
    return data;
  } catch (err: any) {
    return { success: false, mensagem: err.message, divergente: false, error: err.message };
  }
}

export async function solicitarRecontagemService(
  planoId: string,
  novoOperadorNome?: string
): Promise<{ success: boolean; plano?: PlanoInventario; error?: string }> {
  try {
    const res = await fetch("/api/wms/inventario/recontagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plano_id: planoId, novo_operador_nome: novoOperadorNome }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao solicitar recontagem.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submeterAjusteService(
  planoId: string,
  itemId: string,
  justificativa: string
): Promise<{ success: boolean; plano?: PlanoInventario; alcada?: string; error?: string }> {
  try {
    const res = await fetch("/api/wms/inventario/ajustes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submeter", plano_id: planoId, item_id: itemId, justificativa }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao submeter ajuste.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function aprovarAjusteService(
  planoId: string,
  itemId: string,
  aprovadorNome: string
): Promise<{ success: boolean; plano?: PlanoInventario; protocolo_erp?: string; error?: string }> {
  try {
    const res = await fetch("/api/wms/inventario/ajustes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "aprovar", plano_id: planoId, item_id: itemId, aprovador_nome: aprovadorNome }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao aprovar ajuste.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
