export type NfStatus =
  | "agendada"
  | "em_doca"
  | "em_recebimento"
  | "quarentena"
  | "aguardando_armazenagem"
  | "recebido"
  | "cancelada"
  | "bloqueada"
  | "recebimento_parcial"
  | "divergencia_pendente";

export type DivergenciaTipo =
  | "qtd_menor"
  | "qtd_maior"
  | "produto_diferente"
  | "produto_nao_identificado"
  | "lote_divergente"
  | "validade_vencida"
  | "produto_danificado"
  | "sem_identificacao"
  | "embalagem_violada";

export const DIVERGENCIA_LABELS: Record<DivergenciaTipo, { label: string; severidade: "alta" | "media" | "baixa" }> = {
  qtd_menor: { label: "Quantidade menor que a NF (Falta)", severidade: "alta" },
  qtd_maior: { label: "Quantidade maior que a NF (Sobra)", severidade: "media" },
  produto_diferente: { label: "Produto diferente do pedido", severidade: "alta" },
  produto_nao_identificado: { label: "Produto não identificado", severidade: "alta" },
  lote_divergente: { label: "Lote divergente da NF/Pedido", severidade: "media" },
  validade_vencida: { label: "Validade vencida / Abaixo do Shelf Life", severidade: "alta" },
  produto_danificado: { label: "Produto danificado / Avariado", severidade: "alta" },
  sem_identificacao: { label: "Produto sem identificação ou código ilegível", severidade: "media" },
  embalagem_violada: { label: "Embalagem violada ou avariada", severidade: "alta" },
};

export const STATUS_NF_CONFIG: Record<
  NfStatus,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  agendada: {
    label: "Agendada",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    desc: "Nota fiscal vinculada a agendamento de entrega",
  },
  em_doca: {
    label: "Em Doca",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    desc: "Veículo estacionado na doca aguardando conferência",
  },
  em_recebimento: {
    label: "Em Recebimento",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    desc: "Conferência física e fiscal em andamento pelo operador",
  },
  quarentena: {
    label: "Quarentena",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    desc: "Produtos retidos por divergências ou pendências de qualidade",
  },
  aguardando_armazenagem: {
    label: "Aguardando Armazenagem",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    desc: "Conferência concluída e produtos liberados para putaway",
  },
  recebido: {
    label: "Recebido (Concluído)",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    desc: "Processo finalizado, ERP atualizado e estoque integrado",
  },
  cancelada: {
    label: "Cancelada",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    desc: "Operação cancelada antes da finalização",
  },
  bloqueada: {
    label: "Bloqueada",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    desc: "Bloqueio fiscal, jurídico ou administrativo",
  },
  recebimento_parcial: {
    label: "Recebimento Parcial",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    desc: "Apenas parte da carga foi autorizada ou conferida",
  },
  divergencia_pendente: {
    label: "Divergência Pendente",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    desc: "Divergência aguardando parecer de supervisor/gerente",
  },
};

export interface RecebimentoItem {
  id: string;
  cod_produto: string;
  descricao: string;
  ean: string;
  codigo_caixa_master?: string; // Código de barras da caixa fechada
  fator_conversao: number; // Ex: 12 unidades por caixa master (padrão: 1)
  qtd_nota: number; // Quantidade informada na NF em unidades
  qtd_conferida: number; // Quantidade física recebida (em unidades)
  qtd_caixas_recebidas?: number; // Contagem de caixas master se aplicável
  unidade_medida: string; // UN, CX, FD, KG, etc.
  lote: string;
  data_fabricacao?: string; // YYYY-MM-DD
  data_validade?: string; // YYYY-MM-DD
  numero_serie?: string;
  endereco_destino: string; // Endereço de armazenagem sugerido (ex: R01-P02-A05-N02)
  status_conferencia: "pendente" | "conferido_ok" | "divergente" | "parcial";
  tipo_leitura?: "caixa_master" | "ean" | "sku" | "qrcode" | "manual";
}

