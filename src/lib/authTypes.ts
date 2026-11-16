export type UserRole = "admin" | "supervisor" | "operador" | "visualizador";

export type ModulePermission =
  | "dashboard"
  | "wms"
  | "rastreamento"
  | "etiquetas"
  | "usuarios"
  | "configuracoes";

export type MainPortalModule = ModulePermission;

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  cargo: string;
  status: "ativo" | "inativo";
  permissions: ModulePermission[];
  avatar?: string;
  telefone?: string;
  unidadeCd?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: PortalUser;
  token: string;
  loginTime: string;
  remember: boolean;
}

export interface PasswordResetRequest {
  email: string;
  userName: string;
  token: string;
  code: string;
  createdAt: string;
  expiresAt: string;
}

export interface GeneralSettings {
  nomePortal: string;
  nomeUnidadeCd: string;
  codigoCd: string;
  cnpjEmpresa: string;
  enderecoCd: string;
  formatoPadraoImpressao: "a4_grid" | "thermal";
  larguraPadraoCm: number;
  alturaPadraoCm: number;
  autoSaveHistory: boolean;
  notificacoesAtivas: boolean;
}
