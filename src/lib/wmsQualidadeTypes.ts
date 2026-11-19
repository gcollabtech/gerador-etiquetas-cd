export type TipoInspecao = "amostragem" | "integral";

export type StatusInspecao =
  | "pendente"
  | "em_analise"
  | "aprovado"
  | "aprovado_com_ressalvas"
  | "rejeitado"
  | "quarentena";

export type DestinacaoQualidade =
  | "liberado"
  | "devolucao_fornecedor"
  | "aguardando_analise"
  | "descarte_autorizado"
  | "bloqueio_definitivo";

export type TipoOcorrenciaNC =
  | "avaria_embalagem"
  | "validade_curta_ou_vencida"
  | "embalagem_violada_ou_umida"
  | "temperatura_inadequada"
  | "contaminacao_ou_praga"
  | "divergencia_rotulo_ou_ean"
  | "lote_incompativel"
  | "transporte_inadequado"
  | "outros";

export type TipoBloqueioQualidade =
  | "produto"
  | "lote"
  | "endereco"
  | "quantidade_parcial"
  | "nota_fiscal";

export interface ChecklistItem {
  id: string;
  item: string;
  aprovado: boolean;
  obrigatorio: boolean;
  observacao?: string;
}

export interface InspecaoQualidade {
  id: string;
  codigoInspecao: string; // Ex: INS-2026-001
  tipoInspecao: TipoInspecao; // amostragem ou integral
  origem: "recebimento" | "armazenado_cd";
  dataHora: string;
  inspetor: string;
  
  // Dados do Item / Carga
  produtoId: string;
  produtoDescricao: string;
  sku: string;
  lote: string;
  validade: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNotaFiscal: string;
  chaveNfe?: string;
  enderecoArmazenamento?: string; // Padrão R-P-N-A (ex: R01-P02-N01-A03)
  
  // Quantidades
  quantidadeTotalLote: number;
  quantidadeInspecionada: number;
  tamanhoAmostra: number;
  unidadeMedida: string;
  
  // Parâmetros Físicos e Ambientais
  temperaturaAferida?: number; // em °C (ex: 4.2°C)
  temperaturaMinExigida?: number;
  temperaturaMaxExigida?: number;
  condicoesTransporte?: {
    veiculoHigienizado: boolean;
    ausenciaOdoresPragas: boolean;
    bauFechadoTermico: boolean;
    observacaoTransporte?: string;
  };
  
  // Checklist de Verificação (Item 9.2)
  checklist: {
    integridadeEmbalagem: boolean;
    validadeConforme: boolean;
    loteLegivel: boolean;
    identificacaoRotulagem: boolean;
    condicoesFisicas: boolean;
    temperaturaConforme?: boolean;
    transporteConforme?: boolean;
  };
  
  status: StatusInspecao;
  destinacaoFinal?: DestinacaoQualidade;
  parecerTecnico: string;
  temNaoConformidade: boolean;
  naoConformidadeId?: string;
}

export interface EvidenciaFoto {
  id: string;
  url: string;
  legenda: string;
  dataUpload: string;
}

export interface NaoConformidadeQualidade {
  id: string;
  codigoRnc: string; // Ex: RNC-2026-089
  inspecaoId?: string;
  
  // Dados do produto/fornecedor (Item 9.3)
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
  fotos: EvidenciaFoto[];
  responsavel: string;
  dataHora: string;
  parecer: string;
  destinacao: DestinacaoQualidade;
  
  // Alçada e Resolução
  bloqueioGeradoId?: string;
  statusRnc: "aberta" | "em_tratativa" | "destinada" | "encerrada";
  protocoloDevolucaoRtv?: string;
  laudoDescarte?: string;
  resolvidoPor?: string;
  resolvidoEm?: string;
}

