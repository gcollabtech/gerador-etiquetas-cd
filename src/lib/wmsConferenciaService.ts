// src/lib/wmsConferenciaService.ts
// Serviço client-side para comunicação com as rotas do Módulo 06 — Conferência

import {
  RegistroConferencia,
  IndicadoresConferencia,
  TipoConferencia,
  TipoDivergenciaConferencia,
  CONFERENCIAS_SEED,
} from "./wmsConferenciaTypes";

export async function fetchConferencias(): Promise<{
  conferencias: RegistroConferencia[];
  indicadores: IndicadoresConferencia;
}> {
  try {
    const res = await fetch(`/api/wms/conferencia?t=${Date.now()}`);
    if (!res.ok) throw new Error("Falha ao carregar conferências.");
    const data = await res.json();
    return {
      conferencias: data.conferencias || CONFERENCIAS_SEED,
      indicadores: data.indicadores || {
        totalAguardando: 1,
        totalEmConferencia: 1,
        totalDivergencias: 1,
        totalAguardandoCorrecao: 0,
        totalRecontagem: 0,
        totalConferido: 1,
        totalLiberado: 1,
        totalGeral: 5,
        acuracidadePct: 92.5,
        tempoMedioConferenciaMin: 22,
      },
    };
  } catch (err) {
    console.error("fetchConferencias error:", err);
    return {
      conferencias: CONFERENCIAS_SEED,
      indicadores: {
        totalAguardando: 1,
        totalEmConferencia: 1,
        totalDivergencias: 1,
        totalAguardandoCorrecao: 0,
        totalRecontagem: 0,
        totalConferido: 1,
        totalLiberado: 1,
        totalGeral: 5,
        acuracidadePct: 92.5,
        tempoMedioConferenciaMin: 22,
      },
    };
  }
}

export async function iniciarConferenciaService(
  id: string,
  operadorId: string,
  operadorNome: string,
  tipo: TipoConferencia
): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "iniciar", id, operador_id: operadorId, operador_nome: operadorNome, tipo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao iniciar conferência.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executarBipagemService(params: {
  conferencia_id: string;
  codigo_lido: string;
  lote_lido?: string;
  validade_lida?: string;
  volume_id?: string;
  quantidade_bipada?: number;
  operador_nome: string;
}): Promise<{
  success: boolean;
  bloqueado?: boolean;
  mensagem: string;
  item_id?: string;
  conferencia?: RegistroConferencia;
  error?: string;
}> {
  try {
    const res = await fetch("/api/wms/conferencia/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (res.status === 422) {
      return { success: false, bloqueado: true, mensagem: data.mensagem || "Divergência detectada!", conferencia: data.conferencia };
    }
    if (!res.ok) throw new Error(data.error || "Erro ao processar bipagem.");
    return data;
  } catch (err: any) {
    return { success: false, mensagem: err.message, error: err.message };
  }
}

export async function registrarDivergenciaManualService(params: {
  conferencia_id: string;
  item_id: string;
  tipo: TipoDivergenciaConferencia;
  motivo: string;
  operador_nome: string;
  foto_url?: string;
}): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "divergencia_manual", ...params }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao registrar divergência.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function enviarDivergenciaParaAnaliseService(
  conferencia_id: string,
  divergencia_id: string,
  resolucao: "corrigido" | "retornado_estoque"
): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analise_quarentena", conferencia_id, divergencia_id, resolucao }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao enviar divergência para análise.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function solicitarRecontagemService(
  conferencia_id: string,
  novoOperadorId: string,
  novoOperadorNome: string,
  motivo?: string
): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia/recontagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conferencia_id,
        novo_operador_id: novoOperadorId,
        novo_operador_nome: novoOperadorNome,
        motivo,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao solicitar recontagem.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function finalizarConferenciaService(
  conferencia_id: string,
  usuarioNome: string
): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia/finalizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conferencia_id, usuario_nome: usuarioNome }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao finalizar conferência.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function liberarParaExpedicaoService(
  conferencia_id: string
): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "liberar_expedicao", conferencia_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao liberar para expedição.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function gerarEtiquetasVolumesService(
  conferencia_id: string
): Promise<{ success: boolean; conferencia?: RegistroConferencia; total_volumes?: number; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia/volumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gerar_etiquetas", conferencia_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao gerar etiquetas de volumes.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function gerarRomaneioService(
  conferencia_id: string
): Promise<{ success: boolean; conferencia?: RegistroConferencia; error?: string }> {
  try {
    const res = await fetch("/api/wms/conferencia/volumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gerar_romaneio", conferencia_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao gerar romaneio de conferência.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
