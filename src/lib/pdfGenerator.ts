import { StorageAddress, PrintConfig, PrintLayoutMode, A4GridLayout } from "./types";
import { getCode128Rectangles } from "./code128";
import {
  COLLAB_LOGO_JPEG_BASE64,
  COLLAB_LOGO_WIDTH,
  COLLAB_LOGO_HEIGHT,
} from "./logoBase64";

export const MM_TO_PT = 72 / 25.4;

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_WIDTH_PT = A4_WIDTH_MM * MM_TO_PT;
export const A4_HEIGHT_PT = A4_HEIGHT_MM * MM_TO_PT;

export const LABEL_WIDTH_MM = 100;
export const LABEL_HEIGHT_MM = 50;
export const MARGIN_MM = 10;
export const USEFUL_WIDTH_MM = 80;
export const USEFUL_HEIGHT_MM = 30;

export const LABEL_WIDTH_PT = LABEL_WIDTH_MM * MM_TO_PT;
export const LABEL_HEIGHT_PT = LABEL_HEIGHT_MM * MM_TO_PT;
export const MARGIN_PT = MARGIN_MM * MM_TO_PT;
export const USEFUL_WIDTH_PT = USEFUL_WIDTH_MM * MM_TO_PT;
export const USEFUL_HEIGHT_PT = USEFUL_HEIGHT_MM * MM_TO_PT;

export function calculateA4GridLayout(
  larguraCm: number,
  alturaCm: number,
  totalCount: number,
  gapMm: number = 0
): A4GridLayout {
  const w = larguraCm > 0 ? larguraCm * 10 : 100;
  const h = alturaCm > 0 ? alturaCm * 10 : 50;

  const minMarginX = 4;
  const minMarginY = 4;

  const availW = Math.max(w, A4_WIDTH_MM - minMarginX * 2);
  const availH = Math.max(h, A4_HEIGHT_MM - minMarginY * 2);

  const cols = Math.max(1, Math.floor((availW + gapMm) / (w + gapMm)));
  const rows = Math.max(1, Math.floor((availH + gapMm) / (h + gapMm)));

  const totalGridW = cols * w + (cols - 1) * gapMm;
  const totalGridH = rows * h + (rows - 1) * gapMm;

  const marginLeftMm = Math.max(0, (A4_WIDTH_MM - totalGridW) / 2);
  const marginTopMm = Math.max(0, (A4_HEIGHT_MM - totalGridH) / 2);

  const labelsPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil(Math.max(1, totalCount) / labelsPerPage));

  return {
    cols,
    rows,
    labelsPerPage,
    totalPages,
    marginLeftMm,
    marginTopMm,
    gapMm,
    labelWidthMm: w,
    labelHeightMm: h,
  };
}

