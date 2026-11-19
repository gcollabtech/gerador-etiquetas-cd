// src/lib/serverExpedicao.ts
// Lógica de persistência e regras de negócio para o MÓDULO 07 — EXPEDIÇÃO

import fs from "fs";
import path from "path";
import {
  CargaExpedicao,
  DocaExpedicao,
  VolumeCarga,
  IndicadoresExpedicao,
  DOCAS_EXPEDICAO_SEED,
  CARGAS_EXPEDICAO_SEED,
} from "./wmsExpedicaoTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const CARGAS_FILE = path.join(DATA_DIR, "wms_cargas_expedicao.json");
const DOCAS_FILE = path.join(DATA_DIR, "wms_docas_expedicao.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── LEITURA E GRAVAÇÃO ──────────────────────────────────────────────────────

export function getDocasExpedicao(): DocaExpedicao[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(DOCAS_FILE)) {
      fs.writeFileSync(DOCAS_FILE, JSON.stringify(DOCAS_EXPEDICAO_SEED, null, 2), "utf8");
      return DOCAS_EXPEDICAO_SEED;
    }
    const data = fs.readFileSync(DOCAS_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DOCAS_EXPEDICAO_SEED;
  } catch (err) {
    console.error("Erro ao ler wms_docas_expedicao.json:", err);
    return DOCAS_EXPEDICAO_SEED;
  }
}

