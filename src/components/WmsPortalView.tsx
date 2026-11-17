"use client";

import { useState, useMemo } from "react";
import {
  EntregaAgendamento,
  AgendamentoStatus,
  AgendamentoCanal,
  JanelaHorario,
  VeiculoTipo,
} from "@/lib/wmsTypes";
import {
  getAgendamentos,
  createAgendamento,
  registrarCheckInPortaria,
  updateAgendamentoStatus,
  getDisponibilidadeJanelas,
  toggleBloqueioJanela,
  getIndicadoresAgendamento,
  JANELAS_PADRAO,
  MAX_FORNECEDORES_POR_JANELA,
  MAX_VOLUMES_POR_JANELA,
} from "@/lib/wmsService";
import {
  Boxes,
  Calendar,
  Clock,
  Plus,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Smartphone,
  Globe,
  MessageSquare,
  Search,
  Filter,
  Ban,
  Unlock,
  Building2,
  Phone,
  Timer,
  TrendingUp,
  X,
  Send,
  Eye,
  ArrowRight,
  ShieldAlert,
  Hash,
  RotateCcw,
} from "lucide-react";

interface WmsPortalViewProps {
  onNavigateToLabels?: () => void;
  activeSubTab?: WmsSubTab;
  onSelectSubTab?: (tab: WmsSubTab) => void;
}

export type WmsSubTab = "janelas" | "portaria" | "agendamentos" | "indicadores";

