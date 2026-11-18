"use client";

import { useState, useEffect } from "react";
import { GeneralSettings } from "@/lib/authTypes";
import {
  getGeneralSettings,
  saveGeneralSettings,
  syncGeneralSettingsFromServer,
  saveGeneralSettingsAsync,
} from "@/lib/authService";
import {
  Settings,
  Building,
  Save,
  CheckCircle2,
  Sliders,
  Printer,
  Moon,
  Sun,
  Shield,
  RotateCcw,
} from "lucide-react";

interface GeneralSettingsPortalViewProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function GeneralSettingsPortalView({
  theme,
  onToggleTheme,
}: GeneralSettingsPortalViewProps) {
  const [settings, setSettings] = useState<GeneralSettings>(() => getGeneralSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    syncGeneralSettingsFromServer().then((latest) => {
      setSettings(latest);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await saveGeneralSettingsAsync(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Settings size={15} className="text-[var(--collab-mostarda)]" />
            <span>Collab Log • Módulo 05</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[var(--foreground)] mt-0.5">
            Configurações Gerais do Portal Logístico
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Defina informações da unidade CD, preferências padrão de impressão e configurações operacionais.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
            <CheckCircle2 size={15} />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Unidade CD e Empresa */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Building size={16} className="text-[var(--collab-mostarda)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
              1. Dados do Centro de Distribuição & Empresa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Nome do Portal:
              </label>
              <input
                type="text"
                required
                value={settings.nomePortal}
                onChange={(e) => setSettings({ ...settings, nomePortal: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Nome da Unidade de CD:
              </label>
              <input
                type="text"
                required
                value={settings.nomeUnidadeCd}
                onChange={(e) => setSettings({ ...settings, nomeUnidadeCd: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Código Interno do CD:
              </label>
              <input
                type="text"
                required
                value={settings.codigoCd}
                onChange={(e) => setSettings({ ...settings, codigoCd: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                CNPJ da Operação:
              </label>
              <input
                type="text"
                value={settings.cnpjEmpresa}
                onChange={(e) => setSettings({ ...settings, cnpjEmpresa: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Endereço Físico do Galpão:
              </label>
              <input
                type="text"
                value={settings.enderecoCd}
                onChange={(e) => setSettings({ ...settings, enderecoCd: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
              />
            </div>
          </div>
        </div>

        {/* Padrões de Impressão */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Printer size={16} className="text-[var(--collab-mostarda)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
              2. Parâmetros Padrão de Etiquetas de Armazenagem
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Formato Preferencial:
              </label>
              <select
                value={settings.formatoPadraoImpressao}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    formatoPadraoImpressao: e.target.value as "a4_grid" | "thermal",
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] cursor-pointer"
              >
                <option value="a4_grid">Folha A4 (Múltiplas Etiquetas)</option>
                <option value="thermal">Bobina Térmica Contínua</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Largura Padrão (cm):
              </label>
              <input
                type="number"
                step="0.5"
                min="3"
                max="30"
                value={settings.larguraPadraoCm}
                onChange={(e) =>
                  setSettings({ ...settings, larguraPadraoCm: parseFloat(e.target.value) || 10 })
                }
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--foreground)]">
                Altura Padrão (cm):
              </label>
              <input
                type="number"
                step="0.5"
                min="2"
                max="30"
                value={settings.alturaPadraoCm}
                onChange={(e) =>
                  setSettings({ ...settings, alturaPadraoCm: parseFloat(e.target.value) || 5 })
                }
                className="w-full px-3.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Interface e Tema */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Sliders size={16} className="text-[var(--collab-mostarda)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
              3. Interface do Usuário & Auditoria
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] block">
                Tema Visual da Aplicação:
              </span>
              <span className="text-xs text-[var(--muted)]">
                Alternar entre Modo Claro (padrão corporativo branco/preto/laranja) e Modo Escuro.
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-xs font-bold text-[var(--foreground)] transition-all cursor-pointer w-fit"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-heading font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Save size={15} />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
}
