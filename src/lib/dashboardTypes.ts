export interface DashboardRecebimentoMetrics {
  notasAgendadas: number;
  notasEmDoca: number;
  notasEmRecebimento: number;
  notasEmQuarentena: number;
  notasAguardandoArmazenagem: number;
  notasRecebidas: number;
  tempoMedioRecebimentoMinutos: number; // Ex: 38 min
}

export interface DashboardArmazenagemMetrics {
  ocupacaoTotalPercentual: number; // Ex: 82.5%
  posicoesOcupadas: number;
  posicoesTotais: number;
  enderecosDisponiveis: number;
  enderecosBloqueados: number;
  produtosArmazenados: number; // total de SKUs / itens
  produtosProximosVencimento: number; // lotes com < 60 dias
}

export interface OperadorProdutividade {
  operador: string;
  linhasPorHora: number;
  caixasSeparadas: number;
  pedidosConcluidos: number;
  assertividade: number; // %
}

export interface DashboardPickingMetrics {
  pedidosPendentes: number;
  pedidosEmSeparacao: number;
  pedidosConcluidos: number;
  linhasSeparadasPorHora: number;
  produtividadePorOperador: OperadorProdutividade[];
}

export interface DashboardExpedicaoMetrics {
  pedidosAguardandoConferencia: number;
  pedidosLiberados: number;
  cargasEmAndamento: number;
  cargasExpedidas: number;
  cargasAtrasadas: number;
}

export interface KpiItem {
  id: string;
  titulo: string;
  valor: string | number;
  unidade: string;
  meta: string | number;
  status: "atingida" | "em_alerta" | "critico";
  tendencia: "subindo" | "estavel" | "descendo";
  variacaoPercentual: number;
  descricao: string;
}

export interface KpisObrigatorios {
  acuracidadeEstoque: KpiItem;
  produtividadePicking: KpiItem;
  produtividadeRecebimento: KpiItem;
  tempoMedioRecebimento: KpiItem;
  tempoMedioArmazenagem: KpiItem;
  taxaOcupacaoArmazem: KpiItem;
  otif: KpiItem;
  tempoMedioExpedicao: KpiItem;
  indiceDivergencias: KpiItem;
  indiceAvarias: KpiItem;
  indiceDevolucoes: KpiItem;
}

export interface RelatorioLinhaItem {
  id: string;
  data: string;
  periodo: string;
  loja: string;
  codLoja: string;
  fornecedor: string;
  produto: string;
  sku: string;
  categoria: string;
  operador: string;
  setor: string;
  endereco: string;
  lote: string;
  validade: string;
  notaFiscal: string;
  transportadora: string;
  quantidade: number;
  unidadeMedida: string;
  statusOperacional: string;
  tempoCicloMinutos?: number;
  divergencia?: boolean;
}

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  periodoPredefinido?: "hoje" | "7d" | "30d" | "personalizado";
  loja?: string;
  fornecedor?: string;
  produto?: string;
  categoria?: string;
  operador?: string;
  setor?: string;
  lote?: string;
  notaFiscal?: string;
  transportadora?: string;
}

export interface DashboardCompletoData {
  recebimento: DashboardRecebimentoMetrics;
  armazenagem: DashboardArmazenagemMetrics;
  picking: DashboardPickingMetrics;
  expedicao: DashboardExpedicaoMetrics;
  kpis: KpisObrigatorios;
  relatorio: RelatorioLinhaItem[];
}
