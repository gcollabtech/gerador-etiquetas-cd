import fs from "fs";
import path from "path";
import {
  InspecaoQualidade,
  NaoConformidadeQualidade,
  BloqueioQualidade,
  IndicadoresQualidade,
  DestinacaoQualidade,
  TipoBloqueioQualidade,
  TipoOcorrenciaNC,
  TipoInspecao,
  QUALIDADE_SEED,
} from "./wmsQualidadeTypes";

const DATA_FILE = path.join(process.cwd(), "data", "wms_qualidade.json");

interface QualidadeStorage {
  inspecoes: InspecaoQualidade[];
  naoConformidades: NaoConformidadeQualidade[];
  bloqueios: BloqueioQualidade[];
}

export function getQualidadeData(): QualidadeStorage {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveQualidadeData(QUALIDADE_SEED);
      return QUALIDADE_SEED;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      inspecoes: parsed.inspecoes || QUALIDADE_SEED.inspecoes,
      naoConformidades: parsed.naoConformidades || QUALIDADE_SEED.naoConformidades,
      bloqueios: parsed.bloqueios || QUALIDADE_SEED.bloqueios,
    };
  } catch (err) {
    console.error("Erro ao ler data/wms_qualidade.json, usando seed:", err);
    return QUALIDADE_SEED;
  }
}

export function saveQualidadeData(data: QualidadeStorage): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar data/wms_qualidade.json:", err);
  }
}

export function getIndicadoresQualidade(): IndicadoresQualidade {
  const data = getQualidadeData();
  const total = data.inspecoes.length;
  const aprovadas = data.inspecoes.filter((i) => i.status === "aprovado" || i.status === "aprovado_com_ressalvas").length;
  const quarentena = data.inspecoes.filter((i) => i.status === "quarentena").length;
  const rejeitadas = data.inspecoes.filter((i) => i.status === "rejeitado").length;
  const taxaConformidade = total > 0 ? Math.round((aprovadas / total) * 100) : 100;

  const bloqueiosAtivos = data.bloqueios.filter((b) => b.ativo);
  const skusBloqueados = new Set(bloqueiosAtivos.filter((b) => b.sku).map((b) => b.sku)).size;
  const lotesBloqueados = new Set(bloqueiosAtivos.filter((b) => b.lote).map((b) => b.lote)).size;
  const enderecosBloqueados = new Set(bloqueiosAtivos.filter((b) => b.endereco).map((b) => b.endereco)).size;

  const rncsAbertas = data.naoConformidades.filter((r) => r.statusRnc === "aberta" || r.statusRnc === "em_tratativa").length;
  const devolucoesPendentes = data.naoConformidades.filter((r) => r.destinacao === "devolucao_fornecedor" && r.statusRnc !== "encerrada").length;
  const descartesAprovados = data.naoConformidades.filter((r) => r.destinacao === "descarte_autorizado").length;

  return {
    totalInspecoes: total,
    taxaConformidade,
    inspecoesAprovadas: aprovadas,
    inspecoesQuarentena: quarentena,
    inspecoesRejeitadas: rejeitadas,
    rncsAbertas,
    totalBloqueiosAtivos: bloqueiosAtivos.length,
    skusBloqueados,
    lotesBloqueados,
    enderecosBloqueados,
    devolucoesPendentes,
    descartesAprovados,
  };
}

