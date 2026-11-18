"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ProductLabelItem,
  ProductLabelConfig,
  PRESETS_PRODUTO,
  ProductLabelPreset,
} from "@/lib/productLabelTypes";
import { Produto, ProdutoImportPreview } from "@/lib/productTypes";
import {
  calcEan13CheckDigit,
  validateAndNormalizeEan13,
  generateEan13Svg,
  formatEan13,
} from "@/lib/ean13";
import { downloadProductLabelsPdf } from "@/lib/productPdfGenerator";
import {
  downloadProductExcelTemplate,
  parseProductsExcel,
  fetchProductsApi,
  saveProductsBatchApi,
  deleteProductsApi,
} from "@/lib/productService";
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
  FileSpreadsheet,
  Upload,
  Search,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Database,
  FileUp,
  X,
  Calendar,
} from "lucide-react";

type ActiveTab = "catalogo" | "importar" | "impressao";

export function ProductBarcodeView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalogo");

  // Configuração dimensional da etiqueta
  const [preset, setPreset] = useState<ProductLabelPreset>("40x30");
  const [larguraMm, setLarguraMm] = useState<number>(40);
  const [alturaMm, setAlturaMm] = useState<number>(30);
  const [mostrarCodigoProduto, setMostrarCodigoProduto] = useState(true);
  const [formatoEanEspacado, setFormatoEanEspacado] = useState(false);
  const [descFontPt, setDescFontPt] = useState<number>(0);

  // Catálogo de produtos no banco de dados
  const [dbProducts, setDbProducts] = useState<Produto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkQuantity, setBulkQuantity] = useState<number>(1);

  // Fila de produtos para impressão
  const [items, setItems] = useState<ProductLabelItem[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  // Estado de Importação Excel
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<ProdutoImportPreview[]>([]);
  const [excelStats, setExcelStats] = useState<{
    validCount: number;
    warningCount: number;
    errorCount: number;
    total: number;
  } | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal / Formulário de Cadastro Manual de Produto
  const [showManualModal, setShowManualModal] = useState(false);
  const [formDescricao, setFormDescricao] = useState("");
  const [formEan, setFormEan] = useState("");
  const [formCodigoProduto, setFormCodigoProduto] = useState("");
  const [formQuantidade, setFormQuantidade] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Notificações
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Carregar produtos do banco na inicialização
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await fetchProductsApi();
      setDbProducts(data);
      // Se a fila de impressão estiver vazia e houver produtos, carrega os 4 primeiros como sugestão
      if (items.length === 0 && data.length > 0) {
        const initialQueue: ProductLabelItem[] = data.slice(0, 4).map((p) => ({
          id: p.id,
          descricao: p.descricao,
          codigoEan: p.ean,
          codigoProduto: p.cod_produto,
          quantidade: 5,
          createdAt: p.created_at || new Date().toISOString(),
        }));
        setItems(initialQueue);
      }
    } catch (err: any) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Troca de preset dimensional
  const handleSelectPreset = (p: ProductLabelPreset) => {
    setPreset(p);
    const def = PRESETS_PRODUTO[p];
    if (def) {
      setLarguraMm(def.larguraMm);
      setAlturaMm(def.alturaMm);
    }
  };

  // Produtos filtrados pela busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return dbProducts;
    const term = searchTerm.trim().toLowerCase();
    return dbProducts.filter(
      (p) =>
        p.descricao.toLowerCase().includes(term) ||
        p.cod_produto.toLowerCase().includes(term) ||
        p.ean.includes(term)
    );
  }, [dbProducts, searchTerm]);

  // Selecionar ou deselecionar todos os produtos filtrados
  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      const next = new Set<string>();
      filteredProducts.forEach((p) => next.add(p.id));
      setSelectedProductIds(next);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  // Enviar itens selecionados para a Fila de Impressão
  const handleSendSelectedToQueue = () => {
    const selected = dbProducts.filter((p) => selectedProductIds.has(p.id));
    if (selected.length === 0) return;

    const newQueueItems: ProductLabelItem[] = selected.map((p) => ({
      id: `print-${p.id}-${Date.now()}`,
      descricao: p.descricao,
      codigoEan: p.ean,
      codigoProduto: p.cod_produto,
      quantidade: Math.max(1, bulkQuantity),
      createdAt: new Date().toISOString(),
    }));

    setItems((prev) => [...newQueueItems, ...prev]);
    setSelectedProductIds(new Set());
    setActiveTab("impressao");
    setToastMsg({
      text: `${selected.length} produto(s) adicionado(s) à fila de impressão (${bulkQuantity} etiquetas cada)!`,
      type: "success",
    });
  };

  // Gerar PDF direto dos itens selecionados
  const handlePrintSelectedDirectly = () => {
    const selected = dbProducts.filter((p) => selectedProductIds.has(p.id));
    if (selected.length === 0) return;

    const printItems: ProductLabelItem[] = selected.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      codigoEan: p.ean,
      codigoProduto: p.cod_produto,
      quantidade: Math.max(1, bulkQuantity),
      createdAt: new Date().toISOString(),
    }));

    downloadProductLabelsPdf(printItems, currentConfig);
    setToastMsg({
      text: `PDF térmico gerado para ${selected.length} produto(s) selecionado(s)!`,
      type: "success",
    });
  };

  // Excluir produtos selecionados do banco de dados
  const handleDeleteSelected = async () => {
    const count = selectedProductIds.size;
    if (count === 0) return;

    if (!confirm(`Tem certeza que deseja excluir ${count} produto(s) do banco de dados?`)) {
      return;
    }

    try {
      const ids = Array.from(selectedProductIds);
      await deleteProductsApi(ids);
      setDbProducts((prev) => prev.filter((p) => !selectedProductIds.has(p.id)));
      setSelectedProductIds(new Set());
      setToastMsg({
        text: `${count} produto(s) excluído(s) do banco de dados com sucesso!`,
        type: "success",
      });
    } catch (err: any) {
      setToastMsg({
        text: err.message || "Erro ao excluir produtos do banco.",
        type: "error",
      });
    }
  };

  // Processar arquivo Excel carregado
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setIsParsingExcel(true);
    try {
      const result = await parseProductsExcel(file);
      setExcelPreview(result.items);
      setExcelStats({
        validCount: result.validCount,
        warningCount: result.warningCount,
        errorCount: result.errorCount,
        total: result.total,
      });
      setToastMsg({
        text: `Arquivo "${file.name}" lido: ${result.total} produto(s) detectado(s)!`,
        type: "success",
      });
    } catch (err: any) {
      setToastMsg({
        text: err.message || "Erro ao ler a planilha Excel.",
        type: "error",
      });
      setExcelPreview([]);
      setExcelStats(null);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Salvar registros do Excel no Banco de Dados
  const handleSaveExcelToDb = async (andQueueForPrint = false) => {
    if (excelPreview.length === 0) return;

    setIsSavingBatch(true);
    try {
      const validItems = excelPreview.filter((p) => p.status !== "error");
      if (validItems.length === 0) {
        throw new Error("Não há produtos válidos para salvar.");
      }

      const res = await saveProductsBatchApi(
        validItems.map((p) => ({
          cod_produto: p.cod_produto,
          descricao: p.descricao,
          ean: p.ean,
        }))
      );

      // Recarrega o catálogo
      await loadProducts();

      // Se solicitado, adiciona à fila de impressão
      if (andQueueForPrint) {
        const queue: ProductLabelItem[] = validItems.map((p) => ({
          id: `excel-${Date.now()}-${p.cod_produto}`,
          descricao: p.descricao,
          codigoEan: p.ean,
          codigoProduto: p.cod_produto,
          quantidade: Math.max(1, bulkQuantity),
          createdAt: new Date().toISOString(),
        }));
        setItems((prev) => [...queue, ...prev]);
        setActiveTab("impressao");
      } else {
        setActiveTab("catalogo");
      }

      setExcelFile(null);
      setExcelPreview([]);
      setExcelStats(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setToastMsg({
        text: `${res.count} produtos gravados com sucesso no banco de dados!`,
        type: "success",
      });
    } catch (err: any) {
      setToastMsg({
        text: err.message || "Erro ao salvar produtos no banco de dados.",
        type: "error",
      });
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Salvar Produto Manual no Banco
  const handleSaveManualProduct = async (e: React.FormEvent) => {
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

    try {
      await saveProductsBatchApi([
        {
          cod_produto: formCodigoProduto.trim() || `PRD-${Date.now().toString().slice(-4)}`,
          descricao: descClean,
          ean: norm.code13,
        },
      ]);

      await loadProducts();

      // Adiciona à fila de impressão também
      const newItem: ProductLabelItem = {
        id: `prd-${Date.now()}`,
        descricao: descClean,
        codigoEan: norm.code13,
        codigoProduto: formCodigoProduto.trim() || undefined,
        quantidade: Math.max(1, Number(formQuantidade) || 1),
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);

      setShowManualModal(false);
      setFormDescricao("");
      setFormEan("");
      setFormCodigoProduto("");
      setFormQuantidade(1);

      setToastMsg({
        text: `Produto "${descClean}" gravado no banco e adicionado à fila!`,
        type: "success",
      });
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar no banco de dados.");
    }
  };

  // Produto selecionado para o preview térmico
  const currentPreviewItem: ProductLabelItem = useMemo(() => {
    if (items.length > 0 && items[selectedPreviewIndex]) {
      return items[selectedPreviewIndex]!;
    }
    return {
      id: "preview-temp",
      descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
      codigoEan: "7891000315507",
      codigoProduto: "PRD-1001",
      quantidade: 1,
      createdAt: new Date().toISOString(),
    };
  }, [items, selectedPreviewIndex]);

  // Geração do SVG do código EAN-13 para o preview
  const previewSvg = useMemo(() => {
    const code = currentPreviewItem.codigoEan || "7891000315507";
    const svgW = Math.round(larguraMm * 7);
    const svgH = Math.round(alturaMm * 4);
    return generateEan13Svg(code, svgW, svgH, 6);
  }, [currentPreviewItem.codigoEan, larguraMm, alturaMm]);

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

      {/* Header do Módulo com Sub-Abas */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center shrink-0">
              <Barcode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-[var(--foreground)]">
                  4. Impressão de Códigos de Barras de Produtos
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
                  EAN-13 Térmico • Nuvem
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Importação em massa via Excel, gravação em banco de dados Supabase e emissão térmica de alta legibilidade para leitores ópticos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadProductExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold cursor-pointer transition-all"
              title="Baixar modelo com as colunas cod_produto, descricao e ean"
            >
              <FileSpreadsheet size={15} />
              <span>Modelo Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer transition-all"
            >
              <Plus size={15} />
              <span>Cadastrar Manual</span>
            </button>
          </div>
        </div>

        {/* Navegação entre as Sub-Abas */}
        <div className="flex items-center gap-2 border-t border-[var(--card-border)] pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("catalogo")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "catalogo"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <Database size={15} />
            <span>1. Catálogo & Consulta</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-black/10 dark:bg-white/10">
              {dbProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("importar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "importar"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <FileUp size={15} />
            <span>2. Importar Planilha Excel</span>
            {excelPreview.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-600">
                {excelPreview.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("impressao")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "impressao"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <Printer size={15} />
            <span>3. Fila de Impressão & Prévia Térmica</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-black/10 dark:bg-white/10">
              {items.length} ({totalEtiquetasParaImprimir} etiq.)
            </span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ABA 1: CATÁLOGO & CONSULTA COM FILTROS E SELEÇÃO PARA IMPRESSÃO  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "catalogo" && (
        <div className="space-y-4">
          {/* Barra de Filtros e Ações Rápidas */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por Descrição, Código do Produto (cod_produto) ou EAN..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadProducts}
                disabled={isLoadingProducts}
                className="p-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all cursor-pointer"
                title="Atualizar lista do banco"
              >
                <RefreshCw size={15} className={isLoadingProducts ? "animate-spin" : ""} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("importar")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload Excel</span>
              </button>
            </div>
          </div>

          {/* Barra de Ações em Lote para Itens Selecionados */}
          {selectedProductIds.size > 0 && (
            <div className="p-4 rounded-2xl bg-[var(--collab-mostarda)]/10 border border-[var(--collab-mostarda)] flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  {selectedProductIds.size} produto(s) selecionado(s)
                </span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[var(--muted)]">Qtd de etiquetas por item:</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendSelectedToQueue}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Layers size={14} />
                  <span>Adicionar à Fila ({selectedProductIds.size * bulkQuantity} etiq.)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSelectedDirectly}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-bold cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Imprimir Agora</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Produtos */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] border-b border-[var(--card-border)] text-[var(--muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        {selectedProductIds.size > 0 &&
                        selectedProductIds.size === filteredProducts.length ? (
                          <CheckSquare size={16} className="text-[var(--collab-mostarda)]" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Código (cod_produto)</th>
                    <th className="py-3 px-4">Descrição do Produto</th>
                    <th className="py-3 px-4">Código EAN-13</th>
                    <th className="py-3 px-4">Data Cadastro</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                        {isLoadingProducts ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw size={16} className="animate-spin text-[var(--collab-mostarda)]" />
                            <span>Carregando produtos do banco de dados...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p>Nenhum produto encontrado com os filtros atuais.</p>
                            <button
                              type="button"
                              onClick={() => setActiveTab("importar")}
                              className="inline-flex items-center gap-1.5 text-[var(--collab-mostarda)] font-bold hover:underline cursor-pointer"
                            >
                              <FileUp size={14} />
                              <span>Fazer upload de arquivo Excel agora</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductIds.has(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-[var(--secondary)]/50 transition-colors ${
                            isSelected ? "bg-[var(--collab-mostarda)]/5" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(p.id)}
                              className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-[var(--collab-mostarda)]" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]">
                              {p.cod_produto}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--foreground)] max-w-md truncate">
                            {p.descricao}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Barcode size={16} className="text-[var(--collab-mostarda)]" />
                              <span className="font-mono font-bold text-xs tracking-wider">
                                {formatEan13(p.ean)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)] font-mono text-[11px]">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const singleQueueItem: ProductLabelItem = {
                                    id: `print-${p.id}-${Date.now()}`,
                                    descricao: p.descricao,
                                    codigoEan: p.ean,
                                    codigoProduto: p.cod_produto,
                                    quantidade: 1,
                                    createdAt: new Date().toISOString(),
                                  };
                                  setItems((prev) => [singleQueueItem, ...prev]);
                                  setActiveTab("impressao");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-[11px] shadow-sm cursor-pointer"
                                title="Enviar para Fila de Impressão"
                              >
                                Imprimir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[var(--background)] border-t border-[var(--card-border)] flex items-center justify-between text-xs text-[var(--muted)]">
              <span>
                Exibindo <strong>{filteredProducts.length}</strong> de{" "}
                <strong>{dbProducts.length}</strong> produtos cadastrados no banco.
              </span>
              <span>
                {selectedProductIds.size} selecionado(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ABA 2: IMPORTAÇÃO EM MASSA VIA EXCEL E GRAVAÇÃO NO BANCO          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "importar" && (
        <div className="space-y-6">
          {/* Card com Passo a Passo */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
              <div>
                <h2 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-500" size={20} />
                  <span>Importação de Planilha Excel (.xlsx / .xls)</span>
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Faça o upload do arquivo com os produtos para cadastrar automaticamente no banco de dados e imprimir em massa.
                </p>
              </div>

              {/* Botão de Download do Modelo */}
              <button
                type="button"
                onClick={downloadProductExcelTemplate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all shrink-0"
              >
                <Download size={16} />
                <span>1. Baixar Modelo Excel Oficial</span>
              </button>
            </div>

            {/* Dica das Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1">
                <span className="font-mono font-bold text-xs text-[var(--collab-mostarda)]">
                  cod_produto
                </span>
                <p className="text-[11px] text-[var(--muted)]">
                  Código interno ou SKU do produto (ex: PRD-1001, 40029).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1">
                <span className="font-mono font-bold text-xs text-blue-400">
                  descricao
                </span>
                <p className="text-[11px] text-[var(--muted)]">
                  Descrição completa em destaque na etiqueta (ex: SABÃO EM PÓ 1KG).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1">
                <span className="font-mono font-bold text-xs text-emerald-400">
                  ean
                </span>
                <p className="text-[11px] text-[var(--muted)]">
                  Código de barras EAN-13 com 12 ou 13 dígitos numéricos.
                </p>
              </div>
            </div>

            {/* Área de Drag & Drop / Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--card-border)] hover:border-[var(--collab-mostarda)] bg-[var(--background)] rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-[var(--collab-mostarda)]/10 text-[var(--collab-mostarda)] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {excelFile ? excelFile.name : "Clique para selecionar ou arraste o arquivo Excel aqui"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou CSV
                </p>
              </div>
            </div>
          </div>

          {/* Prévia dos Dados Extraídos da Planilha */}
          {excelPreview.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Prévia da Planilha ({excelPreview.length} produtos encontrados)
                  </h3>
                  {excelStats && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {excelStats.validCount} Válidos
                      </span>
                      {excelStats.warningCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {excelStats.warningCount} Avisos
                        </span>
                      )}
                      {excelStats.errorCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                          {excelStats.errorCount} Erros
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingBatch}
                    onClick={() => handleSaveExcelToDb(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Database size={15} />
                    <span>{isSavingBatch ? "Gravando..." : "Gravar no Banco de Dados"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSavingBatch}
                    onClick={() => handleSaveExcelToDb(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-sm cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Printer size={15} />
                    <span>Gravar e Ir para Impressão</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Preview */}
              <div className="overflow-x-auto max-h-96 border border-[var(--card-border)] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--background)] sticky top-0 border-b border-[var(--card-border)] text-[var(--muted)] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descrição</th>
                      <th className="py-2.5 px-3">EAN-13</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {excelPreview.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--secondary)]/40">
                        <td className="py-2.5 px-3 text-[var(--muted)] font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{row.cod_produto}</td>
                        <td className="py-2.5 px-3 font-semibold text-[var(--foreground)]">{row.descricao}</td>
                        <td className="py-2.5 px-3 font-mono font-bold tracking-wider">{row.ean}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                              row.status === "valid"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : row.status === "warning"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {row.statusMessage || row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {excelPreview.length > 100 && (
                <p className="text-[11px] text-[var(--muted)] text-center">
                  Exibindo as primeiras 100 linhas de {excelPreview.length} produtos.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ABA 3: FILA DE IMPRESSÃO & PRÉVIA TÉRMICA EM TEMPO REAL           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "impressao" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Dimensões e Fila de Itens */}
          <div className="lg:col-span-6 space-y-4">
            {/* Seletor Dimensional */}
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

              {/* Inputs Editáveis */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--foreground)] block">
                    Largura (mm):
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={larguraMm}
                    onChange={(e) => {
                      setLarguraMm(Number(e.target.value));
                      setPreset("custom");
                    }}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--foreground)] block">
                    Altura (mm):
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={150}
                    value={alturaMm}
                    onChange={(e) => {
                      setAlturaMm(Number(e.target.value));
                      setPreset("custom");
                    }}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono font-bold"
                  />
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
                  <span>Espaçar número EAN</span>
                </label>
              </div>
            </div>

            {/* Fila de Itens para Impressão */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-[var(--collab-mostarda)]" />
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Itens na Fila ({items.length} itens • {totalEtiquetasParaImprimir} etiquetas)
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
                  <p>A fila de impressão está vazia.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("catalogo")}
                    className="inline-flex items-center gap-1 text-[var(--collab-mostarda)] font-semibold text-xs hover:underline cursor-pointer"
                  >
                    <span>Selecionar produtos do catálogo</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
                          <div className="flex items-center gap-1 bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItems((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, quantidade: Math.max(1, x.quantidade - 1) } : x
                                  )
                                );
                              }}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-[var(--secondary)] rounded cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-xs">
                              {it.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItems((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, quantidade: x.quantidade + 1 } : x
                                  )
                                );
                              }}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-[var(--secondary)] rounded cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItems((prev) => prev.filter((_, i) => i !== idx));
                              if (selectedPreviewIndex >= items.length - 1) {
                                setSelectedPreviewIndex(Math.max(0, items.length - 2));
                              }
                            }}
                            className="p-1 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Remover da fila"
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

          {/* Coluna Direita: Prévia Visual e Botões de Impressão */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-[var(--collab-mostarda)]" />
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Prévia da Etiqueta ({larguraMm} × {alturaMm} mm)
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]">
                  Proporção {(larguraMm / alturaMm).toFixed(2)}:1
                </span>
              </div>

              {/* Box de Visualização da Etiqueta Térmica */}
              <div className="p-6 bg-[#18181b] rounded-2xl border border-[var(--card-border)] flex items-center justify-center overflow-auto min-h-[300px]">
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
                  {/* Descrição Superior Centralizada */}
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

                  {/* Código de Barras EAN-13 SVG */}
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

                  {/* Número EAN + SKU opcional */}
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

              {/* Botões de Ação de Impressão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="py-3 px-4 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>Baixar PDF Térmico ({totalEtiquetasParaImprimir} etiq.)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  <span>Imprimir na Térmica</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: CADASTRO MANUAL DE NOVO PRODUTO NO BANCO                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Novo Produto para Catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveManualProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">
                  Descrição do Produto * :
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--foreground)] block">
                    Código de Barras EAN-13 * :
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      let digits12 = "789";
                      for (let i = 0; i < 9; i++) {
                        digits12 += Math.floor(Math.random() * 10).toString();
                      }
                      const check = calcEan13CheckDigit(digits12);
                      setFormEan(`${digits12}${check}`);
                    }}
                    className="text-[var(--collab-mostarda)] hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold text-[10px]"
                  >
                    <Sparkles size={11} />
                    <span>Gerar Aleatório Válido</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={13}
                  value={formEan}
                  onChange={(e) => setFormEan(e.target.value.replace(/\D/g, ""))}
                  placeholder="7891000315507"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-mono font-bold tracking-wider focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--foreground)] block">
                    Código Interno / SKU (cod_produto):
                  </label>
                  <input
                    type="text"
                    value={formCodigoProduto}
                    onChange={(e) => setFormCodigoProduto(e.target.value.toUpperCase())}
                    placeholder="PRD-1007"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[var(--foreground)] block">
                    Qtd Inicial Etiquetas:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantidade}
                    onChange={(e) => setFormQuantidade(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--secondary)] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold shadow-sm cursor-pointer"
                >
                  Gravar no Banco & Fila
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
