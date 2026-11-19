"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PedidoSeparacao,
  OndaSeparacao,
  EmbalagemPicking,
  TarefaPicking,
  RegistroProdutividadePicking,
  IndicadoresPickingCD,
  EstrategiaPicking,
  PrioridadePedido,
  ModoParametrizacaoOnda,
} from "@/lib/wmsPickingTypes";
import {
  fetchPedidosSeparacao,
  importarPedidosErpService,
  fetchEmbalagensPicking,
  salvarEmbalagemService,
  calcularCubagemService,
  fetchOndasSeparacao,
  criarOndaService,
  fetchTarefasPicking,
  alocarTarefaOperadorService,
  executarBipagemSeparacaoService,
  finalizarTarefaPickingService,
  fetchProdutividadePicking,
} from "@/lib/wmsPickingService";
import { PortalUser } from "@/lib/authTypes";
import {
  Boxes,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Search,
  Filter,
  Plus,
  Play,
  RotateCcw,
  Barcode,
  Truck,
  Building2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  X,
  Smartphone,
  Eye,
  Sliders,
  Check,
  Hash,
  AlertTriangle,
  Scale,
  Maximize2,
  CheckCircle,
  FileText,
  User,
  Zap,
} from "lucide-react";

interface WmsPickingViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

type PickingSubTab =
  | "pedidos"
  | "ondas"
  | "tarefas"
  | "coletor"
  | "embalagens"
  | "produtividade";

