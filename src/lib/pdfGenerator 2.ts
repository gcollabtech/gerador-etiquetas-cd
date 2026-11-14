import { StorageAddress, PrintConfig } from "./types";
import { getCode128Rectangles } from "./code128";

const MM_TO_PT = 72 / 25.4; // 1 mm = ~2.834645669 pt

// Dimensões físicas padrão: 100 mm x 50 mm
export const LABEL_WIDTH_MM = 100;
export const LABEL_HEIGHT_MM = 50;
export const MARGIN_MM = 10;
export const USEFUL_WIDTH_MM = 80;
export const USEFUL_HEIGHT_MM = 30;

export const LABEL_WIDTH_PT = LABEL_WIDTH_MM * MM_TO_PT;   // 283.465 pt
export const LABEL_HEIGHT_PT = LABEL_HEIGHT_MM * MM_TO_PT; // 141.732 pt
export const MARGIN_PT = MARGIN_MM * MM_TO_PT;             // 28.346 pt
export const USEFUL_WIDTH_PT = USEFUL_WIDTH_MM * MM_TO_PT; // 226.772 pt
export const USEFUL_HEIGHT_PT = USEFUL_HEIGHT_MM * MM_TO_PT; // 85.039 pt

/**
 * Construtor vetorial de PDF 1.4 independente
 * Gera arquivo binário em dimensões físicas reais (milímetros)
 */
