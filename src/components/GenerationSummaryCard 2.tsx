"use client";

import { GenerationSummary } from "@/lib/types";
import {
  Calculator,
  Play,
  Layers,
  CheckCircle,
  FileText,
  Printer,
  Sparkles,
} from "lucide-react";

interface GenerationSummaryCardProps {
  summary: GenerationSummary;
  onGenerate: () => void;
  isValid: boolean;
  isGenerated: boolean;
}

export function GenerationSummaryCard({
  summary,
  onGenerate,
  isValid,
  isGenerated,
}: GenerationSummaryCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Lado Esquerdo: Resumo Matemático e Fórmula */}
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calculator size={15} className="text-[var(--collab-mostarda)]" />
            <span>3.3. Resumo da Geração e Cálculo Automático</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm font-medium text-[var(--foreground)] mb-3">
            <div className="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono">
              <span className="text-[var(--muted)]">Ruas: </span>
              <strong className="text-[var(--collab-mostarda)]">{summary.qtdRuas}</strong>
            </div>

            <span className="text-[var(--muted)]">×</span>

            <div className="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono">
              <span className="text-[var(--muted)]">Prédios/Rua: </span>
              <strong className="text-[var(--collab-mostarda)]">{summary.qtdPrediosPorRua}</strong>
            </div>

            <span className="text-[var(--muted)]">×</span>

            <div className="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono">
              <span className="text-[var(--muted)]">Aptos/Prédio: </span>
              <strong className="text-[var(--collab-mostarda)]">{summary.qtdAptosPorPredio}</strong>
            </div>

            <span className="text-[var(--muted)]">×</span>

            <div className="px-2.5 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono">
              <span className="text-[var(--muted)]">Níveis/Apto: </span>
              <strong className="text-[var(--collab-mostarda)]">{summary.qtdNiveisPorApto}</strong>
            </div>
          </div>

          {/* Destaque de Totais */}
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-xs text-[var(--muted)] block">Total de Endereços Previstos:</span>
              <span className="font-heading text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {summary.totalEnderecos.toLocaleString("pt-BR")}{" "}
                <span className="text-xs font-sans font-normal text-[var(--muted)]">endereços</span>
              </span>
            </div>

            <div className="h-8 w-px bg-[var(--card-border)]" />

            <div>
              <span className="text-xs text-[var(--muted)] block">Total de Etiquetas CODE 128:</span>
              <span className="font-heading text-2xl sm:text-3xl font-bold text-[var(--collab-mostarda)]">
                {summary.totalEtiquetas.toLocaleString("pt-BR")}{" "}
                <span className="text-xs font-sans font-normal text-[var(--collab-mostarda)]/80">etiquetas</span>
              </span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Botão Oficial de Geração */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch justify-center gap-2">
          <button
            type="button"
            disabled={!isValid || summary.totalEtiquetas === 0}
            onClick={onGenerate}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-bold text-sm uppercase tracking-wider rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
          >
            <Play size={18} className="fill-current transition-transform group-hover:scale-110" />
            <span>GERAR ENDEREÇOS E ETIQUETAS</span>
          </button>

          {isGenerated && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--success)] font-medium text-center">
              <CheckCircle size={14} />
              <span>Etiquetas geradas e prontas para visualização/impressão</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
