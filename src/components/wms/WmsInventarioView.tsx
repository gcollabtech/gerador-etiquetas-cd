// src/components/wms/WmsInventarioView.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PlanoInventario,
  ItemPlanoInventario,
  IndicadoresInventario,
  TipoInventario,
  ModoContagem,
  StatusPlanoInventario,
} from "@/lib/wmsInventarioTypes";
import {
  fetchPlanosEIndicadores,
  criarPlanoInventarioService,
  registrarContagemService,
  solicitarRecontagemService,
  submeterAjusteService,
  aprovarAjusteService,
} from "@/lib/wmsInventarioService";
import { PortalUser } from "@/lib/authTypes";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Boxes,
  Barcode,
  Search,
  Filter,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Calendar,
  Check,
  X,
  RefreshCw,
  FileText,
  DollarSign,
  Layers,
  MapPin,
  ChevronRight,
} from "lucide-react";

interface WmsInventarioViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

export function WmsInventarioView({ currentUser, onNavigateToLabels }: WmsInventarioViewProps) {
  const [planos, setPlanos] = useState<PlanoInventario[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresInventario>({
    acuracidadeGeralPct: 98.4,
    acuracidadePorSetor: {
      portaPaletes: 99.1,
      flowRack: 97.8,
      pulmao: 98.9,
      picking: 97.4,
    },
    totalItensInventariados: 0,
    totalDivergenciasAtivas: 0,
    valorTotalSobras: 0,
    valorTotalFaltas: 0,
    valorLiquidoDiferenca: 0,
    totalRecontagensRealizadas: 0,
    planosAtivos: 0,
    taxaAprovacaoAjustesPct: 94.2,
  });

  const [activeSubTab, setActiveSubTab] = useState<"planos" | "coletor" | "divergencias" | "ajustes" | "indicadores">("planos");
  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [buscaTermo, setBuscaTermo] = useState("");

  // Estação Coletor de Contagem (Item 8.3 & 8.4)
  const [itemSelecionadoContagemId, setItemSelecionadoContagemId] = useState<string>("");
  const [enderecoLidoInput, setEnderecoLidoInput] = useState("");
  const [produtoLidoInput, setProdutoLidoInput] = useState("");
  const [quantidadeContadaInput, setQuantidadeContadaInput] = useState<number | "">("");
  const [loteContadoInput, setLoteContadoInput] = useState("");
  const [validadeContadaInput, setValidadeContadaInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ tipo: "ok" | "erro" | "alerta"; msg: string } | null>(null);

  // Modais
  const [modalNovoPlanoOpen, setModalNovoPlanoOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("Inventário Cíclico Semanal");
  const [novoTipo, setNovoTipo] = useState<TipoInventario>("ciclico");
  const [novoModo, setNovoModo] = useState<ModoContagem>("cego");
  const [novoBloquearEnderecos, setNovoBloquearEnderecos] = useState(true);
  const [novaDataAgendada, setNovaDataAgendada] = useState("2026-11-20");

  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [itemAjusteSelecionado, setItemAjusteSelecionado] = useState<ItemPlanoInventario | null>(null);
  const [justificativaInput, setJustificativaInput] = useState("");

  const [modalRecontagemOpen, setModalRecontagemOpen] = useState(false);
  const [recontagemOperadorNome, setRecontagemOperadorNome] = useState("Juliana Santos (Auditora Sênior)");

  // Carrega inventários
  useEffect(() => {
    fetchPlanosEIndicadores().then((res) => {
      setPlanos(res.planos);
      setIndicadores(res.indicadores);
      if (res.planos.length > 0 && !selectedPlanoId) {
        setSelectedPlanoId(res.planos[0]?.id || null);
      }
    });
  }, [refreshKey]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const planoAtivo = useMemo(() => {
    return planos.find((p) => p.id === selectedPlanoId) || planos[0] || null;
  }, [planos, selectedPlanoId]);

  // Seletor automático do primeiro item pendente no coletor
  useEffect(() => {
    if (planoAtivo && planoAtivo.itens.length > 0) {
      const primeiroPendente = planoAtivo.itens.find((it) => it.status_item === "pendente" || it.status_item === "recontagem_solicitada");
      if (primeiroPendente && !itemSelecionadoContagemId) {
        setItemSelecionadoContagemId(primeiroPendente.id);
        setEnderecoLidoInput(primeiroPendente.endereco);
        setProdutoLidoInput(primeiroPendente.ean);
        setLoteContadoInput(primeiroPendente.lote_sistema);
      }
    }
  }, [planoAtivo, itemSelecionadoContagemId]);

  // Lista Filtrada
  const planosFiltrados = useMemo(() => {
    return planos.filter((p) => {
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      if (buscaTermo) {
        const t = buscaTermo.toLowerCase();
        return (
          p.numero_plano.toLowerCase().includes(t) ||
          p.titulo.toLowerCase().includes(t) ||
          p.responsavel_criacao.toLowerCase().includes(t) ||
          p.itens.some((it) => it.cod_produto.toLowerCase().includes(t) || it.endereco.toLowerCase().includes(t))
        );
      }
      return true;
    });
  }, [planos, filtroStatus, filtroTipo, buscaTermo]);

  // Ações
  const handleRegistrarContagem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!planoAtivo || !itemSelecionadoContagemId) return;

    if (quantidadeContadaInput === "" || Number(quantidadeContadaInput) < 0) {
      setToastMsg({ text: "Informe a quantidade física contada no endereço.", type: "warning" });
      return;
    }

    setScanFeedback(null);
    const res = await registrarContagemService({
      plano_id: planoAtivo.id,
      item_id: itemSelecionadoContagemId,
      quantidade_contada: Number(quantidadeContadaInput),
      lote_contado: loteContadoInput.trim() || undefined,
      validade_contada: validadeContadaInput.trim() || undefined,
      operador_id: currentUser?.id || "usr-03",
      operador_nome: currentUser?.name || "Marcos Oliveira",
    });

    if (res.success) {
      if (res.divergente) {
        setScanFeedback({ tipo: "alerta", msg: res.mensagem });
        setToastMsg({ text: res.mensagem, type: "warning" });
      } else {
        setScanFeedback({ tipo: "ok", msg: res.mensagem });
        setToastMsg({ text: res.mensagem, type: "success" });
      }
      setQuantidadeContadaInput("");
      setRefreshKey((k) => k + 1);
    } else {
      setScanFeedback({ tipo: "erro", msg: res.error || "Erro ao registrar contagem." });
      setToastMsg({ text: res.error || "Erro ao registrar contagem.", type: "error" });
    }
  };

  const handleSolicitarRecontagem = async () => {
    if (!planoAtivo) return;
    const res = await solicitarRecontagemService(planoAtivo.id, recontagemOperadorNome);
    if (res.success) {
      setToastMsg({ text: `Recontagem (Rodada ${res.plano?.rodada_atual}) iniciada com sucesso! Histórico preservado.`, type: "success" });
      setModalRecontagemOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao solicitar recontagem.", type: "error" });
    }
  };

  const handleSubmeterAjuste = async () => {
    if (!planoAtivo || !itemAjusteSelecionado || !justificativaInput.trim()) {
      setToastMsg({ text: "A justificativa detalhada é obrigatória (Regra 8.4).", type: "warning" });
      return;
    }

    const res = await submeterAjusteService(planoAtivo.id, itemAjusteSelecionado.id, justificativaInput.trim());
    if (res.success) {
      setToastMsg({
        text: `Ajuste submetido para aprovação de ${res.alcada === "gerencia" ? "GERÊNCIA (Valor > R$ 500)" : "SUPERVISÃO (Valor <= R$ 500)"}!`,
        type: "success",
      });
      setModalAjusteOpen(false);
      setJustificativaInput("");
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao submeter ajuste.", type: "error" });
    }
  };

  const handleAprovarAjuste = async (itemId: string) => {
    if (!planoAtivo) return;
    const res = await aprovarAjusteService(planoAtivo.id, itemId, currentUser?.name || "Carlos Rezende (Supervisor)");
    if (res.success) {
      setToastMsg({
        text: res.protocolo_erp
          ? `Ajuste aprovado e integrado ao ERP Collab (${res.protocolo_erp})! Estoque físico reconciliado.`
          : "Ajuste de inventário aprovado com sucesso!",
        type: "success",
      });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao aprovar ajuste.", type: "error" });
    }
  };

  const handleSalvarNovoPlano = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await criarPlanoInventarioService({
      titulo: novoTitulo,
      tipo: novoTipo,
      modo_contagem: novoModo,
      bloquear_movimentacoes_endereco: novoBloquearEnderecos,
      data_agendada: novaDataAgendada,
      responsavel_criacao: currentUser?.name || "Carlos Rezende",
      operadores_alocados: ["Marcos Oliveira (Auditor)", "Juliana Santos (Conferente)"],
      itens: [
        {
          cod_produto: "PRD-1001",
          descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
          ean: "7891000100018",
          endereco: "R01-P01-N01-A01",
          setor: "Flow Rack",
          lote_sistema: "L26-A101",
          validade_sistema: "2027-05-15",
          saldo_sistema: 120,
          custo_unitario_estimado: 2.7,
        },
        {
          cod_produto: "PRD-1002",
          descricao: "SABÃO EM PÓ CONCENTRADO 1KG",
          ean: "7891000100025",
          endereco: "R01-P01-N01-A02",
          setor: "Flow Rack",
          lote_sistema: "L26-B202",
          validade_sistema: "2027-08-20",
          saldo_sistema: 80,
          custo_unitario_estimado: 12.5,
        },
      ],
      observacoes: "Plano criado via painel de inventário do WMS.",
    });

    if (res.success && res.plano) {
      setToastMsg({ text: `Plano ${res.plano.numero_plano} gerado com sucesso!`, type: "success" });
      setSelectedPlanoId(res.plano.id);
      setModalNovoPlanoOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao gerar plano.", type: "error" });
    }
  };

  // Badge de Status do Plano
  const getStatusBadge = (status: StatusPlanoInventario) => {
    switch (status) {
      case "planejado":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">Planejado</span>;
      case "em_contagem":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/40 animate-pulse">Em Contagem</span>;
      case "em_recontagem":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">Em Recontagem</span>;
      case "aguardando_aprovacao":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Aguardando Aprovação</span>;
      case "ajustado":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ajustado / Concluído</span>;
      case "cancelado":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">Cancelado</span>;
      default:
        return null;
    }
  };

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
            <Lock size={18} className="text-red-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ── PAINEL VISUAL DE INDICADORES (ITEM 8.5) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Acuracidade Geral</span>
            <Sparkles size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-400">
            {indicadores.acuracidadeGeralPct}%
          </div>
          <span className="text-[10px] text-emerald-400 block font-mono">Meta &ge; 98.0% (Atingida)</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Flow Rack</span>
            <Layers size={14} className="text-sky-400" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--foreground)]">
            {indicadores.acuracidadePorSetor.flowRack}%
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Acuracidade Setor Flow</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Porta-Paletes</span>
            <Boxes size={14} className="text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--foreground)]">
            {indicadores.acuracidadePorSetor.portaPaletes}%
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Acuracidade P. Paletes</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Pulmão</span>
            <TrendingUp size={14} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--foreground)]">
            {indicadores.acuracidadePorSetor.pulmao}%
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Acuracidade Pulmão</span>
        </div>

        <div className="bg-[var(--card)] border border-red-500/30 rounded-xl p-3.5 space-y-1 bg-red-500/5">
          <div className="flex items-center justify-between text-xs text-red-400">
            <span>Valor das Faltas</span>
            <DollarSign size={14} className="text-red-400" />
          </div>
          <div className="text-xl font-bold font-heading text-red-400">
            -R$ {indicadores.valorTotalFaltas.toFixed(2)}
          </div>
          <span className="text-[10px] text-red-300 block">{indicadores.totalDivergenciasAtivas} divergência(s)</span>
        </div>

        <div className="bg-[var(--card)] border border-purple-500/30 rounded-xl p-3.5 space-y-1 bg-purple-500/5">
          <div className="flex items-center justify-between text-xs text-purple-400">
            <span>Recontagens</span>
            <RotateCcw size={14} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold font-heading text-purple-400">
            {indicadores.totalRecontagensRealizadas}
          </div>
          <span className="text-[10px] text-purple-300 block">Rodadas 2ª/3ª executadas</span>
        </div>
      </div>

      {/* ── NAVEGAÇÃO DE SUB-ABAS DO MÓDULO 08 ───────────────────────────────── */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab("planos")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "planos"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <ClipboardList size={15} />
          <span>Planos de Inventário</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--card-border)] text-[var(--foreground)] font-mono">
            {planos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("coletor")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "coletor"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Barcode size={15} />
          <span>Coletor RF de Contagem</span>
          {planoAtivo && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] font-mono font-bold">
              {planoAtivo.numero_plano} (R{planoAtivo.rodada_atual})
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
          <AlertTriangle size={15} className="text-amber-400" />
          <span>Conciliação & Recontagens</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold">
            {indicadores.totalDivergenciasAtivas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("ajustes")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "ajustes"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <ShieldCheck size={15} className="text-emerald-400" />
          <span>Alçadas & Integração ERP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("indicadores")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "indicadores"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <TrendingUp size={15} />
          <span>Auditoria & Indicadores</span>
        </button>
      </div>

      {/* ── SUB-ABA 1: PLANOS DE INVENTÁRIO (ITEM 8.2 & 8.3) ─────────────────── */}
      {activeSubTab === "planos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card)] p-3.5 rounded-xl border border-[var(--card-border)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
              <input
                type="text"
                placeholder="Filtrar por plano, título, responsável ou endereço..."
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--muted)]" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs px-2.5 py-1.5 text-[var(--foreground)]"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="geral">Inventário Geral</option>
                <option value="rotativo">Inventário Rotativo</option>
                <option value="ciclico">Inventário Cíclico</option>
                <option value="por_endereco">Por Endereço</option>
                <option value="por_produto">Por Produto</option>
                <option value="por_lote">Por Lote</option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs px-2.5 py-1.5 text-[var(--foreground)]"
              >
                <option value="todos">Todos os Status</option>
                <option value="planejado">Planejado</option>
                <option value="em_contagem">Em Contagem</option>
                <option value="em_recontagem">Em Recontagem</option>
                <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                <option value="ajustado">Ajustado / Concluído</option>
              </select>

              <button
                type="button"
                onClick={() => setModalNovoPlanoOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow shrink-0"
              >
                <ClipboardList size={14} />
                <span>Novo Plano</span>
              </button>
            </div>
          </div>

          {/* Tabela de Planos */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-4 py-3">Plano / Título</th>
                    <th className="px-3 py-3">Tipo & Modo</th>
                    <th className="px-3 py-3">Bloqueio Endereço</th>
                    <th className="px-3 py-3">Itens & Progresso</th>
                    <th className="px-3 py-3">Acuracidade</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {planosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--muted)]">
                        Nenhum plano de inventário encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    planosFiltrados.map((plano) => {
                      const isSelected = planoAtivo?.id === plano.id;
                      const pct = Math.round((plano.itens_contados / Math.max(1, plano.total_itens)) * 100);

                      return (
                        <tr
                          key={plano.id}
                          className={`hover:bg-[var(--secondary)] transition-colors ${
                            isSelected ? "bg-[var(--collab-mostarda)]/5 font-medium" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--foreground)]">{plano.numero_plano}</div>
                            <div className="text-[11px] text-[var(--muted)]">{plano.titulo}</div>
                          </td>

                          <td className="px-3 py-3">
                            <span className="capitalize font-semibold text-[var(--foreground)] block">
                              {plano.tipo.replace("_", " ")}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold ${
                                plano.modo_contagem === "cego" ? "text-purple-400" : "text-sky-400"
                              }`}
                            >
                              {plano.modo_contagem === "cego" ? <EyeOff size={11} /> : <Eye size={11} />}
                              <span>Modo {plano.modo_contagem === "cego" ? "Cego" : "Aberto"}</span>
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            {plano.bloquear_movimentacoes_endereco ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Lock size={10} />
                                <span>Bloqueado</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/15 text-gray-400">
                                <Unlock size={10} />
                                <span>Livre</span>
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                              <span>{plano.itens_contados} / {plano.total_itens} itens</span>
                              <span className="text-[var(--muted)]">{pct}%</span>
                            </div>
                            <div className="w-24 bg-[var(--card-border)] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--collab-mostarda)] transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          <td className="px-3 py-3 font-mono font-bold">
                            <span className={plano.acuracidade_pct >= 98 ? "text-emerald-400" : "text-amber-400"}>
                              {plano.acuracidade_pct}%
                            </span>
                          </td>

                          <td className="px-3 py-3">{getStatusBadge(plano.status)}</td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlanoId(plano.id);
                                setActiveSubTab("coletor");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Barcode size={13} className="text-[var(--collab-mostarda)]" />
                              <span>Contar</span>
                            </button>
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

      {/* ── SUB-ABA 2: COLETOR RF DE CONTAGEM (ITEM 8.3 & 8.4) ────────────────── */}
      {activeSubTab === "coletor" && (
        <div className="space-y-5">
          {planoAtivo ? (
            <>
              {/* Header do Plano Ativo */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center font-bold shrink-0">
                      <Barcode size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-heading">
                          {planoAtivo.numero_plano} — {planoAtivo.titulo}
                        </h2>
                        {getStatusBadge(planoAtivo.status)}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          Rodada {planoAtivo.rodada_atual}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                            planoAtivo.modo_contagem === "cego"
                              ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                              : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                          }`}
                        >
                          {planoAtivo.modo_contagem === "cego" ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>Modo {planoAtivo.modo_contagem === "cego" ? "Cego (Saldo Oculto)" : "Aberto"}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Tipo: <strong className="text-[var(--foreground)] capitalize">{planoAtivo.tipo.replace("_", " ")}</strong> • Responsável: {planoAtivo.responsavel_criacao} • Bloqueio Ativo: {planoAtivo.bloquear_movimentacoes_endereco ? "Sim" : "Não"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalRecontagemOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-400 text-xs font-bold hover:bg-purple-500/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Recontagem 2ª/3ª Rodada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab("divergencias")}
                      className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle size={13} className="text-amber-400" />
                      <span>Ver Conciliação</span>
                    </button>
                  </div>
                </div>

                {/* Banner de Inventário Cego (Regra 8.4) */}
                {planoAtivo.modo_contagem === "cego" && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-start gap-2.5 text-xs text-purple-300">
                    <EyeOff size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-purple-400 block font-bold">
                        REGRA 8.4 — INVENTÁRIO CEGO ATIVO:
                      </strong>
                      <span>
                        O saldo esperado do sistema é mantido rigorosamente oculto durante a contagem. O operador deve bipar o endereço, o produto e digitar a quantidade física real encontrada.
                      </span>
                    </div>
                  </div>
                )}

                {/* Formulário / Terminal de Bipagem do Coletor RF */}
                <form onSubmit={handleRegistrarContagem} className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                      <Barcode size={15} className="text-[var(--collab-mostarda)]" />
                      <span>Terminal Coletor RF — Leitura de Endereço & Produto</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] font-mono">Padrão Rua-Prédio-Nível-Apartamento</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Endereço Bipado:</label>
                      <input
                        type="text"
                        placeholder="Ex: R01-P01-N01-A01"
                        value={enderecoLidoInput}
                        onChange={(e) => setEnderecoLidoInput(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono font-bold text-[var(--foreground)]"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Código / EAN Bipado:</label>
                      <input
                        type="text"
                        placeholder="7891000100018 ou PRD-1001"
                        value={produtoLidoInput}
                        onChange={(e) => setProdutoLidoInput(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Lote Físico:</label>
                      <input
                        type="text"
                        placeholder="L26-A101"
                        value={loteContadoInput}
                        onChange={(e) => setLoteContadoInput(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Qtd Física Contada:</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={quantidadeContadaInput}
                        onChange={(e) => setQuantidadeContadaInput(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono font-bold text-[var(--foreground)] focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                        autoFocus
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-[var(--collab-mostarda)] text-black font-bold text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Check size={14} />
                        <span>Confirmar (Enter)</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback da Bipagem */}
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

                  {/* Seleção Rápida de Itens do Plano */}
                  <div className="pt-2 border-t border-[var(--card-border)] flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[10px] text-[var(--muted)] mr-1">Selecionar Item para Contar:</span>
                    {planoAtivo.itens.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setItemSelecionadoContagemId(it.id);
                          setEnderecoLidoInput(it.endereco);
                          setProdutoLidoInput(it.ean);
                          setLoteContadoInput(it.lote_sistema);
                        }}
                        className={`px-2 py-1 rounded font-mono text-[10px] border cursor-pointer ${
                          itemSelecionadoContagemId === it.id
                            ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                            : "bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border-[var(--card-border)]"
                        }`}
                      >
                        {it.endereco} — {it.cod_produto}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Grid de Itens a Contar */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Itens Vinculados ao Plano ({planoAtivo.itens.length} endereços)
                  </h3>

                  <div className="border border-[var(--card-border)] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                        <tr>
                          <th className="px-4 py-2.5">Endereço (R-P-N-A)</th>
                          <th className="px-3 py-2.5">Produto / EAN</th>
                          <th className="px-3 py-2.5">Setor</th>
                          <th className="px-3 py-2.5">Lote</th>
                          <th className="px-3 py-2.5 text-center">Saldo Esperado</th>
                          <th className="px-3 py-2.5 text-center">Contagem Física</th>
                          <th className="px-3 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)]">
                        {planoAtivo.itens.map((it) => {
                          const isSelected = itemSelecionadoContagemId === it.id;
                          return (
                            <tr
                              key={it.id}
                              onClick={() => {
                                setItemSelecionadoContagemId(it.id);
                                setEnderecoLidoInput(it.endereco);
                                setProdutoLidoInput(it.ean);
                                setLoteContadoInput(it.lote_sistema);
                              }}
                              className={`hover:bg-[var(--secondary)] cursor-pointer transition-colors ${
                                isSelected ? "bg-[var(--collab-mostarda)]/10 font-medium" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-mono font-bold text-[var(--foreground)]">
                                {it.endereco}
                              </td>

                              <td className="px-3 py-3">
                                <div className="font-semibold text-[var(--foreground)]">{it.descricao}</div>
                                <div className="text-[10px] text-[var(--muted)] font-mono">{it.cod_produto} • EAN: {it.ean}</div>
                              </td>

                              <td className="px-3 py-3 text-[11px] text-[var(--muted)]">
                                {it.setor}
                              </td>

                              <td className="px-3 py-3 font-mono text-[11px]">
                                {it.lote_sistema}
                              </td>

                              <td className="px-3 py-3 text-center font-mono">
                                {planoAtivo.modo_contagem === "cego" && it.status_item === "pendente" ? (
                                  <span className="text-purple-400 font-bold text-[11px] flex items-center justify-center gap-1">
                                    <EyeOff size={11} />
                                    <span>[Oculto]</span>
                                  </span>
                                ) : (
                                  <strong className="text-[var(--foreground)]">{it.saldo_sistema}</strong>
                                )}
                              </td>

                              <td className="px-3 py-3 text-center font-mono">
                                {it.contagens.length > 0 ? (
                                  <strong className="text-emerald-400">
                                    {it.contagens[it.contagens.length - 1]?.quantidade_contada} un
                                  </strong>
                                ) : (
                                  <span className="text-[var(--muted)] italic text-[11px]">Pendente</span>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {it.status_item === "conforme" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Conforme
                                  </span>
                                ) : it.status_item === "divergente" || it.status_item === "recontagem_solicitada" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                    Divergente ({it.diferenca_final && it.diferenca_final > 0 ? `+${it.diferenca_final}` : it.diferenca_final})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    Aguardando
                                  </span>
                                )}
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
              Selecione um plano de inventário na aba anterior para iniciar a contagem.
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 3: CONCILIAÇÃO & RECONTAGENS (ITEM 8.3 & 8.4) ─────────────── */}
      {activeSubTab === "divergencias" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <span>Conciliação Físico x Sistêmico & Auditoria de Recontagem (Item 8.3)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Histórico imutável de todas as contagens por rodada sem apagar dados anteriores (Regra 8.4).
              </p>
            </div>

            {planoAtivo && (
              <button
                type="button"
                onClick={() => setModalRecontagemOpen(true)}
                className="px-3.5 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-1.5 shadow cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Solicitar Recontagem (Rodada {planoAtivo.rodada_atual + 1})</span>
              </button>
            )}
          </div>

          {/* Tabela de Conciliação e Histórico de Rodadas */}
          {planoAtivo && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-4 py-3">Endereço / SKU</th>
                    <th className="px-3 py-3">Saldo Sistema</th>
                    <th className="px-3 py-3">1ª Contagem</th>
                    <th className="px-3 py-3">2ª Contagem</th>
                    <th className="px-3 py-3">Diferença Final</th>
                    <th className="px-3 py-3">Impacto (R$)</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {planoAtivo.itens.map((it) => {
                    const cnt1 = it.contagens.find((c) => c.rodada === 1);
                    const cnt2 = it.contagens.find((c) => c.rodada === 2);
                    const isDiv = it.diferenca_final !== 0 && it.diferenca_final !== undefined;

                    return (
                      <tr key={it.id} className="hover:bg-[var(--secondary)]">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-[var(--foreground)]">{it.endereco}</div>
                          <div className="text-[11px] text-[var(--muted)]">{it.descricao} ({it.cod_produto})</div>
                        </td>

                        <td className="px-3 py-3 font-mono font-bold text-[var(--foreground)]">
                          {it.saldo_sistema} un
                        </td>

                        <td className="px-3 py-3 font-mono text-[11px]">
                          {cnt1 ? (
                            <div>
                              <strong className={cnt1.divergencia_detectada ? "text-amber-400" : "text-emerald-400"}>
                                {cnt1.quantidade_contada} un
                              </strong>
                              <span className="text-[10px] text-[var(--muted)] block">{cnt1.operador_nome.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--muted)] italic">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-[11px]">
                          {cnt2 ? (
                            <div>
                              <strong className={cnt2.divergencia_detectada ? "text-red-400" : "text-emerald-400"}>
                                {cnt2.quantidade_contada} un
                              </strong>
                              <span className="text-[10px] text-[var(--muted)] block">{cnt2.operador_nome.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--muted)] italic">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono font-bold">
                          {isDiv ? (
                            <span className={it.diferenca_final! > 0 ? "text-sky-400" : "text-red-400"}>
                              {it.diferenca_final! > 0 ? `+${it.diferenca_final}` : it.diferenca_final} un
                            </span>
                          ) : (
                            <span className="text-emerald-400">0 (OK)</span>
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono">
                          {it.valor_ajuste_final !== undefined && it.valor_ajuste_final !== 0 ? (
                            <span className={it.valor_ajuste_final > 0 ? "text-sky-400" : "text-red-400 font-bold"}>
                              R$ {it.valor_ajuste_final.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[var(--muted)]">R$ 0.00</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isDiv && it.status_item !== "ajustado" && (
                            <button
                              type="button"
                              onClick={() => {
                                setItemAjusteSelecionado(it);
                                setModalAjusteOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[var(--card)] hover:bg-amber-500/15 border border-[var(--card-border)] hover:border-amber-500/40 text-xs font-bold text-amber-400 cursor-pointer"
                            >
                              Submeter Ajuste
                            </button>
                          )}
                          {it.status_item === "ajustado" && (
                            <span className="text-[10px] font-bold text-emerald-400 font-mono">Ajustado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 4: WORKFLOW DE ALÇADAS & INTEGRAÇÃO ERP (ITEM 8.4) ─────────── */}
      {activeSubTab === "ajustes" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Workflow de Aprovação de Ajustes & Integração ERP (Item 8.4)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Aprovação conforme alçada (Supervisor até R$ 500, Gerência acima de R$ 500) com envio automático ao ERP Collab.
              </p>
            </div>
          </div>

          {planoAtivo && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-4 py-3">Produto / Endereço</th>
                    <th className="px-3 py-3">Ajuste Físico</th>
                    <th className="px-3 py-3">Impacto Financeiro</th>
                    <th className="px-3 py-3">Alçada Exigida</th>
                    <th className="px-3 py-3">Justificativa Registrada</th>
                    <th className="px-3 py-3">Status Aprovação</th>
                    <th className="px-4 py-3 text-right">Ação Alçada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {planoAtivo.itens
                    .filter((it) => it.diferenca_final !== 0 && it.diferenca_final !== undefined)
                    .map((it) => {
                      const valAbs = Math.abs(it.valor_ajuste_final || 0);
                      const alcada = valAbs > 500 ? "Gerência / Diretoria" : "Supervisor WMS";

                      return (
                        <tr key={it.id} className="hover:bg-[var(--secondary)]">
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--foreground)]">{it.descricao}</div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">{it.endereco} • {it.cod_produto}</div>
                          </td>

                          <td className="px-3 py-3 font-mono font-bold">
                            <span className={it.diferenca_final! > 0 ? "text-sky-400" : "text-red-400"}>
                              {it.diferenca_final! > 0 ? `+${it.diferenca_final}` : it.diferenca_final} un
                            </span>
                          </td>

                          <td className="px-3 py-3 font-mono font-bold">
                            <span className={it.valor_ajuste_final! > 0 ? "text-sky-400" : "text-red-400"}>
                              R$ {it.valor_ajuste_final?.toFixed(2)}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                valAbs > 500
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              }`}
                            >
                              {alcada}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-[11px] text-[var(--foreground)] max-w-xs truncate">
                            {it.justificativa_ajuste || <span className="text-[var(--muted)] italic">Aguardando justificativa</span>}
                          </td>

                          <td className="px-3 py-3">
                            {it.ajuste_aprovado ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Aprovado por {it.aprovador_nome?.split(" ")[0]}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Pendente de Assinatura
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {!it.ajuste_aprovado ? (
                              <button
                                type="button"
                                onClick={() => handleAprovarAjuste(it.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 ml-auto cursor-pointer shadow"
                              >
                                <Check size={13} />
                                <span>Aprovar & Integrar ERP</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                Integrado ao ERP
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 5: AUDITORIA & INDICADORES DE ACURACIDADE (ITEM 8.5) ──────── */}
      {activeSubTab === "indicadores" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 space-y-3">
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--collab-mostarda)]" />
                <span>Acuracidade Histórica por Setor do CD</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Porta-Paletes (Estrutura Pesada)</span>
                    <strong className="text-emerald-400 font-mono">{indicadores.acuracidadePorSetor.portaPaletes}%</strong>
                  </div>
                  <div className="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${indicadores.acuracidadePorSetor.portaPaletes}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Flow Rack (Picking Rápido)</span>
                    <strong className="text-sky-400 font-mono">{indicadores.acuracidadePorSetor.flowRack}%</strong>
                  </div>
                  <div className="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: `${indicadores.acuracidadePorSetor.flowRack}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Pulmão (Armazenagem Intermediária)</span>
                    <strong className="text-purple-400 font-mono">{indicadores.acuracidadePorSetor.pulmao}%</strong>
                  </div>
                  <div className="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${indicadores.acuracidadePorSetor.pulmao}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Picking Fracionado</span>
                    <strong className="text-amber-400 font-mono">{indicadores.acuracidadePorSetor.picking}%</strong>
                  </div>
                  <div className="w-full bg-[var(--card-border)] h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${indicadores.acuracidadePorSetor.picking}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 space-y-3">
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Governança & Rastreabilidade de Auditoria</span>
              </h3>
              <div className="space-y-2 text-xs text-[var(--muted)]">
                <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex justify-between">
                  <span>Taxa de Aprovação de Ajustes:</span>
                  <strong className="text-emerald-400 font-mono">{indicadores.taxaAprovacaoAjustesPct}%</strong>
                </div>
                <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex justify-between">
                  <span>Total de Itens Auditados:</span>
                  <strong className="text-[var(--foreground)] font-mono">{indicadores.totalItensInventariados} SKU</strong>
                </div>
                <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex justify-between">
                  <span>Recontagens Realizadas (Auditoria):</span>
                  <strong className="text-purple-400 font-mono">{indicadores.totalRecontagensRealizadas} rodadas</strong>
                </div>
                <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex justify-between">
                  <span>Sincronização com ERP:</span>
                  <strong className="text-emerald-400 font-mono">100% Integrado via Barramento</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVO PLANO DE INVENTÁRIO (ITEM 8.2) ───────────────────────── */}
      {modalNovoPlanoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Criar Plano de Inventário (Item 8.2)
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    Geral, Rotativo, Cíclico, por Endereço, Produto ou Lote
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoPlanoOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoPlano} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">Título do Plano:</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-bold text-[var(--foreground)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Tipo de Inventário:</label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as TipoInventario)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)]"
                  >
                    <option value="geral">Inventário Geral</option>
                    <option value="rotativo">Inventário Rotativo</option>
                    <option value="ciclico">Inventário Cíclico</option>
                    <option value="por_endereco">Por Endereço</option>
                    <option value="por_produto">Por Produto</option>
                    <option value="por_lote">Por Lote</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Modo de Contagem:</label>
                  <select
                    value={novoModo}
                    onChange={(e) => setNovoModo(e.target.value as ModoContagem)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] font-bold"
                  >
                    <option value="cego">Cego (Oculta Saldo Sistêmico)</option>
                    <option value="aberto">Aberto (Exibe Saldo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Data Agendada:</label>
                  <input
                    type="date"
                    value={novaDataAgendada}
                    onChange={(e) => setNovaDataAgendada(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chkBloquear"
                    checked={novoBloquearEnderecos}
                    onChange={(e) => setNovoBloquearEnderecos(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--collab-mostarda)]"
                  />
                  <label htmlFor="chkBloquear" className="font-semibold text-[var(--foreground)] cursor-pointer">
                    Bloquear movimentações nos endereços
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)] -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setModalNovoPlanoOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <ClipboardList size={14} />
                  <span>Gerar Plano</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SUBMETER JUSTIFICATIVA DE AJUSTE (ITEM 8.4) ───────────────── */}
      {modalAjusteOpen && itemAjusteSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-amber-500/10">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-amber-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-amber-400">
                    Justificativa Obrigatória de Ajuste (Item 8.4)
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    {itemAjusteSelecionado.descricao} ({itemAjusteSelecionado.endereco})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAjusteOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Saldo Sistema:</span>
                  <strong className="text-[var(--foreground)] font-mono">{itemAjusteSelecionado.saldo_sistema} un</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Contagem Apurada:</span>
                  <strong className="text-amber-400 font-mono">{itemAjusteSelecionado.quantidade_final_apurada} un</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Diferença Física:</span>
                  <strong className={itemAjusteSelecionado.diferenca_final! > 0 ? "text-sky-400 font-mono" : "text-red-400 font-mono"}>
                    {itemAjusteSelecionado.diferenca_final! > 0 ? `+${itemAjusteSelecionado.diferenca_final}` : itemAjusteSelecionado.diferenca_final} un
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Impacto Financeiro:</span>
                  <strong className="text-red-400 font-mono">R$ {itemAjusteSelecionado.valor_ajuste_final?.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">
                  Justificativa Detalhada da Divergência:
                </label>
                <textarea
                  rows={3}
                  value={justificativaInput}
                  onChange={(e) => setJustificativaInput(e.target.value)}
                  placeholder="Explique o motivo da sobra/falta constatada (Ex: avaria oculta, erro de separação anterior, etc)..."
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="text-[11px] text-[var(--muted)]">
                {Math.abs(itemAjusteSelecionado.valor_ajuste_final || 0) > 500 ? (
                  <span className="text-purple-400 font-semibold block">
                    Alçada: Exigirá aprovação da GERÊNCIA (Valor &gt; R$ 500,00).
                  </span>
                ) : (
                  <span className="text-sky-400 font-semibold block">
                    Alçada: Exigirá aprovação da SUPERVISÃO (Valor &le; R$ 500,00).
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)]">
              <button
                type="button"
                onClick={() => setModalAjusteOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmeterAjuste}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Check size={13} />
                <span>Submeter Ajuste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SOLICITAR RECONTAGEM (RODADA 2 OU 3) ───────────────────────── */}
      {modalRecontagemOpen && planoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-purple-500/10">
              <div className="flex items-center gap-2.5">
                <RotateCcw size={18} className="text-purple-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-purple-400">
                    Solicitar Recontagem (Rodada {planoAtivo.rodada_atual + 1})
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    Plano {planoAtivo.numero_plano} • Preserva histórico anterior
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
                  Atribuir a outro Auditor / Conferente:
                </label>
                <input
                  type="text"
                  value={recontagemOperadorNome}
                  onChange={(e) => setRecontagemOperadorNome(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-bold text-[var(--foreground)]"
                />
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[11px] text-purple-300">
                A recontagem abrirá uma nova rodada independente para os itens divergentes. O histórico das contagens anteriores permanecerá 100% gravado para auditoria (Regra 8.4).
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
                onClick={handleSolicitarRecontagem}
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