function drawSingleLabel(
  sc: string[],
  addr: StorageAddress,
  originX: number,
  originY: number,
  labelWidthPt: number,
  labelHeightPt: number,
  includeLogo: boolean,
  showCutBorders: boolean,
  logoXObjNum: number,
  config: Partial<PrintConfig> = {}
) {
  sc.push("q");
  // Translate coordinate origin to this label's bottom-left position
  sc.push(`1 0 0 1 ${originX.toFixed(2)} ${originY.toFixed(2)} cm`);

  // Orange outer background (#FF6400)
  sc.push("1.0 0.392 0.0 rg");
  sc.push(`0 0 ${labelWidthPt.toFixed(2)} ${labelHeightPt.toFixed(2)} re f`);

  // White inner rectangle (proportional inset)
  const framePt = Math.max(6, Math.min(labelWidthPt, labelHeightPt) * 0.08);
  const innerX = framePt;
  const innerY = framePt;
  const innerW = labelWidthPt - framePt * 2;
  const innerH = labelHeightPt - framePt * 2;
  sc.push("1 1 1 rg");
  sc.push(`${innerX.toFixed(2)} ${innerY.toFixed(2)} ${innerW.toFixed(2)} ${innerH.toFixed(2)} re f`);

  const xU = innerX, yU = innerY, wU = innerW, hU = innerH;

  if (showCutBorders) {
    // Light gray dashed cut line around the label
    sc.push("0.7 0.7 0.7 RG 0.5 w [2 2] 0 d");
    sc.push(`0 0 ${labelWidthPt.toFixed(2)} ${labelHeightPt.toFixed(2)} re S`);
    sc.push("[] 0 d");
  }

  // Left brand column (vertical logo): ~14% width
  const BRAND_COL_W = wU * 0.14;
  const RED_LINE_X = xU + BRAND_COL_W;

  // Right column: Directional arrow (~22% width, enlarged by additional 50% and centered)
  const arrowColW = wU * 0.22;
  const arrowColX = xU + wU - arrowColW;

  let barcodeStartX: number;
  let barcodeWidth: number;

  if (includeLogo) {
    barcodeStartX = RED_LINE_X + 6;
    barcodeWidth = arrowColX - barcodeStartX - 4;

    if (logoXObjNum > 0) {
      // Draw vertical logo centered in left column
      const maxW = BRAND_COL_W - 4;
      const maxH = hU - 8;
      const scale = Math.min(maxW / COLLAB_LOGO_WIDTH, maxH / COLLAB_LOGO_HEIGHT);
      const logoDrawW = COLLAB_LOGO_WIDTH * scale;
      const logoDrawH = COLLAB_LOGO_HEIGHT * scale;
      const logoDrawX = xU + (BRAND_COL_W - logoDrawW) / 2;
      const logoDrawY = yU + (hU - logoDrawH) / 2;

      sc.push("q");
      sc.push(`${logoDrawW.toFixed(2)} 0 0 ${logoDrawH.toFixed(2)} ${logoDrawX.toFixed(2)} ${logoDrawY.toFixed(2)} cm`);
      sc.push(`/Im1 Do`);
      sc.push("Q");
    } else {
      // Fallback vertical text
      sc.push("0 0 0 rg q");
      const colCX = xU + BRAND_COL_W / 2;
      const colCY = yU + hU / 2;
      sc.push(`0 1 -1 0 ${colCX.toFixed(2)} ${colCY.toFixed(2)} cm`);
      sc.push("BT /F3 11 Tf");
      const tw = "Collab".length * 7;
      sc.push(`${(-tw / 2).toFixed(2)} -4 Td (Collab) Tj ET Q`);
    }

    // Red separator line
    sc.push("0.8 0 0 RG 1.5 w");
    sc.push(`${RED_LINE_X.toFixed(2)} ${yU.toFixed(2)} m`);
    sc.push(`${RED_LINE_X.toFixed(2)} ${(yU + hU).toFixed(2)} l S`);
    sc.push("0 0 0 RG");
  } else {
    barcodeStartX = xU + 6;
    barcodeWidth = arrowColX - barcodeStartX - 4;
  }

  // Typography for address text (Ruas, Prédios/Andares, Apartamentos, Níveis)
  const fontFamily = config.fonteFamilia || config.fontFamily || "Helvetica";
  let fontResource = "/F1"; // Helvetica-Bold
  let charWidthFactor = 0.55;

  if (fontFamily === "Courier") {
    fontResource = "/F4"; // Courier-Bold
    charWidthFactor = 0.60;
  } else if (fontFamily === "Times") {
    fontResource = "/F6"; // Times-Bold
    charWidthFactor = 0.52;
  }

  const customFontPt = Number(config.tamanhoFontePt || config.fontSizePt);
  const defaultFontPt = Math.max(9, Math.min(22, Math.round(innerH * 0.14)));
  const fontPt = customFontPt > 0 ? customFontPt : defaultFontPt;

  // Vertical layout: barcode on top, address text below
  const textLineHeight = fontPt * 1.15;
  const textBottomMargin = Math.max(3, innerH * 0.04);
  const textY = yU + textBottomMargin;

  // Barcode height: configurable in mm, respecting available label area
  const maxBarcodeHeight = Math.max(12, hU - textLineHeight - textBottomMargin - 6);
  const defaultBarcodeHeight = Math.max(16, hU - textLineHeight - textBottomMargin - 8);

  const customBarcodeHeightMm = Number(config.alturaCodigoBarrasMm);
  let barcodeHeight = defaultBarcodeHeight;
  if (customBarcodeHeightMm > 0) {
    const requestedPt = customBarcodeHeightMm * MM_TO_PT;
    barcodeHeight = Math.min(requestedPt, maxBarcodeHeight);
  }

  const availableUpperSpace = hU - (textY + textLineHeight);
  const barcodeY = textY + textLineHeight + Math.max(2, (availableUpperSpace - barcodeHeight) / 2);

  const { rects } = getCode128Rectangles(addr.code, barcodeStartX, barcodeY, barcodeWidth, barcodeHeight, 8);
  sc.push("0 0 0 rg");
  for (const r of rects) {
    sc.push(`${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.width.toFixed(2)} ${r.height.toFixed(2)} re f`);
  }

  // Address text centered horizontally below barcode
  const textW = addr.code.length * (fontPt * charWidthFactor);
  const textX = barcodeStartX + (barcodeWidth - textW) / 2;
  sc.push("BT");
  sc.push(`${fontResource} ${fontPt} Tf`);
  sc.push(`${Math.max(barcodeStartX, textX).toFixed(2)} ${textY.toFixed(2)} Td`);
  sc.push(`(${escapePdfString(addr.code)}) Tj`);
  sc.push("ET");

  // Directional arrow: increased by an additional 50% while keeping perfectly centered
  const arrowH = Math.round(Math.min(hU * 0.90, 112));
  const arrowW = Math.round(Math.min(arrowColW * 0.88, arrowH * 0.58));
  const arrowX = arrowColX + (arrowColW - arrowW) / 2; // centered horizontally
  const arrowY = yU + (hU - arrowH) / 2; // centered vertically
  drawVectorArrow(sc, arrowX, arrowY, arrowW, arrowH, addr.arrowDirection);

  sc.push("Q");
}

