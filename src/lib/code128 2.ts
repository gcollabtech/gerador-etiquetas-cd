/**
 * Implementação padrão ISO/IEC 15417 do Código de Barras CODE 128 (Subset B)
 * Gera código de barras 100% compatível com coletores RF, leitores ópticos e scanners de CD.
 */

// Tabela de 107 padrões Code 128 (6 larguras por símbolo: barra, espaço, barra, espaço, barra, espaço)
export const CODE128_PATTERNS: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

export const START_CODE_B = 104; // Início do conjunto B (ASCII 32 a 127)
export const STOP_CODE = 106;    // Símbolo de parada

export interface Code128Bar {
  isBar: boolean; // true = preto, false = branco
  widthModules: number;
}

export interface Code128Encoding {
  text: string;
  codes: number[];
  checksum: number;
  binary: string; // Sequência de '1' (barra) e '0' (espaço)
  totalModules: number;
  bars: Code128Bar[];
}

/**
 * Codifica uma string alfanumérica no padrão CODE 128 (Subset B)
 */
export function encodeCode128B(text: string): Code128Encoding {
  let sum = START_CODE_B;
  const codes: number[] = [START_CODE_B];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Code Set B aceita caracteres ASCII de 32 a 127
    const val = charCode >= 32 && charCode <= 127 ? charCode - 32 : 0;
    codes.push(val);
    sum += val * (i + 1);
  }

  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(STOP_CODE);

  let binary = "";
  const bars: Code128Bar[] = [];

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0]!;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p]!, 10);
      const isBar = p % 2 === 0;
      binary += (isBar ? "1" : "0").repeat(width);
      bars.push({ isBar, widthModules: width });
    }
  }

  return {
    text,
    codes,
    checksum,
    binary,
    totalModules: binary.length,
    bars,
  };
}

export interface Code128Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calcula os retângulos vetoriais para desenhar as barras pretas
 * Respeita as Quiet Zones (margens de silêncio) nas laterais
 */
export function getCode128Rectangles(
  text: string,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
  quietZoneModules = 10
): { rects: Code128Rect[]; totalModulesWithQuiet: number } {
  const encoded = encodeCode128B(text);
  const totalModulesWithQuiet = encoded.totalModules + quietZoneModules * 2;
  const moduleWidth = targetWidth / totalModulesWithQuiet;

  const rects: Code128Rect[] = [];
  let currentX = targetX + quietZoneModules * moduleWidth;

  for (let i = 0; i < encoded.binary.length; i++) {
    if (encoded.binary[i] === "1") {
      // Agrupa barras consecutivas para melhor renderização
      let barLen = 1;
      while (i + 1 < encoded.binary.length && encoded.binary[i + 1] === "1") {
        barLen++;
        i++;
      }
      rects.push({
        x: currentX,
        y: targetY,
        width: barLen * moduleWidth,
        height: targetHeight,
      });
      currentX += barLen * moduleWidth;
    } else {
      currentX += moduleWidth;
    }
  }

  return { rects, totalModulesWithQuiet };
}

/**
 * Gera um SVG do código de barras Code 128 com alta definição
 */
export function generateCode128Svg(
  text: string,
  width = 300,
  height = 80,
  quietZoneModules = 10
): string {
  const { rects } = getCode128Rectangles(text, 0, 0, width, height, quietZoneModules);

  const rectElements = rects
    .map(
      (r) =>
        `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.width.toFixed(2)}" height="${r.height.toFixed(2)}" fill="#000000" shape-rendering="crispEdges"/>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges" style="background:#ffffff;">${rectElements}</svg>`;
}
