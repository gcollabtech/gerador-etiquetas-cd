export type ProductLabelPreset = "40x30" | "60x30" | "50x30" | "100x50" | "custom";

export interface ProductLabelItem {
  id: string;
  descricao: string;
  codigoEan: string; // 12 ou 13 dígitos
  codigoProduto?: string; // Código interno / SKU
  quantidade: number; // Cópias da etiqueta
  createdAt: string;
}

export interface ProductLabelConfig {
  larguraMm: number; // Ex: 40 ou 60
  alturaMm: number; // Ex: 30
  preset: ProductLabelPreset;
  mostrarCodigoProduto: boolean;
  formatoEanEspacado: boolean; // ex: "7 891234 567890" vs "7891234567890"
  tamanhoFonteDescricaoPt: number; // Ex: 8, 9, 10
  tamanhoFonteCodigoPt: number; // Ex: 9, 10, 11
}

export const PRESETS_PRODUTO: Record<
  ProductLabelPreset,
  { label: string; larguraMm: number; alturaMm: number; desc: string }
> = {
  "40x30": {
    label: "40 × 30 mm",
    larguraMm: 40,
    alturaMm: 30,
    desc: "Padrão térmico compacto para gôndolas e caixas",
  },
  "60x30": {
    label: "60 × 30 mm",
    larguraMm: 60,
    alturaMm: 30,
    desc: "Formato amplo de alta legibilidade para leitores ópticos",
  },
  "50x30": {
    label: "50 × 30 mm",
    larguraMm: 50,
    alturaMm: 30,
    desc: "Formato intermediário para embalagens industriais",
  },
  "100x50": {
    label: "100 × 50 mm",
    larguraMm: 100,
    alturaMm: 50,
    desc: "Etiqueta grande para fardos e caixas master",
  },
  custom: {
    label: "Personalizado",
    larguraMm: 40,
    alturaMm: 30,
    desc: "Definir largura e altura editáveis em mm",
  },
};

export const SEED_PRODUCT_LABELS: ProductLabelItem[] = [
  {
    id: "prd-01",
    descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
    codigoEan: "7891000315507",
    codigoProduto: "PRD-1001",
    quantidade: 20,
    createdAt: "2026-11-18T10:00:00Z",
  },
  {
    id: "prd-02",
    descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
    codigoEan: "7891234567895",
    codigoProduto: "PRD-1002",
    quantidade: 15,
    createdAt: "2026-11-18T10:05:00Z",
  },
  {
    id: "prd-03",
    descricao: "ÁGUA SANITÁRIA CLORADA 2L",
    codigoEan: "7898912345678",
    codigoProduto: "PRD-1003",
    quantidade: 30,
    createdAt: "2026-11-18T10:10:00Z",
  },
  {
    id: "prd-04",
    descricao: "DESINFETANTE FLORAL 1L",
    codigoEan: "7896000123456",
    codigoProduto: "PRD-1004",
    quantidade: 10,
    createdAt: "2026-11-18T10:15:00Z",
  },
];