export function WmsPortalView({
  onNavigateToLabels,
  activeSubTab,
  onSelectSubTab,
}: WmsPortalViewProps) {
  // Estado de controle geral sincronizado com a Sidebar
  const [internalTab, setInternalTab] = useState<WmsSubTab>("janelas");
  const activeTab = activeSubTab || internalTab;
  const setActiveTab = (tab: WmsSubTab) => {
    setInternalTab(tab);
    onSelectSubTab?.(tab);
  };
  const [dataSelecionada, setDataSelecionada] = useState("2026-11-17");
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros da tabela geral
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");
  const [buscaTermo, setBuscaTermo] = useState("");

  // Modais
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = useState(false);
  const [modalDetalhesItem, setModalDetalhesItem] = useState<EntregaAgendamento | null>(null);
  const [modalCheckInItem, setModalCheckInItem] = useState<EntregaAgendamento | null>(null);
  const [responsavelPortariaInput, setResponsavelPortariaInput] = useState("Portaria 01 — Carlos R.");
  const [obsPortariaInput, setObsPortariaInput] = useState("");

  // Formulário de Novo Agendamento
  const [formCanal, setFormCanal] = useState<AgendamentoCanal>("portal_web");
  const [formJanela, setFormJanela] = useState<JanelaHorario>("10:00 - 12:00");
  const [formFornecedorNome, setFormFornecedorNome] = useState("");
  const [formFornecedorCnpj, setFormFornecedorCnpj] = useState("");
  const [formTransportadoraNome, setFormTransportadoraNome] = useState("");
  const [formTransportadoraCnpj, setFormTransportadoraCnpj] = useState("");
  const [formNumeroNf, setFormNumeroNf] = useState("");
  const [formChaveNfe, setFormChaveNfe] = useState("");
  const [formVolumes, setFormVolumes] = useState<number | "">(120);
  const [formQtdNfs, setFormQtdNfs] = useState<number | "">(1);
  const [formTipoVeiculo, setFormTipoVeiculo] = useState<VeiculoTipo>("Truck");
  const [formPlaca, setFormPlaca] = useState("");
  const [formMotoristaNome, setFormMotoristaNome] = useState("");
  const [formMotoristaTelefone, setFormMotoristaTelefone] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessProtocolo, setFormSuccessProtocolo] = useState<string | null>(null);

  // Carrega dados reativos
  const agendamentos = useMemo(() => {
    // refreshKey obriga re-execução quando salvamos
    void refreshKey;
    return getAgendamentos();
  }, [refreshKey]);

  const janelasCapacidade = useMemo(() => {
    void refreshKey;
    return getDisponibilidadeJanelas(dataSelecionada);
  }, [dataSelecionada, refreshKey]);

  const indicadores = useMemo(() => {
    void refreshKey;
    return getIndicadoresAgendamento(dataSelecionada);
  }, [dataSelecionada, refreshKey]);

  // Agendamentos filtrados
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((a) => {
      if (a.data !== dataSelecionada) return false;
      if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
      if (filtroCanal !== "todos" && a.canal !== filtroCanal) return false;
      if (buscaTermo.trim()) {
        const termo = buscaTermo.toLowerCase();
        const matchProt = a.protocolo.toLowerCase().includes(termo);
        const matchForn = a.fornecedorNome.toLowerCase().includes(termo);
        const matchPlaca = a.placaVeiculo.toLowerCase().includes(termo);
        const matchNf = a.numeroNotaFiscal.toLowerCase().includes(termo);
        const matchMot = a.motoristaNome.toLowerCase().includes(termo);
        if (!matchProt && !matchForn && !matchPlaca && !matchNf && !matchMot) return false;
      }
      return true;
    });
  }, [agendamentos, dataSelecionada, filtroStatus, filtroCanal, buscaTermo]);

  // Handlers
  const handleToggleBloqueio = (janela: JanelaHorario) => {
    toggleBloqueioJanela(dataSelecionada, janela, "Operação interna e manutenção programada", "Doca 02");
    setRefreshKey((k) => k + 1);
  };

  const handleOpenCheckIn = (agd: EntregaAgendamento) => {
    setModalCheckInItem(agd);
    setObsPortariaInput("");
  };

  const handleConfirmarCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCheckInItem) return;
    registrarCheckInPortaria(modalCheckInItem.id, responsavelPortariaInput, obsPortariaInput);
    setModalCheckInItem(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAlterarStatus = (id: string, novoStatus: AgendamentoStatus) => {
    updateAgendamentoStatus(id, novoStatus);
    setRefreshKey((k) => k + 1);
  };

  const handleSubmitNovoAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const volumesNum = Number(formVolumes);
    if (!volumesNum || volumesNum <= 0) {
      setFormError("Informe uma quantidade válida de volumes.");
      return;
    }

    const res = createAgendamento({
      data: dataSelecionada,
      janela: formJanela,
      canal: formCanal,
      fornecedorNome: formFornecedorNome,
      fornecedorCnpj: formFornecedorCnpj,
      transportadoraNome: formTransportadoraNome,
      transportadoraCnpj: formTransportadoraCnpj || undefined,
      numeroNotaFiscal: formNumeroNf,
      chaveNfe: formChaveNfe,
      quantidadeVolumes: volumesNum,
      quantidadeNfs: Number(formQtdNfs) || 1,
      tipoVeiculo: formTipoVeiculo,
      placaVeiculo: formPlaca,
      motoristaNome: formMotoristaNome,
      motoristaTelefone: formMotoristaTelefone,
      observacoes: formObservacoes || undefined,
    });

    if (res.success && res.agendamento) {
      setFormSuccessProtocolo(res.agendamento.protocolo);
      setRefreshKey((k) => k + 1);
    } else {
      setFormError(res.error || "Não foi possível registrar o agendamento.");
    }
  };

  const handleResetForm = () => {
    setFormSuccessProtocolo(null);
    setFormError(null);
    setFormFornecedorNome("");
    setFormFornecedorCnpj("");
    setFormTransportadoraNome("");
    setFormNumeroNf("");
    setFormChaveNfe("");
    setFormPlaca("");
    setFormMotoristaNome("");
    setFormMotoristaTelefone("");
    setFormObservacoes("");
    setIsNovoAgendamentoOpen(false);
  };

  // Helper de badges de status
  const renderStatusBadge = (status: AgendamentoStatus) => {
    const map: Record<AgendamentoStatus, { label: string; bg: string; text: string }> = {
      solicitado: { label: "Solicitado", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-500" },
      aguardando_aprovacao: { label: "Aguardando Aprovação", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-500" },
      agendado: { label: "Agendado", bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400" },
      confirmado: { label: "Confirmado", bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-400" },
      em_transito: { label: "Em Trânsito", bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-400" },
      chegou_portaria: { label: "Chegou à Portaria", bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-500 font-bold" },
      aguardando_doca: { label: "Aguardando Doca", bg: "bg-yellow-500/15 border-yellow-500/30", text: "text-yellow-500" },
      em_descarga: { label: "Em Descarga", bg: "bg-[var(--collab-mostarda)]/15 border-[var(--collab-mostarda)]/30", text: "text-[var(--collab-mostarda)] font-bold" },
      finalizado: { label: "Finalizado", bg: "bg-gray-500/10 border-gray-500/30", text: "text-gray-400" },
      cancelado: { label: "Cancelado", bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
      nao_compareceu: { label: "Não Compareceu", bg: "bg-rose-500/15 border-rose-500/40", text: "text-rose-500 font-bold" },
    };
    const c = map[status] || { label: status, bg: "bg-gray-500/10 border-gray-500/30", text: "text-gray-400" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const renderCanalIcon = (canal: AgendamentoCanal) => {
    switch (canal) {
      case "portal_web":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-medium" title="Portal Web Fornecedor">
            <Globe size={13} />
            <span>Portal Web</span>
          </span>
        );
      case "app_mobile":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-medium" title="Aplicativo Mobile">
            <Smartphone size={13} />
            <span>App Mobile</span>
          </span>
        );
      case "whatsapp":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium" title="WhatsApp Bot API">
            <MessageSquare size={13} />
            <span>WhatsApp Bot</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Principal do Módulo 01 */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
              WMS • Módulo 01
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Building2 size={13} />
              <span>CD-01 — Barueri Matriz</span>
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Agendamento de Entregas & Recepção
          </h1>
          <p className="text-xs text-[var(--muted)] max-w-2xl">
            Gestão das janelas de recebimento (2h em 2h, máx. 2 fornecedores e 500 volumes), controle de portaria (check-in de chegada) e prevenção de filas nas docas.
          </p>
        </div>

        {/* Ações de Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-semibold">
            <Calendar size={14} className="text-[var(--collab-mostarda)]" />
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="bg-transparent text-[var(--foreground)] focus:outline-none cursor-pointer text-xs font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFormSuccessProtocolo(null);
              setFormError(null);
              setIsNovoAgendamentoOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Rápidos (Item 2.7) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Agendamentos</span>
            <Calendar size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="font-heading text-xl font-bold text-[var(--foreground)]">
            {indicadores.totalAgendamentosDia}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Previstos para hoje</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Volume Total</span>
            <Boxes size={14} className="text-sky-400" />
          </div>
          <div className="font-heading text-xl font-bold text-sky-400">
            {indicadores.totalVolumesPrevistos}{" "}
            <span className="text-xs font-normal text-[var(--muted)]">/ 2.500</span>
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Capacidade máxima do dia</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Ocupação CD</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="font-heading text-xl font-bold text-emerald-400">
            {indicadores.taxaOcupacaoGeralPct}%
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Taxa média de janelas</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Pontualidade</span>
            <Timer size={14} className="text-amber-400" />
          </div>
          <div className="font-heading text-xl font-bold text-amber-400">
            {indicadores.entregasNoHorario}{" "}
            <span className="text-xs font-normal text-[var(--muted)]">
              ({indicadores.entregasAtrasadas} atrasadas)
            </span>
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Check-in de portaria</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Tempo Médio Espera</span>
            <Clock size={14} className="text-purple-400" />
          </div>
          <div className="font-heading text-xl font-bold text-purple-400">
            {indicadores.tempoMedioEsperaMinutos} min
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Portaria até início descarga</span>
        </div>
      </div>

      {/* Navegação por Sub-Abas do Módulo 01 */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("janelas")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "janelas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Clock size={14} />
          <span>1. Janelas de Agendamento (2h em 2h)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("portaria")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "portaria"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <UserCheck size={14} />
          <span>2. Controle de Portaria & Check-in</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("agendamentos")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "agendamentos"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileText size={14} />
          <span>3. Lista Geral & Canais ({agendamentosFiltrados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("indicadores")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "indicadores"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <TrendingUp size={14} />
          <span>4. Indicadores & Capacidade</span>
        </button>
      </div>

      {/* ── ABA 1: GRADE DE JANELAS DE 2H EM 2H (Item 2.3) ────────────────── */}
      {activeTab === "janelas" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--card)]/50 p-3 rounded-xl border border-[var(--card-border)] text-xs text-[var(--muted)]">
            <span className="flex items-center gap-2">
              <Boxes size={14} className="text-[var(--collab-mostarda)]" />
              <span>
                Regra Operacional: <strong>Máx. 2 Fornecedores</strong> e <strong>Máx. 500 Volumes</strong> por janela de 2 horas. Bloqueio automático ao atingir o limite.
              </span>
            </span>
            <span className="font-mono text-[11px] text-[var(--foreground)]">
              Data em exibição: <strong>{dataSelecionada}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {janelasCapacidade.map((item) => {
              const fornecedoresPct = (item.totalFornecedores / item.maxFornecedores) * 100;
              const volumesPct = (item.totalVolumes / item.maxVolumes) * 100;
              const isLotada = !item.disponivel && !item.bloqueada;

              return (
                <div
                  key={item.janela}
                  className={`bg-[var(--card)] border rounded-2xl p-5 shadow-sm transition-all ${
                    item.bloqueada
                      ? "border-red-500/40 bg-red-500/5"
                      : isLotada
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-[var(--card-border)] hover:border-[var(--collab-mostarda)]/50"
                  }`}
                >
                  {/* Linha de Topo da Janela */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center font-mono font-bold text-sm text-[var(--foreground)]">
                        <Clock size={18} className="text-[var(--collab-mostarda)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                            Janela: {item.janela}
                          </h3>
                          {item.bloqueada ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1">
                              <Ban size={10} />
                              <span>Bloqueada</span>
                            </span>
                          ) : isLotada ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                              <ShieldAlert size={10} />
                              <span>Janela Lotada</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Disponível</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {item.bloqueada
                            ? `Motivo do bloqueio: ${item.motivoBloqueio || "Manutenção interna"}`
                            : `${item.totalFornecedores} de ${item.maxFornecedores} fornecedores • ${item.totalVolumes} de ${item.maxVolumes} volumes`}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação na Janela */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBloqueio(item.janela)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          item.bloqueada
                            ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                        title={item.bloqueada ? "Desbloquear esta janela" : "Bloquear para manutenção"}
                      >
                        {item.bloqueada ? <Unlock size={13} /> : <Ban size={13} />}
                        <span>{item.bloqueada ? "Desbloquear" : "Bloquear Janela"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={!item.disponivel}
                        onClick={() => {
                          setFormJanela(item.janela);
                          setIsNovoAgendamentoOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />
                        <span>Agendar</span>
                      </button>
                    </div>
                  </div>

                  {/* Barras de Capacidade Simultânea (Fornecedores e Volumes) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
                    {/* Medidor 1: Fornecedores */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--muted)] font-medium">Vagas de Fornecedores:</span>
                        <span className="font-mono font-bold text-[var(--foreground)]">
                          {item.totalFornecedores} / {item.maxFornecedores}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--background)] h-2 rounded-full overflow-hidden border border-[var(--card-border)]">
                        <div
                          className={`h-full transition-all ${
                            fornecedoresPct >= 100 ? "bg-red-500" : "bg-[var(--collab-mostarda)]"
                          }`}
                          style={{ width: `${Math.min(100, fornecedoresPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Medidor 2: Volumes */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--muted)] font-medium">Capacidade de Volumes:</span>
                        <span className="font-mono font-bold text-[var(--foreground)]">
                          {item.totalVolumes} / {item.maxVolumes} volumes ({Math.round(volumesPct)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--background)] h-2 rounded-full overflow-hidden border border-[var(--card-border)]">
                        <div
                          className={`h-full transition-all ${
                            volumesPct >= 100
                              ? "bg-red-500"
                              : volumesPct > 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, volumesPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cards dos Fornecedores Alocados nesta janela */}
                  {item.agendamentos.length > 0 ? (
                    <div className="pt-2 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
                        Entregas Confirmadas Nesta Janela:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.agendamentos.map((agd) => (
                          <div
                            key={agd.id}
                            className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex flex-col justify-between space-y-2 hover:border-[var(--collab-mostarda)]/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-[11px] font-bold text-[var(--collab-mostarda)] block">
                                  {agd.protocolo}
                                </span>
                                <h4 className="text-xs font-bold text-[var(--foreground)] truncate max-w-[200px]">
                                  {agd.fornecedorNome}
                                </h4>
                                <span className="text-[10px] text-[var(--muted)] block">
                                  Transp: {agd.transportadoraNome}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                {renderStatusBadge(agd.status)}
                                <div className="mt-1">{renderCanalIcon(agd.canal)}</div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                              <span>
                                <strong>{agd.quantidadeVolumes}</strong> vols • NF: {agd.numeroNotaFiscal}
                              </span>
                              <span>
                                {agd.tipoVeiculo} • <strong className="font-mono text-[var(--foreground)]">{agd.placaVeiculo}</strong>
                              </span>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              {agd.status === "confirmado" || agd.status === "em_transito" ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckIn(agd)}
                                  className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-semibold cursor-pointer transition-colors"
                                >
                                  Check-in Portaria
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => setModalDetalhesItem(agd)}
                                className="px-2.5 py-1 rounded bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)] text-[11px] font-medium cursor-pointer"
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-center text-xs text-[var(--muted)] italic">
                      Nenhum agendamento registrado nesta janela ainda.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ABA 2: CONTROLE DE PORTARIA & CHECK-IN (Item 2.6) ─────────────── */}
      {activeTab === "portaria" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                  <UserCheck size={18} className="text-[var(--collab-mostarda)]" />
                  <span>Portaria & Guarita de Entrada (Check-in de Veículos)</span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Registro de chegada em tempo real, cálculo automático de atraso/antecipação e direcionamento às docas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={buscaTermo}
                    onChange={(e) => setBuscaTermo(e.target.value)}
                    placeholder="Buscar placa, motorista ou protocolo..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] w-64"
                  />
                </div>
              </div>
            </div>

            {/* Fila de Veículos do Dia */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-[var(--muted)] uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Protocolo</th>
                    <th className="py-2.5 px-3">Horário Previsto</th>
                    <th className="py-2.5 px-3">Fornecedor / Transp.</th>
                    <th className="py-2.5 px-3">Veículo / Placa</th>
                    <th className="py-2.5 px-3">Motorista</th>
                    <th className="py-2.5 px-3">Chegada Real</th>
                    <th className="py-2.5 px-3">Pontualidade</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {agendamentosFiltrados.map((agd) => {
                    const temCheckIn = Boolean(agd.checkIn);
                    return (
                      <tr key={agd.id} className="hover:bg-[var(--card)]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[var(--collab-mostarda)]">
                          {agd.protocolo}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[var(--foreground)]">
                          {agd.janela}
                        </td>
                        <td className="py-3 px-3">
                          <strong className="block text-[var(--foreground)] truncate max-w-[160px]">
                            {agd.fornecedorNome}
                          </strong>
                          <span className="text-[10px] text-[var(--muted)] truncate max-w-[160px] block">
                            {agd.transportadoraNome}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[var(--foreground)] block">
                            {agd.placaVeiculo}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] block">
                            {agd.tipoVeiculo}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="block text-[var(--foreground)]">{agd.motoristaNome}</span>
                          <span className="text-[10px] text-[var(--muted)] block">{agd.motoristaTelefone}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {temCheckIn ? (
                            new Date(agd.checkIn!.dataHoraChegada).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          ) : (
                            <span className="text-[var(--muted)] italic">Aguardando</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {temCheckIn ? (
                            agd.checkIn?.statusPontualidade === "atrasado" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 font-bold">
                                +{agd.checkIn.tempoDiferencaMinutos}m atraso
                              </span>
                            ) : agd.checkIn?.statusPontualidade === "antecipado" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-bold">
                                {agd.checkIn.tempoDiferencaMinutos}m adiantado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                                No Horário
                              </span>
                            )
                          ) : (
                            <span className="text-[var(--muted)] text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">{renderStatusBadge(agd.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!temCheckIn && (
                              <button
                                type="button"
                                onClick={() => handleOpenCheckIn(agd)}
                                className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold text-[11px] cursor-pointer"
                              >
                                Check-in
                              </button>
                            )}

                            {agd.status === "chegou_portaria" && (
                              <button
                                type="button"
                                onClick={() => handleAlterarStatus(agd.id, "aguardando_doca")}
                                className="px-2.5 py-1 rounded bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-500 font-semibold text-[11px] cursor-pointer"
                              >
                                Doca
                              </button>
                            )}

                            {agd.status === "aguardando_doca" && (
                              <button
                                type="button"
                                onClick={() => handleAlterarStatus(agd.id, "em_descarga")}
                                className="px-2.5 py-1 rounded bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-black font-bold text-[11px] cursor-pointer"
                              >
                                Descarregar
                              </button>
                            )}

                            {agd.status === "em_descarga" && (
                              <button
                                type="button"
                                onClick={() => handleAlterarStatus(agd.id, "finalizado")}
                                className="px-2.5 py-1 rounded bg-gray-500/20 hover:bg-gray-500/30 text-[var(--foreground)] font-semibold text-[11px] cursor-pointer"
                              >
                                Finalizar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setModalDetalhesItem(agd)}
                              className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] cursor-pointer"
                              title="Ver ficha completa"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 3: LISTA GERAL & CANAIS (Itens 2.2 e 2.4) ──────────────────── */}
      {activeTab === "agendamentos" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-[var(--muted)]" />
                <span className="font-bold text-[var(--muted)] uppercase text-[10px]">Status:</span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="em_transito">Em Trânsito</option>
                  <option value="chegou_portaria">Chegou à Portaria</option>
                  <option value="aguardando_doca">Aguardando Doca</option>
                  <option value="em_descarga">Em Descarga</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="nao_compareceu">Não Compareceu</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[var(--muted)] uppercase text-[10px]">Canal:</span>
                <select
                  value={filtroCanal}
                  onChange={(e) => setFiltroCanal(e.target.value)}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                >
                  <option value="todos">Todos os Canais</option>
                  <option value="portal_web">Portal Web Fornecedor</option>
                  <option value="app_mobile">Aplicativo Celular</option>
                  <option value="whatsapp">WhatsApp Bot Oficial</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                placeholder="Filtrar por NF, fornecedor, placa..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] w-full md:w-60"
              />
            </div>
          </div>

          {/* Grid de Cards de Agendamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agendamentosFiltrados.map((agd) => (
              <div
                key={agd.id}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 shadow-sm hover:border-[var(--collab-mostarda)]/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2 mb-2">
                    <span className="font-mono text-xs font-bold text-[var(--collab-mostarda)]">
                      {agd.protocolo}
                    </span>
                    {renderCanalIcon(agd.canal)}
                  </div>

                  <h3 className="font-bold text-sm text-[var(--foreground)] truncate">
                    {agd.fornecedorNome}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] truncate">
                    CNPJ: {agd.fornecedorCnpj}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 pt-2 border-t border-[var(--card-border)] text-[var(--muted)]">
                    <div>
                      <span>Janela Prevista:</span>
                      <strong className="block text-[var(--foreground)] font-mono">{agd.janela}</strong>
                    </div>
                    <div>
                      <span>Volumes / NFs:</span>
                      <strong className="block text-[var(--foreground)]">{agd.quantidadeVolumes} vols ({agd.quantidadeNfs} NF)</strong>
                    </div>
                    <div>
                      <span>Veículo:</span>
                      <strong className="block text-[var(--foreground)] font-mono">{agd.placaVeiculo} ({agd.tipoVeiculo})</strong>
                    </div>
                    <div>
                      <span>Motorista:</span>
                      <strong className="block text-[var(--foreground)] truncate">{agd.motoristaNome}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
                  {renderStatusBadge(agd.status)}
                  <button
                    type="button"
                    onClick={() => setModalDetalhesItem(agd)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--collab-mostarda)] hover:underline font-bold cursor-pointer"
                  >
                    <span>Ver Ficha</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA 4: INDICADORES E CAPACIDADE (Item 2.7) ────────────────────── */}
      {activeTab === "indicadores" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico Visual: Volumes Previstos por Janela de 2h */}
            <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Volume Previsto por Horário (Janelas de 2h)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Capacidade nominal máxima de 500 volumes por período de recebimento.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]">
                  Limite: 500 vols / janela
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {indicadores.volumesPorJanela.map((item) => {
                  const pct = Math.min(100, Math.round((item.volumes / MAX_VOLUMES_POR_JANELA) * 100));
                  return (
                    <div key={item.janela} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--foreground)] font-mono">{item.janela}</span>
                        <span className="text-[var(--muted)]">
                          <strong>{item.volumes}</strong> / {MAX_VOLUMES_POR_JANELA} volumes ({item.fornecedores} fornecedores)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--background)] h-3 rounded-full overflow-hidden border border-[var(--card-border)]">
                        <div
                          className={`h-full transition-all ${
                            pct >= 100 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-[var(--collab-mostarda)]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribuição por Canais de Agendamento (Item 2.2) */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Canais de Agendamento
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Origem dos agendamentos efetuados pelos fornecedores.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {indicadores.distribuicaoCanais.map((c) => (
                  <div key={c.canal} className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {renderCanalIcon(c.canal)}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[var(--foreground)] font-mono">{c.count}</span>
                      <span className="text-[10px] text-[var(--muted)] block">({c.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[var(--card-border)] text-[11px] text-[var(--muted)] space-y-1">
                <span className="block font-semibold text-[var(--foreground)]">Status de Entregas Hoje:</span>
                <div className="flex justify-between">
                  <span>Concluídas:</span>
                  <strong className="text-emerald-400 font-mono">{indicadores.entregasFinalizadas}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Não compareceram (No-show):</span>
                  <strong className="text-rose-500 font-mono">{indicadores.naoCompareceram}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE NOVO AGENDAMENTO (Item 2.4 e 2.5) ────────────────────── */}
      {isNovoAgendamentoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--card)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Novo Agendamento de Entrega
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Preencha as 14 informações obrigatórias para validação de capacidade no CD.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sucesso / Protocolo Gerado */}
            {formSuccessProtocolo ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block">
                    Agendamento Confirmado com Sucesso!
                  </span>
                  <h4 className="font-mono text-2xl font-black text-[var(--foreground)]">
                    {formSuccessProtocolo}
                  </h4>
                  <p className="text-xs text-[var(--muted)] max-w-md mx-auto pt-1">
                    O agendamento foi validado pelas regras de capacidade (máx. 2 fornecedores / 500 volumes) e a confirmação automática foi emitida para o fornecedor.
                  </p>
                </div>

                <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] max-w-sm mx-auto text-xs text-left space-y-1 font-mono">
                  <div><strong>Data:</strong> {dataSelecionada}</div>
                  <div><strong>Janela:</strong> {formJanela}</div>
                  <div><strong>Fornecedor:</strong> {formFornecedorNome}</div>
                  <div><strong>Canal:</strong> {formCanal.toUpperCase()}</div>
                </div>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-6 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase cursor-pointer"
                >
                  Concluir e Voltar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitNovoAgendamento} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {formError && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-medium flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Seleção de Canal (Item 2.2) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--foreground)] block">
                    Canal de Entrada do Agendamento:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormCanal("portal_web")}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        formCanal === "portal_web"
                          ? "bg-sky-500/15 border-sky-500 text-sky-400 font-bold"
                          : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)]"
                      }`}
                    >
                      <Globe size={15} />
                      <span>Portal Web</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCanal("app_mobile")}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        formCanal === "app_mobile"
                          ? "bg-purple-500/15 border-purple-500 text-purple-400 font-bold"
                          : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)]"
                      }`}
                    >
                      <Smartphone size={15} />
                      <span>App Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCanal("whatsapp")}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        formCanal === "whatsapp"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)]"
                      }`}
                    >
                      <MessageSquare size={15} />
                      <span>WhatsApp Bot</span>
                    </button>
                  </div>
                </div>

                {/* Janela de Horário */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--foreground)] block">
                    Janela de Agendamento (2h em 2h):
                  </label>
                  <select
                    value={formJanela}
                    onChange={(e) => setFormJanela(e.target.value as JanelaHorario)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono font-semibold focus:outline-none focus:border-[var(--collab-mostarda)] cursor-pointer"
                  >
                    {JANELAS_PADRAO.map((j) => (
                      <option key={j} value={j}>
                        Janela {j}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dados do Fornecedor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Nome do Fornecedor *</label>
                    <input
                      type="text"
                      required
                      value={formFornecedorNome}
                      onChange={(e) => setFormFornecedorNome(e.target.value)}
                      placeholder="Ex: Ambev S.A."
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">CNPJ do Fornecedor *</label>
                    <input
                      type="text"
                      required
                      value={formFornecedorCnpj}
                      onChange={(e) => setFormFornecedorCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
                    />
                  </div>
                </div>

                {/* Dados da Transportadora */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Nome da Transportadora *</label>
                    <input
                      type="text"
                      required
                      value={formTransportadoraNome}
                      onChange={(e) => setFormTransportadoraNome(e.target.value)}
                      placeholder="Ex: Braspress Transportes"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">CNPJ Transportadora (opcional)</label>
                    <input
                      type="text"
                      value={formTransportadoraCnpj}
                      onChange={(e) => setFormTransportadoraCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
                    />
                  </div>
                </div>

                {/* Nota Fiscal e Chave NF-e */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Nº da Nota Fiscal *</label>
                    <input
                      type="text"
                      required
                      value={formNumeroNf}
                      onChange={(e) => setFormNumeroNf(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-[var(--foreground)] block">Chave de Acesso NF-e (44 dígitos) *</label>
                    <input
                      type="text"
                      required
                      maxLength={44}
                      value={formChaveNfe}
                      onChange={(e) => setFormChaveNfe(e.target.value.replace(/\D/g, ""))}
                      placeholder="352611..."
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Volumes e Qtd NFs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">
                      Quantidade Total de Volumes * (Máx 500)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={formVolumes}
                      onChange={(e) => setFormVolumes(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Quantidade de NFs *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formQtdNfs}
                      onChange={(e) => setFormQtdNfs(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>
                </div>

                {/* Veículo e Motorista */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Tipo de Veículo *</label>
                    <select
                      value={formTipoVeiculo}
                      onChange={(e) => setFormTipoVeiculo(e.target.value as VeiculoTipo)}
                      className="w-full px-2.5 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    >
                      <option value="VUC">VUC</option>
                      <option value="3/4">3/4</option>
                      <option value="Toco">Toco</option>
                      <option value="Truck">Truck</option>
                      <option value="Carreta">Carreta</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Placa *</label>
                    <input
                      type="text"
                      required
                      value={formPlaca}
                      onChange={(e) => setFormPlaca(e.target.value.toUpperCase())}
                      placeholder="ABC-1234"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Nome Motorista *</label>
                    <input
                      type="text"
                      required
                      value={formMotoristaNome}
                      onChange={(e) => setFormMotoristaNome(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[var(--foreground)] block">Telefone Motorista *</label>
                    <input
                      type="text"
                      required
                      value={formMotoristaTelefone}
                      onChange={(e) => setFormMotoristaTelefone(e.target.value)}
                      placeholder="(11) 90000-0000"
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--foreground)] block">Observações Adicionais</label>
                  <input
                    type="text"
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                    placeholder="Instruções de descarga, tipo de carga, paletização..."
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                  />
                </div>

                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2 rounded-lg border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--muted)] font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold shadow-sm"
                  >
                    Confirmar Agendamento
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL DE CHECK-IN NA PORTARIA ─────────────────────────────────── */}
      {modalCheckInItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-500" />
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Registrar Check-in na Portaria
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCheckInItem(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)] text-xs space-y-1 font-mono">
              <div><strong>Protocolo:</strong> {modalCheckInItem.protocolo}</div>
              <div><strong>Fornecedor:</strong> {modalCheckInItem.fornecedorNome}</div>
              <div><strong>Placa:</strong> {modalCheckInItem.placaVeiculo} ({modalCheckInItem.tipoVeiculo})</div>
              <div><strong>Motorista:</strong> {modalCheckInItem.motoristaNome}</div>
              <div><strong>Janela Prevista:</strong> {modalCheckInItem.janela}</div>
            </div>

            <form onSubmit={handleConfirmarCheckIn} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">Guarita / Responsável:</label>
                <input
                  type="text"
                  required
                  value={responsavelPortariaInput}
                  onChange={(e) => setResponsavelPortariaInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">Observações da Chegada:</label>
                <input
                  type="text"
                  value={obsPortariaInput}
                  onChange={(e) => setObsPortariaInput(e.target.value)}
                  placeholder="Ex: Carga sem avarias visíveis, motorista com EPI"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCheckInItem(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--card-border)] text-[var(--muted)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE DETALHES COMPLETOS DO AGENDAMENTO ────────────────────── */}
      {modalDetalhesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Ficha do Agendamento • {modalDetalhesItem.protocolo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhesItem(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">
              <div>
                <span className="text-[var(--muted)] block">Fornecedor:</span>
                <strong className="text-[var(--foreground)]">{modalDetalhesItem.fornecedorNome}</strong>
                <span className="text-[10px] text-[var(--muted)] block font-mono">CNPJ: {modalDetalhesItem.fornecedorCnpj}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">Transportadora:</span>
                <strong className="text-[var(--foreground)]">{modalDetalhesItem.transportadoraNome}</strong>
                {modalDetalhesItem.transportadoraCnpj && (
                  <span className="text-[10px] text-[var(--muted)] block font-mono">CNPJ: {modalDetalhesItem.transportadoraCnpj}</span>
                )}
              </div>
              <div>
                <span className="text-[var(--muted)] block">Nota Fiscal & Volumes:</span>
                <strong className="text-[var(--foreground)] font-mono">NF {modalDetalhesItem.numeroNotaFiscal}</strong> ({modalDetalhesItem.quantidadeVolumes} vols / {modalDetalhesItem.quantidadeNfs} NFs)
              </div>
              <div>
                <span className="text-[var(--muted)] block">Veículo / Motorista:</span>
                <strong className="text-[var(--foreground)] font-mono">{modalDetalhesItem.placaVeiculo}</strong> ({modalDetalhesItem.tipoVeiculo}) — {modalDetalhesItem.motoristaNome} ({modalDetalhesItem.motoristaTelefone})
              </div>
              <div className="col-span-2">
                <span className="text-[var(--muted)] block">Chave de Acesso NF-e:</span>
                <span className="font-mono text-[10px] text-[var(--foreground)] break-all">{modalDetalhesItem.chaveNfe}</span>
              </div>
              {modalDetalhesItem.observacoes && (
                <div className="col-span-2">
                  <span className="text-[var(--muted)] block">Observações:</span>
                  <span className="text-[var(--foreground)] italic">{modalDetalhesItem.observacoes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {renderStatusBadge(modalDetalhesItem.status)}
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhesItem(null)}
                className="px-4 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--secondary)] font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
