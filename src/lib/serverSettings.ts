import fs from "node:fs";
import path from "node:path";
import { GeneralSettings } from "./authTypes";
import { DEFAULT_SETTINGS } from "./authService";

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

function getSettingsFilePath(): string {
  return path.join(getDataDir(), "settings.json");
}

function getLocalSettings(): GeneralSettings {
  try {
    const file = getSettingsFilePath();
    if (!fs.existsSync(file)) return DEFAULT_SETTINGS;
    const raw = fs.readFileSync(file, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveLocalSettings(settings: GeneralSettings): void {
  try {
    const file = getSettingsFilePath();
    const tempPath = `${file}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(settings, null, 2), "utf-8");
    fs.renameSync(tempPath, file);
  } catch (e) {
    console.error("Erro ao salvar settings localmente:", e);
  }
}

export async function getServerSettings(): Promise<GeneralSettings> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/system_settings?id=eq.global&select=settings`, {
        headers: getSupabaseHeaders(sb.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].settings) {
          return { ...DEFAULT_SETTINGS, ...rows[0].settings };
        }
        // Se a tabela estiver vazia, inicializa com DEFAULT_SETTINGS
        await saveServerSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (err) {
      console.warn("Aviso ao consultar system_settings no Supabase:", err);
    }
  }

  return getLocalSettings();
}

export async function saveServerSettings(settings: GeneralSettings): Promise<GeneralSettings> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/system_settings`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: "global",
          settings,
          updated_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        return settings;
      }
    } catch (err) {
      console.warn("Aviso ao salvar system_settings no Supabase:", err);
    }
  }

  saveLocalSettings(settings);
  return settings;
}
