// Gerador e Codificador de Código de Barras EAN-13 (GS1 Standard)
// Adequado para leitura em leitores ópticos industriais e comerciais (laser e CCD/imager)

export const FIRST_DIGIT_PARITY: readonly (readonly ("L" | "G")[])[] = [
  ["L", "L", "L", "L", "L", "L"], // 0
  ["L", "L", "G", "L", "G", "G"], // 1
  ["L", "L", "G", "G", "L", "G"], // 2
  ["L", "L", "G", "G", "G", "L"], // 3
  ["L", "G", "L", "L", "G", "G"], // 4
  ["L", "G", "G", "L", "L", "G"], // 5
  ["L", "G", "G", "G", "L", "L"], // 6
  ["L", "G", "L", "G", "L", "G"], // 7
  ["L", "G", "L", "G", "G", "L"], // 8
  ["L", "G", "G", "L", "G", "L"], // 9
];

export const L_PATTERNS: readonly string[] = [
  "0001101", // 0
  "0011001", // 1
  "0010011", // 2
  "0111101", // 3
  "0100011", // 4
  "0110001", // 5
  "0101111", // 6
  "0111011", // 7
  "0110111", // 8
  "0001011", // 9
];

export const G_PATTERNS: readonly string[] = [
  "0100111", // 0
  "0110011", // 1
  "0011011", // 2
  "0100001", // 3
  "0011101", // 4
  "0111001", // 5
  "0000101", // 6
  "0010001", // 7
  "0001001", // 8
  "0010111", // 9
];

export const R_PATTERNS: readonly string[] = [
  "1110010", // 0
  "1100110", // 1
  "1101100", // 2
  "1000010", // 3
  "1011100", // 4
  "1001110", // 5
  "1010000", // 6
  "1000100", // 7
  "1001000", // 8
  "1110100", // 9
];

export function calcEan13CheckDigit(digits12: string): number {
  const clean = digits12.replace(/\D/g, "");
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const val = parseInt(clean[i] || "0", 10);
    // Posições ímpares multiplicadas por 1, pares por 3 (base 0)
    sum += i % 2 === 0 ? val * 1 : val * 3;
  }
  return (10 - (sum % 10)) % 10;
}

export function validateAndNormalizeEan13(input: string): {
  valid: boolean;
  code13: string;
  formatted: string;
  error?: string;
} {
  const clean = input.replace(/\D/g, "");

  if (clean.length === 12) {
    const check = calcEan13CheckDigit(clean);
    const code13 = `${clean}${check}`;
    return {
      valid: true,
      code13,
      formatted: formatEan13(code13),
    };
  }

  if (clean.length === 13) {
    const expectedCheck = calcEan13CheckDigit(clean.slice(0, 12));
    const actualCheck = parseInt(clean[12]!, 10);
    if (expectedCheck !== actualCheck) {
      // Ajusta automaticamente para o dígito verificador correto
      const correctedCode = `${clean.slice(0, 12)}${expectedCheck}`;
      return {
        valid: true,
        code13: correctedCode,
        formatted: formatEan13(correctedCode),
        error: `Dígito verificador corrigido de ${actualCheck} para ${expectedCheck}`,
      };
    }
    return {
      valid: true,
      code13: clean,
      formatted: formatEan13(clean),
    };
  }

  return {
    valid: false,
    code13: clean.padEnd(13, "0").slice(0, 13),
    formatted: clean,
    error: "Código EAN-13 deve conter 12 ou 13 dígitos numéricos.",
  };
}

export function formatEan13(code13: string): string {
  if (code13.length !== 13) return code13;
  // Formato padrão legível GS1: 7 891234 567890
  return `${code13[0]} ${code13.slice(1, 7)} ${code13.slice(7)}`;
}

export interface Ean13Encoding {
  code13: string;
  formatted: string;
  binary: string;
  totalModules: number;
}

export function encodeEan13(inputCode: string): Ean13Encoding {
  const norm = validateAndNormalizeEan13(inputCode);
  const code13 = norm.code13;
  const digits = code13.split("").map((x) => parseInt(x, 10));

  const firstDigit = digits[0] ?? 7;
  const parities = FIRST_DIGIT_PARITY[firstDigit] ?? FIRST_DIGIT_PARITY[0]!;

  let binary = "";

  // 1. Guarda Inicial (Start Guard): 101 (3 módulos)
  binary += "101";

  // 2. Dígitos 2 a 7 (Esquerda, 6 dígitos x 7 módulos = 42 módulos)
  for (let i = 0; i < 6; i++) {
    const digit = digits[i + 1] ?? 0;
    const parity = parities[i];
    binary += parity === "L" ? L_PATTERNS[digit] : G_PATTERNS[digit];
  }

  // 3. Guarda Central (Center Guard): 01010 (5 módulos)
  binary += "01010";

  // 4. Dígitos 8 a 13 (Direita, 6 dígitos x 7 módulos = 42 módulos, padrão R)
  for (let i = 0; i < 6; i++) {
    const digit = digits[i + 7] ?? 0;
    binary += R_PATTERNS[digit];
  }

  // 5. Guarda Final (Stop Guard): 101 (3 módulos)
  binary += "101";

  return {
    code13,
    formatted: norm.formatted,
    binary,
    totalModules: binary.length, // 95
  };
}

export interface Ean13Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  isGuard: boolean;
}

export function getEan13Rectangles(
  code: string,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
  quietZoneModules = 7
): {
  rects: Ean13Rect[];
  totalModulesWithQuiet: number;
  code13: string;
  formatted: string;
} {
  const encoded = encodeEan13(code);
  const totalModulesWithQuiet = encoded.totalModules + quietZoneModules * 2;
  const moduleWidth = targetWidth / totalModulesWithQuiet;

  const rects: Ean13Rect[] = [];
  let currentX = targetX + quietZoneModules * moduleWidth;

  for (let i = 0; i < encoded.binary.length; i++) {
    if (encoded.binary[i] === "1") {
      let barLen = 1;
      while (i + 1 < encoded.binary.length && encoded.binary[i + 1] === "1") {
        barLen++;
        i++;
      }

      // Identifica se a barra pertence a uma guarda (início: 0..2, centro: 45..49, fim: 92..94)
      const isGuard =
        i <= 2 ||
        (i >= 45 && i <= 49) ||
        (i >= 92 && i <= 94);

      rects.push({
        x: currentX,
        y: targetY,
        width: barLen * moduleWidth,
        height: targetHeight,
        isGuard,
      });

      currentX += barLen * moduleWidth;
    } else {
      currentX += moduleWidth;
    }
  }

  return {
    rects,
    totalModulesWithQuiet,
    code13: encoded.code13,
    formatted: encoded.formatted,
  };
}

export function generateEan13Svg(
  code: string,
  width = 240,
  height = 70,
  quietZoneModules = 7
): string {
  const { rects } = getEan13Rectangles(code, 0, 0, width, height, quietZoneModules);

  const rectElements = rects
    .map(
      (r) =>
        `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.width.toFixed(
          2
        )}" height="${r.height.toFixed(2)}" fill="#000000" shape-rendering="crispEdges"/>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges" style="background:#ffffff;display:block;">${rectElements}</svg>`;
}
