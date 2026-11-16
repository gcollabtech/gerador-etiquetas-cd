import { PortalUser, AuthSession, ModulePermission, GeneralSettings } from "./authTypes";

const USERS_STORAGE_KEY = "collab_log_users_v1";
const SESSION_STORAGE_KEY = "collab_log_session_v1";
const SETTINGS_STORAGE_KEY = "collab_log_settings_v1";

export const DEFAULT_USERS: PortalUser[] = [
  {
    id: "usr-01",
    name: "Thiago Fragoso",
    email: "admin@collab.com.br",
    password: "Gcoll@b123",
    role: "admin",
    cargo: "Administrador Geral & Operações",
    status: "ativo",
    permissions: ["wms", "rastreamento", "etiquetas", "usuarios", "configuracoes"],
    unidadeCd: "CD Matriz — Big Master",
    telefone: "(11) 98765-4321",
    createdAt: "2026-01-10T08:00:00Z",
    lastLogin: "2026-11-16T16:50:00Z",
  },
  {
    id: "usr-02",
    name: "Carlos Eduardo Silva",
    email: "supervisor@collab.com.br",
    password: "collab123",
    role: "supervisor",
    cargo: "Supervisor de Logística e Armazenagem",
    status: "ativo",
    permissions: ["wms", "rastreamento", "etiquetas"],
    unidadeCd: "CD Matriz — Big Master",
    telefone: "(11) 97654-3210",
    createdAt: "2026-02-15T09:30:00Z",
    lastLogin: "2026-11-16T15:30:00Z",
  },
  {
    id: "usr-03",
    name: "Mariana Costa",
    email: "operador@collab.com.br",
    password: "collab123",
    role: "operador",
    cargo: "Operadora de Centro de Distribuição",
    status: "ativo",
    permissions: ["etiquetas", "wms"],
    unidadeCd: "CD Matriz — Big Master",
    telefone: "(11) 96543-2109",
    createdAt: "2026-03-01T10:15:00Z",
    lastLogin: "2026-11-16T14:20:00Z",
  },
  {
    id: "usr-04",
    name: "Lucas Ferreira",
    email: "rastreamento@collab.com.br",
    password: "collab123",
    role: "operador",
    cargo: "Controlador de Frotas e Rastreamento",
    status: "ativo",
    permissions: ["rastreamento", "etiquetas"],
    unidadeCd: "CD Filial Sul",
    telefone: "(11) 95432-1098",
    createdAt: "2026-04-12T11:00:00Z",
    lastLogin: "2026-11-15T18:45:00Z",
  },
  {
    id: "usr-05",
    name: "Juliana Mendes",
    email: "auditor@collab.com.br",
    password: "collab123",
    role: "visualizador",
    cargo: "Auditora de Qualidade e Inventário",
    status: "ativo",
    permissions: ["etiquetas", "rastreamento"],
    unidadeCd: "CD Matriz — Big Master",
    telefone: "(11) 94321-0987",
    createdAt: "2026-05-20T14:00:00Z",
    lastLogin: "2026-11-14T09:10:00Z",
  },
];

export const DEFAULT_SETTINGS: GeneralSettings = {
  nomePortal: "Collab Log - Portal logistico",
  nomeUnidadeCd: "Centro de Distribuição Big Master / Collab",
  codigoCd: "CD-01-SP",
  cnpjEmpresa: "12.345.678/0001-90",
  enderecoCd: "Av. das Indústrias Logísticas, 1000 - Galpão 4, Barueri - SP",
  formatoPadraoImpressao: "a4_grid",
  larguraPadraoCm: 10,
  alturaPadraoCm: 5,
  autoSaveHistory: true,
  notificacoesAtivas: true,
};

// ── Gestão de Usuários ──────────────────────────────────────────────────
export function getUsers(): PortalUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Sincroniza a nova senha do admin caso já existam dados em localStorage
      const adminIdx = parsed.findIndex((u: PortalUser) => u.email.toLowerCase() === "admin@collab.com.br");
      if (adminIdx >= 0 && parsed[adminIdx].password !== "Gcoll@b123") {
        parsed[adminIdx].password = "Gcoll@b123";
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_USERS;
  } catch (e) {
    console.error("Erro ao ler usuários:", e);
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: PortalUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Erro ao salvar usuários:", e);
  }
}

export function saveUser(user: PortalUser): PortalUser[] {
  const current = getUsers();
  const index = current.findIndex((u) => u.id === user.id);
  let updated: PortalUser[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...user };
  } else {
    updated = [user, ...current];
  }
  saveUsers(updated);
  return updated;
}

export function deleteUser(id: string): { success: boolean; error?: string } {
  const currentSession = getCurrentSession();
  if (currentSession?.user.id === id) {
    return { success: false, error: "Você não pode excluir o usuário que está atualmente conectado." };
  }
  const current = getUsers();
  const updated = current.filter((u) => u.id !== id);
  saveUsers(updated);
  return { success: true };
}

export function toggleUserStatus(id: string): { success: boolean; error?: string } {
  const currentSession = getCurrentSession();
  if (currentSession?.user.id === id) {
    return { success: false, error: "Você não pode inativar seu próprio usuário conectado." };
  }
  const current = getUsers();
  const updated: PortalUser[] = current.map((u) =>
    u.id === id
      ? { ...u, status: u.status === "ativo" ? ("inativo" as const) : ("ativo" as const) }
      : u
  );
  saveUsers(updated);
  return { success: true };
}

// ── Gestão de Sessão & Autenticação ─────────────────────────────────────
export function getCurrentSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (e) {
    console.error("Erro ao ler sessão:", e);
    return null;
  }
}

export function authenticate(
  email: string,
  pass: string,
  remember: boolean = true
): { success: boolean; session?: AuthSession; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return {
      success: false,
      error: "E-mail ou senha incorretos. Verifique suas credenciais.",
    };
  }

  if (user.status !== "ativo") {
    return {
      success: false,
      error: "Este usuário está temporariamente desativado. Contate o administrador do sistema.",
    };
  }

  // Verifica a senha cadastrada para o usuário (Gcoll@b123 para admin ou cadastrada)
  const defaultPass = cleanEmail === "admin@collab.com.br" ? "Gcoll@b123" : "collab123";
  const userPassword = user.password || defaultPass;
  if (pass !== userPassword) {
    return {
      success: false,
      error: "E-mail ou senha incorretos. Verifique suas credenciais.",
    };
  }

  const updatedUser: PortalUser = {
    ...user,
    lastLogin: new Date().toISOString(),
  };

  saveUser(updatedUser);

  const session: AuthSession = {
    user: updatedUser,
    token: `token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    loginTime: new Date().toISOString(),
    remember,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error("Erro ao salvar sessão:", e);
    }
  }

  return { success: true, session };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error("Erro ao fazer logout:", e);
  }
}

export function hasPermission(user: PortalUser | null | undefined, module: ModulePermission): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions.includes(module);
}

// ── Gestão de Configurações Gerais ──────────────────────────────────────
export function getGeneralSettings(): GeneralSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Erro ao ler configurações:", e);
    return DEFAULT_SETTINGS;
  }
}

export function saveGeneralSettings(settings: GeneralSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Erro ao salvar configurações:", e);
  }
}