export function criarInspecao(params: {
  tipoInspecao: TipoInspecao;
  origem: "recebimento" | "armazenado_cd";
  inspetor: string;
  produtoId: string;
  produtoDescricao: string;
  sku: string;
  lote: string;
  validade: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNotaFiscal: string;
  chaveNfe?: string;
  enderecoArmazenamento?: string;
  quantidadeTotalLote: number;
  quantidadeInspecionada: number;
  unidadeMedida: string;
  temperaturaAferida?: number;
  temperaturaMinExigida?: number;
  temperaturaMaxExigida?: number;
  condicoesTransporte?: {
    veiculoHigienizado: boolean;
    ausenciaOdoresPragas: boolean;
    bauFechadoTermico: boolean;
    observacaoTransporte?: string;
  };
  checklist: {
    integridadeEmbalagem: boolean;
    validadeConforme: boolean;
    loteLegivel: boolean;
    identificacaoRotulagem: boolean;
    condicoesFisicas: boolean;
    temperaturaConforme?: boolean;
    transporteConforme?: boolean;
  };
  parecerTecnico: string;
}): InspecaoQualidade {
  const data = getQualidadeData();
  const idSeq = String(data.inspecoes.length + 1).padStart(3, "0");
  const codigoInspecao = `INS-2026-${idSeq}`;

  // Verifica se há alguma não conformidade
  const { checklist, temperaturaAferida, temperaturaMinExigida, temperaturaMaxExigida } = params;
  let tempConforme = true;
  if (temperaturaAferida !== undefined && temperaturaMaxExigida !== undefined) {
    tempConforme = temperaturaAferida <= temperaturaMaxExigida;
    if (temperaturaMinExigida !== undefined && temperaturaAferida < temperaturaMinExigida) {
      tempConforme = false;
    }
  }

  const checklistFinal = {
    ...checklist,
    temperaturaConforme: checklist.temperaturaConforme !== undefined ? checklist.temperaturaConforme : tempConforme,
    transporteConforme: checklist.transporteConforme !== undefined ? checklist.transporteConforme : true,
  };

  const reprovado =
    !checklistFinal.integridadeEmbalagem ||
    !checklistFinal.validadeConforme ||
    !checklistFinal.loteLegivel ||
    !checklistFinal.identificacaoRotulagem ||
    !checklistFinal.condicoesFisicas ||
    checklistFinal.temperaturaConforme === false ||
    checklistFinal.transporteConforme === false;

  let status: InspecaoQualidade["status"] = "aprovado";
  let destinacaoFinal: DestinacaoQualidade = "liberado";

  if (reprovado) {
    if (checklistFinal.temperaturaConforme === false || !checklistFinal.validadeConforme) {
      status = "rejeitado";
      destinacaoFinal = "devolucao_fornecedor";
    } else {
      status = "quarentena";
      destinacaoFinal = "aguardando_analise";
    }
  }

  const novaInspecao: InspecaoQualidade = {
    id: `ins-${Date.now()}`,
    codigoInspecao,
    tipoInspecao: params.tipoInspecao,
    origem: params.origem,
    dataHora: new Date().toISOString().replace("T", " ").substring(0, 16),
    inspetor: params.inspetor,
    produtoId: params.produtoId,
    produtoDescricao: params.produtoDescricao,
    sku: params.sku,
    lote: params.lote,
    validade: params.validade,
    fornecedorNome: params.fornecedorNome,
    fornecedorCnpj: params.fornecedorCnpj,
    numeroNotaFiscal: params.numeroNotaFiscal,
    chaveNfe: params.chaveNfe,
    enderecoArmazenamento: params.enderecoArmazenamento,
    quantidadeTotalLote: params.quantidadeTotalLote,
    quantidadeInspecionada: params.quantidadeInspecionada,
    tamanhoAmostra: params.quantidadeInspecionada,
    unidadeMedida: params.unidadeMedida,
    temperaturaAferida: params.temperaturaAferida,
    temperaturaMinExigida: params.temperaturaMinExigida,
    temperaturaMaxExigida: params.temperaturaMaxExigida,
    condicoesTransporte: params.condicoesTransporte,
    checklist: checklistFinal,
    status,
    destinacaoFinal,
    parecerTecnico: params.parecerTecnico,
    temNaoConformidade: reprovado,
  };

  // Se reprovado, cria RNC e bloqueio automaticamente
  if (reprovado) {
    const rncSeq = String(data.naoConformidades.length + 1).padStart(3, "0");
    const codigoRnc = `RNC-2026-${rncSeq}`;
    const blqSeq = String(data.bloqueios.length + 1).padStart(3, "0");
    const codigoBloqueio = `BLQ-2026-${blqSeq}`;

    let tipoOcorrencia: TipoOcorrenciaNC = "outros";
    if (checklistFinal.temperaturaConforme === false) tipoOcorrencia = "temperatura_inadequada";
    else if (!checklistFinal.validadeConforme) tipoOcorrencia = "validade_curta_ou_vencida";
    else if (!checklistFinal.integridadeEmbalagem) tipoOcorrencia = "avaria_embalagem";
    else if (!checklistFinal.condicoesFisicas) tipoOcorrencia = "embalagem_violada_ou_umida";
    else if (!checklistFinal.identificacaoRotulagem) tipoOcorrencia = "divergencia_rotulo_ou_ean";

    const novoBloqueio: BloqueioQualidade = {
      id: `blq-${Date.now()}`,
      codigoBloqueio,
      tipoBloqueio: status === "rejeitado" ? "lote" : "quantidade_parcial",
      motivo: `Bloqueio por Não Conformidade: ${params.parecerTecnico}`,
      rncId: "",
      produtoId: params.produtoId,
      sku: params.sku,
      produtoDescricao: params.produtoDescricao,
      lote: params.lote,
      endereco: params.enderecoArmazenamento,
      numeroNotaFiscal: params.numeroNotaFiscal,
      quantidadeBloqueada: status === "rejeitado" ? params.quantidadeTotalLote : params.quantidadeInspecionada,
      unidadeMedida: params.unidadeMedida,
      impedePicking: true,
      impedeTransferencia: true,
      impedeExpedicao: true,
      ativo: true,
      criadoPor: params.inspetor,
      criadoEm: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    const novaRnc: NaoConformidadeQualidade = {
      id: `rnc-${Date.now()}`,
      codigoRnc,
      inspecaoId: novaInspecao.id,
      produtoId: params.produtoId,
      produtoDescricao: params.produtoDescricao,
      sku: params.sku,
      lote: params.lote,
      fornecedorNome: params.fornecedorNome,
      fornecedorCnpj: params.fornecedorCnpj,
      numeroNotaFiscal: params.numeroNotaFiscal,
      quantidadeAfetada: novoBloqueio.quantidadeBloqueada || params.quantidadeInspecionada,
      unidadeMedida: params.unidadeMedida,
      tipoOcorrencia,
      fotos: [],
      responsavel: params.inspetor,
      dataHora: new Date().toISOString().replace("T", " ").substring(0, 16),
      parecer: params.parecerTecnico,
      destinacao: destinacaoFinal,
      bloqueioGeradoId: novoBloqueio.id,
      statusRnc: "aberta",
    };

    novoBloqueio.rncId = novaRnc.id;
    novaInspecao.naoConformidadeId = novaRnc.id;

    data.bloqueios.unshift(novoBloqueio);
    data.naoConformidades.unshift(novaRnc);
  }

  data.inspecoes.unshift(novaInspecao);
  saveQualidadeData(data);
  return novaInspecao;
}

export function registrarNaoConformidadeManual(params: {
  produtoId: string;
  produtoDescricao: string;
  sku: string;
  lote: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNotaFiscal: string;
  quantidadeAfetada: number;
  unidadeMedida: string;
  tipoOcorrencia: TipoOcorrenciaNC;
  fotos?: Array<{ legenda: string; url: string }>;
  responsavel: string;
  parecer: string;
  destinacao: DestinacaoQualidade;
  endereco?: string;
  bloquearEstoque?: boolean;
}): NaoConformidadeQualidade {
  const data = getQualidadeData();
  const rncSeq = String(data.naoConformidades.length + 1).padStart(3, "0");
  const codigoRnc = `RNC-2026-${rncSeq}`;
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);

  let bloqueioId: string | undefined = undefined;

  if (params.bloquearEstoque !== false) {
    const blqSeq = String(data.bloqueios.length + 1).padStart(3, "0");
    const codigoBloqueio = `BLQ-2026-${blqSeq}`;
    const novoBloqueio: BloqueioQualidade = {
      id: `blq-${Date.now()}`,
      codigoBloqueio,
      tipoBloqueio: "quantidade_parcial",
      motivo: `RNC ${codigoRnc}: ${params.parecer}`,
      rncId: "",
      produtoId: params.produtoId,
      sku: params.sku,
      produtoDescricao: params.produtoDescricao,
      lote: params.lote,
      endereco: params.endereco,
      numeroNotaFiscal: params.numeroNotaFiscal,
      quantidadeBloqueada: params.quantidadeAfetada,
      unidadeMedida: params.unidadeMedida,
      impedePicking: true,
      impedeTransferencia: true,
      impedeExpedicao: true,
      ativo: true,
      criadoPor: params.responsavel,
      criadoEm: now,
    };
    bloqueioId = novoBloqueio.id;
    data.bloqueios.unshift(novoBloqueio);
  }

  const novaRnc: NaoConformidadeQualidade = {
    id: `rnc-${Date.now()}`,
    codigoRnc,
    produtoId: params.produtoId,
    produtoDescricao: params.produtoDescricao,
    sku: params.sku,
    lote: params.lote,
    fornecedorNome: params.fornecedorNome,
    fornecedorCnpj: params.fornecedorCnpj,
    numeroNotaFiscal: params.numeroNotaFiscal,
    quantidadeAfetada: params.quantidadeAfetada,
    unidadeMedida: params.unidadeMedida,
    tipoOcorrencia: params.tipoOcorrencia,
    fotos: (params.fotos || []).map((f, i) => ({
      id: `foto-${Date.now()}-${i}`,
      url: f.url,
      legenda: f.legenda,
      dataUpload: now,
    })),
    responsavel: params.responsavel,
    dataHora: now,
    parecer: params.parecer,
    destinacao: params.destinacao,
    bloqueioGeradoId: bloqueioId,
    statusRnc: "aberta",
  };

  if (bloqueioId) {
    const b = data.bloqueios.find((item) => item.id === bloqueioId);
    if (b) b.rncId = novaRnc.id;
  }

  data.naoConformidades.unshift(novaRnc);
  saveQualidadeData(data);
  return novaRnc;
}

