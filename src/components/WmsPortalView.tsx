"use client";

import {
  Boxes,
  PackageCheck,
  Forklift,
  Layers,
  ArrowRightLeft,
  Barcode,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";

interface WmsPortalViewProps {
  onNavigateToLabels?: () => void;
}

export function WmsPortalView({ onNavigateToLabels }: WmsPortalViewProps) {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Boxes size={15} className="text-[var(--collab-mostarda)]" />
            <span>Collab Log • Módulo Operacional 01</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[var(--foreground)] mt-0.5 flex items-center gap-2">
            <span>WMS — Warehouse Management System</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
              Em Breve
            </span>
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Gestão integrada de fluxo operacional de armazém: recebimento, armazenagem, separação e expedição.
          </p>
        </div>

        {onNavigateToLabels && (
          <button
            type="button"
            onClick={onNavigateToLabels}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-heading font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Barcode size={15} />
            <span>Acessar Etiquetas CD</span>
          </button>
        )}
      </div>

      {/* KPI Overview (CD Simulation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Ocupação do Armazém</span>
          <span className="font-heading text-2xl font-black text-[var(--foreground)]">
            87.4%
          </span>
          <div className="w-full bg-[var(--secondary)] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-[var(--collab-mostarda)] h-full w-[87.4%]" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Endereços Ativos</span>
          <span className="font-heading text-2xl font-black text-[var(--foreground)]">
            14.280
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Porta-paletes e picking</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Ordens de Separação</span>
          <span className="font-heading text-2xl font-black text-emerald-500">
            342
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Em processamento hoje</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Acuracidade de Estoque</span>
          <span className="font-heading text-2xl font-black text-[var(--collab-mostarda)]">
            99.6%
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Último inventário cíclico</span>
        </div>
      </div>

      {/* Future WMS Modules Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <Sparkles size={13} className="text-[var(--collab-mostarda)]" />
          <span>Estrutura Funcional do WMS em Desenvolvimento:</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Recebimento */}
          <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
              <PackageCheck size={18} />
            </div>
            <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
              1. Recebimento & Conferência Cega
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Validação de XML de NF-e, agendamento de docas de descarregamento, conferência por leitor ótico e identificação imediata de divergências.
            </p>
            <div className="pt-2 text-[11px] text-[var(--collab-mostarda)] font-semibold flex items-center gap-1">
              <Clock size={12} />
              <span>Em integração com ERP</span>
            </div>
          </div>

          {/* 2. Endereçamento */}
          <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--collab-mostarda)]/40 bg-[var(--collab-mostarda)]/5 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--collab-mostarda)] text-black flex items-center justify-center font-bold">
              <Forklift size={18} />
            </div>
            <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
              2. Armazenagem & Endereçamento
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Algoritmo de alocação automática baseado na curva ABC de giro, peso e dimensão de paletes nos níveis N01 a N04.
            </p>
            <div className="pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Gerador de Etiquetas CD disponível agora</span>
            </div>
          </div>

          {/* 3. Separação */}
          <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
              <ArrowRightLeft size={18} />
            </div>
            <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
              3. Separação (Picking & Packing)
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Wave picking (ondas de separação), roteirização inteligente pelos corredores do CD e check-out balança para evitar faltas e trocas.
            </p>
            <div className="pt-2 text-[11px] text-[var(--collab-mostarda)] font-semibold flex items-center gap-1">
              <Clock size={12} />
              <span>Em desenvolvimento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
