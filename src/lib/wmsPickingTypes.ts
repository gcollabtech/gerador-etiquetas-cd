export type PrioridadePedido = "urgente" | "alta" | "normal" | "baixa";

export type StatusPedido =
  | "pendente"
  | "em_onda"
  | "em_separacao"
  | "separado"
  | "conferido"
  | "cancelado";

export type EstrategiaPicking =
  | "pedido"
  | "onda"
  | "zona"
  | "setor_flow_rack"
  | "produto"
  | "multi_lojas";

export type ModoParametrizacaoOnda = "fixo" | "flexivel";

export type StatusOnda =
  | "em_formacao"
  | "liberada"
  | "em_separacao"
  | "concluida"
  | "cancelada";

export type StatusTarefaPicking =
  | "pendente"
  | "alocada"
  | "em_separacao"
  | "concluida"
  | "cancelada"
  | "com_divergencia";

export interface ItemPedidoSeparacao {
  id: string;
  cod_produto: string;
  descricao: string;
  ean: string;
  barra_alfa?: string;
  quantidade_solicitada: number;
  quantidade_separada: number;
  unidade_medida: string;
  restricao_validade_dias?: number; // Ex: mínimo de 180 dias restantes
  lote_preferencial?: string;
  peso_unitario_kg?: number;
  cubagem_unitaria_m3?: number;
}

export interface PedidoSeparacao {
  id: string;
  numero_pedido: string; // Ex: "PED-2026-8801"
  loja_destino: string; // Ex: "Loja 04 - Shopping Morumbi"
  cod_loja: string; // Ex: "LJ-004"
  regiao: string; // "Grande SP", "Interior", "Litoral", "Capital"
  rota_entrega: string; // "Rota 01 - Zona Sul", "Rota 02 - Alphaville", etc.
  transportadora: string; // "Frota Própria Collab", "TransLog Express", etc.
  tipo_pedido: "abastecimento_diario" | "transferencia" | "inauguracao" | "urgente_ruptura";
  cliente_canal: "lojas_proprias" | "franquias" | "e_commerce_b2b";
  data_emissao: string;
  prioridade: PrioridadePedido;
  horario_expedicao_corte: string; // "14:00", "18:00"
  status: StatusPedido;
  itens: ItemPedidoSeparacao[];
  onda_id?: string;
  total_itens?: number;
  total_volumes_estimados?: number;
  cubagem_total_m3?: number;
  observacoes?: string;
}

export interface EmbalagemPicking {
  id: string;
  codigo: string; // "CX-P", "CX-M", "CX-G", "GAIOLA-ROLL"
  nome: string; // "Caixa Pequena", "Caixa Média", "Caixa Grande", "Gaiola Roll"
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
  volume_m3: number;
  capacidade_peso_kg: number;
  fator_utilizacao_pct: number; // Ex: 85% para acomodação real
  ativa: boolean;
}

export interface CalculoEmbalagensResult {
  cubagem_total_m3: number;
  peso_total_kg: number;
  embalagem_recomendada: EmbalagemPicking;
  quantidade_embalagens: number;
  detalhe_distribuicao: {
    embalagem: string;
    quantidade: number;
    volume_utilizado_m3: number;
  }[];
}

export interface ParametrizacaoOnda {
  id: string;
  nome: string;
  modo: ModoParametrizacaoOnda;
  estrategia: EstrategiaPicking;
  filtro_regiao?: string[];
  filtro_rotas?: string[];
  filtro_transportadoras?: string[];
  filtro_tipo_pedido?: string[];
  filtro_lojas?: string[];
  filtro_cliente_canal?: string[];
  filtro_prioridade?: PrioridadePedido[];
  corte_horario_expedicao?: string;
  limite_max_pedidos?: number;
  limite_max_volumes?: number;
  exigir_estoque_100_pct: boolean;
  ativa: boolean;
}

