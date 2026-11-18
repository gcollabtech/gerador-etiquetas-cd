import fs from "node:fs";
import path from "node:path";
import { PortalUser, PasswordResetRequest } from "./authTypes";
import { DEFAULT_USERS } from "./authService";

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
  const dir = getDataDir();
  return path.join(dir, "users.json");
}

function getResetsFilePath(): string {
  const dir = getDataDir();
  return path.join(dir, "resets.json");
}

// Escrita atômica via arquivo temporário + renomeação para evitar corrupção e concorrência sem bloqueio de arquivos
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

export function getServerUsers(): PortalUser[] {
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

export function saveServerUsers(users: PortalUser[]): void {
  const file = getUsersFilePath();
  atomicWriteJson(file, users);
}

export function saveOrUpdateServerUser(user: PortalUser): PortalUser[] {
  const current = getServerUsers();
  const cleanEmail = user.email.trim().toLowerCase();
  const idx = current.findIndex(
    (u) => u.id === user.id || u.email.trim().toLowerCase() === cleanEmail
  );
  let updated: PortalUser[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...current[idx], ...user, email: cleanEmail };
  } else {
    updated = [{ ...user, email: cleanEmail }, ...current];
  }
  saveServerUsers(updated);
  return updated;
}

export function deleteServerUser(id: string): { success: boolean; users: PortalUser[]; error?: string } {
  try {
    const current = getServerUsers();
    const cleanTarget = id.trim().toLowerCase();
    const updated = current.filter(
      (u) => u.id !== id && u.email.trim().toLowerCase() !== cleanTarget
    );
    saveServerUsers(updated);
    return { success: true, users: updated };
  } catch (err: any) {
    console.error("Erro ao deletar usuário:", err);
    return { success: false, users: getServerUsers(), error: err.message };
  }
}

export function mergeServerUsers(incomingUsers: PortalUser[]): PortalUser[] {
  const current = getServerUsers();
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
    saveServerUsers(merged);
  }
  return merged;
}

export function getServerResets(): PasswordResetRequest[] {
  try {
    const file = getResetsFilePath();
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((r) => new Date(r.expiresAt).getTime() > Date.now());
    }
    return [];
  } catch (err) {
    console.error("Erro ao ler resets.json:", err);
    return [];
  }
}

export function saveServerReset(reset: PasswordResetRequest): void {
  try {
    const file = getResetsFilePath();
    const current = getServerResets().filter(
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

export function getActiveServerReset(email: string): PasswordResetRequest | null {
  const cleanEmail = email.trim().toLowerCase();
  const resets = getServerResets();
  const found = resets.find(
    (r) =>
      r.email.toLowerCase() === cleanEmail &&
      new Date(r.expiresAt).getTime() > Date.now()
  );
  return found || null;
}

export function removeServerReset(email: string): void {
  try {
    const file = getResetsFilePath();
    const cleanEmail = email.trim().toLowerCase();
    const current = getServerResets().filter(
      (r) => r.email.toLowerCase() !== cleanEmail
    );
    atomicWriteJson(file, current);
  } catch (err) {
    console.error("Erro ao remover reset:", err);
  }
}
