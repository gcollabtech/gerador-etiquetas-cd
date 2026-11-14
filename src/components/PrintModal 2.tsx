"use client";

import { useState, useEffect } from "react";
import { StorageAddress, PrintConfig } from "@/lib/types";
import {
  createLabelsPdfBlob,
  downloadLabelsPdf,
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
} from "@/lib/pdfGenerator";
import {
  Printer,
  Download,
  Eye,
  X,
  FileCheck,
  CheckCircle,
  Sliders,
  Sparkles,
} from "lucide-react";

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAddresses: StorageAddress[];
  selectedAddresses: StorageAddress[];
  defaultSelectedOnly: boolean;
}

export function PrintModal({
  isOpen,
  onClose,
  allAddresses,
  selectedAddresses,
  defaultSelectedOnly,
}: PrintModalProps) {
  const [printSelectedOnly, setPrintSelectedOnly] = useState(defaultSelectedOnly);
  const [mode, setMode] = useState<"thermal" | "a4_grid">("thermal");
  const [showCutBorders, setShowCutBorders] = useState(false);
  const [includeCompanyLogo, setIncludeCompanyLogo] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const targetAddresses = printSelectedOnly ? selectedAddresses : allAddresses;

  useEffect(() => {
    setPrintSelectedOnly(defaultSelectedOnly);
  }, [defaultSelectedOnly]);

  useEffect(() => {
    if (!isOpen) {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGeneratePdfPreview = () => {
    setLoading(true);
    setTimeout(() => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      const blob = createLabelsPdfBlob(targetAddresses, {
        showCutBorders,
        includeCompanyLogo,
      });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setLoading(false);
    }, 100);
  };

  const handleDownloadPdf = () => {
    downloadLabelsPdf(targetAddresses, {
      showCutBorders,
      includeCompanyLogo,
    });
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)]">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[var(--foreground)]">
                Opções de Impressão e Exportação em PDF
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Dimensões físicas padronizadas: {LABEL_WIDTH_MM} × {LABEL_HEIGHT_MM} mm (Escala 100%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Seleção do Escopo de Impressão */}
          <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              1. Selecionar Etiquetas a Serem Impressas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  !printSelectedOnly
                    ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] text-[var(--foreground)]"
                    : "bg-[var(--card)] border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="printScope"
                    checked={!printSelectedOnly}
                    onChange={() => {
                      setPrintSelectedOnly(false);
                      setPdfPreviewUrl(null);
                    }}
                    className="accent-[var(--collab-mostarda)]"
                  />
                  <div>
                    <strong className="block text-xs text-[var(--foreground)]">
                      Lote Completo
                    </strong>
                    <span className="text-[11px] text-[var(--muted)]">
                      Todas as {allAddresses.length} etiquetas geradas
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  printSelectedOnly
                    ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] text-[var(--foreground)]"
                    : "bg-[var(--card)] border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="printScope"
                    disabled={selectedAddresses.length === 0}
                    checked={printSelectedOnly}
                    onChange={() => {
                      setPrintSelectedOnly(true);
                      setPdfPreviewUrl(null);
                    }}
                    className="accent-[var(--collab-mostarda)]"
                  />
                  <div>
                    <strong className="block text-xs text-[var(--foreground)]">
                      Apenas Selecionadas
                    </strong>
                    <span className="text-[11px] text-[var(--muted)]">
                      {selectedAddresses.length} etiquetas marcadas
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Configuração de Impressora & Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                2. Destino de Impressão
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                  <input
                    type="radio"
                    name="printMode"
                    checked={mode === "thermal"}
                    onChange={() => setMode("thermal")}
                    className="accent-[var(--collab-mostarda)]"
                  />
                  <span>Impressora Térmica (Bobina 100 × 50 mm contínua)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                  <input
                    type="radio"
                    name="printMode"
                    checked={mode === "a4_grid"}
                    onChange={() => setMode("a4_grid")}
                    className="accent-[var(--collab-mostarda)]"
                  />
                  <span>Impressora Convencional (Folha A4)</span>
                </label>
              </div>
            </div>

            {/* Opções Gráficas Adicionais */}
            <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                3. Ajustes de Layout
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCompanyLogo}
                    onChange={(e) => {
                      setIncludeCompanyLogo(e.target.checked);
                      setPdfPreviewUrl(null);
                    }}
                    className="accent-[var(--collab-mostarda)]"
                  />
                  <span>Incluir identificação lateral &ldquo;BIG MASTER / COLLAB CD&rdquo;</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCutBorders}
                    onChange={(e) => {
                      setShowCutBorders(e.target.checked);
                      setPdfPreviewUrl(null);
                    }}
                    className="accent-[var(--collab-mostarda)]"
                  />
                  <span>Exibir linha guia pontilhada da área útil (80 × 30 mm)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Área de Pré-Visualização do PDF */}
          <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Eye size={14} className="text-[var(--collab-mostarda)]" />
                <span>Pré-visualização do PDF Vetorial Real</span>
              </span>

              <button
                type="button"
                onClick={handleGeneratePdfPreview}
                disabled={loading || targetAddresses.length === 0}
                className="px-3 py-1.5 text-xs font-bold bg-[var(--secondary)] hover:border-[var(--collab-mostarda)] border border-[var(--card-border)] rounded text-[var(--foreground)] transition-all"
              >
                {loading ? "Gerando PDF..." : "Carregar Prévia do PDF"}
              </button>
            </div>

            {pdfPreviewUrl ? (
              <div className="w-full h-80 rounded border border-[var(--card-border)] overflow-hidden bg-gray-100">
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                  title="Pré-visualização do PDF"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-[var(--card-border)] rounded-lg flex flex-col items-center justify-center text-center p-4">
                <FileCheck size={36} className="text-[var(--muted)] mb-2" />
                <p className="text-xs text-[var(--muted)]">
                  Clique em &ldquo;Carregar Prévia do PDF&rdquo; para visualizar as {targetAddresses.length} etiquetas montadas em alta resolução vetorial.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Ações Finais */}
        <div className="px-6 py-4 border-t border-[var(--card-border)] bg-[var(--background)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[var(--muted)]">
            Total selecionado para saída:{" "}
            <strong className="text-[var(--foreground)] font-mono">
              {targetAddresses.length} etiquetas
            </strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleNativePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] text-xs font-bold rounded-lg transition-all"
            >
              <Printer size={15} className="text-[var(--collab-mostarda)]" />
              <span>Imprimir Direto (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all"
            >
              <Download size={15} />
              <span>Baixar PDF (100 × 50 mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
