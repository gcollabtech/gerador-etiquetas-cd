// src/lib/serverConferencia.ts
// Lógica de persistência e regras de negócio para o Módulo 06 — Conferência

import fs from "fs";
import path from "path";
import {
  RegistroConferencia,
  StatusConferencia,
  TipoConferencia,
  TipoDivergenciaConferencia,
  IndicadoresConferencia,
  CONFERENCIAS_SEED,
  DivergenciaHistorico,
} from "./wmsConferenciaTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFERENCIAS_FILE = path.join(DATA_DIR, "wms_conferencias.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── LEITURA E GRAVAÇÃO ──────────────────────────────────────────────────────

export function getConferencias(): RegistroConferencia[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(CONFERENCIAS_FILE)) {
      fs.writeFileSync(CONFERENCIAS_FILE, JSON.stringify(CONFERENCIAS_SEED, null, 2), "utf8");
      return CONFERENCIAS_SEED;
    }
    const data = fs.readFileSync(CONFERENCIAS_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : CONFERENCIAS_SEED;
  } catch (err) {
    console.error("Erro ao ler wms_conferencias.json:", err);
    return CONFERENCIAS_SEED;
  }
}

export function saveConferencias(conferencias: RegistroConferencia[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(CONFERENCIAS_FILE, JSON.stringify(conferencias, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar wms_conferencias.json:", err);
  }
}

export function getConferenciaById(id: string): RegistroConferencia | undefined {
  const list = getConferencias();
  return list.find((c) => c.id === id || c.numero_pedido === id);
}

// ── INICIAR CONFERÊNCIA (ITEM 6.2) ──────────────────────────────────────────

export function iniciarConferencia(
  id: string,
  operadorId: string,
  operadorNome: string,
  tipo: TipoConferencia
): { success: boolean; conferencia?: RegistroConferencia; error?: string } {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === id);
  if (index === -1) {
    return { success: false, error: "Conferência não encontrada." };
  }

  const conf = conferencias[index];
  if (!conf) {
    return { success: false, error: "Conferência inválida." };
  }

  conf.status = "em_conferencia";
  conf.conferente_id = operadorId;
  conf.conferente_nome = operadorNome;
  conf.tipo_conferencia = tipo;
  if (!conf.data_inicio) {
    const now = new Date();
    conf.data_inicio = now.toISOString().replace("T", " ").slice(0, 16);
  }

  conferencias[index] = conf;
  saveConferencias(conferencias);
  return { success: true, conferencia: conf };
}

// ── BIPAGEM DE ITENS NA CONFERÊNCIA (ITEM 6.2 & 6.3) ────────────────────────

export interface BipagemConferenciaParams {
  conferencia_id: string;
  codigo_lido: string; // EAN, código do produto ou barra alfanumérica
  lote_lido?: string;
  validade_lida?: string;
  volume_id?: string;
  quantidade_bipada?: number;
  operador_nome: string;
}

export function executarBipagemConferencia(params: BipagemConferenciaParams): {
  success: boolean;
  bloqueado?: boolean;
  mensagem: string;
  item_id?: string;
  divergencia?: DivergenciaHistorico;
  conferencia?: RegistroConferencia;
} {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === params.conferencia_id);
  if (index === -1) {
    return { success: false, mensagem: "Conferência não encontrada." };
  }

  const conf = conferencias[index];
  if (!conf) {
    return { success: false, mensagem: "Conferência inválida." };
  }

  const cleanCode = params.codigo_lido.trim();
  const qtdAdicionar = params.quantidade_bipada && params.quantidade_bipada > 0 ? params.quantidade_bipada : 1;

  // Localiza o item pelo EAN, Barra Alfa ou Código do Produto
  const itemIndex = conf.itens.findIndex(
    (it) =>
      it.ean === cleanCode ||
      it.cod_produto === cleanCode ||
      (it.barra_alfa && it.barra_alfa.toUpperCase() === cleanCode.toUpperCase())
  );

  const agoraStr = new Date().toISOString().replace("T", " ").slice(0, 16);

  // 1. PRODUTO NÃO CONSTA NO PEDIDO
  if (itemIndex === -1) {
    const divId = `div-${Date.now()}`;
    const novaDiv: DivergenciaHistorico = {
      id: divId,
      data_hora: agoraStr,
      operador_nome: params.operador_nome,
      tipo: "produto_trocado",
      cod_produto: cleanCode,
      descricao: `Produto não pertence a este pedido (Código: ${cleanCode})`,
      qtd_esperada: 0,
      qtd_conferida: qtdAdicionar,
      motivo: `Produto bipado [${cleanCode}] não cadastrado nos itens deste pedido.`,
      status_resolucao: "pendente_analise",
    };

    conf.divergencias.unshift(novaDiv);
    conf.status = "divergencia_identificada";
    conferencias[index] = conf;
    saveConferencias(conferencias);

    return {
      success: false,
      bloqueado: true,
      mensagem: `DIVERGÊNCIA: Produto [${cleanCode}] NÃO consta neste pedido! Enviado para quarentena/análise.`,
      divergencia: novaDiv,
      conferencia: conf,
    };
  }

  const item = conf.itens[itemIndex];
  if (!item) {
    return { success: false, mensagem: "Item inválido." };
  }

  // 2. VALIDAÇÃO DE LOTE SE INFORMADO
  if (params.lote_lido && params.lote_lido.trim() !== "") {
    const loteLimpo = params.lote_lido.trim();
    if (loteLimpo.toUpperCase() !== item.lote_esperado.toUpperCase()) {
      item.lote_conferido = loteLimpo;
      item.status_item = "divergente";
      item.divergencia_tipo = "lote_divergente";
      item.divergencia_motivo = `Lote bipado [${loteLimpo}] difere do lote esperado [${item.lote_esperado}].`;

      const novaDiv: DivergenciaHistorico = {
        id: `div-lote-${Date.now()}`,
        data_hora: agoraStr,
        operador_nome: params.operador_nome,
        tipo: "lote_divergente",
        cod_produto: item.cod_produto,
        descricao: item.descricao,
        qtd_esperada: item.quantidade_esperada,
        qtd_conferida: item.quantidade_conferida + qtdAdicionar,
        lote_esperado: item.lote_esperado,
        lote_conferido: loteLimpo,
        motivo: `Lote divergente: bipado ${loteLimpo} vs esperado ${item.lote_esperado}`,
        status_resolucao: "pendente_analise",
      };

      conf.divergencias.unshift(novaDiv);
      conf.status = "divergencia_identificada";
      conferencias[index] = conf;
      saveConferencias(conferencias);

      return {
        success: false,
        bloqueado: true,
        mensagem: `DIVERGÊNCIA DE LOTE: Lote ${loteLimpo} divergente do lote esperado (${item.lote_esperado})!`,
        divergencia: novaDiv,
        conferencia: conf,
      };
    }
  }

  // 3. ATUALIZAÇÃO DA QUANTIDADE CONFERIDA
  item.quantidade_conferida += qtdAdicionar;
  if (params.lote_lido) item.lote_conferido = params.lote_lido.trim();
  if (params.validade_lida) item.validade_conferida = params.validade_lida.trim();

  // Verifica se excedeu a quantidade
  if (item.quantidade_conferida > item.quantidade_esperada) {
    item.status_item = "excedente";
    item.divergencia_tipo = "sobra";
    item.divergencia_motivo = `Quantidade conferida (${item.quantidade_conferida}) excede a quantidade esperada (${item.quantidade_esperada}).`;

    const novaDiv: DivergenciaHistorico = {
      id: `div-sobra-${Date.now()}`,
      data_hora: agoraStr,
      operador_nome: params.operador_nome,
      tipo: "sobra",
      cod_produto: item.cod_produto,
      descricao: item.descricao,
      qtd_esperada: item.quantidade_esperada,
      qtd_conferida: item.quantidade_conferida,
      motivo: `Sobra física: ${item.quantidade_conferida} conferidos vs ${item.quantidade_esperada} solicitados.`,
      status_resolucao: "pendente_analise",
    };

    conf.divergencias.unshift(novaDiv);
    conf.status = "divergencia_identificada";
    conferencias[index] = conf;
    saveConferencias(conferencias);

    return {
      success: true,
      bloqueado: false,
      mensagem: `ALERTA DE SOBRA: Quantidade conferida (${item.quantidade_conferida}) maior que a solicitada (${item.quantidade_esperada})!`,
      divergencia: novaDiv,
      conferencia: conf,
    };
  } else if (item.quantidade_conferida === item.quantidade_esperada) {
    item.status_item = "conforme";
    item.divergencia_tipo = undefined;
    item.divergencia_motivo = undefined;
  } else {
    item.status_item = "pendente";
  }

  // Atualiza totais
  conf.total_itens_conferidos = conf.itens.reduce((acc, it) => acc + it.quantidade_conferida, 0);

  // Atualiza volume se especificado
  if (params.volume_id) {
    const vol = conf.volumes.find((v) => v.id === params.volume_id || v.codigo_volume === params.volume_id);
    if (vol) {
      const volItem = vol.itens.find((it) => it.cod_produto === item.cod_produto);
      if (volItem) {
        volItem.quantidade += qtdAdicionar;
      } else {
        vol.itens.push({
          cod_produto: item.cod_produto,
          descricao: item.descricao,
          quantidade: qtdAdicionar,
          lote: item.lote_esperado,
          validade: item.validade_esperada,
        });
      }
    }
  }

  conferencias[index] = conf;
  saveConferencias(conferencias);

  return {
    success: true,
    mensagem: `Bipagem registrada: ${item.descricao} (+${qtdAdicionar} ${item.unidade_medida}). Total: ${item.quantidade_conferida}/${item.quantidade_esperada}.`,
    item_id: item.id,
    conferencia: conf,
  };
}

