"use client";

import { useState, useEffect, useMemo } from "react";
import { Sidebar, PortalTopic, WmsSubTab } from "@/components/Sidebar";
import { ConfigPanel } from "@/components/ConfigPanel";
import { GenerationSummaryCard } from "@/components/GenerationSummaryCard";
import { LabelPreview } from "@/components/LabelPreview";
import { LabelsGrid } from "@/components/LabelsGrid";
import { PrintModal } from "@/components/PrintModal";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { TestAcceptanceModal } from "@/components/TestAcceptanceModal";
import { PrintPortalView } from "@/components/PrintPortalView";
import { HistoryPortalView } from "@/components/HistoryPortalView";
import { AcceptanceTestsPortalView } from "@/components/AcceptanceTestsPortalView";
import { LoginView } from "@/components/LoginView";
import { DashboardPortalView } from "@/components/DashboardPortalView";
import { UsersPortalView } from "@/components/UsersPortalView";
import { WmsPortalView } from "@/components/WmsPortalView";
import { TrackingPortalView } from "@/components/TrackingPortalView";
import { GeneralSettingsPortalView } from "@/components/GeneralSettingsPortalView";
import { ProductBarcodeView } from "@/components/ProductBarcodeView";

import { getCurrentSession, logout, hasPermission, getUsers, syncUsersFromServer } from "@/lib/authService";
import { AuthSession, MainPortalModule } from "@/lib/authTypes";

