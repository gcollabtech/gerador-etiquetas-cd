import {
  RecebimentoNfe,
  RecebimentoItem,
  DivergenciaRegistro,
  DivergenciaTipo,
  ErpNfeInfo,
  NfStatus,
} from "./wmsRecebimentoTypes";

export async function fetchRecebimentosApi(filters?: {
  status?: string;
  search?: string;
}): Promise<RecebimentoNfe[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "todos") params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);

  const res = await fetch(`/api/wms/recebimento?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Erro ao consultar recebimentos: status ${res.status}`);
  }
  const json = await res.json();
  return json.recebimentos || [];
}

export async function consultarErpNfeApi(chaveNfe: string): Promise<{
  sucesso: boolean;
  mensagem: string;
  nfe?: ErpNfeInfo;
  bloqueio?: boolean;
  motivo_bloqueio?: string;
  codigo_erro?: string;
}> {
  const res = await fetch("/api/wms/recebimento/erp-consultar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chaveNfe }),
  });

  const json = await res.json();
  return json;
}

export async function salvarRecebimentoApi(rec: RecebimentoNfe): Promise<RecebimentoNfe> {
  const res = await fetch("/api/wms/recebimento", {
    method: rec.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rec),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao salvar recebimento: status ${res.status}`);
  }

  const json = await res.json();
  return json.recebimento;
}

export async function finalizarRecebimentoApi(
  id: string,
  params?: { supervisorNome?: string; observacoes?: string }
): Promise<{ sucesso: boolean; recebimento: RecebimentoNfe; protocoloErp: string }> {
  const res = await fetch("/api/wms/recebimento/finalizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...params }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao finalizar recebimento: status ${res.status}`);
  }

  return await res.json();
}

/**
 * Aplica lógica de bipagem / conferência física de um item:
 * 1. Se bipar Código da Caixa Master: aplica o Fator de Conversão por unidades!
 * 2. Se bipar EAN: contabiliza unidade individual.
 * 3. Se bipar SKU ou Digitação manual: contabiliza quantidade solicitada.
 */
export function processarBipagemItem(
  itens: RecebimentoItem[],
  codigoLido: string,
  options?: {
    modoForcado?: "caixa_master" | "ean" | "sku" | "manual";
    quantidadeManual?: number;
    lote?: string;
    validade?: string;
  }
): {
  itensAtualizados: RecebimentoItem[];
  itemEncontrado?: RecebimentoItem;
  unidadesAdicionadas: number;
  mensagem: string;
} {
  const cleanCode = codigoLido.trim().toUpperCase();
  const cleanDigits = codigoLido.replace(/\D/g, "");

  // Localiza o item correspondente por Caixa Master, EAN ou Código de Produto
  let matchedIndex = -1;
  let tipoDetectado: "caixa_master" | "ean" | "sku" = "ean";

  for (let i = 0; i < itens.length; i++) {
    const it = itens[i]!;
    // 1. Match por código da caixa master
    if (it.codigo_caixa_master && (it.codigo_caixa_master === cleanCode || it.codigo_caixa_master === cleanDigits)) {
      matchedIndex = i;
      tipoDetectado = "caixa_master";
      break;
    }
    // 2. Match por EAN
    if (it.ean && (it.ean === cleanDigits || it.ean === cleanCode)) {
      matchedIndex = i;
      tipoDetectado = "ean";
      break;
    }
    // 3. Match por SKU interno
    if (it.cod_produto.toUpperCase() === cleanCode) {
      matchedIndex = i;
      tipoDetectado = "sku";
      break;
    }
  }

  if (matchedIndex === -1) {
    return {
      itensAtualizados: itens,
      unidadesAdicionadas: 0,
      mensagem: `Código "${codigoLido}" não pertence a nenhum produto desta Nota Fiscal.`,
    };
  }

  const item = itens[matchedIndex]!;
  let unidadesToAdd = 1;
  let caixasToAdd = 0;

  if (options?.modoForcado === "caixa_master" || (options?.modoForcado === undefined && tipoDetectado === "caixa_master")) {
    const fator = item.fator_conversao > 0 ? item.fator_conversao : 1;
    unidadesToAdd = fator * (options?.quantidadeManual || 1);
    caixasToAdd = options?.quantidadeManual || 1;
  } else if (options?.quantidadeManual) {
    unidadesToAdd = Math.max(1, options.quantidadeManual);
  }

  const novaQtdConferida = item.qtd_conferida + unidadesToAdd;
  const novasCaixas = (item.qtd_caixas_recebidas || 0) + caixasToAdd;

  let novoStatus: "pendente" | "conferido_ok" | "divergente" | "parcial" = "parcial";
  if (novaQtdConferida === item.qtd_nota) {
    novoStatus = "conferido_ok";
  } else if (novaQtdConferida > item.qtd_nota) {
    novoStatus = "divergente";
  }

  const itemAtualizado: RecebimentoItem = {
    ...item,
    qtd_conferida: novaQtdConferida,
    qtd_caixas_recebidas: novasCaixas,
    lote: options?.lote || item.lote,
    data_validade: options?.validade || item.data_validade,
    status_conferencia: novoStatus,
    tipo_leitura: options?.modoForcado || tipoDetectado,
  };

  const novosItens = [...itens];
  novosItens[matchedIndex] = itemAtualizado;

  const msgFator = tipoDetectado === "caixa_master" ? ` (Fator ${item.fator_conversao}x: +${unidadesToAdd} un)` : "";

  return {
    itensAtualizados: novosItens,
    itemEncontrado: itemAtualizado,
    unidadesAdicionadas: unidadesToAdd,
    mensagem: `Item "${item.descricao}" bipado com sucesso! Total: ${novaQtdConferida} de ${item.qtd_nota} un${msgFator}.`,
  };
}