export function WmsPickingView({ currentUser, onNavigateToLabels }: WmsPickingViewProps) {
  const [activeTab, setActiveTab] = useState<PickingSubTab>("pedidos");
  const [refreshKey, setRefreshKey] = useState(0);

  // Dados do Módulo 05
  const [pedidos, setPedidos] = useState<PedidoSeparacao[]>([]);
  const [ondas, setOndas] = useState<OndaSeparacao[]>([]);
  const [embalagens, setEmbalagens] = useState<EmbalagemPicking[]>([]);
  const [tarefas, setTarefas] = useState<TarefaPicking[]>([]);
  const [produtividade, setProdutividade] = useState<RegistroProdutividadePicking[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresPickingCD | null>(null);

  // Filtros de Pedidos
  const [buscaPedido, setBuscaPedido] = useState("");
  const [filtroStatusPedido, setFiltroStatusPedido] = useState<string>("todos");
  const [filtroPrioridadePedido, setFiltroPrioridadePedido] = useState<string>("todos");
  const [filtroRegiao, setFiltroRegiao] = useState<string>("todas");
  const [pedidosSelecionadosIds, setPedidosSelecionadosIds] = useState<string[]>([]);

  // Modal Detalhes do Pedido
  const [pedidoModalDetalhe, setPedidoModalDetalhe] = useState<PedidoSeparacao | null>(null);

  // Modal Formação de Onda
  const [isModalOndaOpen, setIsModalOndaOpen] = useState(false);
  const [formOndaNome, setFormOndaNome] = useState("");
  const [formOndaModo, setFormOndaModo] = useState<ModoParametrizacaoOnda>("fixo");
  const [formOndaEstrategia, setFormOndaEstrategia] = useState<EstrategiaPicking>("onda");
  const [formOndaCorte, setFormOndaCorte] = useState("14:00");
  const [formOndaPrioridade, setFormOndaPrioridade] = useState<PrioridadePedido>("urgente");

  // Modal Alocação de Tarefa
  const [modalAlocarTarefa, setModalAlocarTarefa] = useState<TarefaPicking | null>(null);
  const [alocarOperadorNome, setAlocarOperadorNome] = useState("Lucas Ferreira (Operador)");

  // Modal Cadastro de Embalagem
  const [isModalEmbalagemOpen, setIsModalEmbalagemOpen] = useState(false);
  const [formEmbCodigo, setFormEmbCodigo] = useState("");
  const [formEmbNome, setFormEmbNome] = useState("");
  const [formEmbComp, setFormEmbComp] = useState<number>(40);
  const [formEmbLarg, setFormEmbLarg] = useState<number>(30);
  const [formEmbAlt, setFormEmbAlt] = useState<number>(25);
  const [formEmbPeso, setFormEmbPeso] = useState<number>(18);
  const [formEmbFator, setFormEmbFator] = useState<number>(85);

  // Coletor RF - Estado Interativo
  const [tarefaSelecionadaColetorId, setTarefaSelecionadaColetorId] = useState<string>("");
  const [itemIndexColetor, setItemIndexColetor] = useState(0);
  const [inputEnderecoBipado, setInputEnderecoBipado] = useState("");
  const [inputProdutoBipado, setInputProdutoBipado] = useState("");
  const [inputQtdBipada, setInputQtdBipada] = useState<number | "">("");
  const [inputLoteBipado, setInputLoteBipado] = useState("");
  const [inputValidadeBipada, setInputValidadeBipada] = useState("");
  const [erroBloqueioColetor, setErroBloqueioColetor] = useState<string | null>(null);
  const [sucessoColetor, setSucessoColetor] = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Carrega dados iniciais
  useEffect(() => {
    Promise.all([
      fetchPedidosSeparacao(),
      fetchOndasSeparacao(),
      fetchEmbalagensPicking(),
      fetchTarefasPicking(),
      fetchProdutividadePicking(),
    ]).then(([peds, onds, embs, tars, prod]) => {
      setPedidos(peds);
      setOndas(onds);
      setEmbalagens(embs);
      setTarefas(tars);
      setProdutividade(prod.registros);
      setIndicadores(prod.indicadores);
      if (tars.length > 0 && tars[0] && !tarefaSelecionadaColetorId) {
        setTarefaSelecionadaColetorId(tars[0].id);
      }
    });
  }, [refreshKey]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Pedidos Filtrados
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      if (buscaPedido) {
        const termo = buscaPedido.toLowerCase();
        const matchNumero = p.numero_pedido.toLowerCase().includes(termo);
        const matchLoja = p.loja_destino.toLowerCase().includes(termo);
        const matchCod = p.cod_loja.toLowerCase().includes(termo);
        if (!matchNumero && !matchLoja && !matchCod) return false;
      }
      if (filtroStatusPedido !== "todos" && p.status !== filtroStatusPedido) return false;
      if (filtroPrioridadePedido !== "todos" && p.prioridade !== filtroPrioridadePedido) return false;
      if (filtroRegiao !== "todas" && p.regiao !== filtroRegiao) return false;
      return true;
    });
  }, [pedidos, buscaPedido, filtroStatusPedido, filtroPrioridadePedido, filtroRegiao]);

  // Tarefa atual do coletor
  const tarefaAtualColetor = useMemo(() => {
    return tarefas.find((t) => t.id === tarefaSelecionadaColetorId) || tarefas[0];
  }, [tarefas, tarefaSelecionadaColetorId]);

  const itemAtualColetor = useMemo(() => {
    if (!tarefaAtualColetor || !tarefaAtualColetor.itens.length) return null;
    return tarefaAtualColetor.itens[itemIndexColetor] || tarefaAtualColetor.itens[0];
  }, [tarefaAtualColetor, itemIndexColetor]);

  // Handlers
  const handleImportarErp = async () => {
    const res = await importarPedidosErpService();
    if (res.success) {
      setToastMsg({
        text: `Integração ERP concluída! ${res.importados} novos pedidos importados para o CD.`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: "Falha na comunicação com o barramento do ERP.", type: "error" });
    }
  };

  const handleToggleSelecionarPedido = (id: string) => {
    setPedidosSelecionadosIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelecionarTodosPedidos = () => {
    if (pedidosSelecionadosIds.length === pedidosFiltrados.length) {
      setPedidosSelecionadosIds([]);
    } else {
      setPedidosSelecionadosIds(pedidosFiltrados.map((p) => p.id));
    }
  };

  const handleAbrirCriacaoOnda = () => {
    if (pedidosSelecionadosIds.length === 0) {
      setToastMsg({ text: "Selecione ao menos um pedido na lista para formar a onda.", type: "error" });
      return;
    }
    setFormOndaNome(`Onda de Separação #${Math.floor(100 + Math.random() * 900)}`);
    setIsModalOndaOpen(true);
  };

  const handleConfirmarCriacaoOnda = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await criarOndaService({
      nome: formOndaNome,
      modo: formOndaModo,
      estrategia: formOndaEstrategia,
      pedidos_ids: pedidosSelecionadosIds,
      horario_corte: formOndaCorte,
      prioridade: formOndaPrioridade,
      criado_por: currentUser?.name || "Supervisor de Separação",
    });

    if (res.success && res.onda) {
      setToastMsg({
        text: `Onda ${res.onda.numero_onda} liberada com sucesso! ${res.tarefasGeradas} tarefas de picking geradas.`,
        type: "success",
      });
      setIsModalOndaOpen(false);
      setPedidosSelecionadosIds([]);
      setActiveTab("tarefas");
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Não foi possível gerar a onda.", type: "error" });
    }
  };

  const handleConfirmarAlocacao = async () => {
    if (!modalAlocarTarefa) return;
    const res = await alocarTarefaOperadorService(
      modalAlocarTarefa.id,
      "usr-operador-selecionado",
      alocarOperadorNome
    );
    if (res.success) {
      setToastMsg({
        text: `Tarefa ${modalAlocarTarefa.numero_tarefa} alocada para ${alocarOperadorNome}!`,
        type: "success",
      });
      setModalAlocarTarefa(null);
      setRefreshKey((k) => k + 1);
    }
  };

  // Coletor: Bipar Endereço / Produto
  const handleExecutarBipagemColetor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroBloqueioColetor(null);
    setSucessoColetor(null);

    if (!tarefaAtualColetor || !itemAtualColetor) return;

    if (!inputEnderecoBipado.trim()) {
      setErroBloqueioColetor("Bipe ou informe o endereço de origem.");
      return;
    }
    if (!inputProdutoBipado.trim()) {
      setErroBloqueioColetor("Bipe o código de barras ou código do produto.");
      return;
    }
    const qtdNum = Number(inputQtdBipada);
    if (!qtdNum || qtdNum <= 0) {
      setErroBloqueioColetor("Informe uma quantidade válida separada.");
      return;
    }

    const res = await executarBipagemSeparacaoService({
      tarefa_id: tarefaAtualColetor.id,
      item_id: itemAtualColetor.id,
      endereco_bipado: inputEnderecoBipado.trim(),
      produto_bipado: inputProdutoBipado.trim(),
      quantidade_informada: qtdNum,
      lote_bipado: inputLoteBipado.trim() || undefined,
      validade_bipada: inputValidadeBipada.trim() || undefined,
    });

    if (res.bloqueado) {
      setErroBloqueioColetor(res.motivo_bloqueio || "Operação bloqueada pelo sistema WMS.");
    } else {
      setSucessoColetor(`Item '${itemAtualColetor.descricao}' separado com sucesso (${qtdNum} ${itemAtualColetor.unidade_medida})!`);
      setInputEnderecoBipado("");
      setInputProdutoBipado("");
      setInputQtdBipada("");
      setInputLoteBipado("");
      setInputValidadeBipada("");
      setRefreshKey((k) => k + 1);

      // Avança para o próximo item pendente se houver
      if (itemIndexColetor + 1 < tarefaAtualColetor.itens.length) {
        setItemIndexColetor((idx) => idx + 1);
      }
    }
  };

  const handleFinalizarTarefaColetor = async () => {
    if (!tarefaAtualColetor) return;
    const res = await finalizarTarefaPickingService(
      tarefaAtualColetor.id,
      tarefaAtualColetor.volumes_embalagens_utilizados,
      tarefaAtualColetor.embalagem_utilizada_id,
      "Separação concluída sem divergências via Coletor RF"
    );
    if (res.success) {
      setToastMsg({
        text: `Tarefa ${tarefaAtualColetor.numero_tarefa} finalizada e enviada para conferência/expedição! Produtividade registrada.`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSalvarNovaEmbalagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmbCodigo || !formEmbNome) return;
    const volM3 = parseFloat(((formEmbComp * formEmbLarg * formEmbAlt) / 1000000).toFixed(4));
    const ok = await salvarEmbalagemService({
      codigo: formEmbCodigo.toUpperCase(),
      nome: formEmbNome,
      comprimento_cm: formEmbComp,
      largura_cm: formEmbLarg,
      altura_cm: formEmbAlt,
      volume_m3: volM3,
      capacidade_peso_kg: formEmbPeso,
      fator_utilizacao_pct: formEmbFator,
      ativa: true,
    });
    if (ok) {
      setToastMsg({ text: `Embalagem ${formEmbCodigo} cadastrada com sucesso!`, type: "success" });
      setIsModalEmbalagemOpen(false);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Header Contextual do Módulo 05 */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
              WMS • Módulo 05
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Building2 size={13} />
              <span>CD-01 — Barueri Matriz</span>
            </span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Picking / Separação de Pedidos
          </h2>
          <p className="text-xs text-[var(--muted)] max-w-2xl">
            Separação para lojas com velocidade, precisão e rastreabilidade: integração automática de pedidos do ERP, 6 estratégias de picking, parametrização fixa/flexível de ondas, cubagem volumétrica e coletor RF com travas de bloqueio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleImportarErp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-semibold text-[var(--foreground)] transition-all cursor-pointer"
          >
            <RotateCcw size={14} className="text-[var(--collab-mostarda)]" />
            <span>Sincronizar ERP</span>
          </button>

          <button
            type="button"
            onClick={handleAbrirCriacaoOnda}
            disabled={pedidosSelecionadosIds.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Formar Onda ({pedidosSelecionadosIds.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Separação (Item 5.6) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Pedidos Hoje</span>
            <FileText size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="font-heading text-xl font-bold text-[var(--foreground)]">
            {pedidos.length}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">
            {pedidos.filter((p) => p.status === "pendente").length} aguardando onda
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Ondas Ativas</span>
            <Layers size={14} className="text-sky-400" />
          </div>
          <div className="font-heading text-xl font-bold text-sky-400">
            {ondas.filter((o) => o.status === "em_separacao" || o.status === "liberada").length}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Liberadas no armazém</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Tarefas de Picking</span>
            <Boxes size={14} className="text-amber-400" />
          </div>
          <div className="font-heading text-xl font-bold text-amber-400">
            {tarefas.filter((t) => t.status !== "concluida").length}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Fila de separação</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Produtividade</span>
            <Zap size={14} className="text-emerald-400" />
          </div>
          <div className="font-heading text-xl font-bold text-emerald-400">
            {indicadores?.produtividade_media_itens_hora || 145}{" "}
            <span className="text-xs font-normal text-[var(--muted)]">it/h</span>
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Média CD Barueri</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Tempo Médio</span>
            <Clock size={14} className="text-purple-400" />
          </div>
          <div className="font-heading text-xl font-bold text-purple-400">
            {indicadores?.tempo_medio_separacao_minutos || 38} min
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Por pedido de loja</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Divergências</span>
            <ShieldAlert size={14} className="text-rose-400" />
          </div>
          <div className="font-heading text-xl font-bold text-rose-400">
            {indicadores?.divergencias_hoje || 0}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Itens com trava ativa</span>
        </div>
      </div>

      {/* Navegação por Sub-Abas do Módulo 05 */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("pedidos")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "pedidos"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileText size={14} />
          <span>1. Pedidos das Lojas & ERP ({pedidos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ondas")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ondas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Layers size={14} />
          <span>2. Formação & Parametrização de Ondas ({ondas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tarefas")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "tarefas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <UserCheck size={14} />
          <span>3. Alocação & Fila de Tarefas ({tarefas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("coletor")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "coletor"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Smartphone size={14} />
          <span>4. Coletor RF de Separação (Travas & Bipagem)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("embalagens")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "embalagens"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Package size={14} />
          <span>5. Cadastro de Embalagens & Cubagem</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("produtividade")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "produtividade"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <TrendingUp size={14} />
          <span>6. Controle de Produtividade & Metas</span>
        </button>
      </div>

      {/* ── ABA 1: PEDIDOS DAS LOJAS & INTEGRAÇÃO ERP (ITEM 5.2) ───────────── */}
      {activeTab === "pedidos" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 bg-[var(--card)] border border-[var(--card-border)] rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={buscaPedido}
                  onChange={(e) => setBuscaPedido(e.target.value)}
                  placeholder="Buscar por número do pedido, loja ou código..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>

              <select
                value={filtroStatusPedido}
                onChange={(e) => setFiltroStatusPedido(e.target.value)}
                className="px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente de Onda</option>
                <option value="em_onda">Em Onda Liberada</option>
                <option value="em_separacao">Em Separação</option>
                <option value="separado">Separado</option>
              </select>

              <select
                value={filtroPrioridadePedido}
                onChange={(e) => setFiltroPrioridadePedido(e.target.value)}
                className="px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              >
                <option value="todos">Todas as Prioridades</option>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="normal">Normal</option>
              </select>

              <select
                value={filtroRegiao}
                onChange={(e) => setFiltroRegiao(e.target.value)}
                className="px-2.5 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              >
                <option value="todas">Todas as Regiões</option>
                <option value="Capital">Capital</option>
                <option value="Grande SP">Grande SP</option>
                <option value="Interior">Interior</option>
                <option value="Litoral">Litoral</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--muted)] shrink-0">
              <button
                type="button"
                onClick={handleSelecionarTodosPedidos}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--secondary)] hover:bg-[var(--card-border)] text-[var(--foreground)] font-medium cursor-pointer"
              >
                {pedidosSelecionadosIds.length === pedidosFiltrados.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </button>

              <span className="font-mono text-[var(--foreground)]">
                {pedidosSelecionadosIds.length} selecionado(s)
              </span>
            </div>
          </div>

          {/* Tabela de Pedidos */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] border-b border-[var(--card-border)] text-[var(--muted)] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={pedidosFiltrados.length > 0 && pedidosSelecionadosIds.length === pedidosFiltrados.length}
                        onChange={handleSelecionarTodosPedidos}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Pedido / Emissão</th>
                    <th className="p-3">Loja de Destino</th>
                    <th className="p-3">Rota & Região</th>
                    <th className="p-3">Prioridade & Corte</th>
                    <th className="p-3 text-center">Qtd Itens</th>
                    <th className="p-3 text-center">Volumes Est.</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {pedidosFiltrados.map((ped) => {
                    const isSelected = pedidosSelecionadosIds.includes(ped.id);
                    return (
                      <tr
                        key={ped.id}
                        className={`transition-colors ${
                          isSelected ? "bg-[var(--collab-mostarda)]/10" : "hover:bg-[var(--secondary)]/50"
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelecionarPedido(ped.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-[var(--foreground)]">{ped.numero_pedido}</div>
                          <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                            <Calendar size={10} />
                            <span>{ped.data_emissao}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[var(--foreground)]">{ped.loja_destino}</div>
                          <div className="text-[10px] font-mono text-[var(--collab-mostarda)]">{ped.cod_loja}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-[var(--foreground)] font-medium">{ped.rota_entrega}</div>
                          <div className="text-[10px] text-[var(--muted)]">{ped.regiao} • {ped.transportadora}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ped.prioridade === "urgente"
                                ? "bg-red-500/20 text-red-400"
                                : ped.prioridade === "alta"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {ped.prioridade.toUpperCase()}
                          </span>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            <span>Corte: {ped.horario_expedicao_corte}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[var(--foreground)]">
                          {ped.total_itens || ped.itens.reduce((acc, i) => acc + i.quantidade_solicitada, 0)} un
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-[var(--background)] font-mono text-xs border border-[var(--card-border)] font-bold text-[var(--collab-mostarda)]">
                            {ped.total_volumes_estimados} vol
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              ped.status === "separado"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : ped.status === "em_separacao"
                                ? "bg-amber-500/20 text-amber-400 animate-pulse"
                                : ped.status === "em_onda"
                                ? "bg-sky-500/20 text-sky-400"
                                : "bg-neutral-500/20 text-neutral-400"
                            }`}
                          >
                            {ped.status === "pendente"
                              ? "Aguardando Onda"
                              : ped.status === "em_onda"
                              ? "Onda Liberada"
                              : ped.status === "em_separacao"
                              ? "Em Separação"
                              : "Separado"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setPedidoModalDetalhe(ped)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-xs"
                          >
                            <Eye size={12} />
                            <span>Itens ({ped.itens.length})</span>
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
      )}

      {/* ── ABA 2: FORMAÇÃO E PARAMETRIZAÇÃO DE ONDAS (ITENS 5.3 & 5.4) ────── */}
      {activeTab === "ondas" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card das 6 Estratégias de Picking (Item 5.3) */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                  <Sliders size={17} className="text-[var(--collab-mostarda)]" />
                  <span>5.3. Estratégias de Separação Disponíveis</span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Selecione o modelo operacional mais eficiente para cada janela de expedição
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: "pedido",
                  nome: "Picking por Pedido",
                  desc: "Operador atende 1 pedido específico por vez, direto para a caixa/gaiola da loja.",
                  badge: "Individual",
                },
                {
                  id: "onda",
                  nome: "Picking por Onda",
                  desc: "Agrupa pedidos por rota, horário de corte e prioridade para despacho sincronizado.",
                  badge: "Padrão CD",
                },
                {
                  id: "zona",
                  nome: "Picking por Zona",
                  desc: "Divide a separação por áreas físicas do armazém (Porta-Paletes, Mezanino, etc.).",
                  badge: "Área Física",
                },
                {
                  id: "setor_flow_rack",
                  nome: "Picking por Setor do Flow Rack",
                  desc: "Separação ultra-rápida concentrada nos trilhos dinâmicos de alta rotatividade.",
                  badge: "Alto Giro",
                },
                {
                  id: "produto",
                  nome: "Picking por Produto (Batch)",
                  desc: "Consolida a demanda total de cada SKU para separação em lote e posterior sort/divisão.",
                  badge: "Em Lote",
                },
                {
                  id: "multi_lojas",
                  nome: "Picking Agrupado Multi-lojas",
                  desc: "Carrinho de separação multi-caixas atendendo várias lojas simultaneamente no mesmo percurso.",
                  badge: "Cluster",
                },
              ].map((est) => (
                <div
                  key={est.id}
                  className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] flex flex-col justify-between gap-2 hover:border-[var(--collab-mostarda)]/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-xs text-[var(--foreground)]">
                        {est.nome}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--card)] text-[var(--collab-mostarda)] font-semibold border border-[var(--card-border)]">
                        {est.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                      {est.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ondas Formadas no CD */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                  <Layers size={17} className="text-[var(--collab-mostarda)]" />
                  <span>5.4. Ondas de Separação em Andamento</span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Agrupamentos liberados considerando rota, transportadora, prioridade e horário de corte
                </p>
              </div>

              <button
                type="button"
                onClick={handleAbrirCriacaoOnda}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Nova Onda</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ondas.map((onda) => (
                <div
                  key={onda.id}
                  className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[var(--collab-mostarda)] block">
                        {onda.numero_onda}
                      </span>
                      <h4 className="font-heading font-bold text-sm text-[var(--foreground)]">
                        {onda.nome}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        onda.status === "concluida"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400 animate-pulse"
                      }`}
                    >
                      {onda.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[var(--muted)]">
                    <div className="p-2 bg-[var(--card)] rounded border border-[var(--card-border)]">
                      <span className="text-[10px] block opacity-75">Pedidos</span>
                      <strong className="text-[var(--foreground)] text-sm">{onda.quantidade_pedidos}</strong>
                    </div>
                    <div className="p-2 bg-[var(--card)] rounded border border-[var(--card-border)]">
                      <span className="text-[10px] block opacity-75">Total Itens</span>
                      <strong className="text-[var(--foreground)] text-sm">{onda.total_itens} un</strong>
                    </div>
                    <div className="p-2 bg-[var(--card)] rounded border border-[var(--card-border)]">
                      <span className="text-[10px] block opacity-75">Horário Corte</span>
                      <strong className="text-[var(--collab-mostarda)] text-sm">{onda.horario_corte}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-2 border-t border-[var(--card-border)]/60">
                    <span>Estratégia: <strong className="text-[var(--foreground)]">{onda.estrategia}</strong></span>
                    <span>Modo: <strong className="text-[var(--collab-mostarda)]">{onda.modo.toUpperCase()}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 3: ALOCAÇÃO & FILA DE TAREFAS (ITEM 5.5) ───────────────────── */}
      {activeTab === "tarefas" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between p-3.5 bg-[var(--card)] border border-[var(--card-border)] rounded-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                Fila de Tarefas de Separação para Coletores
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Aloque tarefas geradas para os operadores de armazém executarem no coletor RF
              </p>
            </div>

            <span className="text-xs font-mono text-[var(--muted)]">
              {tarefas.filter((t) => t.status === "pendente").length} pendente(s) de alocação
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tarefas.map((tar) => (
              <div
                key={tar.id}
                className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3 shadow-sm hover:border-[var(--collab-mostarda)]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--collab-mostarda)]">
                      {tar.numero_tarefa}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tar.status === "concluida"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : tar.status === "em_separacao"
                          ? "bg-amber-500/20 text-amber-400"
                          : tar.status === "alocada"
                          ? "bg-sky-500/20 text-sky-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }`}
                    >
                      {tar.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-sm text-[var(--foreground)]">
                      {tar.loja_destino}
                    </h4>
                    <span className="text-[11px] text-[var(--muted)] font-mono">
                      Pedido: {tar.numero_pedido}
                    </span>
                  </div>

                  {/* Informações de Embalagem & Cubagem (Item 5.5) */}
                  <div className="p-2.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Embalagem Sugerida:</span>
                      <strong className="text-[var(--collab-mostarda)] font-mono">
                        {tar.volumes_embalagens_utilizados}x {tar.embalagem_utilizada_nome?.split("(")[0]}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span>Cubagem Total:</span>
                      <span className="font-mono">{tar.cubagem_total_m3} m³</span>
                    </div>
                  </div>

                  <div className="text-xs text-[var(--muted)] flex items-center justify-between">
                    <span>Itens: <strong className="text-[var(--foreground)] font-mono">{tar.total_itens_separados}/{tar.total_itens_solicitados}</strong></span>
                    <span>Operador: <strong className="text-[var(--foreground)]">{tar.operador_nome?.split(" ")[0] || "Não Alocado"}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAlocarTarefa(tar)}
                    className="flex-1 py-1.5 px-2 rounded bg-[var(--secondary)] hover:bg-[var(--card-border)] text-[var(--foreground)] text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Alocar Operador
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTarefaSelecionadaColetorId(tar.id);
                      setActiveTab("coletor");
                    }}
                    className="py-1.5 px-3 rounded bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Smartphone size={13} />
                    <span>Coletor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA 4: COLETOR RF DE SEPARAÇÃO (TRAVAS & BIPAGEM - ITEM 5.5) ────── */}
      {activeTab === "coletor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Seletor de Tarefa Ativa no Coletor */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                  <Smartphone size={16} className="text-[var(--collab-mostarda)]" />
                  <span>Tarefa no Coletor</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  RF Conectado
                </span>
              </div>

              <select
                value={tarefaSelecionadaColetorId}
                onChange={(e) => {
                  setTarefaSelecionadaColetorId(e.target.value);
                  setItemIndexColetor(0);
                  setErroBloqueioColetor(null);
                  setSucessoColetor(null);
                }}
                className="w-full p-2.5 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-semibold"
              >
                {tarefas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.numero_tarefa} — {t.loja_destino} ({t.status})
                  </option>
                ))}
              </select>

              {tarefaAtualColetor && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Loja Destino:</span>
                      <strong className="text-[var(--foreground)]">{tarefaAtualColetor.loja_destino}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Embalagens Previstas:</span>
                      <strong className="text-[var(--collab-mostarda)] font-mono">
                        {tarefaAtualColetor.volumes_embalagens_utilizados}x {tarefaAtualColetor.embalagem_utilizada_nome?.split("(")[0]}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Destino Físico:</span>
                      <span className="font-mono text-[var(--foreground)] font-bold">
                        {tarefaAtualColetor.itens[0]?.endereco_destino}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Itens da Tarefa */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                      Itens a Separar ({tarefaAtualColetor.itens.length})
                    </span>

                    {tarefaAtualColetor.itens.map((it, idx) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setItemIndexColetor(idx);
                          setErroBloqueioColetor(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between cursor-pointer ${
                          itemIndexColetor === idx
                            ? "bg-[var(--collab-mostarda)]/15 border-[var(--collab-mostarda)] font-bold"
                            : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)]"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate text-[var(--foreground)]">{it.descricao}</div>
                          <div className="text-[10px] font-mono text-[var(--collab-mostarda)]">
                            {it.endereco_origem}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              it.status === "separado_ok"
                                ? "bg-emerald-500/20 text-emerald-400 font-bold"
                                : "bg-neutral-500/20 text-[var(--muted)]"
                            }`}
                          >
                            {it.quantidade_separada}/{it.quantidade_solicitada}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {tarefaAtualColetor.status !== "concluida" && (
                    <button
                      type="button"
                      onClick={handleFinalizarTarefaColetor}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm mt-2"
                    >
                      Finalizar Separação da Tarefa
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visor do Coletor RF Simulador */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 sm:p-6 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)] text-black flex items-center justify-center font-black">
                    RF
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                      Terminal de Coleta RF — Separação Guiada
                    </h3>
                    <span className="text-[10px] text-[var(--muted)]">
                      Siga a sequência de endereçamento do armazém (Rua, Prédio, Nível e Apartamento)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[var(--muted)] block">Operador Atual</span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {tarefaAtualColetor?.operador_nome || currentUser?.name || "Lucas Ferreira"}
                  </span>
                </div>
              </div>

              {/* Alertas de Travas e Bloqueios (Item 5.5) */}
              {erroBloqueioColetor && (
                <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500 text-red-400 text-xs flex items-start gap-3 animate-shake">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <strong className="font-bold text-sm block">BLOQUEIO OPERACIONAL DO WMS</strong>
                    <p className="mt-0.5 leading-relaxed">{erroBloqueioColetor}</p>
                  </div>
                </div>
              )}

              {sucessoColetor && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle size={16} />
                  <span>{sucessoColetor}</span>
                </div>
              )}

              {/* Informações do Item Atual a Separar */}
              {itemAtualColetor && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] font-mono uppercase">
                          Endereço de Origem (A Bipar)
                        </span>
                        <div className="font-heading font-black text-xl sm:text-2xl text-[var(--collab-mostarda)] tracking-wider">
                          {itemAtualColetor.endereco_origem}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] text-[var(--muted)] font-mono uppercase">
                          Quantidade Requerida
                        </span>
                        <div className="font-heading font-black text-xl sm:text-2xl text-[var(--foreground)]">
                          {itemAtualColetor.quantidade_solicitada} {itemAtualColetor.unidade_medida}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] block">Produto:</span>
                        <strong className="text-[var(--foreground)] text-sm block">
                          {itemAtualColetor.descricao}
                        </strong>
                        <span className="font-mono text-[11px] text-[var(--muted)]">
                          Cód: {itemAtualColetor.cod_produto} • EAN: {itemAtualColetor.ean}
                        </span>
                      </div>

                      <div className="space-y-1 sm:text-right">
                        <div>
                          <span className="text-[10px] text-[var(--muted)]">Lote Recomendado:</span>{" "}
                          <strong className="font-mono text-[var(--foreground)]">{itemAtualColetor.lote_recomendado}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--muted)]">Validade Mínima:</span>{" "}
                          <span className="font-mono text-[var(--collab-mostarda)]">{itemAtualColetor.data_validade}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--muted)]">Destino Separação:</span>{" "}
                          <strong className="text-[var(--foreground)]">{itemAtualColetor.endereco_destino}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formulário de Bipagem do Coletor */}
                  <form onSubmit={handleExecutarBipagemColetor} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          1. Bipar Endereço de Origem *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={inputEnderecoBipado}
                            onChange={(e) => setInputEnderecoBipado(e.target.value)}
                            placeholder={`Ex: ${itemAtualColetor.endereco_origem}`}
                            className="w-full px-3 py-2 text-xs font-mono font-bold bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                          />
                          <button
                            type="button"
                            onClick={() => setInputEnderecoBipado(itemAtualColetor.endereco_origem)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--collab-mostarda)] hover:underline"
                          >
                            Simular Bip
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          2. Bipar Código de Barras / EAN do Produto *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={inputProdutoBipado}
                            onChange={(e) => setInputProdutoBipado(e.target.value)}
                            placeholder={`Ex: ${itemAtualColetor.ean}`}
                            className="w-full px-3 py-2 text-xs font-mono font-bold bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                          />
                          <button
                            type="button"
                            onClick={() => setInputProdutoBipado(itemAtualColetor.ean)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--collab-mostarda)] hover:underline"
                          >
                            Simular Bip
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          3. Quantidade Separada *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={itemAtualColetor.quantidade_solicitada + 10}
                            value={inputQtdBipada}
                            onChange={(e) =>
                              setInputQtdBipada(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                            }
                            placeholder={itemAtualColetor.quantidade_solicitada.toString()}
                            className="w-full px-3 py-2 text-xs font-mono font-bold bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                          />
                          <button
                            type="button"
                            onClick={() => setInputQtdBipada(itemAtualColetor.quantidade_solicitada)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--collab-mostarda)] hover:underline"
                          >
                            Total ({itemAtualColetor.quantidade_solicitada})
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          Lote (Opcional p/ validação)
                        </label>
                        <input
                          type="text"
                          value={inputLoteBipado}
                          onChange={(e) => setInputLoteBipado(e.target.value)}
                          placeholder="Ex: LT-202611-A"
                          className="w-full px-3 py-2 text-xs font-mono bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                          Validade (Data)
                        </label>
                        <input
                          type="date"
                          value={inputValidadeBipada}
                          onChange={(e) => setInputValidadeBipada(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        <span>Confirmar Bipagem do Item</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 5: CADASTRO DE EMBALAGENS & CUBAGEM (ITEM 5.5) ──────────────── */}
      {activeTab === "embalagens" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between p-4 bg-[var(--card)] border border-[var(--card-border)] rounded-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <Package size={16} className="text-[var(--collab-mostarda)]" />
                <span>Cadastro e Parâmetros de Embalagens do CD (Cálculo Volumétrico)</span>
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Tamanhos de caixas e embalagens utilizados pelo coletor para sugerir a quantidade necessária por pedido
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalEmbalagemOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Nova Embalagem</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {embalagens.map((emb) => (
              <div
                key={emb.id}
                className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3 shadow-sm hover:border-[var(--collab-mostarda)]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--collab-mostarda)] px-2 py-0.5 rounded bg-[var(--collab-mostarda)]/10 border border-[var(--collab-mostarda)]/20">
                      {emb.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        emb.ativa ? "text-emerald-400" : "text-[var(--muted)]"
                      }`}
                    >
                      {emb.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-sm text-[var(--foreground)]">
                      {emb.nome}
                    </h4>
                    <span className="text-xs font-mono text-[var(--muted)] block mt-0.5">
                      {emb.comprimento_cm} × {emb.largura_cm} × {emb.altura_cm} cm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
                    <div className="p-2 rounded bg-[var(--background)] border border-[var(--card-border)]">
                      <span className="text-[10px] text-[var(--muted)] block">Volume (m³)</span>
                      <strong className="text-[var(--foreground)]">{emb.volume_m3} m³</strong>
                    </div>
                    <div className="p-2 rounded bg-[var(--background)] border border-[var(--card-border)]">
                      <span className="text-[10px] text-[var(--muted)] block">Capacidade</span>
                      <strong className="text-[var(--foreground)]">{emb.capacidade_peso_kg} kg</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] text-[10px] text-[var(--muted)] flex items-center justify-between">
                  <span>Fator útil: {emb.fator_utilizacao_pct}%</span>
                  <span>Cubagem Automática</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA 6: CONTROLE DE PRODUTIVIDADE & METAS (ITEM 5.6) ─────────────── */}
      {activeTab === "produtividade" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-[var(--card)] border border-[var(--card-border)] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--collab-mostarda)]" />
                <span>5.6. Registro e Histórico de Produtividade dos Operadores</span>
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Acompanhamento em tempo real: itens/hora, linhas/hora, tempos de início/fim e assertividade
              </p>
            </div>

            <span className="font-mono text-xs text-[var(--collab-mostarda)] font-semibold">
              Meta CD: 150 itens/hora
            </span>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] border-b border-[var(--card-border)] text-[var(--muted)] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Operador</th>
                    <th className="p-3">Tarefa / Pedido</th>
                    <th className="p-3">Loja de Destino</th>
                    <th className="p-3">Horário (Início - Fim)</th>
                    <th className="p-3 text-center">Duração</th>
                    <th className="p-3 text-center">Itens Separados</th>
                    <th className="p-3 text-center">Linhas</th>
                    <th className="p-3 text-center font-bold text-[var(--collab-mostarda)]">Itens / Hora</th>
                    <th className="p-3 text-center">Divergências</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)] font-mono">
                  {produtividade.map((reg) => (
                    <tr key={reg.id} className="hover:bg-[var(--secondary)]/40 transition-colors">
                      <td className="p-3 font-sans">
                        <strong className="text-[var(--foreground)] block">{reg.operador_nome}</strong>
                        <span className="text-[10px] text-[var(--muted)] font-mono">{reg.operador_id}</span>
                      </td>
                      <td className="p-3 font-bold text-[var(--foreground)]">
                        <div>{reg.numero_tarefa}</div>
                        <div className="text-[10px] text-[var(--muted)]">{reg.numero_pedido}</div>
                      </td>
                      <td className="p-3 font-sans text-[var(--foreground)] font-medium">
                        {reg.loja_destino}
                      </td>
                      <td className="p-3 text-[var(--muted)]">
                        {reg.hora_inicio} → {reg.hora_fim}
                      </td>
                      <td className="p-3 text-center font-bold text-[var(--foreground)]">
                        {reg.duracao_minutos} min
                      </td>
                      <td className="p-3 text-center text-emerald-400 font-bold">
                        {reg.quantidade_itens} un
                      </td>
                      <td className="p-3 text-center text-[var(--foreground)]">
                        {reg.quantidade_linhas}
                      </td>
                      <td className="p-3 text-center font-bold text-sm text-[var(--collab-mostarda)]">
                        {reg.itens_por_hora}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            reg.divergencias === 0
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {reg.divergencias}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALHES DO PEDIDO ───────────────────────────────────────── */}
      {pedidoModalDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[var(--collab-mostarda)] block">
                  {pedidoModalDetalhe.numero_pedido}
                </span>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  {pedidoModalDetalhe.loja_destino} ({pedidoModalDetalhe.cod_loja})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPedidoModalDetalhe(null)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-[var(--background)] rounded border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--muted)] block">Região</span>
                <strong className="text-[var(--foreground)]">{pedidoModalDetalhe.regiao}</strong>
              </div>
              <div className="p-2 bg-[var(--background)] rounded border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--muted)] block">Rota</span>
                <strong className="text-[var(--foreground)]">{pedidoModalDetalhe.rota_entrega}</strong>
              </div>
              <div className="p-2 bg-[var(--background)] rounded border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--muted)] block">Horário Corte</span>
                <strong className="text-[var(--collab-mostarda)]">{pedidoModalDetalhe.horario_expedicao_corte}</strong>
              </div>
              <div className="p-2 bg-[var(--background)] rounded border border-[var(--card-border)]">
                <span className="text-[10px] text-[var(--muted)] block">Volumes Est.</span>
                <strong className="text-[var(--foreground)]">{pedidoModalDetalhe.total_volumes_estimados} vol</strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                Produtos do Pedido ({pedidoModalDetalhe.itens.length})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-[var(--card-border)]">
                {pedidoModalDetalhe.itens.map((it) => (
                  <div key={it.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{it.descricao}</div>
                      <div className="text-[10px] font-mono text-[var(--muted)]">
                        Cód: {it.cod_produto} • EAN: {it.ean}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <strong className="text-[var(--collab-mostarda)] text-sm">
                        {it.quantidade_solicitada} {it.unidade_medida}
                      </strong>
                      {it.restricao_validade_dias && (
                        <span className="block text-[10px] text-amber-400">
                          Validade mín: {it.restricao_validade_dias} dias
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setPedidoModalDetalhe(null)}
                className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CRIAÇÃO DE ONDA (ITEM 5.4) ───────────────────────────────── */}
      {isModalOndaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleConfirmarCriacaoOnda}
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)] text-black flex items-center justify-center font-bold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Parametrização & Formação de Onda
                  </h3>
                  <span className="text-xs text-[var(--muted)]">
                    {pedidosSelecionadosIds.length} pedido(s) selecionado(s) para agrupamento
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOndaOpen(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">Nome da Onda *</label>
                <input
                  type="text"
                  required
                  value={formOndaNome}
                  onChange={(e) => setFormOndaNome(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Modo de Parametrização</label>
                  <select
                    value={formOndaModo}
                    onChange={(e) => setFormOndaModo(e.target.value as ModoParametrizacaoOnda)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="fixo">Modo Fixo (Regras Automáticas)</option>
                    <option value="flexivel">Modo Flexível (Manual Dinâmico)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Estratégia de Picking</label>
                  <select
                    value={formOndaEstrategia}
                    onChange={(e) => setFormOndaEstrategia(e.target.value as EstrategiaPicking)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="onda">Picking por Onda</option>
                    <option value="pedido">Picking por Pedido</option>
                    <option value="zona">Picking por Zona</option>
                    <option value="setor_flow_rack">Picking por Setor do Flow Rack</option>
                    <option value="produto">Picking por Produto (Batch)</option>
                    <option value="multi_lojas">Picking Agrupado Multi-lojas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Horário de Corte / Expedição</label>
                  <input
                    type="time"
                    value={formOndaCorte}
                    onChange={(e) => setFormOndaCorte(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Prioridade da Onda</label>
                  <select
                    value={formOndaPrioridade}
                    onChange={(e) => setFormOndaPrioridade(e.target.value as PrioridadePedido)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="urgente">Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsModalOndaOpen(false)}
                className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Liberar Onda & Gerar Tarefas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL ALOCAR TAREFA A OPERADOR (ITEM 5.5) ──────────────────────── */}
      {modalAlocarTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                <UserCheck size={16} className="text-[var(--collab-mostarda)]" />
                <span>Alocar Tarefa {modalAlocarTarefa.numero_tarefa}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAlocarTarefa(null)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[var(--muted)]">
                Selecione o operador do armazém que receberá esta tarefa no coletor RF:
              </p>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">Operador Responsável</label>
                <select
                  value={alocarOperadorNome}
                  onChange={(e) => setAlocarOperadorNome(e.target.value)}
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none font-semibold text-xs"
                >
                  <option value="Lucas Ferreira (Operador)">Lucas Ferreira (Operador - Setor Flow Rack)</option>
                  <option value="Marcos Vinicius (Operador)">Marcos Vinicius (Operador - Porta-Paletes)</option>
                  <option value="Renata Souza (Operadora)">Renata Souza (Operadora - Expedição)</option>
                  <option value="Carlos Eduardo (Operador)">Carlos Eduardo (Operador - Geral)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalAlocarTarefa(null)}
                className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAlocacao}
                className="px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Confirmar Alocação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CADASTRO DE EMBALAGEM (ITEM 5.5) ─────────────────────────── */}
      {isModalEmbalagemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSalvarNovaEmbalagem}
            className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                <Package size={16} className="text-[var(--collab-mostarda)]" />
                <span>Nova Embalagem de Separação</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalEmbalagemOpen(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={formEmbCodigo}
                    onChange={(e) => setFormEmbCodigo(e.target.value)}
                    placeholder="Ex: CX-XL"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Nome Descritivo *</label>
                  <input
                    type="text"
                    required
                    value={formEmbNome}
                    onChange={(e) => setFormEmbNome(e.target.value)}
                    placeholder="Ex: Caixa Extra Grande"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-[var(--muted)] mb-1">Comp. (cm)</label>
                  <input
                    type="number"
                    min={10}
                    value={formEmbComp}
                    onChange={(e) => setFormEmbComp(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--muted)] mb-1">Larg. (cm)</label>
                  <input
                    type="number"
                    min={10}
                    value={formEmbLarg}
                    onChange={(e) => setFormEmbLarg(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--muted)] mb-1">Alt. (cm)</label>
                  <input
                    type="number"
                    min={10}
                    value={formEmbAlt}
                    onChange={(e) => setFormEmbAlt(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Capacidade Peso (kg)</label>
                  <input
                    type="number"
                    min={1}
                    value={formEmbPeso}
                    onChange={(e) => setFormEmbPeso(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">Fator Utilização (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={formEmbFator}
                    onChange={(e) => setFormEmbFator(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsModalEmbalagemOpen(false)}
                className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Salvar Embalagem
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
