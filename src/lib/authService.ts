import {
  PortalUser,
  AuthSession,
  ModulePermission,
  GeneralSettings,
  PasswordResetRequest,
  AuthenticateResult,
} from "./authTypes";

const USERS_STORAGE_KEY = "collab_log_users_v1";
const SESSION_STORAGE_KEY = "collab_log_session_v1";
const SETTINGS_STORAGE_KEY = "collab_log_settings_v1";
const PASSWORD_RESET_STORAGE_KEY = "collab_log_password_reset_v1";

export const DEFAULT_USERS: PortalUser[] = [
  {
    id: "usr-01",
    name: "Thiago Fragoso",
    email: "admin@collab.com.br",
    password: "Gcoll@b123",
    role: "admin",
    cargo: "Administrador Geral & Operações",
    status: "ativo",
    permissions: ["dashboard", "wms", "rastreamento", "etiquetas", "etiquetas_produto", "usuarios", "configuracoes"],
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
    permissions: ["dashboard", "wms", "rastreamento", "etiquetas", "etiquetas_produto"],
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
    permissions: ["dashboard", "etiquetas", "etiquetas_produto", "wms"],
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
    permissions: ["dashboard", "rastreamento", "etiquetas"],
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
    permissions: ["dashboard", "etiquetas", "rastreamento"],
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
): AuthenticateResult {
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

  // Se o usuário precisa alterar a senha no primeiro acesso / próximo login
  if (user.mustChangePassword) {
    return {
      success: true,
      mustChangePassword: true,
      user,
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

export function completeFirstAccessPasswordChange(
  userId: string,
  newPassword: string,
  remember: boolean = true
): { success: boolean; session?: AuthSession; error?: string } {
  const cleanPassword = newPassword.trim();
  if (!cleanPassword || cleanPassword.length < 4) {
    return {
      success: false,
      error: "A nova senha deve possuir no mínimo 4 caracteres.",
    };
  }

  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: "Usuário não localizado no sistema." };
  }

  const updatedUser: PortalUser = {
    ...user,
    password: cleanPassword,
    mustChangePassword: false,
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

export function toggleUserMustChangePassword(
  userId: string,
  force?: boolean
): { success: boolean; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }
  const nextVal = force !== undefined ? force : !user.mustChangePassword;
  const updatedUser: PortalUser = {
    ...user,
    mustChangePassword: nextVal,
  };
  saveUser(updatedUser);
  return { success: true };
}

export function authenticateWithGoogle(
  googleProfile: {
    email: string;
    name?: string;
    avatar?: string;
  },
  remember: boolean = true
): { success: boolean; session?: AuthSession; error?: string } {
  const cleanEmail = googleProfile.email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "E-mail do Google inválido." };
  }

  const users = getUsers();
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Cadastro automático de conta corporativa Google Workspace
    const userPrefix = cleanEmail.split("@")[0] || "usuario";
    const formattedName =
      googleProfile.name ||
      userPrefix
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    const newUser: PortalUser = {
      id: `usr-g-${Date.now()}`,
      name: formattedName,
      email: cleanEmail,
      role: cleanEmail.includes("admin") ? "admin" : "operador",
      cargo: cleanEmail.includes("admin")
        ? "Administrador Geral (Google Workspace)"
        : "Operador Logístico (Google Workspace)",
      status: "ativo",
      permissions: cleanEmail.includes("admin")
        ? ["dashboard", "wms", "rastreamento", "etiquetas", "usuarios", "configuracoes"]
        : ["dashboard", "wms", "rastreamento", "etiquetas"],
      avatar: googleProfile.avatar,
      unidadeCd: "CD Matriz — Big Master",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    saveUser(newUser);
    user = newUser;
  } else {
    if (user.status !== "ativo") {
      return {
        success: false,
        error: "Este usuário está temporariamente desativado. Contate o administrador do sistema.",
      };
    }
    const updatedUser: PortalUser = {
      ...user,
      avatar: googleProfile.avatar || user.avatar,
      lastLogin: new Date().toISOString(),
    };
    saveUser(updatedUser);
    user = updatedUser;
  }

  const session: AuthSession = {
    user,
    token: `google-sso-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
  if (module === "dashboard") return true;
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

// ── Redefinição de Senha (Esqueci Minha Senha) ─────────────────────────
export function requestPasswordReset(email: string): {
  success: boolean;
  error?: string;
  resetData?: PasswordResetRequest;
} {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Por favor, informe seu e-mail corporativo." };
  }

  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return {
      success: false,
      error: "E-mail não encontrado no cadastro de usuários do portal.",
    };
  }

  if (user.status !== "ativo") {
    return {
      success: false,
      error: "Este usuário está temporariamente desativado. Contate o administrador do sistema.",
    };
  }

  // Gera um código numérico aleatório de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos de validade

  const resetData: PasswordResetRequest = {
    email: user.email,
    userName: user.name,
    token,
    code,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PASSWORD_RESET_STORAGE_KEY, JSON.stringify(resetData));
    } catch (e) {
      console.error("Erro ao salvar solicitação de redefinição:", e);
    }
  }

  return {
    success: true,
    resetData,
  };
}

export function getActiveResetRequest(email: string): PasswordResetRequest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
    if (!raw) return null;
    const data: PasswordResetRequest = JSON.parse(raw);
    if (data.email.toLowerCase() !== email.trim().toLowerCase()) return null;
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(PASSWORD_RESET_STORAGE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    console.error("Erro ao ler dados de redefinição:", e);
    return null;
  }
}

export function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): { success: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanCode) {
    return { success: false, error: "Informe o código de verificação de 6 dígitos." };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: "A nova senha deve possuir pelo menos 4 caracteres." };
  }

  const pending = getActiveResetRequest(cleanEmail);
  if (!pending) {
    return {
      success: false,
      error: "Nenhuma solicitação de redefinição ativa encontrada ou o código expirou. Solicite um novo código.",
    };
  }

  if (pending.code !== cleanCode) {
    return {
      success: false,
      error: "Código de verificação incorreto. Verifique o código recebido no e-mail e tente novamente.",
    };
  }

  // Atualiza a senha no cadastro do usuário
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return { success: false, error: "Usuário não localizado no sistema." };
  }

  const updatedUser: PortalUser = {
    ...user,
    password: newPassword,
  };

  saveUser(updatedUser);

  // Limpa o reset request usado
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(PASSWORD_RESET_STORAGE_KEY);
    } catch (e) {
      console.error("Erro ao limpar dados de redefinição:", e);
    }
  }

  return { success: true };
}
