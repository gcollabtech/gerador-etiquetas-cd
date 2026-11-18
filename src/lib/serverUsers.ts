import fs from "node:fs";
import path from "node:path";
import { PortalUser, PasswordResetRequest } from "./authTypes";
import { DEFAULT_USERS } from "./authService";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const RESETS_FILE = path.join(DATA_DIR, "resets.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getServerUsers(): PortalUser[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
      return DEFAULT_USERS;
    }
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
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
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao gravar users.json no servidor:", err);
  }
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
  const current = getServerUsers();
  const updated = current.filter((u) => u.id !== id);
  saveServerUsers(updated);
  return { success: true, users: updated };
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
      // Se a senha ou status foi atualizado mais recentemente
      const existing = merged[existingIdx];
      if (
        existing &&
        inc.password &&
        inc.password !== existing.password &&
        inc.password !== "collab123" &&
        inc.password !== "Gcoll@b123"
      ) {
        merged[existingIdx] = { ...existing, ...inc, email: cleanEmail };
        modified = true;
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
    ensureDataDir();
    if (!fs.existsSync(RESETS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(RESETS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as PasswordResetRequest[];
    }
    return [];
  } catch (err) {
    console.error("Erro ao ler resets.json no servidor:", err);
    return [];
  }
}

export function saveServerReset(reset: PasswordResetRequest): void {
  try {
    ensureDataDir();
    const current = getServerResets().filter(
      (r) =>
        r.email.toLowerCase() !== reset.email.toLowerCase() &&
        new Date(r.expiresAt).getTime() > Date.now()
    );
    current.push(reset);
    fs.writeFileSync(RESETS_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar resets.json no servidor:", err);
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
    ensureDataDir();
    const cleanEmail = email.trim().toLowerCase();
    const current = getServerResets().filter(
      (r) => r.email.toLowerCase() !== cleanEmail
    );
    fs.writeFileSync(RESETS_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao remover reset do servidor:", err);
  }
}
