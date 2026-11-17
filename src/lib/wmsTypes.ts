export type AgendamentoStatus =
  | "solicitado"
  | "aguardando_aprovacao"
  | "agendado"
  | "confirmado"
  | "em_transito"
  | "chegou_portaria"
  | "aguardando_doca"
  | "em_descarga"
  | "finalizado"
  | "cancelado"
  | "nao_compareceu";

export type AgendamentoCanal = "portal_web" | "app_mobile" | "whatsapp";

export type VeiculoTipo =
  | "VUC"
  | "3/4"
  | "Toco"
  | "Truck"
  | "Carreta"
  | "Outros";

export type JanelaHorario =
  | "08:00 - 10:00"
  | "10:00 - 12:00"
  | "12:00 - 14:00"
  | "14:00 - 16:00"
  | "16:00 - 18:00";

export interface CheckInInfo {
  dataHoraChegada: string;
  horarioPrevisto: string;
  tempoDiferencaMinutos: number; // >0 atraso, <0 adiantado, 0 no horario
  statusPontualidade: "no_horario" | "atrasado" | "antecipado";
  responsavelPortaria: string;
  observacoesChegada?: string;
}

export interface EntregaAgendamento {
  id: string;
  protocolo: string; // Ex: AGD-20261117-0042
  data: string; // YYYY-MM-DD
  janela: JanelaHorario;
  docaDesignada?: string; // Ex: Doca 01, Doca 02
  canal: AgendamentoCanal;
  status: AgendamentoStatus;

  // Informações obrigatórias (Item 2.4)
  fornecedorNome: string;
  fornecedorCnpj: string;
  transportadoraNome: string;
  transportadoraCnpj?: string;
  numeroNotaFiscal: string;
  chaveNfe: string; // 44 dígitos
  quantidadeVolumes: number;
  quantidadeNfs: number;
  tipoVeiculo: VeiculoTipo;
  placaVeiculo: string;
  motoristaNome: string;
  motoristaTelefone: string;
  observacoes?: string;

  // Timestamps de fluxo e controle
  createdAt: string;
  updatedAt?: string;
  checkIn?: CheckInInfo;
  inicioDescarga?: string;
  fimDescarga?: string;
  tempoEsperaMinutos?: number; // minutos entre chegada e início de descarga
  tempoDescargaMinutos?: number;
}

export interface JanelaCapacidadeInfo {
  janela: JanelaHorario;
  data: string;
  totalFornecedores: number;
  maxFornecedores: number; // 2
  totalVolumes: number;
  maxVolumes: number; // 500
  disponivel: boolean;
  bloqueada: boolean;
  motivoBloqueio?: string;
  docasBloqueadas?: string[];
  agendamentos: EntregaAgendamento[];
}

export interface BloqueioJanela {
  id: string;
  data: string; // YYYY-MM-DD
  janela: JanelaHorario | "todas";
  docaId?: string;
  motivo: string;
  criadoPor: string;
  createdAt: string;
}

export interface IndicadoresAgendamento {
  totalAgendamentosDia: number;
  totalVolumesPrevistos: number;
  taxaOcupacaoGeralPct: number;
  entregasFinalizadas: number;
  entregasNoHorario: number;
  entregasAtrasadas: number;
  naoCompareceram: number;
  tempoMedioEsperaMinutos: number;
  volumesPorJanela: { janela: JanelaHorario; volumes: number; fornecedores: number }[];
  distribuicaoCanais: { canal: AgendamentoCanal; count: number; pct: number }[];
}
