"use client";

import { useState } from "react";
import { StorageAddress } from "@/lib/types";
import {
  createLabelsPdfBlob,
  downloadLabelsPdf,
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
  USEFUL_WIDTH_MM,
  USEFUL_HEIGHT_MM,
  MARGIN_MM,
} from "@/lib/pdfGenerator";
import {
  Printer,
  FileDown,
  Eye,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
} from "lucide-react";

interface PrintPortalViewProps {
  addresses: StorageAddress[];
  selectedAddresses: StorageAddress[];
  onOpenPrintModal: (selectedOnly: boolean) => void;
}

export function PrintPortalView({
  addresses,
  selectedAddresses,
  onOpenPrintModal,
}: PrintPortalViewProps) {
  const [printScope, setPrintScope] = useState<"all" | "selected">("all");
  const [showCutBorders, setShowCutBorders] = useState(false);
  const [includeCompanyLogo, setIncludeCompanyLogo] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const targetBatch =
    printScope === "selected" && selectedAddresses.length > 0
      ? selectedAddresses
      : addresses;

  const handleDownloadPdf = () => {
    downloadLabelsPdf(targetBatch, {
      showCutBorders,
      includeCompanyLogo,
    });
  };

  const handleLoadPdfPreview = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      const blob = createLabelsPdfBlob(targetBatch, {
        showCutBorders,
        includeCompanyLogo,
      });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setIsGeneratingPdf(false);
    }, 100);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Printer size={15} className="text-[var(--collab-mostarda)]" />
            <span>Central de Impressão de Etiquetas & Exportação de PDF</span>
          </div>
          <h2 className="font-heading text-lg font-bold text-[var(--foreground)] mt-0.5">
            Impressoras Térmicas e Convencionais • Escala 100%
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Lote preparado: <strong className="text-[var(--foreground)] font-mono">{targetBatch.length} etiquetas</strong>{" "}
            ({printScope === "selected" ? "somente selecionadas" : "todas as geradas"}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[var(--collab-mostarda)] text-black hover:opacity-95 shadow-sm transition-all cursor-pointer"
          >
            <FileDown size={14} />
            <span>Baixar PDF ({targetBatch.length} un)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPrintModal(printScope === "selected")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
          >
            <Sliders size={14} className="text-[var(--collab-mostarda)]" />
            <span>Opções Avançadas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scope selector */}
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-3">
          <label className="text-xs font-bold text-[var(--foreground)] block">
            Escopo da Impressão
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
              <input
                type="radio"
                name="portalPrintScope"
                checked={printScope === "all"}
                onChange={() => setPrintScope("all")}
                className="accent-[var(--collab-mostarda)]"
              />
              <span>Todas as etiquetas geradas ({addresses.length} un)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
              <input
                type="radio"
                name="portalPrintScope"
                checked={printScope === "selected"}
                onChange={() => setPrintScope("selected")}
                disabled={selectedAddresses.length === 0}
                className="accent-[var(--collab-mostarda)]"
              />
              <span className={selectedAddresses.length === 0 ? "opacity-50" : ""}>
                Somente etiquetas selecionadas ({selectedAddresses.length} un)
              </span>
            </label>
          </div>

          <div className="pt-2 border-t border-[var(--card-border)] space-y-2">
            <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={showCutBorders}
                onChange={(e) => setShowCutBorders(e.target.checked)}
                className="accent-[var(--collab-mostarda)]"
              />
              <span>Exibir guias pontilhadas de corte</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompanyLogo}
                onChange={(e) => setIncludeCompanyLogo(e.target.checked)}
                className="accent-[var(--collab-mostarda)]"
              />
              <span>Incluir logo Collab na coluna lateral</span>
            </label>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-2.5">
          <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <Info size={14} className="text-[var(--collab-mostarda)]" />
            <span>Especificações Físicas do PDF</span>
          </div>

          <ul className="text-xs space-y-1.5 text-[var(--muted)]">
            <li className="flex justify-between">
              <span>Dimensão da Etiqueta:</span>
              <strong className="font-mono text-[var(--foreground)]">100 × 50 mm</strong>
            </li>
            <li className="flex justify-between">
              <span>Margens de Segurança:</span>
              <strong className="font-mono text-[var(--foreground)]">10 mm (1 cm)</strong>
            </li>
            <li className="flex justify-between">
              <span>Área Útil Central:</span>
              <strong className="font-mono text-[var(--foreground)]">80 × 30 mm</strong>
            </li>
            <li className="flex justify-between">
              <span>Padrão do Código:</span>
              <strong className="font-mono text-[var(--foreground)]">CODE 128 (Subset B)</strong>
            </li>
            <li className="flex justify-between">
              <span>Escala Obrigatória:</span>
              <strong className="font-mono text-[var(--collab-mostarda)]">100% (Sem Ajuste)</strong>
            </li>
          </ul>
        </div>

        {/* Quick thermal printing advice */}
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-2">
          <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--collab-mostarda)]" />
            <span>Impressoras Térmicas Compatíveis</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            Compatível com bobinas contínuas ou gap de 100 × 50 mm:
            <br />
            <strong>• Zebra</strong> (ZD220, ZD230, GC420t, GK420t)
            <br />
            <strong>• Argox</strong> (OS-214 Plus, CP-2140)
            <br />
            <strong>• Datamax / Honeywell</strong> (E-Class Mark III)
            <br />
            <strong>• Elgin</strong> (L42 Pro)
          </p>
        </div>
      </div>

      {/* PDF Preview Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={14} className="text-[var(--collab-mostarda)]" />
            <span>Pré-visualização do Documento PDF Gerado</span>
          </span>

          <button
            type="button"
            onClick={handleLoadPdfPreview}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
          >
            <Eye size={13} />
            <span>{isGeneratingPdf ? "Gerando..." : "Atualizar Pré-visualização do PDF"}</span>
          </button>
        </div>

        {pdfPreviewUrl ? (
          <div className="w-full h-96 rounded-lg border border-[var(--card-border)] overflow-hidden bg-gray-100">
            <iframe
              src={pdfPreviewUrl}
              title="Pré-visualização do PDF"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="w-full h-44 rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center space-y-2">
            <FileDown size={28} className="text-[var(--muted)] opacity-60" />
            <p className="text-xs text-[var(--muted)]">
              Clique no botão acima para carregar a prévia visual interativa do PDF aqui na tela.
            </p>
            <button
              type="button"
              onClick={handleLoadPdfPreview}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-[var(--collab-mostarda)] text-black cursor-pointer hover:opacity-90"
            >
              Carregar Prévia Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