// ── REGISTRO MANUAL DE DIVERGÊNCIA (ITEM 6.2 & 6.4) ─────────────────────────

export function registrarDivergenciaManual(params: {
  conferencia_id: string;
  item_id: string;
  tipo: TipoDivergenciaConferencia;
  motivo: string;
  operador_nome: string;
  foto_url?: string;
}): { success: boolean; conferencia?: RegistroConferencia; error?: string } {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === params.conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada." };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida." };

  const item = conf.itens.find((it) => it.id === params.item_id || it.cod_produto === params.item_id);
  if (!item) return { success: false, error: "Item não encontrado." };

  item.status_item = "divergente";
  item.divergencia_tipo = params.tipo;
  item.divergencia_motivo = params.motivo;
  if (params.foto_url) item.foto_url = params.foto_url;

  const agoraStr = new Date().toISOString().replace("T", " ").slice(0, 16);
  const novaDiv: DivergenciaHistorico = {
    id: `div-man-${Date.now()}`,
    data_hora: agoraStr,
    operador_nome: params.operador_nome,
    tipo: params.tipo,
    cod_produto: item.cod_produto,
    descricao: item.descricao,
    qtd_esperada: item.quantidade_esperada,
    qtd_conferida: item.quantidade_conferida,
    motivo: params.motivo,
    status_resolucao: "pendente_analise",
  };

  conf.divergencias.unshift(novaDiv);
  conf.status = "divergencia_identificada";
  conferencias[index] = conf;
  saveConferencias(conferencias);

  return { success: true, conferencia: conf };
}

