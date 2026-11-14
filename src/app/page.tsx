"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { ConfigPanel } from "@/components/ConfigPanel";
import { GenerationSummaryCard } from "@/components/GenerationSummaryCard";
import { LabelPreview } from "@/components/LabelPreview";
import { LabelsGrid } from "@/components/LabelsGrid";
import { PrintModal } from "@/components/PrintModal";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { TestAcceptanceModal } from "@/components/TestAcceptanceModal";

import {
  AddressParams,
  StorageAddress,
  AddressPreset,
  GenerationHistoryItem,
} from "@/lib/types";
import {
  validateAddressParams,
  calculateGenerationSummary,
  generateStorageAddresses,
} from "@/lib/addressGenerator";
import {
  getHistory,
  saveHistoryItem,
  clearHistory,
  getPresets,
  saveCustomPreset,
  DEFAULT_PRESETS,
} from "@/lib/historyStorage";
import { generateCode128Svg } from "@/lib/code128";

export default function Home() {
  const [params, setParams] = useState<AddressParams>({
    ruaInicio: "R01",
    ruaFim: "R02",
    predioInicio: "P01",
    predioFim: "P02",
    aptoInicio: "A01",
    aptoFim: "A10",
    nivelInicio: "N01",
    nivelFim: "N04",
    qtdAptos: 10,
    qtdNiveis: 4,
  });

  const [addresses, setAddresses] = useState<StorageAddress[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAddress, setPreviewAddress] = useState<StorageAddress | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSelectedOnly, setPrintSelectedOnly] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAcceptanceTestsOpen, setIsAcceptanceTestsOpen] = useState(false);

  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [presets, setPresets] = useState<AddressPreset[]>(DEFAULT_PRESETS);

  useEffect(() => {
    setHistory(getHistory());
    setPresets(getPresets());

    try {
      const initialBatch = generateStorageAddresses({
        ruaInicio: "R01",
        ruaFim: "R02",
        predioInicio: "P01",
        predioFim: "P02",
        aptoInicio: "A01",
        aptoFim: "A10",
        nivelInicio: "N01",
        nivelFim: "N04",
      });
      setAddresses(initialBatch);
      setSelectedIds(new Set(initialBatch.map((a) => a.id)));
      if (initialBatch[0]) {
        setPreviewAddress(initialBatch[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const validation = useMemo(() => validateAddressParams(params), [params]);
  const summary = useMemo(() => calculateGenerationSummary(params), [params]);

  const handleGenerate = () => {
    try {
      const generated = generateStorageAddresses(params);
      setAddresses(generated);
      setSelectedIds(new Set(generated.map((a) => a.id)));
      if (generated[0]) {
        setPreviewAddress(generated[0]);
      }

      saveHistoryItem({
        user: "Operador CD",
        params,
        totalGenerated: generated.length,
        firstCode: generated[0]?.code || "",
        lastCode: generated[generated.length - 1]?.code || "",
      });
      setHistory(getHistory());
    } catch (err: any) {
      alert(`Erro na geração: ${err.message || err}`);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(addresses.map((a) => a.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectRange = (startIdx: number, endIdx: number) => {
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    const target = addresses.filter((a) => a.index >= min && a.index <= max);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of target) {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleSelectPreset = (preset: AddressPreset) => {
    setParams(preset.params);
  };

  const handleSaveCurrentAsPreset = (name: string, description: string) => {
    saveCustomPreset(name, description, params);
    setPresets(getPresets());
    alert(`Predefinição "${name}" salva com sucesso!`);
  };

  const handleClearHistory = () => {
    if (confirm("Deseja realmente limpar todo o histórico local de gerações?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const selectedAddresses = useMemo(() => {
    return addresses.filter((a) => selectedIds.has(a.id));
  }, [addresses, selectedIds]);

  const printBatch = printSelectedOnly && selectedAddresses.length > 0 ? selectedAddresses : addresses;

  return (
    <>
      <div className="min-h-screen flex flex-col no-print">
        <Header
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAcceptanceTests={() => setIsAcceptanceTestsOpen(true)}
          totalGeneratedCount={addresses.length}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <ConfigPanel
            params={params}
            onChange={setParams}
            validation={validation}
            presets={presets}
            onSelectPreset={handleSelectPreset}
            onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
          />

          <GenerationSummaryCard
            summary={summary}
            onGenerate={handleGenerate}
            isValid={validation.valid}
            isGenerated={addresses.length > 0}
          />

          <LabelPreview
            address={previewAddress || addresses[0] || null}
            includeLogo={true}
          />

          <LabelsGrid
            addresses={addresses}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onSelectRange={handleSelectRange}
            onPreviewAddress={setPreviewAddress}
            onOpenPrintModal={(selectedOnly) => {
              setPrintSelectedOnly(selectedOnly);
              setIsPrintModalOpen(true);
            }}
          />
        </main>

        <footer className="border-t border-[var(--card-border)] py-6 px-4 text-center text-xs text-[var(--muted)] no-print">
          <p>
            Sistema de Endereçamento de Armazenagem e Impressão CODE 128 — Centro de Distribuição Big Master / Collab
          </p>
          <p className="mt-1 font-mono text-[11px] text-[var(--collab-mostarda)]">
            Dimensão Nominal: 100 × 50 mm • Margens: 10 mm • Área Útil: 80 × 30 mm • Padrão: R01-P01-A01-N01
          </p>
        </footer>
      </div>

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        allAddresses={addresses}
        selectedAddresses={selectedAddresses}
        defaultSelectedOnly={printSelectedOnly}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestoreParams={setParams}
        onClearHistory={handleClearHistory}
      />

      <TestAcceptanceModal
        isOpen={isAcceptanceTestsOpen}
        onClose={() => setIsAcceptanceTestsOpen(false)}
        onLoadTestParams={setParams}
      />

      <div className="print-only">
        {printBatch.map((addr) => {
          const barcodeSvg = generateCode128Svg(addr.code, 220, 48, 8);
          const isDown = addr.arrowDirection === "down";

          return (
            <div key={`print_${addr.id}`} className="printable-label-page">
              <div className="printable-label-content">
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    transform: "rotate(180deg)",
                    writingMode: "vertical-rl",
                    paddingRight: "2mm",
                    borderRight: "0.2mm solid #cccccc",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  BIG MASTER • COLLAB CD
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "100%",
                    padding: "0 2mm",
                  }}
                >
                  <div
                    style={{ width: "100%", height: "18mm", display: "flex", justifyContent: "center" }}
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: "14pt",
                      lineHeight: "1",
                      letterSpacing: "0.5px",
                      textAlign: "center",
                      marginTop: "1mm",
                    }}
                  >
                    {addr.code}
                  </div>
                </div>

                <div
                  style={{
                    width: "14mm",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isDown ? (
                    <svg viewBox="0 0 40 80" style={{ width: "12mm", height: "24mm" }} fill="#000000">
                      <rect x="14" y="0" width="12" height="48" />
                      <polygon points="20,78 0,46 40,46" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 40 80" style={{ width: "12mm", height: "24mm" }} fill="#000000">
                      <polygon points="20,2 0,34 40,34" />
                      <rect x="14" y="32" width="12" height="48" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
