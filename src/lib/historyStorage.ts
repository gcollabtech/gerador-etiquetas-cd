import { GenerationHistoryItem, AddressPreset, AddressParams } from "./types";

const HISTORY_KEY = "collab_cd_labels_history_v1";
const PRESETS_KEY = "collab_cd_labels_presets_v1";

export const DEFAULT_PRESETS: AddressPreset[] = [
  {
    id: "exemplo-cd-160",
    name: "Exemplo Padrão CD (160 etiquetas)",
    description: "R01 a R02, P01 a P02, A01 a A10, N01 a N04 (Estrutura Porta-Paletes padrão)",
    params: {
      ruaInicio: "R01",
      ruaFim: "R02",
      predioInicio: "P01",
      predioFim: "P02",
      aptoInicio: "A01",
      aptoFim: "A10",
      nivelInicio: "N01",
      nivelFim: "N04",
      qtdAptos: 10,
      qtdNiveis: 4,
    },
  },
  {
    id: "teste-aceite-6",
    name: "Teste de Aceite 1 (6 etiquetas)",
    description: "R01 a R01, P01 a P01, A01 a A02, N01 a N03 (Teste oficial de validação das setas)",
    params: {
      ruaInicio: "R01",
      ruaFim: "R01",
      predioInicio: "P01",
      predioFim: "P01",
      aptoInicio: "A01",
      aptoFim: "A02",
      nivelInicio: "N01",
      nivelFim: "N03",
      qtdAptos: 2,
      qtdNiveis: 3,
    },
  },
  {
    id: "rua-completa-400",
    name: "Rua 01 Completa (400 etiquetas)",
    description: "R01 a R01, P01 a P05, A01 a A20, N01 a N04 (5 prédios x 20 aptos x 4 níveis)",
    params: {
      ruaInicio: "R01",
      ruaFim: "R01",
      predioInicio: "P01",
      predioFim: "P05",
      aptoInicio: "A01",
      aptoFim: "A20",
      nivelInicio: "N01",
      nivelFim: "N04",
      qtdAptos: 20,
      qtdNiveis: 4,
    },
  },
  {
    id: "picking-solo-n01",
    name: "Picking de Solo N01 — Seta Baixo (50 etiquetas)",
    description: "R01 a R01, P01 a P01, A01 a A50, N01 a N01 (Validação de seta para BAIXO)",
    params: {
      ruaInicio: "R01",
      ruaFim: "R01",
      predioInicio: "P01",
      predioFim: "P01",
      aptoInicio: "A01",
      aptoFim: "A50",
      nivelInicio: "N01",
      nivelFim: "N01",
      qtdAptos: 50,
      qtdNiveis: 1,
    },
  },
];

export function getHistory(): GenerationHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao carregar histórico de etiquetas:", e);
    return [];
  }
}

export function saveHistoryItem(item: Omit<GenerationHistoryItem, "id" | "timestamp">): GenerationHistoryItem {
  if (typeof window === "undefined") {
    return { ...item, id: "0", timestamp: new Date().toISOString() };
  }
  try {
    const history = getHistory();
    const newItem: GenerationHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    const updated = [newItem, ...history].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newItem;
  } catch (e) {
    console.error("Erro ao salvar histórico de etiquetas:", e);
    return { ...item, id: "0", timestamp: new Date().toISOString() };
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

export function getPresets(): AddressPreset[] {
  if (typeof window === "undefined") return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(DEFAULT_PRESETS));
      return DEFAULT_PRESETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar presets:", e);
    return DEFAULT_PRESETS;
  }
}

export function saveCustomPreset(name: string, description: string, params: AddressParams): AddressPreset {
  const current = getPresets();
  const newPreset: AddressPreset = {
    id: `preset_${Date.now()}`,
    name,
    description,
    params,
  };
  const updated = [...current, newPreset];
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  }
  return newPreset;
}

export function deletePreset(id: string): void {
  const current = getPresets().filter((p) => p.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(current));
  }
}
