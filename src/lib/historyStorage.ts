import { GenerationHistoryItem, AddressPreset, AddressParams } from "./types";

const HISTORY_KEY = "collab_cd_labels_history_v1";
const PRESETS_KEY = "collab_cd_labels_presets_v1";
const LAST_PARAMS_KEY = "collab_cd_labels_last_params_v1";

export const DEFAULT_PRESETS: AddressPreset[] = [
  {
    id: "exemplo-cd-160",
    name: "Porta-Paletes Padrão CD (160 un - 10×5cm)",
    description: "R01..R02, P01..P02, A01..A10, N01..N04 • 10x5cm • Barras 20mm • Helvetica 16pt",
    isCustom: false,
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
      larguraCm: 10,
      alturaCm: 5,
      fonteFamilia: "Helvetica",
      tamanhoFontePt: 16,
      alturaCodigoBarrasMm: 20,
    },
  },
  {
    id: "teste-aceite-6",
    name: "Teste de Aceite Oficial (6 un - Seta Baixo & Cima)",
    description: "R01..R01, P01..P01, A01..A02, N01..N03 • Validação de setas N01 (baixo) e N02/N03 (cima)",
    isCustom: false,
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
      larguraCm: 10,
      alturaCm: 5,
      fonteFamilia: "Helvetica",
      tamanhoFontePt: 16,
      alturaCodigoBarrasMm: 20,
    },
  },
  {
    id: "rua-completa-400",
    name: "Rua 01 Completa CD (400 un - 10×5cm)",
    description: "R01..R01, P01..P05, A01..A20, N01..N04 (5 prédios x 20 aptos x 4 níveis)",
    isCustom: false,
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
      larguraCm: 10,
      alturaCm: 5,
      fonteFamilia: "Helvetica",
      tamanhoFontePt: 16,
      alturaCodigoBarrasMm: 20,
    },
  },
  {
    id: "picking-solo-n01",
    name: "Picking Solo Nível 01 (50 un - Seta Baixo)",
    description: "R01..R01, P01..P01, A01..A50, N01..N01 • Somente nível solo com seta para BAIXO",
    isCustom: false,
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
      larguraCm: 10,
      alturaCm: 5,
      fonteFamilia: "Helvetica",
      tamanhoFontePt: 16,
      alturaCodigoBarrasMm: 20,
    },
  },
  {
    id: "pulmao-aereo-30mm",
    name: "Pulmão Aéreo Níveis Altos (10×5cm - Barras 30mm)",
    description: "N02 a N06 • Barras altas de 30mm para leitura à distância por leitor de longo alcance",
    isCustom: false,
    params: {
      ruaInicio: "R01",
      ruaFim: "R02",
      predioInicio: "P01",
      predioFim: "P02",
      aptoInicio: "A01",
      aptoFim: "A10",
      nivelInicio: "N02",
      nivelFim: "N05",
      qtdAptos: 10,
      qtdNiveis: 4,
      larguraCm: 10,
      alturaCm: 5,
      fonteFamilia: "Helvetica",
      tamanhoFontePt: 18,
      alturaCodigoBarrasMm: 30,
    },
  },
];

// ── Persistência dos Últimos Parâmetros Utilizados ────────────────────
export function getLastParams(): AddressParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_PARAMS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao carregar últimos parâmetros de etiqueta:", e);
    return null;
  }
}

export function saveLastParams(params: AddressParams): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_PARAMS_KEY, JSON.stringify(params));
  } catch (e) {
    console.error("Erro ao salvar últimos parâmetros de etiqueta:", e);
  }
}

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

export async function syncHistoryFromServer(): Promise<GenerationHistoryItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch(`/api/labels/batches?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(data.history));
        return data.history;
      }
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar lotes com servidor:", err);
  }
  return getHistory();
}

export async function saveHistoryItemAsync(
  item: Omit<GenerationHistoryItem, "id" | "timestamp">
): Promise<GenerationHistoryItem> {
  const localItem = saveHistoryItem(item);
  try {
    await fetch("/api/labels/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch: localItem }),
    });
  } catch (err) {
    console.warn("Aviso ao salvar lote no servidor:", err);
  }
  return localItem;
}

export async function clearHistoryAsync(): Promise<void> {
  clearHistory();
  try {
    await fetch("/api/labels/batches", { method: "DELETE" });
  } catch (err) {
    console.warn("Aviso ao limpar histórico no servidor:", err);
  }
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
    isCustom: true,
    createdAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  const updated = [...current, newPreset];
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  }
  return newPreset;
}

export function updateCustomPreset(
  id: string,
  name: string,
  description: string,
  params: AddressParams
): AddressPreset | null {
  const current = getPresets();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updatedItem: AddressPreset = {
    ...current[index]!,
    name,
    description,
    params,
    isCustom: true,
  };

  current[index] = updatedItem;
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(current));
  }
  return updatedItem;
}

export function isCustomPreset(preset: AddressPreset): boolean {
  if (preset.isCustom === true) return true;
  return !DEFAULT_PRESETS.some((d) => d.id === preset.id);
}

export function deletePreset(id: string): boolean {
  const current = getPresets();
  const exists = current.some((p) => p.id === id);
  if (!exists) return false;
  const currentFiltered = current.filter((p) => p.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(currentFiltered));
  }
  return true;
}

export function resetPresetsToDefault(): AddressPreset[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(DEFAULT_PRESETS));
  }
  return DEFAULT_PRESETS;
}

export async function syncPresetsFromServer(): Promise<AddressPreset[]> {
  if (typeof window === "undefined") return DEFAULT_PRESETS;
  try {
    const res = await fetch(`/api/labels/presets?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.presets) && data.presets.length > 0) {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(data.presets));
        return data.presets;
      }
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar presets com o servidor:", err);
  }
  return getPresets();
}

export async function saveCustomPresetAsync(
  name: string,
  description: string,
  params: AddressParams
): Promise<AddressPreset> {
  const localPreset = saveCustomPreset(name, description, params);
  try {
    await fetch("/api/labels/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset: localPreset }),
    });
  } catch (err) {
    console.warn("Aviso ao salvar preset no servidor:", err);
  }
  return localPreset;
}

export async function deletePresetAsync(id: string): Promise<boolean> {
  const ok = deletePreset(id);
  try {
    await fetch(`/api/labels/presets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    console.warn("Aviso ao excluir preset no servidor:", err);
  }
  return ok;
}