export interface ItemTarefaSeparacao {
  id: string;
  cod_produto: string;
  descricao: string;
  ean: string;
  quantidade_solicitada: number;
  quantidade_separada: number;
  unidade_medida: string;
  endereco_origem: string; // Ex: "R01-P01-N01-A01"
  endereco_destino: string; // Ex: "Gaiola-04 / Doca-02"
  lote_recomendado: string;
  data_validade: string;
  setor_flow_rack?: string;
  zona?: string;
  cubagem_m3: number;
  status: "pendente" | "em_conferencia" | "separado_ok" | "divergencia" | "bloqueado";
  motivo_bloqueio?: string;
}

export interface TarefaPicking {
  id: string;
  numero_tarefa: string; // "TS-8801"
  onda_id?: string;
  numero_onda?: string;
  pedido_id: string;
  numero_pedido: string;
  loja_destino: string;
  cod_loja: string;
  estrategia: EstrategiaPicking;
  prioridade: PrioridadePedido;
  status: StatusTarefaPicking;
  operador_id?: string;
  operador_nome?: string;
  data_criacao: string;
  data_inicio?: string;
  data_fim?: string;
  duracao_minutos?: number;
  itens: ItemTarefaSeparacao[];
  volumes_embalagens_utilizados: number;
  embalagem_utilizada_id?: string;
  embalagem_utilizada_nome?: string;
  cubagem_total_m3: number;
  total_itens_solicitados: number;
  total_itens_separados: number;
  total_linhas: number;
  divergencias_contagem: number;
  observacoes?: string;
}

export interface OndaSeparacao {
  id: string;
  numero_onda: string; // "ONDA-2026-0501"
  nome: string;
  modo: ModoParametrizacaoOnda;
  estrategia: EstrategiaPicking;
  data_criacao: string;
  horario_corte: string;
  prioridade: PrioridadePedido;
  status: StatusOnda;
  pedidos_ids: string[];
  quantidade_pedidos: number;
  total_itens: number;
  total_volumes_estimados: number;
  cubagem_total_m3: number;
  tarefas_geradas: number;
  tarefas_concluidas: number;
  criado_por: string;
}

export interface RegistroProdutividadePicking {
  id: string;
  operador_id: string;
  operador_nome: string;
  tarefa_id: string;
  numero_tarefa: string;
  pedido_id: string;
  numero_pedido: string;
  loja_destino: string;
  data: string; // "2026-11-19"
  hora_inicio: string;
  hora_fim: string;
  duracao_minutos: number;
  quantidade_itens: number;
  quantidade_linhas: number;
  itens_por_hora: number;
  linhas_por_hora: number;
  divergencias: number;
  observacao?: string;
}

export interface IndicadoresPickingCD {
  total_pedidos_hoje: number;
  pedidos_pendentes: number;
  pedidos_em_separacao: number;
  pedidos_concluidos: number;
  taxa_atendimento_pct: number;
  ondas_ativas: number;
  total_tarefas_abertas: number;
  produtividade_media_itens_hora: number;
  produtividade_media_linhas_hora: number;
  tempo_medio_separacao_minutos: number;
  divergencias_hoje: number;
  operadores_ativos: number;
}

// ── SEED DATA PADRÃO CD COLLAB ───────────────────────────────────────────────

export const EMBALAGENS_PADRAO: EmbalagemPicking[] = [
  {
    id: "emb-01",
    codigo: "CX-P",
    nome: "Caixa Pequena (30×20×15 cm)",
    comprimento_cm: 30,
    largura_cm: 20,
    altura_cm: 15,
    volume_m3: 0.009, // 9L
    capacidade_peso_kg: 8,
    fator_utilizacao_pct: 85,
    ativa: true,
  },
  {
    id: "emb-02",
    codigo: "CX-M",
    nome: "Caixa Média Padrão (40×30×25 cm)",
    comprimento_cm: 40,
    largura_cm: 30,
    altura_cm: 25,
    volume_m3: 0.03, // 30L
    capacidade_peso_kg: 18,
    fator_utilizacao_pct: 85,
    ativa: true,
  },
  {
    id: "emb-03",
    codigo: "CX-G",
    nome: "Caixa Grande Expedição (60×40×35 cm)",
    comprimento_cm: 60,
    largura_cm: 40,
    altura_cm: 35,
    volume_m3: 0.084, // 84L
    capacidade_peso_kg: 30,
    fator_utilizacao_pct: 85,
    ativa: true,
  },
  {
    id: "emb-04",
    codigo: "GAIOLA-ROLL",
    nome: "Gaiola Roll Container CD (120×80×150 cm)",
    comprimento_cm: 120,
    largura_cm: 80,
    altura_cm: 150,
    volume_m3: 1.44, // 1440L
    capacidade_peso_kg: 400,
    fator_utilizacao_pct: 80,
    ativa: true,
  },
];

