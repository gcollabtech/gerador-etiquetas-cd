"use client";

import { useState } from "react";
import { PortalUser, MainPortalModule } from "@/lib/authTypes";
import {
  LayoutDashboard,
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
  Gauge,
  Zap,
  Calendar,
  Warehouse,
  Filter,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface DashboardPortalViewProps {
  currentUser: PortalUser;
  onNavigate: (module: MainPortalModule) => void;
}

export function DashboardPortalView({
  currentUser,
  onNavigate,
}: DashboardPortalViewProps) {
  const [timeRange, setTimeRange] = useState<"hoje" | "7d" | "30d">("hoje");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Executive Welcome Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d0d0d] via-[#141414] to-[#1a1410] border border-[var(--card-border)] p-6 sm:p-7 shadow-sm text-white">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--collab-mostarda)]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--collab-mostarda)] text-black uppercase tracking-wider">
                <Sparkles size={11} fill="currentColor" />
                <span>Centro de Distribuição Matriz</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Operação em Tempo Real • Turno 1 Normal</span>
              </span>
            </div>

            <h1 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-white">
              Painel de Controle Logístico & Indicadores do CD
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bem-vindo, <strong>{currentUser.name}</strong> ({currentUser.cargo}). Acompanhe a volumetria diária, ocupação de porta-paletes, indicadores OTIF e produtividade de expedição.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Filter Pill */}
            <div className="inline-flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
              {(
                [
                  { id: "hoje", label: "Hoje" },
                  { id: "7d", label: "Últimos 7 dias" },
                  { id: "30d", label: "Mês atual" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeRange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    timeRange === tab.id
                      ? "bg-[var(--collab-mostarda)] text-black font-bold shadow-sm"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar dados do dashboard"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-[var(--collab-mostarda)]" : ""}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bloco 1: KPIs Principais de Logística & Gestão ────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-[var(--collab-mostarda)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              1. Indicadores Chave de Desempenho (KPIs Logísticos)
            </h2>
          </div>
          <span className="text-[11px] text-[var(--muted)]">
            Metas homologadas Grupo Collab
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: OTIF */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-3 hover:border-[var(--collab-mostarda)]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                OTIF Global
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-heading text-[var(--foreground)] tracking-tight">
                98.4%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-0.5">
                <ArrowUpRight size={13} />
                <span>+0.8% vs. meta (98.0%)</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--card-border)]">
              On-Time In-Full de entregas realizadas no prazo e completas.
            </p>
          </div>

          {/* Card 2: Pedidos Expedidos */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-3 hover:border-[var(--collab-mostarda)]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Expedição Diária
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center">
                <Truck size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-heading text-[var(--foreground)] tracking-tight">
                1.428 <span className="text-sm font-medium text-[var(--muted)]">pedidos</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-0.5">
                <TrendingUp size={13} />
                <span>+12.4% acima da média diária</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--card-border)]">
              984 pedidos faturados e 444 em docas de carregamento.
            </p>
          </div>

          {/* Card 3: Acuracidade de Estoque */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-3 hover:border-[var(--collab-mostarda)]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Acuracidade Estoque
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <PackageCheck size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-heading text-[var(--foreground)] tracking-tight">
                99.82%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-0.5">
                <CheckCircle2 size={13} />
                <span>Meta atingida (≥99.5%)</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--card-border)]">
              Auditorias cíclicas de contagem cega nas Ruas R01 a R16.
            </p>
          </div>

          {/* Card 4: Ciclo Order-to-Delivery */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-3 hover:border-[var(--collab-mostarda)]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Tempo Médio de Ciclo
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-heading text-[var(--foreground)] tracking-tight">
                4h 15m
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-0.5">
                <TrendingDown size={13} />
                <span>-18 minutos de ganho médio</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--card-border)]">
              Desde a liberação do WMS até a saída na portaria do CD.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bloco 2: Estrutura Física & Capacidade do Centro de Distribuição ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Capacidade de Armazenagem e Ocupação */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <Warehouse size={18} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                  Estrutura Física e Ocupação do CD (Porta-Paletes)
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Capacidade total, níveis verticais e endereçamento físico
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--collab-mostarda)]/10 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30 self-start sm:self-auto">
              Taxa Global: 82%
            </span>
          </div>

          {/* Ocupação Principal Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--foreground)]">
                10.496 posições ocupadas de 12.800 totais
              </span>
              <span className="text-[var(--muted)]">
                2.304 posições livres (18%)
              </span>
            </div>

            <div className="w-full h-3.5 bg-[var(--secondary)] rounded-full overflow-hidden flex border border-[var(--card-border)]">
              <div
                className="h-full bg-gradient-to-r from-[#FF6400] to-orange-500 rounded-l-full"
                style={{ width: "82%" }}
                title="82% Ocupado"
              />
              <div
                className="h-full bg-emerald-500/30"
                style={{ width: "18%" }}
                title="18% Livre para armazenagem"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>● Ocupado (Pulmão & Picking Ativo)</span>
              <span>● Disponível para Recebimento Imediato</span>
            </div>
          </div>

          {/* Blocos do CD e Ruas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              {
                bloco: "Bloco A — Cargas Secas & Geral",
                ruas: "Ruas R01 a R04 • 3.200 posições",
                ocupacao: 88,
                status: "Ocupação Alta",
                statusColor: "text-amber-500 bg-amber-500/10",
              },
              {
                bloco: "Bloco B — Alimentos & Perecíveis",
                ruas: "Ruas R05 a R08 • 3.200 posições",
                ocupacao: 74,
                status: "Normal",
                statusColor: "text-emerald-500 bg-emerald-500/10",
              },
              {
                bloco: "Bloco C — Alto Giro (Fast-Picking)",
                ruas: "Ruas R09 a R12 • 3.200 posições",
                ocupacao: 91,
                status: "Reabastecer N01",
                statusColor: "text-rose-500 bg-rose-500/10",
              },
              {
                bloco: "Bloco D — Pulmão Superior & Reserva",
                ruas: "Ruas R13 a R16 • 3.200 posições",
                ocupacao: 76,
                status: "Normal",
                statusColor: "text-emerald-500 bg-emerald-500/10",
              },
            ].map((b, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)]">
                      {b.bloco}
                    </h4>
                    <p className="text-[11px] text-[var(--muted)]">{b.ruas}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.statusColor}`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted)]">Ocupação:</span>
                    <strong className="font-mono text-[var(--foreground)]">
                      {b.ocupacao}%
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-[var(--card)] rounded-full overflow-hidden border border-[var(--card-border)]">
                    <div
                      className={`h-full rounded-full ${
                        b.ocupacao > 90
                          ? "bg-rose-500"
                          : b.ocupacao > 80
                          ? "bg-[var(--collab-mostarda)]"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${b.ocupacao}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick link to label generator */}
          <div className="p-3 rounded-xl bg-[var(--secondary)]/50 border border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Barcode size={18} className="text-[var(--collab-mostarda)] shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[var(--foreground)]">
                  Precisa etiquetar ou reendereçar novas posições físicas?
                </span>
                <p className="text-[11px] text-[var(--muted)]">
                  Gere lotes completos no padrão CODE 128 com setas de orientação automáticas.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate("etiquetas_produto")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Emitir etiquetas térmicas de produto com código EAN-13"
              >
                <span>Etiquetas Produto (EAN-13)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("etiquetas")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:opacity-90 transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <span>Gerar Etiquetas CD</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Coluna 3: Docas, Frota e Gestão de Portaria */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                  Docas & Operações de Frota
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)]">
                14 Docas
              </span>
            </div>

            <div className="space-y-3">
              {/* Doca status 1 */}
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <span className="text-xs font-bold text-[var(--foreground)] block">
                      Docas de Recebimento
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      5 de 6 ativas (descarga em andamento)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  83%
                </span>
              </div>

              {/* Doca status 2 */}
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--collab-mostarda)]" />
                  <div>
                    <span className="text-xs font-bold text-[var(--foreground)] block">
                      Docas de Expedição
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      8 de 8 operando (janela da tarde)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--collab-mostarda)]">
                  100%
                </span>
              </div>

              {/* Doca status 3 */}
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-xs font-bold text-[var(--foreground)] block">
                      Veículos em Trânsito / Rotas
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      18 frotas monitoradas via telemetria
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-500">
                  18 / 20
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--card-border)] space-y-2">
            <div className="text-[11px] text-[var(--muted)] flex items-center justify-between">
              <span>Taxa de ocupação de caçamba:</span>
              <strong className="font-mono text-[var(--foreground)]">92.5%</strong>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("rastreamento")}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-[var(--secondary)] hover:bg-[var(--card-border)] text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <span>Abrir Módulo de Rastreamento</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Bloco 3: Gestão Operacional, Equipe & Feed de Eventos Recentes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Produtividade da Equipe e Separação */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                  Gestão Operacional de Turno & Produtividade
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Desempenho de separação (picking), conferência e auditoria de qualidade
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("usuarios")}
              className="text-xs font-semibold text-[var(--collab-mostarda)] hover:underline cursor-pointer"
            >
              Gerenciar Equipe
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
              <span className="text-[11px] text-[var(--muted)] font-medium block">
                Colaboradores Ativos
              </span>
              <div className="text-xl font-bold font-heading text-[var(--foreground)] mt-0.5">
                42 <span className="text-xs font-normal text-[var(--muted)]">operadores</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">
                ● 100% dos postos cobertos
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
              <span className="text-[11px] text-[var(--muted)] font-medium block">
                Produtividade Média
              </span>
              <div className="text-xl font-bold font-heading text-[var(--foreground)] mt-0.5">
                185 <span className="text-xs font-normal text-[var(--muted)]">itens/hora</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">
                ▲ +15% acima da meta (160)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
              <span className="text-[11px] text-[var(--muted)] font-medium block">
                Auditorias de Qualidade
              </span>
              <div className="text-xl font-bold font-heading text-[var(--foreground)] mt-0.5">
                24 / 26
              </div>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">
                ✓ 0 divergências críticas
              </span>
            </div>
          </div>

          {/* Mini Tabela de Operações em Andamento */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)] font-semibold">
                  <th className="pb-2">Rua / Zona</th>
                  <th className="pb-2">Operação</th>
                  <th className="pb-2">Responsável</th>
                  <th className="pb-2">Progresso</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                <tr>
                  <td className="py-2.5 font-mono font-bold text-[var(--collab-mostarda)]">
                    R02 (P01..P04)
                  </td>
                  <td className="py-2.5 text-[var(--foreground)]">Reabastecimento N01</td>
                  <td className="py-2.5 text-[var(--muted)]">Mariana Costa</td>
                  <td className="py-2.5 font-mono">88%</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500">
                      Em finalização
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono font-bold text-[var(--collab-mostarda)]">
                    R05 (P01..P02)
                  </td>
                  <td className="py-2.5 text-[var(--foreground)]">Separação de Pedidos Carga Sul</td>
                  <td className="py-2.5 text-[var(--muted)]">Carlos Eduardo</td>
                  <td className="py-2.5 font-mono">65%</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-500">
                      Em andamento
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono font-bold text-[var(--collab-mostarda)]">
                    R10 (P01..P08)
                  </td>
                  <td className="py-2.5 text-[var(--foreground)]">Inventário Cíclico e Etiquetagem</td>
                  <td className="py-2.5 text-[var(--muted)]">Juliana Mendes</td>
                  <td className="py-2.5 font-mono">100%</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500">
                      Concluído
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna 3: Feed de Alertas & Eventos Recentes */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[var(--collab-mostarda)]" />
              <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                Feed de Alertas Recentes
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Ao Vivo
            </span>
          </div>

          <div className="space-y-3">
            {/* Alerta de Divergência do Módulo 02 WMS (Requisito 2.6) */}
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1.5 text-xs animate-pulse">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Divergência de Recebimento (NF 000.012.345)</span>
                </span>
                <span className="text-[10px] text-red-400 font-mono font-bold">Quarentena</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Falta física de 24 un (2 CX) no descarregamento da Doca 02 (SABÃO EM PÓ 1KG). Requer análise do gestor/supervisor.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("wms")}
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
              >
                <span>Analisar Ocorrência no Módulo 02</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {[
              {
                time: "Há 12 min",
                title: "Doca 03 liberada",
                desc: "Descarga de 32 paletes concluída com 100% de conferência cega.",
                tone: "emerald",
              },
              {
                time: "Há 28 min",
                title: "Lote de etiquetas impresso",
                desc: "Rua R01 nível N01 a N04 finalizada no formato 10 × 5 cm.",
                tone: "orange",
              },
              {
                time: "Há 45 min",
                title: "Janela de expedição Rota Campinas",
                desc: "3 carretas liberadas com lacre auditado e checklist digital.",
                tone: "blue",
              },
              {
                time: "Há 1h 10m",
                title: "Reabastecimento de picking",
                desc: "Transferência automática de 14 paletes do pulmão alto.",
                tone: "emerald",
              },
            ].map((event, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--foreground)]">
                    {event.title}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] font-mono">
                    {event.time}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  {event.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate("wms")}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-[var(--secondary)] hover:bg-[var(--card-border)] text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <span>Ver Central WMS Completa</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
