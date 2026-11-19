// src/lib/wmsExpedicaoTypes.ts
// Definições de tipos e modelos para o MÓDULO 07 — EXPEDIÇÃO

export type StatusCargaExpedicao =
  | "aguardando_carga"
  | "em_carregamento"
  | "carregamento_concluido"
  | "aguardando_liberacao"
  | "expedido"
  | "em_transito"
  | "entregue"
  | "entrega_ocorrencia";

export type StatusDocaExpedicao = "livre" | "ocupada" | "reservada" | "em_manutencao";

export interface DocaExpedicao {
  id: string;
  codigo: string; // Ex: "DOCA-01", "DOCA-02"
  nome: string; // Ex: "Doca 01 — Lojas Capital"
  tipo: "lojas_capital" | "lojas_interior" | "litoral_express" | "crossdocking";
  status: StatusDocaExpedicao;
  carga_id_atual?: string;
  numero_carga_atual?: string;
  veiculo_atual?: string;
  placa_atual?: string;
  transportadora_atual?: string;
  horario_ocupacao?: string;
  capacidade_veiculo_tipo: string; // "Truck", "Carreta", "Toco", "VUC"
}

export interface VolumeCarga {
  id: string;
  codigo_volume: string; // Ex: "VOL-0842-01"
  numero_pedido: string;
  loja_destino: string;
  cod_loja: string;
  rota: string;
  peso_kg: number;
  tipo_embalagem: string;
  bipado: boolean;
  bipado_em?: string;
  operador_bipagem?: string;
}

export interface AssinaturaMotorista {
  nome: string;
  cpf: string;
  cnh?: string;
  data_hora: string;
  assinatura_base64: string; // Imagem SVG/PNG capturada na tela de toque
}

export interface DocumentosFiscaisExpedicao {
  mdf_e_numero?: string;
  mdf_e_chave?: string;
  cte_numero?: string;
  nfs_chaves: string[];
}

export interface CargaExpedicao {
  id: string;
  numero_carga: string; // Ex: "CRG-2026-0042"
  data_criacao: string;
  data_entrega_prevista: string;
  data_saida_real?: string;
  regiao: string; // "Capital", "Interior", "Grande SP", "Litoral"
  rota: string; // "Rota 01 - Zona Sul Express"
  transportadora: string;
  veiculo_tipo: string; // "Toco", "Truck", "Carreta", "VUC"
  placa_veiculo: string;
  motorista_nome: string;
  motorista_cpf: string;
  motorista_cnh: string;
  doca_id: string;
  doca_nome: string;
  horario_previsto_carregamento: string;
  horario_real_inicio?: string;
  horario_real_conclusao?: string;
  status: StatusCargaExpedicao;
  pedidos_ids: string[];
  pedidos_numeros: string[];
  lojas_atendidas: Array<{
    cod_loja: string;
    nome_loja: string;
    total_volumes: number;
    total_itens: number;
    peso_kg: number;
  }>;
  total_volumes: number;
  volumes_bipados: number;
  peso_total_kg: number;
  cubagem_total_m3: number;
  volumes: VolumeCarga[];
  romaneio_digital_gerado: boolean;
  data_romaneio?: string;
  assinatura_motorista?: AssinaturaMotorista;
  erp_sincronizado: boolean;
  erp_protocolo_saida?: string;
  documentos_fiscais: DocumentosFiscaisExpedicao;
  observacoes?: string;
  ocorrencia?: {
    motivo: string;
    data_hora: string;
    operador: string;
  };
}

export interface IndicadoresExpedicao {
  totalAguardandoCarga: number;
  totalEmCarregamento: number;
  totalCarregamentoConcluido: number;
  totalAguardandoLiberacao: number;
  totalExpedido: number;
  totalEmTransito: number;
  totalEntregue: number;
  totalOcorrencias: number;
  totalGeralCargas: number;
  taxaOcupacaoDocasPct: number;
  tempoMedioCarregamentoMin: number;
}

// ── SEEDS INICIAIS ─────────────────────────────────────────────────────────

