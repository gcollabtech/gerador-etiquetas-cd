"use client";

import { useState, useMemo, useEffect } from "react";
import {
  EntregaAgendamento,
  AgendamentoStatus,
  AgendamentoCanal,
  JanelaHorario,
  VeiculoTipo,
  BloqueioJanela,
} from "@/lib/wmsTypes";
import {
  getAgendamentos,
  createAgendamento,
  registrarCheckInPortaria,
  updateAgendamentoStatus,
  getDisponibilidadeJanelas,
  toggleBloqueioJanela,
  getIndicadoresAgendamento,
  deleteAgendamento,
  cancelarAgendamento,
  remarcarAgendamento,
  criarBloqueio,
  removerBloqueio,
  getBloqueios,
  resetAgendamentosToSeed,
  syncAgendamentosFromServer,
  syncBloqueiosFromServer,
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
  ShieldCheck,
  Hash,
  RotateCcw,
  Trash2,
  CalendarClock,
  CalendarX2,
  CalendarDays,
  Wrench,
  Info,
  PackageCheck,
  RefreshCw,
  Package,
  ClipboardCheck,
  ClipboardList,
} from "lucide-react";
import { PortalUser } from "@/lib/authTypes";
import { WmsRecebimentoView } from "./wms/WmsRecebimentoView";
import { WmsArmazenagemView } from "./wms/WmsArmazenagemView";
import { WmsReabastecimentoView } from "./wms/WmsReabastecimentoView";
import { WmsPickingView } from "./wms/WmsPickingView";
import { WmsConferenciaView } from "./wms/WmsConferenciaView";
import { WmsExpedicaoView } from "./wms/WmsExpedicaoView";
import { WmsInventarioView } from "./wms/WmsInventarioView";
import { WmsQualidadeView } from "./wms/WmsQualidadeView";

interface WmsPortalViewProps {
  onNavigateToLabels?: () => void;
  activeSubTab?: WmsSubTab;
  onSelectSubTab?: (tab: WmsSubTab) => void;
  currentUser?: PortalUser;
}

export type WmsSubTab = "janelas" | "portaria" | "recebimento" | "armazenagem" | "reabastecimento" | "picking" | "conferencia" | "expedicao" | "inventario" | "qualidade" | "agendamentos" | "indicadores";

