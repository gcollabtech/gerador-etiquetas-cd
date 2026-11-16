import { StorageAddress, PrintConfig } from "./types";
import { getCode128Rectangles } from "./code128";
import {
  COLLAB_LOGO_JPEG_BASE64,
  COLLAB_LOGO_WIDTH,
  COLLAB_LOGO_HEIGHT,
} from "./logoBase64";

const MM_TO_PT = 72 / 25.4;

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

export function buildLabelsPdf(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): Uint8Array {
  const showCutBorders = config.showCutBorders ?? false;
  const includeLogo = config.includeCompanyLogo ?? true;

  type Chunk = string | Uint8Array;
  const chunks: Chunk[] = [];
  let byteOffset = 0;

  function writeStr(s: string) {
    chunks.push(s);
    byteOffset += Buffer.byteLength(s, "binary");
  }

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

  for (const addr of addresses) {
    const sc: string[] = [];

    sc.push("q");

    // Orange outer background (#FF6400)
    sc.push("1.0 0.392 0.0 rg");
    sc.push(`0 0 ${LABEL_WIDTH_PT.toFixed(2)} ${LABEL_HEIGHT_PT.toFixed(2)} re f`);

    // White inner rounded rectangle (approximated with inset rect)
    const FRAME_PT = MARGIN_PT * 0.55;
    const innerX = FRAME_PT;
    const innerY = FRAME_PT;
    const innerW = LABEL_WIDTH_PT - FRAME_PT * 2;
    const innerH = LABEL_HEIGHT_PT - FRAME_PT * 2;
    sc.push("1 1 1 rg");
    sc.push(`${innerX.toFixed(2)} ${innerY.toFixed(2)} ${innerW.toFixed(2)} ${innerH.toFixed(2)} re f`);

    const xU = innerX, yU = innerY, wU = innerW, hU = innerH;

    if (showCutBorders) {
      sc.push("0.75 0.75 0.75 RG 0.5 w [2 2] 0 d");
      sc.push(`${xU.toFixed(2)} ${yU.toFixed(2)} ${wU.toFixed(2)} ${hU.toFixed(2)} re S`);
      sc.push("[] 0 d");
    }

    // Left brand column (vertical logo): ~15% width
    const BRAND_COL_W = wU * 0.15;
    const RED_LINE_X = xU + BRAND_COL_W;

    let barcodeStartX: number;
    let barcodeWidth: number;

    if (includeLogo) {
      barcodeStartX = RED_LINE_X + 4;
      barcodeWidth = wU - BRAND_COL_W - 4 - wU * 0.18;

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
      barcodeStartX = xU;
      barcodeWidth = wU - wU * 0.18;
    }

    // Barcode in center
    const barcodeHeight = hU * 0.62;
    const barcodeY = yU + hU - barcodeHeight - 3;

    const { rects } = getCode128Rectangles(addr.code, barcodeStartX, barcodeY, barcodeWidth, barcodeHeight, 8);
    sc.push("0 0 0 rg");
    for (const r of rects) {
      sc.push(`${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.width.toFixed(2)} ${r.height.toFixed(2)} re f`);
    }

    // Address text centered below barcode
    const textY = barcodeY - 14;
    const charW = 7.5;
    const textW = addr.code.length * charW;
    const textX = barcodeStartX + (barcodeWidth - textW) / 2;
    sc.push("BT");
    sc.push(`/F1 13 Tf`);
    sc.push(`${Math.max(barcodeStartX, textX).toFixed(2)} ${textY.toFixed(2)} Td`);
    sc.push(`(${escapePdfString(addr.code)}) Tj`);
    sc.push("ET");

    // Right column: Directional arrow (~19% width, very bold)
    const arrowBoxW = wU * 0.19;
    const arrowBoxX = xU + wU - arrowBoxW - 3;
    const arrowBoxY = yU + 3;
    const arrowBoxH = hU - 6;
    drawVectorArrow(sc, arrowBoxX, arrowBoxY, arrowBoxW, arrowBoxH, addr.arrowDirection);

    sc.push("Q");

    const streamText = sc.join("\n");
    const streamLen = Buffer.byteLength(streamText, "utf8");

    const xobjEntry = logoXObjNum > 0
      ? ` /XObject << /Im1 ${logoXObjNum} 0 R >>`
      : "";
    const resources =
      `<< /Font << /F1 ${fontBoldNum} 0 R /F2 ${fontRegularNum} 0 R /F3 ${fontBoldObliqueNum} 0 R >>${xobjEntry} >>`;

    const contentNum = beginObj();
    writeStr(`<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream\n`);
    endObj();

    const pageNum = beginObj();
    writeStr(
      `<< /Type /Page /Parent ${nextObjNum + pageNums.length} 0 R` +
      ` /MediaBox [0 0 ${LABEL_WIDTH_PT.toFixed(2)} ${LABEL_HEIGHT_PT.toFixed(2)}]` +
      ` /Contents ${contentNum} 0 R /Resources ${resources} >>\n`
    );
    endObj();

    pageNums.push(pageNum);
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
  const stemWidth = w * 0.54; // wide and bold stem
  const stemX = midX - stemWidth / 2;
  const headHeight = h * 0.44;

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
  const blob = createLabelsPdfBlob(addresses, config);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const first = addresses[0]?.code || "inicio";
  const last = addresses[addresses.length - 1]?.code || "fim";
  a.href = url;
  a.download = `etiquetas_cd_${first}_a_${last}_${addresses.length}un.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
