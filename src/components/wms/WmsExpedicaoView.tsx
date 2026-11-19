// src/components/wms/WmsExpedicaoView.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CargaExpedicao,
  DocaExpedicao,
  IndicadoresExpedicao,
  StatusCargaExpedicao,
  VolumeCarga,
} from "@/lib/wmsExpedicaoTypes";
import {
  fetchCargasEDocas,
  criarCargaExpedicaoService,
  alocarDocaService,
  iniciarCarregamentoService,
  executarBipagemCarregamentoService,
  finalizarExpedicaoComAssinaturaService,
  registrarSaidaVeiculoService,
  atualizarStatusEntregaService,
} from "@/lib/wmsExpedicaoService";
import { PortalUser } from "@/lib/authTypes";
import {
  Truck,
  Boxes,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Printer,
  FileText,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  Calendar,
  Sparkles,
  Camera,
  Check,
  X,
  RefreshCw,
  Send,
  Lock,
  PenTool,
  Building2,
  Hash,
  MapPin,
  FileCheck,
} from "lucide-react";

interface WmsExpedicaoViewProps {
  currentUser?: PortalUser;
  onNavigateToLabels?: () => void;
}

export function WmsExpedicaoView({ currentUser, onNavigateToLabels }: WmsExpedicaoViewProps) {
  const [cargas, setCargas] = useState<CargaExpedicao[]>([]);
  const [docas, setDocas] = useState<DocaExpedicao[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadoresExpedicao>({
    totalAguardandoCarga: 0,
    totalEmCarregamento: 0,
    totalCarregamentoConcluido: 0,
    totalAguardandoLiberacao: 0,
    totalExpedido: 0,
    totalEmTransito: 0,
    totalEntregue: 0,
    totalOcorrencias: 0,
    totalGeralCargas: 0,
    taxaOcupacaoDocasPct: 0,
    tempoMedioCarregamentoMin: 35,
  });

  const [activeSubTab, setActiveSubTab] = useState<"cargas" | "docas" | "carregamento" | "romaneio" | "entregas">("cargas");
  const [selectedCargaId, setSelectedCargaId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [buscaTermo, setBuscaTermo] = useState("");

  // Estação de Bipagem de Carregamento (Item 7.4)
  const [codigoBipado, setCodigoBipado] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ tipo: "ok" | "erro" | "alerta"; msg: string } | null>(null);

  // Canvas para Assinatura Digital do Motorista (Item 7.5)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [motoristaNomeInput, setMotoristaNomeInput] = useState("");
  const [motoristaCpfInput, setMotoristaCpfInput] = useState("");
  const [motoristaCnhInput, setMotoristaCnhInput] = useState("");

  // Modais
  const [modalNovaCargaOpen, setModalNovaCargaOpen] = useState(false);
  const [novaRegiao, setNovaRegiao] = useState("Capital");
  const [novaRota, setNovaRota] = useState("Rota 01 - Zona Sul Express");
  const [novaTransp, setNovaTransp] = useState("Transportadora TransCollab Log");
  const [novoVeiculoTipo, setNovoVeiculoTipo] = useState("Truck Baú");
  const [novaPlaca, setNovaPlaca] = useState("BRA-4D88");
  const [novoMotNome, setNovoMotNome] = useState("Sebastião Moreira");
  const [novoMotCpf, setNovoMotCpf] = useState("142.857.369-01");
  const [novoMotCnh, setNovoMotCnh] = useState("04982716352");
  const [novaDocaId, setNovaDocaId] = useState("doca-01");
  const [novaDataEntrega, setNovaDataEntrega] = useState("2026-11-19");
  const [novoHorarioPrev, setNovoHorarioPrev] = useState("14:00");

  const [modalAlocarDocaOpen, setModalAlocarDocaOpen] = useState(false);
  const [alocarDocaCargaItem, setAlocarDocaCargaItem] = useState<CargaExpedicao | null>(null);
  const [alocarDocaSelecionadaId, setAlocarDocaSelecionadaId] = useState("doca-01");
  const [alocarHorarioPrevisto, setAlocarHorarioPrevisto] = useState("14:00");

  const [modalOcorrenciaOpen, setModalOcorrenciaOpen] = useState(false);
  const [motivoOcorrenciaInput, setMotivoOcorrenciaInput] = useState("");

  // Carrega dados iniciais
  useEffect(() => {
    fetchCargasEDocas().then((res) => {
      setCargas(res.cargas);
      setDocas(res.docas);
      setIndicadores(res.indicadores);
      if (res.cargas.length > 0 && !selectedCargaId) {
        setSelectedCargaId(res.cargas[0]?.id || null);
      }
    });
  }, [refreshKey]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const cargaAtiva = useMemo(() => {
    return cargas.find((c) => c.id === selectedCargaId) || cargas[0] || null;
  }, [cargas, selectedCargaId]);

  // Preenche dados do motorista quando a carga ativa muda
  useEffect(() => {
    if (cargaAtiva) {
      setMotoristaNomeInput(cargaAtiva.motorista_nome || "");
      setMotoristaCpfInput(cargaAtiva.motorista_cpf || "");
      setMotoristaCnhInput(cargaAtiva.motorista_cnh || "");
      setHasSignature(cargaAtiva.romaneio_digital_gerado && !!cargaAtiva.assinatura_motorista);
    }
  }, [cargaAtiva]);

  // Filtros de Cargas
  const cargasFiltradas = useMemo(() => {
    return cargas.filter((c) => {
      if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
      if (buscaTermo) {
        const t = buscaTermo.toLowerCase();
        return (
          c.numero_carga.toLowerCase().includes(t) ||
          c.rota.toLowerCase().includes(t) ||
          c.transportadora.toLowerCase().includes(t) ||
          c.placa_veiculo.toLowerCase().includes(t) ||
          c.motorista_nome.toLowerCase().includes(t) ||
          c.lojas_atendidas.some((l) => l.nome_loja.toLowerCase().includes(t) || l.cod_loja.toLowerCase().includes(t))
        );
      }
      return true;
    });
  }, [cargas, filtroStatus, buscaTermo]);

  // ── DRAWING CANVAS PARA ASSINATURA DIGITAL ─────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0]!.clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = "touches" in e ? e.touches[0]!.clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e40af"; // Azul caneta
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0]!.clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = "touches" in e ? e.touches[0]!.clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // ── AÇÕES DE CARREGAMENTO & BIPAGEM ────────────────────────────────────────
  const handleIniciarCarregamento = async () => {
    if (!cargaAtiva) return;
    const res = await iniciarCarregamentoService(cargaAtiva.id);
    if (res.success) {
      setToastMsg({ text: `Carregamento da carga ${cargaAtiva.numero_carga} iniciado na ${cargaAtiva.doca_nome}!`, type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao iniciar carregamento.", type: "error" });
    }
  };

  const handleExecutarScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cargaAtiva || !codigoBipado.trim()) return;

    setScanFeedback(null);
    const res = await executarBipagemCarregamentoService(
      cargaAtiva.id,
      codigoBipado.trim(),
      currentUser?.name || "Operador de Expedição"
    );

    if (res.bloqueado) {
      setScanFeedback({ tipo: "erro", msg: res.mensagem });
      setToastMsg({ text: res.mensagem, type: "error" });
    } else if (res.success) {
      setScanFeedback({ tipo: "ok", msg: res.mensagem });
      setToastMsg({ text: res.mensagem, type: "success" });
      setCodigoBipado("");
      if (res.concluido) {
        setToastMsg({ text: "Carregamento 100% concluído! Todos os volumes no veículo.", type: "success" });
      }
    } else {
      setScanFeedback({ tipo: "alerta", msg: res.mensagem || res.error || "Aviso na bipagem." });
      setToastMsg({ text: res.mensagem || res.error || "Aviso na bipagem.", type: "warning" });
    }
    setRefreshKey((k) => k + 1);
  };

  const handleFinalizarExpedicao = async () => {
    if (!cargaAtiva) return;
    const canvas = canvasRef.current;
    let sigBase64 = "";
    if (canvas) {
      sigBase64 = canvas.toDataURL("image/png");
    }

    if (!hasSignature && !cargaAtiva.assinatura_motorista) {
      setToastMsg({ text: "O motorista deve assinar no painel digital antes de finalizar!", type: "warning" });
      return;
    }

    if (!motoristaNomeInput.trim() || !motoristaCpfInput.trim()) {
      setToastMsg({ text: "Informe o Nome e CPF do motorista para o romaneio digital.", type: "warning" });
      return;
    }

    const res = await finalizarExpedicaoComAssinaturaService({
      carga_id: cargaAtiva.id,
      motorista_nome: motoristaNomeInput.trim(),
      motorista_cpf: motoristaCpfInput.trim(),
      motorista_cnh: motoristaCnhInput.trim() || undefined,
      assinatura_base64: sigBase64 || cargaAtiva.assinatura_motorista?.assinatura_base64 || "data:image/svg+xml;utf8,<svg></svg>",
      operador_nome: currentUser?.name || "Supervisor de Expedição",
    });

    if (res.success) {
      setToastMsg({
        text: `Expedição finalizada! Romaneio Digital assinado e ERP sincronizado (${res.carga?.erp_protocolo_saida})!`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao finalizar expedição.", type: "error" });
    }
  };

  const handleLiberarSaidaPortaria = async () => {
    if (!cargaAtiva) return;
    const res = await registrarSaidaVeiculoService(cargaAtiva.id);
    if (res.success) {
      setToastMsg({ text: `Saída autorizada na portaria! Veículo ${cargaAtiva.placa_veiculo} em trânsito e Doca liberada.`, type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao registrar saída de veículo.", type: "error" });
    }
  };

  const handleConfirmarEntrega = async (cargaId: string) => {
    const res = await atualizarStatusEntregaService(cargaId, "confirmar_entrega", undefined, currentUser?.name);
    if (res.success) {
      setToastMsg({ text: "Entrega física confirmada com sucesso em todas as lojas da rota!", type: "success" });
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao confirmar entrega.", type: "error" });
    }
  };

  const handleSalvarOcorrencia = async () => {
    if (!cargaAtiva || !motivoOcorrenciaInput.trim()) return;
    const res = await atualizarStatusEntregaService(cargaAtiva.id, "ocorrencia_entrega", motivoOcorrenciaInput.trim(), currentUser?.name);
    if (res.success) {
      setToastMsg({ text: "Ocorrência de entrega registrada no monitor de frotas!", type: "warning" });
      setModalOcorrenciaOpen(false);
      setMotivoOcorrenciaInput("");
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao registrar ocorrência.", type: "error" });
    }
  };

  const handleSalvarNovaCarga = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await criarCargaExpedicaoService({
      regiao: novaRegiao,
      rota: novaRota,
      transportadora: novaTransp,
      veiculo_tipo: novoVeiculoTipo,
      placa_veiculo: novaPlaca,
      motorista_nome: novoMotNome,
      motorista_cpf: novoMotCpf,
      motorista_cnh: novoMotCnh,
      doca_id: novaDocaId,
      data_entrega_prevista: novaDataEntrega,
      horario_previsto_carregamento: novoHorarioPrev,
      pedidos: [
        {
          id: `ped-mock-${Date.now()}`,
          numero_pedido: `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          cod_loja: "LJ-008",
          loja_destino: "Loja 08 - Shopping Eldorado",
          volumes: [
            { codigo_volume: `VOL-${Math.floor(1000 + Math.random() * 9000)}-01`, peso_kg: 12.5, tipo_embalagem: "Caixa Média CX-M" },
            { codigo_volume: `VOL-${Math.floor(1000 + Math.random() * 9000)}-02`, peso_kg: 18.0, tipo_embalagem: "Caixa Média CX-M" },
          ],
        },
      ],
      observacoes: "Carga formada no painel de expedição por agrupamento de rota.",
    });

    if (res.success && res.carga) {
      setToastMsg({ text: `Carga ${res.carga.numero_carga} criada com sucesso para a ${res.carga.rota}!`, type: "success" });
      setSelectedCargaId(res.carga.id);
      setModalNovaCargaOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao formar carga.", type: "error" });
    }
  };

  const handleSalvarAlocacaoDoca = async () => {
    if (!alocarDocaCargaItem) return;
    const res = await alocarDocaService(alocarDocaCargaItem.id, alocarDocaSelecionadaId, alocarHorarioPrevisto);
    if (res.success) {
      setToastMsg({ text: `Carga vinculada à Doca com sucesso!`, type: "success" });
      setModalAlocarDocaOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      setToastMsg({ text: res.error || "Erro ao alocar doca.", type: "error" });
    }
  };

  // Badge de Status da Carga
  const getStatusBadge = (status: StatusCargaExpedicao) => {
    switch (status) {
      case "aguardando_carga":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Aguardando Carga</span>;
      case "em_carregamento":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/40 animate-pulse">Em Carregamento</span>;
      case "carregamento_concluido":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Carregamento Concluído</span>;
      case "aguardando_liberacao":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">Aguardando Liberação</span>;
      case "expedido":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Expedido</span>;
      case "em_transito":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40 animate-pulse">Em Trânsito</span>;
      case "entregue":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600/25 text-emerald-300 border border-emerald-500/50">Entregue</span>;
      case "entrega_ocorrencia":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">Entrega c/ Ocorrência</span>;
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
            <ShieldAlert size={18} className="text-red-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ── PAINEL VISUAL DE STATUS & QUANTIDADES (ITEM 7.6) ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Aguardando</span>
            <Clock size={13} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold font-heading text-amber-400">{indicadores.totalAguardandoCarga}</div>
          <span className="text-[10px] text-[var(--muted)] block">Aguardando veículo</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Carregando</span>
            <Barcode size={13} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--collab-mostarda)]">{indicadores.totalEmCarregamento}</div>
          <span className="text-[10px] text-[var(--muted)] block">Bipagem na doca</span>
        </div>

        <div className="bg-[var(--card)] border border-emerald-500/30 rounded-xl p-3 space-y-1 bg-emerald-500/5">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Concluído</span>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-heading text-emerald-400">{indicadores.totalCarregamentoConcluido}</div>
          <span className="text-[10px] text-emerald-300 block">100% volumes</span>
        </div>

        <div className="bg-[var(--card)] border border-sky-500/30 rounded-xl p-3 space-y-1 bg-sky-500/5">
          <div className="flex items-center justify-between text-xs text-sky-400">
            <span>Expedido</span>
            <FileCheck size={13} className="text-sky-400" />
          </div>
          <div className="text-xl font-bold font-heading text-sky-400">{indicadores.totalExpedido}</div>
          <span className="text-[10px] text-sky-300 block">Romaneio assinado</span>
        </div>

        <div className="bg-[var(--card)] border border-purple-500/30 rounded-xl p-3 space-y-1 bg-purple-500/5">
          <div className="flex items-center justify-between text-xs text-purple-400">
            <span>Em Trânsito</span>
            <Truck size={13} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold font-heading text-purple-400">{indicadores.totalEmTransito}</div>
          <span className="text-[10px] text-purple-300 block">A caminho da loja</span>
        </div>

        <div className="bg-[var(--card)] border border-emerald-600/30 rounded-xl p-3 space-y-1 bg-emerald-600/5">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>Entregue</span>
            <Check size={13} className="text-emerald-300" />
          </div>
          <div className="text-xl font-bold font-heading text-emerald-300">{indicadores.totalEntregue}</div>
          <span className="text-[10px] text-emerald-400 block">Lojas abastecidas</span>
        </div>

        <div className="bg-[var(--card)] border border-red-500/30 rounded-xl p-3 space-y-1 bg-red-500/5">
          <div className="flex items-center justify-between text-xs text-red-400">
            <span>Ocorrências</span>
            <AlertTriangle size={13} className="text-red-400" />
          </div>
          <div className="text-xl font-bold font-heading text-red-400">{indicadores.totalOcorrencias}</div>
          <span className="text-[10px] text-red-300 block">Rastreamento alertas</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Ocupação Docas</span>
            <Building2 size={13} className="text-[var(--collab-mostarda)]" />
          </div>
          <div className="text-xl font-bold font-heading text-[var(--foreground)]">{indicadores.taxaOcupacaoDocasPct}%</div>
          <span className="text-[10px] text-sky-400 block">Pátio CD Collab</span>
        </div>
      </div>

      {/* ── NAVEGAÇÃO DE SUB-ABAS DO MÓDULO 07 ───────────────────────────────── */}
      <div className="flex border-b border-[var(--card-border)] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab("cargas")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "cargas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Boxes size={15} />
          <span>Formação & Fila de Cargas</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--card-border)] text-[var(--foreground)] font-mono">
            {cargas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("docas")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "docas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Building2 size={15} />
          <span>Controle de Docas & Veículos</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--card-border)] text-[var(--foreground)] font-mono">
            {docas.length} docas
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("carregamento")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "carregamento"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Barcode size={15} />
          <span>Carregamento & Bipagem Coletor</span>
          {cargaAtiva && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--collab-mostarda)]/20 text-[var(--collab-mostarda)] font-mono font-bold">
              {cargaAtiva.numero_carga}
            </span>
          )}
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
          <PenTool size={15} />
          <span>Romaneio Digital & Assinatura Tablet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("entregas")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-b-2 ${
            activeSubTab === "entregas"
              ? "border-[var(--collab-mostarda)] text-[var(--collab-mostarda)] font-bold"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Truck size={15} />
          <span>Rastreamento & ERP</span>
        </button>
      </div>

      {/* ── SUB-ABA 1: FORMAÇÃO DE CARGAS & FILA DE PEDIDOS ──────────────────── */}
      {activeSubTab === "cargas" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--card)] p-3.5 rounded-xl border border-[var(--card-border)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
              <input
                type="text"
                placeholder="Filtrar por carga, rota, transportadora, placa, motorista ou loja..."
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
                <option value="aguardando_carga">Aguardando Carga</option>
                <option value="em_carregamento">Em Carregamento</option>
                <option value="carregamento_concluido">Carregamento Concluído</option>
                <option value="expedido">Expedido</option>
                <option value="em_transito">Em Trânsito</option>
                <option value="entregue">Entregue</option>
                <option value="entrega_ocorrencia">Entrega c/ Ocorrência</option>
              </select>

              <button
                type="button"
                onClick={() => setModalNovaCargaOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow shrink-0"
              >
                <Boxes size={14} />
                <span>Formar Nova Carga</span>
              </button>
            </div>
          </div>

          {/* Tabela de Cargas Formadas */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-4 py-3">Carga / Rota</th>
                    <th className="px-3 py-3">Lojas Atendidas</th>
                    <th className="px-3 py-3">Veículo & Placa</th>
                    <th className="px-3 py-3">Doca & Horário</th>
                    <th className="px-3 py-3">Volumes Carregados</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {cargasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--muted)]">
                        Nenhuma carga de expedição encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    cargasFiltradas.map((c) => {
                      const isSelected = cargaAtiva?.id === c.id;
                      const pct = c.total_volumes > 0 ? Math.round((c.volumes_bipados / c.total_volumes) * 100) : 0;
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-[var(--secondary)] transition-colors ${
                            isSelected ? "bg-[var(--collab-mostarda)]/5 font-medium" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--foreground)]">{c.numero_carga}</div>
                            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                              <MapPin size={11} className="text-[var(--collab-mostarda)]" />
                              <span>{c.rota}</span>
                              <span className="font-mono text-[10px] text-[var(--muted)] font-semibold">
                                ({c.regiao})
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="space-y-0.5">
                              {c.lojas_atendidas.map((l) => (
                                <div key={l.cod_loja} className="text-[11px] text-[var(--foreground)]">
                                  <strong>{l.cod_loja}</strong> — {l.nome_loja.split("-")[1] || l.nome_loja}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="font-mono text-[var(--foreground)] font-bold">{c.placa_veiculo}</div>
                            <div className="text-[10px] text-[var(--muted)]">{c.veiculo_tipo} • {c.motorista_nome}</div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="font-semibold text-[var(--foreground)]">{c.doca_nome.split("—")[0]}</div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              Previsto: {c.horario_previsto_carregamento}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                              <span>{c.volumes_bipados} / {c.total_volumes} vols</span>
                              <span className={pct === 100 ? "text-emerald-400 font-bold" : "text-[var(--muted)]"}>{pct}%</span>
                            </div>
                            <div className="w-24 bg-[var(--card-border)] h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${pct === 100 ? "bg-emerald-500" : "bg-[var(--collab-mostarda)]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          <td className="px-3 py-3">{getStatusBadge(c.status)}</td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCargaId(c.id);
                                setActiveSubTab("carregamento");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Barcode size={13} className="text-[var(--collab-mostarda)]" />
                              <span>Carregar</span>
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

      {/* ── SUB-ABA 2: CONTROLE DE DOCAS & AGENDAMENTO DE VEÍCULOS ────────────── */}
      {activeSubTab === "docas" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <Building2 size={18} className="text-[var(--collab-mostarda)]" />
                <span>Pátio de Docas de Expedição & Agendamento de Veículos (Item 7.3)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Controle em tempo real de ocupação, posicionamento de veículos, motoristas e vinculação de cargas.
              </p>
            </div>

            <div className="text-xs font-mono text-[var(--muted)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>{docas.filter((d) => d.status === "livre").length} Docas Livres</span>
              <span className="text-[var(--card-border)]">|</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{docas.filter((d) => d.status === "ocupada" || d.status === "reservada").length} Ocupadas</span>
            </div>
          </div>

          {/* Grid Visual de Docas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docas.map((doca) => {
              const isOcupada = doca.status === "ocupada";
              const isReservada = doca.status === "reservada";

              return (
                <div
                  key={doca.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 relative overflow-hidden ${
                    isOcupada
                      ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                      : isReservada
                      ? "bg-purple-500/10 border-purple-500/40 shadow-sm"
                      : "bg-[var(--card)] border-[var(--card-border)] hover:border-emerald-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2.5 border-[var(--card-border)]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isOcupada
                            ? "bg-amber-500 text-black font-black"
                            : isReservada
                            ? "bg-purple-500 text-white font-black"
                            : "bg-emerald-500/20 text-emerald-400 font-bold"
                        }`}
                      >
                        {doca.codigo.split("-")[2] || doca.codigo}
                      </div>
                      <div>
                        <strong className="text-xs text-[var(--foreground)] block">{doca.nome}</strong>
                        <span className="text-[10px] text-[var(--muted)] font-mono">{doca.capacidade_veiculo_tipo}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOcupada
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : isReservada
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {doca.status.toUpperCase()}
                    </span>
                  </div>

                  {isOcupada || isReservada ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Carga Vinculada:</span>
                        <strong className="text-[var(--foreground)] font-mono">{doca.numero_carga_atual}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Veículo / Placa:</span>
                        <strong className="text-sky-400 font-mono">{doca.placa_atual} ({doca.veiculo_atual?.split(" ")[0]})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Transportadora:</span>
                        <span className="text-[var(--foreground)] truncate max-w-[150px]">{doca.transportadora_atual}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-[var(--card-border)] text-[var(--muted)]">
                        <span>Horário Doca:</span>
                        <span className="font-mono">{doca.horario_ocupacao || "11:00"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-[var(--muted)] space-y-1">
                      <Truck size={24} className="mx-auto text-emerald-400 opacity-60" />
                      <span>Doca livre e disponível para novo agendamento.</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
                    <span className="text-[10px] text-[var(--muted)] font-mono">Tipo: {doca.tipo}</span>
                    {doca.status === "livre" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAlocarDocaSelecionadaId(doca.id);
                          setModalAlocarDocaOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 cursor-pointer"
                      >
                        Agendar Veículo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (doca.carga_id_atual) {
                            setSelectedCargaId(doca.carga_id_atual);
                            setActiveSubTab("carregamento");
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--foreground)] cursor-pointer"
                      >
                        Abrir Carregamento
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUB-ABA 3: ESTAÇÃO DE CARREGAMENTO & COLETOR RF ───────────────────── */}
      {activeSubTab === "carregamento" && (
        <div className="space-y-5">
          {cargaAtiva ? (
            <>
              {/* Header da Carga Ativa */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center font-bold shrink-0">
                      <Truck size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] font-heading">
                          {cargaAtiva.numero_carga}
                        </h2>
                        {getStatusBadge(cargaAtiva.status)}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          {cargaAtiva.doca_nome.split("—")[0]}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Rota: <strong className="text-[var(--foreground)]">{cargaAtiva.rota}</strong> ({cargaAtiva.regiao}) • Veículo: {cargaAtiva.veiculo_tipo} (Placa: <strong className="text-[var(--foreground)]">{cargaAtiva.placa_veiculo}</strong>) • Motorista: {cargaAtiva.motorista_nome}
                      </p>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex flex-wrap items-center gap-2">
                    {cargaAtiva.status === "aguardando_carga" && (
                      <button
                        type="button"
                        onClick={handleIniciarCarregamento}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Barcode size={14} />
                        <span>Iniciar Carregamento</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveSubTab("romaneio")}
                      className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--foreground)] font-bold hover:border-[var(--collab-mostarda)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <PenTool size={13} className="text-[var(--collab-mostarda)]" />
                      <span>Romaneio Digital & Assinatura</span>
                    </button>

                    {cargaAtiva.status === "expedido" && (
                      <button
                        type="button"
                        onClick={handleLiberarSaidaPortaria}
                        className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-black hover:brightness-110 flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Truck size={14} />
                        <span>Liberar Saída Portaria</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner de Trava de Carregamento (Item 7.4) */}
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-start gap-2.5 text-xs text-sky-300">
                  <ShieldAlert size={16} className="text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sky-400 block font-bold">
                      REGRA 7.4 — VALIDAÇÃO RÍGIDA DE EXPEDIÇÃO:
                    </strong>
                    <span>
                      O sistema bloqueia instantaneamente qualquer volume não pertencente a esta carga/rota. Bipar o volume, o pedido, a etiqueta ou a placa do veículo para confirmação.
                    </span>
                  </div>
                </div>

                {/* Terminal de Leitura / Bipagem */}
                <form onSubmit={handleExecutarScan} className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                      <Barcode size={15} className="text-[var(--collab-mostarda)]" />
                      <span>Leitor de Código de Barras da Doca / Coletor RF</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] font-mono">Bipe o código do volume (Ex: VOL-0842-01)</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Bipe o Volume (VOL-xxxx), Pedido (PED-xxxx) ou Placa do Veículo..."
                        value={codigoBipado}
                        onChange={(e) => setCodigoBipado(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--card-border)] rounded-lg text-xs font-mono font-bold text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--collab-mostarda)] text-black font-bold text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer shadow shrink-0"
                    >
                      <Check size={14} />
                      <span>Bipar Volume (Enter)</span>
                    </button>
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

                  {/* Atalhos Rápidos para Simulação de Bipagem */}
                  <div className="pt-2 border-t border-[var(--card-border)] flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[10px] text-[var(--muted)] mr-1">Atalhos de Simulação:</span>
                    {cargaAtiva.volumes.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCodigoBipado(v.codigo_volume)}
                        className={`px-2 py-1 rounded font-mono text-[10px] border cursor-pointer ${
                          v.bipado
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 line-through opacity-70"
                            : "bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] border-[var(--card-border)]"
                        }`}
                      >
                        {v.codigo_volume} ({v.loja_destino.split("-")[1] || v.loja_destino})
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCodigoBipado(cargaAtiva.placa_veiculo)}
                      className="px-2 py-1 rounded bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--card-border)] text-sky-400 font-mono text-[10px] cursor-pointer"
                    >
                      Bipar Veículo ({cargaAtiva.placa_veiculo})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodigoBipado("VOL-ESTRANHO-999")}
                      className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[10px] cursor-pointer"
                      title="Testa a trava de bloqueio de volume não pertencente à carga"
                    >
                      Simular Volume de Outra Rota
                    </button>
                  </div>
                </form>

                {/* Lista de Volumes Vinculados à Carga */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Volumes da Carga ({cargaAtiva.volumes.length} volumes cadastrados)
                    </h3>
                    <div className="text-[11px] font-mono text-[var(--muted)]">
                      Carregados: <strong className="text-emerald-400">{cargaAtiva.volumes_bipados}</strong> / {cargaAtiva.total_volumes}
                    </div>
                  </div>

                  <div className="border border-[var(--card-border)] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                        <tr>
                          <th className="px-4 py-2.5">Código Volume</th>
                          <th className="px-3 py-2.5">Pedido / Loja Destino</th>
                          <th className="px-3 py-2.5">Embalagem & Peso</th>
                          <th className="px-3 py-2.5">Status Carregamento</th>
                          <th className="px-3 py-2.5">Bipado em / Operador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)]">
                        {cargaAtiva.volumes.map((vol) => (
                          <tr key={vol.id} className="hover:bg-[var(--secondary)]">
                            <td className="px-4 py-3 font-mono font-bold text-[var(--foreground)]">
                              {vol.codigo_volume}
                            </td>

                            <td className="px-3 py-3">
                              <div className="font-semibold text-[var(--foreground)]">{vol.loja_destino}</div>
                              <div className="text-[10px] text-[var(--muted)] font-mono">
                                Pedido: {vol.numero_pedido} • Cód: {vol.cod_loja}
                              </div>
                            </td>

                            <td className="px-3 py-3">
                              <div className="text-[var(--foreground)]">{vol.tipo_embalagem}</div>
                              <div className="text-[10px] text-[var(--muted)] font-mono">{vol.peso_kg} kg</div>
                            </td>

                            <td className="px-3 py-3">
                              {vol.bipado ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                                  <CheckCircle2 size={12} />
                                  <span>Carregado no Veículo</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max">
                                  <Clock size={12} />
                                  <span>Pendente de Bipagem</span>
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-3 text-[11px] text-[var(--muted)] font-mono">
                              {vol.bipado ? (
                                <div>
                                  <div>{vol.bipado_em}</div>
                                  <div className="text-[10px] text-[var(--foreground)]">{vol.operador_bipagem}</div>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--card)] p-12 text-center rounded-2xl border border-[var(--card-border)] text-xs text-[var(--muted)]">
              Selecione uma carga na lista para abrir a estação de carregamento.
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 4: ROMANEIO DIGITAL & ASSINATURA TABLET ─────────────────── */}
      {activeSubTab === "romaneio" && (
        <div className="space-y-5">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <PenTool size={18} className="text-[var(--collab-mostarda)]" />
                <span>Romaneio Digital & Assinatura do Motorista via Tablet / Coletor (Item 7.5)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Emissão do romaneio eletrônico, coleta de assinatura touch do motorista e integração automática com o ERP.
              </p>
            </div>

            <div className="flex items-center gap-2">
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

          {cargaAtiva && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Painel de Coleta de Assinatura */}
              <div className="lg:col-span-5 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="border-b border-[var(--card-border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                    <PenTool size={16} className="text-[var(--collab-mostarda)]" />
                    <span>Termo de Responsabilidade & Assinatura</span>
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    O condutor confirma o recebimento físico dos volumes em perfeitas condições.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">Nome Completo do Motorista:</label>
                    <input
                      type="text"
                      value={motoristaNomeInput}
                      onChange={(e) => setMotoristaNomeInput(e.target.value)}
                      placeholder="Nome do motorista..."
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-bold text-[var(--foreground)] focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">CPF:</label>
                      <input
                        type="text"
                        value={motoristaCpfInput}
                        onChange={(e) => setMotoristaCpfInput(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)] focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--muted)] block mb-1 font-semibold">CNH:</label>
                      <input
                        type="text"
                        value={motoristaCnhInput}
                        onChange={(e) => setMotoristaCnhInput(e.target.value)}
                        placeholder="Nº da CNH..."
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)] focus:ring-1 focus:ring-[var(--collab-mostarda)]"
                      />
                    </div>
                  </div>

                  {/* Canvas Interativo de Assinatura Touch */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-semibold">
                      <span>Assinatura Digital (Touch / Mouse):</span>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative touch-none">
                      <canvas
                        ref={canvasRef}
                        width={420}
                        height={140}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-32 cursor-crosshair block bg-white"
                      />
                      {!hasSignature && !cargaAtiva.assinatura_motorista && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-gray-400 font-mono">
                          Assine aqui com o dedo ou caneta touch
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status ERP */}
                  <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[var(--muted)]">Integração ERP:</span>
                      {cargaAtiva.erp_sincronizado ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 size={12} />
                          <span>{cargaAtiva.erp_protocolo_saida}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400">Pendente de assinatura</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalizarExpedicao}
                    className="w-full py-2.5 bg-[var(--collab-mostarda)] text-black font-black text-xs rounded-xl hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <CheckCircle2 size={16} />
                    <span>Assinar Romaneio & Atualizar ERP</span>
                  </button>
                </div>
              </div>

              {/* Folha do Romaneio de Carga */}
              <div className="lg:col-span-7 bg-white text-black p-5 sm:p-6 rounded-2xl shadow-xl border border-gray-200 font-sans space-y-4">
                <div className="border-b-2 border-black pb-3 flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-black uppercase text-black">ROMANEIO DE CARGA & EXPEDIÇÃO</h1>
                    <span className="text-[10px] text-gray-600 block">CD BIG MASTER — GRUPO COLLAB LOGÍSTICA</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <strong className="text-black">{cargaAtiva.numero_carga}</strong>
                    <span className="text-[10px] text-gray-500 block">Data: {cargaAtiva.data_entrega_prevista}</span>
                  </div>
                </div>

                {/* Resumo da Carga */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[11px]">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Rota:</span>
                    <strong>{cargaAtiva.rota}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Veículo / Placa:</span>
                    <strong>{cargaAtiva.veiculo_tipo} ({cargaAtiva.placa_veiculo})</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">Transporte:</span>
                    <strong className="truncate block">{cargaAtiva.transportadora}</strong>
                  </div>
                </div>

                {/* Relação de Lojas e Volumes */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-black">RELAÇÃO DE LOJAS ATENDIDAS</h4>
                  <table className="w-full text-left text-[11px] border border-gray-300">
                    <thead className="bg-gray-100 font-bold text-gray-700">
                      <tr>
                        <th className="p-1.5 border-r border-gray-300">Cód</th>
                        <th className="p-1.5 border-r border-gray-300">Loja</th>
                        <th className="p-1.5 text-center border-r border-gray-300">Volumes</th>
                        <th className="p-1.5 text-center">Peso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cargaAtiva.lojas_atendidas.map((l) => (
                        <tr key={l.cod_loja}>
                          <td className="p-1.5 font-mono font-bold border-r border-gray-300">{l.cod_loja}</td>
                          <td className="p-1.5 font-semibold border-r border-gray-300">{l.nome_loja}</td>
                          <td className="p-1.5 text-center font-mono border-r border-gray-300">{l.total_volumes}</td>
                          <td className="p-1.5 text-center font-mono">{l.peso_kg} kg</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-300 font-bold text-[11px]">
                      <tr>
                        <td colSpan={2} className="p-1.5 text-right uppercase">Total:</td>
                        <td className="p-1.5 text-center font-mono">{cargaAtiva.total_volumes} vols</td>
                        <td className="p-1.5 text-center font-mono">{cargaAtiva.peso_total_kg} kg</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Documentos Fiscais */}
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[10px] space-y-1">
                  <span className="font-bold text-gray-700 block uppercase">Documentos Fiscais e de Transporte:</span>
                  <div className="flex flex-wrap gap-2 text-gray-600 font-mono">
                    <span>{cargaAtiva.documentos_fiscais.mdf_e_numero}</span>
                    <span>•</span>
                    <span>{cargaAtiva.documentos_fiscais.cte_numero}</span>
                    <span>•</span>
                    <span>{cargaAtiva.documentos_fiscais.nfs_chaves.length} NF-e vinculadas</span>
                  </div>
                </div>

                {/* Exibição da Assinatura se já colhida */}
                {cargaAtiva.assinatura_motorista && (
                  <div className="pt-3 border-t border-gray-300 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Motorista Responsável:</span>
                      <strong className="text-xs text-black block">{cargaAtiva.assinatura_motorista.nome}</strong>
                      <span className="text-[10px] text-gray-600 font-mono">CPF: {cargaAtiva.assinatura_motorista.cpf}</span>
                    </div>
                    <div className="text-right">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cargaAtiva.assinatura_motorista.assinatura_base64}
                        alt="Assinatura"
                        className="h-10 w-auto inline-block border border-gray-200 bg-white p-1 rounded"
                      />
                      <span className="text-[9px] text-emerald-700 font-bold block">Assinado digitalmente</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ABA 5: MONITOR DE ENTREGAS & SINCRONIZAÇÃO ERP ───────────────── */}
      {activeSubTab === "entregas" && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] font-heading flex items-center gap-2">
                <Truck size={18} className="text-[var(--collab-mostarda)]" />
                <span>Rastreamento em Trânsito & Atualização ERP (Item 7.6)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Acompanhamento da saída física do CD, confirmação de entrega nas lojas ou registro de ocorrências em trânsito.
              </p>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold border-b border-[var(--card-border)]">
                <tr>
                  <th className="px-4 py-3">Carga / Rota</th>
                  <th className="px-3 py-3">Transportadora & Placa</th>
                  <th className="px-3 py-3">Saída CD Real</th>
                  <th className="px-3 py-3">Protocolo Baixa ERP</th>
                  <th className="px-3 py-3">Status Rota</th>
                  <th className="px-4 py-3 text-right">Ação Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {cargas.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--secondary)]">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[var(--foreground)]">{c.numero_carga}</div>
                      <div className="text-[10px] text-[var(--muted)]">{c.rota}</div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-mono font-bold text-[var(--foreground)]">{c.placa_veiculo}</div>
                      <div className="text-[10px] text-[var(--muted)]">{c.transportadora}</div>
                    </td>

                    <td className="px-3 py-3 font-mono text-[11px]">
                      {c.data_saida_real ? (
                        <span className="text-[var(--foreground)]">{c.data_saida_real}</span>
                      ) : (
                        <span className="text-[var(--muted)] italic">Aguardando saída</span>
                      )}
                    </td>

                    <td className="px-3 py-3 font-mono text-[11px]">
                      {c.erp_sincronizado ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>{c.erp_protocolo_saida}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400">Pendente Saída</span>
                      )}
                    </td>

                    <td className="px-3 py-3">{getStatusBadge(c.status)}</td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === "em_transito" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmarEntrega(c.id)}
                              className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 cursor-pointer"
                            >
                              Confirmar Entrega
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCargaId(c.id);
                                setModalOcorrenciaOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[10px] font-bold border border-red-500/40 cursor-pointer"
                            >
                              Apontar Ocorrência
                            </button>
                          </>
                        )}
                        {c.status === "entregue" && (
                          <span className="text-[10px] text-emerald-400 font-bold font-mono">100% Concluído</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: FORMAR NOVA CARGA (ITEM 7.2) ──────────────────────────────── */}
      {modalNovaCargaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] flex items-center justify-center font-bold">
                  <Boxes size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--foreground)]">
                    Formação de Carga de Expedição (Item 7.2)
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    Agrupamento por Loja, Região, Rota, Transportadora e Veículo
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaCargaOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaCarga} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Região:</label>
                  <select
                    value={novaRegiao}
                    onChange={(e) => setNovaRegiao(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)]"
                  >
                    <option value="Capital">Capital (São Paulo)</option>
                    <option value="Grande SP">Grande SP (ABCD / Oeste)</option>
                    <option value="Interior">Interior (Campinas / RMC)</option>
                    <option value="Litoral">Litoral (Baixada Santista)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Rota de Entrega:</label>
                  <select
                    value={novaRota}
                    onChange={(e) => setNovaRota(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)]"
                  >
                    <option value="Rota 01 - Zona Sul Express">Rota 01 - Zona Sul Express</option>
                    <option value="Rota 02 - Zona Norte Express">Rota 02 - Zona Norte Express</option>
                    <option value="Rota 03 - Grande SP Oeste">Rota 03 - Grande SP Oeste</option>
                    <option value="Rota 04 - Baixada Santista">Rota 04 - Baixada Santista</option>
                    <option value="Rota 10 - Campinas / RMC">Rota 10 - Campinas / RMC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Transportadora:</label>
                  <input
                    type="text"
                    value={novaTransp}
                    onChange={(e) => setNovaTransp(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Tipo de Veículo:</label>
                  <select
                    value={novoVeiculoTipo}
                    onChange={(e) => setNovoVeiculoTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)]"
                  >
                    <option value="Truck Baú">Truck Baú (14 Ton)</option>
                    <option value="Carreta">Carreta (28 Ton)</option>
                    <option value="Toco">Toco (8 Ton)</option>
                    <option value="VUC">VUC Urbano (3.5 Ton)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Placa Veículo:</label>
                  <input
                    type="text"
                    value={novaPlaca}
                    onChange={(e) => setNovaPlaca(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-mono font-bold text-[var(--foreground)] uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Motorista:</label>
                  <input
                    type="text"
                    value={novoMotNome}
                    onChange={(e) => setNovoMotNome(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">CPF Motorista:</label>
                  <input
                    type="text"
                    value={novoMotCpf}
                    onChange={(e) => setNovoMotCpf(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Doca de Expedição:</label>
                  <select
                    value={novaDocaId}
                    onChange={(e) => setNovaDocaId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)]"
                  >
                    {docas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[var(--foreground)] block mb-1">Horário Previsto Carregamento:</label>
                  <input
                    type="text"
                    value={novoHorarioPrev}
                    onChange={(e) => setNovoHorarioPrev(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)] -mx-5 -mb-5">
                <button
                  type="button"
                  onClick={() => setModalNovaCargaOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Boxes size={14} />
                  <span>Criar Carga</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: APONTAR OCORRÊNCIA DE ENTREGA ──────────────────────────────── */}
      {modalOcorrenciaOpen && cargaAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-red-500/10">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-red-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-red-400">
                    Apontar Ocorrência de Entrega (Item 7.6)
                  </h3>
                  <span className="text-[11px] text-[var(--muted)]">
                    Carga {cargaAtiva.numero_carga} • {cargaAtiva.rota}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOcorrenciaOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--foreground)] block mb-1">Motivo da Ocorrência:</label>
                <textarea
                  rows={3}
                  value={motivoOcorrenciaInput}
                  onChange={(e) => setMotivoOcorrenciaInput(e.target.value)}
                  placeholder="Ex: Loja fechada fora do horário, avaria em trânsito, recusa do gerente, etc..."
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-300">
                Esta ocorrência será vinculada à carga e informada à Central de Atendimento e Rastreamento.
              </div>
            </div>

            <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-end gap-2 bg-[var(--background)]">
              <button
                type="button"
                onClick={() => setModalOcorrenciaOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarOcorrencia}
                className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow"
              >
                <AlertTriangle size={13} />
                <span>Registrar Ocorrência</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