export function saveDocasExpedicao(docas: DocaExpedicao[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(DOCAS_FILE, JSON.stringify(docas, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar wms_docas_expedicao.json:", err);
  }
}

export function getCargasExpedicao(): CargaExpedicao[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(CARGAS_FILE)) {
      fs.writeFileSync(CARGAS_FILE, JSON.stringify(CARGAS_EXPEDICAO_SEED, null, 2), "utf8");
      return CARGAS_EXPEDICAO_SEED;
    }
    const data = fs.readFileSync(CARGAS_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : CARGAS_EXPEDICAO_SEED;
  } catch (err) {
    console.error("Erro ao ler wms_cargas_expedicao.json:", err);
    return CARGAS_EXPEDICAO_SEED;
  }
}

export function saveCargasExpedicao(cargas: CargaExpedicao[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(CARGAS_FILE, JSON.stringify(cargas, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar wms_cargas_expedicao.json:", err);
  }
}

export function getCargaById(id: string): CargaExpedicao | undefined {
  const cargas = getCargasExpedicao();
  return cargas.find((c) => c.id === id || c.numero_carga === id);
}

// ── FORMAÇÃO DE CARGAS (ITEM 7.2) ───────────────────────────────────────────

export interface CriarCargaParams {
  regiao: string;
  rota: string;
  transportadora: string;
  veiculo_tipo: string;
  placa_veiculo: string;
  motorista_nome: string;
  motorista_cpf: string;
  motorista_cnh: string;
  doca_id: string;
  data_entrega_prevista: string;
  horario_previsto_carregamento: string;
  pedidos: Array<{
    id: string;
    numero_pedido: string;
    cod_loja: string;
    loja_destino: string;
    volumes: Array<{
      codigo_volume: string;
      peso_kg: number;
      tipo_embalagem: string;
    }>;
  }>;
  observacoes?: string;
}

export function criarCargaExpedicao(params: CriarCargaParams): {
  success: boolean;
  carga?: CargaExpedicao;
  error?: string;
} {
  const cargas = getCargasExpedicao();
  const docas = getDocasExpedicao();

  const doca = docas.find((d) => d.id === params.doca_id);
  const docaNome = doca ? doca.nome : "Doca Padrão";

  const numSeq = cargas.length + 42;
  const numeroCarga = `CRG-2026-${String(numSeq).padStart(4, "0")}`;

  const volumesList: VolumeCarga[] = [];
  const lojasMap = new Map<string, { cod_loja: string; nome_loja: string; total_volumes: number; total_itens: number; peso_kg: number }>();

  let pesoTotal = 0;

  for (const ped of params.pedidos) {
    for (const v of ped.volumes) {
      volumesList.push({
        id: `vol-crg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        codigo_volume: v.codigo_volume,
        numero_pedido: ped.numero_pedido,
        loja_destino: ped.loja_destino,
        cod_loja: ped.cod_loja,
        rota: params.rota,
        peso_kg: v.peso_kg || 15,
        tipo_embalagem: v.tipo_embalagem || "Caixa Padrão",
        bipado: false,
      });
      pesoTotal += v.peso_kg || 15;
    }

    const prev = lojasMap.get(ped.cod_loja) || {
      cod_loja: ped.cod_loja,
      nome_loja: ped.loja_destino,
      total_volumes: 0,
      total_itens: 35,
      peso_kg: 0,
    };
    prev.total_volumes += ped.volumes.length;
    prev.peso_kg += ped.volumes.reduce((a, b) => a + (b.peso_kg || 15), 0);
    lojasMap.set(ped.cod_loja, prev);
  }

  const novaCarga: CargaExpedicao = {
    id: `crg-${Date.now()}`,
    numero_carga: numeroCarga,
    data_criacao: new Date().toISOString().replace("T", " ").slice(0, 16),
    data_entrega_prevista: params.data_entrega_prevista || new Date().toISOString().slice(0, 10),
    regiao: params.regiao,
    rota: params.rota,
    transportadora: params.transportadora,
    veiculo_tipo: params.veiculo_tipo,
    placa_veiculo: params.placa_veiculo.toUpperCase(),
    motorista_nome: params.motorista_nome,
    motorista_cpf: params.motorista_cpf,
    motorista_cnh: params.motorista_cnh,
    doca_id: params.doca_id,
    doca_nome: docaNome,
    horario_previsto_carregamento: params.horario_previsto_carregamento || "14:00",
    status: "aguardando_carga",
    pedidos_ids: params.pedidos.map((p) => p.id),
    pedidos_numeros: params.pedidos.map((p) => p.numero_pedido),
    lojas_atendidas: Array.from(lojasMap.values()),
    total_volumes: volumesList.length,
    volumes_bipados: 0,
    peso_total_kg: parseFloat(pesoTotal.toFixed(2)),
    cubagem_total_m3: parseFloat((volumesList.length * 0.035).toFixed(3)),
    volumes: volumesList,
    romaneio_digital_gerado: false,
    erp_sincronizado: false,
    documentos_fiscais: {
      mdf_e_numero: `MDF-e 001.482.${Math.floor(100 + Math.random() * 900)}`,
      cte_numero: `CT-e 003.${Math.floor(100 + Math.random() * 900)}`,
      nfs_chaves: params.pedidos.map((_, idx) => `3526110000000000000055001000000${String(850 + idx)}1000000${String(850 + idx)}5`),
    },
    observacoes: params.observacoes,
  };

  cargas.unshift(novaCarga);
  saveCargasExpedicao(cargas);

  // Se doca foi informada, marca status da doca como reservada/ocupada
  if (doca) {
    doca.status = "reservada";
    doca.carga_id_atual = novaCarga.id;
    doca.numero_carga_atual = novaCarga.numero_carga;
    doca.veiculo_atual = novaCarga.veiculo_tipo;
    doca.placa_atual = novaCarga.placa_veiculo;
    doca.transportadora_atual = novaCarga.transportadora;
    saveDocasExpedicao(docas);
  }

  return { success: true, carga: novaCarga };
}

// ── CONTROLE DE DOCAS (ITEM 7.3) ────────────────────────────────────────────

export function alocarDocaCarga(
  carga_id: string,
  doca_id: string,
  horario_previsto: string
): { success: boolean; carga?: CargaExpedicao; error?: string } {
  const cargas = getCargasExpedicao();
  const docas = getDocasExpedicao();

  const carga = cargas.find((c) => c.id === carga_id);
  if (!carga) return { success: false, error: "Carga não encontrada." };

  const doca = docas.find((d) => d.id === doca_id);
  if (!doca) return { success: false, error: "Doca não encontrada." };

  // Libera doca anterior se houver
  if (carga.doca_id && carga.doca_id !== doca_id) {
    const docaAntiga = docas.find((d) => d.id === carga.doca_id);
    if (docaAntiga && docaAntiga.carga_id_atual === carga.id) {
      docaAntiga.status = "livre";
      docaAntiga.carga_id_atual = undefined;
      docaAntiga.numero_carga_atual = undefined;
    }
  }

  carga.doca_id = doca.id;
  carga.doca_nome = doca.nome;
  carga.horario_previsto_carregamento = horario_previsto;

  doca.status = "ocupada";
  doca.carga_id_atual = carga.id;
  doca.numero_carga_atual = carga.numero_carga;
  doca.veiculo_atual = carga.veiculo_tipo;
  doca.placa_atual = carga.placa_veiculo;
  doca.transportadora_atual = carga.transportadora;
  doca.horario_ocupacao = new Date().toLocaleTimeString().slice(0, 5);

  saveCargasExpedicao(cargas);
  saveDocasExpedicao(docas);

  return { success: true, carga };
}

// ── CARREGAMENTO & TRAVA RÍGIDA DE VOLUMES (ITEM 7.4) ───────────────────────

export function iniciarCarregamento(carga_id: string): {
  success: boolean;
  carga?: CargaExpedicao;
  error?: string;
} {
  const cargas = getCargasExpedicao();
  const carga = cargas.find((c) => c.id === carga_id);
  if (!carga) return { success: false, error: "Carga não encontrada." };

  carga.status = "em_carregamento";
  if (!carga.horario_real_inicio) {
    carga.horario_real_inicio = new Date().toLocaleTimeString().slice(0, 5);
  }

  saveCargasExpedicao(cargas);
  return { success: true, carga };
}

export interface BipagemCarregamentoParams {
  carga_id: string;
  codigo_lido: string; // Pode ser volume (VOL-xxxx), pedido (PED-xxxx), placa do veículo ou rota
  operador_nome: string;
}

export function executarBipagemCarregamento(params: BipagemCarregamentoParams): {
  success: boolean;
  bloqueado?: boolean;
  concluido?: boolean;
  mensagem: string;
  carga?: CargaExpedicao;
} {
  const cargas = getCargasExpedicao();
  const carga = cargas.find((c) => c.id === params.carga_id);
  if (!carga) return { success: false, mensagem: "Carga não encontrada." };

  const clean = params.codigo_lido.trim();

  // Bipagem de conferência do Veículo / Placa
  if (clean.toUpperCase() === carga.placa_veiculo.toUpperCase()) {
    return {
      success: true,
      mensagem: `Veículo conferido: Placa ${carga.placa_veiculo} vinculada à Doca ${carga.doca_nome}.`,
      carga,
    };
  }

  // Bipagem de conferência da Rota
  if (clean.toUpperCase() === carga.rota.toUpperCase()) {
    return {
      success: true,
      mensagem: `Rota conferida com sucesso: ${carga.rota}.`,
      carga,
    };
  }

  // Bipagem de Volume ou Pedido
  const volIndex = carga.volumes.findIndex(
    (v) =>
      v.codigo_volume.toUpperCase() === clean.toUpperCase() ||
      v.numero_pedido.toUpperCase() === clean.toUpperCase()
  );

  // REGRA RÍGIDA 7.4: Bloquear o carregamento de volumes não pertencentes à carga!
  if (volIndex === -1) {
    return {
      success: false,
      bloqueado: true,
      mensagem: `BLOQUEIO DE SEGURANÇA (REGRA 7.4): O volume ou pedido [${clean}] NÃO PERTENCE à carga ${carga.numero_carga} (${carga.rota})! Carregamento no veículo impedido.`,
      carga,
    };
  }

  const volume = carga.volumes[volIndex];
  if (!volume) return { success: false, mensagem: "Volume inválido." };

  if (volume.bipado) {
    return {
      success: true,
      mensagem: `Aviso: Volume ${volume.codigo_volume} (${volume.loja_destino}) já havia sido bipado anteriormente.`,
      carga,
    };
  }

  volume.bipado = true;
  volume.bipado_em = new Date().toISOString().replace("T", " ").slice(0, 16);
  volume.operador_bipagem = params.operador_nome;

  carga.volumes_bipados = carga.volumes.filter((v) => v.bipado).length;

  let concluido = false;
  if (carga.volumes_bipados === carga.total_volumes) {
    carga.status = "carregamento_concluido";
    carga.horario_real_conclusao = new Date().toLocaleTimeString().slice(0, 5);
    concluido = true;
  } else {
    carga.status = "em_carregamento";
  }

  saveCargasExpedicao(cargas);

  return {
    success: true,
    concluido,
    mensagem: `Volume ${volume.codigo_volume} carregado com sucesso no veículo! Destino: ${volume.loja_destino} (${carga.volumes_bipados}/${carga.total_volumes} volumes).`,
    carga,
  };
}

// ── FINALIZAÇÃO COM ROMANEIO DIGITAL & ASSINATURA (ITEM 7.5) ────────────────

export interface FinalizarExpedicaoParams {
  carga_id: string;
  motorista_nome: string;
  motorista_cpf: string;
  motorista_cnh?: string;
  assinatura_base64: string; // Canvas touch
  operador_nome: string;
}

export function finalizarExpedicaoComAssinatura(params: FinalizarExpedicaoParams): {
  success: boolean;
  carga?: CargaExpedicao;
  error?: string;
} {
  const cargas = getCargasExpedicao();
  const carga = cargas.find((c) => c.id === params.carga_id);
  if (!carga) return { success: false, error: "Carga não encontrada." };

  if (carga.volumes_bipados < carga.total_volumes) {
    return {
      success: false,
      error: `Não é possível finalizar a expedição: restam ${carga.total_volumes - carga.volumes_bipados} volume(s) para serem bipados no carregamento!`,
    };
  }

  if (!params.assinatura_base64 || params.assinatura_base64.trim() === "") {
    return {
      success: false,
      error: "A assinatura digital do motorista é obrigatória para a emissão do romaneio e liberação da carga.",
    };
  }

  carga.romaneio_digital_gerado = true;
  carga.data_romaneio = new Date().toISOString().replace("T", " ").slice(0, 16);
  carga.assinatura_motorista = {
    nome: params.motorista_nome || carga.motorista_nome,
    cpf: params.motorista_cpf || carga.motorista_cpf,
    cnh: params.motorista_cnh || carga.motorista_cnh,
    data_hora: new Date().toISOString().replace("T", " ").slice(0, 16),
    assinatura_base64: params.assinatura_base64,
  };

  // Atualização automática do ERP
  carga.erp_sincronizado = true;
  carga.erp_protocolo_saida = `ERP-EXP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  carga.status = "expedido";
  saveCargasExpedicao(cargas);

  return { success: true, carga };
}

// ── LIBERAR VEÍCULO / SAÍDA FÍSICA PARA TRÂNSITO (ITEM 7.6) ─────────────────

export function registrarSaidaVeiculoPortaria(carga_id: string): {
  success: boolean;
  carga?: CargaExpedicao;
  error?: string;
} {
  const cargas = getCargasExpedicao();
  const docas = getDocasExpedicao();

  const carga = cargas.find((c) => c.id === carga_id);
  if (!carga) return { success: false, error: "Carga não encontrada." };

  carga.status = "em_transito";
  carga.data_saida_real = new Date().toISOString().replace("T", " ").slice(0, 16);

  // Libera a doca
  const doca = docas.find((d) => d.id === carga.doca_id);
  if (doca) {
    doca.status = "livre";
    doca.carga_id_atual = undefined;
    doca.numero_carga_atual = undefined;
    doca.veiculo_atual = undefined;
    doca.placa_atual = undefined;
    doca.transportadora_atual = undefined;
    saveDocasExpedicao(docas);
  }

  saveCargasExpedicao(cargas);
  return { success: true, carga };
}

// ── CONFIRMAÇÃO DE ENTREGA OU OCORRÊNCIA (ITEM 7.6) ─────────────────────────

export function registrarStatusEntrega(
  carga_id: string,
  novo_status: "entregue" | "entrega_ocorrencia",
  motivo_ocorrencia?: string,
  operador?: string
): { success: boolean; carga?: CargaExpedicao; error?: string } {
  const cargas = getCargasExpedicao();
  const carga = cargas.find((c) => c.id === carga_id);
  if (!carga) return { success: false, error: "Carga não encontrada." };

  carga.status = novo_status;
  if (novo_status === "entrega_ocorrencia" && motivo_ocorrencia) {
    carga.ocorrencia = {
      motivo: motivo_ocorrencia,
      data_hora: new Date().toISOString().replace("T", " ").slice(0, 16),
      operador: operador || "Central de Rastreamento",
    };
  }

  saveCargasExpedicao(cargas);
  return { success: true, carga };
}

// ── INDICADORES DO PAINEL DA EXPEDIÇÃO (ITEM 7.6) ───────────────────────────

export function getIndicadoresExpedicao(): IndicadoresExpedicao {
  const cargas = getCargasExpedicao();
  const docas = getDocasExpedicao();

  const totalAguardandoCarga = cargas.filter((c) => c.status === "aguardando_carga").length;
  const totalEmCarregamento = cargas.filter((c) => c.status === "em_carregamento").length;
  const totalCarregamentoConcluido = cargas.filter((c) => c.status === "carregamento_concluido").length;
  const totalAguardandoLiberacao = cargas.filter((c) => c.status === "aguardando_liberacao").length;
  const totalExpedido = cargas.filter((c) => c.status === "expedido").length;
  const totalEmTransito = cargas.filter((c) => c.status === "em_transito").length;
  const totalEntregue = cargas.filter((c) => c.status === "entregue").length;
  const totalOcorrencias = cargas.filter((c) => c.status === "entrega_ocorrencia").length;
  const totalGeralCargas = cargas.length;

  const docasOcupadas = docas.filter((d) => d.status === "ocupada" || d.status === "reservada").length;
  const taxaOcupacaoDocasPct = docas.length > 0 ? Math.round((docasOcupadas / docas.length) * 100) : 0;

  return {
    totalAguardandoCarga,
    totalEmCarregamento,
    totalCarregamentoConcluido,
    totalAguardandoLiberacao,
    totalExpedido,
    totalEmTransito,
    totalEntregue,
    totalOcorrencias,
    totalGeralCargas,
    taxaOcupacaoDocasPct,
    tempoMedioCarregamentoMin: 35,
  };
}
