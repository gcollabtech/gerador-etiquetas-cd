import {
  RegraReposicao,
  TarefaReabastecimento,
  FlowRackInfoConsulta,
} from "./wmsReabastecimentoTypes";

export async function fetchRegrasReposicaoApi(): Promise<RegraReposicao[]> {
  try {
    const res = await fetch("/api/wms/reabastecimento/regras");
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.regras)) {
        return data.regras;
      }
    }
  } catch (err) {
    console.error("[wmsReabastecimentoService] Erro ao buscar regras de reposição:", err);
  }
  return [];
}

export async function salvarRegraReposicaoApi(
  regra: Partial<RegraReposicao>
): Promise<{ success: boolean; regra?: RegraReposicao; error?: string }> {
  try {
    const res = await fetch("/api/wms/reabastecimento/regras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regra),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao salvar regra." };
  }
}

export async function fetchTarefasReabastecimentoApi(filtros?: {
  status?: string;
  prioridade?: string;
}): Promise<TarefaReabastecimento[]> {
  try {
    const params = new URLSearchParams();
    if (filtros?.status) params.set("status", filtros.status);
    if (filtros?.prioridade) params.set("prioridade", filtros.prioridade);

    const res = await fetch(`/api/wms/reabastecimento/tarefas?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tarefas)) {
        return data.tarefas;
      }
    }
  } catch (err) {
    console.error("[wmsReabastecimentoService] Erro ao buscar tarefas:", err);
  }
  return [];
}

export async function dispararVerificacaoAutomaticaApi(): Promise<{
  success: boolean;
  totalGeradas?: number;
  tarefas?: TarefaReabastecimento[];
  error?: string;
}> {
  try {
    const res = await fetch("/api/wms/reabastecimento/gerar-automatico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao disparar verificação automática." };
  }
}

export async function alocarOperadorApi(
  tarefaId: string,
  operadorNome: string,
  supervisorNome?: string
): Promise<{ success: boolean; tarefa?: TarefaReabastecimento; error?: string }> {
  try {
    const res = await fetch("/api/wms/reabastecimento/tarefas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "alocar", tarefaId, operadorNome, supervisorNome }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao alocar operador." };
  }
}

export async function cancelarTarefaApi(
  tarefaId: string,
  motivo: string,
  supervisorNome?: string
): Promise<{ success: boolean; tarefa?: TarefaReabastecimento; error?: string }> {
  try {
    const res = await fetch("/api/wms/reabastecimento/tarefas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancelar", tarefaId, motivo, supervisorNome }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao cancelar tarefa." };
  }
}

export async function consultarFlowRackPorBipagemApi(
  endereco: string
): Promise<{ success: boolean; info?: FlowRackInfoConsulta; error?: string }> {
  try {
    const res = await fetch("/api/wms/reabastecimento/flow-rack-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endereco }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao consultar Flow Rack." };
  }
}

export async function executarPassoColetorApi(params: {
  tarefaId: string;
  passo: "bipar_origem" | "bipar_produto" | "informar_qtd" | "bipar_destino" | "concluir";
  valorBipado?: string;
  quantidadeInformada?: number;
  operadorNome: string;
  divergenciaMotivo?: string;
}): Promise<{ success: boolean; tarefa?: TarefaReabastecimento; error?: string }> {
  try {
    const res = await fetch("/api/wms/reabastecimento/executar-coletor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao comunicar com coletor." };
  }
}