export const PARAMETRIZACOES_ONDAS_PADRAO: ParametrizacaoOnda[] = [
  {
    id: "param-onda-01",
    nome: "Onda Matutina Rota Sul (Lojas Shopping)",
    modo: "fixo",
    estrategia: "onda",
    filtro_regiao: ["Grande SP", "Capital"],
    filtro_rotas: ["Rota 01 - Zona Sul"],
    filtro_transportadoras: ["Frota Própria Collab"],
    corte_horario_expedicao: "11:30",
    limite_max_pedidos: 10,
    limite_max_volumes: 250,
    exigir_estoque_100_pct: true,
    ativa: true,
  },
  {
    id: "param-onda-02",
    nome: "Onda Expressa Ruptura & Urgências",
    modo: "flexivel",
    estrategia: "pedido",
    filtro_prioridade: ["urgente"],
    corte_horario_expedicao: "14:00",
    limite_max_pedidos: 5,
    limite_max_volumes: 80,
    exigir_estoque_100_pct: false,
    ativa: true,
  },
  {
    id: "param-onda-03",
    nome: "Onda Consolidada Flow Rack (Itens de Alto Giro)",
    modo: "fixo",
    estrategia: "setor_flow_rack",
    filtro_regiao: ["Interior", "Litoral"],
    corte_horario_expedicao: "16:00",
    limite_max_pedidos: 15,
    limite_max_volumes: 400,
    exigir_estoque_100_pct: true,
    ativa: true,
  },
];

