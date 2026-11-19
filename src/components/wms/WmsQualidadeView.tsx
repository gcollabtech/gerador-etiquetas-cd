"use client";

import { useState, useEffect, useMemo } from "react";
import { PortalUser } from "@/lib/authTypes";
import {
  InspecaoQualidade,
  NaoConformidadeQualidade,
  BloqueioQualidade,
  IndicadoresQualidade,
  DestinacaoQualidade,
  TipoBloqueioQualidade,
  TipoOcorrenciaNC,
  TipoInspecao,
  StatusInspecao,
} from "@/lib/wmsQualidadeTypes";
import {
  fetchQualidadeData,
  submitNovaInspecao,
  submitNovaNaoConformidade,
  submitNovoBloqueio,
  submitDesbloqueio,
  submitDestinacaoRnc,
} from "@/lib/wmsQualidadeService";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  Thermometer,
  Truck,
  Package,
  Layers,
  MapPin,
  Lock,
  Unlock,
  FileText,
  RotateCcw,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Building2,
  UserCheck,
  Ban,
  Check,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface WmsQualidadeViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

export function WmsQualidadeView({
  currentUser,
  onNavigateToLabels,
}: WmsQualidadeViewProps) {
  const [activeTab, setActiveTab] = useState<
    "inspecoes" | "rnc" | "bloqueios" | "destinacoes" | "indicadores"
  >("inspecoes");

  const [loading, setLoading] = useState(true);
  const [inspecoes, setInspecoes] = useState<InspecaoQualidade[]>([]);
  const [naoConformidades, setNaoConformidades] = useState<NaoConformidadeQualidade[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioQualidade[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresQualidade | null>(null);

  // Filtros
  const [buscaTermo, setBuscaTermo] = useState("");
  const [filtroStatusInspecao, setFiltroStatusInspecao] = useState<string>("todos");
  const [filtroTipoBloqueio, setFiltroTipoBloqueio] = useState<string>("todos");

  // Modais
  const [modalNovaInspecaoOpen, setModalNovaInspecaoOpen] = useState(false);
  const [modalNovaRncOpen, setModalNovaRncOpen] = useState(false);
  const [modalNovoBloqueioOpen, setModalNovoBloqueioOpen] = useState(false);
  const [modalDesbloqueioItem, setModalDesbloqueioItem] = useState<BloqueioQualidade | null>(null);
  const [modalDestinacaoRncItem, setModalDestinacaoRncItem] = useState<NaoConformidadeQualidade | null>(null);
  const [modalFotoVisualizar, setModalFotoVisualizar] = useState<{ url: string; legenda: string } | null>(null);

  // Estados dos formulários dos modais
  // Nova Inspeção
  const [formTipoInspecao, setFormTipoInspecao] = useState<TipoInspecao>("amostragem");
  const [formOrigemInspecao, setFormOrigemInspecao] = useState<"recebimento" | "armazenado_cd">("recebimento");
  const [formProdutoDesc, setFormProdutoDesc] = useState("Refrigerante Cola Pet 2L");
  const [formSku, setFormSku] = useState("COLA-2L");
  const [formLote, setFormLote] = useState("L-2026-900");
  const [formValidade, setFormValidade] = useState("2027-01-30");
  const [formFornecedorNome, setFormFornecedorNome] = useState("Distribuidora Bebidas Brasil");
  const [formFornecedorCnpj, setFormFornecedorCnpj] = useState("12.345.678/0001-99");
  const [formNumeroNf, setFormNumeroNf] = useState("004912");
  const [formEndereco, setFormEndereco] = useState("R01-P02-N01-A01");
  const [formQtdTotal, setFormQtdTotal] = useState("600");
  const [formQtdAmostra, setFormQtdAmostra] = useState("50");
  const [formUnidade, setFormUnidade] = useState("UN");
  const [formTempAferida, setFormTempAferida] = useState("");
  const [formTempMin, setFormTempMin] = useState("");
  const [formTempMax, setFormTempMax] = useState("");
  const [formParecerInspecao, setFormParecerInspecao] = useState("Inspeção visual preliminar em conformidade.");
  
  // Checklist interativo
  const [checkEmbalagem, setCheckEmbalagem] = useState(true);
  const [checkValidade, setCheckValidade] = useState(true);
  const [checkLote, setCheckLote] = useState(true);
  const [checkIdentificacao, setCheckIdentificacao] = useState(true);
  const [checkFisico, setCheckFisico] = useState(true);
  const [checkVeiculoHigienizado, setCheckVeiculoHigienizado] = useState(true);
  const [checkAusenciaOdores, setCheckAusenciaOdores] = useState(true);
  const [checkBauTermico, setCheckBauTermico] = useState(true);

  // Nova RNC Manual
  const [rncProdutoDesc, setRncProdutoDesc] = useState("");
  const [rncSku, setRncSku] = useState("");
  const [rncLote, setRncLote] = useState("");
  const [rncFornecedor, setRncFornecedor] = useState("");
  const [rncCnpj, setRncCnpj] = useState("");
  const [rncNf, setRncNf] = useState("");
  const [rncQtd, setRncQtd] = useState("");
  const [rncUn, setRncUn] = useState("UN");
  const [rncTipoOcorrencia, setRncTipoOcorrencia] = useState<TipoOcorrenciaNC>("avaria_embalagem");
  const [rncFotoUrl, setRncFotoUrl] = useState("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80");
  const [rncFotoLegenda, setRncFotoLegenda] = useState("Embalagem amassada com vazamento");
  const [rncParecer, setRncParecer] = useState("");
  const [rncDestinacao, setRncDestinacao] = useState<DestinacaoQualidade>("aguardando_analise");
  const [rncEndereco, setRncEndereco] = useState("R01-P01-N01-A01");
  const [rncBloquearEstoque, setRncBloquearEstoque] = useState(true);

  // Novo Bloqueio Manual
  const [blqTipo, setBlqTipo] = useState<TipoBloqueioQualidade>("produto");
  const [blqMotivo, setBlqMotivo] = useState("");
  const [blqSku, setBlqSku] = useState("");
  const [blqProdDesc, setBlqProdDesc] = useState("");
  const [blqLote, setBlqLote] = useState("");
  const [blqEndereco, setBlqEndereco] = useState("");
  const [blqNf, setBlqNf] = useState("");
  const [blqQtd, setBlqQtd] = useState("");

  // Desbloqueio
  const [desbloqueioJustificativa, setDesbloqueioJustificativa] = useState("");

  // Destinação RNC
  const [destNovaDestinacao, setDestNovaDestinacao] = useState<DestinacaoQualidade>("devolucao_fornecedor");
  const [destParecer, setDestParecer] = useState("");
  const [destLiberarBloqueio, setDestLiberarBloqueio] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetchQualidadeData();
      setInspecoes(res.inspecoes);
      setNaoConformidades(res.naoConformidades);
      setBloqueios(res.bloqueios);
      setIndicadores(res.indicadores);
    } catch (err) {
      console.error("Erro ao carregar dados de Qualidade:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Submissão de Nova Inspeção
  const handleCriarInspecao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdutoDesc || !formSku || !formLote) {
      showToast("Preencha os campos obrigatórios do produto.", "error");
      return;
    }

    const tempAferidaNum = formTempAferida ? parseFloat(formTempAferida) : undefined;
    const tempMinNum = formTempMin ? parseFloat(formTempMin) : undefined;
    const tempMaxNum = formTempMax ? parseFloat(formTempMax) : undefined;

    const res = await submitNovaInspecao({
      tipoInspecao: formTipoInspecao,
      origem: formOrigemInspecao,
      inspetor: currentUser?.name || "Inspetor de Qualidade CD",
      produtoId: `prod-${formSku.toLowerCase()}`,
      produtoDescricao: formProdutoDesc,
      sku: formSku,
      lote: formLote,
      validade: formValidade,
      fornecedorNome: formFornecedorNome,
      fornecedorCnpj: formFornecedorCnpj,
      numeroNotaFiscal: formNumeroNf,
      enderecoArmazenamento: formEndereco,
      quantidadeTotalLote: parseInt(formQtdTotal) || 100,
      quantidadeInspecionada: parseInt(formQtdAmostra) || 10,
      unidadeMedida: formUnidade,
      temperaturaAferida: tempAferidaNum,
      temperaturaMinExigida: tempMinNum,
      temperaturaMaxExigida: tempMaxNum,
      condicoesTransporte: {
        veiculoHigienizado: checkVeiculoHigienizado,
        ausenciaOdoresPragas: checkAusenciaOdores,
        bauFechadoTermico: checkBauTermico,
      },
      checklist: {
        integridadeEmbalagem: checkEmbalagem,
        validadeConforme: checkValidade,
        loteLegivel: checkLote,
        identificacaoRotulagem: checkIdentificacao,
        condicoesFisicas: checkFisico,
      },
      parecerTecnico: formParecerInspecao,
    });

    if (res.success) {
      showToast(`Inspeção ${res.inspecao?.codigoInspecao} concluída com sucesso!`);
      setModalNovaInspecaoOpen(false);
      carregarDados();
    } else {
      showToast(res.error || "Erro ao registrar inspeção.", "error");
    }
  };

  // Submissão de Nova RNC
  const handleCriarRnc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rncProdutoDesc || !rncSku || !rncLote || !rncParecer) {
      showToast("Preencha descrição, SKU, lote e o parecer técnico.", "error");
      return;
    }

    const res = await submitNovaNaoConformidade({
      produtoId: `prod-${rncSku.toLowerCase()}`,
      produtoDescricao: rncProdutoDesc,
      sku: rncSku,
      lote: rncLote,
      fornecedorNome: rncFornecedor || "Fornecedor Parceiro",
      fornecedorCnpj: rncCnpj || "00.000.000/0001-00",
      numeroNotaFiscal: rncNf || "000000",
      quantidadeAfetada: parseInt(rncQtd) || 1,
      unidadeMedida: rncUn,
      tipoOcorrencia: rncTipoOcorrencia,
      fotos: rncFotoUrl ? [{ legenda: rncFotoLegenda, url: rncFotoUrl }] : [],
      responsavel: currentUser?.name || "Analista de Qualidade",
      parecer: rncParecer,
      destinacao: rncDestinacao,
      endereco: rncEndereco,
      bloquearEstoque: rncBloquearEstoque,
    });

    if (res.success) {
      showToast(`RNC ${res.rnc?.codigoRnc} registrada com sucesso!`);
      setModalNovaRncOpen(false);
      carregarDados();
    } else {
      showToast(res.error || "Erro ao registrar RNC.", "error");
    }
  };

  // Submissão de Novo Bloqueio Manual
  const handleCriarBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blqMotivo) {
      showToast("O motivo do bloqueio é obrigatório.", "error");
      return;
    }

    const res = await submitNovoBloqueio({
      tipoBloqueio: blqTipo,
      motivo: blqMotivo,
      produtoId: blqSku ? `prod-${blqSku.toLowerCase()}` : undefined,
      sku: blqSku || undefined,
      produtoDescricao: blqProdDesc || undefined,
      lote: blqLote || undefined,
      endereco: blqEndereco || undefined,
      numeroNotaFiscal: blqNf || undefined,
      quantidadeBloqueada: blqQtd ? parseInt(blqQtd) : undefined,
      unidadeMedida: "UN",
      responsavel: currentUser?.name || "Controle de Qualidade CD",
    });

    if (res.success) {
      showToast(`Bloqueio ${res.bloqueio?.codigoBloqueio} ativado! Impede picking e expedição.`);
      setModalNovoBloqueioOpen(false);
      carregarDados();
    } else {
      showToast(res.error || "Erro ao ativar bloqueio.", "error");
    }
  };

  // Desbloqueio
  const handleConfirmarDesbloqueio = async () => {
    if (!modalDesbloqueioItem) return;
    if (!desbloqueioJustificativa || desbloqueioJustificativa.trim().length < 5) {
      showToast("Justificativa obrigatória (mínimo 5 caracteres).", "error");
      return;
    }

    const res = await submitDesbloqueio({
      bloqueioId: modalDesbloqueioItem.id,
      responsavel: currentUser?.name || "Gestor de Qualidade",
      justificativa: desbloqueioJustificativa,
    });

    if (res.success) {
      showToast(`Item desbloqueado com sucesso! Saldo liberado no WMS.`);
      setModalDesbloqueioItem(null);
      setDesbloqueioJustificativa("");
      carregarDados();
    } else {
      showToast(res.error || "Erro ao desbloquear item.", "error");
    }
  };

  // Submissão de Destinação RNC
  const handleConfirmarDestinacao = async () => {
    if (!modalDestinacaoRncItem) return;
    if (!destParecer || destParecer.trim().length < 5) {
      showToast("Parecer técnico obrigatório.", "error");
      return;
    }

    const res = await submitDestinacaoRnc({
      rncId: modalDestinacaoRncItem.id,
      destinacao: destNovaDestinacao,
      responsavel: currentUser?.name || "Garantia da Qualidade",
      parecer: destParecer,
      liberarBloqueioAssociado: destLiberarBloqueio,
    });

    if (res.success) {
      showToast(
        res.protocoloGerado
          ? `Destinação concluída com protocolo: ${res.protocoloGerado}`
          : "Destinação atualizada com sucesso!"
      );
      setModalDestinacaoRncItem(null);
      setDestParecer("");
      carregarDados();
    } else {
      showToast(res.error || "Erro ao aplicar destinação.", "error");
    }
  };

  // Badges e helpers visuais
  const getStatusInspecaoBadge = (st: StatusInspecao) => {
    switch (st) {
      case "aprovado":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><CheckCircle2 size={12} /> Aprovado</span>;
      case "aprovado_com_ressalvas":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30"><Info size={12} /> Aprovado c/ Ressalvas</span>;
      case "quarentena":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"><AlertTriangle size={12} /> Quarentena</span>;
      case "rejeitado":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30"><XCircle size={12} /> Rejeitado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30"><Clock size={12} /> Pendente</span>;
    }
  };

  const getDestinacaoBadge = (dest?: DestinacaoQualidade) => {
    switch (dest) {
      case "liberado":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><Check size={11} /> Liberado</span>;
      case "devolucao_fornecedor":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30"><RotateCcw size={11} /> Devolução Fornecedor</span>;
      case "aguardando_analise":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"><Clock size={11} /> Aguardando Análise</span>;
      case "descarte_autorizado":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-600/15 text-red-400 border border-red-600/30"><Trash2 size={11} /> Descarte Autorizado</span>;
      case "bloqueio_definitivo":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30"><Ban size={11} /> Bloqueio Definitivo</span>;
      default:
        return <span className="text-xs text-[var(--muted)]">-</span>;
    }
  };

  const getTipoOcorrenciaLabel = (t: TipoOcorrenciaNC) => {
    const map: Record<TipoOcorrenciaNC, string> = {
      avaria_embalagem: "Avaria de Embalagem",
      validade_curta_ou_vencida: "Validade Curta / Vencida",
      embalagem_violada_ou_umida: "Embalagem Violada / Úmida",
      temperatura_inadequada: "Temperatura Inadequada",
      contaminacao_ou_praga: "Contaminação / Praga",
      divergencia_rotulo_ou_ean: "Divergência de Rótulo / EAN",
      lote_incompativel: "Lote Incompatível",
      transporte_inadequado: "Condições de Transporte",
      outros: "Outras Ocorrências",
    };
    return map[t] || t;
  };

  // Filtros
  const inspecoesFiltradas = useMemo(() => {
    return inspecoes.filter((i) => {
      const matchBusca =
        !buscaTermo ||
        i.codigoInspecao.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        i.produtoDescricao.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        i.sku.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        i.lote.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        i.fornecedorNome.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        i.numeroNotaFiscal.includes(buscaTermo);
      const matchStatus = filtroStatusInspecao === "todos" || i.status === filtroStatusInspecao;
      return matchBusca && matchStatus;
    });
  }, [inspecoes, buscaTermo, filtroStatusInspecao]);

  const bloqueiosFiltrados = useMemo(() => {
    return bloqueios.filter((b) => {
      const matchTipo = filtroTipoBloqueio === "todos" || b.tipoBloqueio === filtroTipoBloqueio;
      const matchBusca =
        !buscaTermo ||
        b.codigoBloqueio.toLowerCase().includes(buscaTermo.toLowerCase()) ||
        (b.sku && b.sku.toLowerCase().includes(buscaTermo.toLowerCase())) ||
        (b.lote && b.lote.toLowerCase().includes(buscaTermo.toLowerCase())) ||
        (b.endereco && b.endereco.toLowerCase().includes(buscaTermo.toLowerCase())) ||
        b.motivo.toLowerCase().includes(buscaTermo.toLowerCase());
      return matchTipo && matchBusca;
    });
  }, [bloqueios, filtroTipoBloqueio, buscaTermo]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium animate-bounce ${
            toastMsg.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
              : "bg-rose-950/90 border-rose-500 text-rose-200"
          }`}
        >
          {toastMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header do Módulo */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  MÓDULO 09
                </span>
                <h1 className="text-xl font-heading font-black text-[var(--foreground)]">
                  Controle de Qualidade
                </h1>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Inspeção de entrada (amostragem/integral), checklist de frio/transporte, RNCs e travas automáticas de estoque
              </p>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalNovaInspecaoOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Nova Inspeção</span>
            </button>
            <button
              type="button"
              onClick={() => setModalNovaRncOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Camera size={14} />
              <span>Registrar RNC</span>
            </button>
            <button
              type="button"
              onClick={() => setModalNovoBloqueioOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Lock size={14} />
              <span>Bloquear Estoque</span>
            </button>
          </div>
        </div>

        {/* Alerta de Governança Crítica */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            <span>
              <strong>Regra de Bloqueio Operacional:</strong> Qualquer produto, lote, endereço ou quantidade com bloqueio ativo é{" "}
              <strong>automaticamente bloqueado para separação, transferência para picking e expedição</strong>.
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            Trava WMS Ativa
          </span>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      {indicadores && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[var(--muted)]">Taxa Conformidade</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">{indicadores.taxaConformidade}%</span>
              <span className="text-[10px] text-[var(--muted)]">do CD</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${indicadores.taxaConformidade}%` }}
              />
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[var(--muted)]">Inspeções Totais</span>
            <span className="text-2xl font-black text-[var(--foreground)] mt-1">{indicadores.totalInspecoes}</span>
            <span className="text-[10px] text-emerald-400 mt-2 font-mono">
              {indicadores.inspecoesAprovadas} aprovadas ({indicadores.inspecoesRejeitadas} rejeitadas)
            </span>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[var(--muted)]">Em Quarentena</span>
            <span className="text-2xl font-black text-amber-400 mt-1">{indicadores.inspecoesQuarentena}</span>
            <span className="text-[10px] text-[var(--muted)] mt-2">Aguardando laudo técnico</span>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[var(--muted)]">RNCs em Aberto</span>
            <span className="text-2xl font-black text-rose-400 mt-1">{indicadores.rncsAbertas}</span>
            <span className="text-[10px] text-rose-400/80 mt-2">Com fotos e parecer</span>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[var(--muted)]">Bloqueios Ativos</span>
            <span className="text-2xl font-black text-amber-400 mt-1">{indicadores.totalBloqueiosAtivos}</span>
            <span className="text-[10px] text-[var(--muted)] mt-2 font-mono">
              {indicadores.skusBloqueados} SKUs / {indicadores.lotesBloqueados} lotes
            </span>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[var(--muted)]">Devoluções (RTV)</span>
            <span className="text-2xl font-black text-sky-400 mt-1">{indicadores.devolucoesPendentes}</span>
            <span className="text-[10px] text-[var(--muted)] mt-2">Protocolos gerados</span>
          </div>
        </div>
      )}

      {/* Navegação entre Abas */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto pb-1">
        {[
          { id: "inspecoes", label: "Inspeções & Checklist", icon: ShieldCheck, badge: inspecoes.length },
          { id: "rnc", label: "Não Conformidades (RNC)", icon: Camera, badge: naoConformidades.length },
          { id: "bloqueios", label: "Gestão de Bloqueios", icon: Lock, badge: bloqueios.filter((b) => b.ativo).length },
          { id: "destinacoes", label: "Destinações & Pareceres", icon: RotateCcw, badge: undefined },
          { id: "indicadores", label: "Auditoria & Indicadores", icon: FileText, badge: undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[var(--card)] text-emerald-400 border-t-2 border-emerald-500 border-x border-[var(--card-border)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-emerald-300 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── ABA 1: INSPEÇÕES & CHECKLIST (Item 9.2) ─────────────────────────── */}
      {activeTab === "inspecoes" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--card)] p-3 rounded-xl border border-[var(--card-border)]">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar por código, produto, SKU, lote, fornecedor..."
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-[var(--muted)]" />
              <select
                value={filtroStatusInspecao}
                onChange={(e) => setFiltroStatusInspecao(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="aprovado">Aprovados</option>
                <option value="quarentena">Quarentena</option>
                <option value="rejeitado">Rejeitados</option>
              </select>
            </div>
          </div>

          {/* Tabela de Inspeções */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--secondary)] border-b border-[var(--card-border)] text-[var(--muted)] font-semibold">
                    <th className="p-3">Código</th>
                    <th className="p-3">Tipo / Origem</th>
                    <th className="p-3">Produto / SKU</th>
                    <th className="p-3">Lote / Validade</th>
                    <th className="p-3">Amostragem</th>
                    <th className="p-3">Checklist 9.2</th>
                    <th className="p-3">Temperatura</th>
                    <th className="p-3">Status / Destinação</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {inspecoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[var(--muted)]">
                        Nenhuma inspeção encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    inspecoesFiltradas.map((ins) => (
                      <tr key={ins.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {ins.codigoInspecao}
                          <div className="text-[10px] text-[var(--muted)] font-normal">{ins.dataHora}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            ins.tipoInspecao === "integral"
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                          }`}>
                            {ins.tipoInspecao}
                          </span>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5">
                            {ins.origem === "recebimento" ? "Recebimento NF" : "Estoque CD"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[var(--foreground)]">{ins.produtoDescricao}</div>
                          <div className="text-[10px] text-[var(--muted)] font-mono">
                            SKU: {ins.sku} | NF: {ins.numeroNotaFiscal}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] truncate max-w-[180px]">{ins.fornecedorNome}</div>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-black/20 text-xs font-semibold">{ins.lote}</span>
                          <div className="text-[10px] text-[var(--muted)] mt-1">Val: {ins.validade}</div>
                          {ins.enderecoArmazenamento && (
                            <div className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1">
                              <MapPin size={10} /> {ins.enderecoArmazenamento}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          <div className="font-bold">{ins.quantidadeInspecionada} / {ins.quantidadeTotalLote} {ins.unidadeMedida}</div>
                          <div className="text-[10px] text-[var(--muted)]">
                            {Math.round((ins.quantidadeInspecionada / ins.quantidadeTotalLote) * 100)}% da carga
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-[150px]">
                            <span
                              title="Integridade da Embalagem"
                              className={`p-1 rounded text-[10px] font-mono ${
                                ins.checklist.integridadeEmbalagem ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              Emb
                            </span>
                            <span
                              title="Validade e Lote"
                              className={`p-1 rounded text-[10px] font-mono ${
                                ins.checklist.validadeConforme ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              Val
                            </span>
                            <span
                              title="Identificação / Rotulagem"
                              className={`p-1 rounded text-[10px] font-mono ${
                                ins.checklist.identificacaoRotulagem ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              Rot
                            </span>
                            <span
                              title="Condições Físicas"
                              className={`p-1 rounded text-[10px] font-mono ${
                                ins.checklist.condicoesFisicas ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              Fis
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {ins.temperaturaAferida !== undefined ? (
                            <div className="flex items-center gap-1.5">
                              <Thermometer
                                size={14}
                                className={ins.checklist.temperaturaConforme ? "text-emerald-400" : "text-rose-400"}
                              />
                              <div>
                                <span className="font-mono font-bold text-xs">{ins.temperaturaAferida}°C</span>
                                {ins.temperaturaMaxExigida && (
                                  <div className="text-[9px] text-[var(--muted)]">Max {ins.temperaturaMaxExigida}°C</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--muted)] font-mono">Ambiente</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div>{getStatusInspecaoBadge(ins.status)}</div>
                          <div className="mt-1">{getDestinacaoBadge(ins.destinacaoFinal)}</div>
                        </td>
                        <td className="p-3 text-right">
                          {ins.temNaoConformidade ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab("rnc")}
                              className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <AlertTriangle size={11} /> Ver RNC
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono">Conforme</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 2: NÃO CONFORMIDADES (Item 9.3) ──────────────────────────────── */}
      {activeTab === "rnc" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[var(--card)] p-3 rounded-xl border border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-rose-400" />
              <div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">Relatório de Não Conformidades (RNC)</h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Registro detalhado de desvios, evidências fotográficas, parecer técnico e destinações
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalNovaRncOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} /> Nova RNC
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {naoConformidades.map((rnc) => (
              <div
                key={rnc.id}
                className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-rose-400 text-sm">{rnc.codigoRnc}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                        {getTipoOcorrenciaLabel(rnc.tipoOcorrencia)}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)]">{rnc.dataHora}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-[var(--foreground)] text-sm">{rnc.produtoDescricao}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--muted)]">
                      <div>
                        <strong>SKU:</strong> <span className="font-mono">{rnc.sku}</span>
                      </div>
                      <div>
                        <strong>Lote:</strong> <span className="font-mono">{rnc.lote}</span>
                      </div>
                      <div>
                        <strong>Qtd Afetada:</strong>{" "}
                        <span className="font-mono font-bold text-rose-400">
                          {rnc.quantidadeAfetada} {rnc.unidadeMedida}
                        </span>
                      </div>
                      <div>
                        <strong>Nota Fiscal:</strong> <span className="font-mono">{rnc.numeroNotaFiscal}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate">
                      <strong>Fornecedor:</strong> {rnc.fornecedorNome} ({rnc.fornecedorCnpj})
                    </div>
                  </div>

                  {/* Parecer Técnico */}
                  <div className="mt-3 p-2.5 rounded-xl bg-black/20 border border-[var(--card-border)] text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                      Parecer Técnico ({rnc.responsavel}):
                    </div>
                    <p className="text-[var(--foreground)] text-[11px] leading-relaxed italic">
                      &quot;{rnc.parecer}&quot;
                    </p>
                  </div>

                  {/* Fotos / Evidências Fotográficas (Item 9.3) */}
                  {rnc.fotos && rnc.fotos.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1 flex items-center gap-1">
                        <Camera size={11} /> Evidências Fotográficas ({rnc.fotos.length})
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {rnc.fotos.map((foto) => (
                          <div
                            key={foto.id}
                            onClick={() => setModalFotoVisualizar({ url: foto.url, legenda: foto.legenda })}
                            className="relative group cursor-pointer w-24 h-16 rounded-lg overflow-hidden border border-[var(--card-border)] shrink-0"
                          >
                            <img
                              src={foto.url}
                              alt={foto.legenda}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye size={14} className="text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                  {/* Rodapé do Card com Destinação e Ações */}
                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block">Destinação Atual:</span>
                    {getDestinacaoBadge(rnc.destinacao)}
                    {rnc.protocoloDevolucaoRtv && (
                      <div className="text-[10px] font-mono text-rose-400 font-bold mt-0.5">
                        {rnc.protocoloDevolucaoRtv}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalDestinacaoRncItem(rnc);
                        setDestNovaDestinacao(rnc.destinacao);
                        setDestParecer("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--card-border)] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Destinar / Laudo</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA 3: GESTÃO DE BLOQUEIOS (Item 9.4) ───────────────────────────── */}
      {activeTab === "bloqueios" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--card)] p-3 rounded-xl border border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-amber-400" />
              <div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">Travas de Estoque & Quarentena</h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Bloqueios ativos impedem separação, transferência para picking e expedição
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filtroTipoBloqueio}
                onChange={(e) => setFiltroTipoBloqueio(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
              >
                <option value="todos">Todos os Tipos de Bloqueio</option>
                <option value="produto">Produto (SKU Inteiro)</option>
                <option value="lote">Lote Específico</option>
                <option value="endereco">Endereço Físico</option>
                <option value="quantidade_parcial">Quantidade Parcial</option>
                <option value="nota_fiscal">Nota Fiscal</option>
              </select>
              <button
                type="button"
                onClick={() => setModalNovoBloqueioOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Novo Bloqueio
              </button>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--secondary)] border-b border-[var(--card-border)] text-[var(--muted)] font-semibold">
                    <th className="p-3">Código</th>
                    <th className="p-3">Tipo de Bloqueio</th>
                    <th className="p-3">Elemento Afetado</th>
                    <th className="p-3">Motivo / Parecer</th>
                    <th className="p-3">Travas WMS</th>
                    <th className="p-3">Criado Por</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {bloqueiosFiltrados.map((blq) => (
                    <tr key={blq.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {blq.codigoBloqueio}
                        <div className="text-[10px] text-[var(--muted)] font-normal">{blq.criadoEm}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                          {blq.tipoBloqueio.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        {blq.sku && <div className="font-bold text-[var(--foreground)]">{blq.produtoDescricao || blq.sku}</div>}
                        {blq.lote && <div className="text-[11px] font-mono text-purple-400">Lote: {blq.lote}</div>}
                        {blq.endereco && (
                          <div className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                            <MapPin size={11} /> Endereço: {blq.endereco}
                          </div>
                        )}
                        {blq.quantidadeBloqueada !== undefined && (
                          <div className="text-[11px] font-mono text-amber-400">
                            Qtd: {blq.quantidadeBloqueada} {blq.unidadeMedida}
                          </div>
                        )}
                        {blq.numeroNotaFiscal && (
                          <div className="text-[10px] font-mono text-[var(--muted)]">NF: {blq.numeroNotaFiscal}</div>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-[var(--foreground)] max-w-xs">
                        {blq.motivo}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 text-[10px] font-mono">
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <Ban size={10} /> Não separa (Picking)
                          </span>
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <Ban size={10} /> Não transfere
                          </span>
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <Ban size={10} /> Não expede
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div>{blq.criadoPor}</div>
                        {blq.desbloqueadoPor && (
                          <div className="text-[10px] text-emerald-400 mt-1">
                            Desbloq: {blq.desbloqueadoPor} ({blq.desbloqueadoEm})
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {blq.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Lock size={11} /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Unlock size={11} /> Liberado
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {blq.ativo ? (
                          <button
                            type="button"
                            onClick={() => {
                              setModalDesbloqueioItem(blq);
                              setDesbloqueioJustificativa("");
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Unlock size={12} /> Desbloquear
                          </button>
                        ) : (
                          <span className="text-[10px] text-[var(--muted)] font-mono">Desbloqueado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 4: DESTINAÇÕES & PARECERES (Item 9.5) ────────────────────────── */}
      {activeTab === "destinacoes" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--card-border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCcw size={20} className="text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">Fluxo de Destinações & Laudos Oficiais</h3>
                <p className="text-xs text-[var(--muted)]">
                  Aprovação de saídas para devolução (RTV), descarte sanitário, liberação controlada ou bloqueio definitivo
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Devoluções a Fornecedores */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                <span className="font-bold text-xs text-rose-400 flex items-center gap-1.5">
                  <RotateCcw size={14} /> Devolução ao Fornecedor
                </span>
                <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">
                  {naoConformidades.filter((r) => r.destinacao === "devolucao_fornecedor").length} Casos
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Emissão automática de RTV (Relatório Técnico de Devolução) para transporte reverso com retenção fiscal.
              </p>
              <div className="space-y-2">
                {naoConformidades
                  .filter((r) => r.destinacao === "devolucao_fornecedor")
                  .map((r) => (
                    <div key={r.id} className="p-2.5 rounded-lg bg-black/20 border border-[var(--card-border)] text-xs">
                      <div className="flex items-center justify-between font-mono font-bold text-rose-400">
                        <span>{r.codigoRnc}</span>
                        <span>{r.protocoloDevolucaoRtv || "RTV Pendente"}</span>
                      </div>
                      <div className="font-semibold text-[var(--foreground)] mt-1">{r.produtoDescricao}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {r.quantidadeAfetada} {r.unidadeMedida} | Forn: {r.fornecedorNome}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Box 2: Descarte Autorizado */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                <span className="font-bold text-xs text-red-400 flex items-center gap-1.5">
                  <Trash2 size={14} /> Descarte Autorizado
                </span>
                <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">
                  {naoConformidades.filter((r) => r.destinacao === "descarte_autorizado").length} Casos
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Itens com avaria irrecuperável ou contaminação biológica/química com autorização formal de baixa.
              </p>
              <div className="space-y-2">
                {naoConformidades.filter((r) => r.destinacao === "descarte_autorizado").length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--muted)]">Nenhum lote descartado.</div>
                ) : (
                  naoConformidades
                    .filter((r) => r.destinacao === "descarte_autorizado")
                    .map((r) => (
                      <div key={r.id} className="p-2.5 rounded-lg bg-black/20 border border-[var(--card-border)] text-xs">
                        <div className="flex items-center justify-between font-mono font-bold text-red-400">
                          <span>{r.codigoRnc}</span>
                          <span>{r.laudoDescarte}</span>
                        </div>
                        <div className="font-semibold text-[var(--foreground)] mt-1">{r.produtoDescricao}</div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Box 3: Quarentena & Análise Técnica */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                  <Clock size={14} /> Aguardando Análise
                </span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold">
                  {naoConformidades.filter((r) => r.destinacao === "aguardando_analise").length} Casos
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Segregação no setor de Quarentena aguardando contraprova laboratorial ou parecer do fabricante.
              </p>
              <div className="space-y-2">
                {naoConformidades
                  .filter((r) => r.destinacao === "aguardando_analise")
                  .map((r) => (
                    <div key={r.id} className="p-2.5 rounded-lg bg-black/20 border border-[var(--card-border)] text-xs">
                      <div className="flex items-center justify-between font-mono font-bold text-amber-400">
                        <span>{r.codigoRnc}</span>
                        <span className="text-[10px] text-amber-400">Em Quarentena</span>
                      </div>
                      <div className="font-semibold text-[var(--foreground)] mt-1">{r.produtoDescricao}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {r.quantidadeAfetada} {r.unidadeMedida} | Lote: {r.lote}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 5: AUDITORIA & INDICADORES ─────────────────────────────────── */}
      {activeTab === "indicadores" && indicadores && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Matriz de Conformidade de Entrada
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--muted)]">Aprovados Direto:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {indicadores.inspecoesAprovadas} ({indicadores.taxaConformidade}%)
                    </span>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${indicadores.taxaConformidade}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--muted)]">Encaminhados para Quarentena:</span>
                    <span className="font-mono font-bold text-amber-400">{indicadores.inspecoesQuarentena}</span>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${(indicadores.inspecoesQuarentena / (indicadores.totalInspecoes || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--muted)]">Rejeições Críticas:</span>
                    <span className="font-mono font-bold text-rose-400">{indicadores.inspecoesRejeitadas}</span>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${(indicadores.inspecoesRejeitadas / (indicadores.totalInspecoes || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
              <h3 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                <Lock size={18} className="text-amber-400" /> Auditoria de Travas de Estoque WMS
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Segurança operacional de armazém: nenhum operador ou rotina automatizada consegue movimentar SKUs ou lotes retidos pelo CQ.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)]">SKUs Bloqueados</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">{indicadores.skusBloqueados}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)]">Lotes Bloqueados</span>
                  <div className="text-xl font-bold font-mono text-purple-400 mt-1">{indicadores.lotesBloqueados}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)]">Endereços Travados</span>
                  <div className="text-xl font-bold font-mono text-sky-400 mt-1">{indicadores.enderecosBloqueados}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)]">Total Travas Ativas</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{indicadores.totalBloqueiosAtivos}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVA INSPEÇÃO (Item 9.2) ─────────────────────────────────── */}
      {modalNovaInspecaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Nova Inspeção de Qualidade (Item 9.2)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Checklist físico, conferência térmica e regras de amostragem</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaInspecaoOpen(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarInspecao} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Tipo de Inspeção
                  </label>
                  <select
                    value={formTipoInspecao}
                    onChange={(e) => setFormTipoInspecao(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  >
                    <option value="amostragem">Amostragem (NBR 5426)</option>
                    <option value="integral">Inspeção Integral (100%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Origem</label>
                  <select
                    value={formOrigemInspecao}
                    onChange={(e) => setFormOrigemInspecao(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  >
                    <option value="recebimento">Recebimento de Mercadorias (Docas)</option>
                    <option value="armazenado_cd">Estoque Armazenado no CD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Produto / Descrição</label>
                  <input
                    type="text"
                    value={formProdutoDesc}
                    onChange={(e) => setFormProdutoDesc(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">SKU</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Lote</label>
                  <input
                    type="text"
                    value={formLote}
                    onChange={(e) => setFormLote(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Validade</label>
                  <input
                    type="date"
                    value={formValidade}
                    onChange={(e) => setFormValidade(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Qtd Total Lote</label>
                  <input
                    type="number"
                    value={formQtdTotal}
                    onChange={(e) => setFormQtdTotal(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Qtd Amostra</label>
                  <input
                    type="number"
                    value={formQtdAmostra}
                    onChange={(e) => setFormQtdAmostra(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={formFornecedorNome}
                    onChange={(e) => setFormFornecedorNome(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Nota Fiscal</label>
                  <input
                    type="text"
                    value={formNumeroNf}
                    onChange={(e) => setFormNumeroNf(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Endereço (R-P-N-A)</label>
                  <input
                    type="text"
                    value={formEndereco}
                    onChange={(e) => setFormEndereco(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Checklist de Verificação (Item 9.2) */}
              <div className="p-3.5 rounded-xl bg-black/20 border border-[var(--card-border)] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Checklist de Conformidade Física (Item 9.2)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkEmbalagem}
                      onChange={(e) => setCheckEmbalagem(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span>Integridade da Embalagem</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkValidade}
                      onChange={(e) => setCheckValidade(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span>Validade Adequada (Shelf Life)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkLote}
                      onChange={(e) => setCheckLote(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span>Lote Legível e Rastreável</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkIdentificacao}
                      onChange={(e) => setCheckIdentificacao(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span>Identificação / Rotulagem / EAN</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkFisico}
                      onChange={(e) => setCheckFisico(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0"
                    />
                    <span>Condições Físicas (Sem amasso/umidade)</span>
                  </label>
                </div>
              </div>

              {/* Temperatura & Transporte (Item 9.2) */}
              <div className="p-3.5 rounded-xl bg-black/20 border border-[var(--card-border)] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Thermometer size={13} /> Temperatura e Transporte (Quando Aplicável)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] mb-1">Temp. Aferida (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 4.5"
                      value={formTempAferida}
                      onChange={(e) => setFormTempAferida(e.target.value)}
                      className="w-full p-1.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] mb-1">Temp. Mínima Exigida</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 2.0"
                      value={formTempMin}
                      onChange={(e) => setFormTempMin(e.target.value)}
                      className="w-full p-1.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] mb-1">Temp. Máxima Exigida</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 8.0"
                      value={formTempMax}
                      onChange={(e) => setFormTempMax(e.target.value)}
                      className="w-full p-1.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkVeiculoHigienizado}
                      onChange={(e) => setCheckVeiculoHigienizado(e.target.checked)}
                    />
                    <span>Veículo Higienizado</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAusenciaOdores}
                      onChange={(e) => setCheckAusenciaOdores(e.target.checked)}
                    />
                    <span>Sem Odores / Pragas</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkBauTermico}
                      onChange={(e) => setCheckBauTermico(e.target.checked)}
                    />
                    <span>Baú Fechado / Térmico</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Parecer Técnico</label>
                <textarea
                  value={formParecerInspecao}
                  onChange={(e) => setFormParecerInspecao(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  placeholder="Observações do inspetor de qualidade..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setModalNovaInspecaoOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Concluir e Emitir Laudo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVA RNC (Item 9.3) ───────────────────────────────────────── */}
      {modalNovaRncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Registro de Não Conformidade (Item 9.3)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Anexo de fotos, ocorrência e bloqueio automático</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaRncOpen(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarRnc} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Produto</label>
                  <input
                    type="text"
                    value={rncProdutoDesc}
                    onChange={(e) => setRncProdutoDesc(e.target.value)}
                    placeholder="Ex: Iogurte Natural 170g"
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">SKU</label>
                  <input
                    type="text"
                    value={rncSku}
                    onChange={(e) => setRncSku(e.target.value)}
                    placeholder="Ex: IOG-NAT"
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Lote</label>
                  <input
                    type="text"
                    value={rncLote}
                    onChange={(e) => setRncLote(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Qtd Afetada</label>
                  <input
                    type="number"
                    value={rncQtd}
                    onChange={(e) => setRncQtd(e.target.value)}
                    placeholder="Ex: 15"
                    required
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Endereço R-P-N-A</label>
                  <input
                    type="text"
                    value={rncEndereco}
                    onChange={(e) => setRncEndereco(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={rncFornecedor}
                    onChange={(e) => setRncFornecedor(e.target.value)}
                    placeholder="Nome do Fornecedor"
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Nota Fiscal</label>
                  <input
                    type="text"
                    value={rncNf}
                    onChange={(e) => setRncNf(e.target.value)}
                    placeholder="Número da NF"
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Tipo de Ocorrência</label>
                  <select
                    value={rncTipoOcorrencia}
                    onChange={(e) => setRncTipoOcorrencia(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  >
                    <option value="avaria_embalagem">Avaria de Embalagem</option>
                    <option value="validade_curta_ou_vencida">Validade Curta ou Vencida</option>
                    <option value="embalagem_violada_ou_umida">Embalagem Violada / Úmida</option>
                    <option value="temperatura_inadequada">Temperatura Inadequada</option>
                    <option value="contaminacao_ou_praga">Contaminação ou Praga</option>
                    <option value="divergencia_rotulo_ou_ean">Divergência de Rótulo / EAN</option>
                    <option value="lote_incompativel">Lote Incompatível</option>
                    <option value="outros">Outros Desvios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Destinação Sugerida</label>
                  <select
                    value={rncDestinacao}
                    onChange={(e) => setRncDestinacao(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                  >
                    <option value="aguardando_analise">Aguardando Análise (Quarentena)</option>
                    <option value="devolucao_fornecedor">Devolução ao Fornecedor</option>
                    <option value="descarte_autorizado">Descarte Autorizado</option>
                    <option value="bloqueio_definitivo">Bloqueio Definitivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Parecer Técnico</label>
                <textarea
                  value={rncParecer}
                  onChange={(e) => setRncParecer(e.target.value)}
                  rows={2}
                  required
                  placeholder="Descreva o defeito, avaria ou laudo técnico..."
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                />
              </div>

              {/* Registro de Foto */}
              <div className="p-3 rounded-xl bg-black/20 border border-[var(--card-border)] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Camera size={13} /> Evidência Fotográfica
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] mb-1">URL da Imagem / Foto</label>
                    <input
                      type="text"
                      value={rncFotoUrl}
                      onChange={(e) => setRncFotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-1.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] mb-1">Legenda da Foto</label>
                    <input
                      type="text"
                      value={rncFotoLegenda}
                      onChange={(e) => setRncFotoLegenda(e.target.value)}
                      placeholder="Ex: Foto do dano lateral"
                      className="w-full p-1.5 rounded bg-[var(--background)] border border-[var(--card-border)] text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                  <input
                    type="checkbox"
                    checked={rncBloquearEstoque}
                    onChange={(e) => setRncBloquearEstoque(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Bloquear quantidade no WMS imediatamente (impede picking)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setModalNovaRncOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Registrar RNC e Ativar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVO BLOQUEIO MANUAL (Item 9.4) ───────────────────────────── */}
      {modalNovoBloqueioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Bloqueio Manual de Estoque (Item 9.4)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">Bloquear Produto, Lote, Endereço ou NF</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoBloqueioOpen(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarBloqueio} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                  Tipo de Bloqueio
                </label>
                <select
                  value={blqTipo}
                  onChange={(e) => setBlqTipo(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                >
                  <option value="produto">Produto (SKU Inteiro)</option>
                  <option value="lote">Lote Específico</option>
                  <option value="endereco">Endereço R-P-N-A (Estrutura física)</option>
                  <option value="quantidade_parcial">Quantidade Parcial (Segregação)</option>
                  <option value="nota_fiscal">Nota Fiscal Inteira</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                  Motivo / Justificativa do Bloqueio
                </label>
                <textarea
                  value={blqMotivo}
                  onChange={(e) => setBlqMotivo(e.target.value)}
                  rows={2}
                  required
                  placeholder="Ex: Suspeita de contaminação, auditoria externa ou manutenção de montante..."
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
                />
              </div>

              {(blqTipo === "produto" || blqTipo === "lote" || blqTipo === "quantidade_parcial") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">SKU</label>
                    <input
                      type="text"
                      value={blqSku}
                      onChange={(e) => setBlqSku(e.target.value)}
                      placeholder="Ex: LEITE-UHT-1L"
                      className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Lote</label>
                    <input
                      type="text"
                      value={blqLote}
                      onChange={(e) => setBlqLote(e.target.value)}
                      placeholder="Ex: L-2026-88A"
                      className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {(blqTipo === "endereco" || blqTipo === "quantidade_parcial") && (
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Endereço CD (R-P-N-A)
                  </label>
                  <input
                    type="text"
                    value={blqEndereco}
                    onChange={(e) => setBlqEndereco(e.target.value)}
                    placeholder="Ex: R01-P02-N01-A01"
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                  />
                </div>
              )}

              {blqTipo === "quantidade_parcial" && (
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Quantidade a Bloquear
                  </label>
                  <input
                    type="number"
                    value={blqQtd}
                    onChange={(e) => setBlqQtd(e.target.value)}
                    placeholder="Ex: 50"
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                  />
                </div>
              )}

              {blqTipo === "nota_fiscal" && (
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Número da Nota Fiscal
                  </label>
                  <input
                    type="text"
                    value={blqNf}
                    onChange={(e) => setBlqNf(e.target.value)}
                    placeholder="Ex: 001452"
                    className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono"
                  />
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                <Ban size={13} className="inline mr-1" />
                Esta ação impede que o saldo seja selecionado em ondas de picking, transferências ou romaneios de saída.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setModalNovoBloqueioOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Ativar Trava no Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DESBLOQUEIO DE ITEM ──────────────────────────────────────── */}
      {modalDesbloqueioItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <Unlock size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">Liberar Bloqueio</h3>
                <span className="font-mono text-xs text-amber-400">{modalDesbloqueioItem.codigoBloqueio}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Motivo do bloqueio original: <em>&quot;{modalDesbloqueioItem.motivo}&quot;</em>
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                Justificativa Obrigatória do Desbloqueio
              </label>
              <textarea
                value={desbloqueioJustificativa}
                onChange={(e) => setDesbloqueioJustificativa(e.target.value)}
                rows={3}
                placeholder="Ex: Laudo laboratorial aprovou o lote sem riscos sanitários..."
                className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalDesbloqueioItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDesbloqueio}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Confirmar e Liberar no WMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DESTINAÇÃO DA RNC (Item 9.5) ───────────────────────────────── */}
      {modalDestinacaoRncItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <RotateCcw size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Destinação Técnica da RNC (Item 9.5)
                </h3>
                <span className="font-mono text-xs text-rose-400">{modalDestinacaoRncItem.codigoRnc}</span>
              </div>
            </div>

            <div className="text-xs text-[var(--muted)]">
              Produto: <strong>{modalDestinacaoRncItem.produtoDescricao}</strong> (Lote: {modalDestinacaoRncItem.lote})
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">Destinação Oficial</label>
              <select
                value={destNovaDestinacao}
                onChange={(e) => setDestNovaDestinacao(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
              >
                <option value="devolucao_fornecedor">Devolução ao Fornecedor (Gera RTV)</option>
                <option value="descarte_autorizado">Descarte Autorizado (Gera Laudo Sanitário)</option>
                <option value="liberado">Liberado para Comercialização</option>
                <option value="aguardando_analise">Aguardando Análise (Manter Quarentena)</option>
                <option value="bloqueio_definitivo">Bloqueio Definitivo (Retenção SEFAZ/Jurídico)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                Parecer de Conclusão / Aprovação
              </label>
              <textarea
                value={destParecer}
                onChange={(e) => setDestParecer(e.target.value)}
                rows={3}
                placeholder="Parecer do responsável técnico sobre a decisão..."
                className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)]"
              />
            </div>

            {destNovaDestinacao === "liberado" && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-400">
                <input
                  type="checkbox"
                  checked={destLiberarBloqueio}
                  onChange={(e) => setDestLiberarBloqueio(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span>Desbloquear automaticamente saldo retido associado</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setModalDestinacaoRncItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDestinacao}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Gravar Parecer e Destinação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VISUALIZADOR DE FOTO ─────────────────────────────────────── */}
      {modalFotoVisualizar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setModalFotoVisualizar(null)}
        >
          <div
            className="max-w-2xl bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalFotoVisualizar.url} alt={modalFotoVisualizar.legenda} className="w-full max-h-[70vh] object-contain" />
            <div className="p-4 bg-[var(--card)] flex items-center justify-between">
              <span className="text-xs text-[var(--foreground)] font-medium">{modalFotoVisualizar.legenda}</span>
              <button
                type="button"
                onClick={() => setModalFotoVisualizar(null)}
                className="px-3 py-1 rounded-lg bg-[var(--secondary)] text-xs font-semibold cursor-pointer"
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
