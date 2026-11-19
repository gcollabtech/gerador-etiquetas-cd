export type LabelFontFamily = "Helvetica" | "Courier" | "Times";

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
  larguraCm?: number | "";
  alturaCm?: number | "";
  fonteFamilia?: LabelFontFamily;
  tamanhoFontePt?: number | "";
  alturaCodigoBarrasMm?: number | "";
}

export type ArrowDirection = "down" | "up";

export interface StorageAddress {
  id: string;
  code: string; // Ex: "R01-P01-N01-A01" (Sequência: Rua, Prédio, Nível, Apartamento)
  rua: number;
  predio: number;
  nivel: number;
  apto: number;
  ruaStr: string;
  predioStr: string;
  nivelStr: string;
  aptoStr: string;
  arrowDirection: ArrowDirection; // N01 -> "down", >N01 -> "up"
  barcode: string;
  index: number;
}

export interface GenerationSummary {
  qtdRuas: number;
  qtdPrediosPorRua: number;
  qtdNiveisPorPredio: number;
  qtdAptosPorNivel: number;
  qtdAptosPorPredio?: number;
  qtdNiveisPorApto?: number;
  totalEnderecos: number;
  totalEtiquetas: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type PrintLayoutMode = "thermal" | "a4_grid";

export interface A4GridLayout {
  cols: number;
  rows: number;
  labelsPerPage: number;
  totalPages: number;
  marginLeftMm: number;
  marginTopMm: number;
  gapMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
}

export interface PrintConfig {
  mode?: PrintLayoutMode;
  layoutMode?: PrintLayoutMode;
  labelsPerA4Page?: number;
  showCutBorders: boolean;
  includeCompanyLogo: boolean;
  companyName: string;
  scalePercent: 100;
  larguraCm?: number | "";
  alturaCm?: number | "";
  gapMm?: number;
  fonteFamilia?: LabelFontFamily;
  tamanhoFontePt?: number | "";
  fontFamily?: LabelFontFamily;
  fontSizePt?: number | "";
  alturaCodigoBarrasMm?: number | "";
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
  createdAt?: string;
  isCustom?: boolean;
}
