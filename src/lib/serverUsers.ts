import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { PortalUser, PasswordResetRequest } from "./authTypes";
import { DEFAULT_USERS } from "./authService";

const CANONICAL_DATA_DIR = "/Users/fragoso/Documents/collab-finance/collab-finance/gerador-etiquetas-cd/data";

function getResolvedDataDir(): string {
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

function getDbPath(): string {
  const dir = getResolvedDataDir();
  return path.join(dir, "collab.sqlite");
}

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDbPath();
    dbInstance = new DatabaseSync(dbPath);
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        cargo TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ativo',
        permissions TEXT NOT NULL,
        unidade_cd TEXT,
        telefone TEXT,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_login TEXT
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT PRIMARY KEY,
        user_name TEXT,
        token TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
    `);

    // Semeia usuários se a tabela estiver vazia
    try {
      const countRow = dbInstance.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number } | undefined;
      if (!countRow || countRow.count === 0) {
        const jsonFile = path.join(path.dirname(dbPath), "users.json");
        let usersToSeed = DEFAULT_USERS;
        if (fs.existsSync(jsonFile)) {
          try {
            const raw = fs.readFileSync(jsonFile, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              usersToSeed = parsed;
            }
          } catch {}
        }

        const insertStmt = dbInstance.prepare(`
          INSERT OR REPLACE INTO users (
            id, name, email, password, cargo, role, status, permissions,
            unidade_cd, telefone, must_change_password, created_at, last_login
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const u of usersToSeed) {
          insertStmt.run(
            u.id,
            u.name,
            u.email.trim().toLowerCase(),
            u.password || "collab123",
            u.cargo || "Operador de CD",
            u.role || "operador",
            u.status || "ativo",
            JSON.stringify(u.permissions || []),
            u.unidadeCd || "CD Matriz — Big Master",
            u.telefone || null,
            u.mustChangePassword ? 1 : 0,
            u.createdAt || new Date().toISOString(),
            u.lastLogin || null
          );
        }
      }
    } catch (e) {
      console.error("Erro ao semear banco SQLite:", e);
    }
  }
  return dbInstance;
}

function rowToUser(row: any): PortalUser {
  let perms: any[] = [];
  try {
    perms = JSON.parse(row.permissions);
  } catch {
    perms = [];
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    cargo: row.cargo,
    role: row.role,
    status: row.status,
    permissions: perms,
    unidadeCd: row.unidade_cd || undefined,
    telefone: row.telefone || undefined,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
    lastLogin: row.last_login || undefined,
  };
}

function syncJsonBackup(users: PortalUser[]): void {
  try {
    const dir = getResolvedDataDir();
    const jsonFile = path.join(dir, "users.json");
    fs.writeFileSync(jsonFile, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao sincronizar backup users.json:", err);
  }
}

export function getServerUsers(): PortalUser[] {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(rowToUser);
    }
    return DEFAULT_USERS;
  } catch (err) {
    console.error("Erro ao ler usuários do SQLite:", err);
    return DEFAULT_USERS;
  }
}

export function saveServerUsers(users: PortalUser[]): void {
  try {
    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, password, cargo, role, status, permissions,
        unidade_cd, telefone, must_change_password, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of users) {
      insertStmt.run(
        u.id,
        u.name,
        u.email.trim().toLowerCase(),
        u.password || "collab123",
        u.cargo || "Operador de CD",
        u.role || "operador",
        u.status || "ativo",
        JSON.stringify(u.permissions || []),
        u.unidadeCd || "CD Matriz — Big Master",
        u.telefone || null,
        u.mustChangePassword ? 1 : 0,
        u.createdAt || new Date().toISOString(),
        u.lastLogin || null
      );
    }
    syncJsonBackup(users);
  } catch (err) {
    console.error("Erro ao gravar usuários no SQLite:", err);
  }
}

export function saveOrUpdateServerUser(user: PortalUser): PortalUser[] {
  const db = getDb();
  const cleanEmail = user.email.trim().toLowerCase();

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, name, email, password, cargo, role, status, permissions,
      unidade_cd, telefone, must_change_password, created_at, last_login
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    user.id,
    user.name.trim(),
    cleanEmail,
    user.password || "collab123",
    user.cargo || "Operador de CD",
    user.role || "operador",
    user.status || "ativo",
    JSON.stringify(user.permissions || []),
    user.unidadeCd || "CD Matriz — Big Master",
    user.telefone || null,
    user.mustChangePassword ? 1 : 0,
    user.createdAt || new Date().toISOString(),
    user.lastLogin || null
  );

  const updated = getServerUsers();
  syncJsonBackup(updated);
  return updated;
}

export function deleteServerUser(id: string): { success: boolean; users: PortalUser[]; error?: string } {
  try {
    const db = getDb();
    const deleteStmt = db.prepare("DELETE FROM users WHERE id = ?");
    deleteStmt.run(id);

    const updated = getServerUsers();
    syncJsonBackup(updated);
    return { success: true, users: updated };
  } catch (err: any) {
    console.error("Erro ao deletar usuário no SQLite:", err);
    return { success: false, users: getServerUsers(), error: err.message };
  }
}

export function mergeServerUsers(incomingUsers: PortalUser[]): PortalUser[] {
  for (const inc of incomingUsers) {
    saveOrUpdateServerUser(inc);
  }
  return getServerUsers();
}

export function getServerResets(): PasswordResetRequest[] {
  try {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const rows = db.prepare("SELECT * FROM password_resets WHERE expires_at > ?").all(nowIso) as any[];
    return rows.map((r) => ({
      email: r.email,
      userName: r.user_name,
      token: r.token,
      code: r.code,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    }));
  } catch (err) {
    console.error("Erro ao ler resets do SQLite:", err);
    return [];
  }
}

export function saveServerReset(reset: PasswordResetRequest): void {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO password_resets (email, user_name, token, code, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      reset.email.trim().toLowerCase(),
      reset.userName || null,
      reset.token,
      reset.code,
      reset.createdAt,
      reset.expiresAt
    );
  } catch (err) {
    console.error("Erro ao salvar reset no SQLite:", err);
  }
}

export function getActiveServerReset(email: string): PasswordResetRequest | null {
  try {
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const nowIso = new Date().toISOString();
    const row = db.prepare(
      "SELECT * FROM password_resets WHERE email = ? AND expires_at > ? LIMIT 1"
    ).get(cleanEmail, nowIso) as any;

    if (!row) return null;
    return {
      email: row.email,
      userName: row.user_name,
      token: row.token,
      code: row.code,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  } catch {
    return null;
  }
}

export function removeServerReset(email: string): void {
  try {
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    db.prepare("DELETE FROM password_resets WHERE email = ?").run(cleanEmail);
  } catch (err) {
    console.error("Erro ao remover reset do SQLite:", err);
  }
}
