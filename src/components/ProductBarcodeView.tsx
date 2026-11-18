"use client";

import { useState, useMemo } from "react";
import {
  ProductLabelItem,
  ProductLabelConfig,
  PRESETS_PRODUTO,
  ProductLabelPreset,
  SEED_PRODUCT_LABELS,
} from "@/lib/productLabelTypes";
import {
  calcEan13CheckDigit,
  validateAndNormalizeEan13,
  generateEan13Svg,
  formatEan13,
} from "@/lib/ean13";
import { downloadProductLabelsPdf } from "@/lib/productPdfGenerator";
import {
  Barcode,
  Printer,
  Download,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tag,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

export function ProductBarcodeView() {
  // Configuração dimensional da etiqueta
  const [preset, setPreset] = useState<ProductLabelPreset>("40x30");
  const [larguraMm, setLarguraMm] = useState<number>(40);
  const [alturaMm, setAlturaMm] = useState<number>(30);
  const [mostrarCodigoProduto, setMostrarCodigoProduto] = useState(true);
  const [formatoEanEspacado, setFormatoEanEspacado] = useState(false);
  const [descFontPt, setDescFontPt] = useState<number>(0); // 0 = auto

  // Fila de produtos para impressão
  const [items, setItems] = useState<ProductLabelItem[]>(SEED_PRODUCT_LABELS);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  // Formulário do produto em foco
  const [formDescricao, setFormDescricao] = useState("CANETA ESFEROGRÁFICA AZUL 1.0MM");
  const [formEan, setFormEan] = useState("7891000315507");
  const [formCodigoProduto, setFormCodigoProduto] = useState("PRD-1005");
  const [formQuantidade, setFormQuantidade] = useState<number>(10);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Troca de preset dimensional
  const handleSelectPreset = (p: ProductLabelPreset) => {
    setPreset(p);
    const def = PRESETS_PRODUTO[p];
    if (def) {
      setLarguraMm(def.larguraMm);
      setAlturaMm(def.alturaMm);
    }
  };

  // Produto selecionado para o preview
  const currentPreviewItem: ProductLabelItem = useMemo(() => {
    if (items.length > 0 && items[selectedPreviewIndex]) {
      return items[selectedPreviewIndex]!;
    }
    return {
      id: "preview-temp",
      descricao: formDescricao || "DESCRIÇÃO DO PRODUTO",
      codigoEan: formEan || "7891000315507",
      codigoProduto: formCodigoProduto || "PRD-0001",
      quantidade: 1,
      createdAt: new Date().toISOString(),
    };
  }, [items, selectedPreviewIndex, formDescricao, formEan, formCodigoProduto]);

  // Validação dinâmica do EAN-13
  const eanValidation = useMemo(() => {
    return validateAndNormalizeEan13(formEan);
  }, [formEan]);

  // Geração do SVG do código EAN-13 para o preview
  const previewSvg = useMemo(() => {
    const code = currentPreviewItem.codigoEan || "7891000315507";
    // Dimensões do SVG interno
    const svgW = Math.round(larguraMm * 7);
    const svgH = Math.round(alturaMm * 4);
    return generateEan13Svg(code, svgW, svgH, 6);
  }, [currentPreviewItem.codigoEan, larguraMm, alturaMm]);

  // Adicionar produto à fila
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const descClean = formDescricao.trim().toUpperCase();
    if (!descClean) {
      setFormError("Informe a descrição do produto.");
      return;
    }

    const eanClean = formEan.replace(/\D/g, "");
    if (eanClean.length < 12) {
      setFormError("O código EAN-13 deve ter pelo menos 12 dígitos.");
      return;
    }

    const norm = validateAndNormalizeEan13(eanClean);

    const newItem: ProductLabelItem = {
      id: `prd-${Date.now()}`,
      descricao: descClean,
      codigoEan: norm.code13,
      codigoProduto: formCodigoProduto.trim() || undefined,
      quantidade: Math.max(1, Number(formQuantidade) || 1),
      createdAt: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedPreviewIndex(0);
    setToastMsg({
      text: `Produto "${descClean}" adicionado à fila de impressão!`,
      type: "success",
    });

    // Limpa formulário para o próximo
    setFormDescricao("");
    setFormEan("");
    setFormCodigoProduto("");
    setFormQuantidade(1);
  };

  // Gerar EAN-13 aleatório válido com prefixo Brasil 789
  const handleGerarEanAleatorio = () => {
    // 789 + 9 dígitos aleatórios = 12 dígitos
    let digits12 = "789";
    for (let i = 0; i < 9; i++) {
      digits12 += Math.floor(Math.random() * 10).toString();
    }
    const check = calcEan13CheckDigit(digits12);
    const fullEan = `${digits12}${check}`;
    setFormEan(fullEan);
    setFormError(null);
  };

  // Corrigir dígito verificador automaticamente
  const handleCorrigirDigito = () => {
    const clean = formEan.replace(/\D/g, "");
    if (clean.length >= 12) {
      const base12 = clean.slice(0, 12);
      const check = calcEan13CheckDigit(base12);
      setFormEan(`${base12}${check}`);
      setFormError(null);
    }
  };

  // Remover produto da lista
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedPreviewIndex >= items.length - 1) {
      setSelectedPreviewIndex(Math.max(0, items.length - 2));
    }
  };

  // Total de etiquetas para imprimir
  const totalEtiquetasParaImprimir = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.quantidade || 1), 0);
  }, [items]);

  // Configuração atual empacotada
  const currentConfig: ProductLabelConfig = useMemo(() => {
    return {
      larguraMm,
      alturaMm,
      preset,
      mostrarCodigoProduto,
      formatoEanEspacado,
      tamanhoFonteDescricaoPt: descFontPt,
      tamanhoFonteCodigoPt: 0,
    };
  }, [larguraMm, alturaMm, preset, mostrarCodigoProduto, formatoEanEspacado, descFontPt]);

  // Download do PDF de Impressão Térmica
  const handleDownloadPdf = () => {
    const printItems = items.length > 0 ? items : [currentPreviewItem];
    downloadProductLabelsPdf(printItems, currentConfig);
    setToastMsg({
      text: `PDF de ${printItems.length} produto(s) gerado com sucesso!`,
      type: "success",
    });
  };

  // Impressão direta do navegador
  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
            toastMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header do Módulo */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center shrink-0">
              <Barcode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-[var(--foreground)]">
                  4. Etiquetas de Código de Barras (Produto)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
                  EAN-13 Térmico
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Emissão térmica de alta legibilidade para leitores ópticos: descrição centralizada, código EAN-13 maximizado e código numérico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Baixar PDF Térmico</span>
            </button>
            <button
              type="button"
              onClick={handlePrintBrowser}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer transition-all"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Configuração Dimensional e Cadastro de Produtos */}
        <div className="lg:col-span-6 space-y-4">
          {/* Seletor Dimensional (Igual ao de endereço, editável) */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Dimensões da Etiqueta Térmica
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--muted)]">
                {larguraMm} × {alturaMm} mm ({(larguraMm / 10).toFixed(1)} × {(alturaMm / 10).toFixed(1)} cm)
              </span>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--foreground)] block">
                Formatos Padrão (Presets):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["40x30", "60x30", "50x30", "100x50"] as ProductLabelPreset[]).map((pKey) => {
                  const pDef = PRESETS_PRODUTO[pKey];
                  const isSelected = preset === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => handleSelectPreset(pKey)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--collab-mostarda)]/15 border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold shadow-sm"
                          : "bg-[var(--background)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <strong className="block text-xs font-mono">{pDef.label}</strong>
                      <span className="text-[10px] text-[var(--muted)] block truncate">
                        {pKey === "40x30" ? "Compacta" : pKey === "60x30" ? "Ampla" : "Padrão"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs de Largura e Altura Editáveis */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--foreground)] block">
                  Largura (mm):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={larguraMm}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLarguraMm(v);
                      setPreset("custom");
                    }}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
                    mm
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--foreground)] block">
                  Altura (mm):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={15}
                    max={150}
                    value={alturaMm}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAlturaMm(v);
                      setPreset("custom");
                    }}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
                    mm
                  </span>
                </div>
              </div>
            </div>

            {/* Opções de Exibição */}
            <div className="pt-2 border-t border-[var(--card-border)] flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mostrarCodigoProduto}
                  onChange={(e) => setMostrarCodigoProduto(e.target.checked)}
                  className="accent-[var(--collab-mostarda)] rounded"
                />
                <span>Exibir Código/SKU interno</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formatoEanEspacado}
                  onChange={(e) => setFormatoEanEspacado(e.target.checked)}
                  className="accent-[var(--collab-mostarda)] rounded"
                />
                <span>Espaçar número EAN (ex: 7 891234 567890)</span>
              </label>
            </div>
          </div>

          {/* Formulário de Cadastro do Produto */}
          <form
            onSubmit={handleAddProduct}
            className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Dados do Produto
                </h3>
              </div>
              <span className="text-[10px] text-[var(--muted)]">Layout Limpo e Minimalista</span>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Descrição do Produto */}
            <div className="space-y-1">
              <label className="font-bold text-[var(--foreground)] block">
                Descrição do Produto * (Centralizada na parte superior):
              </label>
              <input
                type="text"
                required
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value.toUpperCase())}
                placeholder="Ex: DETERGENTE LÍQUIDO NEUTRO 500ML"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-semibold"
              />
            </div>

            {/* Código EAN-13 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[var(--foreground)] block">
                  Código de Barras EAN-13 * (12 ou 13 dígitos):
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={handleGerarEanAleatorio}
                    className="text-[var(--collab-mostarda)] hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Sparkles size={11} />
                    <span>Gerar EAN Válido</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={13}
                  value={formEan}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setFormEan(clean);
                    setFormError(null);
                  }}
                  placeholder="7891234567890"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-mono font-bold tracking-wider focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
                {eanValidation.error && (
                  <button
                    type="button"
                    onClick={handleCorrigirDigito}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer"
                    title="Calcular e corrigir o 13º dígito"
                  >
                    Corrigir Dígito
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--muted)] px-1">
                <span>
                  Dígitos: <strong>{formEan.length} / 13</strong>
                </span>
                {formEan.length === 12 && (
                  <span className="text-emerald-400 font-semibold">
                    + Dígito {calcEan13CheckDigit(formEan)} será adicionado automaticamente
                  </span>
                )}
              </div>
            </div>

            {/* Código Interno e Quantidade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">
                  Código do Produto / SKU (opcional):
                </label>
                <input
                  type="text"
                  value={formCodigoProduto}
                  onChange={(e) => setFormCodigoProduto(e.target.value.toUpperCase())}
                  placeholder="Ex: PRD-0042"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">
                  Qtd de Etiquetas:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={5000}
                  value={formQuantidade}
                  onChange={(e) => setFormQuantidade(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>Adicionar à Fila de Impressão</span>
            </button>
          </form>

          {/* Fila / Lote de Etiquetas Adicionadas */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Fila de Impressão ({items.length} produto(s) • {totalEtiquetasParaImprimir} etiquetas)
                </h3>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-red-400 hover:underline text-[10px] font-semibold cursor-pointer"
                >
                  Limpar Fila
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-[var(--muted)] space-y-2">
                <p>Nenhum produto na fila de impressão.</p>
                <button
                  type="button"
                  onClick={() => setItems(SEED_PRODUCT_LABELS)}
                  className="inline-flex items-center gap-1 text-[var(--collab-mostarda)] font-semibold text-xs hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Carregar produtos de demonstração</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((it, idx) => {
                  const isSelected = idx === selectedPreviewIndex;
                  return (
                    <div
                      key={it.id}
                      onClick={() => setSelectedPreviewIndex(idx)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] shadow-sm"
                          : "bg-[var(--background)] border-[var(--card-border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <div className="min-w-0">
                        <strong className="block text-xs text-[var(--foreground)] truncate">
                          {it.descricao}
                        </strong>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted)] mt-0.5">
                          <span>EAN: {it.codigoEan}</span>
                          {it.codigoProduto && <span>• SKU: {it.codigoProduto}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] font-mono text-xs font-bold text-[var(--foreground)]">
                          {it.quantidade} un
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(it.id);
                          }}
                          className="p-1 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                          title="Remover produto da fila"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Prévia da Etiqueta Térmica em Tempo Real */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Prévia da Etiqueta Térmica ({larguraMm} × {alturaMm} mm)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]">
                Proporção {(larguraMm / alturaMm).toFixed(2)}:1
              </span>
            </div>

            {/* Informações da especificação técnica */}
            <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[11px] text-[var(--muted)] space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--foreground)] font-semibold">
                <Info size={13} className="text-[var(--collab-mostarda)]" />
                <span>Padrão Impressão Térmica Direta (Zebra, Elgin, Argox):</span>
              </div>
              <p>• Impressão 100% monocromática (preto e branco).</p>
              <p>• Sem preço, sem logotipo e sem bordas decorativas.</p>
              <p>• Código EAN-13 maximizado para leitura instantânea por leitores ópticos.</p>
            </div>

            {/* ── VISUALIZADOR DA ETIQUETA TÉRMICA ── */}
            <div className="p-6 bg-[#18181b] rounded-2xl border border-[var(--card-border)] flex items-center justify-center overflow-auto min-h-[300px]">
              {/* O Container simula o rolo/etiqueta térmica física em proporção exata */}
              <div
                style={{
                  width: `${Math.min(480, larguraMm * 9)}px`,
                  aspectRatio: `${larguraMm} / ${alturaMm}`,
                  backgroundColor: "#FFFFFF",
                  color: "#000000",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "3.5% 3%",
                  boxSizing: "border-box",
                  borderRadius: "2px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {/* 1. Descrição do Produto na parte superior centralizada */}
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: `${Math.max(10, Math.min(15, Math.round(alturaMm * 0.38)))}px`,
                    lineHeight: 1.15,
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    color: "#000000",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {currentPreviewItem.descricao || "DESCRIÇÃO DO PRODUTO"}
                </div>

                {/* 2. Código de Barras EAN-13 centralizado (Maximizando a área útil) */}
                <div
                  style={{
                    width: "100%",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 0",
                    overflow: "hidden",
                  }}
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />

                {/* 3. Número do código EAN exibido abaixo do código de barras */}
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    fontSize: `${Math.max(10, Math.min(16, Math.round(alturaMm * 0.42)))}px`,
                    lineHeight: 1,
                    letterSpacing: formatoEanEspacado ? "1.5px" : "1px",
                    color: "#000000",
                  }}
                >
                  {formatoEanEspacado
                    ? formatEan13(currentPreviewItem.codigoEan)
                    : currentPreviewItem.codigoEan}
                  {mostrarCodigoProduto && currentPreviewItem.codigoProduto && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "0.85em",
                        fontWeight: 600,
                        color: "#333333",
                      }}
                    >
                      [{currentPreviewItem.codigoProduto}]
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ações de Impressão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="py-3 px-4 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={16} />
                <span>Baixar PDF Térmico</span>
              </button>

              <button
                type="button"
                onClick={handlePrintBrowser}
                className="py-3 px-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>Imprimir na Térmica</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