export interface BloqueioQualidade {
  id: string;
  codigoBloqueio: string; // Ex: BLQ-2026-004
  tipoBloqueio: TipoBloqueioQualidade; // produto, lote, endereco, quantidade_parcial, nota_fiscal
  motivo: string;
  rncId?: string;
  
  // Elementos do bloqueio (Item 9.4)
  produtoId?: string;
  sku?: string;
  produtoDescricao?: string;
  lote?: string;
  endereco?: string; // Padrão R-P-N-A
  numeroNotaFiscal?: string;
  quantidadeBloqueada?: number;
  unidadeMedida?: string;
  
  // Governança WMS
  impedePicking: boolean;
  impedeTransferencia: boolean;
  impedeExpedicao: boolean;
  
  ativo: boolean;
  criadoPor: string;
  criadoEm: string;
  desbloqueadoPor?: string;
  desbloqueadoEm?: string;
  justificativaDesbloqueio?: string;
}

export interface IndicadoresQualidade {
  totalInspecoes: number;
  taxaConformidade: number; // Porcentagem de conformes
  inspecoesAprovadas: number;
  inspecoesQuarentena: number;
  inspecoesRejeitadas: number;
  rncsAbertas: number;
  totalBloqueiosAtivos: number;
  skusBloqueados: number;
  lotesBloqueados: number;
  enderecosBloqueados: number;
  devolucoesPendentes: number;
  descartesAprovados: number;
}

