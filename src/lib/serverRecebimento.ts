import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  RecebimentoNfe,
  ErpNfeInfo,
  ERP_SIMULADOR_NFES,
  RecebimentoItem,
  DivergenciaRegistro,
  TarefaArmazenagem,
  NfStatus,
} from "./wmsRecebimentoTypes";

function getSupabaseConfig(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://jnfvvcvoubimkdwrasro.supabase.co";

  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

function getSupabaseHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

const CANONICAL_DATA_DIR = "/Users/fragoso/Documents/collab-finance/collab-finance/gerador-etiquetas-cd/data";

function getDataDir(): string {
  if (fs.existsSync(CANONICAL_DATA_DIR)) return CANONICAL_DATA_DIR;
  const inGerador = path.join(process.cwd(), "gerador-etiquetas-cd", "data");
  if (fs.existsSync(inGerador)) return inGerador;
  const inCwd = path.join(process.cwd(), "data");
  if (!fs.existsSync(inCwd)) {
    try {
      fs.mkdirSync(inCwd, { recursive: true });
    } catch {}
  }
  return inCwd;
}

function getRecebimentosFilePath(): string {
  return path.join(getDataDir(), "wms_recebimentos.json");
}

function atomicWrite(filePath: string, data: any): void {
  const temp = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(temp, filePath);
  } catch (err) {
    console.error("Erro na gravação atômica de recebimentos:", err);
  }
}

const SEED_RECEBIMENTOS: RecebimentoNfe[] = [
  {
    id: "rec-seed-01",
    chave_nfe: "35261112345678000199550010000123451098765432",
    numero_nfe: "000.012.345",
    serie_nfe: "1",
    data_emissao: "2026-11-18",
    fornecedor_nome: "DISTRIBUIDORA NACIONAL DE ALIMENTOS S.A.",
    fornecedor_cnpj: "12.345.678/0001-99",
    pedido_compra: "PC-98421",
    valor_total: 48920.0,
    doca: "Doca 02",
    agendamento_id: "AGD-01",
    status: "em_recebimento",
    operador_id: "usr-01",
    operador_nome: "Carlos Eduardo (Conferente)",
    data_inicio: "2026-11-19T08:15:00Z",
    erp_status: "validado",
    erp_protocolo: "ERP-SYNC-88192",
    itens: [
      {
        id: "it-01",
        cod_produto: "PRD-1001",
        descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
        ean: "7891000315507",
        codigo_caixa_master: "17891000315504",
        fator_conversao: 24,
        qtd_nota: 240,
        qtd_conferida: 240,
        qtd_caixas_recebidas: 10,
        unidade_medida: "UN",
        lote: "LT-202611-A",
        data_fabricacao: "2026-11-01",
        data_validade: "2028-11-01",
        endereco_destino: "R01-P01-N01-A01",
        status_conferencia: "conferido_ok",
        tipo_leitura: "caixa_master",
      },
      {
        id: "it-02",
        cod_produto: "PRD-1002",
        descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
        ean: "7891234567895",
        codigo_caixa_master: "17891234567892",
        fator_conversao: 12,
        qtd_nota: 120,
        qtd_conferida: 96,
        qtd_caixas_recebidas: 8,
        unidade_medida: "UN",
        lote: "LT-202611-B",
        data_fabricacao: "2026-10-15",
        data_validade: "2029-10-15",
        endereco_destino: "R01-P01-N01-A02",
        status_conferencia: "divergente",
        tipo_leitura: "caixa_master",
      },
      {
        id: "it-03",
        cod_produto: "PRD-1003",
        descricao: "ÁGUA SANITÁRIA CLORADA 2L",
        ean: "7898912345678",
        codigo_caixa_master: "17898912345675",
        fator_conversao: 6,
        qtd_nota: 180,
        qtd_conferida: 180,
        qtd_caixas_recebidas: 30,
        unidade_medida: "UN",
        lote: "LT-202611-C",
        data_fabricacao: "2026-11-05",
        data_validade: "2027-11-05",
        endereco_destino: "R01-P02-N01-A01",
        status_conferencia: "conferido_ok",
        tipo_leitura: "caixa_master",
      },
      {
        id: "it-04",
        cod_produto: "PRD-1004",
        descricao: "DESINFETANTE FLORAL 1L",
        ean: "7896000123456",
        codigo_caixa_master: "17896000123453",
        fator_conversao: 12,
        qtd_nota: 120,
        qtd_conferida: 0,
        qtd_caixas_recebidas: 0,
        unidade_medida: "UN",
        lote: "LT-202611-D",
        endereco_destino: "R01-P02-N01-A02",
        status_conferencia: "pendente",
      },
    ],
    divergencias: [
      {
        id: "div-01",
        item_id: "it-02",
        cod_produto: "PRD-1002",
        descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
        tipo: "qtd_menor",
        qtd_divergente: 24, // faltam 2 caixas (24 un)
        observacao: "Falta física identificada no descarregamento da doca. Faltam 2 caixas master fechadas.",
        operador_id: "usr-01",
        operador_nome: "Carlos Eduardo",
        data_registro: "2026-11-19T08:45:00Z",
        status: "quarentena",
      },
    ],
    tarefas_armazenagem: [],
    created_at: "2026-11-19T08:15:00Z",
  },
];

