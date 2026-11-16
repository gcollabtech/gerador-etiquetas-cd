"use client";

import { useState, useEffect } from "react";
import { StorageAddress, PrintLayoutMode, LabelFontFamily } from "@/lib/types";
import {
  createLabelsPdfBlob,
  downloadLabelsPdf,
  printLabelsPdf,
  calculateA4GridLayout,
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
  Grid,
  ExternalLink,
  Type,
} from "lucide-react";

interface PrintPortalViewProps {
  addresses: StorageAddress[];
  selectedAddresses: StorageAddress[];
  defaultSelectedOnly?: boolean;
  onScopeChange?: (selectedOnly: boolean) => void;
  onOpenPrintModal: (selectedOnly: boolean) => void;
  larguraCm?: number | "";
  alturaCm?: number | "";
  fonteFamilia?: LabelFontFamily;
  tamanhoFontePt?: number | "";
  alturaCodigoBarrasMm?: number | "";
}

export function PrintPortalView({
  addresses,
  selectedAddresses,
  defaultSelectedOnly = false,
  onScopeChange,
  onOpenPrintModal,
  larguraCm = 10,
  alturaCm = 5,
  fonteFamilia: initialFonteFamilia = "Helvetica",
  tamanhoFontePt: initialTamanhoFontePt = 16,
  alturaCodigoBarrasMm = 20,
}: PrintPortalViewProps) {
  const [printScope, setPrintScope] = useState<"all" | "selected">(() => {
    return defaultSelectedOnly && selectedAddresses.length > 0 ? "selected" : "all";
  });
  const [mode, setMode] = useState<PrintLayoutMode>("a4_grid");
  const [showCutBorders, setShowCutBorders] = useState(false);
  const [includeCompanyLogo, setIncludeCompanyLogo] = useState(true);
  const [fonteFamilia, setFonteFamilia] = useState<LabelFontFamily>(initialFonteFamilia);
  const [tamanhoFontePt, setTamanhoFontePt] = useState<number | "">(initialTamanhoFontePt);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const wCm = Number(larguraCm) > 0 ? Number(larguraCm) : 10;
  const hCm = Number(alturaCm) > 0 ? Number(alturaCm) : 5;

  useEffect(() => {
    if (initialFonteFamilia) setFonteFamilia(initialFonteFamilia);
  }, [initialFonteFamilia]);

  useEffect(() => {
    if (initialTamanhoFontePt !== undefined) setTamanhoFontePt(initialTamanhoFontePt);
  }, [initialTamanhoFontePt]);

  useEffect(() => {
    if (defaultSelectedOnly && selectedAddresses.length > 0) {
      setPrintScope("selected");
    } else if (!defaultSelectedOnly && selectedAddresses.length === 0) {
      setPrintScope("all");
    }
  }, [defaultSelectedOnly, selectedAddresses.length]);

  const targetBatch =
    printScope === "selected" && selectedAddresses.length > 0
      ? selectedAddresses
      : addresses;

  const grid = calculateA4GridLayout(wCm, hCm, targetBatch.length);

  const handleScopeChange = (newScope: "all" | "selected") => {
    setPrintScope(newScope);
    setPdfPreviewUrl(null);
    onScopeChange?.(newScope === "selected");
  };

  useEffect(() => {
    let active = true;
    setIsGeneratingPdf(true);

    try {
      const blob = createLabelsPdfBlob(targetBatch, {
        mode,
        showCutBorders,
        includeCompanyLogo,
        larguraCm: wCm,
        alturaCm: hCm,
        fonteFamilia,
        tamanhoFontePt,
        alturaCodigoBarrasMm,
      });
      const url = URL.createObjectURL(blob);
      if (active) {
        setPdfPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setIsGeneratingPdf(false);
      }
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      if (active) setIsGeneratingPdf(false);
    }

    return () => {
      active = false;
    };
  }, [targetBatch, mode, showCutBorders, includeCompanyLogo, wCm, hCm, fonteFamilia, tamanhoFontePt, alturaCodigoBarrasMm]);

  const handleDownloadPdf = () => {
    downloadLabelsPdf(targetBatch, {
      mode,
      showCutBorders,
      includeCompanyLogo,
      larguraCm: wCm,
      alturaCm: hCm,
      fonteFamilia,
      tamanhoFontePt,
      alturaCodigoBarrasMm,
    });
  };

  const handlePrint = () => {
    printLabelsPdf(targetBatch, {
      mode,
      showCutBorders,
      includeCompanyLogo,
      larguraCm: wCm,
      alturaCm: hCm,
      fonteFamilia,
      tamanhoFontePt,
      alturaCodigoBarrasMm,
    });
  };

  const handleLoadPdfPreview = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      const blob = createLabelsPdfBlob(targetBatch, {
        mode,
        showCutBorders,
        includeCompanyLogo,
        larguraCm: wCm,
        alturaCm: hCm,
        fonteFamilia,
        tamanhoFontePt,
        alturaCodigoBarrasMm,
      });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setIsGeneratingPdf(false);
    }, 50);
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
            {mode === "a4_grid"
              ? `Folha A4: ${grid.labelsPerPage} etiquetas/folha (${grid.cols} colunas × ${grid.rows} linhas)`
              : `Impressão Térmica: Bobina ${wCm} × ${hCm} cm`}
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Lote: <strong className="text-[var(--foreground)] font-mono">{targetBatch.length} etiquetas</strong> •{" "}
            {mode === "a4_grid" ? (
              <span className="text-[var(--collab-mostarda)] font-semibold">
                {grid.totalPages} folha{grid.totalPages > 1 ? "s" : ""} A4 necessária{grid.totalPages > 1 ? "s" : ""}
              </span>
            ) : (
              <span>bobina individual</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[var(--collab-mostarda)] text-black hover:opacity-95 shadow-sm transition-all cursor-pointer"
            title="Imprimir etiquetas diretamente"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] shadow-sm transition-all cursor-pointer"
            title="Baixar arquivo PDF com todas as etiquetas"
          >
            <FileDown size={14} className="text-[var(--collab-mostarda)]" />
            <span>
              {mode === "a4_grid"
                ? `Baixar PDF A4 (${grid.totalPages} folha${grid.totalPages > 1 ? "s" : ""})`
                : `Baixar PDF (${targetBatch.length} un)`}
            </span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Layout & Scope selector */}
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-3">
          <label className="text-xs font-bold text-[var(--foreground)] block">
            Formato de Impressão do PDF
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-xs text-[var(--foreground)] cursor-pointer">
              <input
                type="radio"
                name="portalMode"
                checked={mode === "a4_grid"}
                onChange={() => {
                  setMode("a4_grid");
                  setPdfPreviewUrl(null);
                }}
                className="accent-[var(--collab-mostarda)] mt-0.5"
              />
              <div>
                <strong className="block">Folha A4 (Múltiplas Etiquetas)</strong>
                <span className="text-[11px] text-[var(--muted)]">
                  {grid.labelsPerPage} por folha ({grid.cols}x{grid.rows})
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 text-xs text-[var(--foreground)] cursor-pointer">
              <input
                type="radio"
                name="portalMode"
                checked={mode === "thermal"}
                onChange={() => {
                  setMode("thermal");
                  setPdfPreviewUrl(null);
                }}
                className="accent-[var(--collab-mostarda)] mt-0.5"
              />
              <div>
                <strong className="block">Bobina Térmica Contínua</strong>
                <span className="text-[11px] text-[var(--muted)]">
                  1 por página ({wCm} × {hCm} cm)
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-[var(--card-border)] space-y-2">
            <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={showCutBorders}
                onChange={(e) => {
                  setShowCutBorders(e.target.checked);
                  setPdfPreviewUrl(null);
                }}
                className="accent-[var(--collab-mostarda)]"
              />
              <span>Exibir guias pontilhadas de corte</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompanyLogo}
                onChange={(e) => {
                  setIncludeCompanyLogo(e.target.checked);
                  setPdfPreviewUrl(null);
                }}
                className="accent-[var(--collab-mostarda)]"
              />
              <span>Incluir logo Collab vertical</span>
            </label>
          </div>
        </div>

        {/* Typography (Fonte e Tamanho) */}
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-3">
          <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <Type size={14} className="text-[var(--collab-mostarda)]" />
            <span>Fonte e Tamanho das Letras</span>
          </label>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--muted)]">Família Tipográfica:</span>
            <div className="grid grid-cols-3 gap-1">
              {(["Helvetica", "Courier", "Times"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFonteFamilia(f);
                    setPdfPreviewUrl(null);
                  }}
                  className={`px-1.5 py-1 text-xs rounded border text-center transition-all cursor-pointer ${
                    fonteFamilia === f
                      ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                      : "bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Tamanho:</span>
              <span className="text-[11px] font-mono text-[var(--collab-mostarda)]">
                {tamanhoFontePt && Number(tamanhoFontePt) > 0 ? `${tamanhoFontePt} pt` : "Auto"}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTamanhoFontePt("");
                  setPdfPreviewUrl(null);
                }}
                className={`px-2 py-0.5 text-[11px] rounded border transition-all cursor-pointer ${
                  !tamanhoFontePt
                    ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                    : "bg-[var(--card)] border-[var(--card-border)] text-[var(--muted)]"
                }`}
              >
                Auto
              </button>
              {[12, 14, 16, 18, 20, 24].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setTamanhoFontePt(sz);
                    setPdfPreviewUrl(null);
                  }}
                  className={`px-1.5 py-0.5 text-[11px] font-mono rounded border transition-all cursor-pointer ${
                    Number(tamanhoFontePt) === sz
                      ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                      : "bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                  }`}
                >
                  {sz}pt
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-2.5">
          <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <Info size={14} className="text-[var(--collab-mostarda)]" />
            <span>Especificações do Documento PDF</span>
          </div>

          <ul className="text-xs space-y-1.5 text-[var(--muted)]">
            <li className="flex justify-between">
              <span>Dimensões da Etiqueta:</span>
              <strong className="font-mono text-[var(--collab-mostarda)]">{wCm} × {hCm} cm</strong>
            </li>
            <li className="flex justify-between">
              <span>Fonte / Tamanho:</span>
              <strong className="font-mono text-[var(--foreground)]">{fonteFamilia} • {tamanhoFontePt ? `${tamanhoFontePt}pt` : "Auto"}</strong>
            </li>
            <li className="flex justify-between">
              <span>Formato do Arquivo:</span>
              <strong className="font-mono text-[var(--foreground)]">{mode === "a4_grid" ? "Folha A4" : "Rolo / Bobina"}</strong>
            </li>
            {mode === "a4_grid" ? (
              <>
                <li className="flex justify-between">
                  <span>Capacidade / Folha:</span>
                  <strong className="font-mono text-[var(--collab-mostarda)]">{grid.labelsPerPage} etiq. ({grid.cols}x{grid.rows})</strong>
                </li>
                <li className="flex justify-between">
                  <span>Total de Folhas:</span>
                  <strong className="font-mono text-[var(--foreground)]">{grid.totalPages} folha{grid.totalPages > 1 ? "s" : ""}</strong>
                </li>
              </>
            ) : (
              <li className="flex justify-between">
                <span>Páginas no PDF:</span>
                <strong className="font-mono text-[var(--collab-mostarda)]">{targetBatch.length} páginas</strong>
              </li>
            )}
            <li className="flex justify-between">
              <span>Padrão do Código:</span>
              <strong className="font-mono text-[var(--foreground)]">CODE 128 (Subset B)</strong>
            </li>
          </ul>
        </div>

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
                onChange={() => handleScopeChange("all")}
                className="accent-[var(--collab-mostarda)]"
              />
              <span>Todas as etiquetas geradas ({addresses.length} un)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
              <input
                type="radio"
                name="portalPrintScope"
                checked={printScope === "selected"}
                onChange={() => handleScopeChange("selected")}
                disabled={selectedAddresses.length === 0}
                className="accent-[var(--collab-mostarda)]"
              />
              <span className={selectedAddresses.length === 0 ? "opacity-50" : ""}>
                Somente selecionadas ({selectedAddresses.length} un)
              </span>
            </label>
          </div>
          <div className="p-2.5 rounded bg-[var(--collab-mostarda)]/10 border border-[var(--collab-mostarda)]/25 text-[11px] text-[var(--foreground)]">
            💡 <strong>Dica de Impressão:</strong> Ao imprimir o PDF baixado ou na visualização, certifique-se de selecionar a opção <em>&ldquo;Tamanho Real&rdquo;</em> ou <em>&ldquo;Escala 100%&rdquo;</em> para preservar os {wCm} × {hCm} cm exatos.
          </div>
        </div>
      </div>

      {/* PDF Preview Area */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-[var(--collab-mostarda)]" />
              <span>Pré-visualização do Documento PDF Gerado</span>
            </span>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              {mode === "a4_grid"
                ? `Exibindo folha A4 com grade de ${grid.labelsPerPage} etiquetas (${grid.cols}×${grid.rows})`
                : `Exibindo etiqueta individual para bobina (${wCm} × ${hCm} cm)`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--collab-mostarda)] text-black hover:opacity-95 shadow-sm transition-all cursor-pointer"
              title="Imprimir etiquetas diretamente"
            >
              <Printer size={13} />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
              title="Baixar arquivo PDF"
            >
              <FileDown size={13} className="text-[var(--collab-mostarda)]" />
              <span>Baixar PDF</span>
            </button>

            {pdfPreviewUrl && (
              <button
                type="button"
                onClick={() => window.open(pdfPreviewUrl, "_blank")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
                title="Abrir PDF em nova guia do navegador"
              >
                <ExternalLink size={13} />
                <span>Abrir em Nova Guia</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadPdfPreview}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
            >
              <Eye size={13} />
              <span>{isGeneratingPdf ? "Atualizando..." : "Atualizar Pré-visualização"}</span>
            </button>
          </div>
        </div>

        {pdfPreviewUrl ? (
          <div className="w-full h-[650px] rounded-lg border border-[var(--card-border)] overflow-hidden bg-white shadow-inner relative">
            {isGeneratingPdf && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                <span className="text-xs font-bold text-[var(--foreground)] animate-pulse">
                  Gerando prévia do PDF em alta resolução...
                </span>
              </div>
            )}
            <object
              data={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                title="Pré-visualização do PDF"
                className="w-full h-full border-0"
              />
            </object>
          </div>
        ) : (
          <div className="w-full h-44 rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center space-y-2">
            <FileDown size={28} className="text-[var(--muted)] opacity-60" />
            <p className="text-xs text-[var(--muted)]">
              {isGeneratingPdf ? "Gerando pré-visualização do PDF..." : "Carregando documento PDF..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