import {
  AddressParams,
  StorageAddress,
  AddressPreset,
  GenerationHistoryItem,
} from "@/lib/types";
import {
  validateAddressParams,
  calculateGenerationSummary,
  generateStorageAddresses,
} from "@/lib/addressGenerator";
import {
  getHistory,
  saveHistoryItem,
  clearHistory,
  getPresets,
  saveCustomPreset,
  updateCustomPreset,
  deletePreset,
  getLastParams,
  saveLastParams,
  resetPresetsToDefault,
  DEFAULT_PRESETS,
  syncPresetsFromServer,
  syncHistoryFromServer,
  saveHistoryItemAsync,
  clearHistoryAsync,
  saveCustomPresetAsync,
  deletePresetAsync,
} from "@/lib/historyStorage";
import { generateCode128Svg } from "@/lib/code128";
import {
  Menu,
  Play,
  Printer,
  Sliders,
  Layers,
  ChevronRight,
  Sparkles,
  Barcode,
  ShieldAlert,
  Boxes,
  Truck,
  Users,
  Settings,
  Save,
} from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeModule, setActiveModule] = useState<MainPortalModule>("dashboard");
  const [activeTopic, setActiveTopic] = useState<PortalTopic>("config");
  const [activeWmsTab, setActiveWmsTab] = useState<WmsSubTab>("janelas");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  const [params, setParams] = useState<AddressParams>({
    ruaInicio: "R01",
    ruaFim: "R02",
    predioInicio: "P01",
    predioFim: "P02",
    aptoInicio: "A01",
    aptoFim: "A10",
    nivelInicio: "N01",
    nivelFim: "N04",
    qtdAptos: 10,
    qtdNiveis: 4,
    larguraCm: 10,
    alturaCm: 5,
    fonteFamilia: "Helvetica",
    tamanhoFontePt: 16,
    alturaCodigoBarrasMm: 20,
  });

  const [addresses, setAddresses] = useState<StorageAddress[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAddress, setPreviewAddress] = useState<StorageAddress | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSelectedOnly, setPrintSelectedOnly] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAcceptanceTestsOpen, setIsAcceptanceTestsOpen] = useState(false);

  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [presets, setPresets] = useState<AddressPreset[]>(DEFAULT_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string | null>("exemplo-cd-160");
  const [isSaveModelModalOpen, setIsSaveModelModalOpen] = useState(false);

  useEffect(() => {
    const rawTheme = localStorage.getItem("cd-labels-theme");
    const initialTheme: "dark" | "light" = rawTheme === "dark" ? "light" : (rawTheme as "light") || "light";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    localStorage.setItem("cd-labels-theme", initialTheme);

    const currentSess = getCurrentSession();
    if (currentSess) {
      const allUsers = getUsers();
      const freshUser = allUsers.find((u) => u.id === currentSess.user.id);
      if (freshUser && freshUser.mustChangePassword) {
        logout();
        setSession(null);
      } else {
        setSession(currentSess);
      }
    } else {
      setSession(null);
    }
    setIsAuthChecking(false);

    // Sincroniza usuários, presets e histórico de lotes do servidor em background
    syncUsersFromServer();
    syncPresetsFromServer().then((latest) => setPresets(latest));
    syncHistoryFromServer().then((latest) => setHistory(latest));

    // Recupera os últimos parâmetros parametrizados pelo usuário
    const savedLastParams = getLastParams();
    const effectiveParams = savedLastParams ? { ...params, ...savedLastParams } : params;
    if (savedLastParams) {
      setParams(effectiveParams);
    }

    try {
      const initialBatch = generateStorageAddresses({
        ruaInicio: effectiveParams.ruaInicio || "R01",
        ruaFim: effectiveParams.ruaFim || "R02",
        predioInicio: effectiveParams.predioInicio || "P01",
        predioFim: effectiveParams.predioFim || "P02",
        aptoInicio: effectiveParams.aptoInicio || "A01",
        aptoFim: effectiveParams.aptoFim || "A10",
        nivelInicio: effectiveParams.nivelInicio || "N01",
        nivelFim: effectiveParams.nivelFim || "N04",
      });
      setAddresses(initialBatch);
      // As etiquetas geradas na tela iniciam desmarcadas para que o usuário selecione as que deseja imprimir
      setSelectedIds(new Set());
      if (initialBatch[0]) {
        setPreviewAddress(initialBatch[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Mantém os parâmetros de etiqueta salvos continuamente para novas impressões
  useEffect(() => {
    saveLastParams(params);
  }, [params]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cd-labels-theme", next);
  };

  const validation = useMemo(() => validateAddressParams(params), [params]);
  const summary = useMemo(() => calculateGenerationSummary(params), [params]);

  const handleGenerate = () => {
    try {
      const generated = generateStorageAddresses(params);
      setAddresses(generated);
      // As etiquetas geradas na tela iniciam desmarcadas para que o usuário selecione as desejadas
      setSelectedIds(new Set());
      if (generated[0]) {
        setPreviewAddress(generated[0]);
      }

      saveHistoryItemAsync({
        user: session?.user.name || "Operador CD",
        params,
        totalGenerated: generated.length,
        firstCode: generated[0]?.code || "",
        lastCode: generated[generated.length - 1]?.code || "",
      }).then(() => {
        setHistory(getHistory());
      });

      // If user is in config or summary, jump to preview or labels to view results
      if (activeTopic === "config" || activeTopic === "summary") {
        setActiveTopic("preview");
      }
    } catch (err: any) {
      alert(`Erro na geração: ${err.message || err}`);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(addresses.map((a) => a.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectRange = (startIdx: number, endIdx: number) => {
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    const target = addresses.filter((a) => a.index >= min && a.index <= max);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of target) {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleSelectPreset = (preset: AddressPreset) => {
    setActivePresetId(preset.id);
    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));
  };

  const handleSaveCurrentAsPreset = (name: string, description: string) => {
    saveCustomPresetAsync(name, description, params).then((saved) => {
      setPresets(getPresets());
      setActivePresetId(saved.id);
    });
  };

  const handleUpdatePreset = (id: string, name: string, description: string) => {
    updateCustomPreset(id, name, description, params);
    saveCustomPresetAsync(name, description, params).then(() => {
      setPresets(getPresets());
    });
  };

  const handleDeletePreset = (id: string) => {
    deletePresetAsync(id).then(() => {
      setPresets(getPresets());
      if (activePresetId === id) {
        setActivePresetId(null);
      }
    });
  };

  const handleResetPresets = () => {
    if (confirm("Deseja restaurar todos os modelos originais de fábrica do CD?")) {
      const defaults = resetPresetsToDefault();
      setPresets(defaults);
      setActivePresetId("exemplo-cd-160");
    }
  };

  const handleClearHistory = () => {
    if (confirm("Deseja realmente limpar todo o histórico local de gerações?")) {
      clearHistoryAsync().then(() => {
        setHistory([]);
      });
    }
  };

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  const selectedAddresses = useMemo(() => {
    return addresses.filter((a) => selectedIds.has(a.id));
  }, [addresses, selectedIds]);

  const printBatch = printSelectedOnly && selectedAddresses.length > 0 ? selectedAddresses : addresses;

  // Module titles and descriptions
  const moduleTitles: Record<MainPortalModule, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Painel de Controle e Indicadores do CD",
      subtitle: "Visão executiva em tempo real: KPIs logísticos, capacidade do CD e gestão operacional",
    },
    wms: {
      title: "1. WMS — Warehouse Management System",
      subtitle: "Módulos operacionais de recebimento, armazenagem, inventário e separação",
    },
    rastreamento: {
      title: "2. Rastreamento e Gestão de Cargas",
      subtitle: "Monitoramento em tempo real de frotas, despachos, rotas e entregas ativas",
    },
    etiquetas: {
      title: "3. Gerador de Etiquetas CD (CODE 128)",
      subtitle: "Endereçamento físico, matriz de cálculo, prévia em escala real e impressão",
    },
    etiquetas_produto: {
      title: "4. Etiquetas de Código de Barras (Produto)",
      subtitle: "Código de Barras EAN-13 térmico: descrição, código de barras e código do produto",
    },
    usuarios: {
      title: "5. Gestão de Usuários e Permissões",
      subtitle: "Controle de perfis, concessão granular por módulo e status de acesso",
    },
    configuracoes: {
      title: "6. Configurações Gerais do Sistema",
      subtitle: "Parâmetros do Centro de Distribuição, preferências de impressão e tema",
    },
  };

  // Breadcrumb / titles lookup for Labels subtopics
  const topicTitles: Record<PortalTopic, { title: string; subtitle: string }> = {
    config: {
      title: "1. Parâmetros de Endereçamento",
      subtitle: "Configure os intervalos de ruas, prédios, apartamentos e níveis de armazenagem",
    },
    summary: {
      title: "2. Resumo da Geração & Cálculo da Matriz",
      subtitle: "Valide a quantidade de etiquetas antes da impressão e dispare a criação",
    },
    preview: {
      title: "3. Pré-visualização da Etiqueta em Escala Real",
      subtitle: "Padrão 10 × 5 cm com frame laranja, logo Collab® e setas direcionais",
    },
    labels: {
      title: "4. Gerenciamento e Grade de Etiquetas",
      subtitle: "Pesquise, filtre por rua/prédio e selecione etiquetas individualmente ou por lote",
    },
    print: {
      title: "5. Central de Impressão e Exportação em PDF",
      subtitle: "Gere arquivos PDF padronizados a 100% e imprima em impressoras térmicas",
    },
    history: {
      title: "6. Histórico de Lotes Gerados",
      subtitle: "Audite gerações anteriores e restaure configurações com 1 clique",
    },
    tests: {
      title: "7. Critérios de Aceite Oficiais (1 a 6)",
      subtitle: "Validação automatizada de conformidade técnica com as regras do sistema",
    },
    all: {
      title: "Visão Completa do Sistema",
      subtitle: "Fluxo contínuo com todos os painéis e ferramentas reunidos",
    },
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="w-12 h-12 rounded-xl bg-[var(--collab-mostarda)] text-black flex items-center justify-center font-black animate-pulse text-xl mb-4 shadow-lg shadow-[#FF6400]/20">
          C
        </div>
        <p className="text-xs font-semibold text-[var(--muted)]">Carregando Collab Log...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginView onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const canAccessCurrentModule = hasPermission(session.user, activeModule);

  return (
    <>
      <div className="min-h-screen flex bg-[var(--background)] no-print">
        {/* Left Sidebar Menu */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          activeTopic={activeTopic}
          onSelectTopic={setActiveTopic}
          activeWmsTab={activeWmsTab}
          onSelectWmsTab={(tab) => {
            setActiveWmsTab(tab);
            setActiveModule("wms");
          }}
          currentUser={session.user}
          onLogout={handleLogout}
          totalGenerated={addresses.length}
          selectedCount={selectedIds.size}
          isMobileOpen={isMobileOpen}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          theme={theme}
          onToggleTheme={toggleTheme}
          larguraCm={params.larguraCm}
          alturaCm={params.alturaCm}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 lg:pl-72 sm:lg:pl-80 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--card-border)] py-3 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)]"
                aria-label="Abrir menu lateral"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] font-medium">
                  <span className="font-semibold text-[var(--foreground)]">Portal Logístico</span>
                  <ChevronRight size={12} />
                  <span>{moduleTitles[activeModule]?.title}</span>
                  {activeModule === "etiquetas" && (
                    <>
                      <ChevronRight size={12} />
                      <span className="text-[var(--collab-mostarda)] truncate font-semibold">
                        {topicTitles[activeTopic].title}
                      </span>
                    </>
                  )}
                  {activeModule === "wms" && (
                    <>
                      <ChevronRight size={12} />
                      <span className="text-[var(--collab-mostarda)] truncate font-semibold">
                        Agendamento de Entregas
                      </span>
                      <ChevronRight size={12} />
                      <span className="text-[var(--foreground)] truncate font-medium">
                        {activeWmsTab === "janelas" && "Janelas 2h em 2h"}
                        {activeWmsTab === "portaria" && "Portaria & Check-in"}
                        {activeWmsTab === "agendamentos" && "Lista de Entregas"}
                        {activeWmsTab === "indicadores" && "Indicadores & Ocupação"}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-sm sm:text-base font-bold text-[var(--foreground)] truncate font-heading">
                  {activeModule === "etiquetas"
                    ? topicTitles[activeTopic].title
                    : activeModule === "wms"
                    ? `WMS: Agendamento de Entregas — ${
                        activeWmsTab === "janelas"
                          ? "Janelas (2h em 2h)"
                          : activeWmsTab === "portaria"
                          ? "Portaria & Check-in"
                          : activeWmsTab === "agendamentos"
                          ? "Lista Geral"
                          : "Indicadores"
                      }`
                    : moduleTitles[activeModule]?.title}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {activeModule === "etiquetas" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopic("config");
                      setIsSaveModelModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
                    title="Gravar modelo de etiqueta parametrizado para novas impressões"
                  >
                    <Save size={13} className="text-[var(--collab-mostarda)]" />
                    <span className="hidden sm:inline">Gravar Modelo</span>
                    <span className="sm:hidden">Gravar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!validation.valid}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--collab-mostarda)] text-black hover:opacity-90 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gerar etiquetas com os parâmetros configurados"
                  >
                    <Play size={13} fill="currentColor" />
                    <span className="hidden sm:inline">Gerar Etiquetas</span>
                    <span className="sm:hidden">Gerar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintSelectedOnly(selectedIds.size > 0);
                      setActiveTopic("print");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all cursor-pointer"
                    title="Ir para a Central de Impressão"
                  >
                    <Printer size={13} className="text-[var(--collab-mostarda)]" />
                    <span className="hidden sm:inline">
                      {selectedIds.size > 0 ? `Imprimir Selecionadas (${selectedIds.size})` : "Imprimir / PDF"}
                    </span>
                    <span className="sm:hidden">Imprimir</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-[var(--collab-mostarda)]/10 text-[var(--collab-mostarda)] font-semibold border border-[var(--collab-mostarda)]/20">
                    Perfil: {session.user.role.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Main View Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* ACCESS DENIED FALLBACK */}
            {!canAccessCurrentModule ? (
              <div className="rounded-2xl bg-[var(--card)] border border-red-500/30 p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Acesso Restrito</h2>
                <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
                  Seu usuário (<strong>{session.user.name}</strong> &bull; {session.user.email}) não possui permissão concedida para acessar o módulo <strong>{moduleTitles[activeModule]?.title}</strong>.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModule("etiquetas")}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--collab-mostarda)] text-black hover:opacity-90 transition-all cursor-pointer shadow-sm"
                  >
                    Ir para Gerador de Etiquetas CD
                  </button>
                </div>
              </div>
            ) : activeModule === "dashboard" ? (
              <DashboardPortalView
                currentUser={session.user}
                onNavigate={(mod) => setActiveModule(mod)}
              />
            ) : activeModule === "wms" ? (
              <WmsPortalView
                activeSubTab={activeWmsTab}
                onSelectSubTab={setActiveWmsTab}
                onNavigateToLabels={() => setActiveModule("etiquetas")}
                currentUser={session.user}
              />
            ) : activeModule === "rastreamento" ? (
              <TrackingPortalView />
            ) : activeModule === "etiquetas_produto" ? (
              <ProductBarcodeView />
            ) : activeModule === "usuarios" ? (
              <UsersPortalView currentUser={session.user} />
            ) : activeModule === "configuracoes" ? (
              <GeneralSettingsPortalView theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              /* ACTIVE MODULE === "etiquetas" */
              <>
                {/* 1. CONFIG VIEW */}
                {activeTopic === "config" && (
              <div className="space-y-6">
                <ConfigPanel
                  params={params}
                  onChange={setParams}
                  validation={validation}
                  presets={presets}
                  activePresetId={activePresetId}
                  onSelectPreset={handleSelectPreset}
                  onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
                  onUpdatePreset={handleUpdatePreset}
                  onDeletePreset={handleDeletePreset}
                  onResetPresets={handleResetPresets}
                  isExternalSaveModalOpen={isSaveModelModalOpen}
                  onCloseExternalSaveModal={() => setIsSaveModelModalOpen(false)}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)]">
                  <div className="text-xs text-[var(--muted)]">
                    Parâmetros validados: <strong className="font-mono text-[var(--foreground)]">{summary.totalEnderecos} etiquetas previstas</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTopic("summary")}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[var(--secondary)] hover:bg-[var(--card-border)] text-[var(--foreground)] transition-all cursor-pointer"
                    >
                      Ver Matriz de Cálculo
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!validation.valid}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-[var(--collab-mostarda)] text-black hover:opacity-90 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Gerar e Visualizar Prévia</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SUMMARY VIEW */}
            {activeTopic === "summary" && (
              <div className="space-y-6">
                <GenerationSummaryCard
                  summary={summary}
                  onGenerate={handleGenerate}
                  isValid={validation.valid}
                  isGenerated={addresses.length > 0}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-2">
                    <h3 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <Sliders size={14} className="text-[var(--collab-mostarda)]" />
                      <span>Intervalos Atuais Configurados</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[var(--muted)]">
                      <div>Rua: <strong className="text-[var(--foreground)]">{params.ruaInicio} a {params.ruaFim}</strong></div>
                      <div>Prédio: <strong className="text-[var(--foreground)]">{params.predioInicio} a {params.predioFim}</strong></div>
                      <div>Nível: <strong className="text-[var(--foreground)]">{params.nivelInicio} a {params.nivelFim}</strong></div>
                      <div>Apto: <strong className="text-[var(--foreground)]">{params.aptoInicio} a {params.aptoFim}</strong></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-2">
                    <h3 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <Barcode size={14} className="text-[var(--collab-mostarda)]" />
                      <span>Formato de Saída Obrigatório</span>
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Cada endereço gerado recebe código de barras <strong>CODE 128</strong>, etiqueta <strong>100 × 50 mm</strong> e posicionamento automático de seta direcional (↓ N01 / ↑ N&gt;01).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PREVIEW VIEW */}
            {activeTopic === "preview" && (
              <div className="space-y-6">
                <LabelPreview
                  address={previewAddress || addresses[0] || null}
                  includeLogo={true}
                  larguraCm={params.larguraCm}
                  alturaCm={params.alturaCm}
                  fonteFamilia={params.fonteFamilia}
                  tamanhoFontePt={params.tamanhoFontePt}
                  alturaCodigoBarrasMm={params.alturaCodigoBarrasMm}
                />

                {addresses.length > 1 && (
                  <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--foreground)]">
                        Inspecionar outra etiqueta do lote atual ({addresses.length} geradas):
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTopic("labels")}
                        className="text-xs text-[var(--collab-mostarda)] hover:underline"
                      >
                        Ver todas na Grade →
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {addresses.slice(0, 12).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setPreviewAddress(a)}
                          className={`px-2.5 py-1 text-xs font-mono rounded border transition-all shrink-0 cursor-pointer ${
                            previewAddress?.id === a.id
                              ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                              : "bg-[var(--background)] text-[var(--muted)] border-[var(--card-border)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {a.code} ({a.arrowDirection === "down" ? "↓" : "↑"})
                        </button>
                      ))}
                      {addresses.length > 12 && (
                        <span className="text-xs text-[var(--muted)] shrink-0 px-2">
                          + {addresses.length - 12} mais na Grade
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. LABELS GRID VIEW */}
            {activeTopic === "labels" && (
              <div className="space-y-6">
                <LabelsGrid
                  addresses={addresses}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onSelectRange={handleSelectRange}
                  onPreviewAddress={(addr) => {
                    setPreviewAddress(addr);
                    setActiveTopic("preview");
                  }}
                  onOpenPrintModal={(selectedOnly) => {
                    setPrintSelectedOnly(selectedOnly);
                    setIsPrintModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* 5. PRINT & PDF VIEW */}
            {activeTopic === "print" && (
              <div className="space-y-6">
                <PrintPortalView
                  addresses={addresses}
                  selectedAddresses={selectedAddresses}
                  defaultSelectedOnly={printSelectedOnly}
                  onScopeChange={(selectedOnly) => setPrintSelectedOnly(selectedOnly)}
                  onOpenPrintModal={(selectedOnly) => {
                    setPrintSelectedOnly(selectedOnly);
                    setIsPrintModalOpen(true);
                  }}
                  larguraCm={params.larguraCm}
                  alturaCm={params.alturaCm}
                  fonteFamilia={params.fonteFamilia}
                  tamanhoFontePt={params.tamanhoFontePt}
                  alturaCodigoBarrasMm={params.alturaCodigoBarrasMm}
                />
              </div>
            )}

            {/* 6. HISTORY VIEW */}
            {activeTopic === "history" && (
              <div className="space-y-6">
                <HistoryPortalView
                  history={history}
                  onRestoreParams={(p) => setParams(p)}
                  onClearHistory={handleClearHistory}
                  onNavigateToConfig={() => setActiveTopic("config")}
                />
              </div>
            )}

            {/* 7. ACCEPTANCE TESTS VIEW */}
            {activeTopic === "tests" && (
              <div className="space-y-6">
                <AcceptanceTestsPortalView
                  onLoadTestParams={(p) => setParams(p)}
                  onNavigateToConfig={() => setActiveTopic("config")}
                />
              </div>
            )}

            {/* 8. ALL (FULL FLOW) VIEW */}
            {activeTopic === "all" && (
              <div className="space-y-6">
                <ConfigPanel
                  params={params}
                  onChange={setParams}
                  validation={validation}
                  presets={presets}
                  activePresetId={activePresetId}
                  onSelectPreset={handleSelectPreset}
                  onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
                  onUpdatePreset={handleUpdatePreset}
                  onDeletePreset={handleDeletePreset}
                  onResetPresets={handleResetPresets}
                  isExternalSaveModalOpen={isSaveModelModalOpen}
                  onCloseExternalSaveModal={() => setIsSaveModelModalOpen(false)}
                />

                <GenerationSummaryCard
                  summary={summary}
                  onGenerate={handleGenerate}
                  isValid={validation.valid}
                  isGenerated={addresses.length > 0}
                />

                <LabelPreview
                  address={previewAddress || addresses[0] || null}
                  includeLogo={true}
                  larguraCm={params.larguraCm}
                  alturaCm={params.alturaCm}
                  fonteFamilia={params.fonteFamilia}
                  tamanhoFontePt={params.tamanhoFontePt}
                  alturaCodigoBarrasMm={params.alturaCodigoBarrasMm}
                />

                <LabelsGrid
                  addresses={addresses}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onSelectRange={handleSelectRange}
                  onPreviewAddress={setPreviewAddress}
                  onOpenPrintModal={(selectedOnly) => {
                    setPrintSelectedOnly(selectedOnly);
                    setIsPrintModalOpen(true);
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-6 px-4 sm:px-6 text-center text-xs text-[var(--muted)] no-print mt-auto">
        <p>
          <strong>Collab Log • Portal Logístico</strong> — Grupo Collab • Sistema Integrado de Gestão da Cadeia de Suprimentos
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--collab-mostarda)]">
          Centro de Distribuição Principal • Logística & Armazenagem • Padrão CODE 128
        </p>
      </footer>
        </div>
      </div>

      {/* Advanced Print Modal (accessible from quick action or button) */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        allAddresses={addresses}
        selectedAddresses={selectedAddresses}
        defaultSelectedOnly={printSelectedOnly}
        larguraCm={params.larguraCm}
        alturaCm={params.alturaCm}
        fonteFamilia={params.fonteFamilia}
        tamanhoFontePt={params.tamanhoFontePt}
        alturaCodigoBarrasMm={params.alturaCodigoBarrasMm}
      />

      {/* Dynamic browser print styles based on parameterized dimensions (A4 multiple labels grid) */}
      <style>{`
        @page {
          size: A4 portrait !important;
          margin: 10mm 5mm !important;
        }
        @media print {
          .print-only {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-content: flex-start !important;
            gap: 2mm !important;
          }
          .printable-label-page {
            width: ${Number(params.larguraCm || 10)}cm !important;
            height: ${Number(params.alturaCm || 5)}cm !important;
            max-width: ${Number(params.larguraCm || 10)}cm !important;
            max-height: ${Number(params.alturaCm || 5)}cm !important;
            page-break-after: auto !important;
            break-after: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: ${Math.max(2, Math.min(Number(params.larguraCm || 10), Number(params.alturaCm || 5)) * 0.45)}mm !important;
          }
        }
      `}</style>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestoreParams={setParams}
        onClearHistory={handleClearHistory}
      />

      {/* Acceptance Tests Modal */}
      <TestAcceptanceModal
        isOpen={isAcceptanceTestsOpen}
        onClose={() => setIsAcceptanceTestsOpen(false)}
        onLoadTestParams={setParams}
      />

      {/* Physical Print Sheet (@media print) */}
      <div className="print-only">
        {printBatch.map((addr) => {
          const barHeightMm = Number(params.alturaCodigoBarrasMm || 20);
          const svgHeight = Math.max(26, Math.min(84, Math.round(barHeightMm * 2.4)));
          const barcodeSvg = generateCode128Svg(addr.code, 220, svgHeight, 8);
          const isDown = addr.arrowDirection === "down";

          return (
            <div key={`print_${addr.id}`} className="printable-label-page">
              <div className="printable-label-content">
                {/* Left — Collab logo vertical (14% para simetria) */}
                <div
                  style={{
                    width: "14%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: "0.4mm solid #000000",
                    flexShrink: 0,
                    padding: "1mm 0.5mm",
                    boxSizing: "border-box",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-collab-vertical.png"
                    alt="Grupo Collab"
                    style={{
                      maxHeight: "92%",
                      maxWidth: "88%",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>

                {/* Center — barcode + address perfeitamente centralizados (72% de área útil ampliada) */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "100%",
                    padding: "0.5mm 1mm",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ width: "100%", flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />
                  <div
                    style={{
                      width: "100%",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: "10.5pt",
                      lineHeight: "1",
                      letterSpacing: "0.5px",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: "6mm", // sobe as informações de endereço mantendo centralizado
                    }}
                  >
                    {addr.code}
                  </div>
                </div>

                {/* Right — directional arrow alinhada com a barra (14% simétrico) */}
                <div
                  style={{
                    width: "14%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                    padding: "0.5mm 1mm",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {isDown ? (
                      <svg viewBox="0 0 48 80" style={{ width: "12mm", height: "auto", maxHeight: "90%" }} fill="#000000">
                        <rect x="11" y="2" width="26" height="42" />
                        <polygon points="24,78 0,42 48,42" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 48 80" style={{ width: "12mm", height: "auto", maxHeight: "90%" }} fill="#000000">
                        <polygon points="24,2 0,38 48,38" />
                        <rect x="11" y="36" width="26" height="42" />
                      </svg>
                    )}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      fontSize: "10.5pt",
                      lineHeight: "1",
                      marginBottom: "6mm",
                      visibility: "hidden",
                      userSelect: "none",
                    }}
                  >
                    &nbsp;
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
