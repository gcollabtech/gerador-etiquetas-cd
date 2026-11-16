"use client";

import {
  Sliders,
  Calculator,
  Eye,
  Grid3X3,
  Printer,
  History,
  CheckCircle2,
  LayoutDashboard,
  Sun,
  Moon,
  Barcode,
  Layers,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export type PortalTopic =
  | "config"
  | "summary"
  | "preview"
  | "labels"
  | "print"
  | "history"
  | "tests"
  | "all";

export interface NavItem {
  id: PortalTopic;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
  highlight?: boolean;
}

interface SidebarProps {
  activeTopic: PortalTopic;
  onSelectTopic: (topic: PortalTopic) => void;
  totalGenerated: number;
  selectedCount: number;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  larguraCm?: number | "";
  alturaCm?: number | "";
}

export function Sidebar({
  activeTopic,
  onSelectTopic,
  totalGenerated,
  selectedCount,
  isMobileOpen,
  onToggleMobile,
  theme,
  onToggleTheme,
  larguraCm = 10,
  alturaCm = 5,
}: SidebarProps) {
  const wCm = Number(larguraCm) > 0 ? Number(larguraCm) : 10;
  const hCm = Number(alturaCm) > 0 ? Number(alturaCm) : 5;

  const navItems: NavItem[] = [
    {
      id: "config",
      title: "1. Parâmetros & Configuração",
      subtitle: "Ruas, prédios, aptos e níveis",
      icon: Sliders,
    },
    {
      id: "summary",
      title: "2. Resumo & Cálculo",
      subtitle: "Matriz e total de endereços",
      icon: Calculator,
      badge: totalGenerated > 0 ? `${totalGenerated} un` : undefined,
    },
    {
      id: "preview",
      title: "3. Prévia da Etiqueta",
      subtitle: `${wCm} × ${hCm} cm e setas`,
      icon: Eye,
      highlight: true,
    },
    {
      id: "labels",
      title: "4. Grade de Etiquetas",
      subtitle: "Seleção, filtros e busca",
      icon: Grid3X3,
      badge: selectedCount > 0 ? `${selectedCount}/${totalGenerated}` : totalGenerated,
    },
    {
      id: "print",
      title: "5. Central de Impressão & PDF",
      subtitle: "Exportar PDF e térmica",
      icon: Printer,
    },
    {
      id: "history",
      title: "6. Histórico de Gerações",
      subtitle: "Auditoria e restauração",
      icon: History,
    },
    {
      id: "tests",
      title: "7. Critérios de Aceite",
      subtitle: "Validação oficial 1 a 6",
      icon: CheckCircle2,
    },
    {
      id: "all",
      title: "Visão Completa",
      subtitle: "Todas as seções em página única",
      icon: LayoutDashboard,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[var(--card)] border-r border-[var(--card-border)] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header: Collab Logo in top-left */}
        <div className="p-4 sm:p-5 border-b border-[var(--card-border)] bg-[var(--card)]/80 flex items-center justify-between shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200 inline-block w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-collab.png"
                alt="Grupo Collab"
                className="h-7 w-auto object-contain block"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--collab-mostarda)]">
                PORTAL CD
              </span>
              <span className="text-[10px] text-[var(--muted)]">•</span>
              <span className="text-[10px] font-mono text-[var(--muted)]">
                Etiquetas Code 128
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status card */}
        <div className="p-3 mx-3 my-2.5 rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF6400] animate-pulse" />
            <span className="text-[11px] font-semibold text-[var(--foreground)]">
              Sistema Operacional
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#FF6400]/15 text-[#FF6400] px-1.5 py-0.5 rounded">
            {wCm} × {hCm} cm
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-1">
            Módulos do Sistema
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTopic === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTopic(item.id);
                  if (isMobileOpen) onToggleMobile();
                }}
                className={`w-full text-left rounded-lg p-2.5 transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? "bg-[#FF6400] text-white font-bold shadow-sm shadow-orange-500/20"
                    : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--card)] border border-[var(--card-border)] text-[#FF6400] group-hover:border-[#FF6400]"
                    }`}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs truncate ${
                        isActive ? "text-white font-bold" : "text-[var(--foreground)] font-semibold"
                      }`}
                    >
                      {item.title}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? "text-white/85" : "text-[var(--muted)]"
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-black/30 text-white"
                          : "bg-[var(--card)] text-[var(--muted)] border border-[var(--card-border)]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      isActive ? "text-white translate-x-0.5" : "text-[var(--muted)] opacity-50 group-hover:opacity-100"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Quick summary stats in sidebar */}
        {totalGenerated > 0 && (
          <div className="p-3 mx-3 mb-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>Lote Atual:</span>
              <strong className="font-mono text-[var(--foreground)]">{totalGenerated} etiquetas</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>Selecionadas:</span>
              <strong className="font-mono text-[var(--collab-mostarda)]">{selectedCount} selecionadas</strong>
            </div>
            <div className="w-full bg-[var(--secondary)] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[var(--collab-mostarda)] h-full transition-all"
                style={{
                  width: `${totalGenerated > 0 ? (selectedCount / totalGenerated) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer controls: Theme toggle & version */}
        <div className="p-3.5 border-t border-[var(--card-border)] bg-[var(--card)]/90 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[var(--foreground)]">
              Collab CD • v1.0
            </span>
            <span className="text-[9px] text-[var(--muted)]">
              Code 128 Subset B
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
            title="Alternar modo claro / escuro"
          >
            {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-600" />}
            <span className="text-[11px]">{theme === "dark" ? "Claro" : "Escuro"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
