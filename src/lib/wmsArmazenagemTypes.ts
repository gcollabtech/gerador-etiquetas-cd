export type EnderecoTipo =
  | "recebimento"
  | "quarentena"
  | "pulmao"
  | "pulmao_flow_rack"
  | "porta_paletes"
  | "flow_rack"
  | "picking"
  | "separacao"
  | "conferencia"
  | "expedicao"
  | "devolucao"
  | "avaria"
  | "bloqueado";

export type EnderecoStatus =
  | "livre"
  | "ocupado"
  | "parcialmente_ocupado"
  | "bloqueado"
  | "manutencao";

export type CurvaAbc = "A" | "B" | "C";

export type RegraEstoque = "FEFO" | "FIFO" | "LIFO" | "MANUAL";

export interface ProdutoAlocado {
  id: string;
  produto_id: string;
  codigo: string;
  descricao: string;
  ean: string;
  lote: string;
  data_fabricacao?: string; // YYYY-MM-DD
  data_validade?: string;   // YYYY-MM-DD
  quantidade: number;
  unidade_medida: string;
  peso_unit_kg: number;
  volume_unit_m3: number;
  categoria: string;
  curva_abc: CurvaAbc;
  data_entrada: string;     // ISO ou YYYY-MM-DD
  dias_sem_movimentacao: number;
  temperatura_exigida?: string;
}

export interface WmsEndereco {
  id: string;
  codigo: string;           // Ex: A-02-03-04-01
  setor: string;            // A, B, C, Frio, Quimico
  rua: string;              // 01, 02, 03...
  predio: string;           // 01, 02, 03... (Módulo)
  coluna?: string;          // 01, 02
  nivel: string;            // 01, 02, 03, 04, 05
  posicao: string;          // 01, 02
  tipo: EnderecoTipo;
  status: EnderecoStatus;
  peso_max_kg: number;
  peso_atual_kg: number;
  volume_max_m3: number;
  volume_atual_m3: number;
  curva_abc_permitida: string; // A, B, C, todas
  temperatura: string;         // ambiente, refrigerado, congelado
  categoria_permitida?: string;
  motivo_bloqueio?: string;
  bloqueado_em?: string;
  bloqueado_por?: string;
  produtos_alocados: ProdutoAlocado[];
  created_at?: string;
  updated_at?: string;
}

export interface WmsMovimentacao {
  id: string;
  produto_id: string;
  produto_codigo: string;
  produto_descricao: string;
  ean?: string;
  lote?: string;
  data_validade?: string;
  quantidade: number;
  unidade_medida: string;
  origem_endereco: string;
  destino_endereco: string;
  regra_estoque: RegraEstoque;
  motivo: string;
  observacao?: string;
  usuario_id?: string;
  usuario_nome: string;
  created_at: string;
}

export interface SugestaoSlottingInput {
  cod_produto: string;
  descricao: string;
  categoria: string;
  curva_abc: CurvaAbc;
  quantidade: number;
  peso_total_kg: number;
  volume_total_m3: number;
  dimensoes?: {
    comprimento_cm: number;
    largura_cm: number;
    altura_cm: number;
  };
  lote?: string;
  data_validade?: string;
  exige_refrigeracao?: boolean;
  inflamavel_quimico?: boolean;
}

export interface SugestaoSlottingResultado {
  endereco: WmsEndereco;
  score: number; // 0 a 100
  motivos_recomendacao: string[];
  nivel_ergonomico: "chao_picking" | "medio_ergonomico" | "aereo_pulmao";
  curva_adequada: boolean;
  seguranca_peso_ok: boolean;
}

export const ENDERECO_TIPO_CONFIG: Record<
  EnderecoTipo,
  {
    label: string;
    badge: string;
    cor: string;
    bgBadge: string;
    descricao: string;
  }
