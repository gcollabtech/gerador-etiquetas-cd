"use client";

import { GenerationHistoryItem, AddressParams } from "@/lib/types";
import {
  History,
  RotateCcw,
  Calendar,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  Database,
} from "lucide-react";

interface HistoryPortalViewProps {
  history: GenerationHistoryItem[];
  onRestoreParams: (params: AddressParams) => void;
  onClearHistory: () => void;
  onNavigateToConfig: () => void;
}

export function HistoryPortalView({
  history,
  onRestoreParams,
  onClearHistory,
  onNavigateToConfig,
}: HistoryPortalViewProps) {
  const handleRestore = (item: GenerationHistoryItem) => {
    onRestoreParams(item.params);
    onNavigateToConfig();
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <History size={15} className="text-[var(--collab-mostarda)]" />
            <span>Auditoria e Histórico Local de Gerações</span>
          </div>
          <h2 className="font-heading text-lg font-bold text-[var(--foreground)] mt-0.5">
            Lotes e Parâmetros Salvos Automaticamente
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Total de registros gravados: <strong className="text-[var(--foreground)]">{history.length} lotes</strong>
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/25 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Limpar Histórico Local</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--background)] flex flex-col items-center justify-center p-6 space-y-2">
          <Database size={32} className="text-[var(--muted)] opacity-50" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">Nenhuma geração registrada ainda</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm">
            Assim que você configurar e gerar um lote de etiquetas, ele aparecerá aqui com todos os parâmetros salvos para restauração rápida.
          </p>
          <button
            type="button"
            onClick={onNavigateToConfig}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--collab-mostarda)] text-black cursor-pointer hover:opacity-90"
          >
            <span>Ir para Configuração</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-3 hover:border-[var(--collab-mostarda)]/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar size={12} />
                    {new Date(item.timestamp).toLocaleString("pt-BR")}
                  </span>
                  <span className="font-bold text-[var(--foreground)]">
                    {item.user}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--collab-mostarda)] flex items-center gap-1">
                    <Layers size={13} />
                    {item.totalGenerated} etiquetas
                  </span>

                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    {item.firstCode} → {item.lastCode}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[var(--card)] border border-[var(--card-border)] font-mono text-[11px] text-[var(--muted)] grid grid-cols-2 gap-1.5">
                  <div>Rua: <strong className="text-[var(--foreground)]">{item.params.ruaInicio}..{item.params.ruaFim}</strong></div>
                  <div>Prédio: <strong className="text-[var(--foreground)]">{item.params.predioInicio}..{item.params.predioFim}</strong></div>
                  <div>Apto: <strong className="text-[var(--foreground)]">{item.params.aptoInicio}..{item.params.aptoFim}</strong></div>
                  <div>Nível: <strong className="text-[var(--foreground)]">{item.params.nivelInicio}..{item.params.nivelFim}</strong></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRestore(item)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--secondary)] hover:bg-[var(--collab-mostarda)] hover:text-black border border-[var(--card-border)] text-[var(--foreground)] transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Restaurar estes Parâmetros e Abrir</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