export function buildLabelsPdf(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): Uint8Array {
  const showCutBorders = config.showCutBorders ?? false;
  const includeLogo = config.includeCompanyLogo ?? true;
  const companyName = config.companyName || "BIG MASTER / COLLAB CD";

  const objects: string[] = [];
  function addObj(content: string): number {
    objects.push(content);
    return objects.length;
  }

  // 1: Fonte Negrito (Helvetica-Bold)
  // 2: Fonte Regular (Helvetica)
  const fontBoldObj = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  );
  const fontRegularObj = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );

  const pageObjNums: number[] = [];

  for (const addr of addresses) {
    const streamCommands: string[] = [];

    // Reset de estado gráfico
    streamCommands.push("q");

    // Margens e área útil
    const xUseful = MARGIN_PT;
    const yUseful = MARGIN_PT; // Em PDF, Y=0 fica no canto inferior esquerdo
    const wUseful = USEFUL_WIDTH_PT;
    const hUseful = USEFUL_HEIGHT_PT;

    // Borda de corte opcional (guia de margem)
    if (showCutBorders) {
      streamCommands.push("0.75 0.75 0.75 RG 0.5 w [2 2] 0 d");
      streamCommands.push(
        `${xUseful.toFixed(2)} ${yUseful.toFixed(2)} ${wUseful.toFixed(2)} ${hUseful.toFixed(2)} re S`
      );
      streamCommands.push("[] 0 d"); // restaura linha contínua
    }

    // Identificação visual no lado esquerdo (empresa / CD)
    let barcodeStartX = xUseful;
    let barcodeWidth = wUseful - 45; // Deixa 45pt para a seta na direita

    if (includeLogo) {
      barcodeStartX = xUseful + 28;
      barcodeWidth = wUseful - 28 - 42;

      // Logo/Texto vertical da empresa
      streamCommands.push("0 0 0 rg");
      streamCommands.push("q");
      // Rotaciona 90 graus para texto vertical no lado esquerdo
      const rotX = (xUseful + 14).toFixed(2);
      const rotY = (yUseful + 10).toFixed(2);
      streamCommands.push(`0 1 -1 0 ${rotX} ${rotY} cm`);
      streamCommands.push("BT");
      streamCommands.push(`/F1 7 Tf`);
      streamCommands.push(`0 0 Td`);
      streamCommands.push(`(${escapePdfString(companyName)}) Tj`);
      streamCommands.push("ET");
      streamCommands.push("Q");
    }

    // Código de Barras CODE 128 (no topo da área útil)
    const barcodeHeight = 44; // ~15.5 mm
    const barcodeY = yUseful + hUseful - barcodeHeight - 2;

    const { rects } = getCode128Rectangles(
      addr.code,
      barcodeStartX,
      barcodeY,
      barcodeWidth,
      barcodeHeight,
      8
    );

    streamCommands.push("0 0 0 rg"); // Preto sólido
    for (const r of rects) {
      streamCommands.push(
        `${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.width.toFixed(2)} ${r.height.toFixed(2)} re f`
      );
    }

    // Texto do endereço logo abaixo do código de barras
    // Centralizado sob o código de barras
    const textY = barcodeY - 18; // ~6.3 mm abaixo do barcode
    const charWidthEstimate = 8.5; // Estimativa para Helvetica-Bold 15pt
    const estimatedTextWidth = addr.code.length * charWidthEstimate;
    const textX = Math.max(
      barcodeStartX,
      barcodeStartX + (barcodeWidth - estimatedTextWidth) / 2
    );

    streamCommands.push("BT");
    streamCommands.push(`/F1 15 Tf`); // Tamanho grande, negrito, leitura à distância
    streamCommands.push(`${textX.toFixed(2)} ${textY.toFixed(2)} Td`);
    streamCommands.push(`(${escapePdfString(addr.code)}) Tj`);
    streamCommands.push("ET");

    // Seta direcional grande no lado direito
    // Regra: N01 -> BAIXO, >N01 -> CIMA
    const arrowBoxX = xUseful + wUseful - 36;
    const arrowBoxY = yUseful + 8;
    const arrowBoxW = 32;
    const arrowBoxH = hUseful - 16; // ~69pt

    drawVectorArrow(streamCommands, arrowBoxX, arrowBoxY, arrowBoxW, arrowBoxH, addr.arrowDirection);

    streamCommands.push("Q"); // Restaura estado gráfico

    const streamText = streamCommands.join("\n");
    const streamLen = Buffer.byteLength(streamText, "utf8");

    const contentObj = addObj(
      `<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream`
    );

    const pageObj = addObj(
      `<< /Type /Page /Parent 4 0 R /MediaBox [0 0 ${LABEL_WIDTH_PT.toFixed(2)} ${LABEL_HEIGHT_PT.toFixed(2)}] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${fontBoldObj} 0 R /F2 ${fontRegularObj} 0 R >> >> >>`
    );

    pageObjNums.push(pageObj);
  }

  // Objeto de Páginas
  const pagesObj = addObj(
    `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjNums.length} >>`
  );

  // Catálogo raiz
  const catalogObj = addObj(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  // Montagem final do PDF
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];

  for (let idx = 0; idx < objects.length; idx++) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${idx + 1} 0 obj\n${objects[idx]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

/**
 * Desenha uma seta direcional vetorizada grande e preenchida em preto
 */
function drawVectorArrow(
  cmds: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  direction: "up" | "down"
) {
  cmds.push("0 0 0 rg"); // Preto sólido

  const midX = x + w / 2;
  const stemWidth = w * 0.38; // Largura do corpo da seta
  const stemX = midX - stemWidth / 2;
  const headHeight = h * 0.45; // Altura da ponta triangular

  if (direction === "down") {
    // Seta apontando para BAIXO (N01)
    const stemTop = y + h;
    const stemBottom = y + headHeight;
    const stemHeight = stemTop - stemBottom;

    // Corpo retangular
    cmds.push(
      `${stemX.toFixed(2)} ${stemBottom.toFixed(2)} ${stemWidth.toFixed(2)} ${stemHeight.toFixed(2)} re f`
    );

    // Ponta triangular apontando para baixo
    const tipX = midX;
    const tipY = y;
    const leftX = x;
    const leftY = stemBottom;
    const rightX = x + w;
    const rightY = stemBottom;

    cmds.push(
      `${tipX.toFixed(2)} ${tipY.toFixed(2)} m ${leftX.toFixed(2)} ${leftY.toFixed(2)} l ${rightX.toFixed(2)} ${rightY.toFixed(2)} l f`
    );
  } else {
    // Seta apontando para CIMA (> N01)
    const stemBottom = y;
    const stemTop = y + h - headHeight;
    const stemHeight = stemTop - stemBottom;

    // Corpo retangular
    cmds.push(
      `${stemX.toFixed(2)} ${stemBottom.toFixed(2)} ${stemWidth.toFixed(2)} ${stemHeight.toFixed(2)} re f`
    );

    // Ponta triangular apontando para cima
    const tipX = midX;
    const tipY = y + h;
    const leftX = x;
    const leftY = stemTop;
    const rightX = x + w;
    const rightY = stemTop;

    cmds.push(
      `${tipX.toFixed(2)} ${tipY.toFixed(2)} m ${leftX.toFixed(2)} ${leftY.toFixed(2)} l ${rightX.toFixed(2)} ${rightY.toFixed(2)} l f`
    );
  }
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Cria um objeto Blob do PDF pronto para download ou visualização em iframe
 */
export function createLabelsPdfBlob(
  addresses: StorageAddress[],
  config: Partial<PrintConfig> = {}
): Blob {
  const bytes = buildLabelsPdf(addresses, config);
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

/**
 * Dispara o download automático do PDF gerado com nome padronizado
 */
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
