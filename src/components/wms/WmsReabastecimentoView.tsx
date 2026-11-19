"use client";

import { useState, useMemo, useEffect } from "react";
import {
  RegraReposicao,
  TarefaReabastecimento,
  PrioridadeReabastecimento,
  StatusReabastecimento,
  FlowRackInfoConsulta,
  PRIORIDADE_REABASTECIMENTO_CONFIG,
  STATUS_REABASTECIMENTO_CONFIG,
} from "@/lib/wmsReabastecimentoTypes";
import {
  fetchRegrasReposicaoApi,
  salvarRegraReposicaoApi,
  fetchTarefasReabastecimentoApi,
  dispararVerificacaoAutomaticaApi,
  alocarOperadorApi,
  cancelarTarefaApi,
  consultarFlowRackPorBipagemApi,
  executarPassoColetorApi,
} from "@/lib/wmsReabastecimentoService";
import { PortalUser } from "@/lib/authTypes";
import {
  RefreshCw,
  Boxes,
  Barcode,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Search,
  Filter,
  Plus,
  Play,
  UserCheck,
  Ban,
  Check,
  ChevronRight,
  Layers,
  MapPin,
  TrendingDown,
  X,
  Smartphone,
  CheckCheck,
  Building2,
  Info,
} from "lucide-react";

interface WmsReabastecimentoViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

