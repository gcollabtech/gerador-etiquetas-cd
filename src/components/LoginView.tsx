"use client";

import { useState } from "react";
import {
  authenticate,
  requestPasswordReset,
  resetPasswordWithCode,
} from "@/lib/authService";
import { AuthSession, PasswordResetRequest } from "@/lib/authTypes";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Truck,
  Boxes,
  Barcode,
  ArrowLeft,
  CheckCircle2,
  Send,
  KeyRound,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

type AuthViewMode =
  | "login"
  | "forgot_request"
  | "email_sent"
  | "reset_password"
  | "reset_success";

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  // Navigation mode
  const [viewMode, setViewMode] = useState<AuthViewMode>("login");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password & reset state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetData, setResetData] = useState<PasswordResetRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = authenticate(email, password, remember);
      setLoading(false);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setError(res.error || "Falha na autenticação.");
      }
    }, 350);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = requestPasswordReset(forgotEmail);
      setLoading(false);
      if (res.success && res.resetData) {
        setResetData(res.resetData);
        setResetCode(res.resetData.code); // Pré-carrega o código para conveniência
        setViewMode("email_sent");
      } else {
        setError(res.error || "Não foi possível solicitar a redefinição de senha.");
      }
    }, 400);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As senhas digitadas não coincidem. Digite novamente.");
      return;
    }

    if (newPassword.length < 4) {
      setError("A nova senha deve ter no mínimo 4 caracteres.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = resetPasswordWithCode(forgotEmail, resetCode, newPassword);
      setLoading(false);
      if (res.success) {
        // Sucesso! Atualiza o email para o login e limpa senhas
        setEmail(forgotEmail);
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setViewMode("reset_success");
      } else {
        setError(res.error || "Falha ao redefinir a senha.");
      }
    }, 400);
  };

  const handleCopyCode = () => {
    if (resetData?.code) {
      navigator.clipboard.writeText(resetData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden select-none">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--collab-mostarda)]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-black/10 dark:bg-white/5 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-collab.png"
              alt="Grupo Collab"
              className="h-6 w-auto object-contain block"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--foreground)]">
            <ShieldCheck size={13} className="text-[var(--collab-mostarda)]" />
            <span>Ambiente Seguro • CD-01</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-[460px] space-y-5">
          {/* Card */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Logo */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200 inline-flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-collab.png"
                    alt="Grupo Collab"
                    className="h-10 w-auto object-contain block"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-start gap-2.5 text-xs text-[var(--danger)] font-medium animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. TELA DE LOGIN */}
            {viewMode === "login" && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                    Acesse o portal logístico para gerenciar WMS, rastreamento e etiquetas de armazenagem.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      E-mail Corporativo:
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@collab.com.br"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] focus:ring-1 focus:ring-[var(--collab-mostarda)] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      Senha de Acesso:
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] focus:ring-1 focus:ring-[var(--collab-mostarda)] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1"
                        title={showPassword ? "Ocultar senha" : "Exibir senha"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="accent-[var(--collab-mostarda)] rounded"
                      />
                      <span>Manter conectado</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setForgotEmail(email);
                        setViewMode("forgot_request");
                      }}
                      className="text-xs font-semibold text-[var(--collab-mostarda)] hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-pulse">Autenticando sessão...</span>
                    ) : (
                      <>
                        <LogIn size={16} />
                        <span>Acessar o Portal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 2. TELA: SOLICITAR REDEFINIÇÃO DE SENHA */}
            {viewMode === "forgot_request" && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-[var(--foreground)] font-heading">
                    Esqueceu sua senha?
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Informe seu e-mail corporativo cadastrado para receber as instruções e o código de redefinição.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      E-mail Corporativo:
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="usuario@collab.com.br"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] focus:ring-1 focus:ring-[var(--collab-mostarda)] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-pulse">Enviando e-mail...</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Enviar Código de Redefinição</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setViewMode("login");
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-medium pt-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Voltar para o login</span>
                  </button>
                </form>
              </div>
            )}

            {/* 3. TELA: E-MAIL DISPARADO COM SUCESSO (PREVIEW DO DISPARO) */}
            {viewMode === "email_sent" && resetData && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
                    <CheckCircle2 size={24} />
                  </div>
                  <h2 className="text-base font-bold text-[var(--foreground)] font-heading">
                    E-mail Enviado!
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Enviamos um e-mail de redefinição para:
                  </p>
                  <p className="text-xs font-semibold text-[var(--foreground)] bg-[var(--collab-mostarda)]/10 px-2 py-1 rounded inline-block">
                    {resetData.email}
                  </p>
                </div>

                {/* Card de visualização do e-mail disparado */}
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4 space-y-3 text-left shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2 text-[11px] text-[var(--muted)]">
                    <span className="truncate">
                      <strong>De:</strong> no-reply@collab.com.br
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      Disparado
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--muted)]">
                    <strong>Assunto:</strong> [Collab Log] Redefinição de Senha de Acesso
                  </div>

                  <div className="pt-2 text-xs space-y-2 text-[var(--foreground)]">
                    <p>
                      Olá, <strong>{resetData.userName}</strong>!
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">
                      Recebemos uma solicitação de redefinição de senha para a sua conta no Collab Log. Use o código abaixo para criar sua nova senha:
                    </p>

                    {/* Código em destaque com botão de cópia */}
                    <div className="p-3 bg-[var(--card)] border border-[var(--card-border)] rounded-lg flex items-center justify-between my-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider block">
                          Código de Verificação
                        </span>
                        <span className="text-lg font-mono font-black tracking-widest text-[var(--collab-mostarda)]">
                          {resetData.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] transition-all cursor-pointer"
                        title="Copiar código"
                      >
                        {copiedCode ? (
                          <>
                            <Check size={13} className="text-emerald-500" />
                            <span className="text-emerald-500 text-[11px]">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span className="text-[11px]">Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-[var(--muted)] italic">
                      * Este código expira em 15 minutos. Se não solicitou, ignore esta mensagem.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setViewMode("reset_password");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <KeyRound size={16} />
                    <span>Digitar Código e Nova Senha</span>
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleForgotSubmit(new Event("submit") as unknown as React.FormEvent)}
                      className="text-[var(--muted)] hover:text-[var(--foreground)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reenviar código</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setViewMode("login");
                      }}
                      className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      Voltar ao login
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TELA: CADASTRAR NOVA SENHA */}
            {viewMode === "reset_password" && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-base font-bold text-[var(--foreground)] font-heading">
                    Criar Nova Senha
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Informe o código de 6 dígitos enviado para <strong>{forgotEmail}</strong> e cadastre sua nova senha.
                  </p>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      Código de Verificação (6 dígitos):
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-full text-center tracking-widest text-lg py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--collab-mostarda)] focus:outline-none focus:border-[var(--collab-mostarda)] focus:ring-1 focus:ring-[var(--collab-mostarda)] transition-all font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      Nova Senha:
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] focus:ring-1 focus:ring-[var(--collab-mostarda)] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--foreground)] block">
                      Confirmar Nova Senha:
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] focus:ring-1 focus:ring-[var(--collab-mostarda)] transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-pulse">Atualizando senha...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Salvar Nova Senha</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setViewMode("login");
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-medium pt-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Cancelar e voltar ao login</span>
                  </button>
                </form>
              </div>
            )}

            {/* 5. TELA: SUCESSO NA REDEFINIÇÃO */}
            {viewMode === "reset_success" && (
              <div className="space-y-5 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[var(--foreground)] font-heading">
                    Senha Redefinida com Sucesso!
                  </h2>
                  <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                    Sua nova credencial foi gravada no sistema. Você já pode se conectar utilizando a nova senha cadastrada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setViewMode("login");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>Fazer Login Agora</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Feature Pills */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-[var(--muted)] font-medium">
            <div className="p-2 rounded-lg bg-[var(--card)]/60 border border-[var(--card-border)] flex flex-col items-center gap-1">
              <Boxes size={14} className="text-[var(--collab-mostarda)]" />
              <span>WMS Integrado</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--card)]/60 border border-[var(--card-border)] flex flex-col items-center gap-1">
              <Truck size={14} className="text-[var(--collab-mostarda)]" />
              <span>Rastreamento</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--card)]/60 border border-[var(--card-border)] flex flex-col items-center gap-1">
              <Barcode size={14} className="text-[var(--collab-mostarda)]" />
              <span>Etiquetas CD</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[var(--card-border)] bg-[var(--card)]/80 text-center text-[11px] text-[var(--muted)] z-10">
        <p>
          © 2026 Grupo Collab — Collab Log • Portal Logístico de Centros de Distribuição
        </p>
      </footer>
    </div>
  );
}
