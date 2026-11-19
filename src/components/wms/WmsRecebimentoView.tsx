"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  RecebimentoNfe,
  RecebimentoItem,
  DivergenciaRegistro,
  DivergenciaTipo,
  DIVERGENCIA_LABELS,
  STATUS_NF_CONFIG,
  NfStatus,
  ErpNfeInfo,
  ERP_SIMULADOR_NFES,
  TarefaArmazenagem,
} from "@/lib/wmsRecebimentoTypes";
import {
  fetchRecebimentosApi,
  consultarErpNfeApi,
  salvarRecebimentoApi,
  finalizarRecebimentoApi,
  processarBipagemItem,
} from "@/lib/wmsRecebimentoService";
import { PortalUser } from "@/lib/authTypes";
import {
  Truck,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Camera,
  ShieldAlert,
  Boxes,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Building2,
  RefreshCw,
  Eye,
  Sliders,
  Send,
  Upload,
  Check,
  X,
  Printer,
  Ban,
  PackageCheck,
  PackageX,
  ScanBarcode,
  Keyboard,
  Info,
  ClipboardCheck,
  Image as ImageIcon,
} from "lucide-react";

interface WmsRecebimentoViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

type RecebimentoSubTab = "fila" | "leitor_danfe" | "conferencia" | "quarentena" | "finalizacao";