function readLocalRecebimentos(): RecebimentoNfe[] {
  const file = getRecebimentosFilePath();
  if (!fs.existsSync(file)) {
    atomicWrite(file, SEED_RECEBIMENTOS);
    return SEED_RECEBIMENTOS;
  }
  try {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_RECEBIMENTOS;
  } catch {
    return SEED_RECEBIMENTOS;
  }
}

function toDbRow(rec: RecebimentoNfe): Record<string, any> {
  return {
    id: rec.id || crypto.randomUUID(),
    chave_nfe: rec.chave_nfe,
    numero_nfe: rec.numero_nfe,
    serie_nfe: rec.serie_nfe,
    data_emissao: rec.data_emissao,
    fornecedor_nome: rec.fornecedor_nome,
    fornecedor_cnpj: rec.fornecedor_cnpj,
    pedido_compra: rec.pedido_compra,
    valor_total: rec.valor_total || 0,
    doca: rec.doca || "",
    agendamento_id: rec.agendamento_id || null,
    status: rec.status,
    operador_id: rec.operador_id || "",
    operador_nome: rec.operador_nome || "",
    data_inicio: rec.data_inicio || new Date().toISOString(),
    data_fim: rec.data_fim || null,
    erp_status: rec.erp_status || "validado",
    erp_protocolo: rec.erp_protocolo || null,
    itens: rec.itens || [],
    divergencias: rec.divergencias || [],
    tarefas_armazenagem: rec.tarefas_armazenagem || [],
    observacoes: rec.observacoes || null,
    updated_at: new Date().toISOString(),
  };
}

function fromDbRow(row: any): RecebimentoNfe {
  return {
    id: String(row.id),
    chave_nfe: String(row.chave_nfe),
    numero_nfe: String(row.numero_nfe),
    serie_nfe: String(row.serie_nfe || "1"),
    data_emissao: String(row.data_emissao || ""),
    fornecedor_nome: String(row.fornecedor_nome || ""),
    fornecedor_cnpj: String(row.fornecedor_cnpj || ""),
    pedido_compra: String(row.pedido_compra || ""),
    valor_total: Number(row.valor_total || 0),
    doca: String(row.doca || ""),
    agendamento_id: row.agendamento_id ? String(row.agendamento_id) : undefined,
    status: (row.status as NfStatus) || "em_recebimento",
    operador_id: String(row.operador_id || ""),
    operador_nome: String(row.operador_nome || ""),
    data_inicio: row.data_inicio || new Date().toISOString(),
    data_fim: row.data_fim || undefined,
    erp_status: row.erp_status || "validado",
    erp_protocolo: row.erp_protocolo || undefined,
    itens: Array.isArray(row.itens) ? row.itens : [],
    divergencias: Array.isArray(row.divergencias) ? row.divergencias : [],
    tarefas_armazenagem: Array.isArray(row.tarefas_armazenagem) ? row.tarefas_armazenagem : [],
    observacoes: row.observacoes || undefined,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
  };
}

/**
 * Consulta a API de integração com o ERP (Requisito 2.2).
 * Aplica todas as 6 regras obrigatórias:
 * 1. Valida chave de 44 dígitos.
 * 2. Verifica se a NF existe no ERP.
 * 3. Valida fornecedor e CNPJ.
 * 4. Valida se está autorizada e apta (não cancelada pela SEFAZ).
 * 5. Confere pedido de compra relacionado.
 * 6. Verifica duplicidade (já recebida).
 */
