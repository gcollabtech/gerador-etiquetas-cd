"use client";

import { useState, useEffect } from "react";
import { PortalUser, UserRole, ModulePermission } from "@/lib/authTypes";
import {
  getUsers,
  saveUser,
  saveUserAsync,
  deleteUser,
  deleteUserAsync,
  toggleUserStatus,
  toggleUserMustChangePassword,
  syncUsersFromServer,
} from "@/lib/authService";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Boxes,
  Truck,
  Barcode,
  Tag,
  Settings,
  LayoutDashboard,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

interface UsersPortalViewProps {
  currentUser: PortalUser;
}

export function UsersPortalView({ currentUser }: UsersPortalViewProps) {
  const [users, setUsers] = useState<PortalUser[]>(() => getUsers());
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formCargo, setFormCargo] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("operador");
  const [formStatus, setFormStatus] = useState<"ativo" | "inativo">("ativo");
  const [formUnidade, setFormUnidade] = useState("CD Matriz — Big Master");
  const [formTelefone, setFormTelefone] = useState("");
  const [formMustChangePassword, setFormMustChangePassword] = useState(true);
  const [formPermissions, setFormPermissions] = useState<ModulePermission[]>([
    "etiquetas",
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    syncUsersFromServer().then((latest) => {
      if (Array.isArray(latest) && latest.length > 0) {
        setUsers(latest);
      }
    });
  }, []);

  const refreshList = () => {
    syncUsersFromServer().then((latest) => {
      setUsers(latest);
    });
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setShowFormPassword(false);
    setFormCargo("Operador de Centro de Distribuição");
    setFormRole("operador");
    setFormStatus("ativo");
    setFormUnidade("CD Matriz — Big Master");
    setFormTelefone("");
    setFormMustChangePassword(true);
    setFormPermissions(["etiquetas", "etiquetas_produto"]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: PortalUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || "");
    setShowFormPassword(false);
    setFormCargo(user.cargo);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormUnidade(user.unidadeCd || "CD Matriz — Big Master");
    setFormTelefone(user.telefone || "");
    setFormMustChangePassword(user.mustChangePassword ?? false);
    setFormPermissions(user.permissions);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (perm: ModulePermission) => {
    if (formPermissions.includes(perm)) {
      setFormPermissions(formPermissions.filter((p) => p !== perm));
    } else {
      setFormPermissions([...formPermissions, perm]);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    if (role === "admin") {
      setFormPermissions([
        "dashboard",
        "wms",
        "rastreamento",
        "etiquetas",
        "etiquetas_produto",
        "usuarios",
        "configuracoes",
      ]);
    } else if (role === "supervisor") {
      setFormPermissions([
        "dashboard",
        "wms",
        "rastreamento",
        "etiquetas",
        "etiquetas_produto",
      ]);
    } else if (role === "operador") {
      setFormPermissions([
        "dashboard",
        "etiquetas",
        "etiquetas_produto",
        "wms",
      ]);
    } else if (role === "visualizador") {
      setFormPermissions([
        "dashboard",
        "etiquetas",
        "etiquetas_produto",
        "rastreamento",
      ]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formEmail.trim()) {
      setFormError("Nome e e-mail são obrigatórios.");
      return;
    }

    if (!editingUser && !formPassword.trim()) {
      setFormError("A senha de acesso é obrigatória para cadastrar um novo usuário.");
      return;
    }

    if (formPassword.trim() && formPassword.trim().length < 4) {
      setFormError("A senha deve ter no mínimo 4 caracteres.");
      return;
    }

    const emailClean = formEmail.trim().toLowerCase();
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === emailClean &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (existing) {
      setFormError("Já existe um usuário cadastrado com este e-mail.");
      return;
    }

    const userToSave: PortalUser = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: formName.trim(),
      email: emailClean,
      password: formPassword.trim() || editingUser?.password || "collab123",
      mustChangePassword: formMustChangePassword,
      cargo: formCargo.trim() || "Operador de CD",
      role: formRole,
      status: formStatus,
      permissions: formPermissions,
      unidadeCd: formUnidade.trim() || "CD Matriz — Big Master",
      telefone: formTelefone.trim() || undefined,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      lastLogin: editingUser?.lastLogin,
    };

    setIsSaving(true);
    try {
      const res = await saveUserAsync(userToSave);
      if (res.success) {
        if (Array.isArray(res.users) && res.users.length > 0) {
          setUsers(res.users);
        } else {
          setUsers(getUsers());
        }
        setIsModalOpen(false);
      } else {
        setFormError(res.error || "Não foi possível gravar o usuário no sistema.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      setFormError(err.message || "Erro inesperado ao salvar usuário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMustChangePassword = async (id: string, name: string, force: boolean) => {
    const msg = force
      ? `Deseja exigir a alteração de senha de "${name}" no próximo login?`
      : `Deseja dispensar a troca obrigatória de senha de "${name}"?`;
    if (confirm(msg)) {
      toggleUserMustChangePassword(id, force);
      setUsers(getUsers());
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAsync(userToDelete.id);
      if (!res.success) {
        alert(res.error || "Não foi possível excluir o usuário.");
      } else {
        if (res.users && Array.isArray(res.users)) {
          setUsers(res.users);
        } else {
          setUsers(getUsers());
        }
        setUserToDelete(null);
      }
    } catch (err: any) {
      alert(err.message || "Erro inesperado ao excluir usuário.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = (id: string) => {
    const res = toggleUserStatus(id);
    if (!res.success) {
      alert(res.error || "Não foi possível alterar o status do usuário.");
    } else {
      setUsers(getUsers());
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === "ativo").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const operatorCount = users.filter(
    (u) => u.role === "operador" || u.role === "supervisor"
  ).length;

  const moduleNames: Record<ModulePermission, { label: string; icon: any }> = {
    dashboard: { label: "Dashboard", icon: LayoutDashboard },
    wms: { label: "WMS", icon: Boxes },
    rastreamento: { label: "Rastreamento", icon: Truck },
    etiquetas: { label: "Etiquetas CD", icon: Barcode },
    etiquetas_produto: { label: "Etiquetas Produto (EAN-13)", icon: Tag },
    usuarios: { label: "Usuários", icon: Users },
    configuracoes: { label: "Configurações", icon: Settings },
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[var(--collab-mostarda)]" />
            <span>Controle de Acessos & Permissionamento</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[var(--foreground)] mt-0.5">
            Cadastro de Usuários e Perfis do Collab Log
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Gerencie os operadores do CD, supervisores e defina permissões de acesso por módulo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-heading font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Total de Usuários</span>
          <span className="font-heading text-2xl font-black text-[var(--foreground)]">
            {totalUsers}
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Cadastrados no portal</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Usuários Ativos</span>
          <span className="font-heading text-2xl font-black text-emerald-500">
            {activeCount}
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Com acesso liberado</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Administradores</span>
          <span className="font-heading text-2xl font-black text-[var(--collab-mostarda)]">
            {adminCount}
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Gestão completa</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Operação & Supervisão</span>
          <span className="font-heading text-2xl font-black text-[var(--foreground)]">
            {operatorCount}
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Equipe de CD</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
            <SlidersHorizontal size={13} />
            <span>Perfil:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] cursor-pointer"
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin">Administrador</option>
            <option value="supervisor">Supervisor</option>
            <option value="operador">Operador CD</option>
            <option value="visualizador">Visualizador</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Somente Ativos</option>
            <option value="inativo">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--secondary)] border-b border-[var(--card-border)] text-[var(--muted)] uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Cargo & Unidade</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Módulos Liberados</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                    Nenhum usuário encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--secondary)]/50 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              u.role === "admin"
                                ? "bg-[var(--collab-mostarda)] text-black"
                                : "bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)]"
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] px-1.5 py-0.2 rounded font-semibold">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[var(--muted)] font-mono block">
                              {u.email}
                            </span>
                            {u.mustChangePassword && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded-md mt-1">
                                <KeyRound size={10} /> 1º acesso pendente (troca de senha)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cargo & Unidade */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[var(--foreground)] block">
                          {u.cargo}
                        </span>
                        <span className="text-[11px] text-[var(--muted)] block">
                          {u.unidadeCd || "CD Matriz"}
                        </span>
                      </td>

                      {/* Perfil/Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-[var(--collab-mostarda)] text-black"
                              : u.role === "supervisor"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : u.role === "operador"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {u.role === "admin"
                            ? "Admin"
                            : u.role === "supervisor"
                            ? "Supervisor"
                            : u.role === "operador"
                            ? "Operador CD"
                            : "Visualizador"}
                        </span>
                      </td>

                      {/* Permissions tags */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {u.permissions.map((p) => {
                            const mod = moduleNames[p];
                            const ModIcon = mod?.icon || Boxes;
                            return (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--card-border)] text-[10px] font-medium text-[var(--foreground)]"
                              >
                                <ModIcon size={10} className="text-[var(--collab-mostarda)]" />
                                <span>{mod?.label || p}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u.id)}
                          disabled={isCurrent}
                          title={isCurrent ? "Não é possível alterar seu próprio status" : "Alternar status"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            u.status === "ativo"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:opacity-80"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 hover:opacity-80"
                          } ${isCurrent ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        >
                          {u.status === "ativo" ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>Ativo</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              <span>Inativo</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleMustChangePassword(
                                u.id,
                                u.name,
                                !u.mustChangePassword
                              )
                            }
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              u.mustChangePassword
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                                : "bg-transparent border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                            }`}
                            title={
                              u.mustChangePassword
                                ? "Troca de senha pendente: Clique para dispensar exigência"
                                : "Exigir alteração de senha no próximo login deste usuário"
                            }
                          >
                            <KeyRound size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                            title="Editar dados e permissões"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                : "text-[var(--muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            }`}
                            title={isCurrent ? "Você não pode excluir sua própria conta" : "Excluir usuário"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)]">
                  {editingUser ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[var(--foreground)]">
                    {editingUser ? "Editar Usuário & Permissões" : "Cadastrar Novo Usuário"}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Defina credenciais de acesso e autorizações por módulo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] font-medium flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Nome Completo:
                  </label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    E-mail Corporativo:
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="usuario@collab.com.br"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--foreground)]">
                      {editingUser ? "Senha de Acesso (Deixe em branco para manter a atual):" : "Senha de Acesso:"}
                    </label>
                    <span className="text-[10px] text-[var(--muted)]">Mínimo 4 caracteres</span>
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required={!editingUser}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUser ? "•••••••• (senha cadastrada mantida)" : "Digite a senha de login do usuário"}
                      className="w-full pl-9 pr-9 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1 cursor-pointer"
                      title={showFormPassword ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showFormPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* Exigir alteração de senha no primeiro acesso / próximo login */}
                <div className="sm:col-span-2 p-3 rounded-lg bg-[var(--secondary)]/70 border border-[var(--card-border)] flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="formMustChangePassword"
                    checked={formMustChangePassword}
                    onChange={(e) => setFormMustChangePassword(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[var(--collab-mostarda)] border-[var(--card-border)] focus:ring-[var(--collab-mostarda)] cursor-pointer accent-[var(--collab-mostarda)]"
                  />
                  <label htmlFor="formMustChangePassword" className="text-xs text-[var(--foreground)] cursor-pointer select-none">
                    <span className="font-bold flex items-center gap-1.5 text-[var(--foreground)]">
                      <KeyRound size={13} className="text-[var(--collab-mostarda)]" />
                      Exigir alteração de senha no primeiro acesso / próximo login
                    </span>
                    <span className="block text-[11px] text-[var(--muted)] mt-0.5">
                      Ao efetuar login, o sistema exigirá obrigatoriamente que o usuário cadastre sua própria senha pessoal antes de acessar o portal.
                    </span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Ex: Operador Logístico"
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Unidade do CD:
                  </label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={formUnidade}
                      onChange={(e) => setFormUnidade(e.target.value)}
                      placeholder="CD Matriz — Big Master"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Perfil de Acesso (Função Geral):
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-medium cursor-pointer"
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="supervisor">Supervisor de Operações</option>
                    <option value="operador">Operador de CD</option>
                    <option value="visualizador">Visualizador (Auditoria)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Status da Conta:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "ativo" | "inativo")}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-medium cursor-pointer"
                  >
                    <option value="ativo">Ativo (Acesso Liberado)</option>
                    <option value="inativo">Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Module Permissions Matrix */}
              <div className="pt-3 border-t border-[var(--card-border)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider block">
                    Permissionamento por Módulo:
                  </label>
                  <span className="text-[11px] text-[var(--muted)]">
                    Marque os módulos autorizados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      {
                        key: "dashboard",
                        label: "Dashboard Inicial",
                        desc: "Indicadores, estrutura do CD e gestão",
                        icon: LayoutDashboard,
                      },
                      {
                        key: "wms",
                        label: "1. WMS",
                        desc: "Recebimento, armazenagem e inventário",
                        icon: Boxes,
                      },
                      {
                        key: "rastreamento",
                        label: "2. Rastreamento",
                        desc: "Monitoramento de cargas e entregas",
                        icon: Truck,
                      },
                      {
                        key: "etiquetas",
                        label: "3. Gerador de Etiquetas CD",
                        desc: "Emissão de etiquetas de armazenagem R/P/A/N",
                        icon: Barcode,
                      },
                      {
                        key: "etiquetas_produto",
                        label: "4. Etiquetas de Produto",
                        desc: "Impressão térmica de código de barras EAN-13",
                        icon: Tag,
                      },
                      {
                        key: "usuarios",
                        label: "5. Gestão de Usuários",
                        desc: "Controle de cadastros e permissões",
                        icon: Users,
                      },
                      {
                        key: "configuracoes",
                        label: "6. Configurações Gerais",
                        desc: "Preferências de sistema e unidade de CD",
                        icon: Settings,
                      },
                    ] as const
                  ).map((m) => {
                    const isChecked = formPermissions.includes(m.key);
                    const MIcon = m.icon;
                    return (
                      <div
                        key={m.key}
                        onClick={() => handleTogglePermission(m.key)}
                        className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] text-[var(--foreground)]"
                            : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="accent-[var(--collab-mostarda)] mt-0.5 pointer-events-none"
                        />
                        <div className="flex-1 text-xs">
                          <strong className="block font-bold flex items-center gap-1.5">
                            <MIcon size={13} className="text-[var(--collab-mostarda)]" />
                            <span>{m.label}</span>
                          </strong>
                          <span className="text-[11px] opacity-75 block">{m.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-heading font-black uppercase tracking-wider rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : editingUser ? (
                    "Salvar Alterações"
                  ) : (
                    "Cadastrar Usuário"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Confirm Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">Excluir Usuário</h3>
                <p className="text-xs text-[var(--muted)]">Esta ação é irreversível</p>
              </div>
            </div>
            <p className="text-xs text-[var(--foreground)] leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o cadastro de <strong>{userToDelete.name}</strong> do sistema e banco de dados?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-heading font-black uppercase tracking-wider rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
