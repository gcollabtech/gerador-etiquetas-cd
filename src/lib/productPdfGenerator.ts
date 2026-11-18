import { ProductLabelItem, ProductLabelConfig } from "./productLabelTypes";
import { getEan13Rectangles } from "./ean13";
import { getCode128Rectangles } from "./code128";

export const MM_TO_PT = 72 / 25.4;

export function buildProductLabelsPdf(
  items: ProductLabelItem[],
  config: ProductLabelConfig
): Uint8Array {
  const widthMm = Number(config.larguraMm) > 0 ? Number(config.larguraMm) : 40;
  const heightMm = Number(config.alturaMm) > 0 ? Number(config.alturaMm) : 30;

  const pageW = widthMm * MM_TO_PT;
  const pageH = heightMm * MM_TO_PT;

  type Chunk = string | Uint8Array;
  const chunks: Chunk[] = [];
  let byteOffset = 0;

  function writeStr(s: string) {
    chunks.push(s);
    byteOffset += Buffer.byteLength(s, "binary");
  }

  // PDF Header (PDF-1.4)
  writeStr("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  const objOffsets: number[] = [];
  let nextObjNum = 1;

  function beginObj(): number {
    const num = nextObjNum++;
    objOffsets[num] = byteOffset;
    writeStr(`${num} 0 obj\n`);
    return num;
  }

  function endObj() {
    writeStr("endobj\n");
  }

  // Flatten items by their requested quantities (ex: item A x 10, item B x 5)
  const expandedItems: ProductLabelItem[] = [];
  for (const it of items) {
    const qty = Math.max(1, it.quantidade || 1);
    for (let i = 0; i < qty; i++) {
      expandedItems.push(it);
    }
  }

  if (expandedItems.length === 0 && items.length > 0) {
    expandedItems.push(...items);
  }

  // Pre-allocate object numbers
  const catalogObjNum = 1;
  const pagesObjNum = 2;
  const fontHelveticaBoldObjNum = 3;
  const fontCourierBoldObjNum = 4;
  nextObjNum = 5;

  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];

  for (let i = 0; i < expandedItems.length; i++) {
    pageObjNums.push(nextObjNum++);
    contentObjNums.push(nextObjNum++);
  }

  // ── Pages Catalog ───────────────────────────────────────────────────
  objOffsets[catalogObjNum] = byteOffset;
  writeStr(`${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`);

  // ── Pages Root ──────────────────────────────────────────────────────
  objOffsets[pagesObjNum] = byteOffset;
  const kidsStr = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  writeStr(
    `${pagesObjNum} 0 obj\n` +
      `<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pageObjNums.length} >>\n` +
      `endobj\n`
  );

  // ── Fonts ───────────────────────────────────────────────────────────
  objOffsets[fontHelveticaBoldObjNum] = byteOffset;
  writeStr(
    `${fontHelveticaBoldObjNum} 0 obj\n` +
      `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\n` +
      `endobj\n`
  );

  objOffsets[fontCourierBoldObjNum] = byteOffset;
  writeStr(
    `${fontCourierBoldObjNum} 0 obj\n` +
      `<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>\n` +
      `endobj\n`
  );

  // ── Render each label page ──────────────────────────────────────────
  for (let i = 0; i < expandedItems.length; i++) {
    const item = expandedItems[i]!;
    const pObjNum = pageObjNums[i]!;
    const cObjNum = contentObjNums[i]!;

    objOffsets[pObjNum] = byteOffset;
    writeStr(
      `${pObjNum} 0 obj\n` +
        `<< /Type /Page /Parent ${pagesObjNum} 0 R\n` +
        `   /MediaBox [ 0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)} ]\n` +
        `   /Contents ${cObjNum} 0 R\n` +
        `   /Resources << /Font << /F1 ${fontHelveticaBoldObjNum} 0 R /F2 ${fontCourierBoldObjNum} 0 R >> >>\n` +
        `>>\n` +
        `endobj\n`
    );

    // Stream generation for the thermal label content
    const sc: string[] = [];
    sc.push("q");
    sc.push("0 0 0 rg");

    // Margens internas da etiqueta térmica (2mm a 2.5mm)
    const marginX = Math.max(4, pageW * 0.05);
    const marginY = Math.max(4, pageH * 0.06);
    const usableW = pageW - marginX * 2;
    const usableH = pageH - marginY * 2;

    // 1. Descrição do Produto na parte superior centralizada
    // Determina o tamanho da fonte da descrição para caber perfeitamente
    const descText = (item.descricao || "PRODUTO SEM DESCRICAO").toUpperCase().trim();
    const defaultDescFontPt = Math.max(6.5, Math.min(10, Math.round(pageH * 0.11)));
    const descFontPt = config.tamanhoFonteDescricaoPt > 0 ? config.tamanhoFonteDescricaoPt : defaultDescFontPt;
    const descLineHeight = descFontPt * 1.15;
    const descY = pageH - marginY - descFontPt;

    // Aproximação da largura do texto para centralização
    const approxDescW = descText.length * descFontPt * 0.52;
    const descX = Math.max(marginX, (pageW - approxDescW) / 2);

    sc.push("BT");
    sc.push(`/F1 ${descFontPt} Tf`);
    sc.push(`${descX.toFixed(2)} ${descY.toFixed(2)} Td`);
    sc.push(`(${escapePdfString(descText)}) Tj`);
    sc.push("ET");

    // 2. Número do Código de Barras e Código do Produto abaixo das barras
    const codeFontPt = Math.max(7, Math.min(11, Math.round(pageH * 0.12)));
    const codeY = marginY + 2;

    const rawBarcode = item.barra || item.codigoEan || "";
    const isEan13 = (item.tipoBarra === "ean13" || (!item.tipoBarra && !item.barra && /^\d{12,13}$/.test(rawBarcode)));

    const displayCode = isEan13 && config.formatoEanEspacado
      ? formatEanSpaces(rawBarcode)
      : rawBarcode;

    const bottomText =
      config.mostrarCodigoProduto && item.codigoProduto
        ? `${displayCode}  [${item.codigoProduto}]`
        : displayCode;

    const approxCodeW = bottomText.length * codeFontPt * 0.58;
    const codeX = Math.max(marginX, (pageW - approxCodeW) / 2);

    sc.push("BT");
    sc.push(`/F2 ${codeFontPt} Tf`);
    sc.push(`${codeX.toFixed(2)} ${codeY.toFixed(2)} Td`);
    sc.push(`(${escapePdfString(bottomText)}) Tj`);
    sc.push("ET");

    // 3. Código de Barras (EAN-13 ou Code 128 Alfanumérico) Centralizado
    const barcodeBottomY = codeY + codeFontPt + 3;
    const barcodeTopY = descY - 4;
    const availableBarHeight = Math.max(16, barcodeTopY - barcodeBottomY);

    const barcodeTargetW = Math.min(usableW, pageW * 0.90);
    const barcodeStartX = (pageW - barcodeTargetW) / 2;

    const rects = isEan13
      ? getEan13Rectangles(
          rawBarcode,
          barcodeStartX,
          barcodeBottomY,
          barcodeTargetW,
          availableBarHeight,
          6 // quiet zone modules
        ).rects
      : getCode128Rectangles(
          rawBarcode,
          barcodeStartX,
          barcodeBottomY,
          barcodeTargetW,
          availableBarHeight,
          10
        ).rects;

    for (const r of rects) {
      sc.push(
        `${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.width.toFixed(2)} ${r.height.toFixed(2)} re f`
      );
    }

    sc.push("Q");

    const streamContent = sc.join("\n") + "\n";
    const streamLen = Buffer.byteLength(streamContent, "binary");

    objOffsets[cObjNum] = byteOffset;
    writeStr(
      `${cObjNum} 0 obj\n` +
        `<< /Length ${streamLen} >>\n` +
        `stream\n` +
        streamContent +
        `endstream\n` +
        `endobj\n`
    );
  }

  // ── XRef Table ──────────────────────────────────────────────────────
  const startXRef = byteOffset;
  writeStr(`xref\n0 ${nextObjNum}\n`);
  writeStr("0000000000 65535 f \n");
  for (let i = 1; i < nextObjNum; i++) {
    const off = objOffsets[i] || 0;
    writeStr(off.toString().padStart(10, "0") + " 00000 n \n");
  }

  // ── Trailer ─────────────────────────────────────────────────────────
  writeStr(
    `trailer\n` +
      `<< /Size ${nextObjNum} /Root ${catalogObjNum} 0 R >>\n` +
      `startxref\n` +
      `${startXRef}\n` +
      `%%EOF\n`
  );

  // Combine into single Uint8Array
  let totalLen = 0;
  for (const ch of chunks) {
    totalLen += typeof ch === "string" ? Buffer.byteLength(ch, "binary") : ch.byteLength;
  }

  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const ch of chunks) {
    if (typeof ch === "string") {
      const buf = Buffer.from(ch, "binary");
      out.set(buf, pos);
      pos += buf.length;
    } else {
      out.set(ch, pos);
      pos += ch.byteLength;
    }
  }

  return out;
}

export function createProductLabelsPdfBlob(
  items: ProductLabelItem[],
  config: ProductLabelConfig
): Blob {
  const bytes = buildProductLabelsPdf(items, config);
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export function downloadProductLabelsPdf(
  items: ProductLabelItem[],
  config: ProductLabelConfig,
  filename?: string
): void {
  const blob = createProductLabelsPdfBlob(items, config);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `etiquetas-produto-ean13-${config.larguraMm}x${config.alturaMm}mm.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatEanSpaces(code: string): string {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 13) return clean;
  return `${clean[0]} ${clean.slice(1, 7)} ${clean.slice(7)}`;
}