> = {
  recebimento: {
    label: "Recebimento",
    badge: "REC",
    cor: "text-sky-400",
    bgBadge: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    descricao: "Doca e pulmão transitório de recepção e descarregamento",
  },
  quarentena: {
    label: "Quarentena",
    badge: "QUA",
    cor: "text-amber-400",
    bgBadge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    descricao: "Área isolada para produtos com pendência de qualidade ou inspeção",
  },
  pulmao: {
    label: "Pulmão",
    badge: "PUL",
    cor: "text-indigo-400",
    bgBadge: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
    descricao: "Estocagem aérea de pallets fechados para ressuprimento",
  },
  pulmao_flow_rack: {
    label: "Pulmão Flow Rack",
    badge: "PFR",
    cor: "text-violet-400",
    bgBadge: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    descricao: "Pulmão de apoio imediato aos trilhos do Flow Rack",
  },
  porta_paletes: {
    label: "Porta-paletes",
    badge: "PAL",
    cor: "text-blue-400",
    bgBadge: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    descricao: "Estrutura vertical para pallets de alta densidade",
  },
  flow_rack: {
    label: "Flow Rack",
    badge: "FLW",
    cor: "text-cyan-400",
    bgBadge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    descricao: "Pistas rolantes com gravidade para separação rápida fracionada",
  },
  picking: {
    label: "Picking",
    badge: "PCK",
    cor: "text-emerald-400",
    bgBadge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    descricao: "Posição ergonômica de chão/nível 01 para coleta de pedidos",
  },
  separacao: {
    label: "Separação",
    badge: "SEP",
    cor: "text-teal-400",
    bgBadge: "bg-teal-500/10 border-teal-500/30 text-teal-400",
    descricao: "Área de consolidação e separação de lotes de pedidos",
  },
  conferencia: {
    label: "Conferência",
    badge: "CNF",
    cor: "text-purple-400",
    bgBadge: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    descricao: "Bancadas de checagem física de itens antes do despacho",
  },
  expedicao: {
    label: "Expedição",
    badge: "EXP",
    cor: "text-orange-400",
    bgBadge: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    descricao: "Doca de saída e agrupamento por rota de entrega",
  },
  devolucao: {
    label: "Devolução",
    badge: "DEV",
    cor: "text-pink-400",
    bgBadge: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    descricao: "Triagem de retorno de mercadorias e reentrega",
  },
  avaria: {
    label: "Avaria",
    badge: "AVR",
    cor: "text-rose-500",
    bgBadge: "bg-rose-500/10 border-rose-500/30 text-rose-500",
    descricao: "Área segregada para produtos danificados ou violados",
  },
  bloqueado: {
    label: "Bloqueado",
    badge: "BLQ",
    cor: "text-red-400",
    bgBadge: "bg-red-500/10 border-red-500/30 text-red-400",
    descricao: "Posição com interdição física, fiscal ou de manutenção",
  },
};

export const MOTIVOS_MOVIMENTACAO = [
  "Ressuprimento de Picking",
  "Slotting / Reorganização Inteligente (IA)",
  "Armazenagem de Carga Recebida",
  "Transferência de Pulmão para Porta-Palete",
  "Envio para Quarentena de Qualidade",
  "Envio para Área de Avarias",
  "Desbloqueio e Liberação Operacional",
  "Ajuste Físico de Inventário",
  "Devolução ao Fornecedor",
] as const;

// Helper para formatar o código do endereço
export function formatarCodigoEndereco(
  setor: string,
  rua: string,
  predio: string,
  nivel: string,
  posicao: string,
  coluna?: string
): string {
  const s = (setor || "A").toUpperCase().trim();
  const r = String(rua).padStart(2, "0");
  const p = String(predio).padStart(2, "0");
  const n = String(nivel).padStart(2, "0");
  const pos = String(posicao).padStart(2, "0");
  if (coluna && coluna.trim()) {
    const col = String(coluna).padStart(2, "0");
    return `${s}-${r}-${p}-${col}-${n}-${pos}`;
  }
  return `${s}-${r}-${p}-${n}-${pos}`;
}

// Decompõe código para filtros
export function decomporCodigoEndereco(codigo: string) {
  const partes = codigo.split("-");
  if (partes.length >= 5) {
    return {
      setor: partes[0],
      rua: partes[1],
      predio: partes[2],
      nivel: partes[3],
      posicao: partes[4],
    };
  }
  return {
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "01",
    posicao: "01",
  };
}