export const PEDIDOS_SEED: PedidoSeparacao[] = [
  {
    id: "ped-01",
    numero_pedido: "PED-2026-8801",
    loja_destino: "Loja 04 - Shopping Morumbi",
    cod_loja: "LJ-004",
    regiao: "Capital",
    rota_entrega: "Rota 01 - Zona Sul",
    transportadora: "Frota Própria Collab",
    tipo_pedido: "abastecimento_diario",
    cliente_canal: "lojas_proprias",
    data_emissao: "2026-11-19",
    prioridade: "urgente",
    horario_expedicao_corte: "14:00",
    status: "em_separacao",
    onda_id: "onda-01",
    total_itens: 44,
    total_volumes_estimados: 3,
    cubagem_total_m3: 0.082,
    observacoes: "Priorizar lote com validade mínima de 180 dias. Loja em campanha promocional.",
    itens: [
      {
        id: "item-p1-1",
        cod_produto: "PRD-1001",
        descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
        ean: "7891000315504",
        quantidade_solicitada: 24,
        quantidade_separada: 24,
        unidade_medida: "UN",
        restricao_validade_dias: 180,
        lote_preferencial: "LT-202611-A",
        peso_unitario_kg: 0.52,
        cubagem_unitaria_m3: 0.0009,
      },
      {
        id: "item-p1-2",
        cod_produto: "PRD-1002",
        descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
        ean: "7891234567895",
        quantidade_solicitada: 12,
        quantidade_separada: 12,
        unidade_medida: "UN",
        restricao_validade_dias: 240,
        lote_preferencial: "LT-202611-B",
        peso_unitario_kg: 1.05,
        cubagem_unitaria_m3: 0.0018,
      },
      {
        id: "item-p1-3",
        cod_produto: "PRD-1005",
        descricao: "CANETA ESFEROGRÁFICA AZUL 1.0MM",
        ean: "7891000315507",
        quantidade_solicitada: 8,
        quantidade_separada: 0,
        unidade_medida: "UN",
        lote_preferencial: "LT-EXP-99",
        peso_unitario_kg: 0.015,
        cubagem_unitaria_m3: 0.0001,
      },
    ],
  },
  {
    id: "ped-02",
    numero_pedido: "PED-2026-8802",
    loja_destino: "Loja 12 - Shopping Iguatemi Alphaville",
    cod_loja: "LJ-012",
    regiao: "Grande SP",
    rota_entrega: "Rota 02 - Alphaville / Oeste",
    transportadora: "Frota Própria Collab",
    tipo_pedido: "abastecimento_diario",
    cliente_canal: "lojas_proprias",
    data_emissao: "2026-11-19",
    prioridade: "alta",
    horario_expedicao_corte: "14:00",
    status: "em_onda",
    onda_id: "onda-01",
    total_itens: 36,
    total_volumes_estimados: 2,
    cubagem_total_m3: 0.054,
    observacoes: "Entrega programada para doca subterrânea das 16h.",
    itens: [
      {
        id: "item-p2-1",
        cod_produto: "PRD-1003",
        descricao: "ÁGUA SANITÁRIA CLORADA 2L",
        ean: "7898912345678",
        quantidade_solicitada: 12,
        quantidade_separada: 0,
        unidade_medida: "UN",
        restricao_validade_dias: 180,
        lote_preferencial: "LT-202611-C",
        peso_unitario_kg: 2.1,
        cubagem_unitaria_m3: 0.0032,
      },
      {
        id: "item-p2-2",
        cod_produto: "PRD-1004",
        descricao: "DESINFETANTE FLORAL 1L",
        ean: "7896000123456",
        quantidade_solicitada: 24,
        quantidade_separada: 0,
        unidade_medida: "UN",
        restricao_validade_dias: 200,
        lote_preferencial: "LT-202611-D",
        peso_unitario_kg: 1.05,
        cubagem_unitaria_m3: 0.0016,
      },
    ],
  },
  {
    id: "ped-03",
    numero_pedido: "PED-2026-8803",
    loja_destino: "Loja 07 - Parque D. Pedro Campinas",
    cod_loja: "LJ-007",
    regiao: "Interior",
    rota_entrega: "Rota 03 - Campinas & Região",
    transportadora: "TransLog Express",
    tipo_pedido: "transferencia",
    cliente_canal: "franquias",
    data_emissao: "2026-11-19",
    prioridade: "normal",
    horario_expedicao_corte: "18:00",
    status: "pendente",
    total_itens: 60,
    total_volumes_estimados: 4,
    cubagem_total_m3: 0.115,
    observacoes: "Carga consolidada com material de escritório e higiene.",
    itens: [
      {
        id: "item-p3-1",
        cod_produto: "PRD-1006",
        descricao: "PAPEL SULFITE A4 75G PCT 500 FLS",
        ean: "7891027116521",
        quantidade_solicitada: 20,
        quantidade_separada: 0,
        unidade_medida: "PCT",
        lote_preferencial: "LT-PAPEL-01",
        peso_unitario_kg: 2.3,
        cubagem_unitaria_m3: 0.0045,
      },
      {
        id: "item-p3-2",
        cod_produto: "PRD-1001",
        descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
        ean: "7891000315504",
        quantidade_solicitada: 40,
        quantidade_separada: 0,
        unidade_medida: "UN",
        lote_preferencial: "LT-202611-A",
        peso_unitario_kg: 0.52,
        cubagem_unitaria_m3: 0.0009,
      },
    ],
  },
  {
    id: "ped-04",
    numero_pedido: "PED-2026-8804",
    loja_destino: "Loja 15 - Praiamar Shopping Santos",
    cod_loja: "LJ-015",
    regiao: "Litoral",
    rota_entrega: "Rota 04 - Baixada Santista",
    transportadora: "TransLog Express",
    tipo_pedido: "abastecimento_diario",
    cliente_canal: "lojas_proprias",
    data_emissao: "2026-11-19",
    prioridade: "normal",
    horario_expedicao_corte: "18:00",
    status: "pendente",
    total_itens: 30,
    total_volumes_estimados: 2,
    cubagem_total_m3: 0.048,
    itens: [
      {
        id: "item-p4-1",
        cod_produto: "PRD-1002",
        descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
        ean: "7891234567895",
        quantidade_solicitada: 20,
        quantidade_separada: 0,
        unidade_medida: "UN",
        lote_preferencial: "LT-202611-B",
        peso_unitario_kg: 1.05,
        cubagem_unitaria_m3: 0.0018,
      },
      {
        id: "item-p4-2",
        cod_produto: "PRD-1004",
        descricao: "DESINFETANTE FLORAL 1L",
        ean: "7896000123456",
        quantidade_solicitada: 10,
        quantidade_separada: 0,
        unidade_medida: "UN",
        lote_preferencial: "LT-202611-D",
        peso_unitario_kg: 1.05,
        cubagem_unitaria_m3: 0.0016,
      },
    ],
  },
];

