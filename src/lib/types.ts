export interface AddressParams {
  ruaInicio: string;
  ruaFim: string;
  predioInicio: string;
  predioFim: string;
  aptoInicio: string;
  aptoFim: string;
  nivelInicio: string;
  nivelFim: string;
  qtdAptos?: number | "";
  qtdNiveis?: number | "";
}

export type ArrowDirection = "down" | "up";

export interface StorageAddress {
  id: string;
  code: string; // Ex: "R01-P01-A01-N01"
  rua: number;
  predio: number;
  apto: number;
  nivel: number;
  ruaStr: string;
  predioStr: string;
  aptoStr: string;
  nivelStr: string;
  arrowDirection: ArrowDirection; // N01 -> "down", >N01 -> "up"
  barcode: string;
  index: number;
}

export interface GenerationSummary {
  qtdRuas: number;
  qtdPrediosPorRua: number;
  qtdAptosPorPredio: number;
  qtdNiveisPorApto: number;
  totalEnderecos: number;
  totalEtiquetas: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type PrintLayoutMode = "thermal" | "a4_grid";

export interface PrintConfig {
  mode: PrintLayoutMode;
  labelsPerA4Page: 8 | 10;
  showCutBorders: boolean;
  includeCompanyLogo: boolean;
  companyName: string;
  scalePercent: 100;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: string;
  user: string;
  params: AddressParams;
  totalGenerated: number;
  firstCode: string;
  lastCode: string;
}

export interface AddressPreset {
  id: string;
  name: string;
  description: string;
  params: AddressParams;
}
