"use client";

import { useState, useEffect } from "react";
import { StorageAddress, PrintConfig, LabelFontFamily } from "@/lib/types";
import {
  createLabelsPdfBlob,
  downloadLabelsPdf,
  printLabelsPdf,
  calculateA4GridLayout,
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
} from "@/lib/pdfGenerator";
import {
  Printer,
  Download,
  Eye,
  X,
  FileCheck,
  Grid,
  ExternalLink,
  Type,
} from "lucide-react";

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAddresses: StorageAddress[];
  selectedAddresses: StorageAddress[];
  defaultSelectedOnly: boolean;
  larguraCm?: number | "";
  alturaCm?: number | "";
  fonteFamilia?: LabelFontFamily;
  tamanhoFontePt?: number | "";
  alturaCodigoBarrasMm?: number | "";
}

export function PrintModal({
  isOpen,
  onClose,
  allAddresses,
  selectedAddresses,
  defaultSelectedOnly,
  larguraCm = 10,
  alturaCm = 5,
  fonteFamilia: initialFonteFamilia = "Helvetica",
  tamanhoFontePt: initialTamanhoFontePt = 16,
  alturaCodigoBarrasMm = 20,
}: PrintModalProps) {
  const [printSelectedOnly, setPrintSelectedOnly] = useState(defaultSelectedOnly);
  const [mode, setMode] = useState<"thermal" | "a4_grid">("a4_grid");
  const [showCutBorders, setShowCutBorders] = useState(false);
  const [includeCompanyLogo, setIncludeCompanyLogo] = useState(true);
  const [fonteFamilia, setFonteFamilia] = useState<LabelFontFamily>(initialFonteFamilia);
  const [tamanhoFontePt, setTamanhoFontePt] = useState<number | "">(initialTamanhoFontePt);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const wCm = Number(larguraCm) > 0 ? Number(larguraCm) : 10;
  const hCm = Number(alturaCm) > 0 ? Number(alturaCm) : 5;

  const targetAddresses = printSelectedOnly && selectedAddresses.length > 0 ? selectedAddresses : allAddresses;
  const grid = calculateA4GridLayout(wCm, hCm, targetAddresses.length);

  useEffect(() => {
    if (isOpen) {
      setPrintSelectedOnly(Boolean(defaultSelectedOnly && selectedAddresses.length > 0));
      if (initialFonteFamilia) setFonteFamilia(initialFonteFamilia);
      if (initialTamanhoFontePt !== undefined) setTamanhoFontePt(initialTamanhoFontePt);
    }
  }, [isOpen, defaultSelectedOnly, selectedAddresses.length, initialFonteFamilia, initialTamanhoFontePt]);

  useEffect(() => {
    if (!isOpen) {
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let active = true;
    setLoading(true);

    try {
      const blob = createLabelsPdfBlob(targetAddresses, {
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
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      if (active) setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [isOpen, targetAddresses, mode, showCutBorders, includeCompanyLogo, wCm, hCm, fonteFamilia, tamanhoFontePt, alturaCodigoBarrasMm]);

  if (!isOpen) return null;

  const handleGeneratePdfPreview = () => {
    setLoading(true);
    setTimeout(() => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      const blob = createLabelsPdfBlob(targetAddresses, {
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
      setLoading(false);
    }, 50);
  };

  const handleDownloadPdf = () => {
    downloadLabelsPdf(targetAddresses, {
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

  const handleNativePrint = () => {
    printLabelsPdf(targetAddresses, {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
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
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
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
                    className="accent-[var(--collab-mostarda)] cursor-pointer"
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
                    className="accent-[var(--collab-mostarda)] cursor-pointer"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                2. Formato do PDF & Dispositivo
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 text-xs text-[var(--foreground)] cursor-pointer p-2 rounded-lg hover:bg-[var(--secondary)] transition-all">
                  <input
                    type="radio"
                    name="printMode"
                    checked={mode === "a4_grid"}
                    onChange={() => {
                      setMode("a4_grid");
                      setPdfPreviewUrl(null);
                    }}
                    className="accent-[var(--collab-mostarda)] mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Folha A4 — Múltiplas Etiquetas (Grade)</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {grid.cols} colunas × {grid.rows} linhas = <strong>{grid.labelsPerPage} etiquetas/folha</strong> ({grid.totalPages} folha{grid.totalPages > 1 ? "s" : ""} no total)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-[var(--foreground)] cursor-pointer p-2 rounded-lg hover:bg-[var(--secondary)] transition-all">
                  <input
                    type="radio"
                    name="printMode"
                    checked={mode === "thermal"}
                    onChange={() => {
                      setMode("thermal");
                      setPdfPreviewUrl(null);
                    }}
                    className="accent-[var(--collab-mostarda)] mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Bobina Térmica — 1 Etiqueta por Página</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Rolo contínuo no formato individual ({wCm} × {hCm} cm)
                    </span>
                  </div>
                </label>
              </div>
            </div>

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
                  <span>Exibir linha guia pontilhada da área útil</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-2.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Type size={14} className="text-[var(--collab-mostarda)]" />
                <span>4. Tipografia da Etiqueta (Ruas, Andares/Prédios, Aptos e Níveis)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs text-[var(--foreground)] font-medium block">Família da Fonte:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["Helvetica", "Courier", "Times"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setFonteFamilia(f);
                          setPdfPreviewUrl(null);
                        }}
                        className={`px-2 py-1.5 text-xs rounded border text-center transition-all cursor-pointer ${
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--foreground)]">Tamanho das Letras/Números:</span>
                    <span className="font-mono text-[var(--collab-mostarda)]">
                      {tamanhoFontePt && Number(tamanhoFontePt) > 0 ? `${tamanhoFontePt} pt` : "Automático"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setTamanhoFontePt("");
                        setPdfPreviewUrl(null);
                      }}
                      className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer ${
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
                        className={`px-2 py-1 text-xs font-mono rounded border transition-all cursor-pointer ${
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
            </div>
          </div>

          <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Eye size={14} className="text-[var(--collab-mostarda)]" />
                <span>Pré-visualização do PDF Vetorial Real</span>
              </span>

              <div className="flex items-center gap-2">
                {pdfPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(pdfPreviewUrl, "_blank")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] rounded transition-all cursor-pointer"
                    title="Abrir PDF em nova aba do navegador"
                  >
                    <ExternalLink size={13} />
                    <span>Abrir em Nova Aba</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGeneratePdfPreview}
                  disabled={loading || targetAddresses.length === 0}
                  className="px-3 py-1.5 text-xs font-bold bg-[var(--secondary)] hover:border-[var(--collab-mostarda)] border border-[var(--card-border)] rounded text-[var(--foreground)] transition-all cursor-pointer"
                >
                  {loading ? "Gerando PDF..." : "Atualizar Prévia"}
                </button>
              </div>
            </div>

            {pdfPreviewUrl ? (
              <div className="w-full h-80 rounded-lg border border-[var(--card-border)] overflow-hidden bg-white shadow-inner">
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
              <div className="py-12 border-2 border-dashed border-[var(--card-border)] rounded-lg flex flex-col items-center justify-center text-center p-4">
                <FileCheck size={36} className="text-[var(--muted)] mb-2" />
                <p className="text-xs text-[var(--muted)]">
                  {loading ? "Renderizando documento PDF..." : "Carregando pré-visualização das etiquetas..."}
                </p>
              </div>
            )}
          </div>
        </div>

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
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <Printer size={15} className="text-[var(--collab-mostarda)]" />
              <span>Imprimir Direto (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>
                {mode === "a4_grid"
                  ? `Baixar PDF A4 (${grid.totalPages} folha${grid.totalPages > 1 ? "s" : ""})`
                  : `Baixar PDF Bobina (${targetAddresses.length} un)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