// SEED DE ENDEREÇOS DO CD BARUERI (Simulação Rica e Realista)
export const SEED_ENDERECOS: WmsEndereco[] = [
  // RUA 01 - Setor A (Alto Giro - Curva A - Picking + Porta-Paletes)
  {
    id: "end-a01-01-01-01",
    codigo: "A-01-01-01-01",
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "picking",
    status: "ocupado",
    peso_max_kg: 1000,
    peso_atual_kg: 420,
    volume_max_m3: 2.0,
    volume_atual_m3: 1.4,
    curva_abc_permitida: "A",
    temperatura: "ambiente",
    categoria_permitida: "Bebidas",
    produtos_alocados: [
      {
        id: "prod-aloc-1",
        produto_id: "p-001",
        codigo: "BEB-COCA-2L",
        descricao: "Refrigerante Coca-Cola 2L Pet (Fardo c/ 6)",
        ean: "7894900010015",
        lote: "L-2026A",
        data_fabricacao: "2026-10-01",
        data_validade: "2027-04-01",
        quantidade: 140,
        unidade_medida: "FD",
        peso_unit_kg: 3.0,
        volume_unit_m3: 0.01,
        categoria: "Bebidas",
        curva_abc: "A",
        data_entrada: "2026-11-10",
        dias_sem_movimentacao: 2,
      },
    ],
  },
  {
    id: "end-a01-01-01-02",
    codigo: "A-01-01-01-02",
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "01",
    posicao: "02",
    tipo: "picking",
    status: "livre",
    peso_max_kg: 1000,
    peso_atual_kg: 0,
    volume_max_m3: 2.0,
    volume_atual_m3: 0,
    curva_abc_permitida: "A",
    temperatura: "ambiente",
    categoria_permitida: "Bebidas",
    produtos_alocados: [],
  },
  {
    id: "end-a01-01-02-01",
    codigo: "A-01-01-02-01",
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "02",
    posicao: "01",
    tipo: "porta_paletes",
    status: "ocupado",
    peso_max_kg: 1200,
    peso_atual_kg: 850,
    volume_max_m3: 2.4,
    volume_atual_m3: 1.9,
    curva_abc_permitida: "A",
    temperatura: "ambiente",
    categoria_permitida: "Bebidas",
    produtos_alocados: [
      {
        id: "prod-aloc-2",
        produto_id: "p-002",
        codigo: "BEB-CERV-HEIN-LATA",
        descricao: "Cerveja Heineken Lata 350ml (Pack c/ 12)",
        ean: "7896045505417",
        lote: "L-9984",
        data_fabricacao: "2026-09-15",
        data_validade: "2026-12-15", // Próximo ao vencimento (< 30 dias)
        quantidade: 190,
        unidade_medida: "CX",
        peso_unit_kg: 4.47,
        volume_unit_m3: 0.01,
        categoria: "Bebidas",
        curva_abc: "A",
        data_entrada: "2026-10-05",
        dias_sem_movimentacao: 5,
      },
    ],
  },
  {
    id: "end-a01-01-03-01",
    codigo: "A-01-01-03-01",
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "03",
    posicao: "01",
    tipo: "pulmao",
    status: "ocupado",
    peso_max_kg: 1200,
    peso_atual_kg: 600,
    volume_max_m3: 2.4,
    volume_atual_m3: 1.8,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [
      {
        id: "prod-aloc-3",
        produto_id: "p-003",
        codigo: "ALIM-ARROZ-5KG",
        descricao: "Arroz Branco Tipo 1 5kg (Fardo c/ 6)",
        ean: "7891000315507",
        lote: "LT-ARROZ-01",
        data_fabricacao: "2026-08-01",
        data_validade: "2027-08-01",
        quantidade: 20,
        unidade_medida: "FD",
        peso_unit_kg: 30,
        volume_unit_m3: 0.09,
        categoria: "Alimentos",
        curva_abc: "B",
        data_entrada: "2026-09-01",
        dias_sem_movimentacao: 45, // Sem movimentação > 30 dias
      },
    ],
  },
  {
    id: "end-a01-01-04-01",
    codigo: "A-01-01-04-01",
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "04",
    posicao: "01",
    tipo: "pulmao",
    status: "livre",
    peso_max_kg: 1000,
    peso_atual_kg: 0,
    volume_max_m3: 2.4,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },
  {
    id: "end-a01-01-05-01",
    codigo: "A-01-01-05-01",
    setor: "A",
    rua: "01",
    predio: "01",
    nivel: "05",
    posicao: "01",
    tipo: "pulmao",
    status: "bloqueado",
    peso_max_kg: 800,
    peso_atual_kg: 0,
    volume_max_m3: 2.4,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    motivo_bloqueio: "Longarina avariada - Manutenção programada preditiva",
    bloqueado_em: "2026-11-15T08:00:00Z",
    bloqueado_por: "Eng. Manutenção Carlos",
    produtos_alocados: [],
  },

  // RUA 01 - Predio 02
  {
    id: "end-a01-02-01-01",
    codigo: "A-01-02-01-01",
    setor: "A",
    rua: "01",
    predio: "02",
    nivel: "01",
    posicao: "01",
    tipo: "flow_rack",
    status: "ocupado",
    peso_max_kg: 600,
    peso_atual_kg: 280,
    volume_max_m3: 1.5,
    volume_atual_m3: 0.9,
    curva_abc_permitida: "A",
    temperatura: "ambiente",
    categoria_permitida: "Medicamentos",
    produtos_alocados: [
      {
        id: "prod-aloc-4",
        produto_id: "p-004",
        codigo: "FAR-DIPIRONA-500MG",
        descricao: "Dipirona Monoidratada 500mg Caixa c/ 20 comp",
        ean: "7896714201017",
        lote: "DP-2026-44",
        data_fabricacao: "2026-01-10",
        data_validade: "2027-01-10",
        quantidade: 850,
        unidade_medida: "CX",
        peso_unit_kg: 0.05,
        volume_unit_m3: 0.0005,
        categoria: "Medicamentos",
        curva_abc: "A",
        data_entrada: "2026-11-12",
        dias_sem_movimentacao: 1,
      },
    ],
  },
  {
    id: "end-a01-02-02-01",
    codigo: "A-01-02-02-01",
    setor: "A",
    rua: "01",
    predio: "02",
    nivel: "02",
    posicao: "01",
    tipo: "pulmao_flow_rack",
    status: "ocupado",
    peso_max_kg: 800,
    peso_atual_kg: 340,
    volume_max_m3: 1.8,
    volume_atual_m3: 1.1,
    curva_abc_permitida: "A",
    temperatura: "ambiente",
    produtos_alocados: [
      {
        id: "prod-aloc-5",
        produto_id: "p-005",
        codigo: "FAR-PARACETAMOL-750",
        descricao: "Paracetamol 750mg Blister c/ 10 comp",
        ean: "7896714202021",
        lote: "PC-9912",
        data_fabricacao: "2025-11-01",
        data_validade: "2026-12-01", // Próximo ao vencimento (< 20 dias!)
        quantidade: 1200,
        unidade_medida: "CX",
        peso_unit_kg: 0.04,
        volume_unit_m3: 0.0004,
        categoria: "Medicamentos",
        curva_abc: "A",
        data_entrada: "2026-06-10",
        dias_sem_movimentacao: 72, // Sem movimentação > 60 dias!
      },
    ],
  },
  {
    id: "end-a01-02-03-01",
    codigo: "A-01-02-03-01",
    setor: "A",
    rua: "01",
    predio: "02",
    nivel: "03",
    posicao: "01",
    tipo: "porta_paletes",
    status: "livre",
    peso_max_kg: 1200,
    peso_atual_kg: 0,
    volume_max_m3: 2.4,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },

  // RUA 02 - Setor A (Porta-Paletes e Pulmão Geral)
  {
    id: "end-a02-01-01-01",
    codigo: "A-02-01-01-01",
    setor: "A",
    rua: "02",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "picking",
    status: "ocupado",
    peso_max_kg: 1200,
    peso_atual_kg: 520,
    volume_max_m3: 2.0,
    volume_atual_m3: 1.6,
    curva_abc_permitida: "B",
    temperatura: "ambiente",
    categoria_permitida: "Higiene",
    produtos_alocados: [
      {
        id: "prod-aloc-6",
        produto_id: "p-006",
        codigo: "HIG-SABONETE-DOVE",
        descricao: "Sabonete Dove Original 90g (Pack c/ 6)",
        ean: "7891150041234",
        lote: "DV-5510",
        data_fabricacao: "2026-05-01",
        data_validade: "2028-05-01",
        quantidade: 300,
        unidade_medida: "PCT",
        peso_unit_kg: 0.55,
        volume_unit_m3: 0.002,
        categoria: "Higiene",
        curva_abc: "B",
        data_entrada: "2026-10-20",
        dias_sem_movimentacao: 15,
      },
    ],
  },
  {
    id: "end-a02-01-02-01",
    codigo: "A-02-01-02-01",
    setor: "A",
    rua: "02",
    predio: "01",
    nivel: "02",
    posicao: "01",
    tipo: "porta_paletes",
    status: "livre",
    peso_max_kg: 1200,
    peso_atual_kg: 0,
    volume_max_m3: 2.4,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },
  {
    id: "end-a02-01-03-01",
    codigo: "A-02-01-03-01",
    setor: "A",
    rua: "02",
    predio: "01",
    nivel: "03",
    posicao: "01",
    tipo: "porta_paletes",
    status: "ocupado",
    peso_max_kg: 1200,
    peso_atual_kg: 920,
    volume_max_m3: 2.4,
    volume_atual_m3: 2.1,
    curva_abc_permitida: "C",
    temperatura: "ambiente",
    produtos_alocados: [
      {
        id: "prod-aloc-7",
        produto_id: "p-007",
        codigo: "ELET-VENTILADOR-40CM",
        descricao: "Ventilador de Mesa 40cm 127V Mondial",
        ean: "7899882200114",
        lote: "VN-2025-09",
        data_fabricacao: "2025-09-01",
        data_validade: "2030-01-01",
        quantidade: 80,
        unidade_medida: "CX",
        peso_unit_kg: 2.8,
        volume_unit_m3: 0.03,
        categoria: "Eletro",
        curva_abc: "C",
        data_entrada: "2026-07-15",
        dias_sem_movimentacao: 95, // Sem movimentação > 90 dias (obsoleto)
      },
    ],
  },

  // ÁREAS ESPECIAIS (Quarentena, Avaria, Recebimento, Expedição, Separação, Conferência, Devolução)
  {
    id: "end-rec-doca-01",
    codigo: "REC-DOCA-01",
    setor: "DOCAS",
    rua: "00",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "recebimento",
    status: "ocupado",
    peso_max_kg: 15000,
    peso_atual_kg: 4200,
    volume_max_m3: 40.0,
    volume_atual_m3: 18.0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [
      {
        id: "prod-rec-1",
        produto_id: "p-rec-1",
        codigo: "ALIM-AZEITE-500ML",
        descricao: "Azeite de Oliva Extra Virgem 500ml (Cx c/ 12)",
        ean: "7891000100448",
        lote: "AZ-2026-11",
        data_fabricacao: "2026-10-10",
        data_validade: "2028-10-10",
        quantidade: 120,
        unidade_medida: "CX",
        peso_unit_kg: 7.2,
        volume_unit_m3: 0.02,
        categoria: "Alimentos",
        curva_abc: "A",
        data_entrada: "2026-11-19",
        dias_sem_movimentacao: 0,
      },
    ],
  },
  {
    id: "end-qua-box-01",
    codigo: "QUA-BOX-01",
    setor: "QUALIDADE",
    rua: "99",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "quarentena",
    status: "ocupado",
    peso_max_kg: 5000,
    peso_atual_kg: 1200,
    volume_max_m3: 15.0,
    volume_atual_m3: 4.5,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    motivo_bloqueio: "Aguardando laudo de controle de pragas e inspeção física",
    produtos_alocados: [
      {
        id: "prod-qua-1",
        produto_id: "p-qua-1",
        codigo: "ALIM-FARINHA-1KG",
        descricao: "Farinha de Trigo Especial 1kg (Fardo c/ 10)",
        ean: "7891000214435",
        lote: "LT-FAR-33",
        data_fabricacao: "2026-08-01",
        data_validade: "2027-02-01",
        quantidade: 80,
        unidade_medida: "FD",
        peso_unit_kg: 10,
        volume_unit_m3: 0.02,
        categoria: "Alimentos",
        curva_abc: "B",
        data_entrada: "2026-11-18",
        dias_sem_movimentacao: 1,
      },
    ],
  },
  {
    id: "end-avr-box-01",
    codigo: "AVR-BOX-01",
    setor: "AVARIAS",
    rua: "98",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "avaria",
    status: "ocupado",
    peso_max_kg: 3000,
    peso_atual_kg: 240,
    volume_max_m3: 10.0,
    volume_atual_m3: 1.2,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    motivo_bloqueio: "Produtos com embalagem violada aguardando descarte ou ressarcimento",
    produtos_alocados: [
      {
        id: "prod-avr-1",
        produto_id: "p-avr-1",
        codigo: "BEB-SUCO-UVA-1L",
        descricao: "Suco de Uva Integral 1L (Caixas amassadas)",
        ean: "7891000988770",
        lote: "SC-9901",
        data_fabricacao: "2026-06-01",
        data_validade: "2027-06-01",
        quantidade: 14,
        unidade_medida: "CX",
        peso_unit_kg: 12,
        volume_unit_m3: 0.025,
        categoria: "Bebidas",
        curva_abc: "B",
        data_entrada: "2026-11-17",
        dias_sem_movimentacao: 2,
      },
    ],
  },
  {
    id: "end-exp-doca-04",
    codigo: "EXP-DOCA-04",
    setor: "EXPEDICAO",
    rua: "00",
    predio: "04",
    nivel: "01",
    posicao: "01",
    tipo: "expedicao",
    status: "livre",
    peso_max_kg: 20000,
    peso_atual_kg: 0,
    volume_max_m3: 50.0,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },
  {
    id: "end-sep-box-02",
    codigo: "SEP-BOX-02",
    setor: "SEPARACAO",
    rua: "00",
    predio: "02",
    nivel: "01",
    posicao: "01",
    tipo: "separacao",
    status: "livre",
    peso_max_kg: 4000,
    peso_atual_kg: 0,
    volume_max_m3: 12.0,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },
  {
    id: "end-cnf-banc-01",
    codigo: "CNF-BANC-01",
    setor: "CONFERENCIA",
    rua: "00",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "conferencia",
    status: "livre",
    peso_max_kg: 2000,
    peso_atual_kg: 0,
    volume_max_m3: 6.0,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },
  {
    id: "end-dev-triagem",
    codigo: "DEV-TRIAGEM-01",
    setor: "DEVOLUCAO",
    rua: "97",
    predio: "01",
    nivel: "01",
    posicao: "01",
    tipo: "devolucao",
    status: "livre",
    peso_max_kg: 3000,
    peso_atual_kg: 0,
    volume_max_m3: 10.0,
    volume_atual_m3: 0,
    curva_abc_permitida: "todas",
    temperatura: "ambiente",
    produtos_alocados: [],
  },
];