export function WmsReabastecimentoView({
  currentUser,
}: WmsReabastecimentoViewProps) {
  // Sub-abas do Módulo 04
  const [subTab, setSubTab] = useState<
    "tarefas" | "coletor" | "flow_rack" | "regras"
  >("tarefas");

  // Dados
  const [tarefas, setTarefas] = useState<TarefaReabastecimento[]>([]);
  const [regras, setRegras] = useState<RegraReposicao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtros da Lista de Tarefas
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [buscaTermo, setBuscaTermo] = useState("");

  // Modais de Ação
  const [modalAlocarTarefa, setModalAlocarTarefa] = useState<TarefaReabastecimento | null>(null);
  const [operadorNomeInput, setOperadorNomeInput] = useState("");
  const [modalCancelarTarefa, setModalCancelarTarefa] = useState<TarefaReabastecimento | null>(null);
  const [motivoCancelamentoInput, setMotivoCancelamentoInput] = useState("");

  // Modal de Nova Regra de Reposição
  const [modalNovaRegraAberto, setModalNovaRegraAberto] = useState(false);
  const [formRegraCod, setFormRegraCod] = useState("");
  const [formRegraDesc, setFormRegraDesc] = useState("");
  const [formRegraEan, setFormRegraEan] = useState("");
  const [formRegraEstoqueMin, setFormRegraEstoqueMin] = useState<number>(50);
  const [formRegraEstoqueMax, setFormRegraEstoqueMax] = useState<number>(200);
  const [formRegraQtdReposicao, setFormRegraQtdReposicao] = useState<number>(100);
  const [formRegraEndPicking, setFormRegraEndPicking] = useState("");
  const [formRegraEndFlowRack, setFormRegraEndFlowRack] = useState("");
  const [formRegraEndPulmao, setFormRegraEndPulmao] = useState("");
  const [formRegraUnidade, setFormRegraUnidade] = useState("UN");

  // Modo Coletor de Dados (Simulador de Coletor de RF)
  const [tarefaColetorAtiva, setTarefaColetorAtiva] = useState<TarefaReabastecimento | null>(null);
  const [coletorInput, setColetorInput] = useState("");
  const [coletorQtdInput, setColetorQtdInput] = useState<number | "">("");
  const [coletorDivergenciaInput, setColetorDivergenciaInput] = useState("");
  const [coletorMsgFeedback, setColetorMsgFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Consulta Rápida de Flow Rack
  const [flowRackBipInput, setFlowRackBipInput] = useState("A-01-02-01-01");
  const [flowRackInfo, setFlowRackInfo] = useState<FlowRackInfoConsulta | null>(null);
  const [isBuscandoFlowRack, setIsBuscandoFlowRack] = useState(false);

  // Carregamento inicial de dados
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [tfs, rgs] = await Promise.all([
        fetchTarefasReabastecimentoApi(),
        fetchRegrasReposicaoApi(),
      ]);
      setTarefas(tfs);
      setRegras(rgs);
      // Se não houver tarefa selecionada para o coletor, pré-seleciona a primeira pendente ou em execução
      if (!tarefaColetorAtiva && tfs.length > 0) {
        const primeiraAtiva = tfs.find((t) => t.status === "em_execucao") || tfs.find((t) => t.status === "pendente");
        if (primeiraAtiva) setTarefaColetorAtiva(primeiraAtiva);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de reabastecimento:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Indicadores de Reabastecimento
  const indicadores = useMemo(() => {
    const total = tarefas.length;
    const urgentes = tarefas.filter((t) => t.prioridade === "urgente" && t.status !== "concluida" && t.status !== "cancelada").length;
    const altas = tarefas.filter((t) => t.prioridade === "alta" && t.status !== "concluida" && t.status !== "cancelada").length;
    const emExecucao = tarefas.filter((t) => t.status === "em_execucao").length;
    const concluidas = tarefas.filter((t) => t.status === "concluida").length;
    const divergencias = tarefas.filter((t) => t.status === "com_divergencia").length;

    return { total, urgentes, altas, emExecucao, concluidas, divergencias };
  }, [tarefas]);

  // Filtro de Tarefas
  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((t) => {
      if (filtroPrioridade !== "todas" && t.prioridade !== filtroPrioridade) return false;
      if (filtroStatus !== "todas" && t.status !== filtroStatus) return false;
      if (buscaTermo.trim()) {
        const termo = buscaTermo.toLowerCase();
        const matchNum = t.numero_tarefa.toLowerCase().includes(termo);
        const matchProd = t.cod_produto.toLowerCase().includes(termo);
        const matchDesc = t.descricao.toLowerCase().includes(termo);
        const matchOrigem = t.endereco_origem.toLowerCase().includes(termo);
        const matchDestino = t.endereco_destino.toLowerCase().includes(termo);
        const matchOp = (t.operador_nome || "").toLowerCase().includes(termo);
        if (!matchNum && !matchProd && !matchDesc && !matchOrigem && !matchDestino && !matchOp) {
          return false;
        }
      }
      return true;
    });
  }, [tarefas, filtroPrioridade, filtroStatus, buscaTermo]);

  // Handler: Verificação Automática de Pickings
  const handleDispararVerificacaoAutomatica = async () => {
    setIsLoading(true);
    const res = await dispararVerificacaoAutomaticaApi();
    setIsLoading(false);

    if (res.success) {
      setToastMsg({
        text: `Verificação concluída! ${res.totalGeradas || 0} novas tarefas de reabastecimento geradas automaticamente.`,
        type: "success",
      });
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao verificar saldos de picking.", type: "error" });
    }
  };

  // Handler: Alocar Operador
  const handleConfirmarAlocacao = async () => {
    if (!modalAlocarTarefa) return;
    if (!operadorNomeInput.trim()) {
      setToastMsg({ text: "Informe o nome do operador para a tarefa.", type: "error" });
      return;
    }

    const res = await alocarOperadorApi(
      modalAlocarTarefa.id,
      operadorNomeInput.trim(),
      currentUser?.name || "Supervisor WMS"
    );

    if (res.success) {
      setToastMsg({
        text: `Tarefa ${modalAlocarTarefa.numero_tarefa} alocada para [${operadorNomeInput.trim()}].`,
        type: "success",
      });
      setModalAlocarTarefa(null);
      setOperadorNomeInput("");
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao alocar operador.", type: "error" });
    }
  };

  // Handler: Cancelar Tarefa
  const handleConfirmarCancelamento = async () => {
    if (!modalCancelarTarefa) return;
    if (!motivoCancelamentoInput.trim()) {
      setToastMsg({ text: "Informe o motivo do cancelamento.", type: "error" });
      return;
    }

    const res = await cancelarTarefaApi(
      modalCancelarTarefa.id,
      motivoCancelamentoInput.trim(),
      currentUser?.name || "Supervisor WMS"
    );

    if (res.success) {
      setToastMsg({
        text: `Tarefa ${modalCancelarTarefa.numero_tarefa} cancelada com sucesso.`,
        type: "success",
      });
      setModalCancelarTarefa(null);
      setMotivoCancelamentoInput("");
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao cancelar tarefa.", type: "error" });
    }
  };

  // Handler: Salvar Nova Regra de Reposição
  const handleSalvarRegra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRegraCod.trim() || !formRegraEndPicking.trim() || !formRegraEndPulmao.trim()) {
      setToastMsg({ text: "Preencha todos os campos obrigatórios da regra.", type: "error" });
      return;
    }

    const res = await salvarRegraReposicaoApi({
      cod_produto: formRegraCod.trim().toUpperCase(),
      descricao: formRegraDesc.trim() || formRegraCod.trim().toUpperCase(),
      ean: formRegraEan.trim() || undefined,
      estoque_min_picking: Number(formRegraEstoqueMin),
      estoque_max_picking: Number(formRegraEstoqueMax),
      quantidade_reposicao: Number(formRegraQtdReposicao),
      endereco_picking: formRegraEndPicking.trim().toUpperCase(),
      endereco_flow_rack: formRegraEndFlowRack.trim() ? formRegraEndFlowRack.trim().toUpperCase() : undefined,
      endereco_pulmao: formRegraEndPulmao.trim().toUpperCase(),
      unidade_movimentacao: formRegraUnidade.trim().toUpperCase() || "UN",
      ativo: true,
    });

    if (res.success) {
      setToastMsg({
        text: `Regra para o produto [${formRegraCod.toUpperCase()}] salva com sucesso!`,
        type: "success",
      });
      setModalNovaRegraAberto(false);
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao salvar regra de reposição.", type: "error" });
    }
  };

  // Handler: Consulta de Flow Rack por Bipagem
  const handleConsultarFlowRack = async (codigoParaConsultar?: string) => {
    const cod = (codigoParaConsultar || flowRackBipInput).trim().toUpperCase();
    if (!cod) return;

    setIsBuscandoFlowRack(true);
    setFlowRackInfo(null);

    const res = await consultarFlowRackPorBipagemApi(cod);
    setIsBuscandoFlowRack(false);

    if (res.success && res.info) {
      setFlowRackInfo(res.info);
    } else {
      setToastMsg({
        text: res.error || `Nenhuma regra de Flow Rack encontrada para [${cod}].`,
        type: "error",
      });
    }
  };

  // Handler: Executar no Coletor a partir da consulta do Flow Rack
  const handleGerarERedirecionarColetorFlowRack = async () => {
    if (!flowRackInfo) return;
    setIsLoading(true);
    // Dispara a verificação que cria a tarefa
    await dispararVerificacaoAutomaticaApi();
    const tfs = await fetchTarefasReabastecimentoApi();
    setTarefas(tfs);
    const criada = tfs.find(
      (t) => t.cod_produto === flowRackInfo.cod_produto && t.endereco_destino === flowRackInfo.endereco_codigo
    );
    if (criada) {
      setTarefaColetorAtiva(criada);
      setSubTab("coletor");
      setToastMsg({
        text: `Tarefa ${criada.numero_tarefa} aberta no coletor! Dirija-se ao pulmão [${criada.endereco_origem}].`,
        type: "success",
      });
    }
    setIsLoading(false);
  };

  // Handlers do Simulador de Coletor
  const handleBiparOrigemColetor = async (valorOverride?: string) => {
    if (!tarefaColetorAtiva) return;
    const val = valorOverride !== undefined ? valorOverride : coletorInput;

    const res = await executarPassoColetorApi({
      tarefaId: tarefaColetorAtiva.id,
      passo: "bipar_origem",
      valorBipado: val,
      operadorNome: currentUser?.name || "Operador Coletor",
    });

    if (res.success && res.tarefa) {
      setTarefaColetorAtiva(res.tarefa);
      setColetorInput("");
      setColetorMsgFeedback({ text: "Endereço de origem validado! Agora bipe o código do produto.", type: "success" });
      await carregarDados();
    } else {
      setColetorMsgFeedback({ text: res.error || "Endereço de origem incorreto.", type: "error" });
    }
  };

  const handleBiparProdutoColetor = async (valorOverride?: string) => {
    if (!tarefaColetorAtiva) return;
    const val = valorOverride !== undefined ? valorOverride : coletorInput;

    const res = await executarPassoColetorApi({
      tarefaId: tarefaColetorAtiva.id,
      passo: "bipar_produto",
      valorBipado: val,
      operadorNome: currentUser?.name || "Operador Coletor",
    });

    if (res.success && res.tarefa) {
      setTarefaColetorAtiva(res.tarefa);
      setColetorInput("");
      setColetorQtdInput(res.tarefa.quantidade_solicitada);
      setColetorMsgFeedback({ text: "Produto conferido! Confirme a quantidade retirada.", type: "success" });
      await carregarDados();
    } else {
      setColetorMsgFeedback({ text: res.error || "Produto divergente da solicitação.", type: "error" });
    }
  };

  const handleConfirmarQtdColetor = async () => {
    if (!tarefaColetorAtiva) return;
    if (!coletorQtdInput || Number(coletorQtdInput) <= 0) {
      setColetorMsgFeedback({ text: "Informe a quantidade retirada.", type: "error" });
      return;
    }

    const res = await executarPassoColetorApi({
      tarefaId: tarefaColetorAtiva.id,
      passo: "informar_qtd",
      quantidadeInformada: Number(coletorQtdInput),
      divergenciaMotivo: coletorDivergenciaInput || undefined,
      operadorNome: currentUser?.name || "Operador Coletor",
    });

    if (res.success && res.tarefa) {
      setTarefaColetorAtiva(res.tarefa);
      setColetorInput("");
      setColetorMsgFeedback({
        text: "Quantidade registrada! Agora dirija-se ao destino e bipe o endereço.",
        type: "success",
      });
      await carregarDados();
    } else {
      setColetorMsgFeedback({ text: res.error || "Erro ao registrar quantidade.", type: "error" });
    }
  };

  const handleBiparDestinoColetor = async (valorOverride?: string) => {
    if (!tarefaColetorAtiva) return;
    const val = valorOverride !== undefined ? valorOverride : coletorInput;

    const res = await executarPassoColetorApi({
      tarefaId: tarefaColetorAtiva.id,
      passo: "bipar_destino",
      valorBipado: val,
      operadorNome: currentUser?.name || "Operador Coletor",
    });

    if (res.success && res.tarefa) {
      setTarefaColetorAtiva(res.tarefa);
      setColetorInput("");
      setColetorMsgFeedback({ text: "Endereço de destino conferido! Clique em Concluir Reabastecimento.", type: "success" });
      await carregarDados();
    } else {
      setColetorMsgFeedback({ text: res.error || "Endereço de destino incorreto.", type: "error" });
    }
  };

  const handleFinalizarTarefaColetor = async () => {
    if (!tarefaColetorAtiva) return;

    const res = await executarPassoColetorApi({
      tarefaId: tarefaColetorAtiva.id,
      passo: "concluir",
      operadorNome: currentUser?.name || "Operador Coletor",
    });

    if (res.success && res.tarefa) {
      setTarefaColetorAtiva(res.tarefa);
      setToastMsg({
        text: `Reabastecimento ${res.tarefa.numero_tarefa} concluído com sucesso! Estoque atualizado.`,
        type: "success",
      });
      setColetorMsgFeedback({ text: "Tarefa finalizada e estoque movimentado com sucesso no WMS!", type: "success" });
      await carregarDados();
    } else {
      setColetorMsgFeedback({ text: res.error || "Erro ao finalizar movimentação.", type: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Principal do Módulo 04 */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
              WMS • Módulo 04
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Building2 size={13} />
              <span>CD-01 — Barueri Matriz</span>
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Reabastecimento de Picking & Flow Rack
          </h1>
          <p className="text-xs text-[var(--muted)] max-w-2xl">
            Garantia de disponibilidade contínua de estoque para separação, gatilhos automáticos por estoque mínimo e onda, alocação de operadores e execução passo a passo via coletor.
          </p>
        </div>

        {/* Ações de Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDispararVerificacaoAutomatica}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-semibold text-[var(--foreground)] transition-all cursor-pointer shadow-sm"
            title="Varre todos os endereços de picking e abre tarefas caso o saldo esteja no mínimo"
          >
            <Sparkles size={14} className="text-[var(--collab-mostarda)]" />
            <span>Verificar Saldos & Gerar Tarefas</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("coletor")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Smartphone size={15} />
            <span>Modo Coletor</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-sm ${
            toastMsg.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
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

      {/* KPI Cards Rápidos de Reabastecimento */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Reposição Urgente</span>
            <AlertTriangle size={14} className="text-rose-500" />
          </div>
          <div className="font-heading text-xl font-bold text-rose-500">
            {indicadores.urgentes}
          </div>
          <span className="text-[10px] text-rose-400/80 block">Saldo = 0 no picking</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Reposição Alta</span>
            <TrendingDown size={14} className="text-amber-400" />
          </div>
          <div className="font-heading text-xl font-bold text-amber-400">
            {indicadores.altas}
          </div>
          <span className="text-[10px] text-amber-500/80 block">Abaixo do estoque mínimo</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Em Execução</span>
            <Clock size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="font-heading text-xl font-bold text-[var(--collab-mostarda)]">
            {indicadores.emExecucao}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Operadores no armazém</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Concluídas Hoje</span>
            <CheckCheck size={14} className="text-emerald-400" />
          </div>
          <div className="font-heading text-xl font-bold text-emerald-400">
            {indicadores.concluidas}
          </div>
          <span className="text-[10px] text-emerald-500/80 block">Pickings abastecidos</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Com Divergência</span>
            <Ban size={14} className="text-red-400" />
          </div>
          <div className="font-heading text-xl font-bold text-red-400">
            {indicadores.divergencias}
          </div>
          <span className="text-[10px] text-red-400/80 block">Qtd ou lote divergente</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Total Tarefas</span>
            <Layers size={14} className="text-sky-400" />
          </div>
          <div className="font-heading text-xl font-bold text-sky-400">
            {indicadores.total}
          </div>
          <span className="text-[10px] text-sky-400/80 block">Histórico de ressuprimento</span>
        </div>
      </div>

      {/* Navegação por Sub-Abas do Módulo 04 */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab("tarefas")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "tarefas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Layers size={15} />
          <span>1. Painel de Tarefas & Alocação ({tarefasFiltradas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("coletor")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "coletor"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Smartphone size={15} />
          <span>2. Modo Coletor de Dados (Execução do Operador)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("flow_rack")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "flow_rack"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Barcode size={15} />
          <span>3. Flow Rack Inteligente (Consulta por Bipagem)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("regras")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "regras"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Boxes size={15} />
          <span>4. Parâmetros & Regras de Reposição ({regras.length})</span>
        </button>
      </div>

      {/* ── ABA 1: PAINEL DE TAREFAS & ALOCAÇÃO (Item 4.3 & 4.4) ─────────────── */}
      {subTab === "tarefas" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted)] font-medium">Prioridade:</span>
                <select
                  value={filtroPrioridade}
                  onChange={(e) => setFiltroPrioridade(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-medium focus:outline-none"
                >
                  <option value="todas">Todas as Prioridades</option>
                  <option value="urgente">🚨 Urgente (Saldo = 0)</option>
                  <option value="alta">⚠️ Alta (Abaixo do Mínimo)</option>
                  <option value="programada">📅 Programada / Preventiva</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted)] font-medium">Status:</span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-medium focus:outline-none"
                >
                  <option value="todas">Todos os Status</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_execucao">Em Execução</option>
                  <option value="concluida">Concluída</option>
                  <option value="com_divergencia">Com Divergência</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="relative min-w-[260px]">
              <Search size={14} className="absolute left-3 top-3 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar por tarefa, SKU, destino ou operador..."
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
              />
            </div>
          </div>

          {/* Tabela de Tarefas */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-[var(--muted)] border-b border-[var(--card-border)] bg-[var(--background)]/50">
                  <tr>
                    <th className="py-3 px-3.5">Tarefa</th>
                    <th className="py-3 px-3.5">Prioridade</th>
                    <th className="py-3 px-3.5">Produto (SKU)</th>
                    <th className="py-3 px-3.5">Origem (Pulmão) &rarr; Destino</th>
                    <th className="py-3 px-3.5">Saldo Destino</th>
                    <th className="py-3 px-3.5 text-right">Qtd Reposição</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Operador</th>
                    <th className="py-3 px-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {tarefasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-[var(--muted)]">
                        Nenhuma tarefa encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    tarefasFiltradas.map((tarefa) => {
                      const prioridadeCfg = PRIORIDADE_REABASTECIMENTO_CONFIG[tarefa.prioridade];
                      const statusCfg = STATUS_REABASTECIMENTO_CONFIG[tarefa.status];

                      return (
                        <tr key={tarefa.id} className="hover:bg-[var(--background)]/40 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-[var(--foreground)] whitespace-nowrap">
                            {tarefa.numero_tarefa}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${prioridadeCfg.bg} ${prioridadeCfg.border} ${prioridadeCfg.text} ${
                                prioridadeCfg.pulse ? "animate-pulse" : ""
                              }`}
                            >
                              {tarefa.prioridade === "urgente" && <AlertTriangle size={10} />}
                              <span>{prioridadeCfg.label}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="font-mono font-bold text-[var(--foreground)] block">
                              {tarefa.cod_produto}
                            </span>
                            <span className="text-[10px] text-[var(--muted)] truncate max-w-[170px] block">
                              {tarefa.descricao}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 font-mono font-bold whitespace-nowrap">
                            <span className="text-indigo-400">{tarefa.endereco_origem}</span>
                            <span className="text-[var(--muted)] mx-1">&rarr;</span>
                            <span className={tarefa.tipo_local === "flow_rack" ? "text-cyan-400" : "text-emerald-400"}>
                              {tarefa.endereco_destino}
                            </span>
                            <span className="text-[9px] text-[var(--muted)] font-normal block">
                              {tarefa.tipo_local === "flow_rack" ? "Flow Rack Fixo" : "Picking Chão"}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`font-mono font-bold ${
                                tarefa.saldo_atual_destino === 0
                                  ? "text-rose-500"
                                  : tarefa.saldo_atual_destino <= tarefa.estoque_min_destino
                                  ? "text-amber-400"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {tarefa.saldo_atual_destino} un
                            </span>
                            <span className="text-[10px] text-[var(--muted)] block">
                              Mín: {tarefa.estoque_min_destino} un
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-right font-mono font-bold text-[var(--foreground)] whitespace-nowrap">
                            {tarefa.quantidade_solicitada} {tarefa.unidade_movimentacao}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}
                            >
                              {statusCfg.label}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {tarefa.operador_nome ? (
                              <span className="font-semibold text-[var(--foreground)] block">
                                {tarefa.operador_nome}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[var(--muted)] italic">
                                Não alocado
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {tarefa.status !== "concluida" && tarefa.status !== "cancelada" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTarefaColetorAtiva(tarefa);
                                      setSubTab("coletor");
                                    }}
                                    className="px-2.5 py-1 rounded bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                                    title="Assumir e executar no coletor"
                                  >
                                    Executar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalAlocarTarefa(tarefa);
                                      setOperadorNomeInput(tarefa.operador_nome || "");
                                    }}
                                    className="p-1 rounded bg-[var(--background)] hover:bg-[var(--card-border)] text-[var(--foreground)] border border-[var(--card-border)] cursor-pointer"
                                    title="Alocar para operador"
                                  >
                                    <UserCheck size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalCancelarTarefa(tarefa);
                                      setMotivoCancelamentoInput("");
                                    }}
                                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                                    title="Cancelar tarefa"
                                  >
                                    <Ban size={13} />
                                  </button>
                                </>
                              )}
                            </div>
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

      {/* ── ABA 2: MODO COLETOR DE DADOS (EXECUÇÃO OPERACIONAL) (Item 4.3) ────── */}
      {subTab === "coletor" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Seletor de Tarefa Ativa */}
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Smartphone size={20} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Coletor de Dados • WMS Mobile RF
                </h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Execução guiada de reabastecimento passo a passo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tarefaColetorAtiva?.id || ""}
                onChange={(e) => {
                  const t = tarefas.find((item) => item.id === e.target.value);
                  if (t) {
                    setTarefaColetorAtiva(t);
                    setColetorInput("");
                    setColetorMsgFeedback(null);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono font-bold focus:outline-none"
              >
                {tarefas
                  .filter((t) => t.status !== "cancelada")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.numero_tarefa} • {t.cod_produto} ({t.prioridade.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {!tarefaColetorAtiva ? (
            <div className="p-12 text-center bg-[var(--card)] border border-[var(--card-border)] rounded-2xl">
              <Boxes size={36} className="mx-auto text-[var(--muted)] mb-2" />
              <p className="font-semibold text-sm text-[var(--foreground)]">Nenhuma tarefa selecionada.</p>
              <p className="text-xs text-[var(--muted)] mt-1">Selecione uma tarefa acima ou no painel de supervisão.</p>
            </div>
          ) : (
            /* Card Simulação do Coletor */
            <div className="bg-[var(--card)] border-2 border-[var(--collab-mostarda)]/40 rounded-3xl p-6 shadow-xl space-y-6">
              {/* Header do Coletor */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                <div>
                  <span className="font-mono font-black text-lg text-[var(--foreground)] block">
                    {tarefaColetorAtiva.numero_tarefa}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    Operador: <strong>{tarefaColetorAtiva.operador_nome || currentUser?.name || "Operador Coletor"}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      PRIORIDADE_REABASTECIMENTO_CONFIG[tarefaColetorAtiva.prioridade].bg
                    } ${PRIORIDADE_REABASTECIMENTO_CONFIG[tarefaColetorAtiva.prioridade].text} ${
                      PRIORIDADE_REABASTECIMENTO_CONFIG[tarefaColetorAtiva.prioridade].border
                    }`}
                  >
                    {tarefaColetorAtiva.prioridade}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block mt-0.5">
                    {STATUS_REABASTECIMENTO_CONFIG[tarefaColetorAtiva.status].label}
                  </span>
                </div>
              </div>

              {/* Informações da Carga a Movimentar */}
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                    {tarefaColetorAtiva.cod_produto}
                  </span>
                  <span className="font-mono text-xs text-sky-400 font-bold">
                    Qtd Solicitada: {tarefaColetorAtiva.quantidade_solicitada} {tarefaColetorAtiva.unidade_movimentacao}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">{tarefaColetorAtiva.descricao}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--muted)] pt-1 border-t border-[var(--card-border)]/50">
                  <span>EAN: {tarefaColetorAtiva.ean || "7894900010015"}</span>
                  <span>Lote: {tarefaColetorAtiva.lote || "LOTE-PULMAO"}</span>
                </div>
              </div>

              {/* Feedback Alert do Coletor */}
              {coletorMsgFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
                    coletorMsgFeedback.type === "success"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold"
                      : "bg-red-500/15 border-red-500/30 text-red-400 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {coletorMsgFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{coletorMsgFeedback.text}</span>
                  </div>
                  <button type="button" onClick={() => setColetorMsgFeedback(null)} className="p-0.5 text-current">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* FLUXO PASSO A PASSO GUIADO */}
              <div className="space-y-4">
                {/* ETAPA 1: Bipar Endereço de Origem (Pulmão) */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    tarefaColetorAtiva.bipagens_conferencia.origem_bipada
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-[var(--card)] border-[var(--collab-mostarda)] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-[var(--collab-mostarda)] text-[#080808] flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                      <span>Dirija-se ao Pulmão de Origem</span>
                    </span>
                    {tarefaColetorAtiva.bipagens_conferencia.origem_bipada && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Bipado OK
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--muted)] mb-2">
                    Endereço de Origem: <strong className="text-indigo-400 font-mono text-sm">{tarefaColetorAtiva.endereco_origem}</strong>
                  </p>

                  {!tarefaColetorAtiva.bipagens_conferencia.origem_bipada && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Bipar endereço do pulmão..."
                          value={coletorInput}
                          onChange={(e) => setColetorInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleBiparOrigemColetor()}
                          className="px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase cursor-pointer"
                        >
                          Bipar
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                        <span>Teste Rápido:</span>
                        <button
                          type="button"
                          onClick={() => handleBiparOrigemColetor(tarefaColetorAtiva.endereco_origem)}
                          className="px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-indigo-400 font-mono hover:border-indigo-400 cursor-pointer"
                        >
                          Simular Bipagem Correta [{tarefaColetorAtiva.endereco_origem}]
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ETAPA 2: Bipar Produto */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    !tarefaColetorAtiva.bipagens_conferencia.origem_bipada
                      ? "opacity-50 pointer-events-none bg-[var(--background)]/20 border-[var(--card-border)]"
                      : tarefaColetorAtiva.bipagens_conferencia.produto_bipado
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-[var(--card)] border-[var(--collab-mostarda)] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-[var(--collab-mostarda)] text-[#080808] flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <span>Bipar Produto (SKU / EAN)</span>
                    </span>
                    {tarefaColetorAtiva.bipagens_conferencia.produto_bipado && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Produto OK
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--muted)] mb-2">
                    Esperado: <strong className="text-[var(--foreground)] font-mono">{tarefaColetorAtiva.cod_produto}</strong> ou EAN <strong className="text-[var(--foreground)] font-mono">{tarefaColetorAtiva.ean || "7894900010015"}</strong>
                  </p>

                  {tarefaColetorAtiva.bipagens_conferencia.origem_bipada &&
                    !tarefaColetorAtiva.bipagens_conferencia.produto_bipado && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Bipar código de barras do produto..."
                            value={coletorInput}
                            onChange={(e) => setColetorInput(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                          />
                          <button
                            type="button"
                            onClick={() => handleBiparProdutoColetor()}
                            className="px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase cursor-pointer"
                          >
                            Bipar
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                          <span>Teste Rápido:</span>
                          <button
                            type="button"
                            onClick={() => handleBiparProdutoColetor(tarefaColetorAtiva.cod_produto)}
                            className="px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-sky-400 font-mono hover:border-sky-400 cursor-pointer"
                          >
                            Simular Código [{tarefaColetorAtiva.cod_produto}]
                          </button>
                        </div>
                      </div>
                    )}
                </div>

                {/* ETAPA 3: Informar Quantidade Retirada */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    !tarefaColetorAtiva.bipagens_conferencia.produto_bipado
                      ? "opacity-50 pointer-events-none bg-[var(--background)]/20 border-[var(--card-border)]"
                      : tarefaColetorAtiva.bipagens_conferencia.qtd_confirmada
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-[var(--card)] border-[var(--collab-mostarda)] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-[var(--collab-mostarda)] text-[#080808] flex items-center justify-center text-[10px] font-black">
                        3
                      </span>
                      <span>Confirmar Quantidade Retirada</span>
                    </span>
                    {tarefaColetorAtiva.bipagens_conferencia.qtd_confirmada && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> {tarefaColetorAtiva.bipagens_conferencia.qtd_confirmada} {tarefaColetorAtiva.unidade_movimentacao} Retirados
                      </span>
                    )}
                  </div>

                  {tarefaColetorAtiva.bipagens_conferencia.produto_bipado &&
                    !tarefaColetorAtiva.bipagens_conferencia.qtd_confirmada && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                              Qtd Retirada ({tarefaColetorAtiva.unidade_movimentacao})
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={coletorQtdInput}
                              onChange={(e) => setColetorQtdInput(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                              Justificativa se divergente
                            </label>
                            <input
                              type="text"
                              placeholder="Opcional se saldo for menor..."
                              value={coletorDivergenciaInput}
                              onChange={(e) => setColetorDivergenciaInput(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleConfirmarQtdColetor}
                          className="w-full py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase cursor-pointer"
                        >
                          Confirmar Retirada da Quantidade
                        </button>
                      </div>
                    )}
                </div>

                {/* ETAPA 4: Bipar Endereço de Destino (Picking / Flow Rack) */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    !tarefaColetorAtiva.bipagens_conferencia.qtd_confirmada
                      ? "opacity-50 pointer-events-none bg-[var(--background)]/20 border-[var(--card-border)]"
                      : tarefaColetorAtiva.bipagens_conferencia.destino_bipado
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-[var(--card)] border-[var(--collab-mostarda)] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-[var(--collab-mostarda)] text-[#080808] flex items-center justify-center text-[10px] font-black">
                        4
                      </span>
                      <span>Dirija-se ao Destino ({tarefaColetorAtiva.tipo_local === "flow_rack" ? "Flow Rack" : "Picking"})</span>
                    </span>
                    {tarefaColetorAtiva.bipagens_conferencia.destino_bipado && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={14} /> Destino Bipado
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--muted)] mb-2">
                    Endereço Destino: <strong className="text-emerald-400 font-mono text-sm">{tarefaColetorAtiva.endereco_destino}</strong>
                  </p>

                  {tarefaColetorAtiva.bipagens_conferencia.qtd_confirmada &&
                    !tarefaColetorAtiva.bipagens_conferencia.destino_bipado && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Bipar endereço de picking / flow rack..."
                            value={coletorInput}
                            onChange={(e) => setColetorInput(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                          />
                          <button
                            type="button"
                            onClick={() => handleBiparDestinoColetor()}
                            className="px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase cursor-pointer"
                          >
                            Bipar
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                          <span>Teste Rápido:</span>
                          <button
                            type="button"
                            onClick={() => handleBiparDestinoColetor(tarefaColetorAtiva.endereco_destino)}
                            className="px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-emerald-400 font-mono hover:border-emerald-400 cursor-pointer"
                          >
                            Simular Bipagem Destino [{tarefaColetorAtiva.endereco_destino}]
                          </button>
                        </div>
                      </div>
                    )}
                </div>

                {/* ETAPA 5: Finalizar Movimentação */}
                {tarefaColetorAtiva.bipagens_conferencia.destino_bipado &&
                  tarefaColetorAtiva.status !== "concluida" && (
                    <button
                      type="button"
                      onClick={handleFinalizarTarefaColetor}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-black text-sm uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCheck size={18} />
                      <span>Concluir Reabastecimento no WMS</span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA 3: FLOW RACK INTELIGENTE (CONSULTA POR BIPAGEM) (Item 4.2) ─────── */}
      {subTab === "flow_rack" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--card-border)]">
              <Barcode size={20} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Consulta de Flow Rack por Bipagem
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Bipe o código do Flow Rack para identificar o SKU fixo, a capacidade da pista e a localização de pulmão
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                Bipar ou Digitar Endereço do Flow Rack *
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: A-01-02-01-01"
                  value={flowRackBipInput}
                  onChange={(e) => setFlowRackBipInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
                <button
                  type="button"
                  onClick={() => handleConsultarFlowRack()}
                  disabled={isBuscandoFlowRack}
                  className="px-5 py-2.5 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Search size={15} className={isBuscandoFlowRack ? "animate-spin" : ""} />
                  <span>Consultar</span>
                </button>
              </div>

              {/* Botões de Teste Rápido com Flow Racks Existentes */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-[var(--muted)]">
                <span>Atalhos de Simulação:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFlowRackBipInput("A-01-02-01-01");
                    handleConsultarFlowRack("A-01-02-01-01");
                  }}
                  className="px-2.5 py-1 rounded bg-[var(--background)] border border-[var(--card-border)] text-cyan-400 font-mono text-[11px] hover:border-cyan-400 cursor-pointer"
                >
                  Flow Rack A-01-02-01-01 (Dipirona)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlowRackBipInput("A-01-02-01-02");
                    handleConsultarFlowRack("A-01-02-01-02");
                  }}
                  className="px-2.5 py-1 rounded bg-[var(--background)] border border-[var(--card-border)] text-cyan-400 font-mono text-[11px] hover:border-cyan-400 cursor-pointer"
                >
                  Flow Rack A-01-02-01-02 (Paracetamol)
                </button>
              </div>
            </div>
          </div>

          {/* Resultado da Consulta do Flow Rack */}
          {flowRackInfo && (
            <div className="p-6 rounded-2xl bg-[var(--card)] border-2 border-cyan-500/40 shadow-xl space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-cyan-400">
                      {flowRackInfo.endereco_codigo}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      LOCAL FIXO
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Pista gravítica dedicada a fracionados de alta rotatividade
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                      flowRackInfo.precisa_reabastecer
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse"
                        : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {flowRackInfo.precisa_reabastecer ? "🚨 Reposição Necessária" : "🟢 Estoque Regular"}
                  </span>
                </div>
              </div>

              {/* Informações do SKU Vinculado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)]">
                    SKU Fixo Designado
                  </span>
                  <div className="font-mono font-black text-base text-[var(--foreground)]">
                    {flowRackInfo.cod_produto}
                  </div>
                  <p className="text-xs text-[var(--muted)]">{flowRackInfo.descricao}</p>
                  <p className="text-[11px] font-mono text-[var(--muted)] pt-1 border-t border-[var(--card-border)]/50">
                    EAN: {flowRackInfo.ean}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)]">
                    Origem de Retirada (Pulmão Recomendado)
                  </span>
                  <div className="font-mono font-black text-base text-indigo-400">
                    {flowRackInfo.pulmao_sugerido}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Estoque aéreo vertical reservado para ressuprimento deste Flow Rack
                  </p>
                </div>
              </div>

              {/* Indicadores de Capacidade e Saldo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Saldo Atual no Flow</span>
                  <span
                    className={`font-mono font-black text-base ${
                      flowRackInfo.saldo_atual <= flowRackInfo.estoque_minimo ? "text-rose-500" : "text-emerald-400"
                    }`}
                  >
                    {flowRackInfo.saldo_atual} un
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Estoque Mínimo</span>
                  <span className="font-mono font-bold text-base text-amber-400">
                    {flowRackInfo.estoque_minimo} un
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Capacidade da Pista</span>
                  <span className="font-mono font-bold text-base text-[var(--foreground)]">
                    {flowRackInfo.capacidade_caixas} caixas
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Qtd a Reabastecer</span>
                  <span className="font-mono font-black text-base text-[var(--collab-mostarda)]">
                    {flowRackInfo.quantidade_necessaria} un
                  </span>
                </div>
              </div>

              {/* Ação de Reabastecimento */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleGerarERedirecionarColetorFlowRack}
                  className="px-5 py-2.5 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowRightLeft size={16} />
                  <span>Gerar Tarefa & Executar no Coletor</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA 4: PARÂMETROS & REGRAS DE REPOSIÇÃO (Item 4.2) ────────────────── */}
      {subTab === "regras" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                Parâmetros de Estoque Mínimo, Máximo e Locais Fixos
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Configuração para disparo automático de tarefas de reabastecimento
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalNovaRegraAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Nova Regra de Reposição</span>
            </button>
          </div>

          <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-[var(--muted)] border-b border-[var(--card-border)] bg-[var(--background)]/50">
                  <tr>
                    <th className="py-3 px-3.5">Código (SKU)</th>
                    <th className="py-3 px-3.5">Descrição</th>
                    <th className="py-3 px-3.5 text-right">Estoque Mínimo</th>
                    <th className="py-3 px-3.5 text-right">Estoque Máximo</th>
                    <th className="py-3 px-3.5 text-right">Lote Reposição</th>
                    <th className="py-3 px-3.5">End. Picking</th>
                    <th className="py-3 px-3.5">End. Flow Rack</th>
                    <th className="py-3 px-3.5">End. Pulmão</th>
                    <th className="py-3 px-3.5">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {regras.map((regra) => (
                    <tr key={regra.id} className="hover:bg-[var(--background)]/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-[var(--foreground)]">
                        {regra.cod_produto}
                      </td>
                      <td className="py-3 px-3.5 text-[var(--muted)] truncate max-w-[200px]">
                        {regra.descricao}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-400">
                        {regra.estoque_min_picking}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                        {regra.estoque_max_picking}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-[var(--collab-mostarda)]">
                        {regra.quantidade_reposicao}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">
                        {regra.endereco_picking}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-cyan-400">
                        {regra.endereco_flow_rack || "-"}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-400">
                        {regra.endereco_pulmao}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-[var(--muted)]">
                        {regra.unidade_movimentacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ALOCAR OPERADOR PARA TAREFA ─────────────────────────────── */}
      {modalAlocarTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[var(--foreground)] font-heading font-bold text-sm">
              <UserCheck size={18} className="text-[var(--collab-mostarda)]" />
              <span>Alocar Tarefa {modalAlocarTarefa.numero_tarefa}</span>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Designe o operador que receberá a ordem de movimentação no coletor de dados.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Nome do Operador *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Operador Lucas Santos"
                value={operadorNomeInput}
                onChange={(e) => setOperadorNomeInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalAlocarTarefa(null)}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAlocacao}
                className="px-4 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase"
              >
                Confirmar Alocação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CANCELAR TAREFA ─────────────────────────────────────────── */}
      {modalCancelarTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-heading font-bold text-sm">
              <Ban size={18} />
              <span>Cancelar Tarefa {modalCancelarTarefa.numero_tarefa}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Demanda suspensa, separação finalizada sem necessidade..."
                value={motivoCancelamentoInput}
                onChange={(e) => setMotivoCancelamentoInput(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalCancelarTarefa(null)}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelamento}
                className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVA REGRA DE REPOSIÇÃO ─────────────────────────────────── */}
      {modalNovaRegraAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                Nova Regra & Parâmetro de Reposição
              </h3>
              <button
                type="button"
                onClick={() => setModalNovaRegraAberto(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSalvarRegra} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Código (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BEB-COCA-2L"
                    value={formRegraCod}
                    onChange={(e) => setFormRegraCod(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Código de Barras (EAN)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 7894900010015"
                    value={formRegraEan}
                    onChange={(e) => setFormRegraEan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Descrição do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do produto..."
                  value={formRegraDesc}
                  onChange={(e) => setFormRegraDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formRegraEstoqueMin}
                    onChange={(e) => setFormRegraEstoqueMin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Estoque Máximo *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formRegraEstoqueMax}
                    onChange={(e) => setFormRegraEstoqueMax(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Lote Reposição *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formRegraQtdReposicao}
                    onChange={(e) => setFormRegraQtdReposicao(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Endereço de Picking *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A-01-01-01-01"
                    value={formRegraEndPicking}
                    onChange={(e) => setFormRegraEndPicking(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Endereço Flow Rack (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: A-01-02-01-01"
                    value={formRegraEndFlowRack}
                    onChange={(e) => setFormRegraEndFlowRack(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Endereço Pulmão Origem *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A-01-01-03-01"
                    value={formRegraEndPulmao}
                    onChange={(e) => setFormRegraEndPulmao(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Unidade de Movimentação
                  </label>
                  <input
                    type="text"
                    placeholder="UN, CX, FD, PAL"
                    value={formRegraUnidade}
                    onChange={(e) => setFormRegraUnidade(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setModalNovaRegraAberto(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold uppercase tracking-wider"
                >
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