export function criarBloqueioManual(params: {
  tipoBloqueio: TipoBloqueioQualidade;
  motivo: string;
  produtoId?: string;
  sku?: string;
  produtoDescricao?: string;
  lote?: string;
  endereco?: string;
  numeroNotaFiscal?: string;
  quantidadeBloqueada?: number;
  unidadeMedida?: string;
  responsavel: string;
}): BloqueioQualidade {
  const data = getQualidadeData();
  const blqSeq = String(data.bloqueios.length + 1).padStart(3, "0");
  const codigoBloqueio = `BLQ-2026-${blqSeq}`;
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);

  const novoBloqueio: BloqueioQualidade = {
    id: `blq-${Date.now()}`,
    codigoBloqueio,
    tipoBloqueio: params.tipoBloqueio,
    motivo: params.motivo,
    produtoId: params.produtoId,
    sku: params.sku,
    produtoDescricao: params.produtoDescricao,
    lote: params.lote,
    endereco: params.endereco,
    numeroNotaFiscal: params.numeroNotaFiscal,
    quantidadeBloqueada: params.quantidadeBloqueada,
    unidadeMedida: params.unidadeMedida || "UN",
    impedePicking: true,
    impedeTransferencia: true,
    impedeExpedicao: true,
    ativo: true,
    criadoPor: params.responsavel,
    criadoEm: now,
  };

  data.bloqueios.unshift(novoBloqueio);
  saveQualidadeData(data);
  return novoBloqueio;
}

