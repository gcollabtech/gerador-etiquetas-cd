import {
  PedidoSeparacao,
  OndaSeparacao,
  EmbalagemPicking,
  TarefaPicking,
  RegistroProdutividadePicking,
  IndicadoresPickingCD,
  CalculoEmbalagensResult,
  PEDIDOS_SEED,
  ONDAS_SEED,
  EMBALAGENS_PADRAO,
  TAREFAS_SEED,
  PRODUTIVIDADE_SEED,
  EstrategiaPicking,
  PrioridadePedido,
} from "./wmsPickingTypes";

// ── PEDIDOS DE SEPARAÇÃO (ITEM 5.2) ──────────────────────────────────────────

export async function fetchPedidosSeparacao(): Promise<PedidoSeparacao[]> {
  try {
    const res = await fetch("/api/wms/picking/pedidos");
    if (!res.ok) throw new Error("Falha ao buscar pedidos");
    const json = await res.json();
    return json.pedidos || PEDIDOS_SEED;
  } catch {
    return PEDIDOS_SEED;
  }
}

export async function importarPedidosErpService(): Promise<{ success: boolean; importados: number; total: number }> {
  try {
    const res = await fetch("/api/wms/picking/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "importar_erp" }),
    });
    if (!res.ok) throw new Error("Erro na integração ERP");
    return await res.json();
  } catch (err: any) {
    return { success: false, importados: 0, total: 0 };
  }
}

// ── EMBALAGENS E CUBAGEM (ITEM 5.5) ─────────────────────────────────────────

export async function fetchEmbalagensPicking(): Promise<EmbalagemPicking[]> {
  try {
    const res = await fetch("/api/wms/picking/embalagens");
    if (!res.ok) throw new Error("Falha ao buscar embalagens");
    const json = await res.json();
    return json.embalagens || EMBALAGENS_PADRAO;
  } catch {
    return EMBALAGENS_PADRAO;
  }
}

export async function calcularCubagemService(
  itens: Array<{ cod_produto: string; quantidade: number; cubagem_m3?: number; peso_kg?: number }>
): Promise<CalculoEmbalagensResult | null> {
  try {
    const res = await fetch("/api/wms/picking/embalagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "calcular_cubagem", itens }),
    });
    if (!res.ok) throw new Error("Erro no cálculo de cubagem");
    const json = await res.json();
    return json.calculo;
  } catch {
    return null;
  }
}

export async function salvarEmbalagemService(emb: Partial<EmbalagemPicking>): Promise<boolean> {
  try {
    const res = await fetch("/api/wms/picking/embalagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "salvar", embalagem: emb }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── FORMAÇÃO DE ONDAS (ITENS 5.3 & 5.4) ─────────────────────────────────────

export async function fetchOndasSeparacao(): Promise<OndaSeparacao[]> {
  try {
    const res = await fetch("/api/wms/picking/ondas");
    if (!res.ok) throw new Error("Falha ao buscar ondas");
    const json = await res.json();
    return json.ondas || ONDAS_SEED;
  } catch {
    return ONDAS_SEED;
  }
}

export async function criarOndaService(dados: {
  nome: string;
  modo: "fixo" | "flexivel";
  estrategia: EstrategiaPicking;
  pedidos_ids: string[];
  horario_corte?: string;
  prioridade?: PrioridadePedido;
  criado_por?: string;
}): Promise<{ success: boolean; onda?: OndaSeparacao; tarefasGeradas?: number; error?: string }> {
  try {
    const res = await fetch("/api/wms/picking/ondas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao criar onda" };
  }
}

// ── TAREFAS DE SEPARAÇÃO (ITEM 5.5) ─────────────────────────────────────────

export async function fetchTarefasPicking(): Promise<TarefaPicking[]> {
  try {
    const res = await fetch("/api/wms/picking/tarefas");
    if (!res.ok) throw new Error("Falha ao buscar tarefas");
    const json = await res.json();
    return json.tarefas || TAREFAS_SEED;
  } catch {
    return TAREFAS_SEED;
  }
}

export async function alocarTarefaOperadorService(
  tarefaId: string,
  operadorId: string,
  operadorNome: string
): Promise<{ success: boolean; tarefa?: TarefaPicking; error?: string }> {
  try {
    const res = await fetch("/api/wms/picking/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "alocar",
        tarefa_id: tarefaId,
        operador_id: operadorId,
        operador_nome: operadorNome,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function executarBipagemSeparacaoService(input: {
  tarefa_id: string;
  item_id: string;
  endereco_bipado: string;
  produto_bipado: string;
  quantidade_informada: number;
  lote_bipado?: string;
  validade_bipada?: string;
}): Promise<{
  success: boolean;
  bloqueado: boolean;
  motivo_bloqueio?: string;
  tarefa?: TarefaPicking;
}> {
  try {
    const res = await fetch("/api/wms/picking/coletor-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      bloqueado: true,
      motivo_bloqueio: "Falha de conexão com o coletor. Tente novamente.",
    };
  }
}

export async function finalizarTarefaPickingService(
  tarefaId: string,
  volumesEmbalagens?: number,
  embalagemId?: string,
  observacoes?: string
): Promise<{ success: boolean; tarefa?: TarefaPicking; error?: string }> {
  try {
    const res = await fetch("/api/wms/picking/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "finalizar",
        tarefa_id: tarefaId,
        volumes_embalagens_utilizados: volumesEmbalagens,
        embalagem_id: embalagemId,
        observacoes,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── PRODUTIVIDADE & INDICADORES (ITEM 5.6) ──────────────────────────────────

export async function fetchProdutividadePicking(): Promise<{
  registros: RegistroProdutividadePicking[];
  indicadores: IndicadoresPickingCD;
}> {
  try {
    const res = await fetch("/api/wms/picking/produtividade");
    if (!res.ok) throw new Error("Falha ao buscar indicadores de picking");
    const json = await res.json();
    return {
      registros: json.registros || PRODUTIVIDADE_SEED,
      indicadores: json.indicadores,
    };
  } catch {
    return {
      registros: PRODUTIVIDADE_SEED,
      indicadores: {
        total_pedidos_hoje: 4,
        pedidos_pendentes: 2,
        pedidos_em_separacao: 1,
        pedidos_concluidos: 1,
        taxa_atendimento_pct: 25,
        ondas_ativas: 1,
        total_tarefas_abertas: 2,
        produtividade_media_itens_hora: 145,
        produtividade_media_linhas_hora: 9.5,
        tempo_medio_separacao_minutos: 38,
        divergencias_hoje: 1,
        operadores_ativos: 2,
      },
    };
  }
}
