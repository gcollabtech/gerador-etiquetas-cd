// src/components/wms/WmsConferenciaView.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RegistroConferencia,
  StatusConferencia,
  TipoConferencia,
  TipoDivergenciaConferencia,
  IndicadoresConferencia,
  ItemConferencia,
  VolumeConferencia,
  DivergenciaHistorico,
} from "@/lib/wmsConferenciaTypes";
import {
  fetchConferencias,
  iniciarConferenciaService,
  executarBipagemService,
  registrarDivergenciaManualService,
  enviarDivergenciaParaAnaliseService,
  solicitarRecontagemService,
  finalizarConferenciaService,
  liberarParaExpedicaoService,
  gerarEtiquetasVolumesService,
  gerarRomaneioService,
} from "@/lib/wmsConferenciaService";
import { PortalUser } from "@/lib/authTypes";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Package,
  Boxes,
  Truck,
  Eye,
  EyeOff,
  Barcode,
  Search,
  Filter,
  Printer,
  FileText,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Calendar,
  Clock,
  Sparkles,
  Camera,
  Check,
  X,
  RefreshCw,
  Send,
  Lock,
} from "lucide-react";

interface WmsConferenciaViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

export function WmsConferenciaView({ currentUser, onNavigateToLabels }: WmsConferenciaViewProps) {
  const [conferencias, setConferencias] = useState<RegistroConferencia[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresConferencia>({
    totalAguardando: 0,
    totalEmConferencia: 0,
    totalDivergencias: 0,
    totalAguardandoCorrecao: 0,
    totalRecontagem: 0,
    totalConferido: 0,
    totalLiberado: 0,
    totalGeral: 0,
    acuracidadePct: 100,
    tempoMedioConferenciaMin: 20,
  });

  const [activeSubTab, setActiveSubTab] = useState<"fila" | "estacao" | "divergencias" | "etiquetas" | "romaneio">("fila");
  const [selectedConfId, setSelectedConfId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // Filtros da Fila
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [buscaTermo, setBuscaTermo] = useState("");

  // Estação de Bipagem
  const [codigoBipado, setCodigoBipado] = useState("");
  const [loteBipado, setLoteBipado] = useState("");
  const [validadeBipada, setValidadeBipada] = useState("");
  const [volumeSelecionadoId, setVolumeSelecionadoId] = useState<string>("");
  const [qtdBipadaInput, setQtdBipadaInput] = useState<number>(1);
  const [scanFeedback, setScanFeedback] = useState<{ tipo: "ok" | "erro" | "alerta"; msg: string } | null>(null);

  // Modais
  const [modalIniciarOpen, setModalIniciarOpen] = useState(false);
  const [modalIniciarItem, setModalIniciarItem] = useState<RegistroConferencia | null>(null);
  const [iniciarTipoConf, setIniciarTipoConf] = useState<TipoConferencia>("dirigida");

  const [modalDivergenciaManualOpen, setModalDivergenciaManualOpen] = useState(false);
  const [itemDivergenciaSelecionado, setItemDivergenciaSelecionado] = useState<ItemConferencia | null>(null);
  const [tipoDivManual, setTipoDivManual] = useState<TipoDivergenciaConferencia>("avaria");
  const [motivoDivManual, setMotivoDivManual] = useState("");

  const [modalRecontagemOpen, setModalRecontagemOpen] = useState(false);
  const [novoOperadorId, setNovoOperadorId] = useState("usr-04");
  const [novoOperadorNome, setNovoOperadorNome] = useState("Juliana Santos (Conferente Sênior)");
  const [motivoRecontagem, setMotivoRecontagem] = useState("Divergência de contagem inicial constatada na estação.");

  // Carrega conferências
  useEffect(() => {
    fetchConferencias().then((res) => {
      setConferencias(res.conferencias);
      setIndicadores(res.indicadores);
      if (res.conferencias.length > 0 && !selectedConfId) {
        setSelectedConfId(res.conferencias[0]?.id || null);
      }
    });
  }, [refreshKey]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const conferenciaAtiva = useMemo(() => {
    return conferencias.find((c) => c.id === selectedConfId) || conferencias[0] || null;
  }, [conferencias, selectedConfId]);

  // Lista Filtrada
  const conferenciasFiltradas = useMemo(() => {
    return conferencias.filter((c) => {
      if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
      if (buscaTermo) {
        const t = buscaTermo.toLowerCase();
        return (
          c.numero_pedido.toLowerCase().includes(t) ||
          c.loja_destino.toLowerCase().includes(t) ||
          c.cod_loja.toLowerCase().includes(t) ||
          c.rota_entrega.toLowerCase().includes(t) ||
          c.transportadora.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [conferencias, filtroStatus, buscaTermo]);

  // Ações
  const handleIniciarConferencia = async () => {
    if (!modalIniciarItem) return;
    const res = await iniciarConferenciaService(
      modalIniciarItem.id,
      currentUser?.id || "usr-03",
      currentUser?.name || "Operador de Conferência",
      iniciarTipoConf
    );
    if (res.success) {
      setToastMsg({ text: `Conferência iniciada em modo ${iniciarTipoConf === "cega" ? "CEGO" : "DIRIGIDO"}!`, type: "success" });
      setSelectedConfId(modalIniciarItem.id);
      setActiveSubTab("estacao");
      setModalIniciarOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao iniciar conferência.", type: "error" });
    }
  };

  const handleExecutarScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!conferenciaAtiva || !codigoBipado.trim()) return;

    setScanFeedback(null);
    const res = await executarBipagemService({
      conferencia_id: conferenciaAtiva.id,
      codigo_lido: codigoBipado.trim(),
      lote_lido: loteBipado.trim() || undefined,
      validade_lida: validadeBipada.trim() || undefined,
      volume_id: volumeSelecionadoId || undefined,
      quantidade_bipada: qtdBipadaInput,
      operador_nome: currentUser?.name || "Conferente",
    });

    if (res.bloqueado) {
      setScanFeedback({ tipo: "erro", msg: res.mensagem });
      setToastMsg({ text: res.mensagem, type: "error" });
    } else if (res.success) {
      setScanFeedback({ tipo: "ok", msg: res.mensagem });
      setToastMsg({ text: res.mensagem, type: "success" });
      setCodigoBipado("");
    } else {
      setScanFeedback({ tipo: "alerta", msg: res.mensagem || res.error || "Erro na bipagem." });
      setToastMsg({ text: res.mensagem || res.error || "Erro na bipagem.", type: "warning" });
    }
    setRefreshKey((k) => k + 1);
  };

  const handleSalvarDivergenciaManual = async () => {
    if (!conferenciaAtiva || !itemDivergenciaSelecionado || !motivoDivManual.trim()) {
      setToastMsg({ text: "Informe o motivo da divergência.", type: "warning" });
      return;
    }

    const res = await registrarDivergenciaManualService({
      conferencia_id: conferenciaAtiva.id,
      item_id: itemDivergenciaSelecionado.id,
      tipo: tipoDivManual,
      motivo: motivoDivManual.trim(),
      operador_nome: currentUser?.name || "Conferente",
    });

    if (res.success) {
      setToastMsg({ text: "Divergência registrada com sucesso! Pedido em status de divergência.", type: "warning" });
      setModalDivergenciaManualOpen(false);
      setMotivoDivManual("");
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao registrar divergência.", type: "error" });
    }
  };

  const handleExecutarRecontagem = async () => {
    if (!conferenciaAtiva) return;
    const res = await solicitarRecontagemService(
      conferenciaAtiva.id,
      novoOperadorId,
      novoOperadorNome,
      motivoRecontagem
    );

    if (res.success) {
      setToastMsg({ text: `Recontagem solicitada com sucesso para ${novoOperadorNome}!`, type: "success" });
      setModalRecontagemOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao solicitar recontagem.", type: "error" });
    }
  };

  const handleFinalizarConferencia = async () => {
    if (!conferenciaAtiva) return;
    const res = await finalizarConferenciaService(conferenciaAtiva.id, currentUser?.name || "Conferente");

    if (res.success) {
      setToastMsg({ text: "Conferência finalizada com 100% de conformidade!", type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Bloqueio de segurança na finalização.", type: "error" });
    }
  };

  const handleLiberarExpedicao = async () => {
    if (!conferenciaAtiva) return;
    const res = await liberarParaExpedicaoService(conferenciaAtiva.id);
    if (res.success) {
      setToastMsg({ text: "Pedido liberado com sucesso para a Doca de Expedição!", type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao liberar para expedição.", type: "error" });
    }
  };

  const handleGerarEtiquetas = async () => {
    if (!conferenciaAtiva) return;
    const res = await gerarEtiquetasVolumesService(conferenciaAtiva.id);
    if (res.success) {
      setToastMsg({ text: `Etiquetas geradas para todos os ${res.total_volumes} volumes!`, type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao gerar etiquetas.", type: "error" });
    }
  };

  const handleGerarRomaneio = async () => {
    if (!conferenciaAtiva) return;
    const res = await gerarRomaneioService(conferenciaAtiva.id);
    if (res.success) {
      setToastMsg({ text: "Romaneio de Conferência emitido com sucesso!", type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao gerar romaneio.", type: "error" });
    }
  };

  // Helper de badges de status
  const getStatusBadge = (status: StatusConferencia) => {
    switch (status) {
      case "aguardando_conferencia":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Aguardando Conferência</span>;
      case "em_conferencia":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/40 animate-pulse">Em Conferência</span>;
      case "divergencia_identificada":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">Divergência Identificada</span>;
      case "aguardando_correcao":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">Aguardando Correção</span>;
      case "recontagem":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">Em Recontagem</span>;
      case "conferido":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Conferido 100%</span>;
      case "liberado_expedicao":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">Liberado para Expedição</span>;
      default:
        return null;
    }
  };

  // Validação de divergências pendentes no pedido ativo
  const temDivergenciaAtiva = useMemo(() => {
    if (!conferenciaAtiva) return false;
    const temItemDivergente = conferenciaAtiva.itens.some(
      (it) => it.quantidade_conferida !== it.quantidade_esperada || it.status_item === "divergente" || it.status_item === "excedente"
    );
    const temDivNaoResolvida = conferenciaAtiva.divergencias.some((d) => d.status_resolucao === "pendente_analise");
    return temItemDivergente || temDivNaoResolvida;
  }, [conferenciaAtiva]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold border animate-slideUp ${
            toastMsg.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
              : toastMsg.type === "warning"
              ? "bg-amber-950/90 text-amber-300 border-amber-500/50"
              : "bg-red-950/90 text-red-300 border-red-500/50"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : toastMsg.type === "warning" ? (
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          ) : (
            <ShieldAlert size={18} className="text-red-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ── PAINEL VISUAL DE STATUS & QUANTIDADES (ITEM 6.5) ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Aguardando</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold font-heading text-amber-400">{indicadores.totalAguardando}</div>
          <span className="text-[10px] text-[var(--muted)] block">Aguardando conferente</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Em Andamento</span>
            <Barcode size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--collab-mostarda)]">{indicadores.totalEmConferencia}</div>
          <span className="text-[10px] text-[var(--muted)] block">Na bancada / coletor</span>
        </div>

        <div className="bg-[var(--card)] border border-red-500/30 rounded-xl p-3 space-y-1 bg-red-500/5">
          <div className="flex items-center justify-between text-xs text-red-400">
            <span>Divergências</span>
            <AlertTriangle size={14} className="text-red-400" />
          </div>
          <div className="text-xl font-bold font-heading text-red-400">{indicadores.totalDivergencias}</div>
          <span className="text-[10px] text-red-300 block">Falta, sobra ou avaria</span>
        </div>

        <div className="bg-[var(--card)] border border-purple-500/30 rounded-xl p-3 space-y-1 bg-purple-500/5">
          <div className="flex items-center justify-between text-xs text-purple-400">
            <span>Recontagem</span>
            <RotateCcw size={14} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold font-heading text-purple-400">{indicadores.totalRecontagem}</div>
          <span className="text-[10px] text-purple-300 block">Auditoria 2ª rodada</span>
        </div>

        <div className="bg-[var(--card)] border border-emerald-500/30 rounded-xl p-3 space-y-1 bg-emerald-500/5">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Conferidos</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-heading text-emerald-400">{indicadores.totalConferido}</div>
          <span className="text-[10px] text-emerald-300 block">100% validados</span>
        </div>

        <div className="bg-[var(--card)] border border-sky-500/30 rounded-xl p-3 space-y-1 bg-sky-500/5">
          <div className="flex items-center justify-between text-xs text-sky-400">
            <span>Liberados</span>
            <Truck size={14} className="text-sky-400" />
          </div>
          <div className="text-xl font-bold font-heading text-sky-400">{indicadores.totalLiberado}</div>
          <span className="text-[10px] text-sky-300 block">Para Doca / Expedição</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Acuracidade</span>
            <Sparkles size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--foreground)]">{indicadores.acuracidadePct}%</div>
          <span className="text-[10px] text-emerald-400 block">Meta &ge; 99.5%</span>
        </div>
      </div>

      {/* ── NAVEGAÇÃO DE SUB-ABAS DO MÓDULO 06 ───────────────────────────────── */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab("fila")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "fila"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <ClipboardCheck size={15} />
          <span>Fila de Pedidos & Volumes</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--card-border)] text-[var(--foreground)] font-mono">
            {conferencias.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("estacao")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "estacao"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Barcode size={15} />
          <span>Estação de Conferência / Bipagem</span>
          {conferenciaAtiva && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] font-mono font-bold">
              {conferenciaAtiva.numero_pedido}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("divergencias")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "divergencias"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <AlertTriangle size={15} className="text-red-400" />
          <span>Quarentena & Divergências</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-mono font-bold">
            {indicadores.totalDivergencias}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("etiquetas")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "etiquetas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Printer size={15} />
          <span>Etiquetas de Volumes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("romaneio")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "romaneio"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileText size={15} />
          <span>Romaneio de Conferência</span>
        </button>
      </div>

      {/* ── SUB-ABA 1: FILA DE PEDIDOS & VOLUMES ─────────────────────────────── */}
      {activeSubTab === "fila" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card)] p-3.5 rounded-xl border border-[var(--card-border)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
              <input
                type="text"
                placeholder="Filtrar por pedido, loja, rota ou transportadora..."
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--muted)]" />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs px-2.5 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
              >
                <option value="todos">Todos os Status</option>
                <option value="aguardando_conferencia">Aguardando Conferência</option>
                <option value="em_conferencia">Em Conferência</option>
                <option value="divergencia_identificada">Divergência Identificada</option>
                <option value="recontagem">Em Recontagem</option>
                <option value="conferido">Conferido</option>
                <option value="liberado_expedicao">Liberado para Expedição</option>
              </select>
            </div>
          </div>

          {/* Tabela de Pedidos */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-4 py-3">Pedido / Destino</th>
                    <th className="px-3 py-3">Rota & Transportadora</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Itens / Volumes</th>
                    <th className="px-3 py-3">Conferente / Horário</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {conferenciasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--muted)]">
                        Nenhum pedido encontrado para conferência com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    conferenciasFiltradas.map((conf) => {
                      const isSelected = conferenciaAtiva?.id === conf.id;
                      return (
                        <tr
                          key={conf.id}
                          className={`hover:bg-[var(--secondary)] transition-colors ${
                            isSelected ? "bg-[var(--collab-mostarda)]/5 font-medium" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--foreground)]">{conf.numero_pedido}</div>
                            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                              <span>{conf.loja_destino}</span>
                              <span className="font-mono text-[10px] text-[var(--collab-mostarda)] font-semibold">
                                ({conf.cod_loja})
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="text-[var(--foreground)]">{conf.rota_entrega}</div>
                            <div className="text-[10px] text-[var(--muted)]">{conf.transportadora}</div>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                conf.tipo_conferencia === "cega"
                                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                  : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              }`}
                            >
                              {conf.tipo_conferencia === "cega" ? <EyeOff size={11} /> : <Eye size={11} />}
                              <span>{conf.tipo_conferencia === "cega" ? "Cega" : "Dirigida"}</span>
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <div className="text-[var(--foreground)] font-mono font-semibold">
                              {conf.total_itens_conferidos} / {conf.total_itens_esperados} itens
                            </div>
                            <div className="text-[10px] text-[var(--muted)]">
                              {conf.total_volumes} volume(s)
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="text-[var(--foreground)]">
                              {conf.conferente_nome || <span className="text-[var(--muted)] italic">Não alocado</span>}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              {conf.data_inicio ? `Início: ${conf.data_inicio.split(" ")[1]}` : "—"}
                            </div>
                          </td>

                          <td className="px-3 py-3">{getStatusBadge(conf.status)}</td>

                          <td className="px-4 py-3 text-right">
                            {conf.status === "aguardando_conferencia" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setModalIniciarItem(conf);
                                  setIniciarTipoConf(conf.tipo_conferencia);
                                  setModalIniciarOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <span>Iniciar</span>
                                <ArrowRight size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedConfId(conf.id);
                                  setActiveSubTab("estacao");
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <Barcode size={13} className="text-[var(--collab-mostarda)]" />
                                <span>Abrir</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-ABA 2: ESTAÇÃO DE CONFERÊNCIA / BIPAGEM ──────────────────────── */}
      {activeSubTab === "estacao" && (
        <div className="space-y-5">
          {conferenciaAtiva ? (
            <>
              {/* Header do Pedido em Conferência */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center font-bold shrink-0">
                      <Barcode size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-heading">
                          {conferenciaAtiva.numero_pedido}
                        </h2>
                        {getStatusBadge(conferenciaAtiva.status)}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                            conferenciaAtiva.tipo_conferencia === "cega"
                              ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                              : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                          }`}
                        >
                          {conferenciaAtiva.tipo_conferencia === "cega" ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>Modo {conferenciaAtiva.tipo_conferencia === "cega" ? "Cego" : "Dirigido"}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Destino: <strong className="text-[var(--foreground)]">{conferenciaAtiva.loja_destino}</strong> ({conferenciaAtiva.cod_loja}) • Rota: {conferenciaAtiva.rota_entrega} • Conferente: {conferenciaAtiva.conferente_nome || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Estado */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalRecontagemOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-400 text-xs font-bold hover:bg-purple-500/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Recontagem 2ª Rodada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab("romaneio");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={13} className="text-[var(--collab-mostarda)]" />
                      <span>Romaneio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab("etiquetas");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={13} className="text-sky-400" />
                      <span>Etiquetas Volumes</span>
                    </button>

                    {conferenciaAtiva.status === "conferido" ? (
                      <button
                        type="button"
                        onClick={handleLiberarExpedicao}
                        className="px-4 py-1.5 rounded-lg bg-sky-500 text-black text-xs font-black hover:brightness-110 flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Truck size={14} />
                        <span>Liberar Expedição</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinalizarConferencia}
                        disabled={temDivergenciaAtiva}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                          temDivergenciaAtiva
                            ? "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-70"
                            : "bg-emerald-500 text-black hover:brightness-110 cursor-pointer"
                        }`}
                        title={temDivergenciaAtiva ? "Bloqueado: Existem divergências pendentes!" : "Concluir conferência"}
                      >
                        {temDivergenciaAtiva ? <Lock size={13} /> : <CheckCircle2 size={13} />}
                        <span>Finalizar Conferência</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner de Aviso de Trava / Divergência (Regra 6.4) */}
                {temDivergenciaAtiva && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                    <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-red-400 block font-bold">
                        REGRA 6.4 — BLOQUEIO RÍGIDO: Não é permitido finalizar pedidos com divergências pendentes!
                      </strong>
                      <span>
                        Corrija as quantidades físicas, direcione o produto para análise/quarentena ou solicite recontagem por outro operador antes da liberação.
                      </span>
                    </div>
                  </div>
                )}

                {/* Terminal de Bipagem */}
                <form onSubmit={handleExecutarScan} className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                      <Barcode size={15} className="text-[var(--collab-mostarda)]" />
                      <span>Terminal de Leitura do Coletor / Leitor Laser</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] font-mono">Bipe o EAN, código interno ou barra alfa</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Código de Barras / EAN / SKU:</label>
                      <input
                        type="text"
                        placeholder="Ex: 7891000100018 ou PRD-1001"
                        value={codigoBipado}
                        onChange={(e) => setCodigoBipado(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono font-bold text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                        autoFocus
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Lote (Opcional):</label>
                      <input
                        type="text"
                        placeholder="Ex: L26-A101"
                        value={loteBipado}
                        onChange={(e) => setLoteBipado(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Validade (AAAA-MM-DD):</label>
                      <input
                        type="text"
                        placeholder="2027-05-15"
                        value={validadeBipada}
                        onChange={(e) => setValidadeBipada(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Volume Alocado:</label>
                      <select
                        value={volumeSelecionadoId}
                        onChange={(e) => setVolumeSelecionadoId(e.target.value)}
                        className="w-full px-2 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                      >
                        <option value="">Automático</option>
                        {conferenciaAtiva.volumes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.codigo_volume} ({v.numero_volume}/{v.total_volumes})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-[var(--collab-mostarda)] text-black font-bold text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Check size={14} />
                        <span>Bipar (Enter)</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback de Bipagem */}
                  {scanFeedback && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        scanFeedback.tipo === "ok"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : scanFeedback.tipo === "erro"
                          ? "bg-red-500/15 text-red-400 border border-red-500/40"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {scanFeedback.tipo === "ok" ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <AlertTriangle size={15} />
                      )}
                      <span>{scanFeedback.msg}</span>
                    </div>
                  )}

                  {/* Botões de Simulação de Leitor */}
                  <div className="pt-2 border-t border-[var(--card-border)] flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[10px] text-[var(--muted)] mr-1">Atalhos de Bipagem Rápida:</span>
                    {conferenciaAtiva.itens.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setCodigoBipado(it.ean);
                          setLoteBipado(it.lote_esperado);
                          setValidadeBipada(it.validade_esperada);
                        }}
                        className="px-2 py-1 rounded bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)] font-mono text-[10px] cursor-pointer"
                      >
                        Bipar {it.cod_produto} ({it.ean.slice(-4)})
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCodigoBipado("7899999999999");
                        setLoteBipado("LOTE-INVALIDO");
                      }}
                      className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[10px] cursor-pointer"
                      title="Testa a trava de produto divergente que não pertence ao pedido"
                    >
                      Simular Produto Não Pertencente
                    </button>
                  </div>
                </form>

                {/* Tabela de Itens com Modo Cego / Dirigido */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Produtos do Pedido ({conferenciaAtiva.itens.length} SKU)
                    </h3>
                    <div className="text-[11px] font-mono text-[var(--muted)]">
                      {conferenciaAtiva.tipo_conferencia === "cega" ? (
                        <span className="text-purple-400 font-semibold flex items-center gap-1">
                          <EyeOff size={12} />
                          <span>Modo Cego: Quantidades esperadas ocultas ao operador</span>
                        </span>
                      ) : (
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <Eye size={12} />
                          <span>Modo Dirigido: Visualização completa do esperado</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-[var(--card-border)] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                        <tr>
                          <th className="px-4 py-2.5">Código / Produto</th>
                          <th className="px-3 py-2.5">EAN / Barra Alfa</th>
                          <th className="px-3 py-2.5">Lote Esperado</th>
                          <th className="px-3 py-2.5">Lote Bipado</th>
                          <th className="px-3 py-2.5 text-center">
                            {conferenciaAtiva.tipo_conferencia === "cega" ? "Qtd Bipada" : "Progresso da Contagem"}
                          </th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Ocorrência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)]">
                        {conferenciaAtiva.itens.map((it) => {
                          const isConforme = it.quantidade_conferida === it.quantidade_esperada;
                          const isDivergente = it.status_item === "divergente" || it.quantidade_conferida > it.quantidade_esperada;
                          const pct = Math.min(100, Math.round((it.quantidade_conferida / it.quantidade_esperada) * 100));

                          return (
                            <tr key={it.id} className="hover:bg-[var(--secondary)]">
                              <td className="px-4 py-3">
                                <div className="font-bold text-[var(--foreground)]">{it.descricao}</div>
                                <div className="text-[10px] font-mono text-[var(--muted)]">{it.cod_produto}</div>
                              </td>

                              <td className="px-3 py-3 font-mono text-[11px] text-[var(--muted)]">
                                <div>{it.ean}</div>
                                {it.barra_alfa && <div className="text-[10px] text-sky-400">{it.barra_alfa}</div>}
                              </td>

                              <td className="px-3 py-3 font-mono text-[11px]">
                                <span className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)]">
                                  {it.lote_esperado}
                                </span>
                              </td>

                              <td className="px-3 py-3 font-mono text-[11px]">
                                {it.lote_conferido ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded ${
                                      it.lote_conferido === it.lote_esperado
                                        ? "bg-emerald-500/15 text-emerald-400 font-bold"
                                        : "bg-red-500/20 text-red-400 font-bold border border-red-500/40"
                                    }`}
                                  >
                                    {it.lote_conferido}
                                  </span>
                                ) : (
                                  <span className="text-[var(--muted)] italic text-[10px]">Aguardando</span>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {conferenciaAtiva.tipo_conferencia === "cega" ? (
                                  <div className="text-center">
                                    <span className="font-mono text-sm font-bold text-[var(--foreground)]">
                                      {it.quantidade_conferida} {it.unidade_medida}
                                    </span>
                                    <span className="text-[9px] text-[var(--muted)] block font-mono">
                                      [Meta Oculta]
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-1 w-36 mx-auto">
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                      <span className="font-bold text-[var(--foreground)]">
                                        {it.quantidade_conferida} / {it.quantidade_esperada} {it.unidade_medida}
                                      </span>
                                      <span
                                        className={
                                          isConforme
                                            ? "text-emerald-400 font-bold"
                                            : isDivergente
                                            ? "text-red-400 font-bold"
                                            : "text-[var(--muted)]"
                                        }
                                      >
                                        {pct}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          isConforme
                                            ? "bg-emerald-500"
                                            : it.quantidade_conferida > it.quantidade_esperada
                                            ? "bg-red-500"
                                            : "bg-[var(--collab-mostarda)]"
                                        }`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {it.status_item === "conforme" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Conforme
                                  </span>
                                ) : it.status_item === "divergente" || it.status_item === "excedente" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                                    {it.divergencia_tipo ? `Divergência: ${it.divergencia_tipo}` : "Divergente"}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    Pendente
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemDivergenciaSelecionado(it);
                                    setModalDivergenciaManualOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-[var(--card)] hover:bg-red-500/15 border border-[var(--card-border)] hover:border-red-500/40 text-[10px] font-bold text-[var(--muted)] hover:text-red-400 cursor-pointer"
                                >
                                  Apontar Falha
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--card)] p-12 text-center rounded-2xl border border-[var(--card-border)] text-xs text-[var(--muted)]">
              Selecione um pedido na Fila para iniciar a conferência.
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 3: DIVERGÊNCIAS & QUARENTENA DE EXPEDIÇÃO ────────────────── */}
      {activeSubTab === "divergencias" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-red-500/30 rounded-2xl p-4 sm:p-5 bg-red-500/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-400 font-heading">
                  Controle de Divergências & Quarentena de Expedição
                </h2>
                <p className="text-xs text-red-300">
                  Produtos divergentes devem retornar para análise da supervisão antes de qualquer liberação física (Regra 6.4).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                <tr>
                  <th className="px-4 py-3">Data / Operador</th>
                  <th className="px-3 py-3">Pedido / Destino</th>
                  <th className="px-3 py-3">Produto Divergente</th>
                  <th className="px-3 py-3">Tipo / Motivo</th>
                  <th className="px-3 py-3">Qtd Esperada vs Bipada</th>
                  <th className="px-3 py-3">Status Resolução</th>
                  <th className="px-4 py-3 text-right">Ação Analista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {conferencias.flatMap((c) =>
                  c.divergencias.map((div) => ({ ...div, pedido: c.numero_pedido, loja: c.loja_destino, confId: c.id }))
                ).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-emerald-400">
                      Nenhuma divergência registrada no momento! Todos os pedidos conformes.
                    </td>
                  </tr>
                ) : (
                  conferencias.flatMap((c) =>
                    c.divergencias.map((div) => (
                      <tr key={div.id} className="hover:bg-[var(--secondary)]">
                        <td className="px-4 py-3">
                          <div className="font-mono text-[11px] text-[var(--foreground)]">{div.data_hora}</div>
                          <div className="text-[10px] text-[var(--muted)]">{div.operador_nome}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-bold text-[var(--foreground)]">{c.numero_pedido}</div>
                          <div className="text-[10px] text-[var(--muted)]">{c.loja_destino}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-bold text-[var(--foreground)]">{div.descricao}</div>
                          <div className="text-[10px] font-mono text-[var(--muted)]">{div.cod_produto}</div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            {div.tipo.toUpperCase()}
                          </span>
                          <div className="text-[11px] text-[var(--foreground)] mt-0.5">{div.motivo}</div>
                        </td>

                        <td className="px-3 py-3 font-mono">
                          <span className="text-[var(--muted)]">Esp: {div.qtd_esperada}</span> •{" "}
                          <span className="text-red-400 font-bold">Conf: {div.qtd_conferida}</span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              div.status_resolucao === "corrigido"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : div.status_resolucao === "retornado_estoque"
                                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {div.status_resolucao === "pendente_analise"
                              ? "Pendente Análise"
                              : div.status_resolucao === "corrigido"
                              ? "Corrigido"
                              : "Retornado ao Estoque"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {div.status_resolucao === "pendente_analise" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await enviarDivergenciaParaAnaliseService(c.id, div.id, "corrigido");
                                  if (res.success) {
                                    setToastMsg({ text: "Divergência marcada como corrigida!", type: "success" });
                                    setRefreshKey((k) => k + 1);
                                  }
                                }}
                                className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 cursor-pointer"
                              >
                                Corrigir
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await enviarDivergenciaParaAnaliseService(c.id, div.id, "retornado_estoque");
                                  if (res.success) {
                                    setToastMsg({ text: "Produto devolvido ao pulmão/estoque!", type: "success" });
                                    setRefreshKey((k) => k + 1);
                                  }
                                }}
                                className="px-2 py-1 rounded bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 text-[10px] font-bold border border-sky-500/40 cursor-pointer"
                              >
                                Retornar CD
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUB-ABA 4: ETIQUETAS DE IDENTIFICAÇÃO DE VOLUMES ─────────────────── */}
      {activeSubTab === "etiquetas" && (
        <div className="space-y-5">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <Printer size={18} className="text-[var(--collab-mostarda)]" />
                <span>Etiquetas de Identificação dos Volumes (Item 6.4)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Emissão das etiquetas padronizadas para afixação nas caixas e embalagens do pedido{" "}
                <strong className="text-[var(--foreground)]">{conferenciaAtiva?.numero_pedido}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGerarEtiquetas}
                className="px-3.5 py-2 bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-xs font-bold rounded-lg text-[var(--foreground)] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} className="text-[var(--collab-mostarda)]" />
                <span>Atualizar Etiquetas</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[var(--collab-mostarda)] text-black text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Todos os Volumes</span>
              </button>
            </div>
          </div>

          {/* Grid de Etiquetas Homologadas */}
          {conferenciaAtiva && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conferenciaAtiva.volumes.map((vol) => (
                <div
                  key={vol.id}
                  className="bg-white text-black p-4 rounded-xl border-2 border-dashed border-gray-300 shadow-md space-y-3 font-sans print:border-black"
                >
                  <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        GRUPO COLLAB / CD BIG MASTER
                      </span>
                      <strong className="text-sm font-black text-black">{conferenciaAtiva.numero_pedido}</strong>
                    </div>
                    <span className="text-xs font-black bg-black text-white px-2 py-0.5 rounded">
                      VOLUME {vol.numero_volume} / {vol.total_volumes}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Destino:</span>
                      <strong className="text-sm font-bold text-black block">{conferenciaAtiva.loja_destino}</strong>
                      <span className="text-[11px] text-gray-600 font-mono">CÓDIGO: {conferenciaAtiva.cod_loja}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-[11px]">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Rota:</span>
                        <strong className="text-gray-900">{conferenciaAtiva.rota_entrega}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Transporte:</span>
                        <span className="text-gray-700 truncate block">{conferenciaAtiva.transportadora}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100 text-[10px] font-mono">
                      <div>
                        <span className="text-gray-500 block">PESO:</span>
                        <strong>{vol.peso_kg} kg</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">CUBAGEM:</span>
                        <strong>{vol.cubagem_m3} m³</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">EMB:</span>
                        <strong>{vol.tipo_embalagem.split(" ")[0]}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Código de Barras Representativo do Volume */}
                  <div className="pt-2 border-t border-gray-200 text-center">
                    <div className="font-mono text-xs font-black tracking-widest bg-gray-100 py-1.5 rounded border border-gray-300">
                      *{vol.codigo_volume}*
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono block mt-1">
                      Conferente: {conferenciaAtiva.conferente_nome || "Expedição CD"} • {new Date().toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 5: ROMANEIO DE CONFERÊNCIA ───────────────────────────────── */}
      {activeSubTab === "romaneio" && (
        <div className="space-y-5">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <FileText size={18} className="text-[var(--collab-mostarda)]" />
                <span>Romaneio Oficial de Conferência & Expedição (Item 6.4)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Documento de liberação de carga e comprovação de acuracidade física para o transportador e a loja.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGerarRomaneio}
                className="px-3.5 py-2 bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-xs font-bold rounded-lg text-[var(--foreground)] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} className="text-[var(--collab-mostarda)]" />
                <span>Reemitir Romaneio</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[var(--collab-mostarda)] text-black text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Romaneio A4</span>
              </button>
            </div>
          </div>

          {/* Folha Formal do Romaneio */}
          {conferenciaAtiva && (
            <div className="bg-white text-black p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-200 max-w-4xl mx-auto space-y-6 font-sans">
              {/* Topo do Romaneio */}
              <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-black">
                    ROMANEIO DE CONFERÊNCIA E EXPEDIÇÃO
                  </h1>
                  <p className="text-xs text-gray-600 font-semibold">
                    GRUPO COLLAB / CD BIG MASTER LOGÍSTICA & DISTRIBUIÇÃO
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-sm text-black">PEDIDO Nº: {conferenciaAtiva.numero_pedido}</div>
                  <div className="text-gray-600">EMISSÃO: {conferenciaAtiva.data_romaneio || new Date().toLocaleString("pt-BR")}</div>
                </div>
              </div>

              {/* Informações da Carga */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Loja Destino:</span>
                  <strong className="text-black block text-sm">{conferenciaAtiva.loja_destino}</strong>
                  <span className="text-[10px] text-gray-600 font-mono">CÓD: {conferenciaAtiva.cod_loja}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Rota / Região:</span>
                  <strong className="text-black block">{conferenciaAtiva.rota_entrega}</strong>
                  <span className="text-[10px] text-gray-600">{conferenciaAtiva.regiao}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Transportadora:</span>
                  <strong className="text-black block">{conferenciaAtiva.transportadora}</strong>
                  <span className="text-[10px] text-gray-600">Total Volumes: {conferenciaAtiva.total_volumes}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Conferente Responsável:</span>
                  <strong className="text-black block">{conferenciaAtiva.conferente_nome || "—"}</strong>
                  <span className="text-[10px] text-emerald-700 font-bold block">Status: {conferenciaAtiva.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Itens Conferidos */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  RELAÇÃO DOS PRODUTOS CONFERIDOS
                </h3>
                <table className="w-full text-left text-xs border border-gray-300">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-300">
                    <tr>
                      <th className="p-2 border-r border-gray-300">SKU</th>
                      <th className="p-2 border-r border-gray-300">Descrição do Produto</th>
                      <th className="p-2 border-r border-gray-300">EAN</th>
                      <th className="p-2 border-r border-gray-300">Lote</th>
                      <th className="p-2 border-r border-gray-300">Validade</th>
                      <th className="p-2 text-center border-r border-gray-300">Qtd Esperada</th>
                      <th className="p-2 text-center">Qtd Conferida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {conferenciaAtiva.itens.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-mono border-r border-gray-300">{it.cod_produto}</td>
                        <td className="p-2 font-semibold border-r border-gray-300">{it.descricao}</td>
                        <td className="p-2 font-mono text-[11px] border-r border-gray-300">{it.ean}</td>
                        <td className="p-2 font-mono text-[11px] border-r border-gray-300">{it.lote_conferido || it.lote_esperado}</td>
                        <td className="p-2 font-mono text-[11px] border-r border-gray-300">{it.validade_conferida || it.validade_esperada}</td>
                        <td className="p-2 text-center font-mono border-r border-gray-300 font-bold">{it.quantidade_esperada} {it.unidade_medida}</td>
                        <td className="p-2 text-center font-mono text-emerald-700 font-bold">{it.quantidade_conferida} {it.unidade_medida}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold text-xs">
                    <tr>
                      <td colSpan={5} className="p-2 text-right uppercase">Total de Itens:</td>
                      <td className="p-2 text-center font-mono">{conferenciaAtiva.total_itens_esperados}</td>
                      <td className="p-2 text-center font-mono text-emerald-700">{conferenciaAtiva.total_itens_conferidos}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Relação de Volumes */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  VOLUMES EXPEDIDOS
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {conferenciaAtiva.volumes.map((v) => (
                    <div key={v.id} className="p-2.5 rounded bg-gray-50 border border-gray-200 text-xs">
                      <div className="font-mono font-bold text-black">{v.codigo_volume}</div>
                      <div className="text-[11px] text-gray-600">{v.tipo_embalagem}</div>
                      <div className="text-[10px] text-gray-500">Peso: {v.peso_kg}kg • Cubagem: {v.cubagem_m3}m³</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-300">
                <div className="text-center space-y-1">
                  <div className="border-b border-black w-3/4 mx-auto mb-2" />
                  <span className="text-xs font-bold block uppercase">{conferenciaAtiva.conferente_nome || "Conferente Responsável"}</span>
                  <span className="text-[10px] text-gray-500">Conferência & Acuracidade CD</span>
                </div>

                <div className="text-center space-y-1">
                  <div className="border-b border-black w-3/4 mx-auto mb-2" />
                  <span className="text-xs font-bold block uppercase">Motorista / Transportador</span>
                  <span className="text-[10px] text-gray-500">Recebimento da Carga & Volumes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: INICIAR CONFERÊNCIA (DIRIGIDA OU CEGA) ────────────────────── */}
      {modalIniciarOpen && modalIniciarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
                  <ClipboardCheck size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Iniciar Conferência — {modalIniciarItem.numero_pedido}
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    {modalIniciarItem.loja_destino} ({modalIniciarItem.cod_loja})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalIniciarOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--foreground)] block">
                  Selecione o Tipo de Conferência (Item 6.3):
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIniciarTipoConf("dirigida")}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      iniciarTipoConf === "dirigida"
                        ? "bg-sky-500/15 border-sky-500 text-sky-400 font-bold"
                        : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)] hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Eye size={16} />
                      <strong className="text-xs">Conferência Dirigida</strong>
                    </div>
                    <p className="text-[11px] font-normal leading-relaxed">
                      O sistema apresenta os dados esperados e a barra de progresso visual de cada item.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIniciarTipoConf("cega")}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      iniciarTipoConf === "cega"
                        ? "bg-purple-500/15 border-purple-500 text-purple-400 font-bold"
                        : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)] hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <EyeOff size={16} />
                      <strong className="text-xs">Conferência Cega</strong>
                    </div>
                    <p className="text-[11px] font-normal leading-relaxed">
                      O conferente não visualiza a quantidade esperada previamente, garantindo máxima acuracidade.
                    </p>
                  </button>
                </div>
              </div>

              <div className="bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)] text-xs space-y-1">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Conferente:</span>
                  <strong className="text-[var(--foreground)]">{currentUser?.name || "Operador Logado"}</strong>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Total de Itens:</span>
                  <span className="font-mono text-[var(--foreground)]">{modalIniciarItem.total_itens_esperados} itens</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Volumes:</span>
                  <span className="font-mono text-[var(--foreground)]">{modalIniciarItem.total_volumes} volumes</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)]">
              <button
                type="button"
                onClick={() => setModalIniciarOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleIniciarConferencia}
                className="px-4 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
              >
                <span>Confirmar Início</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: APONTAR DIVERGÊNCIA MANUAL ───────────────────────────────── */}
      {modalDivergenciaManualOpen && itemDivergenciaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-red-500/10">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={18} className="text-red-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-red-400">
                    Registrar Ocorrência / Divergência (Item 6.2)
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    {itemDivergenciaSelecionado.descricao} ({itemDivergenciaSelecionado.cod_produto})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDivergenciaManualOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">Tipo de Ocorrência:</label>
                <select
                  value={tipoDivManual}
                  onChange={(e) => setTipoDivManual(e.target.value as TipoDivergenciaConferencia)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-red-500"
                >
                  <option value="falta">Falta Física de Produto</option>
                  <option value="sobra">Sobra Física de Produto</option>
                  <option value="avaria">Produto Danificado / Embalagem Violada</option>
                  <option value="produto_trocado">Produto Divergente / Trocado</option>
                  <option value="lote_divergente">Lote Divergente</option>
                  <option value="validade_invalida">Validade Vencida ou Abaixo do Mínimo</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">Motivo / Descrição Detalhada:</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a ocorrência constatada no volume..."
                  value={motivoDivManual}
                  onChange={(e) => setMotivoDivManual(e.target.value)}
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-300">
                Esta ocorrência direcionará o item para análise da supervisão/quarentena e bloqueará a finalização do pedido até resolução formal.
              </div>
            </div>

            <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)]">
              <button
                type="button"
                onClick={() => setModalDivergenciaManualOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarDivergenciaManual}
                className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
              >
                <AlertTriangle size={13} />
                <span>Registrar Ocorrência</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SOLICITAR RECONTAGEM POR OUTRO OPERADOR ───────────────────── */}
      {modalRecontagemOpen && conferenciaAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-purple-500/10">
              <div className="flex items-center gap-2.5">
                <RotateCcw size={18} className="text-purple-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-purple-400">
                    Solicitar Recontagem (Item 6.4)
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    Pedido {conferenciaAtiva.numero_pedido} • 2ª Rodada de Auditoria
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRecontagemOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">
                  Atribuir a outro Conferente (Auditor):
                </label>
                <select
                  value={novoOperadorId}
                  onChange={(e) => {
                    setNovoOperadorId(e.target.value);
                    setNovoOperadorNome(
                      e.target.value === "usr-04"
                        ? "Juliana Santos (Conferente Sênior)"
                        : "Carlos Rezende (Supervisor de Conferência)"
                    );
                  }}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-purple-500"
                >
                  <option value="usr-04">Juliana Santos (Conferente Sênior)</option>
                  <option value="usr-02">Carlos Rezende (Supervisor de Conferência)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">Motivo da Recontagem:</label>
                <textarea
                  rows={3}
                  value={motivoRecontagem}
                  onChange={(e) => setMotivoRecontagem(e.target.value)}
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[11px] text-purple-300">
                A recontagem zerará as quantidades previamente contadas para permitir uma conferência limpa e independente pelo novo auditor.
              </div>
            </div>

            <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)]">
              <button
                type="button"
                onClick={() => setModalRecontagemOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarRecontagem}
                className="px-4 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
              >
                <RotateCcw size={13} />
                <span>Confirmar Recontagem</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
