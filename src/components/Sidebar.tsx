"use client";

import { useState } from "react";
import { MainPortalModule, PortalUser } from "@/lib/authTypes";
import {
  Boxes,
  Truck,
  Barcode,
  Users,
  Settings,
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
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
  ShieldCheck,
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

export interface MainMenuItem {
  id: MainPortalModule;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export interface SubTopicItem {
  id: PortalTopic;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  activeModule: MainPortalModule;
  onSelectModule: (mod: MainPortalModule) => void;
  activeTopic: PortalTopic;
  onSelectTopic: (topic: PortalTopic) => void;
  currentUser: PortalUser;
  onLogout: () => void;
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
  activeModule,
  onSelectModule,
  activeTopic,
  onSelectTopic,
  currentUser,
  onLogout,
  totalGenerated,
  selectedCount,
  isMobileOpen,
  onToggleMobile,
  theme,
  onToggleTheme,
  larguraCm = 10,
  alturaCm = 5,
}: SidebarProps) {
  const [etiquetasMenuExpanded, setEtiquetasMenuExpanded] = useState(true);

  const wCm = Number(larguraCm) > 0 ? Number(larguraCm) : 10;
  const hCm = Number(alturaCm) > 0 ? Number(alturaCm) : 5;

  const mainMenuItems: MainMenuItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      subtitle: "Indicadores, CD e gestão",
      icon: LayoutDashboard,
      badge: "Geral",
    },
    {
      id: "wms",
      title: "1. WMS",
      subtitle: "Warehouse Management",
      icon: Boxes,
      badge: "Em Breve",
    },
    {
      id: "rastreamento",
      title: "2. Rastreamento",
      subtitle: "Torre de controle & frotas",
      icon: Truck,
      badge: "Em Breve",
    },
    {
      id: "etiquetas",
      title: "3. Gerador de etiquetas CD",
      subtitle: "Endereçamento Code 128",
      icon: Barcode,
      badge: totalGenerated > 0 ? `${totalGenerated} un` : undefined,
    },
    {
      id: "usuarios",
      title: "4. Usuários",
      subtitle: "Cadastros & permissões",
      icon: Users,
    },
    {
      id: "configuracoes",
      title: "5. Configurações Gerais",
      subtitle: "Parâmetros do portal",
      icon: Settings,
    },
  ];

  const subTopicItems: SubTopicItem[] = [
    { id: "config", title: "1. Parâmetros & Configuração", icon: Sliders },
    { id: "summary", title: "2. Resumo & Cálculo", icon: Calculator, badge: totalGenerated > 0 ? totalGenerated : undefined },
    { id: "preview", title: `3. Prévia (${wCm}×${hCm}cm)`, icon: Eye },
    { id: "labels", title: "4. Grade de Etiquetas", icon: Grid3X3, badge: selectedCount > 0 ? `${selectedCount}/${totalGenerated}` : undefined },
    { id: "print", title: "5. Central de Impressão & PDF", icon: Printer },
    { id: "history", title: "6. Histórico de Gerações", icon: History },
    { id: "tests", title: "7. Critérios de Aceite", icon: CheckCircle2 },
    { id: "all", title: "Visão Completa", icon: LayoutDashboard },
  ];

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
        {/* Top Header: Collab Log Logo on top-left */}
        <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm border border-gray-200 inline-block shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-collab-log.png"
                alt="Grupo Collab Log"
                className="h-8 w-auto object-contain block"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-1 flex items-center justify-between">
            <span>Menu Principal</span>
            <span className="text-[9px] font-mono font-normal">CD-01</span>
          </div>

          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isMainActive = activeModule === item.id;
            const isEtiquetas = item.id === "etiquetas";

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectModule(item.id);
                    if (isEtiquetas) {
                      setEtiquetasMenuExpanded(true);
                    }
                    if (isMobileOpen && !isEtiquetas) {
                      onToggleMobile();
                    }
                  }}
                  className={`w-full text-left rounded-xl p-2.5 transition-all flex items-center justify-between group cursor-pointer ${
                    isMainActive
                      ? "bg-[#FF6400] text-white font-bold shadow-sm shadow-orange-500/20"
                      : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isMainActive
                          ? "bg-white/20 text-white"
                          : "bg-[var(--card)] border border-[var(--card-border)] text-[#FF6400] group-hover:border-[#FF6400]"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`text-xs truncate ${
                          isMainActive ? "text-white font-bold" : "text-[var(--foreground)] font-semibold"
                        }`}
                      >
                        {item.title}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isMainActive ? "text-white/85" : "text-[var(--muted)]"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isMainActive
                            ? "bg-black/30 text-white"
                            : "bg-[var(--secondary)] text-[var(--collab-mostarda)] border border-[var(--card-border)]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isEtiquetas ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEtiquetasMenuExpanded(!etiquetasMenuExpanded);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            setEtiquetasMenuExpanded(!etiquetasMenuExpanded);
                          }
                        }}
                        className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                        title="Expandir/recolher subtópicos"
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isMainActive ? "text-white" : "text-[var(--muted)]"
                          } ${etiquetasMenuExpanded ? "" : "-rotate-90"}`}
                        />
                      </span>
                    ) : (
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${
                          isMainActive
                            ? "text-white translate-x-0.5"
                            : "text-[var(--muted)] opacity-40 group-hover:opacity-100"
                        }`}
                      />
                    )}
                  </div>
                </button>

                {/* Subtopics for "Gerador de etiquetas CD" */}
                {isEtiquetas && isMainActive && etiquetasMenuExpanded && (
                  <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-[var(--collab-mostarda)]/50 ml-5 my-1 animate-fadeIn">
                    {subTopicItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTopic === sub.id;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            onSelectTopic(sub.id);
                            if (isMobileOpen) onToggleMobile();
                          }}
                          className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSubActive
                              ? "bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] font-bold border border-[var(--collab-mostarda)]/30"
                              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <SubIcon size={13} className={isSubActive ? "text-[var(--collab-mostarda)]" : "opacity-60"} />
                            <span className="truncate">{sub.title}</span>
                          </div>

                          {sub.badge !== undefined && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)]">
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[var(--card-border)] bg-[var(--secondary)]/60 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--collab-mostarda)] text-black font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-[var(--foreground)] block truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-[var(--muted)] block truncate -mt-0.5">
                  {currentUser.cargo}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
              title="Encerrar sessão (Logout)"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span className="font-mono text-[10px] text-[var(--collab-mostarda)]">
              Collab Log v2.0
            </span>

            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer text-[10px] font-medium"
            >
              {theme === "dark" ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-slate-600" />}
              <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
