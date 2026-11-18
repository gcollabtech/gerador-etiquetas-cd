import * as XLSX from "xlsx";
import { Produto, ProdutoImportPreview, ProdutoFiltros } from "./productTypes";
import { validateAndNormalizeEan13, calcEan13CheckDigit } from "./ean13";

/**
 * Gera e dispara o download do modelo oficial de planilha Excel (.xlsx)
 * com as colunas necessárias para cadastro em massa.
 */
export function downloadProductExcelTemplate(): void {
  const headers = ["cod_produto", "descricao", "ean"];
  const sampleData = [
    {
      cod_produto: "PRD-1001",
      descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
      ean: "7891000315507",
    },
    {
      cod_produto: "PRD-1002",
      descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
      ean: "7891234567895",
    },
    {
      cod_produto: "PRD-1003",
      descricao: "ÁGUA SANITÁRIA CLORADA 2L",
      ean: "7898912345678",
    },
    {
      cod_produto: "PRD-1004",
      descricao: "DESINFETANTE FLORAL 1L",
      ean: "7896000123456",
    },
    {
      cod_produto: "PRD-1005",
      descricao: "PAPEL SULFITE A4 75G PCT 500 FLS",
      ean: "7891027116521",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Ajuste de largura das colunas para visualização agradável
  ws["!cols"] = [
    { wch: 18 }, // cod_produto
    { wch: 45 }, // descricao
    { wch: 20 }, // ean
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");

  // Escrever e baixar no navegador
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo_importacao_produtos.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ParseExcelResult {
  items: ProdutoImportPreview[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  total: number;
}

/**
 * Lê e interpreta arquivo Excel (.xlsx, .xls) ou CSV carregado pelo usuário.
 * Mapeia cabeçalhos flexíveis e valida códigos EAN-13.
 */
export async function parseProductsExcel(file: File): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("A planilha enviada não contém nenhuma aba válida.");
  }

  const ws = wb.Sheets[firstSheetName];
  if (!ws) {
    throw new Error("Aba de dados vazia.");
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("Nenhuma linha de produto foi encontrada na planilha.");
  }

  const items: ProdutoImportPreview[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];

    // Localizar campos com flexibilidade de nomes
    let cod_produto = "";
    let descricao = "";
    let ean = "";

    for (const [key, val] of Object.entries(row)) {
      const k = key.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const strVal = String(val ?? "").trim();

      if (
        k === "cod_produto" ||
        k === "codigo_produto" ||
        k === "codigo" ||
        k === "cod" ||
        k === "sku" ||
        k === "id"
      ) {
        if (!cod_produto) cod_produto = strVal;
      } else if (
        k === "descricao" ||
        k === "produto" ||
        k === "nome" ||
        k === "description" ||
        k === "desc"
      ) {
        if (!descricao) descricao = strVal;
      } else if (
        k === "ean" ||
        k === "gtin" ||
        k === "codigo_barras" ||
        k === "codigo_de_barras" ||
        k === "barcode" ||
        k === "barras"
      ) {
        if (!ean) ean = strVal;
      }
    }

    // Se a linha estiver totalmente em branco, ignorar
    if (!cod_produto && !descricao && !ean) continue;

    // Se não tiver código de produto, gerar um padrão
    if (!cod_produto) {
      cod_produto = `PRD-${String(idx + 1).padStart(4, "0")}`;
    }

    // Validação de EAN
    const digitsOnly = ean.replace(/\D/g, "");
    let status: "valid" | "warning" | "error" = "valid";
    let statusMessage = "Pronto para gravação";
    let normalizedEan = digitsOnly;

    if (!descricao) {
      status = "error";
      statusMessage = "Descrição ausente";
      errorCount++;
    } else if (!digitsOnly) {
      status = "error";
      statusMessage = "Código EAN ausente";
      errorCount++;
    } else if (digitsOnly.length === 12) {
      // 12 dígitos -> calcular 13º dígito
      const check = calcEan13CheckDigit(digitsOnly);
      normalizedEan = `${digitsOnly}${check}`;
      status = "warning";
      statusMessage = `Dígito verificador ${check} calculado`;
      warningCount++;
    } else if (digitsOnly.length === 13) {
      const check = calcEan13CheckDigit(digitsOnly.slice(0, 12));
      if (check !== parseInt(digitsOnly[12] || "0", 10)) {
        status = "warning";
        normalizedEan = `${digitsOnly.slice(0, 12)}${check}`;
        statusMessage = `Dígito corrigido para ${check}`;
        warningCount++;
      } else {
        status = "valid";
        validCount++;
      }
    } else {
      // Outro tamanho de código de barras
      status = "warning";
      statusMessage = `Código com ${digitsOnly.length} dígitos (Code 128)`;
      warningCount++;
    }

    items.push({
      cod_produto,
      descricao: descricao.toUpperCase(),
      ean: normalizedEan,
      status,
      statusMessage,
    });
  }

  return {
    items,
    validCount,
    warningCount,
    errorCount,
    total: items.length,
  };
}

/**
 * Consulta lista de produtos no servidor / Supabase.
 */
export async function fetchProductsApi(search?: string): Promise<Produto[]> {
  const url = search
    ? `/api/produtos?search=${encodeURIComponent(search)}`
    : `/api/produtos`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Erro ao consultar produtos: status ${res.status}`);
  }
  const json = await res.json();
  return json.products || [];
}

/**
 * Salva lote de produtos importados no banco de dados.
 */
export async function saveProductsBatchApi(
  items: { cod_produto: string; descricao: string; ean: string }[]
): Promise<{ count: number; products: Produto[] }> {
  const res = await fetch("/api/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products: items }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao salvar produtos: status ${res.status}`);
  }

  const json = await res.json();
  return {
    count: json.count || items.length,
    products: json.products || [],
  };
}

/**
 * Exclui múltiplos produtos do banco de dados.
 */
export async function deleteProductsApi(ids: string[]): Promise<number> {
  const res = await fetch("/api/produtos", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    throw new Error(`Erro ao excluir produtos: status ${res.status}`);
  }

  const json = await res.json();
  return json.deleted || ids.length;
}
