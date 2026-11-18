import fs from "node:fs";
import path from "node:path";
import { EntregaAgendamento, BloqueioJanela } from "./wmsTypes";
import { SEED_AGENDAMENTOS, SEED_BLOQUEIOS } from "./wmsService";

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

function getAgendamentosFilePath(): string {
  return path.join(getDataDir(), "wms_agendamentos.json");
}

function getBloqueiosFilePath(): string {
  return path.join(getDataDir(), "wms_bloqueios.json");
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

// ── AGENDAMENTOS ────────────────────────────────────────────────────────

export async function getServerAgendamentos(): Promise<EntregaAgendamento[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/wms_agendamentos?select=*&order=created_at.desc`, {
        headers: getSupabaseHeaders(sb.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r.payload,
            id: r.id,
            protocolo: r.protocolo,
            data: r.data,
            janela: r.janela,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
        // Se vazio, seed inicial
        for (const item of SEED_AGENDAMENTOS) {
          await saveOrUpdateServerAgendamento(item);
        }
        return SEED_AGENDAMENTOS;
      }
    } catch (err) {
      console.warn("Aviso ao buscar agendamentos do Supabase:", err);
    }
  }

  try {
    const file = getAgendamentosFilePath();
    if (!fs.existsSync(file)) return SEED_AGENDAMENTOS;
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return SEED_AGENDAMENTOS;
  }
}

export async function saveOrUpdateServerAgendamento(
  agendamento: EntregaAgendamento
): Promise<EntregaAgendamento> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/wms_agendamentos`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: agendamento.id,
          protocolo: agendamento.protocolo,
          data: agendamento.data,
          janela: agendamento.janela,
          status: agendamento.status,
          payload: agendamento,
          created_at: agendamento.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar agendamento no Supabase:", err);
    }
  }

  try {
    const file = getAgendamentosFilePath();
    const current = (await getServerAgendamentos()).filter((a) => a.id !== agendamento.id);
    current.push(agendamento);
    atomicWrite(file, current);
  } catch {}

  return agendamento;
}

export async function deleteServerAgendamento(id: string): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/wms_agendamentos?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getSupabaseHeaders(sb.key),
      });
    } catch (err) {
      console.warn("Aviso ao excluir agendamento no Supabase:", err);
    }
  }

  try {
    const file = getAgendamentosFilePath();
    const current = (await getServerAgendamentos()).filter((a) => a.id !== id);
    atomicWrite(file, current);
  } catch {}
}

// ── BLOQUEIOS ───────────────────────────────────────────────────────────

export async function getServerBloqueios(): Promise<BloqueioJanela[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/wms_bloqueios?select=*&order=created_at.desc`, {
        headers: getSupabaseHeaders(sb.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r.payload,
            id: r.id,
            data: r.data,
            janela: r.janela || undefined,
            docaId: r.doca_id || undefined,
            motivo: r.motivo,
            createdAt: r.created_at,
          }));
        }
        for (const item of SEED_BLOQUEIOS) {
          await saveOrUpdateServerBloqueio(item);
        }
        return SEED_BLOQUEIOS;
      }
    } catch (err) {
      console.warn("Aviso ao buscar bloqueios do Supabase:", err);
    }
  }

  try {
    const file = getBloqueiosFilePath();
    if (!fs.existsSync(file)) return SEED_BLOQUEIOS;
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return SEED_BLOQUEIOS;
  }
}

export async function saveOrUpdateServerBloqueio(
  bloqueio: BloqueioJanela
): Promise<BloqueioJanela> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/wms_bloqueios`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: bloqueio.id,
          data: bloqueio.data,
          janela: bloqueio.janela || null,
          doca_id: bloqueio.docaId || null,
          motivo: bloqueio.motivo,
          payload: bloqueio,
          created_at: bloqueio.createdAt || new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar bloqueio no Supabase:", err);
    }
  }

  try {
    const file = getBloqueiosFilePath();
    const current = (await getServerBloqueios()).filter((b) => b.id !== bloqueio.id);
    current.push(bloqueio);
    atomicWrite(file, current);
  } catch {}

  return bloqueio;
}

export async function deleteServerBloqueio(id: string): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/wms_bloqueios?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getSupabaseHeaders(sb.key),
      });
    } catch (err) {
      console.warn("Aviso ao excluir bloqueio no Supabase:", err);
    }
  }

  try {
    const file = getBloqueiosFilePath();
    const current = (await getServerBloqueios()).filter((b) => b.id !== id);
    atomicWrite(file, current);
  } catch {}
}