export function desbloquearItem(params: {
  bloqueioId: string;
  responsavel: string;
  justificativa: string;
}): { success: boolean; error?: string; bloqueio?: BloqueioQualidade } {
  const data = getQualidadeData();
  const bloqueio = data.bloqueios.find((b) => b.id === params.bloqueioId);
  if (!bloqueio) {
    return { success: false, error: "Registro de bloqueio não encontrado." };
  }
  if (!params.justificativa || params.justificativa.trim().length < 5) {
    return { success: false, error: "Justificativa obrigatória para desbloqueio." };
  }

  bloqueio.ativo = false;
  bloqueio.desbloqueadoPor = params.responsavel;
  bloqueio.desbloqueadoEm = new Date().toISOString().replace("T", " ").substring(0, 16);
  bloqueio.justificativaDesbloqueio = params.justificativa;

  saveQualidadeData(data);
  return { success: true, bloqueio };
}

export function atualizarDestinacaoRnc(params: {
  rncId: string;
  destinacao: DestinacaoQualidade;
  responsavel: string;
  parecer: string;
  liberarBloqueioAssociado?: boolean;
}): {
  success: boolean;
  error?: string;
  rnc?: NaoConformidadeQualidade;
  protocoloGerado?: string;
} {
  const data = getQualidadeData();
  const rnc = data.naoConformidades.find((r) => r.id === params.rncId);
  if (!rnc) {
    return { success: false, error: "RNC não encontrada." };
  }

  const now = new Date().toISOString().replace("T", " ").substring(0, 16);
  rnc.destinacao = params.destinacao;
  rnc.resolvidoPor = params.responsavel;
  rnc.resolvidoEm = now;
  rnc.parecer = `${rnc.parecer} | [Destinação por ${params.responsavel}]: ${params.parecer}`;

  let protocoloGerado: string | undefined = undefined;

  if (params.destinacao === "devolucao_fornecedor") {
    protocoloGerado = `RTV-FORN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    rnc.protocoloDevolucaoRtv = protocoloGerado;
    rnc.statusRnc = "destinada";
  } else if (params.destinacao === "descarte_autorizado") {
    protocoloGerado = `LAUDO-DESC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    rnc.laudoDescarte = protocoloGerado;
    rnc.statusRnc = "destinada";
  } else if (params.destinacao === "liberado") {
    rnc.statusRnc = "encerrada";
    if (params.liberarBloqueioAssociado && rnc.bloqueioGeradoId) {
      const b = data.bloqueios.find((item) => item.id === rnc.bloqueioGeradoId);
      if (b && b.ativo) {
        b.ativo = false;
        b.desbloqueadoPor = params.responsavel;
        b.desbloqueadoEm = now;
        b.justificativaDesbloqueio = `Liberado via aprovação de RNC: ${params.parecer}`;
      }
    }
  } else if (params.destinacao === "bloqueio_definitivo") {
    rnc.statusRnc = "destinada";
  } else {
    rnc.statusRnc = "em_tratativa";
  }

  saveQualidadeData(data);
  return { success: true, rnc, protocoloGerado };
}
