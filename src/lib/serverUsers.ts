import fs from "node:fs";
import path from "node:path";
import { PortalUser, PasswordResetRequest } from "./authTypes";
import { DEFAULT_USERS } from "./authService";

function getResolvedPaths() {
  const canonical = "/Users/fragoso/Documents/collab-finance/collab-finance/gerador-etiquetas-cd/data";
  const possibleDirs = [
    canonical,
    path.join(process.cwd(), "gerador-etiquetas-cd", "data"),
    path.join(process.cwd(), "data"),
  ];

  let selectedDir = possibleDirs.find((d) => fs.existsSync(d));

  if (!selectedDir) {
    if (fs.existsSync(canonical)) {
      selectedDir = canonical;
    } else if (fs.existsSync(path.join(process.cwd(), "gerador-etiquetas-cd"))) {
      selectedDir = path.join(process.cwd(), "gerador-etiquetas-cd", "data");
    } else {
      selectedDir = path.join(process.cwd(), "data");
    }
    try {
      fs.mkdirSync(selectedDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  const usersFile = path.join(selectedDir, "users.json");
  const resetsFile = path.join(selectedDir, "resets.json");

  return { dir: selectedDir, usersFile, resetsFile, allDirs: possibleDirs };
}

function ensureDataDir(): string {
  const { dir } = getResolvedPaths();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getServerUsers(): PortalUser[] {
  try {
    const { usersFile } = getResolvedPaths();
    if (!fs.existsSync(usersFile)) {
      ensureDataDir();
      fs.writeFileSync(usersFile, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
      return DEFAULT_USERS;
    }
    const raw = fs.readFileSync(usersFile, "utf-8");
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
    const { usersFile, allDirs } = getResolvedPaths();
    const content = JSON.stringify(users, null, 2);
    fs.writeFileSync(usersFile, content, "utf-8");

    // Espelha para os outros diretórios válidos que possam existir
    for (const d of allDirs) {
      if (fs.existsSync(d)) {
        const target = path.join(d, "users.json");
        if (target !== usersFile) {
          try {
            fs.writeFileSync(target, content, "utf-8");
          } catch {
            // ignore
          }
        }
      }
    }
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
    const { resetsFile } = getResolvedPaths();
    if (!fs.existsSync(resetsFile)) {
      return [];
    }
    const raw = fs.readFileSync(resetsFile, "utf-8");
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
    const { resetsFile, allDirs } = getResolvedPaths();
    const current = getServerResets().filter(
      (r) =>
        r.email.toLowerCase() !== reset.email.toLowerCase() &&
        new Date(r.expiresAt).getTime() > Date.now()
    );
    current.push(reset);
    const content = JSON.stringify(current, null, 2);
    fs.writeFileSync(resetsFile, content, "utf-8");

    for (const d of allDirs) {
      if (fs.existsSync(d)) {
        const target = path.join(d, "resets.json");
        if (target !== resetsFile) {
          try {
            fs.writeFileSync(target, content, "utf-8");
          } catch {
            // ignore
          }
        }
      }
    }
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
    const { resetsFile, allDirs } = getResolvedPaths();
    const cleanEmail = email.trim().toLowerCase();
    const current = getServerResets().filter(
      (r) => r.email.toLowerCase() !== cleanEmail
    );
    const content = JSON.stringify(current, null, 2);
    fs.writeFileSync(resetsFile, content, "utf-8");

    for (const d of allDirs) {
      if (fs.existsSync(d)) {
        const target = path.join(d, "resets.json");
        if (target !== resetsFile) {
          try {
            fs.writeFileSync(target, content, "utf-8");
          } catch {
            // ignore
          }
        }
      }
    }
  } catch (err) {
    console.error("Erro ao remover reset do servidor:", err);
  }
}