// ── ENVIAR PARA ANÁLISE / QUARENTENA DE EXPEDIÇÃO (ITEM 6.4) ────────────────

export function enviarDivergenciaParaAnalise(
  conferencia_id: string,
  divergencia_id: string,
  resolucao: "corrigido" | "retornado_estoque"
): { success: boolean; conferencia?: RegistroConferencia; error?: string } {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada." };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida." };

  const div = conf.divergencias.find((d) => d.id === divergencia_id);
  if (div) {
    div.status_resolucao = resolucao;
  }

  // Verifica se ainda restam divergências pendentes
  const restamPendentes = conf.divergencias.some((d) => d.status_resolucao === "pendente_analise");
  if (!restamPendentes) {
    conf.status = "aguardando_correcao";
  }

  conferencias[index] = conf;
  saveConferencias(conferencias);
  return { success: true, conferencia: conf };
}

// ── RECONTAGEM POR OUTRO OPERADOR (ITEM 6.4) ────────────────────────────────

export function solicitarRecontagem(
  conferencia_id: string,
  novoOperadorId: string,
  novoOperadorNome: string,
  motivo?: string
): { success: boolean; conferencia?: RegistroConferencia; error?: string } {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada." };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida." };

  conf.status = "recontagem";
  conf.recontagem_por_id = novoOperadorId;
  conf.recontagem_por_nome = novoOperadorNome;
  conf.numero_recontagens = (conf.numero_recontagens || 0) + 1;
  conf.total_itens_conferidos = 0;

  // Zera as quantidades conferidas para uma nova rodada cega ou dirigida
  conf.itens = conf.itens.map((it) => ({
    ...it,
    quantidade_conferida: 0,
    lote_conferido: undefined,
    validade_conferida: undefined,
    status_item: "pendente",
    divergencia_tipo: undefined,
    divergencia_motivo: undefined,
  }));

  // Zera itens conferidos dos volumes
  conf.volumes = conf.volumes.map((v) => ({
    ...v,
    conferido: false,
    itens: [],
  }));

  if (motivo) {
    conf.observacoes = (conf.observacoes ? conf.observacoes + " | " : "") + `Recontagem #${conf.numero_recontagens}: ${motivo}`;
  }

  conferencias[index] = conf;
  saveConferencias(conferencias);
  return { success: true, conferencia: conf };
}

// ── FINALIZAR CONFERÊNCIA COM BLOQUEIO DE DIVERGÊNCIA (ITEM 6.4) ────────────