export const QUALIDADE_SEED: {
  inspecoes: InspecaoQualidade[];
  naoConformidades: NaoConformidadeQualidade[];
  bloqueios: BloqueioQualidade[];
} = {
  inspecoes: [
    {
      id: "ins-01",
      codigoInspecao: "INS-2026-001",
      tipoInspecao: "amostragem",
      origem: "recebimento",
      dataHora: "2026-11-19 09:15",
      inspetor: "Dra. Juliana Prado (Garantia da Qualidade)",
      produtoId: "prod-001",
      produtoDescricao: "Leite UHT Integral 1L - Tetra Pak",
      sku: "LEITE-UHT-1L",
      lote: "L-2026-88A",
      validade: "2027-04-15",
      fornecedorNome: "Laticínios Bela Vista S/A",
      fornecedorCnpj: "02.345.678/0001-90",
      numeroNotaFiscal: "001452",
      chaveNfe: "35261102345678000190550010000014521009876543",
      enderecoArmazenamento: "R01-P01-N01-A01",
      quantidadeTotalLote: 1200,
      quantidadeInspecionada: 80,
      tamanhoAmostra: 80,
      unidadeMedida: "UN",
      temperaturaAferida: 18.5,
      temperaturaMinExigida: 15.0,
      temperaturaMaxExigida: 25.0,
      condicoesTransporte: {
        veiculoHigienizado: true,
        ausenciaOdoresPragas: true,
        bauFechadoTermico: true,
      },
      checklist: {
        integridadeEmbalagem: true,
        validadeConforme: true,
        loteLegivel: true,
        identificacaoRotulagem: true,
        condicoesFisicas: true,
        temperaturaConforme: true,
        transporteConforme: true,
      },
      status: "aprovado",
      destinacaoFinal: "liberado",
      parecerTecnico: "Amostragem de 80 caixas conforme norma NBR 5426. Selos íntegros e teste sensorial sem não-conformidades.",
      temNaoConformidade: false,
    },
    {
      id: "ins-02",
      codigoInspecao: "INS-2026-002",
      tipoInspecao: "integral",
      origem: "recebimento",
      dataHora: "2026-11-19 10:30",
      inspetor: "Carlos Eduardo (Controle de Qualidade)",
      produtoId: "prod-002",
      produtoDescricao: "Iogurte Natural Frutas Vermelhas 170g",
      sku: "IOG-NAT-170G",
      lote: "L-FRUTAS-99B",
      validade: "2026-12-10",
      fornecedorNome: "Danone Brasil Distribuidora",
      fornecedorCnpj: "43.210.987/0001-55",
      numeroNotaFiscal: "003982",
      chaveNfe: "35261143210987000155550010000039821001234567",
      enderecoArmazenamento: "R02-P01-N01-A02",
      quantidadeTotalLote: 300,
      quantidadeInspecionada: 300,
      tamanhoAmostra: 300,
      unidadeMedida: "UN",
      temperaturaAferida: 12.8,
      temperaturaMinExigida: 2.0,
      temperaturaMaxExigida: 8.0,
      condicoesTransporte: {
        veiculoHigienizado: true,
        ausenciaOdoresPragas: true,
        bauFechadoTermico: true,
        observacaoTransporte: "Termógrafo do veículo desligado durante o trajeto interestadual.",
      },
      checklist: {
        integridadeEmbalagem: true,
        validadeConforme: true,
        loteLegivel: true,
        identificacaoRotulagem: true,
        condicoesFisicas: false,
        temperaturaConforme: false,
        transporteConforme: false,
      },
      status: "rejeitado",
      destinacaoFinal: "devolucao_fornecedor",
      parecerTecnico: "Ruptura da cadeia de frio: produto recebido a 12.8°C (limite máximo regulamentar 8.0°C). Reprovado integralmente para devolução imediata.",
      temNaoConformidade: true,
      naoConformidadeId: "rnc-01",
    },
    {
      id: "ins-03",
      codigoInspecao: "INS-2026-003",
      tipoInspecao: "amostragem",
      origem: "armazenado_cd",
      dataHora: "2026-11-19 11:45",
      inspetor: "Dra. Juliana Prado (Garantia da Qualidade)",
      produtoId: "prod-003",
      produtoDescricao: "Arroz Agulhinha Tipo 1 5kg",
      sku: "ARR-AGU-5KG",
      lote: "L-ARROZ-771",
      validade: "2027-08-20",
      fornecedorNome: "Camil Alimentos S.A.",
      fornecedorCnpj: "64.904.295/0001-03",
      numeroNotaFiscal: "008741",
      enderecoArmazenamento: "R01-P03-N02-A04",
      quantidadeTotalLote: 600,
      quantidadeInspecionada: 50,
      tamanhoAmostra: 50,
      unidadeMedida: "PCT",
      checklist: {
        integridadeEmbalagem: false,
        validadeConforme: true,
        loteLegivel: true,
        identificacaoRotulagem: true,
        condicoesFisicas: false,
        temperaturaConforme: true,
        transporteConforme: true,
      },
      status: "quarentena",
      destinacaoFinal: "aguardando_analise",
      parecerTecnico: "Identificada umidade no nível inferior do pallet durante auditoria de rotina. 15 pacotes com sinais de condensação colocados em quarentena para laudo.",
      temNaoConformidade: true,
      naoConformidadeId: "rnc-02",
    },
  ],
  naoConformidades: [
    {
      id: "rnc-01",
      codigoRnc: "RNC-2026-001",
      inspecaoId: "ins-02",
      produtoId: "prod-002",
      produtoDescricao: "Iogurte Natural Frutas Vermelhas 170g",
      sku: "IOG-NAT-170G",
      lote: "L-FRUTAS-99B",
      fornecedorNome: "Danone Brasil Distribuidora",
      fornecedorCnpj: "43.210.987/0001-55",
      numeroNotaFiscal: "003982",
      quantidadeAfetada: 300,
      unidadeMedida: "UN",
      tipoOcorrencia: "temperatura_inadequada",
      fotos: [
        {
          id: "foto-1",
          url: "https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=400&q=80",
          legenda: "Aferição termométrica no centro da carga: 12.8°C",
          dataUpload: "2026-11-19 10:35",
        },
      ],
      responsavel: "Carlos Eduardo (Controle de Qualidade)",
      dataHora: "2026-11-19 10:35",
      parecer: "Inconformidade crítica por perda de refrigeração. NF retida e lote com bloqueio total emitido para devolução ao transportador.",
      destinacao: "devolucao_fornecedor",
      bloqueioGeradoId: "blq-01",
      statusRnc: "destinada",
      protocoloDevolucaoRtv: "RTV-FORN-2026-00441",
      resolvidoPor: "Mariana Costa (Gerente da Qualidade)",
      resolvidoEm: "2026-11-19 11:00",
    },
    {
      id: "rnc-02",
      codigoRnc: "RNC-2026-002",
      inspecaoId: "ins-03",
      produtoId: "prod-003",
      produtoDescricao: "Arroz Agulhinha Tipo 1 5kg",
      sku: "ARR-AGU-5KG",
      lote: "L-ARROZ-771",
      fornecedorNome: "Camil Alimentos S.A.",
      fornecedorCnpj: "64.904.295/0001-03",
      numeroNotaFiscal: "008741",
      quantidadeAfetada: 15,
      unidadeMedida: "PCT",
      tipoOcorrencia: "embalagem_violada_ou_umida",
      fotos: [
        {
          id: "foto-2",
          url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80",
          legenda: "Fardo inferior com infiltração e umidade pontual",
          dataUpload: "2026-11-19 11:50",
        },
      ],
      responsavel: "Dra. Juliana Prado (Garantia da Qualidade)",
      dataHora: "2026-11-19 11:50",
      parecer: "Bloqueio parcial de 15 pacotes segregados na área de Quarentena. Saldo restante do lote (585 pct) permanece liberado no porta-paletes.",
      destinacao: "aguardando_analise",
      bloqueioGeradoId: "blq-02",
      statusRnc: "em_tratativa",
    },
  ],
  bloqueios: [
    {
      id: "blq-01",
      codigoBloqueio: "BLQ-2026-001",
      tipoBloqueio: "lote",
      motivo: "Ruptura de cadeia de frio (12.8°C) - Devolução ao fornecedor",
      rncId: "rnc-01",
      produtoId: "prod-002",
      sku: "IOG-NAT-170G",
      produtoDescricao: "Iogurte Natural Frutas Vermelhas 170g",
      lote: "L-FRUTAS-99B",
      numeroNotaFiscal: "003982",
      quantidadeBloqueada: 300,
      unidadeMedida: "UN",
      impedePicking: true,
      impedeTransferencia: true,
      impedeExpedicao: true,
      ativo: true,
      criadoPor: "Carlos Eduardo (Controle de Qualidade)",
      criadoEm: "2026-11-19 10:36",
    },
    {
      id: "blq-02",
      codigoBloqueio: "BLQ-2026-002",
      tipoBloqueio: "quantidade_parcial",
      motivo: "Avaria por umidade em 15 pacotes segregados na Quarentena",
      rncId: "rnc-02",
      produtoId: "prod-003",
      sku: "ARR-AGU-5KG",
      produtoDescricao: "Arroz Agulhinha Tipo 1 5kg",
      lote: "L-ARROZ-771",
      endereco: "R01-P03-N02-A04",
      quantidadeBloqueada: 15,
      unidadeMedida: "PCT",
      impedePicking: true,
      impedeTransferencia: true,
      impedeExpedicao: true,
      ativo: true,
      criadoPor: "Dra. Juliana Prado (Garantia da Qualidade)",
      criadoEm: "2026-11-19 11:52",
    },
    {
      id: "blq-03",
      codigoBloqueio: "BLQ-2026-003",
      tipoBloqueio: "endereco",
      motivo: "Manutenção estrutural do montante no nível 01",
      endereco: "R03-P02-N01-A01",
      impedePicking: true,
      impedeTransferencia: true,
      impedeExpedicao: true,
      ativo: true,
      criadoPor: "Supervisão de Manutenção CD",
      criadoEm: "2026-11-18 14:00",
    },
  ],
};
