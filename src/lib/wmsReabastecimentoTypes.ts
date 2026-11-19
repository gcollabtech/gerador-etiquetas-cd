export type PrioridadeReabastecimento = "urgente" | "alta" | "programada";

export type StatusReabastecimento =
  | "pendente"
  | "em_execucao"
  | "concluida"
  | "cancelada"
  | "com_divergencia";

export type TipoLocalReposicao = "picking" | "flow_rack";

export type OrigemGatilho =
  | "estoque_minimo"
  | "onda_separacao"
  | "manual"
  | "bipagem_flow_rack";

export interface RegraReposicao {
  id: string;
  produto_id?: string;
  cod_produto: string;
  descricao: string;
  ean?: string;
  estoque_min_picking: number;
  estoque_max_picking: number;
  quantidade_reposicao: number;
  endereco_picking: string;
  endereco_flow_rack?: string;
  endereco_pulmao: string;
  unidade_movimentacao: string;
  capacidade_caixas_flow_rack?: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BipagensConferencia {
  origem_bipada: boolean;
  produto_bipado: boolean;
  destino_bipado: boolean;
  qtd_confirmada?: number;
}

export interface TarefaReabastecimento {
  id: string;
  numero_tarefa: string; // Ex: REAB-2026-0001
  produto_id?: string;
  cod_produto: string;
  descricao: string;
  ean?: string;
  lote?: string;
  tipo_local: TipoLocalReposicao;
  prioridade: PrioridadeReabastecimento;
  status: StatusReabastecimento;
  endereco_origem: string;      // Pulmão
  endereco_destino: string;     // Picking ou Flow Rack
  saldo_atual_destino: number;
  estoque_min_destino: number;
  quantidade_solicitada: number;
  quantidade_atendida: number;
  unidade_movimentacao: string;
  origem_gatilho: OrigemGatilho;
  onda_separacao_id?: string;
  operador_id?: string;
  operador_nome?: string;
  supervisor_id?: string;
  supervisor_nome?: string;
  criado_em: string;
  iniciado_em?: string;
  concluido_em?: string;
  divergencia_motivo?: string;
  divergencia_qtd?: number;
  bipagens_conferencia: BipagensConferencia;
  observacoes?: string;
}

export interface FlowRackInfoConsulta {
  endereco_codigo: string;
  cod_produto: string;
  descricao: string;
  ean: string;
  saldo_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  capacidade_caixas: number;
  pulmao_sugerido: string;
  quantidade_necessaria: number;
  precisa_reabastecer: boolean;
  prioridade_sugerida: PrioridadeReabastecimento;
}

export const PRIORIDADE_REABASTECIMENTO_CONFIG: Record<
  PrioridadeReabastecimento,
  {
    label: string;
    badge: string;
    text: string;
    bg: string;
    border: string;
    pulse?: boolean;
    descricao: string;
  }
> = {
  urgente: {
    label: "Urgente",
    badge: "URGENTE",
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    pulse: true,
    descricao: "Picking sem estoque (Ruptura imediata de separação)",
  },
  alta: {
    label: "Alta",
    badge: "ALTA",
    text: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    descricao: "Estoque abaixo do ponto de ressuprimento mínimo",
  },
  programada: {
    label: "Programada",
    badge: "PROGRAMADA",
    text: "text-sky-400",
    bg: "bg-sky-500/15",
    border: "border-sky-500/40",
    descricao: "Abastecimento preventivo ou planejado para onda",
  },
};

export const STATUS_REABASTECIMENTO_CONFIG: Record<
  StatusReabastecimento,
  {
    label: string;
    text: string;
    bg: string;
    border: string;
  }
> = {
  pendente: {
    label: "Pendente",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  em_execucao: {
    label: "Em Execução",
    text: "text-[var(--collab-mostarda)]",
    bg: "bg-[var(--collab-mostarda)]/15",
    border: "border-[var(--collab-mostarda)]/30",
  },
  concluida: {
    label: "Concluída",
    text: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  cancelada: {
    label: "Cancelada",
    text: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
  },
  com_divergencia: {
    label: "Com Divergência",
    text: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
  },
};

// Seed de Regras de Reposição
export const SEED_REGRAS_REPOSICAO: RegraReposicao[] = [
  {
    id: "reg-001",
    cod_produto: "BEB-COCA-2L",
    descricao: "Refrigerante Coca-Cola 2L Pet (Fardo c/ 6)",
    ean: "7894900010015",
    estoque_min_picking: 50,
    estoque_max_picking: 200,
    quantidade_reposicao: 100,
    endereco_picking: "A-01-01-01-01",
    endereco_pulmao: "A-01-01-03-01",
    unidade_movimentacao: "FD",
    ativo: true,
  },
  {
    id: "reg-002",
    cod_produto: "BEB-CERV-HEIN-LATA",
    descricao: "Cerveja Heineken Lata 350ml (Pack c/ 12)",
    ean: "7896045505417",
    estoque_min_picking: 60,
    estoque_max_picking: 250,
    quantidade_reposicao: 120,
    endereco_picking: "A-01-01-01-02",
    endereco_pulmao: "A-01-01-02-01",
    unidade_movimentacao: "CX",
    ativo: true,
  },
  {
    id: "reg-003",
    cod_produto: "FAR-DIPIRONA-500MG",
    descricao: "Dipirona Monoidratada 500mg Caixa c/ 20 comp",
    ean: "7896714201017",
    estoque_min_picking: 200,
    estoque_max_picking: 1000,
    quantidade_reposicao: 500,
    endereco_picking: "A-01-02-01-01",
    endereco_flow_rack: "A-01-02-01-01", // Flow rack dedicado
    endereco_pulmao: "A-01-02-02-01",
    unidade_movimentacao: "CX",
    capacidade_caixas_flow_rack: 25,
    ativo: true,
  },
  {
    id: "reg-004",
    cod_produto: "FAR-PARACETAMOL-750",
    descricao: "Paracetamol 750mg Blister c/ 10 comp",
    ean: "7896714202021",
    estoque_min_picking: 300,
    estoque_max_picking: 1500,
    quantidade_reposicao: 800,
    endereco_picking: "A-01-02-01-02",
    endereco_flow_rack: "A-01-02-01-02",
    endereco_pulmao: "A-01-02-02-01",
    unidade_movimentacao: "CX",
    capacidade_caixas_flow_rack: 30,
    ativo: true,
  },
  {
    id: "reg-005",
    cod_produto: "HIG-SABONETE-DOVE",
    descricao: "Sabonete Dove Original 90g (Pack c/ 6)",
    ean: "7891150041234",
    estoque_min_picking: 80,
    estoque_max_picking: 400,
    quantidade_reposicao: 200,
    endereco_picking: "A-02-01-01-01",
    endereco_pulmao: "A-02-01-02-01",
    unidade_movimentacao: "PCT",
    ativo: true,
  },
];

// Seed de Tarefas de Reabastecimento
export const SEED_TAREFAS_REABASTECIMENTO: TarefaReabastecimento[] = [
  {
    id: "tar-001",
    numero_tarefa: "REAB-2026-0001",
    cod_produto: "BEB-CERV-HEIN-LATA",
    descricao: "Cerveja Heineken Lata 350ml (Pack c/ 12)",
    ean: "7896045505417",
    lote: "L-9984",
    tipo_local: "picking",
    prioridade: "urgente",
    status: "pendente",
    endereco_origem: "A-01-01-02-01",
    endereco_destino: "A-01-01-01-02",
    saldo_atual_destino: 0, // Sem estoque!
    estoque_min_destino: 60,
    quantidade_solicitada: 120,
    quantidade_atendida: 0,
    unidade_movimentacao: "CX",
    origem_gatilho: "estoque_minimo",
    criado_em: "2026-11-19T09:30:00Z",
    bipagens_conferencia: {
      origem_bipada: false,
      produto_bipado: false,
      destino_bipado: false,
    },
    observacoes: "Ruptura de estoque no picking A-01-01-01-02! Priorizar ressuprimento para evitar corte no pedido #1040.",
  },
  {
    id: "tar-002",
    numero_tarefa: "REAB-2026-0002",
    cod_produto: "FAR-DIPIRONA-500MG",
    descricao: "Dipirona Monoidratada 500mg Caixa c/ 20 comp",
    ean: "7896714201017",
    lote: "DP-2026-44",
    tipo_local: "flow_rack",
    prioridade: "alta",
    status: "em_execucao",
    endereco_origem: "A-01-02-02-01",
    endereco_destino: "A-01-02-01-01",
    saldo_atual_destino: 140, // Abaixo do mínimo (200)
    estoque_min_destino: 200,
    quantidade_solicitada: 500,
    quantidade_atendida: 0,
    unidade_movimentacao: "CX",
    origem_gatilho: "bipagem_flow_rack",
    operador_nome: "Operador Lucas Santos",
    supervisor_nome: "Supervisor Carlos WMS",
    criado_em: "2026-11-19T09:00:00Z",
    iniciado_em: "2026-11-19T09:15:00Z",
    bipagens_conferencia: {
      origem_bipada: true,
      produto_bipado: true,
      destino_bipado: false,
      qtd_confirmada: 500,
    },
    observacoes: "Flow Rack linha 01 com capacidade residual para 25 caixas.",
  },
  {
    id: "tar-003",
    numero_tarefa: "REAB-2026-0003",
    cod_produto: "BEB-COCA-2L",
    descricao: "Refrigerante Coca-Cola 2L Pet (Fardo c/ 6)",
    ean: "7894900010015",
    lote: "L-2026A",
    tipo_local: "picking",
    prioridade: "programada",
    status: "concluida",
    endereco_origem: "A-01-01-03-01",
    endereco_destino: "A-01-01-01-01",
    saldo_atual_destino: 140,
    estoque_min_destino: 50,
    quantidade_solicitada: 60,
    quantidade_atendida: 60,
    unidade_movimentacao: "FD",
    origem_gatilho: "onda_separacao",
    onda_separacao_id: "ONDA-SP-901",
    operador_nome: "Operador João Silva",
    supervisor_nome: "Supervisor Carlos WMS",
    criado_em: "2026-11-19T08:00:00Z",
    iniciado_em: "2026-11-19T08:10:00Z",
    concluido_em: "2026-11-19T08:25:00Z",
    bipagens_conferencia: {
      origem_bipada: true,
      produto_bipado: true,
      destino_bipado: true,
      qtd_confirmada: 60,
    },
    observacoes: "Reabastecimento preventivo para onda de Black Friday das 10h.",
  },
];