export const ONDAS_SEED: OndaSeparacao[] = [
  {
    id: "onda-01",
    numero_onda: "ONDA-2026-0501",
    nome: "Onda 01 — Rota Sul & Alphaville (Corte 14h)",
    modo: "fixo",
    estrategia: "onda",
    data_criacao: "2026-11-19 08:30",
    horario_corte: "14:00",
    prioridade: "urgente",
    status: "em_separacao",
    pedidos_ids: ["ped-01", "ped-02"],
    quantidade_pedidos: 2,
    total_itens: 80,
    total_volumes_estimados: 5,
    cubagem_total_m3: 0.136,
    tarefas_geradas: 2,
    tarefas_concluidas: 0,
    criado_por: "Coord. Logístico Eduardo Silva",
  },
];

export const TAREFAS_SEED: TarefaPicking[] = [
  {
    id: "tar-pick-01",
    numero_tarefa: "TS-8801",
    onda_id: "onda-01",
    numero_onda: "ONDA-2026-0501",
    pedido_id: "ped-01",
    numero_pedido: "PED-2026-8801",
    loja_destino: "Loja 04 - Shopping Morumbi",
    cod_loja: "LJ-004",
    estrategia: "onda",
    prioridade: "urgente",
    status: "em_separacao",
    operador_id: "usr-03",
    operador_nome: "Lucas Ferreira (Operador)",
    data_criacao: "2026-11-19 08:35",
    data_inicio: "2026-11-19 09:10",
    volumes_embalagens_utilizados: 3,
    embalagem_utilizada_id: "emb-02",
    embalagem_utilizada_nome: "Caixa Média Padrão (40×30×25 cm)",
    cubagem_total_m3: 0.082,
    total_itens_solicitados: 44,
    total_itens_separados: 36,
    total_linhas: 3,
    divergencias_contagem: 0,
    itens: [
      {
        id: "tar-item-1",
        cod_produto: "PRD-1001",
        descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
        ean: "7891000315504",
        quantidade_solicitada: 24,
        quantidade_separada: 24,
        unidade_medida: "UN",
        endereco_origem: "R01-P01-N01-A01",
        endereco_destino: "Gaiola-04 / Doca-02",
        lote_recomendado: "LT-202611-A",
        data_validade: "2028-11-10",
        setor_flow_rack: "Flow Rack Setor A",
        cubagem_m3: 0.0216,
        status: "separado_ok",
      },
      {
        id: "tar-item-2",
        cod_produto: "PRD-1002",
        descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
        ean: "7891234567895",
        quantidade_solicitada: 12,
        quantidade_separada: 12,
        unidade_medida: "UN",
        endereco_origem: "R01-P01-N01-A02",
        endereco_destino: "Gaiola-04 / Doca-02",
        lote_recomendado: "LT-202611-B",
        data_validade: "2029-11-10",
        setor_flow_rack: "Flow Rack Setor A",
        cubagem_m3: 0.0216,
        status: "separado_ok",
      },
      {
        id: "tar-item-3",
        cod_produto: "PRD-1005",
        descricao: "CANETA ESFEROGRÁFICA AZUL 1.0MM",
        ean: "7891000315507",
        quantidade_solicitada: 8,
        quantidade_separada: 0,
        unidade_medida: "UN",
        endereco_origem: "R02-P01-N02-A01",
        endereco_destino: "Gaiola-04 / Doca-02",
        lote_recomendado: "LT-EXP-99",
        data_validade: "2030-11-15",
        setor_flow_rack: "Flow Rack Setor B",
        cubagem_m3: 0.0008,
        status: "pendente",
      },
    ],
  },
  {
    id: "tar-pick-02",
    numero_tarefa: "TS-8802",
    onda_id: "onda-01",
    numero_onda: "ONDA-2026-0501",
    pedido_id: "ped-02",
    numero_pedido: "PED-2026-8802",
    loja_destino: "Loja 12 - Shopping Iguatemi Alphaville",
    cod_loja: "LJ-012",
    estrategia: "onda",
    prioridade: "alta",
    status: "alocada",
    operador_id: "usr-04",
    operador_nome: "Marcos Vinicius (Operador)",
    data_criacao: "2026-11-19 08:35",
    volumes_embalagens_utilizados: 2,
    embalagem_utilizada_id: "emb-02",
    embalagem_utilizada_nome: "Caixa Média Padrão (40×30×25 cm)",
    cubagem_total_m3: 0.054,
    total_itens_solicitados: 36,
    total_itens_separados: 0,
    total_linhas: 2,
    divergencias_contagem: 0,
    itens: [
      {
        id: "tar-item-4",
        cod_produto: "PRD-1003",
        descricao: "ÁGUA SANITÁRIA CLORADA 2L",
        ean: "7898912345678",
        quantidade_solicitada: 12,
        quantidade_separada: 0,
        unidade_medida: "UN",
        endereco_origem: "R01-P02-N01-A01",
        endereco_destino: "Gaiola-08 / Doca-02",
        lote_recomendado: "LT-202611-C",
        data_validade: "2027-11-05",
        cubagem_m3: 0.0384,
        status: "pendente",
      },
      {
        id: "tar-item-5",
        cod_produto: "PRD-1004",
        descricao: "DESINFETANTE FLORAL 1L",
        ean: "7896000123456",
        quantidade_solicitada: 24,
        quantidade_separada: 0,
        unidade_medida: "UN",
        endereco_origem: "R01-P02-N01-A02",
        endereco_destino: "Gaiola-08 / Doca-02",
        lote_recomendado: "LT-202611-D",
        data_validade: "2028-11-10",
        cubagem_m3: 0.0384,
        status: "pendente",
      },
    ],
  },
];

