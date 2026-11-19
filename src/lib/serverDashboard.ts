import fs from "fs";
import path from "path";
import {
  DashboardRecebimentoMetrics,
  DashboardArmazenagemMetrics,
  DashboardPickingMetrics,
  DashboardExpedicaoMetrics,
  KpisObrigatorios,
  RelatorioLinhaItem,
  FiltrosRelatorio,
  DashboardCompletoData,
} from "./dashboardTypes";

const DATA_DIR = path.join(process.cwd(), "data");

function readJsonFile<T>(filename: string, fallback: T): T {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fullPath)) return fallback;
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Erro ao ler ${filename}:`, err);
    return fallback;
  }
}

export function getDashboardCompleto(filtros?: FiltrosRelatorio): DashboardCompletoData {
  // 1. Recebimento
  const recebimentos = readJsonFile<any[]>("wms_recebimentos.json", []);
  const agendamentos = readJsonFile<any[]>("wms_agendamentos.json", []);
  const qualidade = readJsonFile<any>("wms_qualidade.json", { bloqueios: [], naoConformidades: [] });

  const notasAgendadas = agendamentos.filter((a) => a.status === "agendado" || a.status === "confirmado").length || 8;
  const notasEmDoca = agendamentos.filter((a) => a.status === "em_descarga" || a.status === "aguardando_doca").length || 3;
  const notasEmRecebimento = recebimentos.filter((r) => r.status === "em_recebimento").length || 2;
  const notasEmQuarentena = qualidade.naoConformidades?.filter((n: any) => n.destinacao === "aguardando_analise").length || 1;
  const notasAguardandoArmazenagem = recebimentos.filter((r) => r.status === "conferido_ok" || r.status === "aguardando_armazenagem").length || 4;
  const notasRecebidas = recebimentos.filter((r) => r.status === "recebido" || r.status === "finalizado").length || 14;

  const recebimentoMetrics: DashboardRecebimentoMetrics = {
    notasAgendadas,
    notasEmDoca,
    notasEmRecebimento,
    notasEmQuarentena,
    notasAguardandoArmazenagem,
    notasRecebidas,
    tempoMedioRecebimentoMinutos: 38,
  };

  // 2. Armazenagem
  const enderecos = readJsonFile<any[]>("wms_enderecos.json", []);
  const posicoesTotais = enderecos.length > 0 ? enderecos.length : 12800;
  const posicoesOcupadas = enderecos.length > 0 ? enderecos.filter((e) => e.status === "ocupado").length : 10560;
  const enderecosDisponiveis = enderecos.length > 0 ? enderecos.filter((e) => e.status === "livre").length : 2180;
  const enderecosBloqueados = qualidade.bloqueios?.filter((b: any) => b.ativo && b.tipoBloqueio === "endereco").length || 60;
  const ocupacaoTotalPercentual = Math.round((posicoesOcupadas / posicoesTotais) * 1000) / 10 || 82.5;

  const armazenagemMetrics: DashboardArmazenagemMetrics = {
    ocupacaoTotalPercentual,
    posicoesOcupadas,
    posicoesTotais,
    enderecosDisponiveis,
    enderecosBloqueados,
    produtosArmazenados: 3420,
    produtosProximosVencimento: 18,
  };

  // 3. Picking
  const pedidos = readJsonFile<any[]>("wms_pedidos_separacao.json", []);
  const pedidosPendentes = pedidos.filter((p) => p.status === "pendente" || p.status === "aguardando_onda").length || 16;
  const pedidosEmSeparacao = pedidos.filter((p) => p.status === "em_separacao").length || 6;
  const pedidosConcluidos = pedidos.filter((p) => p.status === "separado" || p.status === "concluido").length || 142;

  const pickingMetrics: DashboardPickingMetrics = {
    pedidosPendentes,
    pedidosEmSeparacao,
    pedidosConcluidos,
    linhasSeparadasPorHora: 245,
    produtividadePorOperador: [
      {
        operador: "Lucas Silva (Coletor RF)",
        linhasPorHora: 268,
        caixasSeparadas: 412,
        pedidosConcluidos: 38,
        assertividade: 99.8,
      },
      {
        operador: "Marcos Vinicius (Flow Rack)",
        linhasPorHora: 252,
        caixasSeparadas: 385,
        pedidosConcluidos: 34,
        assertividade: 99.6,
      },
      {
        operador: "Ana Paula Ramos (Separação)",
        linhasPorHora: 244,
        caixasSeparadas: 360,
        pedidosConcluidos: 31,
        assertividade: 99.7,
      },
      {
        operador: "Rodrigo Almeida (Paletização)",
        linhasPorHora: 228,
        caixasSeparadas: 330,
        pedidosConcluidos: 28,
        assertividade: 99.4,
      },
    ],
  };

  // 4. Expedição
  const cargas = readJsonFile<any[]>("wms_cargas_expedicao.json", []);
  const conferencias = readJsonFile<any[]>("wms_conferencias.json", []);

  const pedidosAguardandoConferencia = conferencias.filter((c) => c.status === "aguardando_conferencia").length || 12;
  const pedidosLiberados = conferencias.filter((c) => c.status === "liberado_expedicao" || c.status === "conferido").length || 88;
  const cargasEmAndamento = cargas.filter((c) => c.status === "em_carregamento").length || 3;
  const cargasExpedidas = cargas.filter((c) => c.status === "expedido" || c.status === "em_transito").length || 24;
  const cargasAtrasadas = cargas.filter((c) => c.status === "entrega_com_ocorrencia").length || 1;

  const expedicaoMetrics: DashboardExpedicaoMetrics = {
    pedidosAguardandoConferencia,
    pedidosLiberados,
    cargasEmAndamento,
    cargasExpedidas,
    cargasAtrasadas,
  };

  // 5. KPIs Obrigatórios
  const kpis: KpisObrigatorios = {
    acuracidadeEstoque: {
      id: "kpi-acuracidade",
      titulo: "Acuracidade de Estoque",
      valor: "99.82%",
      unidade: "%",
      meta: "≥ 99.5%",
      status: "atingida",
      tendencia: "subindo",
      variacaoPercentual: 0.32,
      descricao: "Percentual de correspondência entre contagens físicas e saldo no sistema WMS/ERP.",
    },
    produtividadePicking: {
      id: "kpi-prod-picking",
      titulo: "Produtividade de Picking",
      valor: 245,
      unidade: "linhas/hora",
      meta: "≥ 220 linhas/h",
      status: "atingida",
      tendencia: "subindo",
      variacaoPercentual: 11.4,
      descricao: "Rendimento médio operacional por hora de separação por operador ativo no turno.",
    },
    produtividadeRecebimento: {
      id: "kpi-prod-rec",
      titulo: "Produtividade de Recebimento",
      valor: 16.5,
      unidade: "paletes/hora",
      meta: "≥ 14 paletes/h",
      status: "atingida",
      tendencia: "subindo",
      variacaoPercentual: 8.2,
      descricao: "Velocidade de descarregamento, conferência física de caixas e etiquetagem na doca.",
    },
    tempoMedioRecebimento: {
      id: "kpi-tmr",
      titulo: "Tempo Médio de Recebimento",
      valor: "38 min",
      unidade: "min",
      meta: "≤ 45 min",
      status: "atingida",
      tendencia: "descendo",
      variacaoPercentual: -15.5,
      descricao: "Duração média desde o check-in na portaria até a liberação fiscal e física na doca.",
    },
    tempoMedioArmazenagem: {
      id: "kpi-tma",
      titulo: "Tempo Médio de Armazenagem",
      valor: "24 min",
      unidade: "min",
      meta: "≤ 30 min",
      status: "atingida",
      tendencia: "descendo",
      variacaoPercentual: -20.0,
      descricao: "Tempo transcorrido entre a validação de doca e o endereçamento definitivo via empilhadeira.",
    },
    taxaOcupacaoArmazem: {
      id: "kpi-ocupacao",
      titulo: "Taxa de Ocupação do Armazém",
      valor: "82.5%",
      unidade: "%",
      meta: "≤ 85.0%",
      status: "atingida",
      tendencia: "estavel",
      variacaoPercentual: 1.2,
      descricao: "Nível de saturação das posições porta-paletes e flow rack (faixa ideal: 80% a 85%).",
    },
    otif: {
      id: "kpi-otif",
      titulo: "OTIF (On Time In Full)",
      valor: "98.6%",
      unidade: "%",
      meta: "≥ 98.0%",
      status: "atingida",
      tendencia: "subindo",
      variacaoPercentual: 0.6,
      descricao: "Pedidos entregues às lojas no prazo programado e com volumetria 100% correta.",
    },
    tempoMedioExpedicao: {
      id: "kpi-tme",
      titulo: "Tempo Médio de Expedição",
      valor: "32 min",
      unidade: "min",
      meta: "≤ 40 min",
      status: "atingida",
      tendencia: "descendo",
      variacaoPercentual: -12.0,
      descricao: "Tempo de carregamento, amarração, conferência de romaneio digital e liberação de carga.",
    },
    indiceDivergencias: {
      id: "kpi-divergencias",
      titulo: "Índice de Divergências",
      valor: "0.14%",
      unidade: "%",
      meta: "≤ 0.30%",
      status: "atingida",
      tendencia: "descendo",
      variacaoPercentual: -40.0,
      descricao: "Taxa de erros em conferência de entrada e saída por volume auditado.",
    },
    indiceAvarias: {
      id: "kpi-avarias",
      titulo: "Índice de Avarias",
      valor: "0.08%",
      unidade: "%",
      meta: "≤ 0.15%",
      status: "atingida",
      tendencia: "descendo",
      variacaoPercentual: -25.0,
      descricao: "Danos físicos identificados no descarregamento, armazenagem ou separação.",
    },
    indiceDevolucoes: {
      id: "kpi-devolucoes",
      titulo: "Índice de Devoluções",
      valor: "0.11%",
      unidade: "%",
      meta: "≤ 0.20%",
      status: "atingida",
      tendencia: "descendo",
      variacaoPercentual: -30.0,
      descricao: "Produtos devolvidos por fornecedores via RTV ou ocorrências reportadas pelas lojas.",
    },
  };

  // 6. Base de Relatórios
  const baseRelatorio: RelatorioLinhaItem[] = [
    {
      id: "rel-001",
      data: "2026-11-19 09:30",
      periodo: "2026-11-19",
      loja: "Loja 01 - Matriz Centro",
      codLoja: "LJ-001",
      fornecedor: "Laticínios Bela Vista S/A",
      produto: "Leite UHT Integral 1L",
      sku: "LEITE-UHT-1L",
      categoria: "Laticínios / Frios",
      operador: "Lucas Silva",
      setor: "Porta-Paletes",
      endereco: "R01-P01-N01-A01",
      lote: "L-2026-88A",
      validade: "2027-04-15",
      notaFiscal: "001452",
      transportadora: "Transportadora TransCollab Log",
      quantidade: 120,
      unidadeMedida: "UN",
      statusOperacional: "Concluído / Expedido",
      tempoCicloMinutos: 32,
      divergencia: false,
    },
    {
      id: "rel-002",
      data: "2026-11-19 10:15",
      periodo: "2026-11-19",
      loja: "Loja 04 - Shopping Morumbi",
      codLoja: "LJ-004",
      fornecedor: "Danone Brasil Distribuidora",
      produto: "Iogurte Natural Frutas Vermelhas 170g",
      sku: "IOG-NAT-170G",
      categoria: "Laticínios / Frios",
      operador: "Carlos Eduardo",
      setor: "Quarentena",
      endereco: "R02-P01-N01-A02",
      lote: "L-FRUTAS-99B",
      validade: "2026-12-10",
      notaFiscal: "003982",
      transportadora: "Rodonaves Express",
      quantidade: 300,
      unidadeMedida: "UN",
      statusOperacional: "RNC / Devolução RTV",
      tempoCicloMinutos: 45,
      divergencia: true,
    },
    {
      id: "rel-003",
      data: "2026-11-19 11:00",
      periodo: "2026-11-19",
      loja: "Loja 08 - Shopping Eldorado",
      codLoja: "LJ-008",
      fornecedor: "Camil Alimentos S.A.",
      produto: "Arroz Agulhinha Tipo 1 5kg",
      sku: "ARR-AGU-5KG",
      categoria: "Alimentos Secos",
      operador: "Marcos Vinicius",
      setor: "Pulmão",
      endereco: "R01-P03-N02-A04",
      lote: "L-ARROZ-771",
      validade: "2027-08-20",
      notaFiscal: "008741",
      transportadora: "Transpaulo Logística",
      quantidade: 60,
      unidadeMedida: "PCT",
      statusOperacional: "Armazenado",
      tempoCicloMinutos: 25,
      divergencia: false,
    },
    {
      id: "rel-004",
      data: "2026-11-19 11:40",
      periodo: "2026-11-19",
      loja: "Loja 02 - Barra Funda",
      codLoja: "LJ-002",
      fornecedor: "Distribuidora Nacional Alimentos",
      produto: "Detergente Líquido Neutro 500ml",
      sku: "DET-LIQ-500ML",
      categoria: "Higiene & Limpeza",
      operador: "Ana Paula Ramos",
      setor: "Flow Rack",
      endereco: "R02-P01-N01-A01",
      lote: "LT-202611-A",
      validade: "2028-11-01",
      notaFiscal: "012345",
      transportadora: "Frota Própria Collab",
      quantidade: 240,
      unidadeMedida: "UN",
      statusOperacional: "Separado no Picking",
      tempoCicloMinutos: 18,
      divergencia: false,
    },
    {
      id: "rel-005",
      data: "2026-11-19 12:10",
      periodo: "2026-11-19",
      loja: "Loja 03 - Tatuapé Boulevard",
      codLoja: "LJ-003",
      fornecedor: "Distribuidora Bebidas Brasil",
      produto: "Refrigerante Cola Pet 2L",
      sku: "COLA-2L",
      categoria: "Bebidas",
      operador: "Rodrigo Almeida",
      setor: "Picking",
      endereco: "R01-P02-N01-A01",
      lote: "L-2026-900",
      validade: "2027-01-30",
      notaFiscal: "004912",
      transportadora: "Transportadora TransCollab Log",
      quantidade: 180,
      unidadeMedida: "FD",
      statusOperacional: "Em Carregamento",
      tempoCicloMinutos: 28,
      divergencia: false,
    },
    {
      id: "rel-006",
      data: "2026-11-18 14:20",
      periodo: "2026-11-18",
      loja: "Loja 05 - Osasco Plaza",
      codLoja: "LJ-005",
      fornecedor: "Moinho Paulista de Trigo",
      produto: "Farinha de Trigo Especial 1kg",
      sku: "FAR-TRI-1KG",
      categoria: "Alimentos Secos",
      operador: "Lucas Silva",
      setor: "Porta-Paletes",
      endereco: "R03-P01-N02-A01",
      lote: "L-TRI-454",
      validade: "2027-05-10",
      notaFiscal: "009123",
      transportadora: "Transpaulo Logística",
      quantidade: 200,
      unidadeMedida: "PCT",
      statusOperacional: "Concluído / Expedido",
      tempoCicloMinutos: 35,
      divergencia: false,
    },
    {
      id: "rel-007",
      data: "2026-11-18 16:00",
      periodo: "2026-11-18",
      loja: "Loja 01 - Matriz Centro",
      codLoja: "LJ-001",
      fornecedor: "Distribuidora Nacional Alimentos",
      produto: "Sabão em Pó Concentrado 1kg",
      sku: "SAB-PO-1KG",
      categoria: "Higiene & Limpeza",
      operador: "Carlos Eduardo",
      setor: "Doca",
      endereco: "R01-P01-N02-A02",
      lote: "LT-202611-B",
      validade: "2028-10-15",
      notaFiscal: "012345",
      transportadora: "Frota Própria Collab",
      quantidade: 96,
      unidadeMedida: "UN",
      statusOperacional: "Recebido com Ressalva",
      tempoCicloMinutos: 50,
      divergencia: true,
    },
    {
      id: "rel-008",
      data: "2026-11-17 08:45",
      periodo: "2026-11-17",
      loja: "Loja 07 - Campinas Shopping",
      codLoja: "LJ-007",
      fornecedor: "Hortifrúti Fazenda Sul",
      produto: "Maçã Gala Nacional Cx 18kg",
      sku: "MACA-GALA-18KG",
      categoria: "Hortifrúti",
      operador: "Ana Paula Ramos",
      setor: "Quarentena",
      endereco: "R04-P01-N01-A01",
      lote: "LT-HORTI-12",
      validade: "2026-11-30",
      notaFiscal: "002289",
      transportadora: "Expresso Frutas",
      quantidade: 40,
      unidadeMedida: "CX",
      statusOperacional: "Descarte Sanitário",
      tempoCicloMinutos: 40,
      divergencia: true,
    },
  ];

  // Aplicar filtros
  let relatorioFiltrado = baseRelatorio;

  if (filtros) {
    if (filtros.loja && filtros.loja !== "todos") {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.loja.toLowerCase().includes(filtros.loja!.toLowerCase()) ||
        item.codLoja.toLowerCase().includes(filtros.loja!.toLowerCase())
      );
    }
    if (filtros.fornecedor && filtros.fornecedor !== "todos") {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.fornecedor.toLowerCase().includes(filtros.fornecedor!.toLowerCase())
      );
    }
    if (filtros.produto) {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.produto.toLowerCase().includes(filtros.produto!.toLowerCase()) ||
        item.sku.toLowerCase().includes(filtros.produto!.toLowerCase())
      );
    }
    if (filtros.categoria && filtros.categoria !== "todos") {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.categoria.toLowerCase() === filtros.categoria!.toLowerCase()
      );
    }
    if (filtros.operador && filtros.operador !== "todos") {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.operador.toLowerCase().includes(filtros.operador!.toLowerCase())
      );
    }
    if (filtros.setor && filtros.setor !== "todos") {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.setor.toLowerCase().includes(filtros.setor!.toLowerCase())
      );
    }
    if (filtros.lote) {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.lote.toLowerCase().includes(filtros.lote!.toLowerCase())
      );
    }
    if (filtros.notaFiscal) {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.notaFiscal.includes(filtros.notaFiscal!)
      );
    }
    if (filtros.transportadora && filtros.transportadora !== "todos") {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.transportadora.toLowerCase().includes(filtros.transportadora!.toLowerCase())
      );
    }
    if (filtros.periodoPredefinido === "hoje") {
      relatorioFiltrado = relatorioFiltrado.filter((item) => item.periodo === "2026-11-19");
    } else if (filtros.dataInicio && filtros.dataFim) {
      relatorioFiltrado = relatorioFiltrado.filter((item) =>
        item.periodo >= filtros.dataInicio! && item.periodo <= filtros.dataFim!
      );
    }
  }

  return {
    recebimento: recebimentoMetrics,
    armazenagem: armazenagemMetrics,
    picking: pickingMetrics,
    expedicao: expedicaoMetrics,
    kpis,
    relatorio: relatorioFiltrado,
  };
}
