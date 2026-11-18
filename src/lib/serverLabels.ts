import fs from "node:fs";
import path from "node:path";
import { GenerationHistoryItem, AddressPreset } from "./types";
import { DEFAULT_PRESETS } from "./historyStorage";

function getSupabaseConfig(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://jnfvvcvoubimkdwrasro.supabase.co";

  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

function getSupabaseHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

const CANONICAL_DATA_DIR = "/Users/fragoso/Documents/collab-finance/collab-finance/gerador-etiquetas-cd/data";

function getDataDir(): string {
  if (fs.existsSync(CANONICAL_DATA_DIR)) return CANONICAL_DATA_DIR;
  const inGerador = path.join(process.cwd(), "gerador-etiquetas-cd", "data");
  if (fs.existsSync(inGerador)) return inGerador;
  const inCwd = path.join(process.cwd(), "data");
  if (!fs.existsSync(inCwd)) {
    try {
      fs.mkdirSync(inCwd, { recursive: true });
    } catch {}
  }
  return inCwd;
}

function getPresetsFilePath(): string {
  return path.join(getDataDir(), "presets.json");
}

function getBatchesFilePath(): string {
  return path.join(getDataDir(), "batches.json");
}

function atomicWrite(filePath: string, data: any): void {
  const temp = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(temp, filePath);
  } catch (err) {
    console.error("Erro na gravacao atomica:", err);
  }
}

// ── PRESETS ─────────────────────────────────────────────────────────────

export async function getServerPresets(): Promise<AddressPreset[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/label_presets?select=*&order=created_at.asc`, {
        headers: getSupabaseHeaders(sb.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || "",
            isCustom: !r.is_default,
            params: r.params,
          }));
        }
        // Se vazio, seed com DEFAULT_PRESETS
        for (const p of DEFAULT_PRESETS) {
          await saveServerPreset(p);
        }
        return DEFAULT_PRESETS;
      }
    } catch (err) {
      console.warn("Aviso ao buscar presets do Supabase:", err);
    }
  }

  try {
    const file = getPresetsFilePath();
    if (!fs.existsSync(file)) return DEFAULT_PRESETS;
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PRESETS;
  }
}

export async function saveServerPreset(preset: AddressPreset): Promise<AddressPreset> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/label_presets`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: preset.id,
          name: preset.name,
          description: preset.description || "",
          is_default: !preset.isCustom,
          params: preset.params,
        }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar preset no Supabase:", err);
    }
  }

  try {
    const file = getPresetsFilePath();
    const current = (await getServerPresets()).filter((p) => p.id !== preset.id);
    current.push(preset);
    atomicWrite(file, current);
  } catch {}
  return preset;
}

export async function deleteServerPreset(id: string): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/label_presets?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getSupabaseHeaders(sb.key),
      });
    } catch (err) {
      console.warn("Aviso ao excluir preset no Supabase:", err);
    }
  }

  try {
    const file = getPresetsFilePath();
    const current = (await getServerPresets()).filter((p) => p.id !== id);
    atomicWrite(file, current);
  } catch {}
}

// ── BATCHES / HISTÓRICO ─────────────────────────────────────────────────

export async function getServerBatches(): Promise<GenerationHistoryItem[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/label_batches?select=*&order=created_at.desc&limit=100`,
        { headers: getSupabaseHeaders(sb.key), cache: "no-store" }
      );
      if (res.ok) {
        const rows = await res.json();
        return rows.map((r: any) => ({
          id: r.id,
          timestamp: r.created_at,
          user: r.user_name || "Operador CD",
          totalGenerated: r.total_labels || 0,
          params: r.params,
          firstCode: r.summary?.firstCode || "",
          lastCode: r.summary?.lastCode || "",
        }));
      }
    } catch (err) {
      console.warn("Aviso ao buscar batches do Supabase:", err);
    }
  }

  try {
    const file = getBatchesFilePath();
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addServerBatch(batch: GenerationHistoryItem): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/label_batches`, {
        method: "POST",
        headers: getSupabaseHeaders(sb.key),
        body: JSON.stringify({
          id: batch.id,
          total_labels: batch.totalGenerated,
          user_name: batch.user || "Operador CD",
          params: batch.params,
          summary: {
            firstCode: batch.firstCode,
            lastCode: batch.lastCode,
          },
          created_at: batch.timestamp || new Date().toISOString(),
        }),
      });
      return;
    } catch (err) {
      console.warn("Aviso ao salvar batch no Supabase:", err);
    }
  }

  try {
    const file = getBatchesFilePath();
    const current = await getServerBatches();
    const updated = [batch, ...current].slice(0, 100);
    atomicWrite(file, updated);
  } catch {}
}

export async function clearServerBatches(): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/label_batches?id=neq.none`, {
        method: "DELETE",
        headers: getSupabaseHeaders(sb.key),
      });
    } catch (err) {
      console.warn("Aviso ao limpar batches no Supabase:", err);
    }
  }

  try {
    const file = getBatchesFilePath();
    atomicWrite(file, []);
  } catch {}
}
