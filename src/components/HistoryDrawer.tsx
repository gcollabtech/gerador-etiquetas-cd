"use client";

import { GenerationHistoryItem, AddressParams } from "@/lib/types";
import {
  History,
  X,
  RotateCcw,
  Calendar,
  Trash2,
} from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GenerationHistoryItem[];
  onRestoreParams: (params: AddressParams) => void;
  onClearHistory: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onRestoreParams,
  onClearHistory,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm no-print">
      <div className="bg-[var(--card)] border-l border-[var(--card-border)] w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[var(--collab-mostarda)]" />
            <h3 className="font-heading text-base font-bold text-[var(--foreground)]">
              Histórico de Gerações do CD
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted)]">
              Nenhuma geração registrada no histórico local ainda.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg space-y-2 hover:border-[var(--collab-mostarda)]/50 transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar size={12} />
                    {item.timestamp}
                  </span>
                  <span className="font-bold text-[var(--collab-mostarda)] bg-[var(--collab-mostarda)]/10 px-1.5 py-0.5 rounded font-mono">
                    {item.totalGenerated} etiquetas
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-[var(--foreground)]">
                  {item.firstCode} <span className="text-[var(--muted)]">até</span> {item.lastCode}
                </div>

                <div className="text-[11px] text-[var(--muted)] grid grid-cols-2 gap-1 pt-1 border-t border-[var(--card-border)]">
                  <span>Rua: {item.params.ruaInicio}..{item.params.ruaFim}</span>
                  <span>Prédio: {item.params.predioInicio}..{item.params.predioFim}</span>
                  <span>Apto: {item.params.aptoInicio}..{item.params.aptoFim}</span>
                  <span>Nível: {item.params.nivelInicio}..{item.params.nivelFim}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRestoreParams(item.params);
                    onClose();
                  }}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--collab-mostarda)] hover:text-[#080808] text-[var(--foreground)] text-xs font-semibold rounded transition-all cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Restaurar estes Parâmetros</span>
                </button>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={onClearHistory}
              className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Limpar histórico local</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
