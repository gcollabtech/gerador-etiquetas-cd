import fs from "node:fs";
import path from "node:path";
import { PortalUser, PasswordResetRequest } from "./authTypes";
import { DEFAULT_USERS } from "./authService";

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

function toPortalUser(row: any): PortalUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email).toLowerCase(),
    password: row.password ? String(row.password) : undefined,
    role: row.role || "operador",
    cargo: row.cargo || "Operador de CD",
    status: row.status === "inativo" ? "inativo" : "ativo",
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    unidadeCd: row.unidade_cd || "CD Matriz — Big Master",
    telefone: row.telefone || undefined,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at || new Date().toISOString(),
    lastLogin: row.last_login || undefined,
  };
}

function toDbRow(user: PortalUser): Record<string, any> {
  return {
    id: user.id,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    password: user.password || "collab123",
    role: user.role,
    cargo: user.cargo || "Operador de CD",
    status: user.status || "ativo",
    permissions: Array.isArray(user.permissions) ? user.permissions : ["etiquetas"],
    unidade_cd: user.unidadeCd || "CD Matriz — Big Master",
    telefone: user.telefone || null,
    must_change_password: user.mustChangePassword ?? false,
    created_at: user.createdAt || new Date().toISOString(),
    last_login: user.lastLogin || null,
  };
}

// ── Fallback local baseado em sistema de arquivos ───────────────────────
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

function getUsersFilePath(): string {
  return path.join(getDataDir(), "users.json");
}

function getResetsFilePath(): string {
  return path.join(getDataDir(), "resets.json");
}