export interface DecisaoGestor {
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_cargo: string;
  data_decisao: string;
  acao: "aprovar_com_ressalva" | "devolver_ao_fornecedor" | "descarte" | "ajustar_nota";
  motivo: string;
}

export interface DivergenciaRegistro {
  id: string;
  item_id: string;
  cod_produto: string;
  descricao: string;
  tipo: DivergenciaTipo;
  qtd_divergente: number;
  observacao: string;
  foto_url?: string; // Foto da avaria / evidência (base64 ou link)
  operador_id: string;
  operador_nome: string;
  data_registro: string;
  status: "quarentena" | "analisada" | "liberada" | "rejeitada";
  decisao_gestor?: DecisaoGestor;
}

export interface TarefaArmazenagem {
  id: string;
  recebimento_id: string;
  cod_produto: string;
  descricao: string;
  quantidade: number;
  unidade_medida: string;
  lote: string;
  data_validade?: string;
  endereco_destino: string;
  doca_origem: string;
  status: "pendente" | "em_transporte" | "armazenado";
  operador_id?: string;
  operador_nome?: string;
  criada_em: string;
  concluida_em?: string;
}

export interface RecebimentoNfe {
  id: string;
  chave_nfe: string; // 44 dígitos
  numero_nfe: string;
  serie_nfe: string;
  data_emissao: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  pedido_compra: string;
  valor_total: number;
  doca: string;
  agendamento_id?: string;
  status: NfStatus;
  operador_id: string;
  operador_nome: string;
  data_inicio: string;
  data_fim?: string;
  erp_status: "validado" | "pendente" | "rejeitado";
  erp_protocolo?: string;
  itens: RecebimentoItem[];
  divergencias: DivergenciaRegistro[];
  tarefas_armazenagem: TarefaArmazenagem[];
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Base de Simulação do ERP com Notas Fiscais para validação de regras de negócio:
 * 1. NF existente e autorizada
 * 2. NF cancelada na SEFAZ (bloqueio obrigatório)
 * 3. NF já recebida (duplicidade)
 * 4. NF sem pedido de compra vinculado
 */
export interface ErpNfeInfo {
  chave_nfe: string;
  numero_nfe: string;
  serie_nfe: string;
  data_emissao: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  pedido_compra: string;
  valor_total: number;
  autorizada: boolean;
  cancelada_sefaz: boolean;
  ja_recebida: boolean;
  status_erp: "autorizada" | "cancelada" | "ja_recebida" | "sem_pedido";
  itens: {
    cod_produto: string;
    descricao: string;
    ean: string;
    codigo_caixa_master?: string;
    fator_conversao: number;
    qtd_nota: number;
    unidade_medida: string;
    lote_sugerido: string;
    validade_meses: number;
    endereco_sugerido: string;
  }[];
}

export const ERP_SIMULADOR_NFES: ErpNfeInfo[] = [
  {
    chave_nfe: "35261112345678000199550010000123451098765432",
    numero_nfe: "000.012.345",
    serie_nfe: "1",
    data_emissao: "2026-11-18",
    fornecedor_nome: "DISTRIBUIDORA NACIONAL DE ALIMENTOS S.A.",
    fornecedor_cnpj: "12.345.678/0001-99",
    pedido_compra: "PC-98421",
    valor_total: 48920.0,
    autorizada: true,
    cancelada_sefaz: false,
    ja_recebida: false,
    status_erp: "autorizada",
    itens: [
      {
        cod_produto: "PRD-1001",
        descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
        ean: "7891000315507",
        codigo_caixa_master: "17891000315504",
        fator_conversao: 24, // 1 caixa master = 24 frascos
        qtd_nota: 240, // 10 caixas
        unidade_medida: "UN",
        lote_sugerido: "LT-202611-A",
        validade_meses: 24,
        endereco_sugerido: "R01-P01-A01-N01",
      },
      {
        cod_produto: "PRD-1002",
        descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
        ean: "7891234567895",
        codigo_caixa_master: "17891234567892",
        fator_conversao: 12, // 1 caixa master = 12 pacotes
        qtd_nota: 120, // 10 caixas
        unidade_medida: "UN",
        lote_sugerido: "LT-202611-B",
        validade_meses: 36,
        endereco_sugerido: "R01-P01-A02-N01",
      },
      {
        cod_produto: "PRD-1003",
        descricao: "ÁGUA SANITÁRIA CLORADA 2L",
        ean: "7898912345678",
        codigo_caixa_master: "17898912345675",
        fator_conversao: 6, // 1 caixa master = 6 galões
        qtd_nota: 180, // 30 caixas
        unidade_medida: "UN",
        lote_sugerido: "LT-202611-C",
        validade_meses: 12,
        endereco_sugerido: "R01-P02-A01-N01",
      },
      {
        cod_produto: "PRD-1004",
        descricao: "DESINFETANTE FLORAL 1L",
        ean: "7896000123456",
        codigo_caixa_master: "17896000123453",
        fator_conversao: 12,
        qtd_nota: 120,
        unidade_medida: "UN",
        lote_sugerido: "LT-202611-D",
        validade_meses: 24,
        endereco_sugerido: "R01-P02-A02-N01",
      },
    ],
  },
  {
    chave_nfe: "35261122334455000188550010000987651012345678",
    numero_nfe: "000.098.765",
    serie_nfe: "2",
    data_emissao: "2026-11-18",
    fornecedor_nome: "INDÚSTRIA QUÍMICA PAULISTA LTDA",
    fornecedor_cnpj: "22.334.455/0001-88",
    pedido_compra: "PC-98430",
    valor_total: 19450.0,
    autorizada: true,
    cancelada_sefaz: false,
    ja_recebida: false,
    status_erp: "autorizada",
    itens: [
      {
        cod_produto: "PRD-1005",
        descricao: "CANETA ESFEROGRÁFICA AZUL 1.0MM",
        ean: "7891000315507",
        codigo_caixa_master: "CX-MASTER-CANETA-50",
        fator_conversao: 50,
        qtd_nota: 500,
        unidade_medida: "UN",
        lote_sugerido: "LT-EXP-99",
        validade_meses: 48,
        endereco_sugerido: "R02-P01-A01-N02",
      },
      {
        cod_produto: "PRD-1006",
        descricao: "PAPEL SULFITE A4 75G PCT 500 FLS",
        ean: "7891027116521",
        codigo_caixa_master: "CX-MASTER-SULFITE-10",
        fator_conversao: 10,
        qtd_nota: 100,
        unidade_medida: "CX",
        lote_sugerido: "LT-PAPEL-01",
        validade_meses: 60,
        endereco_sugerido: "R02-P01-A02-N01",
      },
    ],
  },
  {
    chave_nfe: "35261199999999000177550010000666661099999999",
    numero_nfe: "000.066.666",
    serie_nfe: "1",
    data_emissao: "2026-11-15",
    fornecedor_nome: "COMERCIAL CANCELADA SEFAZ LTDA",
    fornecedor_cnpj: "99.999.999/0001-77",
    pedido_compra: "PC-98111",
    valor_total: 12000.0,
    autorizada: false,
    cancelada_sefaz: true,
    ja_recebida: false,
    status_erp: "cancelada",
    itens: [],
  },
  {
    chave_nfe: "35261188888888000166550010000777771088888888",
    numero_nfe: "000.077.777",
    serie_nfe: "1",
    data_emissao: "2026-11-10",
    fornecedor_nome: "FORNECEDOR JÁ RECEBIDO S.A.",
    fornecedor_cnpj: "88.888.888/0001-66",
    pedido_compra: "PC-97999",
    valor_total: 35000.0,
    autorizada: true,
    cancelada_sefaz: false,
    ja_recebida: true,
    status_erp: "ja_recebida",
    itens: [],
  },
];