export function finalizarConferencia(
  conferencia_id: string,
  usuarioNome: string
): { success: boolean; conferencia?: RegistroConferencia; error?: string } {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada." };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida." };

  // REGRA RÍGIDA 6.4: Não permitir finalizar pedidos com divergências pendentes
  const itensComDivergencia = conf.itens.filter(
    (it) => it.quantidade_conferida !== it.quantidade_esperada || it.status_item === "divergente" || it.status_item === "excedente"
  );

  const divergenciasPendentes = conf.divergencias.filter((d) => d.status_resolucao === "pendente_analise");

  if (itensComDivergencia.length > 0 || divergenciasPendentes.length > 0) {
    const pendenciasTxt = itensComDivergencia
      .map((it) => `${it.descricao} (Esp: ${it.quantidade_esperada}, Conf: ${it.quantidade_conferida})`)
      .join("; ");

    return {
      success: false,
      error: `BLOQUEIO DE SEGURANÇA (REGRA 6.4): Não é permitido finalizar pedidos com divergências pendentes! Itens divergentes: ${pendenciasTxt}. Resolva as ocorrências ou solicite recontagem.`,
    };
  }

  // Tudo conforme: finaliza com sucesso
  conf.status = "conferido";
  conf.data_fim = new Date().toISOString().replace("T", " ").slice(0, 16);
  conf.volumes.forEach((v) => {
    v.conferido = true;
  });

  conferencias[index] = conf;
  saveConferencias(conferencias);

  return { success: true, conferencia: conf };
}

// ── LIBERAR PARA EXPEDIÇÃO (ITEM 6.5) ───────────────────────────────────────

export function liberarParaExpedicao(conferencia_id: string): {
  success: boolean;
  conferencia?: RegistroConferencia;
  error?: string;
} {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada." };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida." };

  if (conf.status !== "conferido") {
    return {
      success: false,
      error: "O pedido só pode ser liberado para expedição após a conclusão com sucesso da conferência.",
    };
  }

  conf.status = "liberado_expedicao";
  conferencias[index] = conf;
  saveConferencias(conferencias);

  return { success: true, conferencia: conf };
}

// ── GERAR ROMANEIO E ETIQUETAS (ITEM 6.4) ───────────────────────────────────

export function gerarRomaneioConferencia(conferencia_id: string): {
  success: boolean;
  conferencia?: RegistroConferencia;
  error?: string;
} {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada." };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida." };

  conf.romaneio_gerado = true;
  conf.data_romaneio = new Date().toISOString().replace("T", " ").slice(0, 16);

  conferencias[index] = conf;
  saveConferencias(conferencias);
  return { success: true, conferencia: conf };
}

export function gerarEtiquetasVolumes(conferencia_id: string): {
  success: boolean;
  conferencia?: RegistroConferencia;
  total_volumes: number;
  error?: string;
} {
  const conferencias = getConferencias();
  const index = conferencias.findIndex((c) => c.id === conferencia_id);
  if (index === -1) return { success: false, error: "Conferência não encontrada.", total_volumes: 0 };

  const conf = conferencias[index];
  if (!conf) return { success: false, error: "Conferência inválida.", total_volumes: 0 };

  conf.volumes.forEach((v) => {
    v.etiqueta_gerada = true;
  });

  conferencias[index] = conf;
  saveConferencias(conferencias);
  return { success: true, conferencia: conf, total_volumes: conf.volumes.length };
}

// ── INDICADORES E PAINEL VISUAL (ITEM 6.5) ──────────────────────────────────

export function getIndicadoresConferencia(): IndicadoresConferencia {
  const conferencias = getConferencias();

  const totalAguardando = conferencias.filter((c) => c.status === "aguardando_conferencia").length;
  const totalEmConferencia = conferencias.filter((c) => c.status === "em_conferencia").length;
  const totalDivergencias = conferencias.filter((c) => c.status === "divergencia_identificada").length;
  const totalAguardandoCorrecao = conferencias.filter((c) => c.status === "aguardando_correcao").length;
  const totalRecontagem = conferencias.filter((c) => c.status === "recontagem").length;
  const totalConferido = conferencias.filter((c) => c.status === "conferido").length;
  const totalLiberado = conferencias.filter((c) => c.status === "liberado_expedicao").length;
  const totalGeral = conferencias.length;

  const conferidosELiberados = totalConferido + totalLiberado;
  const totalProcessados = conferidosELiberados + totalDivergencias + totalAguardandoCorrecao;
  const acuracidadePct = totalProcessados > 0 ? parseFloat(((conferidosELiberados / totalProcessados) * 100).toFixed(1)) : 100;

  return {
    totalAguardando,
    totalEmConferencia,
    totalDivergencias,
    totalAguardandoCorrecao,
    totalRecontagem,
    totalConferido,
    totalLiberado,
    totalGeral,
    acuracidadePct,
    tempoMedioConferenciaMin: 22,
  };
}
