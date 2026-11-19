// src/lib/wmsExpedicaoService.ts
// Serviço client-side para o MÓDULO 07 — EXPEDIÇÃO

import {
  CargaExpedicao,
  DocaExpedicao,
  IndicadoresExpedicao,
  CARGAS_EXPEDICAO_SEED,
  DOCAS_EXPEDICAO_SEED,
} from "./wmsExpedicaoTypes";

export async function fetchCargasEDocas(): Promise<{
  cargas: CargaExpedicao[];
  docas: DocaExpedicao[];
  indicadores: IndicadoresExpedicao;
}> {
  try {
    const [resCargas, resDocas] = await Promise.all([
      fetch(`/api/wms/expedicao/cargas?t=${Date.now()}`),
      fetch(`/api/wms/expedicao/docas?t=${Date.now()}`),
    ]);

    const dataCargas = resCargas.ok ? await resCargas.json() : null;
    const dataDocas = resDocas.ok ? await resDocas.json() : null;

    return {
      cargas: dataCargas?.cargas || CARGAS_EXPEDICAO_SEED,
      docas: dataDocas?.docas || DOCAS_EXPEDICAO_SEED,
      indicadores: dataCargas?.indicadores || {
        totalAguardandoCarga: 1,
        totalEmCarregamento: 1,
        totalCarregamentoConcluido: 0,
        totalAguardandoLiberacao: 0,
        totalExpedido: 0,
        totalEmTransito: 1,
        totalEntregue: 0,
        totalOcorrencias: 0,
        totalGeralCargas: 3,
        taxaOcupacaoDocasPct: 40,
        tempoMedioCarregamentoMin: 35,
      },
    };
  } catch (err) {
    console.error("fetchCargasEDocas error:", err);
    return {
      cargas: CARGAS_EXPEDICAO_SEED,
      docas: DOCAS_EXPEDICAO_SEED,
      indicadores: {
        totalAguardandoCarga: 1,
        totalEmCarregamento: 1,
        totalCarregamentoConcluido: 0,
        totalAguardandoLiberacao: 0,
        totalExpedido: 0,
        totalEmTransito: 1,
        totalEntregue: 0,
        totalOcorrencias: 0,
        totalGeralCargas: 3,
        taxaOcupacaoDocasPct: 40,
        tempoMedioCarregamentoMin: 35,
      },
    };
  }
}

export async function criarCargaExpedicaoService(
  body: any
): Promise<{ success: boolean; carga?: CargaExpedicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/expedicao/cargas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao criar carga.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function alocarDocaService(
  cargaId: string,
  docaId: string,
  horarioPrevisto: string
): Promise<{ success: boolean; carga?: CargaExpedicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/expedicao/docas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carga_id: cargaId, doca_id: docaId, horario_previsto: horarioPrevisto }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao alocar doca.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function iniciarCarregamentoService(
  cargaId: string
): Promise<{ success: boolean; carga?: CargaExpedicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/expedicao/carregamento-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "iniciar", carga_id: cargaId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao iniciar carregamento.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executarBipagemCarregamentoService(
  cargaId: string,
  codigoLido: string,
  operadorNome: string
): Promise<{
  success: boolean;
  bloqueado?: boolean;
  concluido?: boolean;
  mensagem: string;
  carga?: CargaExpedicao;
  error?: string;
}> {
  try {
    const res = await fetch("/api/wms/expedicao/carregamento-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carga_id: cargaId,
        codigo_lido: codigoLido,
        operador_nome: operadorNome,
      }),
    });
    const data = await res.json();
    if (res.status === 422) {
      return { success: false, bloqueado: true, mensagem: data.mensagem || "Volume bloqueado!", carga: data.carga };
    }
    if (!res.ok) throw new Error(data.error || "Erro na bipagem de carregamento.");
    return data;
  } catch (err: any) {
    return { success: false, mensagem: err.message, error: err.message };
  }
}

export async function finalizarExpedicaoComAssinaturaService(params: {
  carga_id: string;
  motorista_nome: string;
  motorista_cpf: string;
  motorista_cnh?: string;
  assinatura_base64: string;
  operador_nome: string;
}): Promise<{ success: boolean; carga?: CargaExpedicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/expedicao/finalizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao finalizar expedição.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function registrarSaidaVeiculoService(
  cargaId: string
): Promise<{ success: boolean; carga?: CargaExpedicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/expedicao/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saida_portaria", carga_id: cargaId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao registrar saída de veículo.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function atualizarStatusEntregaService(
  cargaId: string,
  tipo: "confirmar_entrega" | "ocorrencia_entrega",
  motivo?: string,
  operador?: string
): Promise<{ success: boolean; carga?: CargaExpedicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/expedicao/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: tipo,
        carga_id: cargaId,
        motivo_ocorrencia: motivo,
        operador,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao atualizar entrega.");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
