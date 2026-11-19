"use client";

import { useState, useMemo, useEffect } from "react";
import {
  WmsEndereco,
  WmsMovimentacao,
  SugestaoSlottingInput,
  SugestaoSlottingResultado,
  ProdutoAlocado,
  EnderecoTipo,
  EnderecoStatus,
  CurvaAbc,
  RegraEstoque,
  ENDERECO_TIPO_CONFIG,
  MOTIVOS_MOVIMENTACAO,
  formatarCodigoEndereco,
} from "@/lib/wmsArmazenagemTypes";
import {
  fetchEnderecosApi,
  fetchMovimentacoesApi,
  registrarMovimentacaoApi,
  bloquearEnderecoApi,
  desbloquearEnderecoApi,
  sugerirMelhorEnderecoApi,
  gerarLayoutEmMassaApi,
  fetchFilaSaidaEstoqueApi,
} from "@/lib/wmsArmazenagemService";
import { FilaSaidaEstoque } from "@/lib/serverArmazenagem";
import { PortalUser } from "@/lib/authTypes";
import {
  Boxes,
  Grid3X3,
  MapPin,
  ArrowRightLeft,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  Clock,
  Barcode,
  Layers,
  ArrowDownUp,
  Info,
  ChevronRight,
  X,
  Send,
  Zap,
  TrendingUp,
  Scale,
  PackageCheck,
  Building2,
  Check,
} from "lucide-react";

interface WmsArmazenagemViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

