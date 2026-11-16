"use client";

import { useState } from "react";
import { authenticate } from "@/lib/authService";
import { AuthSession } from "@/lib/authTypes";
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
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden select-none">
      {/* Background decoration elements with Collab Orange touches */}
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

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Card */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
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
              <p className="text-xs text-[var(--muted)] max-w-xs mx-auto pt-1">
                Acesse o portal logístico para gerenciar WMS, rastreamento e etiquetas de armazenagem.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-start gap-2.5 text-xs text-[var(--danger)] font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <span>Manter conectado neste navegador</span>
                </label>
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