export function buildLabelsPdf(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): Uint8Array {
  const showCutBorders = config.showCutBorders ?? false;
  const includeLogo = config.includeCompanyLogo ?? true;
  const larguraCm = Number(config.larguraCm) > 0 ? Number(config.larguraCm) : 10;
  const alturaCm = Number(config.alturaCm) > 0 ? Number(config.alturaCm) : 5;
  const mode: PrintLayoutMode = config.mode || config.layoutMode || "a4_grid";
  const gapMm = config.gapMm ?? 0;

  const labelWidthMm = larguraCm * 10;
  const labelHeightMm = alturaCm * 10;
  const labelWidthPt = labelWidthMm * MM_TO_PT;
  const labelHeightPt = labelHeightMm * MM_TO_PT;

  type Chunk = string | Uint8Array;
  const chunks: Chunk[] = [];
  let byteOffset = 0;

  function writeStr(s: string) {
    chunks.push(s);
    byteOffset += Buffer.byteLength(s, "binary");
  }

  // PDF Header (MUST BE THE FIRST BYTES IN THE FILE)
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

  // ── Fonts ────────────────────────────────────────────────────────────
  const fontBoldNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\n");
  endObj();

  const fontRegularNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\n");
  endObj();

  const fontBoldObliqueNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-BoldOblique /Encoding /WinAnsiEncoding >>\n");
  endObj();

  const fontCourierBoldNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>\n");
  endObj();

  const fontCourierNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\n");
  endObj();

  const fontTimesBoldNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>\n");
  endObj();

  const fontTimesNum = beginObj();
  writeStr("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>\n");
  endObj();

  // ── Logo JPEG XObject (Vertical) ─────────────────────────────────────
  let logoXObjNum = 0;
  if (includeLogo && COLLAB_LOGO_JPEG_BASE64) {
    const jpegBytes = Buffer.from(COLLAB_LOGO_JPEG_BASE64, "base64");
    const jpegLen = jpegBytes.length;

    logoXObjNum = beginObj();
    writeStr(
      `<< /Type /XObject /Subtype /Image /Width ${COLLAB_LOGO_WIDTH} /Height ${COLLAB_LOGO_HEIGHT}` +
      ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegLen} >>\n` +
      `stream\n`
    );
    chunks.push(new Uint8Array(jpegBytes.buffer, jpegBytes.byteOffset, jpegBytes.byteLength));
    byteOffset += jpegLen;
    writeStr("\nendstream\n");
    endObj();
  }

  // ── Pages ─────────────────────────────────────────────────────────────
  const pageNums: number[] = [];
  const xobjEntry = logoXObjNum > 0
    ? ` /XObject << /Im1 ${logoXObjNum} 0 R >>`
    : "";
  const resources =
    `<< /Font << /F1 ${fontBoldNum} 0 R /F2 ${fontRegularNum} 0 R /F3 ${fontBoldObliqueNum} 0 R /F4 ${fontCourierBoldNum} 0 R /F5 ${fontCourierNum} 0 R /F6 ${fontTimesBoldNum} 0 R /F7 ${fontTimesNum} 0 R >>${xobjEntry} >>`;

  const grid = calculateA4GridLayout(larguraCm, alturaCm, addresses.length, gapMm);
  const totalPages = mode === "a4_grid" ? Math.max(1, grid.totalPages) : Math.max(1, addresses.length);
  // Each page creates 2 objects: content stream and page dictionary.
  // Therefore, the /Type /Pages object number will be nextObjNum + totalPages * 2.
  const pagesObjNum = nextObjNum + totalPages * 2;

  if (mode === "a4_grid") {
    // ── Múltiplas etiquetas por folha A4 ─────────────────────────────────
    for (let p = 0; p < totalPages; p++) {
      const sc: string[] = [];
      const slice = addresses.slice(p * grid.labelsPerPage, (p + 1) * grid.labelsPerPage);

      for (let i = 0; i < slice.length; i++) {
        const addr = slice[i];
        if (!addr) continue;
        const row = Math.floor(i / grid.cols);
        const col = i % grid.cols;

        const originX = (grid.marginLeftMm + col * (grid.labelWidthMm + grid.gapMm)) * MM_TO_PT;
        const topFromPageTopMm = grid.marginTopMm + row * (grid.labelHeightMm + grid.gapMm);
        const topPt = (A4_HEIGHT_MM - topFromPageTopMm) * MM_TO_PT;
        const originY = topPt - labelHeightPt;

        drawSingleLabel(
          sc,
          addr,
          originX,
          originY,
          labelWidthPt,
          labelHeightPt,
          includeLogo,
          showCutBorders,
          logoXObjNum,
          config
        );
      }

      // Rodapé da folha A4
      sc.push("BT /F2 8 Tf 0.45 0.45 0.45 rg");
      const footerText = `Collab CD • Folha ${p + 1} de ${totalPages} (${slice.length} etiquetas • ${larguraCm} x ${alturaCm} cm) • Imprimir em Escala 100% (Sem Ajuste)`;
      sc.push(`15 15 Td (${escapePdfString(footerText)}) Tj ET`);
      sc.push("0 0 0 rg");

      const streamText = sc.join("\n");
      const streamLen = Buffer.byteLength(streamText, "utf8");

      const contentNum = beginObj();
      writeStr(`<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream\n`);
      endObj();

      const pageNum = beginObj();
      writeStr(
        `<< /Type /Page /Parent ${pagesObjNum} 0 R` +
        ` /MediaBox [0 0 ${A4_WIDTH_PT.toFixed(2)} ${A4_HEIGHT_PT.toFixed(2)}]` +
        ` /Contents ${contentNum} 0 R /Resources ${resources} >>\n`
      );
      endObj();

      pageNums.push(pageNum);
    }
  } else {
    // ── Modo Bobina Térmica (1 etiqueta por página individual) ────────────
    for (const addr of addresses) {
      const sc: string[] = [];

      drawSingleLabel(
        sc,
        addr,
        0,
        0,
        labelWidthPt,
        labelHeightPt,
        includeLogo,
        showCutBorders,
        logoXObjNum,
        config
      );

      const streamText = sc.join("\n");
      const streamLen = Buffer.byteLength(streamText, "utf8");

      const contentNum = beginObj();
      writeStr(`<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream\n`);
      endObj();

      const pageNum = beginObj();
      writeStr(
        `<< /Type /Page /Parent ${pagesObjNum} 0 R` +
        ` /MediaBox [0 0 ${labelWidthPt.toFixed(2)} ${labelHeightPt.toFixed(2)}]` +
        ` /Contents ${contentNum} 0 R /Resources ${resources} >>\n`
      );
      endObj();

      pageNums.push(pageNum);
    }
  }

  // Pages dictionary
  const pagesNum = beginObj();
  writeStr(
    `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageNums.length} >>\n`
  );
  endObj();

  // Catalog
  const catalogNum = beginObj();
  writeStr(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>\n`);
  endObj();

  // Cross-reference table + trailer
  const xrefOffset = byteOffset;
  const totalObjs = nextObjNum;

  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (let i = 1; i < totalObjs; i++) {
    xref += `${String(objOffsets[i] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${totalObjs} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(xref);

  // Merge chunks into binary output
  const totalBytes =
    chunks.reduce((acc, c) => acc + (typeof c === "string" ? Buffer.byteLength(c, "binary") : c.length), 0);
  const output = new Uint8Array(totalBytes);
  let pos = 0;
  for (const c of chunks) {
    if (typeof c === "string") {
      const b = Buffer.from(c, "binary");
      output.set(b, pos);
      pos += b.length;
    } else {
      output.set(c, pos);
      pos += c.length;
    }
  }
  return output;
}

function drawVectorArrow(
  cmds: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  direction: "up" | "down"
) {
  cmds.push("0 0 0 rg");

  const midX = x + w / 2;
  const stemWidth = Math.max(4, w * 0.44); // bold and prominent stem
  const stemX = midX - stemWidth / 2;
  const headHeight = h * 0.45;

  if (direction === "down") {
    const stemTop = y + h;
    const stemBottom = y + headHeight;
    const stemHeight = stemTop - stemBottom;

    cmds.push(
      `${stemX.toFixed(2)} ${stemBottom.toFixed(2)} ${stemWidth.toFixed(2)} ${stemHeight.toFixed(2)} re f`
    );

    const tipX = midX, tipY = y;
    const leftX = x, leftY = stemBottom;
    const rightX = x + w, rightY = stemBottom;

    cmds.push(
      `${tipX.toFixed(2)} ${tipY.toFixed(2)} m ${leftX.toFixed(2)} ${leftY.toFixed(2)} l ${rightX.toFixed(2)} ${rightY.toFixed(2)} l f`
    );
  } else {
    const stemBottom = y;
    const stemTop = y + h - headHeight;
    const stemHeight = stemTop - stemBottom;

    cmds.push(
      `${stemX.toFixed(2)} ${stemBottom.toFixed(2)} ${stemWidth.toFixed(2)} ${stemHeight.toFixed(2)} re f`
    );

    const tipX = midX, tipY = y + h;
    const leftX = x, leftY = stemTop;
    const rightX = x + w, rightY = stemTop;

    cmds.push(
      `${tipX.toFixed(2)} ${tipY.toFixed(2)} m ${leftX.toFixed(2)} ${leftY.toFixed(2)} l ${rightX.toFixed(2)} ${rightY.toFixed(2)} l f`
    );
  }
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function createLabelsPdfBlob(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): Blob {
  const bytes = buildLabelsPdf(addresses, config);
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export function downloadLabelsPdf(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): void {
  if (!addresses || addresses.length === 0) {
    if (typeof window !== "undefined") {
      alert("Nenhuma etiqueta disponível para baixar.");
    }
    return;
  }

  const blob = createLabelsPdfBlob(addresses, config);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const first = addresses[0]?.code || "inicio";
  const last = addresses[addresses.length - 1]?.code || "fim";
  const w = Number(config.larguraCm) > 0 ? Number(config.larguraCm) : 10;
  const h = Number(config.alturaCm) > 0 ? Number(config.alturaCm) : 5;
  const mode: PrintLayoutMode = config.mode || config.layoutMode || "a4_grid";

  a.style.display = "none";
  a.href = url;

  if (mode === "a4_grid") {
    const grid = calculateA4GridLayout(w, h, addresses.length, config.gapMm ?? 0);
    a.download = `etiquetas_cd_A4_${w}x${h}cm_${first}_a_${last}_${addresses.length}un_${grid.totalPages}folhas.pdf`;
  } else {
    a.download = `etiquetas_cd_bobina_${w}x${h}cm_${first}_a_${last}_${addresses.length}un.pdf`;
  }

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 15000);
}

export function printLabelsPdf(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): void {
  if (!addresses || addresses.length === 0) {
    if (typeof window !== "undefined") {
      alert("Nenhuma etiqueta disponível para imprimir.");
    }
    return;
  }

  const blob = createLabelsPdfBlob(addresses, config);
  const url = URL.createObjectURL(blob);

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.src = url;

    document.body.appendChild(iframe);

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Iframe print falhou, abrindo janela auxiliar:", err);
        const win = window.open(url, "_blank");
        if (win) {
          win.focus();
        }
      }
    };

    iframe.onload = () => {
      setTimeout(triggerPrint, 300);
    };

    setTimeout(() => {
      if (!printed) {
        triggerPrint();
      }
    }, 1500);

    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
      URL.revokeObjectURL(url);
    }, 60000);
  } catch (err) {
    console.error("Erro ao iniciar impressão:", err);
    window.open(url, "_blank");
  }
}
