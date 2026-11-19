"use client";

import { useState, useMemo } from "react";
import { StorageAddress } from "@/lib/types";
import {
  Search,
  CheckSquare,
  Square,
  Printer,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

interface LabelsGridProps {
  addresses: StorageAddress[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectRange: (startIdx: number, endIdx: number) => void;
  onPreviewAddress: (addr: StorageAddress) => void;
  onOpenPrintModal: (selectedOnly: boolean) => void;
}

export function LabelsGrid({
  addresses,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSelectRange,
  onPreviewAddress,
  onOpenPrintModal,
}: LabelsGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRua, setFilterRua] = useState<string>("all");
  const [filterPredio, setFilterPredio] = useState<string>("all");
  const [filterApto, setFilterApto] = useState<string>("all");
  const [filterNivel, setFilterNivel] = useState<string>("all");

  const [rangeStart, setRangeStart] = useState<number | "">("");
  const [rangeEnd, setRangeEnd] = useState<number | "">("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 32;

  const uniqueRuas = useMemo(() => Array.from(new Set(addresses.map((a) => a.ruaStr))), [addresses]);
  const uniquePredios = useMemo(() => Array.from(new Set(addresses.map((a) => a.predioStr))), [addresses]);
  const uniqueAptos = useMemo(() => Array.from(new Set(addresses.map((a) => a.aptoStr))), [addresses]);
  const uniqueNiveis = useMemo(() => Array.from(new Set(addresses.map((a) => a.nivelStr))), [addresses]);

  const filteredAddresses = useMemo(() => {
    return addresses.filter((addr) => {
      if (searchTerm && !addr.code.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterRua !== "all" && addr.ruaStr !== filterRua) return false;
      if (filterPredio !== "all" && addr.predioStr !== filterPredio) return false;
      if (filterApto !== "all" && addr.aptoStr !== filterApto) return false;
      if (filterNivel !== "all" && addr.nivelStr !== filterNivel) return false;
      return true;
    });
  }, [addresses, searchTerm, filterRua, filterPredio, filterApto, filterNivel]);

  const totalPages = Math.ceil(filteredAddresses.length / pageSize) || 1;
  const paginatedAddresses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAddresses.slice(start, start + pageSize);
  }, [filteredAddresses, currentPage, pageSize]);

  const handleApplyRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof rangeStart === "number" && typeof rangeEnd === "number") {
      onSelectRange(rangeStart, rangeEnd);
    }
  };

  if (addresses.length === 0) {
    return null;
  }

  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredAddresses.length > 0 &&
    filteredAddresses.every((a) => selectedIds.has(a.id));

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm no-print space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h3 className="font-heading text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Layers size={17} className="text-[var(--collab-mostarda)]" />
            <span>Etiquetas Geradas ({addresses.length.toLocaleString("pt-BR")} no lote)</span>
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {selectedCount > 0 ? (
              <span className="text-[var(--foreground)] font-semibold">
                <strong className="text-[var(--collab-mostarda)]">{selectedCount}</strong> de {addresses.length} etiqueta(s) selecionada(s) para impressão
              </span>
            ) : (
              <span>
                Nenhuma etiqueta selecionada. Marque as etiquetas abaixo para imprimir ou use os botões rápidos.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedCount > 0 ? (
            <>
              <button
                type="button"
                onClick={() => onOpenPrintModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir Selecionadas ({selectedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPrintModal(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--secondary)] hover:border-[var(--collab-mostarda)] border border-[var(--card-border)] text-[var(--foreground)] text-xs font-semibold rounded transition-all cursor-pointer"
              >
                <Printer size={14} className="text-[var(--collab-mostarda)]" />
                <span>Imprimir Todas ({addresses.length})</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpenPrintModal(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir Lote Completo ({addresses.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar ex: R01-P02 ou A05..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
          />
        </div>

        <div>
          <select
            value={filterRua}
            onChange={(e) => {
              setFilterRua(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
          >
            <option value="all">Todas as Ruas</option>
            {uniqueRuas.map((r) => (
              <option key={r} value={r}>
                Rua {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterPredio}
            onChange={(e) => {
              setFilterPredio(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
          >
            <option value="all">Todos os Prédios</option>
            {uniquePredios.map((p) => (
              <option key={p} value={p}>
                Prédio {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterNivel}
            onChange={(e) => {
              setFilterNivel(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
          >
            <option value="all">Todos os Níveis</option>
            {uniqueNiveis.map((n) => (
              <option key={n} value={n}>
                Nível {n} ({n === "N01" ? "↓ Baixo" : "↑ Cima"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterApto}
            onChange={(e) => {
              setFilterApto(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
          >
            <option value="all">Todos os Aptos</option>
            {uniqueAptos.map((a) => (
              <option key={a} value={a}>
                Apto {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[var(--muted)] border-t border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={allFilteredSelected ? onDeselectAll : onSelectAll}
            className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)] font-medium cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare size={15} className="text-[var(--collab-mostarda)]" />
            ) : (
              <Square size={15} />
            )}
            <span>{allFilteredSelected ? "Desmarcar Todas" : "Selecionar Todas"}</span>
          </button>

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-red-400 hover:underline cursor-pointer"
            >
              Limpar seleção
            </button>
          )}
        </div>

        <form onSubmit={handleApplyRange} className="flex items-center gap-2">
          <span>Selecionar do nº:</span>
          <input
            type="number"
            min={1}
            max={addresses.length}
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
            placeholder="1"
            className="w-14 px-2 py-1 text-center bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] text-xs font-mono"
          />
          <span>ao:</span>
          <input
            type="number"
            min={1}
            max={addresses.length}
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
            placeholder="50"
            className="w-14 px-2 py-1 text-center bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] text-xs font-mono"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] rounded font-medium cursor-pointer"
          >
            Aplicar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {paginatedAddresses.map((addr) => {
          const isSelected = selectedIds.has(addr.id);
          const isDown = addr.arrowDirection === "down";

          return (
            <div
              key={addr.id}
              className={`relative p-3 rounded-lg border transition-all flex flex-col justify-between cursor-pointer select-none ${
                isSelected
                  ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] shadow-sm"
                  : "bg-[var(--background)] border-[var(--card-border)] hover:border-[var(--muted)]"
              }`}
              onClick={() => onToggleSelect(addr.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-[var(--collab-mostarda)] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    #{addr.index}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isDown
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                  title={isDown ? "Nível N01: Seta para BAIXO" : "Nível > N01: Seta para CIMA"}
                >
                  <span>{isDown ? "↓ N01" : `↑ ${addr.nivelStr}`}</span>
                </div>
              </div>

              <div className="py-1">
                <div className="font-mono font-bold text-sm text-[var(--foreground)] tracking-tight text-center">
                  {addr.code}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewAddress(addr);
                  }}
                  className="text-[var(--collab-mostarda)] hover:underline text-[10px] uppercase font-bold cursor-pointer"
                >
                  Ver no Preview 10×5cm
                </button>

                <span className="text-[10px] text-[var(--muted)]">
                  Code 128
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)] text-xs text-[var(--muted)]">
          <div>
            Mostrando página {currentPage} de {totalPages} ({filteredAddresses.length} etiquetas filtradas)
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-[var(--secondary)] border border-[var(--card-border)] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-2 font-mono text-[var(--foreground)]">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-[var(--secondary)] border border-[var(--card-border)] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