export const DOCAS_EXPEDICAO_SEED: DocaExpedicao[] = [
  {
    id: "doca-01",
    codigo: "DOCA-EXP-01",
    nome: "Doca 01 — Lojas Capital Express",
    tipo: "lojas_capital",
    status: "ocupada",
    carga_id_atual: "crg-001",
    numero_carga_atual: "CRG-2026-0042",
    veiculo_atual: "Truck Baú Refrigerado",
    placa_atual: "BRA-4D88",
    transportadora_atual: "Transportadora TransCollab Log",
    horario_ocupacao: "11:00",
    capacidade_veiculo_tipo: "Truck (14 Ton)",
  },
  {
    id: "doca-02",
    codigo: "DOCA-EXP-02",
    nome: "Doca 02 — Grande SP Oeste / Sul",
    tipo: "lojas_capital",
    status: "livre",
    capacidade_veiculo_tipo: "Toco (8 Ton)",
  },
  {
    id: "doca-03",
    codigo: "DOCA-EXP-03",
    nome: "Doca 03 — Interior RMC Campinas",
    tipo: "lojas_interior",
    status: "reservada",
    carga_id_atual: "crg-002",
    numero_carga_atual: "CRG-2026-0043",
    capacidade_veiculo_tipo: "Carreta (28 Ton)",
  },
  {
    id: "doca-04",
    codigo: "DOCA-EXP-04",
    nome: "Doca 04 — Litoral Santos / Baixada",
    tipo: "litoral_express",
    status: "livre",
    capacidade_veiculo_tipo: "Truck (14 Ton)",
  },
  {
    id: "doca-05",
    codigo: "DOCA-EXP-05",
    nome: "Doca 05 — Transferência CD Big Master",
    tipo: "crossdocking",
    status: "livre",
    capacidade_veiculo_tipo: "Carreta (32 Ton)",
  },
];