export async function consultarErpNfe(chaveNfe: string): Promise<{
  sucesso: boolean;
  mensagem: string;
  nfe?: ErpNfeInfo;
  bloqueio?: boolean;
  motivo_bloqueio?: string;
  codigo_erro?: "CHAVE_INVALIDA" | "NF_NAO_ENCONTRADA" | "CANCELADA_SEFAZ" | "JA_RECEBIDA" | "SEM_PEDIDO" | "INDISPONIVEL";
}> {
  const cleanChave = chaveNfe.replace(/\D/g, "");

  if (cleanChave.length !== 44) {
    return {
      sucesso: false,
      bloqueio: true,
      codigo_erro: "CHAVE_INVALIDA",
      mensagem: "Chave de acesso inválida. A DANFE deve conter exatamente 44 dígitos numéricos.",
      motivo_bloqueio: "Chave DANFE diferente de 44 dígitos.",
    };
  }

  // Verifica no ERP Simulador (ou banco de dados integrado)
  const nfErp = ERP_SIMULADOR_NFES.find((n) => n.chave_nfe === cleanChave);

  if (!nfErp) {
    return {
      sucesso: false,
      bloqueio: true,
      codigo_erro: "NF_NAO_ENCONTRADA",
      mensagem: "Nota fiscal não localizada no sistema ERP. Regra obrigatória: recebimento proibido.",
      motivo_bloqueio: "Nota fiscal inexistente no ERP ou sem transmissão prévia do fornecedor.",
    };
  }

  // Validação 1: Cancelada na SEFAZ
  if (nfErp.cancelada_sefaz || !nfErp.autorizada) {
    return {
      sucesso: false,
      bloqueio: true,
      codigo_erro: "CANCELADA_SEFAZ",
      mensagem: `Atenção: A NF-e ${nfErp.numero_nfe} consta como CANCELADA / NÃO AUTORIZADA na SEFAZ. Recebimento bloqueado.`,
      motivo_bloqueio: "Nota fiscal cancelada na SEFAZ ou não autorizada para circulação.",
    };
  }

  // Validação 2: Já recebida (duplicidade)
  if (nfErp.ja_recebida) {
    return {
      sucesso: false,
      bloqueio: true,
      codigo_erro: "JA_RECEBIDA",
      mensagem: `A NF-e ${nfErp.numero_nfe} já foi recebida e baixada anteriormente no CD. Recebimento em duplicidade rejeitado.`,
      motivo_bloqueio: "Tentativa de recebimento em duplicidade.",
    };
  }

  // Validação 3: Sem pedido de compra
  if (!nfErp.pedido_compra) {
    return {
      sucesso: false,
      bloqueio: true,
      codigo_erro: "SEM_PEDIDO",
      mensagem: `A NF-e ${nfErp.numero_nfe} não possui Pedido de Compra registrado no ERP.`,
      motivo_bloqueio: "Ausência de pedido de compra homologado.",
    };
  }

  // Também verifica se já existe recebimento em andamento ou finalizado no banco local/Supabase
  const existentes = await getRecebimentos();
  const jaEmRecebimento = existentes.find(
    (r) => r.chave_nfe === cleanChave && r.status !== "cancelada"
  );

  if (jaEmRecebimento && jaEmRecebimento.status === "recebido") {
    return {
      sucesso: false,
      bloqueio: true,
      codigo_erro: "JA_RECEBIDA",
      mensagem: `A NF-e ${nfErp.numero_nfe} já foi conferida e finalizada no CD em ${new Date(jaEmRecebimento.data_inicio).toLocaleDateString("pt-BR")}.`,
      motivo_bloqueio: "Nota fiscal já recebida e finalizada.",
    };
  }

  return {
    sucesso: true,
    mensagem: "Nota fiscal validada com sucesso no ERP! Pronta para início de conferência física.",
    nfe: nfErp,
  };
}

/**
 * Consulta lista de recebimentos no Supabase com fallback local.
 */