export const PRODUTIVIDADE_SEED: RegistroProdutividadePicking[] = [
  {
    id: "prod-01",
    operador_id: "usr-03",
    operador_nome: "Lucas Ferreira (Operador)",
    tarefa_id: "tar-pick-antiga-01",
    numero_tarefa: "TS-8790",
    pedido_id: "ped-ant-01",
    numero_pedido: "PED-2026-8790",
    loja_destino: "Loja 01 - Matriz Centro",
    data: "2026-11-19",
    hora_inicio: "08:00",
    hora_fim: "08:45",
    duracao_minutos: 45,
    quantidade_itens: 120,
    quantidade_linhas: 8,
    itens_por_hora: 160,
    linhas_por_hora: 10.7,
    divergencias: 0,
  },
  {
    id: "prod-02",
    operador_id: "usr-04",
    operador_nome: "Marcos Vinicius (Operador)",
    tarefa_id: "tar-pick-antiga-02",
    numero_tarefa: "TS-8791",
    pedido_id: "ped-ant-02",
    numero_pedido: "PED-2026-8791",
    loja_destino: "Loja 03 - Pinheiros",
    data: "2026-11-19",
    hora_inicio: "08:10",
    hora_fim: "09:00",
    duracao_minutos: 50,
    quantidade_itens: 95,
    quantidade_linhas: 6,
    itens_por_hora: 114,
    linhas_por_hora: 7.2,
    divergencias: 1,
    observacao: "Item com avaria de embalagem substituído no picking",
  },
];