export const CARGAS_EXPEDICAO_SEED: CargaExpedicao[] = [
  {
    id: "crg-001",
    numero_carga: "CRG-2026-0042",
    data_criacao: "2026-11-19 09:00",
    data_entrega_prevista: "2026-11-19",
    regiao: "Capital",
    rota: "Rota 01 - Zona Sul Express",
    transportadora: "Transportadora TransCollab Log",
    veiculo_tipo: "Truck Baú",
    placa_veiculo: "BRA-4D88",
    motorista_nome: "Sebastião Moreira",
    motorista_cpf: "142.857.369-01",
    motorista_cnh: "04982716352",
    doca_id: "doca-01",
    doca_nome: "Doca 01 — Lojas Capital Express",
    horario_previsto_carregamento: "11:00",
    horario_real_inicio: "11:05",
    status: "em_carregamento",
    pedidos_ids: ["ped-001"],
    pedidos_numeros: ["PED-2026-0842"],
    lojas_atendidas: [
      {
        cod_loja: "LJ-008",
        nome_loja: "Loja 08 - Shopping Eldorado",
        total_volumes: 2,
        total_itens: 40,
        peso_kg: 30.5,
      },
    ],
    total_volumes: 2,
    volumes_bipados: 1,
    peso_total_kg: 30.5,
    cubagem_total_m3: 0.06,
    volumes: [
      {
        id: "vol-001-1",
        codigo_volume: "VOL-0842-01",
        numero_pedido: "PED-2026-0842",
        loja_destino: "Loja 08 - Shopping Eldorado",
        cod_loja: "LJ-008",
        rota: "Rota 01 - Zona Sul Express",
        peso_kg: 10.5,
        tipo_embalagem: "Caixa Média CX-M",
        bipado: true,
        bipado_em: "2026-11-19 11:12",
        operador_bipagem: "Carlos Rezende",
      },
      {
        id: "vol-001-2",
        codigo_volume: "VOL-0842-02",
        numero_pedido: "PED-2026-0842",
        loja_destino: "Loja 08 - Shopping Eldorado",
        cod_loja: "LJ-008",
        rota: "Rota 01 - Zona Sul Express",
        peso_kg: 20.0,
        tipo_embalagem: "Caixa Média CX-M",
        bipado: false,
      },
    ],
    romaneio_digital_gerado: false,
    erp_sincronizado: false,
    documentos_fiscais: {
      mdf_e_numero: "MDF-e 001.482.910",
      cte_numero: "CT-e 003.882",
      nfs_chaves: ["35261100000000000000550010000008421000008423"],
    },
    observacoes: "Carga prioritária de reposição matinal de lojas.",
  },
  {
    id: "crg-002",
    numero_carga: "CRG-2026-0043",
    data_criacao: "2026-11-19 09:30",
    data_entrega_prevista: "2026-11-19",
    regiao: "Interior",
    rota: "Rota 10 - Campinas / RMC",
    transportadora: "Rápido Paulista Cargas",
    veiculo_tipo: "Carreta",
    placa_veiculo: "CLB-9E20",
    motorista_nome: "Antônio Fernandes",
    motorista_cpf: "283.914.520-88",
    motorista_cnh: "09283716281",
    doca_id: "doca-03",
    doca_nome: "Doca 03 — Interior RMC Campinas",
    horario_previsto_carregamento: "14:00",
    status: "aguardando_carga",
    pedidos_ids: ["ped-003"],
    pedidos_numeros: ["PED-2026-0844"],
    lojas_atendidas: [
      {
        cod_loja: "LJ-003",
        nome_loja: "Loja 03 - Campinas Iguatemi",
        total_volumes: 2,
        total_itens: 40,
        peso_kg: 24.0,
      },
    ],
    total_volumes: 2,
    volumes_bipados: 0,
    peso_total_kg: 24.0,
    cubagem_total_m3: 0.042,
    volumes: [
      {
        id: "vol-003-1",
        codigo_volume: "VOL-0844-01",
        numero_pedido: "PED-2026-0844",
        loja_destino: "Loja 03 - Campinas Iguatemi",
        cod_loja: "LJ-003",
        rota: "Rota 10 - Campinas / RMC",
        peso_kg: 20.0,
        tipo_embalagem: "Caixa Média CX-M",
        bipado: false,
      },
      {
        id: "vol-003-2",
        codigo_volume: "VOL-0844-02",
        numero_pedido: "PED-2026-0844",
        loja_destino: "Loja 03 - Campinas Iguatemi",
        cod_loja: "LJ-003",
        rota: "Rota 10 - Campinas / RMC",
        peso_kg: 4.0,
        tipo_embalagem: "Caixa Pequena CX-P",
        bipado: false,
      },
    ],
    romaneio_digital_gerado: false,
    erp_sincronizado: false,
    documentos_fiscais: {
      mdf_e_numero: "MDF-e 001.482.911",
      cte_numero: "CT-e 003.883",
      nfs_chaves: ["35261100000000000000550010000008441000008447"],
    },
  },
  {
    id: "crg-003",
    numero_carga: "CRG-2026-0044",
    data_criacao: "2026-11-19 08:00",
    data_entrega_prevista: "2026-11-19",
    data_saida_real: "2026-11-19 10:20",
    regiao: "Litoral",
    rota: "Rota 04 - Baixada Santista",
    transportadora: "Expresso Litoral Sul",
    veiculo_tipo: "Truck Baú",
    placa_veiculo: "SAN-8K41",
    motorista_nome: "Rodrigo Almeida",
    motorista_cpf: "349.182.740-92",
    motorista_cnh: "03819273641",
    doca_id: "doca-04",
    doca_nome: "Doca 04 — Litoral Santos / Baixada",
    horario_previsto_carregamento: "09:30",
    horario_real_inicio: "09:35",
    horario_real_conclusao: "10:10",
    status: "em_transito",
    pedidos_ids: ["ped-004"],
    pedidos_numeros: ["PED-2026-0845"],
    lojas_atendidas: [
      {
        cod_loja: "LJ-012",
        nome_loja: "Loja 12 - Santos Gonzaga",
        total_volumes: 2,
        total_itens: 35,
        peso_kg: 40.5,
      },
    ],
    total_volumes: 2,
    volumes_bipados: 2,
    peso_total_kg: 40.5,
    cubagem_total_m3: 0.102,
    volumes: [
      {
        id: "vol-004-1",
        codigo_volume: "VOL-0845-01",
        numero_pedido: "PED-2026-0845",
        loja_destino: "Loja 12 - Santos Gonzaga",
        cod_loja: "LJ-012",
        rota: "Rota 04 - Baixada Santista",
        peso_kg: 10.5,
        tipo_embalagem: "Caixa Média CX-M",
        bipado: true,
        bipado_em: "2026-11-19 09:45",
        operador_bipagem: "Carlos Rezende",
      },
      {
        id: "vol-004-2",
        codigo_volume: "VOL-0845-02",
        numero_pedido: "PED-2026-0845",
        loja_destino: "Loja 12 - Santos Gonzaga",
        cod_loja: "LJ-012",
        rota: "Rota 04 - Baixada Santista",
        peso_kg: 30.0,
        tipo_embalagem: "Caixa Grande CX-G",
        bipado: true,
        bipado_em: "2026-11-19 09:50",
        operador_bipagem: "Carlos Rezende",
      },
    ],
    romaneio_digital_gerado: true,
    data_romaneio: "2026-11-19 10:15",
    assinatura_motorista: {
      nome: "Rodrigo Almeida",
      cpf: "349.182.740-92",
      cnh: "03819273641",
      data_hora: "2026-11-19 10:18",
      assinatura_base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40'><path d='M10 25 Q 30 5 60 20 T 110 25' stroke='blue' stroke-width='2' fill='none'/></svg>",
    },
    erp_sincronizado: true,
    erp_protocolo_saida: "ERP-EXP-2026-99381",
    documentos_fiscais: {
      mdf_e_numero: "MDF-e 001.482.909",
      cte_numero: "CT-e 003.880",
      nfs_chaves: ["35261100000000000000550010000008451000008452"],
    },
  },
];