export function WmsPortalView({
  onNavigateToLabels,
  activeSubTab,
  onSelectSubTab,
  currentUser,
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
  const [modalExcluirItem, setModalExcluirItem] = useState<EntregaAgendamento | null>(null);

  // Cancelamento e Remarcação (Item 2.3)
  const [modalCancelarItem, setModalCancelarItem] = useState<EntregaAgendamento | null>(null);
  const [motivoCancelamentoInput, setMotivoCancelamentoInput] = useState("");
  const [modalRemarcarItem, setModalRemarcarItem] = useState<EntregaAgendamento | null>(null);
  const [remarcarNovaData, setRemarcarNovaData] = useState("2026-11-17");
  const [remarcarNovaJanela, setRemarcarNovaJanela] = useState<JanelaHorario>("08:00 - 10:00");
  const [remarcarMotivoInput, setRemarcarMotivoInput] = useState("");
  const [remarcarError, setRemarcarError] = useState<string | null>(null);

  // Gestão de Bloqueios (Item 2.3)
  const [modalGerenciarBloqueios, setModalGerenciarBloqueios] = useState(false);
  const [bloqueioNovaData, setBloqueioNovaData] = useState("2026-11-17");
  const [bloqueioNovaJanela, setBloqueioNovaJanela] = useState<JanelaHorario | "todas">("todas");
  const [bloqueioNovaDoca, setBloqueioNovaDoca] = useState("Todas as Docas");
  const [bloqueioNovoMotivo, setBloqueioNovoMotivo] = useState("");
  const [bloqueioNovoPeriodo, setBloqueioNovoPeriodo] = useState("Dia Integral");

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
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

  // Sincroniza dados com o Supabase na inicialização
  useEffect(() => {
    Promise.all([syncAgendamentosFromServer(), syncBloqueiosFromServer()]).then(() => {
      setRefreshKey((k) => k + 1);
    });
  }, []);

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

  const listaBloqueios = useMemo(() => {
    void refreshKey;
    return getBloqueios();
  }, [refreshKey]);

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

  const handleOpenCancelar = (agd: EntregaAgendamento) => {
    setModalCancelarItem(agd);
    setMotivoCancelamentoInput("");
  };

  const handleConfirmarCancelamento = () => {
    if (!modalCancelarItem) return;
    if (!motivoCancelamentoInput.trim()) {
      setToastMsg({ text: "Informe a justificativa do cancelamento.", type: "error" });
      return;
    }
    const res = cancelarAgendamento(modalCancelarItem.id, motivoCancelamentoInput.trim(), "Administração do CD");
    if (res.success) {
      setToastMsg({
        text: `Agendamento ${modalCancelarItem.protocolo} cancelado. Vaga e capacidade liberadas!`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
      if (modalDetalhesItem?.id === modalCancelarItem.id) {
        setModalDetalhesItem(null);
      }
      setModalCancelarItem(null);
    } else {
      setToastMsg({ text: res.error || "Erro ao cancelar agendamento.", type: "error" });
    }
  };

  const handleOpenRemarcar = (agd: EntregaAgendamento) => {
    setModalRemarcarItem(agd);
    setRemarcarNovaData(agd.data);
    setRemarcarNovaJanela(agd.janela);
    setRemarcarMotivoInput("");
    setRemarcarError(null);
  };

  const handleConfirmarRemarcacao = () => {
    if (!modalRemarcarItem) return;
    if (!remarcarMotivoInput.trim()) {
      setRemarcarError("Informe a justificativa da remarcação.");
      return;
    }
    const res = remarcarAgendamento(
      modalRemarcarItem.id,
      remarcarNovaData,
      remarcarNovaJanela,
      remarcarMotivoInput.trim(),
      "Administração do CD"
    );
    if (res.success) {
      setToastMsg({
        text: `Agendamento ${modalRemarcarItem.protocolo} remarcado para ${remarcarNovaData} às ${remarcarNovaJanela}!`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
      if (modalDetalhesItem?.id === modalRemarcarItem.id) {
        setModalDetalhesItem(null);
      }
      setModalRemarcarItem(null);
    } else {
      setRemarcarError(res.error || "Não foi possível remarcar o agendamento.");
    }
  };

  const handleCriarBloqueio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloqueioNovoMotivo.trim()) {
      setToastMsg({ text: "Informe o motivo do bloqueio.", type: "error" });
      return;
    }
    criarBloqueio({
      data: bloqueioNovaData,
      janela: bloqueioNovaJanela,
      docaId: bloqueioNovaDoca,
      motivo: bloqueioNovoMotivo.trim(),
      periodo: bloqueioNovoPeriodo,
      criadoPor: "Administração do CD",
    });
    setToastMsg({ text: "Bloqueio operacional registrado com sucesso!", type: "success" });
    setBloqueioNovoMotivo("");
    setRefreshKey((k) => k + 1);
  };

  const handleRemoverBloqueio = (id: string) => {
    removerBloqueio(id);
    setToastMsg({ text: "Bloqueio removido com sucesso!", type: "success" });
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const handleConfirmarExclusao = () => {
    if (!modalExcluirItem) return;
    const item = modalExcluirItem;
    const res = deleteAgendamento(item.id);
    if (res.success) {
      setToastMsg({
        text: `Agendamento ${item.protocolo} excluído com sucesso! Vaga e volumes liberados.`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
      if (modalDetalhesItem?.id === item.id) {
        setModalDetalhesItem(null);
      }
      setModalExcluirItem(null);
    } else {
      setToastMsg({
        text: res.error || "Não foi possível excluir o agendamento.",
        type: "error",
      });
    }
  };

  const handleRestaurarSeed = () => {
    if (typeof window !== "undefined" && confirm("Deseja restaurar a base de agendamentos demonstrativos do CD?")) {
      resetAgendamentosToSeed();
      setRefreshKey((k) => k + 1);
      setToastMsg({
        text: "Agendamentos demonstrativos restaurados com sucesso!",
        type: "success",
      });
    }
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

  const isAgendamentoModule =
    activeTab === "janelas" ||
    activeTab === "portaria" ||
    activeTab === "agendamentos" ||
    activeTab === "indicadores";

  return (
    <div className="space-y-6">
      {/* Toast de Notificação Feedback */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-sm ${
            toastMsg.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="font-semibold">{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 hover:opacity-75 cursor-pointer text-current"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── BARRA SUPERIOR DE MÓDULOS WMS (MÓDULOS 01 A 04) ──────────────── */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center shrink-0">
              <Boxes size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-base sm:text-lg text-[var(--foreground)]">
                  WMS — Warehouse Management System
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] font-bold">
                  CD Big Master / Collab
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Selecione o módulo operacional para gerenciar o fluxo físico e lógico de mercadorias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>9 Módulos Operacionais Integrados</span>
          </div>
        </div>

        {/* Grade dos 9 Módulos Operacionais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-3">
          {[
            {
              id: "agendamento",
              targetTab: isAgendamentoModule ? activeTab : ("janelas" as WmsSubTab),
              num: "01",
              title: "Agendamento",
              desc: "Janelas 2h em 2h, portaria e docas",
              icon: Clock,
              badge: "Portaria & Janelas",
              active: isAgendamentoModule,
            },
            {
              id: "recebimento",
              targetTab: "recebimento" as WmsSubTab,
              num: "02",
              title: "Recebimento",
              desc: "DANFE 44 dígitos, caixa master",
              icon: PackageCheck,
              badge: "DANFE & Doca",
              active: activeTab === "recebimento",
            },
            {
              id: "armazenagem",
              targetTab: "armazenagem" as WmsSubTab,
              num: "03",
              title: "Armazenagem",
              desc: "Mapa visual CD, sugestão IA",
              icon: Boxes,
              badge: "Mapa CD & Estoque",
              active: activeTab === "armazenagem",
            },
            {
              id: "reabastecimento",
              targetTab: "reabastecimento" as WmsSubTab,
              num: "04",
              title: "Reabastecimento",
              desc: "Picking, flow rack fixo e coletor",
              icon: RefreshCw,
              badge: "Picking & Coletor",
              active: activeTab === "reabastecimento",
            },
            {
              id: "picking",
              targetTab: "picking" as WmsSubTab,
              num: "05",
              title: "Picking",
              desc: "Pedidos ERP, ondas e cubagem",
              icon: Package,
              badge: "Separação & Coletor",
              active: activeTab === "picking",
            },
            {
              id: "conferencia",
              targetTab: "conferencia" as WmsSubTab,
              num: "06",
              title: "Conferência",
              desc: "Cega/dirigida e romaneio",
              icon: ClipboardCheck,
              badge: "Auditoria & Carga",
              active: activeTab === "conferencia",
            },
            {
              id: "expedicao",
              targetTab: "expedicao" as WmsSubTab,
              num: "07",
              title: "Expedição",
              desc: "Cargas, docas, romaneio e ERP",
              icon: Truck,
              badge: "Cargas & Saída",
              active: activeTab === "expedicao",
            },
            {
              id: "inventario",
              targetTab: "inventario" as WmsSubTab,
              num: "08",
              title: "Inventário",
              desc: "Geral, cíclico, cego e ajustes ERP",
              icon: ClipboardList,
              badge: "Auditoria & Saldo",
              active: activeTab === "inventario",
            },
            {
              id: "qualidade",
              targetTab: "qualidade" as WmsSubTab,
              num: "09",
              title: "Qualidade",
              desc: "Inspeções, RNC, laudos e bloqueios",
              icon: ShieldCheck,
              badge: "CQ & Quarentena",
              active: activeTab === "qualidade",
            },
          ].map((m) => {
            const ModIcon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveTab(m.targetTab)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                  m.active
                    ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] shadow-sm ring-1 ring-[var(--collab-mostarda)]/40"
                    : "bg-[var(--background)] border-[var(--card-border)] hover:border-[var(--collab-mostarda)]/50 hover:bg-[var(--secondary)]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        m.active
                          ? "bg-[var(--collab-mostarda)] text-black font-bold"
                          : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--collab-mostarda)] group-hover:scale-105"
                      }`}
                    >
                      <ModIcon size={16} />
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        m.active
                          ? "bg-[var(--collab-mostarda)] text-black"
                          : "bg-[var(--card)] text-[var(--muted)] border border-[var(--card-border)]"
                      }`}
                    >
                      Módulo {m.num}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`text-xs sm:text-sm font-bold font-heading line-clamp-1 ${
                        m.active ? "text-[var(--collab-mostarda)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {m.title}
                    </h3>
                    <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-0.5 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]/60 text-[10px]">
                  <span
                    className={`font-medium ${
                      m.active ? "text-[var(--collab-mostarda)] font-bold" : "text-[var(--muted)]"
                    }`}
                  >
                    {m.badge}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      m.active ? "text-[var(--collab-mostarda)]" : "text-[var(--muted)] group-hover:translate-x-0.5 transition-transform"
                    }`}
                  >
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTEXTO ESPECÍFICO DO MÓDULO 01 (AGENDAMENTO DE ENTREGAS) ───── */}
      {isAgendamentoModule && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header e Ações do Módulo 01 */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <h2 className="font-heading text-lg sm:text-xl font-bold text-[var(--foreground)]">
                Agendamento de Entregas & Recepção
              </h2>
              <p className="text-xs text-[var(--muted)] max-w-2xl">
                Gestão das janelas de recebimento (2h em 2h, máx. 2 fornecedores e 500 volumes), controle de portaria (check-in de chegada) e prevenção de filas nas docas.
              </p>
            </div>

            {/* Ações de Topo do Módulo 01 */}
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

          {/* KPI Cards Rápidos de Agendamento */}
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

          {/* Sub-Abas de Navegação das Funções do Módulo 01 */}
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
        </div>
      )}

      {/* ── ABA 1: GRADE DE JANELAS DE 2H EM 2H (Item 2.3) ────────────────── */}
      {activeTab === "janelas" && (
        <div className="space-y-4">
          {/* Barra de Controle de Data e Bloqueios Operacionais */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[var(--collab-mostarda)]" />
                <span className="text-xs font-bold text-[var(--foreground)]">Data de Operação do CD:</span>
                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono font-semibold focus:outline-none focus:border-[var(--collab-mostarda)] cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setModalGerenciarBloqueios(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-xs text-[var(--foreground)] font-medium cursor-pointer transition-all"
                title="Gerenciar bloqueio de datas, horários, docas e períodos"
              >
                <Ban size={13} className="text-red-500" />
                <span>Bloqueios & Manutenção</span>
                <span className="px-1.5 py-0.2 rounded-full bg-red-500/15 text-red-400 font-mono text-[10px] font-bold">
                  {listaBloqueios.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormJanela("08:00 - 10:00");
                  setIsNovoAgendamentoOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Novo Agendamento</span>
              </button>
            </div>
          </div>

          {/* Destaque das Regras e Exemplo de Capacidade (Item 2.3) */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-bold">
              <Info size={15} />
              <span>Regras de Agendamento & Capacidade Simultânea (Módulo 01 — Item 2.3)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--foreground)] leading-relaxed">
              <div className="space-y-1">
                <p>• <strong>Janelas de 2 em 2 horas:</strong> Cada janela recebe no <strong>máximo 2 fornecedores</strong> e até <strong>500 volumes</strong>.</p>
                <p>• <strong>Controle Simultâneo:</strong> O sistema bloqueia novos agendamentos assim que <em>qualquer um</em> dos dois limites for atingido.</p>
                <p>• <strong>Cancelamento & Remarcação:</strong> Permite remarcar para outra data/janela com validação automática de capacidade ou cancelar liberando a vaga.</p>
                <p>• <strong>Anti-Duplicidade:</strong> Sistema impede duplicidade para a mesma Nota Fiscal ou Chave de Acesso da NF-e.</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] font-mono text-[11px] space-y-1.5">
                <strong className="text-[var(--collab-mostarda)] block">Exemplo Prático de Capacidade (Janela 08h às 10h):</strong>
                <p className="text-[var(--muted)]">Fornecedor A: 300 vols + Fornecedor B: 200 vols = <strong>500 volumes</strong>.</p>
                <div className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-[10px]">
                  Situação: Janela 100% lotada — novos agendamentos bloqueados automaticamente.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {janelasCapacidade.map((item) => {
              const fornecedoresPct = (item.totalFornecedores / item.maxFornecedores) * 100;
              const volumesPct = (item.totalVolumes / item.maxVolumes) * 100;
              const isLotadaVolumes = item.totalVolumes >= item.maxVolumes;
              const isLotadaFornec = item.totalFornecedores >= item.maxFornecedores;
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
                              <span>Bloqueada (Manutenção / Operação)</span>
                            </span>
                          ) : isLotadaVolumes && isLotadaFornec ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1">
                              <ShieldAlert size={10} />
                              <span>Lotada (2 Fornec. e 500 Vols)</span>
                            </span>
                          ) : isLotadaVolumes ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                              <ShieldAlert size={10} />
                              <span>Lotada (500 Volumes Atingidos)</span>
                            </span>
                          ) : isLotadaFornec ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                              <ShieldAlert size={10} />
                              <span>Lotada (2 Fornecedores Atingidos)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Disponível ({item.maxFornecedores - item.totalFornecedores} vaga, {item.maxVolumes - item.totalVolumes} vols livres)</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {item.bloqueada
                            ? `Motivo: ${item.motivoBloqueio || "Manutenção interna"}`
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

                            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                              {agd.status === "confirmado" || agd.status === "em_transito" ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckIn(agd)}
                                  className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-semibold cursor-pointer transition-colors"
                                >
                                  Check-in Portaria
                                </button>
                              ) : null}

                              {agd.status !== "cancelado" && agd.status !== "finalizado" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRemarcar(agd)}
                                  className="px-2 py-1 rounded bg-[var(--card)] hover:bg-sky-500/10 border border-[var(--card-border)] hover:border-sky-500/30 text-sky-400 text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                                  title="Remarcar agendamento (outra data/horário)"
                                >
                                  <CalendarClock size={12} />
                                  <span>Remarcar</span>
                                </button>
                              )}

                              {agd.status !== "cancelado" && agd.status !== "finalizado" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelar(agd)}
                                  className="px-2 py-1 rounded bg-[var(--card)] hover:bg-amber-500/10 border border-[var(--card-border)] hover:border-amber-500/30 text-amber-500 text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                                  title="Cancelar agendamento"
                                >
                                  <CalendarX2 size={12} />
                                  <span>Cancelar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setModalDetalhesItem(agd)}
                                className="px-2.5 py-1 rounded bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)] text-[11px] font-medium cursor-pointer"
                              >
                                Ver Detalhes
                              </button>

                              <button
                                type="button"
                                onClick={() => setModalExcluirItem(agd)}
                                className="p-1.5 rounded bg-[var(--card)] hover:bg-red-500/15 border border-[var(--card-border)] hover:border-red-500/30 text-[var(--muted)] hover:text-red-500 text-[11px] font-medium cursor-pointer transition-colors"
                                title="Excluir este agendamento"
                              >
                                <Trash2 size={13} />
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

                            {agd.status !== "cancelado" && agd.status !== "finalizado" && (
                              <button
                                type="button"
                                onClick={() => handleOpenRemarcar(agd)}
                                className="p-1 rounded text-[var(--muted)] hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer transition-colors"
                                title="Remarcar data/horário"
                              >
                                <CalendarClock size={14} />
                              </button>
                            )}

                            {agd.status !== "cancelado" && agd.status !== "finalizado" && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelar(agd)}
                                className="p-1 rounded text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer transition-colors"
                                title="Cancelar agendamento"
                              >
                                <CalendarX2 size={14} />
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

                            <button
                              type="button"
                              onClick={() => setModalExcluirItem(agd)}
                              className="p-1 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                              title="Excluir agendamento"
                            >
                              <Trash2 size={14} />
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
                  <div className="flex items-center gap-1.5">
                    {agd.status !== "cancelado" && agd.status !== "finalizado" && (
                      <button
                        type="button"
                        onClick={() => handleOpenRemarcar(agd)}
                        className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer transition-colors"
                        title="Remarcar agendamento (outra data/janela)"
                      >
                        <CalendarClock size={13} />
                      </button>
                    )}
                    {agd.status !== "cancelado" && agd.status !== "finalizado" && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelar(agd)}
                        className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer transition-colors"
                        title="Cancelar agendamento"
                      >
                        <CalendarX2 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setModalExcluirItem(agd)}
                      className="p-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer transition-colors"
                      title="Excluir este agendamento"
                    >
                      <Trash2 size={13} />
                    </button>
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
              </div>
            ))}

            {agendamentosFiltrados.length === 0 && (
              <div className="col-span-full p-8 text-center bg-[var(--card)] border border-[var(--card-border)] rounded-2xl space-y-3">
                <p className="text-sm text-[var(--muted)]">Nenhum agendamento encontrado para os filtros selecionados.</p>
                <button
                  type="button"
                  onClick={handleRestaurarSeed}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--secondary)] text-xs text-[var(--collab-mostarda)] font-semibold cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Restaurar agendamentos demonstrativos</span>
                </button>
              </div>
            )}
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

      {/* ── ABA 5: MÓDULO 02 — RECEBIMENTO DE MERCADORIAS ──────────────────── */}
      {activeTab === "recebimento" && (
        <WmsRecebimentoView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 6: MÓDULO 03 — ARMAZENAGEM & ENDEREÇAMENTO ────────────────── */}
      {activeTab === "armazenagem" && (
        <WmsArmazenagemView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 7: MÓDULO 04 — REABASTECIMENTO DE PICKING & FLOW RACK ─────────── */}
      {activeTab === "reabastecimento" && (
        <WmsReabastecimentoView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 8: MÓDULO 05 — PICKING / SEPARAÇÃO ─────────────────────────── */}
      {activeTab === "picking" && (
        <WmsPickingView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 9: MÓDULO 06 — CONFERÊNCIA ─────────────────────────────────── */}
      {activeTab === "conferencia" && (
        <WmsConferenciaView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 10: MÓDULO 07 — EXPEDIÇÃO ──────────────────────────────────── */}
      {activeTab === "expedicao" && (
        <WmsExpedicaoView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 11: MÓDULO 08 — INVENTÁRIO ──────────────────────────────────── */}
      {activeTab === "inventario" && (
        <WmsInventarioView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
      )}

      {/* ── ABA 12: MÓDULO 09 — CONTROLE DE QUALIDADE ──────────────────────── */}
      {activeTab === "qualidade" && (
        <WmsQualidadeView
          currentUser={currentUser}
          onNavigateToLabels={onNavigateToLabels}
        />
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

              {modalDetalhesItem.motivoCancelamento && (
                <div className="col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <strong className="block text-xs font-bold">Cancelamento Administrativo:</strong>
                  <p className="text-[11px] mt-0.5">{modalDetalhesItem.motivoCancelamento}</p>
                  {modalDetalhesItem.dataCancelamento && (
                    <span className="text-[10px] text-[var(--muted)] block mt-1">
                      Cancelado em {new Date(modalDetalhesItem.dataCancelamento).toLocaleString()} por {modalDetalhesItem.canceladoPor || "Administração"}
                    </span>
                  )}
                </div>
              )}

              {modalDetalhesItem.historicoRemarcacoes && modalDetalhesItem.historicoRemarcacoes.length > 0 && (
                <div className="col-span-2 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 space-y-1">
                  <strong className="block text-xs font-bold">Histórico de Remarcações ({modalDetalhesItem.historicoRemarcacoes.length}):</strong>
                  {modalDetalhesItem.historicoRemarcacoes.map((h, i) => (
                    <div key={i} className="text-[11px] border-t border-sky-500/20 pt-1 mt-1 text-[var(--foreground)]">
                      <span>De <strong>{h.dataAnterior} ({h.janelaAnterior})</strong> para <strong>{h.novaData} ({h.novaJanela})</strong></span>
                      <p className="text-[10px] text-[var(--muted)] italic">Motivo: {h.motivo} — por {h.alteradoPor} em {new Date(h.alteradoEm).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs pt-2 gap-2">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {renderStatusBadge(modalDetalhesItem.status)}
              </div>
              <div className="flex items-center gap-2">
                {modalDetalhesItem.status !== "cancelado" && modalDetalhesItem.status !== "finalizado" && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = modalDetalhesItem;
                      setModalDetalhesItem(null);
                      handleOpenRemarcar(item);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 font-semibold cursor-pointer transition-colors"
                  >
                    <CalendarClock size={13} />
                    <span>Remarcar</span>
                  </button>
                )}

                {modalDetalhesItem.status !== "cancelado" && modalDetalhesItem.status !== "finalizado" && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = modalDetalhesItem;
                      setModalDetalhesItem(null);
                      handleOpenCancelar(item);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-semibold cursor-pointer transition-colors"
                  >
                    <CalendarX2 size={13} />
                    <span>Cancelar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setModalExcluirItem(modalDetalhesItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold cursor-pointer transition-colors"
                  title="Excluir este agendamento"
                >
                  <Trash2 size={13} />
                  <span>Excluir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalDetalhesItem(null)}
                  className="px-4 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--secondary)] font-medium cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE REMARCAÇÃO DE AGENDAMENTO (Item 2.3) ─────────────────── */}
      {modalRemarcarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--card)] border border-sky-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2 text-sky-400">
                <CalendarClock size={20} />
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Remarcar Agendamento • {modalRemarcarItem.protocolo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRemarcarItem(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-xs space-y-1 font-mono">
              <div><span className="text-[var(--muted)]">Fornecedor:</span> <strong>{modalRemarcarItem.fornecedorNome}</strong></div>
              <div><span className="text-[var(--muted)]">Carga:</span> <strong>{modalRemarcarItem.quantidadeVolumes} volumes</strong> (NF {modalRemarcarItem.numeroNotaFiscal})</div>
              <div><span className="text-[var(--muted)]">Horário Atual:</span> {modalRemarcarItem.data} às {modalRemarcarItem.janela}</div>
            </div>

            {remarcarError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{remarcarError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--foreground)] block">Nova Data Prevista *</label>
                  <input
                    type="date"
                    required
                    value={remarcarNovaData}
                    onChange={(e) => {
                      setRemarcarNovaData(e.target.value);
                      setRemarcarError(null);
                    }}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--foreground)] block">Nova Janela de Horário (2h em 2h) *</label>
                  <select
                    value={remarcarNovaJanela}
                    onChange={(e) => {
                      setRemarcarNovaJanela(e.target.value as JanelaHorario);
                      setRemarcarError(null);
                    }}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {JANELAS_PADRAO.map((j) => (
                      <option key={j} value={j}>
                        Janela {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">Motivo / Justificativa da Remarcação *</label>
                <textarea
                  rows={2}
                  required
                  value={remarcarMotivoInput}
                  onChange={(e) => setRemarcarMotivoInput(e.target.value)}
                  placeholder="Ex: Atraso na rota da transportadora, reagendamento preventivo pelo fornecedor"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-[11px] text-[var(--muted)] leading-relaxed">
                A remarcação valida automaticamente a capacidade máxima de <strong>2 fornecedores</strong> e <strong>500 volumes</strong> na janela pretendida. Se qualquer um dos limites for ultrapassado, a remarcação será recusada.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalRemarcarItem(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarRemarcacao}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  <CalendarClock size={14} />
                  <span>Confirmar Remarcação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CANCELAMENTO DE AGENDAMENTO (Item 2.3) ────────────────── */}
      {modalCancelarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-amber-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <CalendarX2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Cancelar Agendamento de Entrega
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  O agendamento será cancelado na base do CD, liberando imediatamente a vaga e os volumes da janela para outros fornecedores.
                </p>
              </div>
            </div>

            <div className="bg-[var(--background)] p-3.5 rounded-xl border border-[var(--card-border)] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Protocolo:</span>
                <strong className="text-[var(--collab-mostarda)]">{modalCancelarItem.protocolo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Fornecedor:</span>
                <strong className="text-[var(--foreground)] truncate max-w-[200px]">{modalCancelarItem.fornecedorNome}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Carga:</span>
                <strong>{modalCancelarItem.quantidadeVolumes} vols • NF {modalCancelarItem.numeroNotaFiscal}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Janela:</span>
                <strong>{modalCancelarItem.janela} • {modalCancelarItem.data}</strong>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-[var(--foreground)] block">
                Motivo / Justificativa do Cancelamento *
              </label>
              <textarea
                rows={3}
                required
                value={motivoCancelamentoInput}
                onChange={(e) => setMotivoCancelamentoInput(e.target.value)}
                placeholder="Ex: Fornecedor cancelou a expedição por avaria na carga, erro de faturamento na NF"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalCancelarItem(null)}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelamento}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                <CalendarX2 size={13} />
                <span>Confirmar Cancelamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE GESTÃO DE BLOQUEIOS DO CD (Item 2.3) ──────────────────── */}
      {modalGerenciarBloqueios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <Ban size={20} className="text-red-500" />
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Bloqueio de Datas, Horários, Docas e Períodos (Item 2.3)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Controle de indisponibilidade para manutenção preventiva ou operação interna do CD.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalGerenciarBloqueios(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário para novo bloqueio */}
            <form onSubmit={handleCriarBloqueio} className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl space-y-3 text-xs">
              <strong className="block text-xs font-bold text-[var(--foreground)]">
                + Novo Bloqueio Operacional:
              </strong>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--muted)] block">Data *</label>
                  <input
                    type="date"
                    required
                    value={bloqueioNovaData}
                    onChange={(e) => setBloqueioNovaData(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--muted)] block">Janela / Horário *</label>
                  <select
                    value={bloqueioNovaJanela}
                    onChange={(e) => setBloqueioNovaJanela(e.target.value as JanelaHorario | "todas")}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] font-mono"
                  >
                    <option value="todas">Todas as Janelas (Dia Integral)</option>
                    {JANELAS_PADRAO.map((j) => (
                      <option key={j} value={j}>Janela {j}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--muted)] block">Doca Afetada</label>
                  <select
                    value={bloqueioNovaDoca}
                    onChange={(e) => setBloqueioNovaDoca(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)]"
                  >
                    <option value="Todas as Docas">Todas as Docas do CD</option>
                    <option value="Doca 01 — Secos">Doca 01 — Secos</option>
                    <option value="Doca 02 — Fracionados">Doca 02 — Fracionados</option>
                    <option value="Doca 03 — Carga Geral">Doca 03 — Carga Geral</option>
                    <option value="Doca 04 — Alto Giro">Doca 04 — Alto Giro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[var(--muted)] block">Motivo do Bloqueio *</label>
                  <input
                    type="text"
                    required
                    value={bloqueioNovoMotivo}
                    onChange={(e) => setBloqueioNovoMotivo(e.target.value)}
                    placeholder="Ex: Manutenção de nivelador hidráulico de doca, inventário anual"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--muted)] block">Período / Turno</label>
                  <input
                    type="text"
                    value={bloqueioNovoPeriodo}
                    onChange={(e) => setBloqueioNovoPeriodo(e.target.value)}
                    placeholder="Ex: Turno Manhã"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                >
                  Registrar Bloqueio
                </button>
              </div>
            </form>

            {/* Lista de bloqueios ativos */}
            <div className="space-y-2">
              <strong className="block text-xs font-bold text-[var(--foreground)]">
                Bloqueios Ativos no CD ({listaBloqueios.length}):
              </strong>

              {listaBloqueios.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--muted)]">
                  Nenhum bloqueio cadastrado. Todas as docas e janelas estão operacionais.
                </div>
              ) : (
                <div className="space-y-2">
                  {listaBloqueios.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-400 font-mono">
                            {b.data} • {b.janela === "todas" ? "Dia Integral" : b.janela}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 font-medium border border-red-500/20">
                            {b.docaId || "Todas as Docas"}
                          </span>
                        </div>
                        <p className="text-[var(--foreground)]">{b.motivo}</p>
                        <span className="text-[10px] text-[var(--muted)] block">
                          Cadastrado por {b.criadoPor} em {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverBloqueio(b.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        <Unlock size={12} />
                        <span>Desbloquear</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalGerenciarBloqueios(false)}
                className="px-5 py-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--foreground)] font-semibold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE AGENDAMENTO ──────────────── */}
      {modalExcluirItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Excluir Agendamento de Entrega
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Esta ação removerá o agendamento da base do CD e liberará a vaga na janela de recebimento.
                </p>
              </div>
            </div>

            <div className="bg-[var(--background)] p-3.5 rounded-xl border border-[var(--card-border)] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Protocolo:</span>
                <strong className="text-[var(--collab-mostarda)]">{modalExcluirItem.protocolo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Fornecedor:</span>
                <strong className="text-[var(--foreground)] truncate max-w-[220px]">{modalExcluirItem.fornecedorNome}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Nota Fiscal:</span>
                <strong className="text-[var(--foreground)]">NF {modalExcluirItem.numeroNotaFiscal} ({modalExcluirItem.quantidadeVolumes} vols)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Janela / Data:</span>
                <strong className="text-[var(--foreground)]">{modalExcluirItem.janela} • {modalExcluirItem.data}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 leading-relaxed flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>Atenção: A exclusão é definitiva. As vagas ocupadas por este fornecedor e seus volumes serão recalculadas imediatamente.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalExcluirItem(null)}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                <Trash2 size={13} />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