export const SEED_MOVIMENTACOES: WmsMovimentacao[] = [
  {
    id: "mov-001",
    produto_id: "p-001",
    produto_codigo: "BEB-COCA-2L",
    produto_descricao: "Refrigerante Coca-Cola 2L Pet (Fardo c/ 6)",
    ean: "7894900010015",
    lote: "L-2026A",
    data_validade: "2027-04-01",
    quantidade: 40,
    unidade_medida: "FD",
    origem_endereco: "REC-DOCA-01",
    destino_endereco: "A-01-01-01-01",
    regra_estoque: "FEFO",
    motivo: "Ressuprimento de Picking",
    observacao: "Transferência rápida da doca para picking de alta velocidade",
    usuario_nome: "Operador João Silva",
    created_at: "2026-11-19T09:15:00Z",
  },
  {
    id: "mov-002",
    produto_id: "p-004",
    produto_codigo: "FAR-DIPIRONA-500MG",
    produto_descricao: "Dipirona Monoidratada 500mg Caixa c/ 20 comp",
    ean: "7896714201017",
    lote: "DP-2026-44",
    data_validade: "2027-01-10",
    quantidade: 300,
    unidade_medida: "CX",
    origem_endereco: "A-01-02-02-01",
    destino_endereco: "A-01-02-01-01",
    regra_estoque: "FEFO",
    motivo: "Ressuprimento de Flow Rack",
    observacao: "Abastecimento pista ergonômica de medicamentos",
    usuario_nome: "Operadora Mariana Souza",
    created_at: "2026-11-19T08:30:00Z",
  },
  {
    id: "mov-003",
    produto_id: "p-avr-1",
    produto_codigo: "BEB-SUCO-UVA-1L",
    produto_descricao: "Suco de Uva Integral 1L (Caixas amassadas)",
    ean: "7891000988770",
    lote: "SC-9901",
    data_validade: "2027-06-01",
    quantidade: 14,
    unidade_medida: "CX",
    origem_endereco: "REC-DOCA-01",
    destino_endereco: "AVR-BOX-01",
    regra_estoque: "MANUAL",
    motivo: "Envio para Área de Avarias",
    observacao: "Embalagem violada identificada no descarregamento",
    usuario_nome: "Fiscal Roberto Alves",
    created_at: "2026-11-18T16:45:00Z",
  },
];