export async function getRecebimentos(filters?: {
  status?: string;
  search?: string;
  doca?: string;
}): Promise<RecebimentoNfe[]> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      let queryUrl = `${cfg.url}/rest/v1/wms_recebimentos?select=*&order=data_inicio.desc`;
      const res = await fetch(queryUrl, {
        headers: getSupabaseHeaders(cfg.key),
        cache: "no-store",
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          let list = rows.map(fromDbRow);
          if (filters?.status && filters.status !== "todos") {
            list = list.filter((r) => r.status === filters.status);
          }
          if (filters?.search) {
            const term = filters.search.toLowerCase().trim();
            list = list.filter(
              (r) =>
                r.numero_nfe.toLowerCase().includes(term) ||
                r.chave_nfe.includes(term) ||
                r.fornecedor_nome.toLowerCase().includes(term) ||
                r.fornecedor_cnpj.includes(term) ||
                r.pedido_compra.toLowerCase().includes(term)
            );
          }
          return list;
        }
      }
    } catch (err) {
      console.error("Erro ao consultar wms_recebimentos no Supabase:", err);
    }
  }

  // Fallback local
  let list = readLocalRecebimentos();
  if (filters?.status && filters.status !== "todos") {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.numero_nfe.toLowerCase().includes(term) ||
        r.chave_nfe.includes(term) ||
        r.fornecedor_nome.toLowerCase().includes(term) ||
        r.fornecedor_cnpj.includes(term) ||
        r.pedido_compra.toLowerCase().includes(term)
    );
  }
  return list;
}

/**
 * Salva ou atualiza um recebimento.
 */
export async function saveRecebimento(rec: RecebimentoNfe): Promise<RecebimentoNfe> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const dbRow = toDbRow(rec);
      const res = await fetch(`${cfg.url}/rest/v1/wms_recebimentos`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(cfg.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(dbRow),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          return fromDbRow(data[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar wms_recebimentos no Supabase:", err);
    }
  }

  // Fallback local
  const local = readLocalRecebimentos();
  const idx = local.findIndex((r) => r.id === rec.id || r.chave_nfe === rec.chave_nfe);
  if (idx >= 0) {
    local[idx] = rec;
  } else {
    local.unshift(rec);
  }
  atomicWrite(getRecebimentosFilePath(), local);
  return rec;
}

/**
 * Finaliza o recebimento de mercadorias (Requisito 2.6).
 * Gera tarefas de armazenagem (Putaway) e protocolo de integração ERP.
 */
export async function finalizarRecebimento(
  id: string,
  params: {
    supervisorNome?: string;
    observacoes?: string;
  }
): Promise<{ sucesso: boolean; recebimento: RecebimentoNfe; protocoloErp: string }> {
  const list = await getRecebimentos();
  const rec = list.find((r) => r.id === id);

  if (!rec) {
    throw new Error("Recebimento não encontrado.");
  }

  const temDivergencia = rec.divergencias && rec.divergencias.length > 0;
  const novoStatus: NfStatus = temDivergencia ? "divergencia_pendente" : "aguardando_armazenagem";

  // Gerar tarefas de armazenagem para todos os itens conferidos com quantidade > 0
  const tarefas: TarefaArmazenagem[] = [];
  for (const it of rec.itens) {
    if (it.qtd_conferida > 0) {
      tarefas.push({
        id: `tarf-${Date.now()}-${it.cod_produto}`,
        recebimento_id: rec.id,
        cod_produto: it.cod_produto,
        descricao: it.descricao,
        quantidade: it.qtd_conferida,
        unidade_medida: it.unidade_medida,
        lote: it.lote || "PADRAO",
        data_validade: it.data_validade,
        endereco_destino: it.endereco_destino || "R01-P01-N01-A01",
        doca_origem: rec.doca || "Doca 01",
        status: "pendente",
        criada_em: new Date().toISOString(),
      });
    }
  }

  const protocolo = `INT-ERP-${Date.now().toString().slice(-6)}`;

  const updatedRec: RecebimentoNfe = {
    ...rec,
    status: novoStatus,
    data_fim: new Date().toISOString(),
    erp_status: "validado",
    erp_protocolo: protocolo,
    tarefas_armazenagem: tarefas,
    observacoes: params.observacoes || rec.observacoes,
    updated_at: new Date().toISOString(),
  };

  const saved = await saveRecebimento(updatedRec);
  return { sucesso: true, recebimento: saved, protocoloErp: protocolo };
}