export function WmsRecebimentoView({
  currentUser,
  onNavigateToLabels,
}: WmsRecebimentoViewProps) {
  const [activeTab, setActiveTab] = useState<RecebimentoSubTab>("fila");

  // Lista de Recebimentos
  const [recebimentos, setRecebimentos] = useState<RecebimentoNfe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [buscaTermo, setBuscaTermo] = useState("");

  // Recebimento ativo em conferência
  const [activeRecebimento, setActiveRecebimento] = useState<RecebimentoNfe | null>(null);

  // Estados do Leitor DANFE
  const [chaveDanfeInput, setChaveDanfeInput] = useState("");
  const [isConsultingErp, setIsConsultingErp] = useState(false);
  const [erpResult, setErpResult] = useState<{
    sucesso: boolean;
    mensagem: string;
    nfe?: ErpNfeInfo;
    bloqueio?: boolean;
    motivo_bloqueio?: string;
  } | null>(null);
  const [docaDesignada, setDocaDesignada] = useState("Doca 01");
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Estados da Conferência Física
  const [codigoLeituraInput, setCodigoLeituraInput] = useState("");
  const [modoLeitura, setModoLeitura] = useState<"caixa_master" | "ean" | "sku" | "manual">("caixa_master");
  const [qtdManualInput, setQtdManualInput] = useState<number>(1);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualItemTarget, setManualItemTarget] = useState<RecebimentoItem | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Modal de Divergência / Quarentena
  const [isDivergenciaModalOpen, setIsDivergenciaModalOpen] = useState(false);
  const [divergenciaItemTarget, setDivergenciaItemTarget] = useState<RecebimentoItem | null>(null);
  const [divTipo, setDivTipo] = useState<DivergenciaTipo>("qtd_menor");
  const [divQtd, setDivQtd] = useState<number>(1);
  const [divObs, setDivObs] = useState("");
  const [divFotoUrl, setDivFotoUrl] = useState<string | null>(null);

  // Notificações
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  const isSupervisorOrManager = useMemo(() => {
    if (!currentUser) return true; // padrão seguro ou admin
    return currentUser.role === "admin" || currentUser.role === "supervisor";
  }, [currentUser]);

  // Carregar lista de recebimentos
  const loadRecebimentos = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRecebimentosApi();
      setRecebimentos(data);
      // Se não houver ativo, seleciona o primeiro em recebimento como exemplo
      if (!activeRecebimento && data.length > 0) {
        const emAndamento = data.find((r) => r.status === "em_recebimento") || data[0];
        setActiveRecebimento(emAndamento || null);
      }
    } catch (err: any) {
      console.error("Erro ao carregar recebimentos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecebimentos();
  }, []);

  // Filtragem da Fila
  const filteredRecebimentos = useMemo(() => {
    return recebimentos.filter((r) => {
      const matchesStatus = filtroStatus === "todos" || r.status === filtroStatus;
      const term = buscaTermo.toLowerCase().trim();
      const matchesSearch =
        !term ||
        r.numero_nfe.toLowerCase().includes(term) ||
        r.chave_nfe.includes(term) ||
        r.fornecedor_nome.toLowerCase().includes(term) ||
        r.pedido_compra.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [recebimentos, filtroStatus, buscaTermo]);

  // ── Consulta e Validação de DANFE 44 Dígitos no ERP ────────────────────
  const handleConsultarDanfe = async (chaveToTest?: string) => {
    const chave = (chaveToTest || chaveDanfeInput).replace(/\D/g, "");
    if (!chave) {
      setToastMsg({ text: "Informe a chave de 44 dígitos da DANFE.", type: "warning" });
      return;
    }

    setIsConsultingErp(true);
    setErpResult(null);
    try {
      const result = await consultarErpNfeApi(chave);
      setErpResult(result);
      if (result.sucesso) {
        setToastMsg({ text: result.mensagem, type: "success" });
      } else {
        setToastMsg({ text: result.mensagem, type: "error" });
      }
    } catch (err: any) {
      setErpResult({
        sucesso: false,
        mensagem: err.message || "Erro de comunicação com o ERP.",
        bloqueio: true,
        motivo_bloqueio: "Falha de conexão com a API do ERP.",
      });
    } finally {
      setIsConsultingErp(false);
    }
  };

  // ── Iniciar Recebimento após Validação do ERP ──────────────────────────
  const handleIniciarRecebimento = async () => {
    if (!erpResult?.nfe || !erpResult.sucesso) return;

    const nfe = erpResult.nfe;
    const novoRecebimento: RecebimentoNfe = {
      id: `rec-${Date.now()}`,
      chave_nfe: nfe.chave_nfe,
      numero_nfe: nfe.numero_nfe,
      serie_nfe: nfe.serie_nfe,
      data_emissao: nfe.data_emissao,
      fornecedor_nome: nfe.fornecedor_nome,
      fornecedor_cnpj: nfe.fornecedor_cnpj,
      pedido_compra: nfe.pedido_compra,
      valor_total: nfe.valor_total,
      doca: docaDesignada,
      status: "em_recebimento",
      operador_id: currentUser?.id || "usr-01",
      operador_nome: currentUser?.name || "Operador CD",
      data_inicio: new Date().toISOString(),
      erp_status: "validado",
      erp_protocolo: `ERP-OK-${Date.now().toString().slice(-5)}`,
      itens: nfe.itens.map((it, idx) => ({
        id: `it-${Date.now()}-${idx}`,
        cod_produto: it.cod_produto,
        descricao: it.descricao,
        ean: it.ean,
        codigo_caixa_master: it.codigo_caixa_master,
        fator_conversao: it.fator_conversao,
        qtd_nota: it.qtd_nota,
        qtd_conferida: 0,
        qtd_caixas_recebidas: 0,
        unidade_medida: it.unidade_medida,
        lote: it.lote_sugerido,
        data_validade: new Date(Date.now() + it.validade_meses * 30 * 24 * 3600 * 1000)
          .toISOString()
          .slice(0, 10),
        endereco_destino: it.endereco_sugerido,
        status_conferencia: "pendente",
      })),
      divergencias: [],
      tarefas_armazenagem: [],
      created_at: new Date().toISOString(),
    };

    try {
      const saved = await salvarRecebimentoApi(novoRecebimento);
      setRecebimentos((prev) => [saved, ...prev]);
      setActiveRecebimento(saved);
      setActiveTab("conferencia");
      setToastMsg({
        text: `Recebimento da NF ${saved.numero_nfe} iniciado com sucesso na ${saved.doca}!`,
        type: "success",
      });
    } catch (err: any) {
      setToastMsg({ text: err.message || "Erro ao iniciar recebimento.", type: "error" });
    }
  };

  // ── Bipagem Contínua via Coletor / Scanner ─────────────────────────────
  const handleProcessarLeitura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecebimento) return;
    if (!codigoLeituraInput.trim()) return;

    const result = processarBipagemItem(
      activeRecebimento.itens,
      codigoLeituraInput,
      { modoForcado: modoLeitura }
    );

    if (result.unidadesAdicionadas > 0) {
      const updatedRec: RecebimentoNfe = {
        ...activeRecebimento,
        itens: result.itensAtualizados,
        status: "em_recebimento",
      };
      setActiveRecebimento(updatedRec);
      salvarRecebimentoApi(updatedRec); // salva em segundo plano
      setToastMsg({ text: result.mensagem, type: "success" });
    } else {
      setToastMsg({ text: result.mensagem, type: "error" });
    }

    setCodigoLeituraInput("");
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  // ── Digitação Manual (Mediante Permissão) ──────────────────────────────
  const handleConfirmarManual = () => {
    if (!activeRecebimento || !manualItemTarget) return;

    if (!isSupervisorOrManager) {
      setToastMsg({
        text: "Permissão insuficiente: digitação manual restrita a supervisores e coordenadores.",
        type: "error",
      });
      return;
    }

    const result = processarBipagemItem(
      activeRecebimento.itens,
      manualItemTarget.cod_produto,
      {
        modoForcado: "manual",
        quantidadeManual: qtdManualInput,
      }
    );

    const updatedRec: RecebimentoNfe = {
      ...activeRecebimento,
      itens: result.itensAtualizados,
    };
    setActiveRecebimento(updatedRec);
    salvarRecebimentoApi(updatedRec);

    setIsManualModalOpen(false);
    setManualItemTarget(null);
    setToastMsg({
      text: `Entrada manual de ${qtdManualInput} un registrada para "${manualItemTarget.descricao}"!`,
      type: "success",
    });
  };

  // ── Apontar Divergência e Quarentena (Requisito 2.5) ────────────────────
  const handleRegistrarDivergencia = () => {
    if (!activeRecebimento || !divergenciaItemTarget) return;

    const novaDiv: DivergenciaRegistro = {
      id: `div-${Date.now()}`,
      item_id: divergenciaItemTarget.id,
      cod_produto: divergenciaItemTarget.cod_produto,
      descricao: divergenciaItemTarget.descricao,
      tipo: divTipo,
      qtd_divergente: divQtd,
      observacao: divObs,
      foto_url: divFotoUrl || undefined,
      operador_id: currentUser?.id || "usr-01",
      operador_nome: currentUser?.name || "Operador CD",
      data_registro: new Date().toISOString(),
      status: "quarentena",
    };

    // Marca item como divergente
    const itensAtualizados = activeRecebimento.itens.map((it) =>
      it.id === divergenciaItemTarget.id ? { ...it, status_conferencia: "divergente" as const } : it
    );

    const updatedRec: RecebimentoNfe = {
      ...activeRecebimento,
      itens: itensAtualizados,
      divergencias: [novaDiv, ...(activeRecebimento.divergencias || [])],
      status: "quarentena", // Direciona para quarentena imediatamente
    };

    setActiveRecebimento(updatedRec);
    salvarRecebimentoApi(updatedRec);

    setIsDivergenciaModalOpen(false);
    setDivergenciaItemTarget(null);
    setDivObs("");
    setDivFotoUrl(null);
    setToastMsg({
      text: `Ocorrência registrada! Produto direcionado para Quarentena (${DIVERGENCIA_LABELS[divTipo].label}).`,
      type: "warning",
    });
  };

  // ── Decisão do Supervisor na Quarentena (Requisito 2.5) ─────────────────
  const handleResolverDivergencia = (
    divId: string,
    acao: "aprovar_com_ressalva" | "devolver_ao_fornecedor" | "descarte" | "ajustar_nota",
    motivo: string
  ) => {
    if (!activeRecebimento) return;
    if (!isSupervisorOrManager) {
      setToastMsg({
        text: "Apenas supervisores e gerentes podem tomar decisões sobre quarentena.",
        type: "error",
      });
      return;
    }

    const divs = activeRecebimento.divergencias.map((d) => {
      if (d.id === divId) {
        return {
          ...d,
          status: "liberada" as const,
          decisao_gestor: {
            responsavel_id: currentUser?.id || "usr-02",
            responsavel_nome: currentUser?.name || "Supervisor Logística",
            responsavel_cargo: currentUser?.cargo || "Supervisor",
            data_decisao: new Date().toISOString(),
            acao,
            motivo,
          },
        };
      }
      return d;
    });

    const todasResolvidas = divs.every((d) => d.status !== "quarentena");
    const updatedRec: RecebimentoNfe = {
      ...activeRecebimento,
      divergencias: divs,
      status: todasResolvidas ? "aguardando_armazenagem" : "quarentena",
    };

    setActiveRecebimento(updatedRec);
    salvarRecebimentoApi(updatedRec);
    setToastMsg({ text: `Decisão de gestor registrada (${acao})!`, type: "success" });
  };

  // ── Finalização & Armazenagem (Requisito 2.6) ───────────────────────────
  const handleFinalizar = async () => {
    if (!activeRecebimento) return;

    try {
      const res = await finalizarRecebimentoApi(activeRecebimento.id, {
        supervisorNome: currentUser?.name,
      });

      setActiveRecebimento(res.recebimento);
      setRecebimentos((prev) =>
        prev.map((r) => (r.id === res.recebimento.id ? res.recebimento : r))
      );
      setActiveTab("finalizacao");
      setToastMsg({
        text: `Recebimento finalizado com sucesso! Protocolo ERP: ${res.protocoloErp}. ${res.recebimento.tarefas_armazenagem.length} tarefas de armazenagem geradas.`,
        type: "success",
      });
    } catch (err: any) {
      setToastMsg({ text: err.message || "Erro ao finalizar recebimento.", type: "error" });
    }
  };

  // Totalizadores da conferência física atual
  const statsConferencia = useMemo(() => {
    if (!activeRecebimento) return { totalNota: 0, totalConferido: 0, progresso: 0, pendentes: 0 };
    const totalNota = activeRecebimento.itens.reduce((acc, it) => acc + it.qtd_nota, 0);
    const totalConferido = activeRecebimento.itens.reduce((acc, it) => acc + it.qtd_conferida, 0);
    const progresso = totalNota > 0 ? Math.min(100, Math.round((totalConferido / totalNota) * 100)) : 0;
    const pendentes = activeRecebimento.itens.filter((it) => it.qtd_conferida < it.qtd_nota).length;
    return { totalNota, totalConferido, progresso, pendentes };
  }, [activeRecebimento]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
            toastMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : toastMsg.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : toastMsg.type === "warning" ? (
              <AlertTriangle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header do Módulo 02 */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center shrink-0">
              <PackageCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-[var(--foreground)]">
                  Módulo 02 — Recebimento de Mercadorias
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
                  WMS • Entrada Física & Fiscal
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Conferência de DANFE 44 dígitos com validação ERP, bipagem por Caixa Master com fator de conversão, quarentena de divergências e armazenagem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("leitor_danfe")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <ScanBarcode size={15} />
              <span>Ler DANFE (Novo Recebimento)</span>
            </button>
          </div>
        </div>

        {/* Sub-Abas do Módulo 02 */}
        <div className="flex items-center gap-2 border-t border-[var(--card-border)] pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("fila")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "fila"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <Truck size={15} />
            <span>1. Fila de Cargas & Status</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-black/10 dark:bg-white/10">
              {recebimentos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leitor_danfe")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "leitor_danfe"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <ScanBarcode size={15} />
            <span>2. Leitor DANFE & ERP</span>
            {erpResult?.sucesso && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("conferencia")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "conferencia"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <Barcode size={15} />
            <span>3. Conferência Física na Doca</span>
            {activeRecebimento && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-black/10 dark:bg-white/10">
                {statsConferencia.progresso}%
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quarentena")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "quarentena"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <ShieldAlert size={15} />
            <span>4. Quarentena & Divergências</span>
            {activeRecebimento && activeRecebimento.divergencias.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-red-500 text-white">
                {activeRecebimento.divergencias.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finalizacao")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "finalizacao"
                ? "bg-[var(--collab-mostarda)] text-[#080808] shadow-sm"
                : "bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]"
            }`}
          >
            <Boxes size={15} />
            <span>5. Finalização & Armazenagem</span>
            {activeRecebimento?.tarefas_armazenagem?.length ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-cyan-500/20 text-cyan-500">
                {activeRecebimento.tarefas_armazenagem.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-ABA 1: FILA DE CARGAS & STATUS OPERACIONAL DA NF-E            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "fila" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                type="text"
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                placeholder="Buscar por NF, Chave 44 dígitos, Fornecedor ou Pedido..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] font-semibold focus:outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="agendada">Agendada</option>
                <option value="em_doca">Em Doca</option>
                <option value="em_recebimento">Em Recebimento</option>
                <option value="quarentena">Quarentena</option>
                <option value="aguardando_armazenagem">Aguardando Armazenagem</option>
                <option value="recebido">Recebido</option>
                <option value="divergencia_pendente">Divergência Pendente</option>
              </select>

              <button
                type="button"
                onClick={loadRecebimentos}
                className="p-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all cursor-pointer"
                title="Recarregar"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Tabela de Recebimentos */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] border-b border-[var(--card-border)] text-[var(--muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Nota Fiscal / Pedido</th>
                    <th className="py-3 px-4">Fornecedor & CNPJ</th>
                    <th className="py-3 px-4">Doca / Operador</th>
                    <th className="py-3 px-4">Itens & Progresso</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {filteredRecebimentos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                        Nenhum recebimento encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredRecebimentos.map((r) => {
                      const cfgStatus = STATUS_NF_CONFIG[r.status] || STATUS_NF_CONFIG.em_recebimento;
                      const totalItens = r.itens.length;
                      const conferidos = r.itens.filter((it) => it.status_conferencia === "conferido_ok").length;
                      const hasDiv = r.divergencias && r.divergencias.length > 0;

                      return (
                        <tr key={r.id} className="hover:bg-[var(--secondary)]/40 transition-colors">
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${cfgStatus.bg} ${cfgStatus.text} ${cfgStatus.border}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{cfgStatus.label}</span>
                            </span>
                            {hasDiv && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                {r.divergencias.length} div.
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[var(--foreground)] text-xs">
                              NF {r.numero_nfe}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              PC: {r.pedido_compra || "—"} • Chave: ...{r.chave_nfe.slice(-8)}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate">
                            <div className="font-semibold text-[var(--foreground)] truncate">
                              {r.fornecedor_nome}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              {r.fornecedor_cnpj}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--foreground)]">
                              {r.doca || "Doca não atribuída"}
                            </div>
                            <div className="text-[10px] text-[var(--muted)]">
                              {r.operador_nome || "—"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                                {conferidos}/{totalItens} itens
                              </span>
                            </div>
                            <div className="w-24 h-1.5 bg-[var(--background)] rounded-full mt-1 overflow-hidden border border-[var(--card-border)]">
                              <div
                                className="h-full bg-[var(--collab-mostarda)] rounded-full transition-all"
                                style={{
                                  width: `${totalItens > 0 ? (conferidos / totalItens) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecebimento(r);
                                setActiveTab("conferencia");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-sm cursor-pointer transition-all"
                            >
                              Conferir Doca
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

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-ABA 2: LEITOR DANFE & VALIDAÇÃO COM O ERP                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "leitor_danfe" && (
        <div className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[var(--card-border)] pb-4">
              <h2 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                <ScanBarcode className="text-[var(--collab-mostarda)]" size={20} />
                <span>Leitura e Conferência da Nota Fiscal (DANFE)</span>
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Utilize o leitor óptico coletor ou informe a chave de 44 dígitos da NF-e para validação no ERP.
              </p>
            </div>

            {/* Input da Chave de Acesso */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--foreground)] block">
                Chave de Acesso da NF-e (44 dígitos numéricos):
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <ScanBarcode
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    type="text"
                    maxLength={44}
                    value={chaveDanfeInput}
                    onChange={(e) => setChaveDanfeInput(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConsultarDanfe();
                    }}
                    placeholder="Ex: 35261112345678000199550010000123451098765432"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono font-bold tracking-wider text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isConsultingErp}
                    onClick={() => handleConsultarDanfe()}
                    className="px-5 py-3 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw size={15} className={isConsultingErp ? "animate-spin" : ""} />
                    <span>Consultar ERP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    className="px-4 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] font-semibold text-xs transition-all cursor-pointer flex items-center gap-2"
                    title="Ativar câmera do dispositivo"
                  >
                    <Camera size={16} />
                    <span>Câmera</span>
                  </button>
                </div>
              </div>

              {/* Botões de Chaves Simuladas para Testes Rápidos */}
              <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-2">
                <div className="text-[11px] font-bold text-[var(--muted)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[var(--collab-mostarda)]" />
                  <span>Simulações de Validação de Regras do ERP (Clique para testar):</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setChaveDanfeInput("35261112345678000199550010000123451098765432");
                      handleConsultarDanfe("35261112345678000199550010000123451098765432");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/20 cursor-pointer"
                  >
                    NF Autorizada (Distribuidora Nacional)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChaveDanfeInput("35261122334455000188550010000987651012345678");
                      handleConsultarDanfe("35261122334455000188550010000987651012345678");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/20 cursor-pointer"
                  >
                    NF Autorizada (Química Paulista)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChaveDanfeInput("35261199999999000177550010000666661099999999");
                      handleConsultarDanfe("35261199999999000177550010000666661099999999");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/20 cursor-pointer"
                  >
                    Teste: NF Cancelada na SEFAZ (Bloqueio)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChaveDanfeInput("35261188888888000166550010000777771088888888");
                      handleConsultarDanfe("35261188888888000166550010000777771088888888");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold hover:bg-amber-500/20 cursor-pointer"
                  >
                    Teste: NF Já Recebida (Duplicidade)
                  </button>
                </div>
              </div>
            </div>

            {/* Simulação da Câmera do Dispositivo */}
            {isCameraActive && (
              <div className="p-6 bg-black rounded-2xl border border-[var(--card-border)] text-center space-y-4 animate-in fade-in">
                <div className="w-64 h-48 mx-auto border-2 border-dashed border-emerald-500/60 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500 animate-bounce" />
                  <ScanBarcode size={48} className="text-emerald-500/40" />
                  <span className="text-[11px] text-emerald-400 mt-2 font-mono">
                    Aponte o código de barras da DANFE...
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setChaveDanfeInput("35261112345678000199550010000123451098765432");
                      handleConsultarDanfe("35261112345678000199550010000123451098765432");
                      setIsCameraActive(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                  >
                    Simular Captura Óptica da DANFE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-semibold text-xs"
                  >
                    Fechar Câmera
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resultado da Validação no ERP */}
          {erpResult && (
            <div
              className={`p-6 rounded-2xl border shadow-sm space-y-5 animate-in fade-in ${
                erpResult.sucesso
                  ? "bg-[var(--card)] border-emerald-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
                <div className="flex items-center gap-3">
                  {erpResult.sucesso ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                      <Ban size={22} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                      {erpResult.sucesso ? "Nota Fiscal Apta ao Recebimento" : "Recebimento Bloqueado pelo ERP"}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">{erpResult.mensagem}</p>
                  </div>
                </div>

                {erpResult.bloqueio && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    BLOQUEIO FISCAL REGULATÓRIO
                  </span>
                )}
              </div>

              {/* Se a nota for válida, exibe os dados e itens carregados automaticamente */}
              {erpResult.nfe && erpResult.sucesso && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                      <span className="text-[10px] text-[var(--muted)] block">Número NF-e:</span>
                      <strong className="text-sm font-mono text-[var(--foreground)]">
                        {erpResult.nfe.numero_nfe}
                      </strong>
                    </div>
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                      <span className="text-[10px] text-[var(--muted)] block">Pedido de Compra:</span>
                      <strong className="text-sm font-mono text-emerald-400">
                        {erpResult.nfe.pedido_compra}
                      </strong>
                    </div>
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                      <span className="text-[10px] text-[var(--muted)] block">Fornecedor / CNPJ:</span>
                      <strong className="text-xs text-[var(--foreground)] truncate block">
                        {erpResult.nfe.fornecedor_nome}
                      </strong>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {erpResult.nfe.fornecedor_cnpj}
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                      <span className="text-[10px] text-[var(--muted)] block">Doca para Descarregamento:</span>
                      <select
                        value={docaDesignada}
                        onChange={(e) => setDocaDesignada(e.target.value)}
                        className="w-full mt-1 px-2 py-1 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-bold"
                      >
                        <option value="Doca 01">Doca 01</option>
                        <option value="Doca 02">Doca 02</option>
                        <option value="Doca 03">Doca 03</option>
                        <option value="Doca 04">Doca 04 (Refrigerada)</option>
                      </select>
                    </div>
                  </div>

                  {/* Itens carregados com Fator de Conversão */}
                  <div className="border border-[var(--card-border)] rounded-xl overflow-hidden">
                    <div className="p-3 bg-[var(--background)] border-b border-[var(--card-border)] font-bold text-xs text-[var(--foreground)] flex items-center justify-between">
                      <span>Itens Fiscais Carregados ({erpResult.nfe.itens.length} produtos):</span>
                      <span className="text-[11px] text-[var(--muted)] font-normal">
                        Fatores de conversão e caixas master mapeados
                      </span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--background)]/60 text-[var(--muted)] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Código / SKU</th>
                          <th className="py-2.5 px-3">Descrição</th>
                          <th className="py-2.5 px-3">Qtd NF</th>
                          <th className="py-2.5 px-3">Caixa Master / Fator</th>
                          <th className="py-2.5 px-3">Endereço CD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)]">
                        {erpResult.nfe.itens.map((it, idx) => (
                          <tr key={idx} className="hover:bg-[var(--secondary)]/30">
                            <td className="py-2.5 px-3 font-mono font-bold">{it.cod_produto}</td>
                            <td className="py-2.5 px-3 font-semibold text-[var(--foreground)]">
                              {it.descricao}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {it.qtd_nota} {it.unidade_medida}
                            </td>
                            <td className="py-2.5 px-3">
                              {it.codigo_caixa_master ? (
                                <span className="px-2 py-0.5 rounded bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30 font-mono font-bold text-[11px]">
                                  {it.fator_conversao} un / CX
                                </span>
                              ) : (
                                <span className="text-[var(--muted)] font-mono text-[11px]">Unid. Avulsa</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                              {it.endereco_sugerido}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleIniciarRecebimento}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>Iniciar Conferência Física na {docaDesignada}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-ABA 3: PAINEL DE CONFERÊNCIA FÍSICA NA DOCA                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "conferencia" && (
        <div className="space-y-5">
          {!activeRecebimento ? (
            <div className="p-12 text-center text-[var(--muted)] bg-[var(--card)] border border-[var(--card-border)] rounded-2xl space-y-3">
              <ScanBarcode size={36} className="mx-auto text-[var(--collab-mostarda)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Nenhum recebimento selecionado no momento.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("leitor_danfe")}
                className="px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] text-[#080808] font-bold text-xs cursor-pointer inline-flex items-center gap-2"
              >
                <span>Ler nova DANFE</span>
              </button>
            </div>
          ) : (
            <>
              {/* Barra de Informações da Carga em Doca */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold font-mono">
                    {activeRecebimento.doca.replace("Doca ", "D")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--foreground)]">
                        NF {activeRecebimento.numero_nfe}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {activeRecebimento.doca}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      Fornecedor: <strong className="text-[var(--foreground)]">{activeRecebimento.fornecedor_nome}</strong> • Pedido: <strong className="text-emerald-400">{activeRecebimento.pedido_compra}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--muted)] block">Progresso Físico:</span>
                    <strong className="text-sm text-[var(--foreground)]">
                      {statsConferencia.totalConferido} / {statsConferencia.totalNota} un ({statsConferencia.progresso}%)
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleFinalizar}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center gap-2"
                  >
                    <ClipboardCheck size={16} />
                    <span>Concluir Conferência</span>
                  </button>
                </div>
              </div>

              {/* Caixa de Leitura Rápida para Coletor / Scanner */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Barcode className="text-[var(--collab-mostarda)]" size={18} />
                    <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                      Entrada de Código de Barras (Coletor / Scanner)
                    </h3>
                  </div>

                  {/* Seletor de Modo de Leitura */}
                  <div className="flex items-center gap-1.5 p-1 bg-[var(--background)] rounded-xl border border-[var(--card-border)] text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setModoLeitura("caixa_master")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        modoLeitura === "caixa_master"
                          ? "bg-[var(--collab-mostarda)] text-black font-bold"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      Caixa Master (Fator Conversão)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoLeitura("ean")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        modoLeitura === "ean"
                          ? "bg-[var(--collab-mostarda)] text-black font-bold"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      EAN-13 Unidade
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoLeitura("sku")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        modoLeitura === "sku"
                          ? "bg-[var(--collab-mostarda)] text-black font-bold"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      Código SKU
                    </button>
                  </div>
                </div>

                <form onSubmit={handleProcessarLeitura} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      autoFocus
                      value={codigoLeituraInput}
                      onChange={(e) => setCodigoLeituraInput(e.target.value)}
                      placeholder="Bipe o código de barras da Caixa Master ou EAN da unidade aqui..."
                      className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono font-bold tracking-wider text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Bipar
                  </button>
                </form>

                {/* Atalhos Rápidos para Testar Bipagem */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                  <span className="text-[var(--muted)] font-semibold">Simular bipagem de caixa fechada:</span>
                  {activeRecebimento.itens.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        const code = it.codigo_caixa_master || it.ean || it.cod_produto;
                        const res = processarBipagemItem(activeRecebimento.itens, code, {
                          modoForcado: "caixa_master",
                        });
                        const updated: RecebimentoNfe = { ...activeRecebimento, itens: res.itensAtualizados };
                        setActiveRecebimento(updated);
                        salvarRecebimentoApi(updated);
                        setToastMsg({ text: res.mensagem, type: "success" });
                      }}
                      className="px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)] font-mono text-[10px] text-[var(--foreground)] hover:border-[var(--collab-mostarda)] cursor-pointer"
                    >
                      +1 CX {it.cod_produto} ({it.fator_conversao}x)
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade de Produtos com Indicadores de Cores (Verde / Amarelo / Vermelho) */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-[var(--background)] border-b border-[var(--card-border)] flex items-center justify-between text-xs">
                  <div className="font-bold text-[var(--foreground)]">
                    Itens da Nota Fiscal ({activeRecebimento.itens.length} produtos)
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Conferido OK</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>Em Conferência</span>
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      <span>Divergência / Sobra / Falta</span>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--background)]/60 border-b border-[var(--card-border)] text-[var(--muted)] uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Produto / SKU</th>
                        <th className="py-2.5 px-3">Qtd Fiscal</th>
                        <th className="py-2.5 px-3">Qtd Conferida</th>
                        <th className="py-2.5 px-3">Lote / Validade</th>
                        <th className="py-2.5 px-3">Endereço Destino</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {activeRecebimento.itens.map((it) => {
                        const isOk = it.qtd_conferida === it.qtd_nota;
                        const isDivergente =
                          it.status_conferencia === "divergente" || it.qtd_conferida > it.qtd_nota;
                        const rowColorClass = isOk
                          ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                          : isDivergente
                          ? "bg-red-500/5 hover:bg-red-500/10"
                          : "hover:bg-[var(--secondary)]/40";

                        return (
                          <tr key={it.id} className={`transition-colors ${rowColorClass}`}>
                            <td className="py-3 px-3">
                              {isOk ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  CONFERIDO
                                </span>
                              ) : isDivergente ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                  DIVERGÊNCIA
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  {it.qtd_conferida === 0 ? "PENDENTE" : "PARCIAL"}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <strong className="block text-[var(--foreground)]">{it.descricao}</strong>
                              <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono mt-0.5">
                                <span>SKU: {it.cod_produto}</span>
                                <span>• EAN: {it.ean}</span>
                                {it.codigo_caixa_master && (
                                  <span className="text-[var(--collab-mostarda)] font-semibold">
                                    • CX: {it.fator_conversao} un
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[var(--foreground)]">
                              {it.qtd_nota} {it.unidade_medida}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                                <span
                                  className={
                                    isOk
                                      ? "text-emerald-400"
                                      : isDivergente
                                      ? "text-red-400"
                                      : "text-amber-400"
                                  }
                                >
                                  {it.qtd_conferida}
                                </span>
                                <span className="text-[10px] text-[var(--muted)]">/ {it.qtd_nota} un</span>
                              </div>
                              {it.qtd_caixas_recebidas ? (
                                <span className="text-[10px] text-[var(--muted)] block">
                                  ({it.qtd_caixas_recebidas} caixas master)
                                </span>
                              ) : null}
                            </td>
                            <td className="py-3 px-3 text-[11px] font-mono">
                              <div>Lote: <strong>{it.lote || "—"}</strong></div>
                              <div className="text-[10px] text-[var(--muted)]">
                                Validade: {it.data_validade || "—"}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                              {it.endereco_destino}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Botão Digitação Manual */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManualItemTarget(it);
                                    setQtdManualInput(1);
                                    setIsManualModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--secondary)] text-[var(--foreground)] cursor-pointer"
                                  title="Digitação Manual de Quantidade (Permissão Requerida)"
                                >
                                  <Keyboard size={13} />
                                </button>

                                {/* Botão Apontar Divergência */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDivergenciaItemTarget(it);
                                    setDivQtd(Math.max(1, Math.abs(it.qtd_nota - it.qtd_conferida) || 1));
                                    setIsDivergenciaModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                                  title="Registrar Falta, Sobra ou Avaria (Quarentena)"
                                >
                                  <AlertCircle size={13} />
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
            </>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-ABA 4: QUARENTENA & CONTROLE DE DIVERGÊNCIAS                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "quarentena" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Área de Quarentena & Divergências de Recebimento
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Produtos bloqueados por divergência fiscal, avaria, validade ou violação. Bloqueio automático de picking.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <Lock size={15} />
                <span>Bloqueado para Separação / Picking</span>
              </div>
            </div>

            {/* Lista de Ocorrências em Quarentena */}
            {!activeRecebimento || activeRecebimento.divergencias.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted)] space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Nenhuma divergência registrada no recebimento atual.
                </p>
                <p className="text-xs">Todos os itens conferidos estão de acordo com as notas fiscais.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRecebimento.divergencias.map((div) => {
                  const labelCfg = DIVERGENCIA_LABELS[div.tipo] || { label: div.tipo, severidade: "alta" };
                  const isResolvida = div.status === "liberada";

                  return (
                    <div
                      key={div.id}
                      className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              isResolvida
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}
                          >
                            {labelCfg.label}
                          </span>
                          <strong className="text-sm text-[var(--foreground)]">
                            {div.descricao} (Código: {div.cod_produto})
                          </strong>
                        </div>

                        <div className="text-xs font-mono text-[var(--muted)]">
                          Quantidade Divergente: <strong className="text-red-400">{div.qtd_divergente} un</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="text-[var(--muted)]">
                            <strong>Observações do Operador ({div.operador_nome}):</strong>
                          </p>
                          <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] italic">
                            "{div.observacao || "Sem observações adicionais"}"
                          </div>
                          <span className="text-[10px] text-[var(--muted)] font-mono block">
                            Registrado em: {new Date(div.data_registro).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        {/* Foto da Avaria / Evidência */}
                        <div className="space-y-2">
                          <span className="text-[var(--muted)] font-bold block flex items-center gap-1.5">
                            <ImageIcon size={14} />
                            <span>Evidência Fotográfica:</span>
                          </span>
                          {div.foto_url ? (
                            <div className="relative w-36 h-28 rounded-xl overflow-hidden border border-[var(--card-border)] bg-black">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={div.foto_url} alt="Foto da avaria" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-dashed border-[var(--card-border)] text-center text-[var(--muted)] text-[11px]">
                              Nenhuma foto anexada no momento da ocorrência.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parecer do Gestor / Decisão */}
                      {div.decisao_gestor ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center gap-2">
                            <CheckCircle2 size={15} />
                            <span>Parecer do Gestor: {div.decisao_gestor.acao.toUpperCase()}</span>
                          </div>
                          <p>Responsável: {div.decisao_gestor.responsavel_nome} ({div.decisao_gestor.responsavel_cargo})</p>
                          <p className="italic">"{div.decisao_gestor.motivo}"</p>
                        </div>
                      ) : isSupervisorOrManager ? (
                        <div className="p-4 rounded-xl bg-[var(--card)] border border-amber-500/30 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                            <ShieldAlert size={15} />
                            <span>Ação Gerencial Requerida (Supervisor / Gerente):</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleResolverDivergencia(
                                  div.id,
                                  "aprovar_com_ressalva",
                                  "Aprovado com ressalva comercial pelo supervisor."
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                            >
                              Aprovar com Ressalva
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleResolverDivergencia(
                                  div.id,
                                  "devolver_ao_fornecedor",
                                  "Devolução recusada na doca por não conformidade."
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                            >
                              Devolver ao Fornecedor
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleResolverDivergencia(
                                  div.id,
                                  "descarte",
                                  "Produto avariado sem recuperação. Destinado a descarte."
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs cursor-pointer"
                            >
                              Destinar a Descarte
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-zinc-800/60 text-xs text-[var(--muted)] flex items-center gap-2">
                          <Lock size={14} />
                          <span>Aguardando parecer de um Supervisor ou Gerente.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-ABA 5: FINALIZAÇÃO & TAREFAS DE ARMAZENAGEM (PUTAWAY)         */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "finalizacao" && (
        <div className="space-y-6">
          {!activeRecebimento ? (
            <div className="p-8 text-center text-[var(--muted)] bg-[var(--card)] rounded-2xl">
              Selecione um recebimento para ver o resumo de armazenagem.
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                <div>
                  <h2 className="font-heading font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                    <Boxes className="text-cyan-400" size={20} />
                    <span>Resumo do Recebimento & Tarefas de Armazenagem</span>
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Protocolo de integração com ERP gerado e produtos liberados encaminhados para armazenagem no CD.
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    ERP: {activeRecebimento.erp_protocolo || "SINCRONIZADO"}
                  </span>
                </div>
              </div>

              {/* Comparativo Fiscal x Físico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--muted)] block">Total Faturado na NF:</span>
                  <strong className="text-lg font-mono text-[var(--foreground)]">
                    {statsConferencia.totalNota} un
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--muted)] block">Total Físico Conferido:</span>
                  <strong className="text-lg font-mono text-emerald-400">
                    {statsConferencia.totalConferido} un
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--muted)] block">Divergências Registradas:</span>
                  <strong
                    className={`text-lg font-mono ${
                      activeRecebimento.divergencias.length > 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {activeRecebimento.divergencias.length} ocorrência(s)
                  </strong>
                </div>
              </div>

              {/* Tarefas de Armazenagem Geradas (Putaway) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    <span>Tarefas de Armazenagem Geradas ({activeRecebimento.tarefas_armazenagem?.length || 0})</span>
                  </h3>
                  {onNavigateToLabels && (
                    <button
                      type="button"
                      onClick={onNavigateToLabels}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--collab-mostarda)] font-bold hover:underline cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Imprimir Etiquetas dos Endereços CD</span>
                    </button>
                  )}
                </div>

                <div className="border border-[var(--card-border)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--background)] text-[var(--muted)] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3">Quantidade</th>
                        <th className="py-2.5 px-3">Lote</th>
                        <th className="py-2.5 px-3">Origem</th>
                        <th className="py-2.5 px-3">Endereço Destino CD</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {(activeRecebimento.tarefas_armazenagem || []).map((tarf) => (
                        <tr key={tarf.id} className="hover:bg-[var(--secondary)]/30">
                          <td className="py-3 px-3">
                            <strong className="text-[var(--foreground)] block">{tarf.descricao}</strong>
                            <span className="text-[10px] text-[var(--muted)] font-mono">SKU: {tarf.cod_produto}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[var(--foreground)]">
                            {tarf.quantidade} {tarf.unidade_medida}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">{tarf.lote}</td>
                          <td className="py-3 px-3 font-semibold">{tarf.doca_origem}</td>
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400 text-sm">
                            {tarf.endereco_destino}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                              LIBERADO P/ ARMAZENAGEM
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
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: DIGITAÇÃO MANUAL DE QUANTIDADE (COM PERMISSÃO)           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isManualModalOpen && manualItemTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-[var(--collab-mostarda)]" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Digitação Manual de Quantidade
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-1">
              <strong className="block text-[var(--foreground)] text-xs">
                {manualItemTarget.descricao}
              </strong>
              <div className="text-[10px] text-[var(--muted)] font-mono">
                Código: {manualItemTarget.cod_produto} • EAN: {manualItemTarget.ean}
              </div>
              <div className="text-[10px] text-[var(--muted)] font-mono">
                Nota: {manualItemTarget.qtd_nota} un | Já conferido: {manualItemTarget.qtd_conferida} un
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--foreground)] block">
                Quantidade a adicionar (unidades):
              </label>
              <input
                type="number"
                min={1}
                max={manualItemTarget.qtd_nota * 2}
                value={qtdManualInput}
                onChange={(e) => setQtdManualInput(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm font-mono font-bold text-center"
              />
            </div>

            {!isSupervisorOrManager && (
              <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                <Lock size={13} />
                <span>Esta ação requer perfil de Supervisor ou Gerente.</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarManual}
                className="px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] text-[#080808] font-bold shadow-sm cursor-pointer"
              >
                Confirmar Entrada Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: APONTAR DIVERGÊNCIA & QUARENTENA COM FOTO               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isDivergenciaModalOpen && divergenciaItemTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-400" />
                <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                  Apontar Divergência & Direcionar para Quarentena
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDivergenciaModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-1">
              <strong className="block text-[var(--foreground)] text-xs">
                {divergenciaItemTarget.descricao}
              </strong>
              <div className="text-[10px] text-[var(--muted)] font-mono">
                Código: {divergenciaItemTarget.cod_produto} • Quantidade na NF: {divergenciaItemTarget.qtd_nota} un
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--foreground)] block">
                Tipo de Divergência / Ocorrência:
              </label>
              <select
                value={divTipo}
                onChange={(e) => setDivTipo(e.target.value as DivergenciaTipo)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-semibold focus:outline-none"
              >
                {Object.entries(DIVERGENCIA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">
                  Quantidade Divergente:
                </label>
                <input
                  type="number"
                  min={1}
                  value={divQtd}
                  onChange={(e) => setDivQtd(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--foreground)] block">
                  Operador Responsável:
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.name || "Operador CD"}
                  className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--card-border)] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--foreground)] block">
                Descrição Detalhada do Motivo / Ocorrência:
              </label>
              <textarea
                rows={2}
                value={divObs}
                onChange={(e) => setDivObs(e.target.value)}
                placeholder="Ex: Embalagem externa molhada e rasgada com 3 frascos vazando."
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none"
              />
            </div>

            {/* Upload de Foto da Avaria */}
            <div className="space-y-2">
              <label className="font-bold text-[var(--foreground)] block">
                Fotografia da Evidência / Avaria (Upload):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setDivFotoUrl(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="text-xs text-[var(--muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[var(--card-border)] file:bg-[var(--secondary)] file:text-xs file:font-bold file:text-[var(--foreground)] cursor-pointer"
              />
              {divFotoUrl && (
                <div className="relative w-24 h-20 rounded-lg overflow-hidden border border-[var(--card-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={divFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsDivergenciaModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegistrarDivergencia}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md cursor-pointer"
              >
                Direcionar para Quarentena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
