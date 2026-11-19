"use client";

import { useState, useEffect, useMemo } from "react";
import { PortalUser, MainPortalModule } from "@/lib/authTypes";
import {
  DashboardCompletoData,
  FiltrosRelatorio,
  RelatorioLinhaItem,
} from "@/lib/dashboardTypes";
import {
  fetchDashboardData,
  exportarRelatorioCsv,
  exportarRelatorioExcel,
  imprimirRelatorioPdf,
} from "@/lib/dashboardService";
import {
  LayoutDashboard,
  Gauge,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Truck,
  Boxes,
  Barcode,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  PackageCheck,
  Activity,
  Zap,
  Calendar,
  Warehouse,
  Filter,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Download,
  Printer,
  FileText,
  Search,
  Package,
  XCircle,
  RotateCcw,
  Ban,
  Check,
  Percent,
  Timer,
  SlidersHorizontal,
} from "lucide-react";

interface DashboardPortalViewProps {
  currentUser: PortalUser;
  onNavigate: (module: MainPortalModule) => void;
}

export function DashboardPortalView({
  currentUser,
  onNavigate,
}: DashboardPortalViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"gerencial" | "kpis" | "relatorios">("gerencial");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardCompletoData | null>(null);

  // Filtros de Relatório (Item Relatórios)
  const [filtroPeriodo, setFiltroPeriodo] = useState<"hoje" | "7d" | "30d" | "todos">("todos");
  const [filtroLoja, setFiltroLoja] = useState<string>("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>("todos");
  const [filtroProduto, setFiltroProduto] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroOperador, setFiltroOperador] = useState<string>("todos");
  const [filtroSetor, setFiltroSetor] = useState<string>("todos");
  const [filtroLote, setFiltroLote] = useState<string>("");
  const [filtroNotaFiscal, setFiltroNotaFiscal] = useState<string>("");
  const [filtroTransportadora, setFiltroTransportadora] = useState<string>("todos");

  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const carregarDados = async (filtrosCustom?: FiltrosRelatorio) => {
    try {
      const res = await fetchDashboardData(filtrosCustom);
      setDashboardData(res);
    } catch (err) {
      console.error("Erro ao obter dashboard:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    carregarDados({
      periodoPredefinido: filtroPeriodo === "todos" ? undefined : filtroPeriodo,
      loja: filtroLoja,
      fornecedor: filtroFornecedor,
      produto: filtroProduto || undefined,
      categoria: filtroCategoria,
      operador: filtroOperador,
      setor: filtroSetor,
      lote: filtroLote || undefined,
      notaFiscal: filtroNotaFiscal || undefined,
      transportadora: filtroTransportadora,
    });
  };

  // Disparo de filtros ao alterar campos
  const aplicarFiltros = () => {
    setIsRefreshing(true);
    carregarDados({
      periodoPredefinido: filtroPeriodo === "todos" ? undefined : filtroPeriodo,
      loja: filtroLoja,
      fornecedor: filtroFornecedor,
      produto: filtroProduto || undefined,
      categoria: filtroCategoria,
      operador: filtroOperador,
      setor: filtroSetor,
      lote: filtroLote || undefined,
      notaFiscal: filtroNotaFiscal || undefined,
      transportadora: filtroTransportadora,
    });
  };

  const limparFiltros = () => {
    setFiltroPeriodo("todos");
    setFiltroLoja("todos");
    setFiltroFornecedor("todos");
    setFiltroProduto("");
    setFiltroCategoria("todos");
    setFiltroOperador("todos");
    setFiltroSetor("todos");
    setFiltroLote("");
    setFiltroNotaFiscal("");
    setFiltroTransportadora("todos");
    carregarDados();
  };

  const handleExportCsv = () => {
    if (!dashboardData) return;
    exportarRelatorioCsv(dashboardData.relatorio);
    setExportNotice("Arquivo CSV exportado com sucesso (UTF-8 formatado para Excel PT-BR)!");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportExcel = () => {
    if (!dashboardData) return;
    exportarRelatorioExcel(dashboardData.relatorio);
    setExportNotice("Planilha Excel (.xls / XML Spreadsheet) exportada com sucesso!");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportPdf = () => {
    if (!dashboardData) return;
    imprimirRelatorioPdf(dashboardData.relatorio, {
      loja: filtroLoja,
      fornecedor: filtroFornecedor,
      categoria: filtroCategoria,
      setor: filtroSetor,
    });
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin text-[var(--collab-mostarda)]" />
        <p className="text-xs text-[var(--muted)] font-mono">Consolidando métricas e indicadores do CD Big Master...</p>
      </div>
    );
  }

  const { recebimento, armazenagem, picking, expedicao, kpis, relatorio } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Notificação de Exportação */}
      {exportNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-bold bg-emerald-950/90 border-emerald-500 text-emerald-200 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* ── Top Executive Welcome Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d0d0d] via-[#141414] to-[#1a1410] border border-[var(--card-border)] p-6 sm:p-7 shadow-sm text-white">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--collab-mostarda)]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--collab-mostarda)] text-black uppercase tracking-wider">
                <Sparkles size={11} fill="currentColor" />
                <span>CD Big Master • Centro de Distribuição</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Indicadores e Relatórios em Tempo Real</span>
              </span>
            </div>

            <h1 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-white">
              Painel de Indicadores & Relatórios Gerenciais
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bem-vindo, <strong>{currentUser.name}</strong> ({currentUser.cargo}). Acompanhe a operação integrada de{" "}
              <strong>Recebimento, Armazenagem, Picking e Expedição</strong>, além de KPIs obrigatórios e relatórios analíticos com exportação.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar dados do dashboard"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--collab-mostarda)]" : ""} />
              <span>Atualizar Dados</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Navegação entre os 3 Pilares ─────────────────────────────────── */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab("gerencial")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === "gerencial"
              ? "bg-[var(--card)] text-[var(--collab-mostarda)] border-t-2 border-[var(--collab-mostarda)] border-x border-[var(--card-border)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard Gerencial (Tempo Real)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("kpis")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === "kpis"
              ? "bg-[var(--card)] text-[var(--collab-mostarda)] border-t-2 border-[var(--collab-mostarda)] border-x border-[var(--card-border)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
          }`}
        >
          <Gauge size={15} />
          <span>KPIs Obrigatórios (11 Indicadores)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
            OTIF 98.6%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("relatorios")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === "relatorios"
              ? "bg-[var(--card)] text-[var(--collab-mostarda)] border-t-2 border-[var(--collab-mostarda)] border-x border-[var(--card-border)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>Central de Relatórios & Exportação</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-amber-300 font-mono">
            {relatorio.length} Linhas
          </span>
        </button>
      </div>

      {/* ── PILAR 1: DASHBOARD GERENCIAL (TEMPO REAL) ───────────────────────── */}
      {activeSubTab === "gerencial" && (
        <div className="space-y-6">
          {/* Grade dos 4 Blocos Principais: Recebimento, Armazenagem, Picking, Expedição */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Bloco 1: Recebimento */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">Recebimento</h3>
                    <p className="text-[10px] text-[var(--muted)]">Entrada física e fiscal</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {recebimento.notasRecebidas} Recebidas
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Notas Agendadas:</span>
                  <span className="font-mono font-bold text-sky-400">{recebimento.notasAgendadas}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Notas em Doca:</span>
                  <span className="font-mono font-bold text-amber-400">{recebimento.notasEmDoca}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Notas em Recebimento:</span>
                  <span className="font-mono font-bold text-emerald-400">{recebimento.notasEmRecebimento}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Notas em Quarentena:</span>
                  <span className="font-mono font-bold text-rose-400">{recebimento.notasEmQuarentena}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Aguardando Armazenagem:</span>
                  <span className="font-mono font-bold text-purple-400">{recebimento.notasAguardandoArmazenagem}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--card-border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                  <Timer size={13} className="text-emerald-400" /> Tempo Médio Recebimento:
                </span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {recebimento.tempoMedioRecebimentoMinutos} min
                </span>
              </div>
            </div>

            {/* Bloco 2: Armazenagem */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                    <Boxes size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">Armazenagem</h3>
                    <p className="text-[10px] text-[var(--muted)]">Mapa CD & Posições</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {armazenagem.ocupacaoTotalPercentual}% Ocupado
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--muted)]">Ocupação Total:</span>
                    <span className="font-mono font-bold">
                      {armazenagem.posicoesOcupadas} / {armazenagem.posicoesTotais}
                    </span>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${armazenagem.ocupacaoTotalPercentual}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Endereços Disponíveis:</span>
                  <span className="font-mono font-bold text-emerald-400">{armazenagem.enderecosDisponiveis}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Endereços Bloqueados:</span>
                  <span className="font-mono font-bold text-amber-400">{armazenagem.enderecosBloqueados}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Produtos Armazenados:</span>
                  <span className="font-mono font-bold text-sky-400">{armazenagem.produtosArmazenados} SKUs</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--card-border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" /> Próximos do Vencimento:
                </span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {armazenagem.produtosProximosVencimento} Lotes
                </span>
              </div>
            </div>

            {/* Bloco 3: Picking / Separação */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                    <Package size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">Picking</h3>
                    <p className="text-[10px] text-[var(--muted)]">Separação & Ondas</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {picking.linhasSeparadasPorHora} Linhas/h
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Pedidos Pendentes:</span>
                  <span className="font-mono font-bold text-amber-400">{picking.pedidosPendentes}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Pedidos em Separação:</span>
                  <span className="font-mono font-bold text-sky-400">{picking.pedidosEmSeparacao}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Pedidos Concluídos:</span>
                  <span className="font-mono font-bold text-emerald-400">{picking.pedidosConcluidos}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Linhas Separadas por Hora:</span>
                  <span className="font-mono font-bold text-emerald-400">{picking.linhasSeparadasPorHora}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--card-border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                  <Users size={13} className="text-amber-400" /> Operadores no Turno:
                </span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {picking.produtividadePorOperador.length} Ativos
                </span>
              </div>
            </div>

            {/* Bloco 4: Expedição */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4 hover:border-sky-500/40 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">Expedição</h3>
                    <p className="text-[10px] text-[var(--muted)]">Cargas & Saída CD</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {expedicao.cargasExpedidas} Cargas
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Aguardando Conferência:</span>
                  <span className="font-mono font-bold text-amber-400">{expedicao.pedidosAguardandoConferencia}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Pedidos Liberados:</span>
                  <span className="font-mono font-bold text-emerald-400">{expedicao.pedidosLiberados}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Cargas em Andamento:</span>
                  <span className="font-mono font-bold text-purple-400">{expedicao.cargasEmAndamento}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--card-border)]/50">
                  <span className="text-[var(--muted)]">Cargas Expedidas:</span>
                  <span className="font-mono font-bold text-sky-400">{expedicao.cargasExpedidas}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--card-border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-400" /> Cargas Atrasadas:
                </span>
                <span className={`font-mono font-bold text-xs ${expedicao.cargasAtrasadas > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {expedicao.cargasAtrasadas} Cargas
                </span>
              </div>
            </div>
          </div>

          {/* Produtividade Detalhada por Operador (Item Picking) */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                  Produtividade Operacional por Operador (Picking & Separação)
                </h3>
              </div>
              <span className="text-xs text-[var(--muted)]">Rendimento em tempo real</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {picking.produtividadePorOperador.map((op, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-black/20 border border-[var(--card-border)] space-y-2 text-xs">
                  <div className="font-bold text-[var(--foreground)] truncate">{op.operador}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[var(--muted)] block">Linhas/Hora:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">{op.linhasPorHora}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block">Caixas Separadas:</span>
                      <span className="font-mono font-bold text-[var(--foreground)] text-sm">{op.caixasSeparadas}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--card-border)]">
                    <span className="text-[var(--muted)]">Assertividade:</span>
                    <span className="font-mono font-bold text-emerald-400">{op.assertividade}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PILAR 2: KPIS OBRIGATÓRIOS (11 INDICADORES) ─────────────────────── */}
      {activeSubTab === "kpis" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
                <Gauge size={22} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-[var(--foreground)]">
                  Painel de KPIs Oficiais do CD Big Master
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  11 indicadores homologados para governança logística, auditoria e nível de serviço (SLA)
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={14} /> 100% das Metas em Faixa Segura
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(kpis).map((kpi) => (
              <div
                key={kpi.id}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-[var(--collab-mostarda)]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {kpi.titulo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        kpi.status === "atingida"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {kpi.status === "atingida" ? "Meta Atingida" : "Atenção"}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl font-black font-heading text-[var(--foreground)] tracking-tight">
                      {kpi.valor}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-1">
                      {kpi.tendencia === "subindo" ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <TrendingUp size={13} /> +{kpi.variacaoPercentual}%
                        </span>
                      ) : kpi.tendencia === "descendo" ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <TrendingDown size={13} /> {kpi.variacaoPercentual}%
                        </span>
                      ) : (
                        <span className="text-sky-400">Estável</span>
                      )}
                      <span className="text-[var(--muted)]">vs. período anterior</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted)]">Meta Contratada:</span>
                    <span className="font-mono font-bold text-[var(--foreground)]">{kpi.meta}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted)] leading-relaxed italic">{kpi.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PILAR 3: CENTRAL DE RELATÓRIOS & EXPORTAÇÃO ──────────────────────── */}
      {activeSubTab === "relatorios" && (
        <div className="space-y-4">
          {/* Caixa de Filtros Completos (Item Relatórios) */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[var(--collab-mostarda)]" />
                <div>
                  <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                    Filtros de Relatório Analítico
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    Filtre simultaneamente por período, loja, fornecedor, produto, categoria, operador, setor, lote, NF e transportadora
                  </p>
                </div>
              </div>

              {/* Botões de Ação dos Filtros */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer text-[var(--muted)]"
                >
                  Limpar Filtros
                </button>
                <button
                  type="button"
                  onClick={aplicarFiltros}
                  className="px-4 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:bg-[var(--collab-mostarda)]/90 cursor-pointer shadow-sm"
                >
                  Filtrar Resultados
                </button>
              </div>
            </div>

            {/* Grade de 10 Campos de Filtro */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* 1. Período */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">1. Período</label>
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todos os Dias</option>
                  <option value="hoje">Hoje (Turno 1)</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Mês atual</option>
                </select>
              </div>

              {/* 2. Loja Destino */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">2. Loja Destino</label>
                <select
                  value={filtroLoja}
                  onChange={(e) => setFiltroLoja(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todas as Lojas</option>
                  <option value="Loja 01">Loja 01 - Matriz Centro</option>
                  <option value="Loja 02">Loja 02 - Barra Funda</option>
                  <option value="Loja 03">Loja 03 - Tatuapé Boulevard</option>
                  <option value="Loja 04">Loja 04 - Shopping Morumbi</option>
                  <option value="Loja 05">Loja 05 - Osasco Plaza</option>
                  <option value="Loja 07">Loja 07 - Campinas Shopping</option>
                  <option value="Loja 08">Loja 08 - Shopping Eldorado</option>
                </select>
              </div>

              {/* 3. Fornecedor */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">3. Fornecedor</label>
                <select
                  value={filtroFornecedor}
                  onChange={(e) => setFiltroFornecedor(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todos os Fornecedores</option>
                  <option value="Laticínios Bela Vista">Laticínios Bela Vista</option>
                  <option value="Danone Brasil">Danone Brasil</option>
                  <option value="Camil Alimentos">Camil Alimentos</option>
                  <option value="Distribuidora Nacional">Distribuidora Nacional</option>
                  <option value="Distribuidora Bebidas Brasil">Bebidas Brasil</option>
                  <option value="Moinho Paulista">Moinho Paulista</option>
                  <option value="Hortifrúti Fazenda Sul">Hortifrúti Fazenda Sul</option>
                </select>
              </div>

              {/* 4. Categoria */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">4. Categoria</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todas as Categorias</option>
                  <option value="Alimentos Secos">Alimentos Secos</option>
                  <option value="Laticínios / Frios">Laticínios / Frios</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                  <option value="Hortifrúti">Hortifrúti</option>
                </select>
              </div>

              {/* 5. Setor CD */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">5. Setor CD</label>
                <select
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todos os Setores</option>
                  <option value="Porta-Paletes">Porta-Paletes</option>
                  <option value="Flow Rack">Flow Rack</option>
                  <option value="Pulmão">Pulmão</option>
                  <option value="Picking">Picking Ativo</option>
                  <option value="Quarentena">Quarentena</option>
                  <option value="Doca">Doca</option>
                </select>
              </div>

              {/* 6. Operador */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">6. Operador</label>
                <select
                  value={filtroOperador}
                  onChange={(e) => setFiltroOperador(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todos os Operadores</option>
                  <option value="Lucas Silva">Lucas Silva</option>
                  <option value="Carlos Eduardo">Carlos Eduardo</option>
                  <option value="Marcos Vinicius">Marcos Vinicius</option>
                  <option value="Ana Paula Ramos">Ana Paula Ramos</option>
                  <option value="Rodrigo Almeida">Rodrigo Almeida</option>
                </select>
              </div>

              {/* 7. Transportadora */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">7. Transportadora</label>
                <select
                  value={filtroTransportadora}
                  onChange={(e) => setFiltroTransportadora(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="todos">Todas as Frotas</option>
                  <option value="TransCollab">TransCollab Log</option>
                  <option value="Frota Própria">Frota Própria Collab</option>
                  <option value="Rodonaves">Rodonaves Express</option>
                  <option value="Transpaulo">Transpaulo Logística</option>
                  <option value="Expresso Frutas">Expresso Frutas</option>
                </select>
              </div>

              {/* 8. Produto / SKU */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">8. Produto / SKU</label>
                <input
                  type="text"
                  placeholder="Nome ou SKU..."
                  value={filtroProduto}
                  onChange={(e) => setFiltroProduto(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono"
                />
              </div>

              {/* 9. Lote */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">9. Lote</label>
                <input
                  type="text"
                  placeholder="Código do lote..."
                  value={filtroLote}
                  onChange={(e) => setFiltroLote(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono"
                />
              </div>

              {/* 10. Nota Fiscal */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">10. Nota Fiscal</label>
                <input
                  type="text"
                  placeholder="Número NF..."
                  value={filtroNotaFiscal}
                  onChange={(e) => setFiltroNotaFiscal(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Barra de Exportação (Excel, PDF, CSV) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-400" />
              <div>
                <h4 className="font-bold text-xs text-[var(--foreground)]">
                  Exportação de Dados Consolidados ({relatorio.length} Registros)
                </h4>
                <p className="text-[11px] text-[var(--muted)]">
                  Baixe os registros filtrados no formato homologado para auditoria ou BI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow cursor-pointer transition-all"
              >
                <FileSpreadsheet size={14} />
                <span>Exportar Excel (.xls)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--card-border)] text-[var(--foreground)] text-xs font-bold flex items-center gap-2 border border-[var(--card-border)] cursor-pointer transition-all"
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                className="px-3.5 py-2 rounded-xl bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:bg-[var(--collab-mostarda)]/90 flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Printer size={14} />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* Tabela de Resultados Analíticos */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--secondary)] border-b border-[var(--card-border)] text-[var(--muted)] font-semibold">
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Loja Destino</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3">Produto / SKU</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3">Setor / Endereço</th>
                    <th className="p-3">Lote / Validade</th>
                    <th className="p-3">NF</th>
                    <th className="p-3">Transportadora</th>
                    <th className="p-3 text-right">Qtd</th>
                    <th className="p-3">Status Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {relatorio.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-[var(--muted)]">
                        Nenhum registro encontrado com a combinação de filtros aplicada.
                      </td>
                    </tr>
                  ) : (
                    relatorio.map((linha) => (
                      <tr key={linha.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono text-[11px] text-[var(--muted)] whitespace-nowrap">
                          {linha.data}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[var(--foreground)]">{linha.loja}</div>
                          <div className="text-[10px] text-[var(--muted)] font-mono">{linha.codLoja}</div>
                        </td>
                        <td className="p-3 text-[11px] text-[var(--muted)] max-w-[140px] truncate">
                          {linha.fornecedor}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[var(--foreground)]">{linha.produto}</div>
                          <div className="text-[10px] text-[var(--muted)] font-mono">SKU: {linha.sku}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/20 text-[var(--foreground)] border border-[var(--card-border)]">
                            {linha.categoria}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] whitespace-nowrap">
                          {linha.operador}
                        </td>
                        <td className="p-3 font-mono">
                          <div className="font-bold text-[var(--foreground)]">{linha.setor}</div>
                          <div className="text-[10px] text-amber-400">{linha.endereco}</div>
                        </td>
                        <td className="p-3 font-mono">
                          <div className="font-semibold">{linha.lote}</div>
                          <div className="text-[10px] text-[var(--muted)]">Val: {linha.validade}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {linha.notaFiscal}
                        </td>
                        <td className="p-3 text-[11px] text-[var(--muted)] truncate max-w-[130px]">
                          {linha.transportadora}
                        </td>
                        <td className="p-3 font-mono text-right font-bold text-xs">
                          {linha.quantidade} <span className="text-[10px] text-[var(--muted)]">{linha.unidadeMedida}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              linha.divergencia
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {linha.divergencia ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                            {linha.statusOperacional}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