export function WmsArmazenagemView({
  currentUser,
  onNavigateToLabels,
}: WmsArmazenagemViewProps) {
  // Sub-abas do Módulo 03
  const [subTab, setSubTab] = useState<
    "mapa" | "movimentacoes" | "slotting_ia" | "regras_estoque" | "layout"
  >("mapa");

  // Estados gerais
  const [enderecos, setEnderecos] = useState<WmsEndereco[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<WmsMovimentacao[]>([]);
  const [filasSaida, setFilasSaida] = useState<FilaSaidaEstoque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtros do Mapa
  const [ruaSelecionada, setRuaSelecionada] = useState<string>("01");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroInatividade, setFiltroInatividade] = useState<number>(0); // 0 = todos, 30 = > 30d, 60 = > 60d
  const [filtroApenasVencimentoProximo, setFiltroApenasVencimentoProximo] = useState(false);
  const [buscaTermo, setBuscaTermo] = useState("");

  // Modal / Drawer de Detalhes do Endereço
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<WmsEndereco | null>(null);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [motivoBloqueioInput, setMotivoBloqueioInput] = useState("");

  // Formulário de Movimentação Rápida
  const [movProdutoCodigo, setMovProdutoCodigo] = useState("");
  const [movProdutoDescricao, setMovProdutoDescricao] = useState("");
  const [movOrigem, setMovOrigem] = useState("");
  const [movDestino, setMovDestino] = useState("");
  const [movQuantidade, setMovQuantidade] = useState<number | "">("");
  const [movLote, setMovLote] = useState("");
  const [movValidade, setMovValidade] = useState("");
  const [movMotivo, setMovMotivo] = useState<string>(MOTIVOS_MOVIMENTACAO[0]);
  const [movRegraEstoque, setMovRegraEstoque] = useState<RegraEstoque>("FEFO");
  const [movObservacao, setMovObservacao] = useState("");

  // Formulário de Slotting IA
  const [iaCodProduto, setIaCodProduto] = useState("BEB-COCA-2L");
  const [iaDescricao, setIaDescricao] = useState("Refrigerante Coca-Cola 2L Pet (Fardo c/ 6)");
  const [iaCategoria, setIaCategoria] = useState("Bebidas");
  const [iaCurvaAbc, setIaCurvaAbc] = useState<CurvaAbc>("A");
  const [iaQuantidade, setIaQuantidade] = useState<number>(50);
  const [iaPesoTotal, setIaPesoTotal] = useState<number>(450);
  const [iaVolumeTotal, setIaVolumeTotal] = useState<number>(1.2);
  const [iaLote, setIaLote] = useState("L-2026B");
  const [iaValidade, setIaValidade] = useState("2027-05-10");
  const [sugestoesIa, setSugestoesIa] = useState<SugestaoSlottingResultado[]>([]);
  const [isCalculandoIa, setIsCalculandoIa] = useState(false);

  // Formulário de Criação de Layout em Massa
  const [layoutSetor, setLayoutSetor] = useState("A");
  const [layoutRuaInicio, setLayoutRuaInicio] = useState(1);
  const [layoutRuaFim, setLayoutRuaFim] = useState(3);
  const [layoutPredioInicio, setLayoutPredioInicio] = useState(1);
  const [layoutPredioFim, setLayoutPredioFim] = useState(4);
  const [layoutTipoPadrao, setLayoutTipoPadrao] = useState<EnderecoTipo>("porta_paletes");
  const [isGerandoLayout, setIsGerandoLayout] = useState(false);

  // Carregamento de dados
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [ends, movs, filas] = await Promise.all([
        fetchEnderecosApi(),
        fetchMovimentacoesApi(),
        fetchFilaSaidaEstoqueApi(),
      ]);
      setEnderecos(ends);
      setMovimentacoes(movs);
      setFilasSaida(filas);
    } catch (err) {
      console.error("Erro ao carregar dados do WMS Armazenagem:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Lista de ruas únicas no armazém
  const listaRuas = useMemo(() => {
    const ruas = new Set<string>();
    enderecos.forEach((e) => {
      if (e.rua && e.rua !== "00" && e.rua !== "98" && e.rua !== "99" && e.rua !== "97") {
        ruas.add(e.rua);
      }
    });
    return Array.from(ruas).sort();
  }, [enderecos]);

  // Indicadores Globais do CD
  const indicadores = useMemo(() => {
    const total = enderecos.length;
    const livres = enderecos.filter((e) => e.status === "livre").length;
    const ocupados = enderecos.filter((e) => e.status === "ocupado" || e.status === "parcialmente_ocupado").length;
    const bloqueados = enderecos.filter((e) => e.status === "bloqueado").length;
    const taxaOcupacao = total > 0 ? Math.round((ocupados / total) * 100) : 0;

    // Alertas de validade (< 30 dias)
    const hoje = new Date();
    let itensVencendo = 0;
    let itensParados30d = 0;

    enderecos.forEach((e) => {
      e.produtos_alocados.forEach((p) => {
        if (p.data_validade) {
          const diffDias = Math.ceil(
            (new Date(p.data_validade).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDias <= 30) itensVencendo++;
        }
        if (p.dias_sem_movimentacao >= 30) {
          itensParados30d++;
        }
      });
    });

    return {
      total,
      livres,
      ocupados,
      bloqueados,
      taxaOcupacao,
      itensVencendo,
      itensParados30d,
    };
  }, [enderecos]);

  // Endereços filtrados para a visualização gráfica
  const enderecosFiltradosMapa = useMemo(() => {
    return enderecos.filter((e) => {
      // Filtro de rua ou áreas especiais
      if (ruaSelecionada === "especiais") {
        const especiais = ["recebimento", "quarentena", "avaria", "expedicao", "separacao", "conferencia", "devolucao"];
        if (!especiais.includes(e.tipo)) return false;
      } else if (ruaSelecionada !== "todas" && e.rua !== ruaSelecionada) {
        return false;
      }

      if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
      if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;

      // Filtro de inatividade
      if (filtroInatividade > 0) {
        const temItemInativo = e.produtos_alocados.some(
          (p) => p.dias_sem_movimentacao >= filtroInatividade
        );
        if (!temItemInativo) return false;
      }

      // Filtro de validade próxima (< 30 dias)
      if (filtroApenasVencimentoProximo) {
        const hoje = new Date();
        const temVencendo = e.produtos_alocados.some((p) => {
          if (!p.data_validade) return false;
          const diff = Math.ceil(
            (new Date(p.data_validade).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diff <= 30;
        });
        if (!temVencendo) return false;
      }

      // Busca por texto
      if (buscaTermo.trim()) {
        const termo = buscaTermo.toLowerCase();
        const matchCodigo = e.codigo.toLowerCase().includes(termo);
        const matchProd = e.produtos_alocados.some(
          (p) =>
            p.codigo.toLowerCase().includes(termo) ||
            p.descricao.toLowerCase().includes(termo) ||
            p.lote.toLowerCase().includes(termo) ||
            p.ean.includes(termo)
        );
        if (!matchCodigo && !matchProd) return false;
      }

      return true;
    });
  }, [
    enderecos,
    ruaSelecionada,
    filtroTipo,
    filtroStatus,
    filtroInatividade,
    filtroApenasVencimentoProximo,
    buscaTermo,
  ]);

  // Estrutura em Grid para a Rua Selecionada: Níveis (Y) x Prédios (X)
  const matrizGridRua = useMemo(() => {
    const prediosSet = new Set<string>();
    const niveisSet = new Set<string>();

    enderecosFiltradosMapa.forEach((e) => {
      prediosSet.add(e.predio);
      niveisSet.add(e.nivel);
    });

    const predios = Array.from(prediosSet).sort();
    const niveis = Array.from(niveisSet).sort((a, b) => Number(b) - Number(a)); // Nível mais alto (05) em cima

    return { predios, niveis };
  }, [enderecosFiltradosMapa]);

  // Handler de Execução de Movimentação
  const handleExecutarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movProdutoCodigo.trim() || !movOrigem.trim() || !movDestino.trim() || !movQuantidade) {
      setToastMsg({ text: "Preencha todos os campos obrigatórios da movimentação.", type: "error" });
      return;
    }

    setIsLoading(true);
    const res = await registrarMovimentacaoApi({
      produto_codigo: movProdutoCodigo.trim().toUpperCase(),
      produto_descricao: movProdutoDescricao || movProdutoCodigo,
      origem_endereco: movOrigem.trim().toUpperCase(),
      destino_endereco: movDestino.trim().toUpperCase(),
      quantidade: Number(movQuantidade),
      lote: movLote.trim() || undefined,
      data_validade: movValidade || undefined,
      regra_estoque: movRegraEstoque,
      motivo: movMotivo,
      observacao: movObservacao,
      usuario_nome: currentUser?.name || "Operador WMS",
    });

    setIsLoading(false);
    if (res.success) {
      setToastMsg({
        text: `Movimentação concluída com sucesso! De [${movOrigem}] para [${movDestino}].`,
        type: "success",
      });
      // Limpa formulário
      setMovQuantidade("");
      setMovObservacao("");
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao executar movimentação.", type: "error" });
    }
  };

  // Handler de Bloqueio de Endereço
  const handleBloquearEndereco = async () => {
    if (!enderecoSelecionado) return;
    if (!motivoBloqueioInput.trim()) {
      setToastMsg({ text: "Informe a justificativa do bloqueio.", type: "error" });
      return;
    }

    const res = await bloquearEnderecoApi(
      enderecoSelecionado.codigo,
      motivoBloqueioInput.trim(),
      currentUser?.name || "Supervisor WMS"
    );

    if (res.success) {
      setToastMsg({
        text: `Endereço [${enderecoSelecionado.codigo}] foi bloqueado operacionalmente.`,
        type: "success",
      });
      setModalBloqueioAberto(false);
      setEnderecoSelecionado(res.endereco || null);
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao bloquear endereço.", type: "error" });
    }
  };

  // Handler de Desbloqueio
  const handleDesbloquearEndereco = async () => {
    if (!enderecoSelecionado) return;
    const res = await desbloquearEnderecoApi(
      enderecoSelecionado.codigo,
      currentUser?.name || "Supervisor WMS"
    );

    if (res.success) {
      setToastMsg({
        text: `Endereço [${enderecoSelecionado.codigo}] liberado e desbloqueado!`,
        type: "success",
      });
      setEnderecoSelecionado(res.endereco || null);
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao desbloquear endereço.", type: "error" });
    }
  };

  // Handler de Cálculo do Slotting IA
  const handleCalcularSlottingIa = async () => {
    setIsCalculandoIa(true);
    setSugestoesIa([]);
    const res = await sugerirMelhorEnderecoApi({
      cod_produto: iaCodProduto,
      descricao: iaDescricao,
      categoria: iaCategoria,
      curva_abc: iaCurvaAbc,
      quantidade: iaQuantidade,
      peso_total_kg: iaPesoTotal,
      volume_total_m3: iaVolumeTotal,
      lote: iaLote,
      data_validade: iaValidade,
    });
    setIsCalculandoIa(false);

    if (res.success && res.sugestoes) {
      setSugestoesIa(res.sugestoes);
    } else {
      setToastMsg({ text: res.error || "Erro ao calcular sugestão de slotting.", type: "error" });
    }
  };

  // Handler de Criação de Layout em Massa
  const handleGerarLayoutMassa = async () => {
    setIsGerandoLayout(true);
    const res = await gerarLayoutEmMassaApi({
      setor: layoutSetor,
      ruaInicio: layoutRuaInicio,
      ruaFim: layoutRuaFim,
      predioInicio: layoutPredioInicio,
      predioFim: layoutPredioFim,
      niveis: [1, 2, 3, 4],
      posicoesPorNivel: [1, 2],
      tipoPadrao: layoutTipoPadrao,
    });
    setIsGerandoLayout(false);

    if (res.success) {
      setToastMsg({
        text: `Layout gerado com sucesso! ${res.totalGerados} novos endereços cadastrados.`,
        type: "success",
      });
      await carregarDados();
    } else {
      setToastMsg({ text: res.error || "Erro ao gerar layout em massa.", type: "error" });
    }
  };

  // Ação Rápida: Alocar a partir da sugestão da IA
  const handleAlocarSugestaoIa = (sugestao: SugestaoSlottingResultado) => {
    setMovProdutoCodigo(iaCodProduto);
    setMovProdutoDescricao(iaDescricao);
    setMovOrigem("REC-DOCA-01"); // Doca padrão de recebimento
    setMovDestino(sugestao.endereco.codigo);
    setMovQuantidade(iaQuantidade);
    setMovLote(iaLote);
    setMovValidade(iaValidade);
    setMovMotivo("Slotting / Reorganização Inteligente (IA)");
    setSubTab("movimentacoes");
  };

  // Ação Rápida: Iniciar movimentação a partir de um endereço do mapa
  const handleIniciarMovimentacaoDeEndereco = (end: WmsEndereco, prod?: ProdutoAlocado) => {
    setMovOrigem(end.codigo);
    if (prod) {
      setMovProdutoCodigo(prod.codigo);
      setMovProdutoDescricao(prod.descricao);
      setMovLote(prod.lote);
      setMovValidade(prod.data_validade || "");
      setMovQuantidade(prod.quantidade);
    } else if (end.produtos_alocados.length > 0 && end.produtos_alocados[0]) {
      const p = end.produtos_alocados[0];
      setMovProdutoCodigo(p.codigo);
      setMovProdutoDescricao(p.descricao);
      setMovLote(p.lote);
      setMovValidade(p.data_validade || "");
      setMovQuantidade(p.quantidade);
    }
    setEnderecoSelecionado(null);
    setSubTab("movimentacoes");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Principal do Módulo 03 */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
              WMS • Módulo 03
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Building2 size={13} />
              <span>CD-01 — Barueri Matriz</span>
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Armazenagem & Endereçamento Inteligente
          </h1>
          <p className="text-xs text-[var(--muted)] max-w-2xl">
            Gestão da localização física, mapa visual 2D/3D do armazém, regras de rotação de estoque (FEFO/FIFO), slotting dinâmico por IA e rastreabilidade total de movimentações.
          </p>
        </div>

        {/* Ações de Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={carregarDados}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-semibold text-[var(--foreground)] transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("slotting_ia")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Sparkles size={15} />
            <span>IA de Slotting</span>
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

      {/* KPI Cards Rápidos do Armazém */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Total Posições</span>
            <Boxes size={14} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="font-heading text-xl font-bold text-[var(--foreground)]">
            {indicadores.total}
          </div>
          <span className="text-[10px] text-[var(--muted)] block">Cadastradas no CD</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Taxa Ocupação</span>
            <TrendingUp size={14} className="text-sky-400" />
          </div>
          <div className="font-heading text-xl font-bold text-sky-400">
            {indicadores.taxaOcupacao}%
          </div>
          <span className="text-[10px] text-[var(--muted)] block">
            {indicadores.ocupados} ocupadas / {indicadores.livres} livres
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Posições Livres</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="font-heading text-xl font-bold text-emerald-400">
            {indicadores.livres}
          </div>
          <span className="text-[10px] text-emerald-500/80 block">Disponíveis p/ alocação</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Bloqueadas</span>
            <Lock size={14} className="text-red-400" />
          </div>
          <div className="font-heading text-xl font-bold text-red-400">
            {indicadores.bloqueados}
          </div>
          <span className="text-[10px] text-red-500/80 block">Interdição / Manutenção</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Validade Crítica</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div className="font-heading text-xl font-bold text-amber-400">
            {indicadores.itensVencendo}
          </div>
          <span className="text-[10px] text-amber-500/80 block">&le; 30 dias (FEFO urgente)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Estoque Parado</span>
            <Clock size={14} className="text-purple-400" />
          </div>
          <div className="font-heading text-xl font-bold text-purple-400">
            {indicadores.itensParados30d}
          </div>
          <span className="text-[10px] text-purple-400/80 block">&gt; 30 dias sem giro</span>
        </div>
      </div>

      {/* Sub-Abas do Módulo 03 */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab("mapa")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "mapa"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Grid3X3 size={15} />
          <span>1. Mapa Visual Gráfico do CD</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("movimentacoes")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "movimentacoes"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <ArrowRightLeft size={15} />
          <span>2. Movimentações Internas (Bipagem)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("slotting_ia")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "slotting_ia"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Sparkles size={15} />
          <span>3. IA de Slotting & Classificação Dinâmica</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("regras_estoque")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "regras_estoque"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <ArrowDownUp size={15} />
          <span>4. Regras de Estoque (FEFO / FIFO / LIFO)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("layout")}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === "layout"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Layers size={15} />
          <span>5. Layout & Gerenciamento Estrutural</span>
        </button>
      </div>

      {/* ── ABA 1: MAPA VISUAL GRÁFICO DO CD (Item 3.7) ────────────────────── */}
      {subTab === "mapa" && (
        <div className="space-y-4">
          {/* Barra de Filtros e Seletores do Mapa */}
          <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Seletor de Rua / Áreas Especiais */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Rua / Setor:</span>
                {listaRuas.map((rua) => (
                  <button
                    key={rua}
                    type="button"
                    onClick={() => setRuaSelecionada(rua)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      ruaSelecionada === rua
                        ? "bg-[var(--collab-mostarda)] text-[#080808]"
                        : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]/50"
                    }`}
                  >
                    Rua {rua}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRuaSelecionada("todas")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ruaSelecionada === "todas"
                      ? "bg-[var(--collab-mostarda)] text-[#080808]"
                      : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  }`}
                >
                  Todas as Ruas
                </button>
                <button
                  type="button"
                  onClick={() => setRuaSelecionada("especiais")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ruaSelecionada === "especiais"
                      ? "bg-purple-500 text-white"
                      : "bg-[var(--background)] border border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  }`}
                >
                  Áreas Especiais (Docas / Quarentena / Avarias)
                </button>
              </div>

              {/* Busca por código ou produto */}
              <div className="relative min-w-[260px]">
                <Search size={14} className="absolute left-3 top-3 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Buscar endereço, SKU, EAN ou lote..."
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
            </div>

            {/* Filtros Avançados: Tipo, Status, Validade, Inatividade */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--card-border)] text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted)] font-medium">Tipo:</span>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="px-2.5 py-1 rounded-md bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-xs focus:outline-none"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="picking">Picking (Nível 01)</option>
                  <option value="flow_rack">Flow Rack</option>
                  <option value="porta_paletes">Porta-paletes</option>
                  <option value="pulmao">Pulmão</option>
                  <option value="quarentena">Quarentena</option>
                  <option value="avaria">Avaria</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted)] font-medium">Status:</span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-2.5 py-1 rounded-md bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-xs focus:outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="livre">🟢 Livres</option>
                  <option value="ocupado">🔵 Ocupados</option>
                  <option value="bloqueado">🔴 Bloqueados</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted)] font-medium">Inatividade:</span>
                <select
                  value={filtroInatividade}
                  onChange={(e) => setFiltroInatividade(Number(e.target.value))}
                  className="px-2.5 py-1 rounded-md bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-xs focus:outline-none"
                >
                  <option value={0}>Sem filtro de inatividade</option>
                  <option value={30}>⏳ Sem movimentação &gt; 30 dias</option>
                  <option value={60}>⏳ Sem movimentação &gt; 60 dias</option>
                  <option value={90}>⏳ Sem movimentação &gt; 90 dias (Obsoleto)</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer ml-auto text-amber-400 font-semibold">
                <input
                  type="checkbox"
                  checked={filtroApenasVencimentoProximo}
                  onChange={(e) => setFiltroApenasVencimentoProximo(e.target.checked)}
                  className="rounded border-[var(--card-border)] text-[var(--collab-mostarda)] focus:ring-0 cursor-pointer"
                />
                <span>Apenas Próximos do Vencimento (&le; 30 dias)</span>
              </label>
            </div>
          </div>

          {/* Legenda do Mapa */}
          <div className="flex flex-wrap items-center gap-4 px-2 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500" />
              <span>Posição Livre (0%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-sky-500/20 border border-sky-500" />
              <span>Ocupada com Carga</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500" />
              <span>Endereço Bloqueado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-500" />
              <span>Validade Crítica (&le; 30d)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-purple-500/30 border border-purple-500" />
              <span>Estoque Parado (&gt; 30d)</span>
            </div>
          </div>

          {/* GRID GRÁFICO 2D/3D DO ARMAZÉM */}
          {enderecosFiltradosMapa.length === 0 ? (
            <div className="p-12 text-center bg-[var(--card)] border border-[var(--card-border)] rounded-2xl">
              <Boxes size={36} className="mx-auto text-[var(--muted)] mb-2" />
              <p className="font-semibold text-sm text-[var(--foreground)]">Nenhum endereço encontrado para os filtros selecionados.</p>
              <p className="text-xs text-[var(--muted)] mt-1">Ajuste os filtros de rua, status ou termo de busca.</p>
            </div>
          ) : (
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4 overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <Grid3X3 size={18} className="text-[var(--collab-mostarda)]" />
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    {ruaSelecionada === "especiais"
                      ? "Áreas Especiais & Segregadas do CD"
                      : ruaSelecionada === "todas"
                      ? "Visão Geral de Todas as Ruas"
                      : `Rua ${ruaSelecionada} — Prédios x Níveis Verticais`}
                  </h3>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {enderecosFiltradosMapa.length} posições exibidas
                </span>
              </div>

              {/* Matriz Visual: Níveis (Y) por Prédios (X) */}
              <div className="min-w-[800px] space-y-3">
                {matrizGridRua.niveis.map((nivel) => {
                  const nivelNum = Number(nivel);
                  const isErgonomico = nivelNum <= 2;

                  return (
                    <div key={nivel} className="flex items-center gap-3">
                      {/* Indicador de Nível Vertical */}
                      <div className="w-24 shrink-0 flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-center">
                        <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                          NÍVEL {nivel}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase ${
                            isErgonomico ? "text-emerald-400" : "text-indigo-400"
                          }`}
                        >
                          {isErgonomico ? "Chão / Picking" : "Aéreo / Pulmão"}
                        </span>
                      </div>

                      {/* Grade de Posições nos Prédios */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {matrizGridRua.predios.map((predio) => {
                          const endsNaPosicao = enderecosFiltradosMapa.filter(
                            (e) => e.predio === predio && e.nivel === nivel
                          );

                          if (endsNaPosicao.length === 0) {
                            return (
                              <div
                                key={`${predio}-${nivel}`}
                                className="h-24 rounded-xl border border-dashed border-[var(--card-border)]/50 bg-[var(--background)]/20 flex items-center justify-center text-[10px] text-[var(--muted)]"
                              >
                                Vazio
                              </div>
                            );
                          }

                          return endsNaPosicao.map((end) => {
                            const isBloq = end.status === "bloqueado";
                            const isLivre = end.status === "livre";
                            const pctOcupacao = Math.min(
                              100,
                              Math.round((end.peso_atual_kg / (end.peso_max_kg || 1200)) * 100)
                            );

                            // Checa alertas
                            const hoje = new Date();
                            const temVencimentoCritico = end.produtos_alocados.some((p) => {
                              if (!p.data_validade) return false;
                              const diff = Math.ceil(
                                (new Date(p.data_validade).getTime() - hoje.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              return diff <= 30;
                            });

                            const temEstoqueParado = end.produtos_alocados.some(
                              (p) => p.dias_sem_movimentacao >= 30
                            );

                            return (
                              <div
                                key={end.id}
                                onClick={() => setEnderecoSelecionado(end)}
                                className={`h-24 rounded-xl p-2.5 flex flex-col justify-between border transition-all cursor-pointer shadow-sm relative group hover:scale-[1.02] ${
                                  isBloq
                                    ? "bg-red-500/10 border-red-500/40 text-red-300"
                                    : isLivre
                                    ? "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500 text-emerald-300"
                                    : temVencimentoCritico
                                    ? "bg-amber-500/15 border-amber-500 text-amber-200"
                                    : temEstoqueParado
                                    ? "bg-purple-500/10 border-purple-500/40 text-purple-200"
                                    : "bg-sky-500/10 border-sky-500/30 hover:border-sky-500 text-sky-200"
                                }`}
                              >
                                {/* Header do Card de Endereço */}
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-xs tracking-tight">
                                    {end.codigo}
                                  </span>
                                  {isBloq ? (
                                    <Lock size={12} className="text-red-400" />
                                  ) : isLivre ? (
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded">
                                      LIVRE
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-sky-400 bg-sky-500/20 px-1 py-0.2 rounded">
                                      {pctOcupacao}%
                                    </span>
                                  )}
                                </div>

                                {/* Conteúdo Central */}
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-[var(--muted)] flex items-center justify-between">
                                    <span className="truncate max-w-[90px]">
                                      {ENDERECO_TIPO_CONFIG[end.tipo]?.badge || end.tipo}
                                    </span>
                                    <span>
                                      {end.peso_atual_kg}/{end.peso_max_kg}kg
                                    </span>
                                  </div>

                                  {end.produtos_alocados.length > 0 && end.produtos_alocados[0] ? (
                                    <p className="text-[10px] font-semibold text-[var(--foreground)] truncate">
                                      {end.produtos_alocados[0].codigo} ({end.produtos_alocados[0].quantidade} un)
                                    </p>
                                  ) : (
                                    <p className="text-[9px] text-[var(--muted)] italic">
                                      Pronto para estocagem
                                    </p>
                                  )}
                                </div>

                                {/* Barra de Progresso de Capacidade */}
                                {!isBloq && !isLivre && (
                                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        pctOcupacao > 90 ? "bg-red-500" : pctOcupacao > 70 ? "bg-amber-400" : "bg-sky-400"
                                      }`}
                                      style={{ width: `${pctOcupacao}%` }}
                                    />
                                  </div>
                                )}

                                {isBloq && (
                                  <div className="text-[9px] font-semibold text-red-400 truncate">
                                    Interditado
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA 2: MOVIMENTAÇÕES INTERNAS (BIPAGEM) (Item 3.5) ───────────────── */}
      {subTab === "movimentacoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Execução de Movimentação */}
          <div className="lg:col-span-1 bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--card-border)]">
              <Barcode size={18} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Registro de Movimentação
                </h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Bipagem de produto, origem e destino
                </p>
              </div>
            </div>

            <form onSubmit={handleExecutarMovimentacao} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Código do Produto / EAN / SKU *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Bipar ou digitar código..."
                    value={movProdutoCodigo}
                    onChange={(e) => setMovProdutoCodigo(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)] font-mono font-bold"
                  />
                  <Barcode size={16} className="absolute right-2.5 top-2.5 text-[var(--muted)]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Descrição do Produto
                </label>
                <input
                  type="text"
                  placeholder="Nome do produto..."
                  value={movProdutoDescricao}
                  onChange={(e) => setMovProdutoDescricao(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Endereço Origem *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: REC-DOCA-01"
                    value={movOrigem}
                    onChange={(e) => setMovOrigem(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Endereço Destino *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A-01-01-01-01"
                    value={movDestino}
                    onChange={(e) => setMovDestino(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Qtd..."
                    value={movQuantidade}
                    onChange={(e) => setMovQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: L-2026A"
                    value={movLote}
                    onChange={(e) => setMovLote(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={movValidade}
                    onChange={(e) => setMovValidade(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Regra de Estoque
                  </label>
                  <select
                    value={movRegraEstoque}
                    onChange={(e) => setMovRegraEstoque(e.target.value as RegraEstoque)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="FEFO">FEFO (Validade)</option>
                    <option value="FIFO">FIFO (Entrada)</option>
                    <option value="LIFO">LIFO (Último a entrar)</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Motivo da Movimentação *
                </label>
                <select
                  value={movMotivo}
                  onChange={(e) => setMovMotivo(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none font-medium"
                >
                  {MOTIVOS_MOVIMENTACAO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Justificativa ou nota operacional..."
                  value={movObservacao}
                  onChange={(e) => setMovObservacao(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRightLeft size={16} />
                <span>Confirmar Movimentação</span>
              </button>
            </form>
          </div>

          {/* Histórico Recente de Movimentações */}
          <div className="lg:col-span-2 bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Rastreabilidade de Movimentações
                </h3>
              </div>
              <span className="text-xs text-[var(--muted)] font-mono">
                {movimentacoes.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3">Origem &rarr; Destino</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3">Regra</th>
                    <th className="py-2.5 px-3">Operador & Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {movimentacoes.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[var(--background)]/40 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-[var(--muted)] font-mono text-[11px]">
                        {new Date(mov.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[var(--foreground)] block font-mono">
                          {mov.produto_codigo}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] truncate max-w-[150px] block">
                          {mov.produto_descricao}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold">
                        <span className="text-amber-400">{mov.origem_endereco}</span>
                        <span className="text-[var(--muted)] mx-1">&rarr;</span>
                        <span className="text-emerald-400">{mov.destino_endereco}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--foreground)]">
                        {mov.quantidade} {mov.unidade_medida}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                          {mov.regra_estoque}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-[var(--foreground)] block">
                          {mov.usuario_nome}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {mov.motivo}
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

      {/* ── ABA 3: IA DE SLOTTING & SUGESTÃO DINÂMICA (Item 3.4) ─────────────── */}
      {subTab === "slotting_ia" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Parâmetros do SKU */}
          <div className="lg:col-span-1 bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--card-border)]">
              <Sparkles size={18} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Algoritmo de Slotting Inteligente
                </h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Classificação dinâmica e ergonomia
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Código do Produto (SKU)
                </label>
                <input
                  type="text"
                  value={iaCodProduto}
                  onChange={(e) => setIaCodProduto(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={iaDescricao}
                  onChange={(e) => setIaDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Categoria
                  </label>
                  <select
                    value={iaCategoria}
                    onChange={(e) => setIaCategoria(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  >
                    <option value="Bebidas">Bebidas</option>
                    <option value="Alimentos">Alimentos</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Eletro">Eletro</option>
                    <option value="Químicos">Químicos</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Curva ABC (Giro)
                  </label>
                  <select
                    value={iaCurvaAbc}
                    onChange={(e) => setIaCurvaAbc(e.target.value as CurvaAbc)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-bold"
                  >
                    <option value="A">Curva A (Alto Giro)</option>
                    <option value="B">Curva B (Médio Giro)</option>
                    <option value="C">Curva C (Baixo Giro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Qtd (un)
                  </label>
                  <input
                    type="number"
                    value={iaQuantidade}
                    onChange={(e) => setIaQuantidade(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={iaPesoTotal}
                    onChange={(e) => setIaPesoTotal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={iaVolumeTotal}
                    onChange={(e) => setIaVolumeTotal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={iaLote}
                    onChange={(e) => setIaLote(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Validade
                  </label>
                  <input
                    type="date"
                    value={iaValidade}
                    onChange={(e) => setIaValidade(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalcularSlottingIa}
                disabled={isCalculandoIa}
                className="w-full py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Sparkles size={16} className={isCalculandoIa ? "animate-spin" : ""} />
                <span>Calcular Sugestão de Endereço</span>
              </button>
            </div>
          </div>

          {/* Resultados Ranqueados da IA */}
          <div className="lg:col-span-2 bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Posições Recomendadas pela IA
                </h3>
              </div>
              <span className="text-xs text-[var(--muted)]">
                {sugestoesIa.length} recomendações encontradas
              </span>
            </div>

            {sugestoesIa.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)]">
                <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-xs text-[var(--foreground)]">
                  Clique em "Calcular Sugestão de Endereço" para executar a análise da IA.
                </p>
                <p className="text-[11px] mt-1 max-w-md mx-auto">
                  A IA analisa dimensões, peso, giro de estoque (Curva ABC), compatibilidade de categoria e capacidade residual em tempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sugestoesIa.map((sug, idx) => (
                  <div
                    key={sug.endereco.id}
                    className={`p-4 rounded-xl border transition-all ${
                      idx === 0
                        ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)]/50 shadow-sm"
                        : "bg-[var(--background)] border-[var(--card-border)]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0
                              ? "bg-[var(--collab-mostarda)] text-[#080808]"
                              : "bg-[var(--card-border)] text-[var(--foreground)]"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-mono font-black text-sm text-[var(--foreground)]">
                            {sug.endereco.codigo}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] block">
                            {ENDERECO_TIPO_CONFIG[sug.endereco.tipo]?.label} • Nível {sug.endereco.nivel} • Rua {sug.endereco.rua}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-heading font-black text-sm text-[var(--collab-mostarda)] block">
                            Score {sug.score}%
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">
                            {sug.nivel_ergonomico === "chao_picking"
                              ? "Ergonomia Chão"
                              : sug.nivel_ergonomico === "medio_ergonomico"
                              ? "Ergonomia Média"
                              : "Aéreo / Pulmão"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAlocarSugestaoIa(sug)}
                          className="px-3.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                        >
                          Alocar Aqui
                        </button>
                      </div>
                    </div>

                    {/* Motivos da Decisão da IA */}
                    <div className="space-y-1 pt-2 border-t border-[var(--card-border)]/50">
                      {sug.motivos_recomendacao.map((m, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--foreground)]">
                          <Check size={12} className="text-emerald-400 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA 4: REGRAS DE ESTOQUE (FEFO / FIFO / LIFO) (Item 3.6) ─────────── */}
      {subTab === "regras_estoque" && (
        <div className="space-y-6">
          {/* Cards Didáticos das Regras Operacionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  FEFO • First Expired, First Out
                </span>
                <Clock size={16} className="text-emerald-400" />
              </div>
              <h4 className="font-bold text-sm text-[var(--foreground)]">Primeiro que vence, primeiro que sai</h4>
              <p className="text-xs text-[var(--muted)]">
                Obrigatório para medicamentos, perecíveis e alimentos. Prioriza lotes com data de validade mais próxima para evitar perda e descarte.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  FIFO • First In, First Out
                </span>
                <ArrowRightLeft size={16} className="text-sky-400" />
              </div>
              <h4 className="font-bold text-sm text-[var(--foreground)]">Primeiro que entra, primeiro que sai</h4>
              <p className="text-xs text-[var(--muted)]">
                Padrão para itens secos, eletrônicos e embalagens. Prioriza lotes estocados há mais tempo no CD para garantir rotatividade contínua.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  LIFO • Last In, First Out
                </span>
                <Layers size={16} className="text-purple-400" />
              </div>
              <h4 className="font-bold text-sm text-[var(--foreground)]">Último que entra, primeiro que sai</h4>
              <p className="text-xs text-[var(--muted)]">
                Excepcional mediante permissão. Aplicável em estruturas de blocados profundos (drive-in sem saída traseira) ou materiais inertes.
              </p>
            </div>
          </div>

          {/* Fila Prioritária de Saída por Produto */}
          <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Fila Prioritária de Separação (Picking / Expedição)
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Lotes ordenados automaticamente pela regra de rotação exigida
                </p>
              </div>
              <span className="text-xs text-[var(--muted)] font-mono font-bold">
                {filasSaida.length} produtos monitorados
              </span>
            </div>

            <div className="space-y-4">
              {filasSaida.map((fila) => (
                <div
                  key={fila.produto_codigo}
                  className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--card-border)]">
                    <div>
                      <span className="font-mono font-black text-sm text-[var(--foreground)] mr-2">
                        {fila.produto_codigo}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{fila.produto_descricao}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        {fila.regra_recomendada}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">{fila.motivo_regra}</span>
                    </div>
                  </div>

                  {/* Tabela de Lotes Ordenados */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] uppercase text-[var(--muted)] border-b border-[var(--card-border)]">
                        <tr>
                          <th className="py-2 px-3">Prioridade</th>
                          <th className="py-2 px-3">Localização</th>
                          <th className="py-2 px-3">Lote</th>
                          <th className="py-2 px-3">Validade</th>
                          <th className="py-2 px-3 text-right">Saldo</th>
                          <th className="py-2 px-3 text-right">Tempo no CD</th>
                          <th className="py-2 px-3">Status Rotação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)]/50">
                        {fila.itens_ordenados.map((item) => (
                          <tr
                            key={`${item.endereco_codigo}-${item.lote}`}
                            className={`hover:bg-[var(--card)]/50 transition-colors ${
                              item.prioridade_saida === 1 ? "bg-[var(--collab-mostarda)]/5 font-semibold" : ""
                            }`}
                          >
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                                  item.prioridade_saida === 1
                                    ? "bg-[var(--collab-mostarda)] text-[#080808]"
                                    : "bg-[var(--card-border)] text-[var(--muted)]"
                                }`}
                              >
                                {item.prioridade_saida}º
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-sky-400">
                              {item.endereco_codigo}
                            </td>
                            <td className="py-2 px-3 font-mono text-[var(--foreground)]">{item.lote}</td>
                            <td className="py-2 px-3 font-mono">
                              {item.data_validade || "Não aplicável"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[var(--foreground)]">
                              {item.quantidade} {item.unidade_medida}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[var(--muted)]">
                              {item.dias_estocado} dias
                            </td>
                            <td className="py-2 px-3">
                              {item.status_validade === "critica" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                                  Vence em {item.dias_para_vencer}d (Urgente)
                                </span>
                              ) : item.status_validade === "vencido" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400">
                                  Vencido (Bloquear)
                                </span>
                              ) : item.prioridade_saida === 1 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                                  Retirar Primeiro
                                </span>
                              ) : (
                                <span className="text-[11px] text-[var(--muted)]">Na fila</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 5: CADASTRO & ESTRUTURA DO LAYOUT (Item 3.2 & 3.3) ───────────── */}
      {subTab === "layout" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gerador em Massa de Layout */}
          <div className="lg:col-span-1 bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--card-border)]">
              <Layers size={18} className="text-[var(--collab-mostarda)]" />
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Gerador de Layout em Massa
                </h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Criar ruas e prédios estruturados
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Setor do CD
                </label>
                <input
                  type="text"
                  value={layoutSetor}
                  onChange={(e) => setLayoutSetor(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Rua Inicial
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={layoutRuaInicio}
                    onChange={(e) => setLayoutRuaInicio(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Rua Final
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={layoutRuaFim}
                    onChange={(e) => setLayoutRuaFim(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Prédio Inicial
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={layoutPredioInicio}
                    onChange={(e) => setLayoutPredioInicio(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">
                    Prédio Final
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={layoutPredioFim}
                    onChange={(e) => setLayoutPredioFim(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">
                  Tipo Padrão
                </label>
                <select
                  value={layoutTipoPadrao}
                  onChange={(e) => setLayoutTipoPadrao(e.target.value as EnderecoTipo)}
                  className="w-full px-2.5 py-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-medium"
                >
                  <option value="porta_paletes">Porta-Paletes (Nível 01 vira Picking)</option>
                  <option value="picking">Picking Ergonômico</option>
                  <option value="flow_rack">Flow Rack</option>
                  <option value="pulmao">Pulmão Geral</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGerarLayoutMassa}
                disabled={isGerandoLayout}
                className="w-full py-2.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus size={16} className={isGerandoLayout ? "animate-spin" : ""} />
                <span>Gerar Estrutura de Endereços</span>
              </button>
            </div>
          </div>

          {/* Tabela de Todos os Endereços */}
          <div className="lg:col-span-2 bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Cadastro Hierárquico de Endereços
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Setor &rarr; Rua &rarr; Prédio &rarr; Nível &rarr; Posição
                </p>
              </div>

              {onNavigateToLabels && (
                <button
                  type="button"
                  onClick={onNavigateToLabels}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-semibold text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                >
                  <Printer size={13} className="text-[var(--collab-mostarda)]" />
                  <span>Imprimir Etiquetas</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-[var(--muted)] border-b border-[var(--card-border)] sticky top-0 bg-[var(--card)]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Setor/Rua/Prédio</th>
                    <th className="py-2.5 px-3">Nível</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Capacidade</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {enderecos.map((end) => (
                    <tr key={end.id} className="hover:bg-[var(--background)]/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[var(--foreground)]">
                        {end.codigo}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--muted)]">
                        Setor {end.setor} • R{end.rua} • P{end.predio}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        N{end.nivel}-P{end.posicao}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ENDERECO_TIPO_CONFIG[end.tipo]?.bgBadge}`}>
                          {ENDERECO_TIPO_CONFIG[end.tipo]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--muted)]">
                        {end.peso_atual_kg}/{end.peso_max_kg}kg
                      </td>
                      <td className="py-2.5 px-3">
                        {end.status === "bloqueado" ? (
                          <span className="text-[10px] font-bold text-red-400">Bloqueado</span>
                        ) : end.status === "livre" ? (
                          <span className="text-[10px] font-bold text-emerald-400">Livre</span>
                        ) : (
                          <span className="text-[10px] font-bold text-sky-400">Ocupado</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEnderecoSelecionado(end)}
                          className="p-1 rounded hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL / DRAWER DE DETALHES DO ENDEREÇO ───────────────────────────── */}
      {enderecoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--card)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)] font-mono">
                    {enderecoSelecionado.codigo}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {ENDERECO_TIPO_CONFIG[enderecoSelecionado.tipo]?.label} • Setor {enderecoSelecionado.setor} • Rua {enderecoSelecionado.rua} • Prédio {enderecoSelecionado.predio} • Nível {enderecoSelecionado.nivel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnderecoSelecionado(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status e Capacidade */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Status Atual</span>
                  <span
                    className={`font-bold text-xs uppercase ${
                      enderecoSelecionado.status === "bloqueado"
                        ? "text-red-400"
                        : enderecoSelecionado.status === "livre"
                        ? "text-emerald-400"
                        : "text-sky-400"
                    }`}
                  >
                    {enderecoSelecionado.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Capacidade Peso</span>
                  <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                    {enderecoSelecionado.peso_atual_kg} / {enderecoSelecionado.peso_max_kg} kg
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Capacidade Volume</span>
                  <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                    {enderecoSelecionado.volume_atual_m3.toFixed(2)} / {enderecoSelecionado.volume_max_m3} m³
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Curva ABC Permitida</span>
                  <span className="font-bold text-xs text-[var(--collab-mostarda)]">
                    {enderecoSelecionado.curva_abc_permitida}
                  </span>
                </div>
              </div>

              {/* Informações de Bloqueio se houver */}
              {enderecoSelecionado.status === "bloqueado" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-400">
                    <Lock size={14} />
                    <span>Endereço Bloqueado Operacionalmente</span>
                  </div>
                  <p>{enderecoSelecionado.motivo_bloqueio}</p>
                  <p className="text-[10px] text-[var(--muted)]">
                    Bloqueado por {enderecoSelecionado.bloqueado_por || "Gestor"} em{" "}
                    {enderecoSelecionado.bloqueado_em
                      ? new Date(enderecoSelecionado.bloqueado_em).toLocaleString("pt-BR")
                      : ""}
                  </p>
                </div>
              )}

              {/* Produtos Alocados */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs text-[var(--foreground)] uppercase tracking-wider">
                  Produtos Alocados ({enderecoSelecionado.produtos_alocados.length})
                </h4>

                {enderecoSelecionado.produtos_alocados.length === 0 ? (
                  <p className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--muted)] text-center">
                    Nenhum produto estocado neste endereço. Posição livre para armazenagem.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {enderecoSelecionado.produtos_alocados.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[var(--foreground)]">
                              {prod.codigo}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)]">
                              Curva {prod.curva_abc}
                            </span>
                          </div>
                          <p className="text-[var(--muted)]">{prod.descricao}</p>
                          <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] font-mono">
                            <span>Lote: {prod.lote}</span>
                            <span>Validade: {prod.data_validade || "Indeterminada"}</span>
                            <span>Sem giro: {prod.dias_sem_movimentacao} dias</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-black text-sm text-[var(--foreground)] block">
                              {prod.quantidade} {prod.unidade_medida}
                            </span>
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              {(prod.quantidade * prod.peso_unit_kg).toFixed(1)} kg
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleIniciarMovimentacaoDeEndereco(enderecoSelecionado, prod)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                          >
                            Mover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-between bg-[var(--card)]">
              {enderecoSelecionado.status === "bloqueado" ? (
                <button
                  type="button"
                  onClick={handleDesbloquearEndereco}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock size={14} />
                  <span>Desbloquear Endereço</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalBloqueioAberto(true)}
                  className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Bloquear Endereço</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {onNavigateToLabels && (
                  <button
                    type="button"
                    onClick={onNavigateToLabels}
                    className="px-3.5 py-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} className="text-[var(--collab-mostarda)]" />
                    <span>Imprimir Etiqueta</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleIniciarMovimentacaoDeEndereco(enderecoSelecionado)}
                  className="px-4 py-2 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-heading font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Nova Movimentação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE JUSTIFICATIVA DE BLOQUEIO */}
      {modalBloqueioAberto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-heading font-bold text-sm">
              <Lock size={16} />
              <span>Bloquear Endereço {enderecoSelecionado?.codigo}</span>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Endereços bloqueados ficam interditados para novas alocações e não podem receber movimentações de picking ou armazenagem.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Motivo / Justificativa do Bloqueio *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Longarina danificada, vazamento de produto, manutenção..."
                value={motivoBloqueioInput}
                onChange={(e) => setMotivoBloqueioInput(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalBloqueioAberto(false)}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBloquearEndereco}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
              >
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