function atomicWriteJson(filePath: string, data: any): void {
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, content, "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Erro na gravação atômica de ${filePath}:`, err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

function getLocalUsers(): PortalUser[] {
  try {
    const file = getUsersFilePath();
    if (!fs.existsSync(file)) {
      atomicWriteJson(file, DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as PortalUser[];
    }
    return DEFAULT_USERS;
  } catch (err) {
    console.error("Erro ao ler users.json no servidor:", err);
    return DEFAULT_USERS;
  }
}

function saveLocalUsers(users: PortalUser[]): void {
  const file = getUsersFilePath();
  atomicWriteJson(file, users);
}

// ── Operações Principais (Supabase com Fallback Local) ───────────────────

export async function getServerUsers(): Promise<PortalUser[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/portal_users?select=*&order=created_at.desc`, {
        headers: getSupabaseHeaders(sb.key),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(toPortalUser);
        }
        // Se a tabela estiver vazia, faz o seed dos usuários padrão
        await saveServerUsers(DEFAULT_USERS);
        return DEFAULT_USERS;
      }
      console.warn("Supabase retornou erro em getServerUsers:", res.status, await res.text());
    } catch (err) {
      console.warn("Aviso: Falha ao consultar Supabase, usando fallback local:", err);
    }
  }

  return getLocalUsers();
}

export async function saveServerUsers(users: PortalUser[]): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const rows = users.map(toDbRow);
      const res = await fetch(`${sb.url}/rest/v1/portal_users`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(rows),
      });
      if (res.ok) return;
      console.warn("Supabase retornou erro em saveServerUsers:", res.status, await res.text());
    } catch (err) {
      console.warn("Aviso: Falha ao salvar no Supabase, usando fallback local:", err);
    }
  }

  saveLocalUsers(users);
}

export async function saveOrUpdateServerUser(user: PortalUser): Promise<PortalUser[]> {
  const cleanEmail = user.email.trim().toLowerCase();
  const userToSave: PortalUser = {
    ...user,
    email: cleanEmail,
  };

  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const row = toDbRow(userToSave);
      const res = await fetch(`${sb.url}/rest/v1/portal_users`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([row]),
      });
      if (res.ok) {
        return await getServerUsers();
      }
      const errText = await res.text();
      console.error("Erro ao salvar usuário no Supabase:", res.status, errText);
      throw new Error(`Falha no banco de dados Supabase: ${errText}`);
    } catch (err: any) {
      console.error("Erro no Supabase saveOrUpdateServerUser:", err);
      // Se não for erro de rede offline, propaga
      if (sb.key) throw err;
    }
  }

  // Fallback local
  const current = getLocalUsers();
  const idx = current.findIndex(
    (u) => u.id === userToSave.id || u.email.trim().toLowerCase() === cleanEmail
  );
  let updated: PortalUser[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...current[idx], ...userToSave };
  } else {
    updated = [{ ...userToSave }, ...current];
  }
  saveLocalUsers(updated);
  return updated;
}

export async function deleteServerUser(
  id: string
): Promise<{ success: boolean; users: PortalUser[]; error?: string }> {
  const cleanTarget = id.trim().toLowerCase();
  const sb = getSupabaseConfig();

  if (sb) {
    try {
      // Exclui no Supabase tanto se bater pelo id quanto se bater pelo e-mail
      const query = `or=(id.eq.${encodeURIComponent(id)},email.eq.${encodeURIComponent(cleanTarget)})`;
      const res = await fetch(`${sb.url}/rest/v1/portal_users?${query}`, {
        method: "DELETE",
        headers: getSupabaseHeaders(sb.key),
      });

      if (res.ok) {
        const remaining = await getServerUsers();
        return { success: true, users: remaining };
      }

      const errText = await res.text();
      console.error("Erro ao excluir usuário no Supabase:", res.status, errText);
      return { success: false, users: await getServerUsers(), error: errText };
    } catch (err: any) {
      console.error("Exceção ao deletar no Supabase:", err);
      if (sb.key) {
        return { success: false, users: await getServerUsers(), error: err.message };
      }
    }
  }

  // Fallback local
  try {
    const current = getLocalUsers();
    const updated = current.filter(
      (u) => u.id !== id && u.email.trim().toLowerCase() !== cleanTarget
    );
    saveLocalUsers(updated);
    return { success: true, users: updated };
  } catch (err: any) {
    console.error("Erro ao deletar usuário localmente:", err);
    return { success: false, users: getLocalUsers(), error: err.message };
  }
}

export async function mergeServerUsers(incomingUsers: PortalUser[]): Promise<PortalUser[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const rows = incomingUsers.map(toDbRow);
      await fetch(`${sb.url}/rest/v1/portal_users`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(sb.key),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(rows),
      });
      return await getServerUsers();
    } catch (err) {
      console.warn("Aviso ao sincronizar no Supabase:", err);
    }
  }

  const current = getLocalUsers();
  let modified = false;
  const merged = [...current];

  for (const inc of incomingUsers) {
    const cleanEmail = inc.email.trim().toLowerCase();
    const existingIdx = merged.findIndex(
      (u) => u.id === inc.id || u.email.trim().toLowerCase() === cleanEmail
    );
    if (existingIdx === -1) {
      merged.push({ ...inc, email: cleanEmail });
      modified = true;
    } else {
      const existing = merged[existingIdx];
      if (existing) {
        const newPass = inc.password?.trim() || existing.password;
        const updatedObj: PortalUser = {
          ...existing,
          ...inc,
          email: cleanEmail,
          password: newPass,
        };
        if (JSON.stringify(updatedObj) !== JSON.stringify(existing)) {
          merged[existingIdx] = updatedObj;
          modified = true;
        }
      }
    }
  }

  if (modified) {
    saveLocalUsers(merged);
  }
  return merged;
}

// ── Password Resets ──────────────────────────────────────────────────────

export async function getServerResets(): Promise<PasswordResetRequest[]> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const now = new Date().toISOString();
      const res = await fetch(
        `${sb.url}/rest/v1/password_resets?select=*&expires_at=gt.${encodeURIComponent(now)}`,
        { headers: getSupabaseHeaders(sb.key), cache: "no-store" }
      );
      if (res.ok) {
        const rows = await res.json();
        return rows.map((r: any) => ({
          email: r.email,
          userName: r.user_name || r.userName || "",
          token: r.token || r.id,
          code: r.code,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
        }));
      }
    } catch (err) {
      console.warn("Aviso ao ler resets do Supabase:", err);
    }
  }

  try {
    const file = getResetsFilePath();
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((r) => new Date(r.expiresAt).getTime() > Date.now());
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveServerReset(reset: PasswordResetRequest): Promise<void> {
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      // Remove tokens antigos do mesmo email e insere o novo
      await removeServerReset(reset.email);
      await fetch(`${sb.url}/rest/v1/password_resets`, {
        method: "POST",
        headers: getSupabaseHeaders(sb.key),
        body: JSON.stringify({
          id: reset.token,
          email: reset.email.trim().toLowerCase(),
          code: reset.code,
          created_at: reset.createdAt,
          expires_at: reset.expiresAt,
        }),
      });
      return;
    } catch (err) {
      console.warn("Aviso ao salvar reset no Supabase:", err);
    }
  }

  try {
    const file = getResetsFilePath();
    const current = (await getServerResets()).filter(
      (r) =>
        r.email.toLowerCase() !== reset.email.toLowerCase() &&
        new Date(r.expiresAt).getTime() > Date.now()
    );
    current.push(reset);
    atomicWriteJson(file, current);
  } catch (err) {
    console.error("Erro ao salvar reset:", err);
  }
}

export async function getActiveServerReset(email: string): Promise<PasswordResetRequest | null> {
  const cleanEmail = email.trim().toLowerCase();
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const now = new Date().toISOString();
      const query = `email=eq.${encodeURIComponent(cleanEmail)}&expires_at=gt.${encodeURIComponent(now)}&order=created_at.desc&limit=1`;
      const res = await fetch(`${sb.url}/rest/v1/password_resets?${query}`, {
        headers: getSupabaseHeaders(sb.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            email: r.email,
            userName: r.user_name || r.userName || "",
            token: r.token || r.id,
            code: r.code,
            createdAt: r.created_at,
            expiresAt: r.expires_at,
          };
        }
        return null;
      }
    } catch (err) {
      console.warn("Aviso ao consultar reset no Supabase:", err);
    }
  }

  const resets = await getServerResets();
  return (
    resets.find(
      (r) =>
        r.email.toLowerCase() === cleanEmail &&
        new Date(r.expiresAt).getTime() > Date.now()
    ) || null
  );
}

export async function removeServerReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(
        `${sb.url}/rest/v1/password_resets?email=eq.${encodeURIComponent(cleanEmail)}`,
        { method: "DELETE", headers: getSupabaseHeaders(sb.key) }
      );
      return;
    } catch (err) {
      console.warn("Aviso ao remover reset no Supabase:", err);
    }
  }

  try {
    const file = getResetsFilePath();
    const current = (await getServerResets()).filter(
      (r) => r.email.toLowerCase() !== cleanEmail
    );
    atomicWriteJson(file, current);
  } catch (err) {
    console.error("Erro ao remover reset:", err);
  }
}
