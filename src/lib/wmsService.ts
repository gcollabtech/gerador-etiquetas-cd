import {
  EntregaAgendamento,
  AgendamentoStatus,
  AgendamentoCanal,
  JanelaHorario,
  JanelaCapacidadeInfo,
  BloqueioJanela,
  IndicadoresAgendamento,
} from "./wmsTypes";

export const MAX_FORNECEDORES_POR_JANELA = 2;
export const MAX_VOLUMES_POR_JANELA = 500;

export const JANELAS_PADRAO: JanelaHorario[] = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

const WMS_AGENDAMENTOS_KEY = "collab_log_wms_agendamentos_v1";
const WMS_BLOQUEIOS_KEY = "collab_log_wms_bloqueios_v1";

export const SEED_AGENDAMENTOS: EntregaAgendamento[] = [
  {
    id: "agd-01",
    protocolo: "AGD-20261117-001",
    data: "2026-11-17",
    janela: "08:00 - 10:00",
    docaDesignada: "Doca 01 — Secos",
    canal: "portal_web",
    status: "finalizado",
    fornecedorNome: "Ambev Distribuição Brasil S.A.",
    fornecedorCnpj: "07.526.557/0001-00",
    transportadoraNome: "Jamef Encomendas Urgentes",
    transportadoraCnpj: "20.147.617/0001-44",
    numeroNotaFiscal: "104928",
    chaveNfe: "35261107526557000100550010001049281982736451",
    quantidadeVolumes: 300,
    quantidadeNfs: 3,
    tipoVeiculo: "Truck",
    placaVeiculo: "BRA-4E12",
    motoristaNome: "Marcos Vinicius de Souza",
    motoristaTelefone: "(11) 98711-2233",
    observacoes: "Carga paletizada com filme stretch padrão PBR.",
    createdAt: "2026-11-16T14:30:00Z",
    checkIn: {
      dataHoraChegada: "2026-11-17T08:10:00Z",
      horarioPrevisto: "08:00",
      tempoDiferencaMinutos: 10,
      statusPontualidade: "no_horario",
      responsavelPortaria: "Portaria 01 — Carlos R.",
    },
    inicioDescarga: "2026-11-17T08:25:00Z",
    fimDescarga: "2026-11-17T09:40:00Z",
    tempoEsperaMinutos: 15,
    tempoDescargaMinutos: 75,
  },
  {
    id: "agd-02",
    protocolo: "AGD-20261117-002",
    data: "2026-11-17",
    janela: "08:00 - 10:00",
    docaDesignada: "Doca 02 — Fracionados",
    canal: "app_mobile",
    status: "finalizado",
    fornecedorNome: "Nestlé Brasil Ltda",
    fornecedorCnpj: "60.409.075/0001-52",
    transportadoraNome: "Braspress Transportes Rápidos",
    transportadoraCnpj: "48.740.351/0001-65",
    numeroNotaFiscal: "782014",
    chaveNfe: "35261160409075000152550010007820141872938472",
    quantidadeVolumes: 200, // Janela 08-10h totaliza 500 volumes (lotada!)
    quantidadeNfs: 2,
    tipoVeiculo: "3/4",
    placaVeiculo: "SP-XYZ8901",
    motoristaNome: "Roberto Carlos Almeida",
    motoristaTelefone: "(11) 97622-4455",
    observacoes: "Janela complementar lotada (300 + 200 = 500 volumes).",
    createdAt: "2026-11-16T15:10:00Z",
    checkIn: {
      dataHoraChegada: "2026-11-17T07:55:00Z",
      horarioPrevisto: "08:00",
      tempoDiferencaMinutos: -5,
      statusPontualidade: "antecipado",
      responsavelPortaria: "Portaria 01 — Carlos R.",
    },
    inicioDescarga: "2026-11-17T08:20:00Z",
    fimDescarga: "2026-11-17T09:30:00Z",
    tempoEsperaMinutos: 25,
    tempoDescargaMinutos: 70,
  },
  {
    id: "agd-03",
    protocolo: "AGD-20261117-003",
    data: "2026-11-17",
    janela: "10:00 - 12:00",
    docaDesignada: "Doca 03 — Carga Geral",
    canal: "whatsapp",
    status: "em_descarga",
    fornecedorNome: "Unilever Brasil Industrial Ltda",
    fornecedorCnpj: "01.615.814/0001-87",
    transportadoraNome: "Luft Logistics",
    transportadoraCnpj: "51.849.214/0001-90",
    numeroNotaFiscal: "552199",
    chaveNfe: "35261101615814000187550010005521991283948576",
    quantidadeVolumes: 240,
    quantidadeNfs: 1,
    tipoVeiculo: "Truck",
    placaVeiculo: "MG-LOK4321",
    motoristaNome: "Edson Arantes Junior",
    motoristaTelefone: "(31) 98555-1234",
    observacoes: "Agendado via robô WhatsApp Collab Log Oficial.",
    createdAt: "2026-11-17T06:00:00Z",
    checkIn: {
      dataHoraChegada: "2026-11-17T10:05:00Z",
      horarioPrevisto: "10:00",
      tempoDiferencaMinutos: 5,
      statusPontualidade: "no_horario",
      responsavelPortaria: "Portaria 02 — Lucas F.",
    },
    inicioDescarga: "2026-11-17T10:20:00Z",
    tempoEsperaMinutos: 15,
  },
  {
    id: "agd-04",
    protocolo: "AGD-20261117-004",
    data: "2026-11-17",
    janela: "10:00 - 12:00",
    docaDesignada: "Doca 04 — Alto Giro",
    canal: "portal_web",
    status: "aguardando_doca",
    fornecedorNome: "M. Dias Branco Alimentos S.A.",
    fornecedorCnpj: "07.206.816/0001-15",
    transportadoraNome: "Patrus Transportes Urgentes",
    transportadoraCnpj: "17.291.845/0001-09",
    numeroNotaFiscal: "331908",
    chaveNfe: "35261107206816000115550010003319081029384756",
    quantidadeVolumes: 180,
    quantidadeNfs: 4,
    tipoVeiculo: "Toco",
    placaVeiculo: "PR-MDB9021",
    motoristaNome: "Valdir Pereira Santos",
    motoristaTelefone: "(41) 99123-9988",
    observacoes: "Veículo no pátio aguardando liberação da doca 04.",
    createdAt: "2026-11-16T17:40:00Z",
    checkIn: {
      dataHoraChegada: "2026-11-17T10:45:00Z",
      horarioPrevisto: "10:00",
      tempoDiferencaMinutos: 45,
      statusPontualidade: "atrasado",
      responsavelPortaria: "Portaria 02 — Lucas F.",
    },
  },
  {
    id: "agd-05",
    protocolo: "AGD-20261117-005",
    data: "2026-11-17",
    janela: "14:00 - 16:00",
    docaDesignada: "Doca 01 — Secos",
    canal: "portal_web",
    status: "chegou_portaria",
    fornecedorNome: "Piraquê Alimentos S.A.",
    fornecedorCnpj: "33.048.514/0001-98",
    transportadoraNome: "Transportadora Rodonaves",
    transportadoraCnpj: "44.914.992/0001-38",
    numeroNotaFiscal: "449102",
    chaveNfe: "35261133048514000198550010004491021928374650",
    quantidadeVolumes: 150,
    quantidadeNfs: 2,
    tipoVeiculo: "VUC",
    placaVeiculo: "RJ-PRQ1122",
    motoristaNome: "Luciano da Silva",
    motoristaTelefone: "(21) 98877-6655",
    observacoes: "Chegou antecipado na guarita da portaria.",
    createdAt: "2026-11-17T09:00:00Z",
    checkIn: {
      dataHoraChegada: "2026-11-17T13:40:00Z",
      horarioPrevisto: "14:00",
      tempoDiferencaMinutos: -20,
      statusPontualidade: "antecipado",
      responsavelPortaria: "Portaria 01 — Carlos R.",
    },
  },
  {
    id: "agd-06",
    protocolo: "AGD-20261117-006",
    data: "2026-11-17",
    janela: "14:00 - 16:00",
    canal: "whatsapp",
    status: "em_transito",
    fornecedorNome: "Bunge Alimentos S.A.",
    fornecedorCnpj: "84.046.101/0001-93",
    transportadoraNome: "Expresso São Miguel",
    numeroNotaFiscal: "891230",
    chaveNfe: "35261184046101000193550010008912301928374651",
    quantidadeVolumes: 220,
    quantidadeNfs: 1,
    tipoVeiculo: "Truck",
    placaVeiculo: "SC-BNG5544",
    motoristaNome: "Fernando Henrique Silva",
    motoristaTelefone: "(47) 99881-2233",
    observacoes: "Motorista informou tráfego no Rodoanel, previsão 14h30.",
    createdAt: "2026-11-17T08:15:00Z",
  },
  {
    id: "agd-07",
    protocolo: "AGD-20261117-007",
    data: "2026-11-17",
    janela: "16:00 - 18:00",
    canal: "app_mobile",
    status: "confirmado",
    fornecedorNome: "Mondelez Brasil Ltda",
    fornecedorCnpj: "03.000.123/0001-44",
    transportadoraNome: "Total Express",
    numeroNotaFiscal: "612940",
    chaveNfe: "35261103000123000144550010006129401928374652",
    quantidadeVolumes: 190,
    quantidadeNfs: 3,
    tipoVeiculo: "3/4",
    placaVeiculo: "SP-MDZ1234",
    motoristaNome: "Danilo Soares de Souza",
    motoristaTelefone: "(11) 98112-3344",
    observacoes: "Chocolates e biscoitos, exige temperatura ambiente controlada.",
    createdAt: "2026-11-17T09:30:00Z",
  },
  {
    id: "agd-08",
    protocolo: "AGD-20261117-008",
    data: "2026-11-17",
    janela: "12:00 - 14:00",
    canal: "portal_web",
    status: "nao_compareceu",
    fornecedorNome: "Camil Alimentos S.A.",
    fornecedorCnpj: "64.904.295/0001-03",
    transportadoraNome: "Translovato Transportes",
    numeroNotaFiscal: "119842",
    chaveNfe: "35261164904295000103550010001198421928374653",
    quantidadeVolumes: 350,
    quantidadeNfs: 1,
    tipoVeiculo: "Carreta",
    placaVeiculo: "RS-CML9988",
    motoristaNome: "Jorge Benício Silveira",
    motoristaTelefone: "(51) 98765-4321",
    observacoes: "No-show registrado às 14h15 após expiração da janela de 2h.",
    createdAt: "2026-11-16T11:00:00Z",
  },
];

export const SEED_BLOQUEIOS: BloqueioJanela[] = [
  {
    id: "blq-01",
    data: "2026-11-17",
    janela: "12:00 - 14:00",
    docaId: "Doca 02",
    motivo: "Manutenção preventiva de nivelador hidráulico de doca",
    criadoPor: "admin@collab.com.br",
    createdAt: "2026-11-16T08:00:00Z",
  },
];

export function getAgendamentos(): EntregaAgendamento[] {
  if (typeof window === "undefined") return SEED_AGENDAMENTOS;
  try {
    const raw = localStorage.getItem(WMS_AGENDAMENTOS_KEY);
    if (!raw) {
      localStorage.setItem(WMS_AGENDAMENTOS_KEY, JSON.stringify(SEED_AGENDAMENTOS));
      return SEED_AGENDAMENTOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_AGENDAMENTOS;
  } catch (e) {
    console.error("Erro ao ler agendamentos do WMS:", e);
    return SEED_AGENDAMENTOS;
  }
}

export function saveAgendamentos(agendamentos: EntregaAgendamento[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WMS_AGENDAMENTOS_KEY, JSON.stringify(agendamentos));
  } catch (e) {
    console.error("Erro ao salvar agendamentos do WMS:", e);
  }
}

export function getBloqueios(): BloqueioJanela[] {
  if (typeof window === "undefined") return SEED_BLOQUEIOS;
  try {
    const raw = localStorage.getItem(WMS_BLOQUEIOS_KEY);
    if (!raw) {
      localStorage.setItem(WMS_BLOQUEIOS_KEY, JSON.stringify(SEED_BLOQUEIOS));
      return SEED_BLOQUEIOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_BLOQUEIOS;
  } catch (e) {
    console.error("Erro ao ler bloqueios de janelas:", e);
    return SEED_BLOQUEIOS;
  }
}

export function saveBloqueios(bloqueios: BloqueioJanela[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WMS_BLOQUEIOS_KEY, JSON.stringify(bloqueios));
  } catch (e) {
    console.error("Erro ao salvar bloqueios:", e);
  }
}

// ── Validação e Criação de Agendamento ─────────────────────────────────
export function createAgendamento(
  data: Omit<EntregaAgendamento, "id" | "protocolo" | "createdAt" | "status">
): { success: boolean; agendamento?: EntregaAgendamento; error?: string } {
  const agendamentos = getAgendamentos();
  const bloqueios = getBloqueios();

  // 1. Validação de duplicidade de NF e chave NF-e (Item 2.3)
  const nfClean = data.numeroNotaFiscal.trim();
  const chaveClean = data.chaveNfe.replace(/\D/g, "");

  const duplicate = agendamentos.find((a) => {
    if (a.status === "cancelado") return false;
    const sameNF = a.numeroNotaFiscal.trim() === nfClean && a.fornecedorCnpj.replace(/\D/g, "") === data.fornecedorCnpj.replace(/\D/g, "");
    const sameChave = chaveClean.length === 44 && a.chaveNfe.replace(/\D/g, "") === chaveClean;
    return sameNF || sameChave;
  });

  if (duplicate) {
    return {
      success: false,
      error: `Já existe um agendamento ativo (${duplicate.protocolo}) para a Nota Fiscal ${nfClean} deste fornecedor. Não é permitida duplicidade de NF.`,
    };
  }

  // 2. Validação de bloqueio de janela / data
  const isBlocked = bloqueios.some(
    (b) => b.data === data.data && (b.janela === "todas" || b.janela === data.janela)
  );
  if (isBlocked) {
    return {
      success: false,
      error: `A janela ${data.janela} do dia ${data.data} está temporariamente bloqueada para manutenção ou operação interna do CD.`,
    };
  }

  // 3. Validação de capacidade da janela (Max 2 fornecedores e Max 500 volumes)
  const agendamentosNaJanela = agendamentos.filter(
    (a) => a.data === data.data && a.janela === data.janela && a.status !== "cancelado"
  );

  if (agendamentosNaJanela.length >= MAX_FORNECEDORES_POR_JANELA) {
    return {
      success: false,
      error: `A janela ${data.janela} já atingiu a capacidade máxima de ${MAX_FORNECEDORES_POR_JANELA} fornecedores simultâneos. Escolha outro horário disponível.`,
    };
  }

  const volumesAtuais = agendamentosNaJanela.reduce((sum, a) => sum + (Number(a.quantidadeVolumes) || 0), 0);
  const volumesNovos = Number(data.quantidadeVolumes) || 0;

  if (volumesAtuais + volumesNovos > MAX_VOLUMES_POR_JANELA) {
    const saldo = MAX_VOLUMES_POR_JANELA - volumesAtuais;
    return {
      success: false,
      error: `Capacidade volumétrica excedida! A janela ${data.janela} comporta no máximo ${MAX_VOLUMES_POR_JANELA} volumes (ocupados: ${volumesAtuais}, saldo restante: ${saldo} volumes). Seu agendamento possui ${volumesNovos} volumes.`,
    };
  }

  // 4. Gerar Protocolo único
  const countToday = agendamentos.filter((a) => a.data === data.data).length + 1;
  const dataFormatada = data.data.replace(/-/g, "");
  const seq = String(countToday).padStart(3, "0");
  const protocolo = `AGD-${dataFormatada}-${seq}`;

  const novoAgendamento: EntregaAgendamento = {
    ...data,
    id: `agd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    protocolo,
    status: "confirmado",
    createdAt: new Date().toISOString(),
  };

  const updated = [novoAgendamento, ...agendamentos];
  saveAgendamentos(updated);

  return { success: true, agendamento: novoAgendamento };
}

// ── Atualização de Status ──────────────────────────────────────────────
export function updateAgendamentoStatus(
  id: string,
  novoStatus: AgendamentoStatus,
  detalhes?: Partial<EntregaAgendamento>
): { success: boolean; error?: string } {
  const agendamentos = getAgendamentos();
  const index = agendamentos.findIndex((a) => a.id === id);
  const current = agendamentos[index];
  if (index === -1 || !current) {
    return { success: false, error: "Agendamento não encontrado." };
  }

  const updatedItem: EntregaAgendamento = {
    ...current,
    ...detalhes,
    id: current.id,
    status: novoStatus,
    updatedAt: new Date().toISOString(),
  };

  agendamentos[index] = updatedItem;
  saveAgendamentos(agendamentos);
  return { success: true };
}

// ── Check-in na Portaria ───────────────────────────────────────────────
export function registrarCheckInPortaria(
  id: string,
  responsavelPortaria: string = "Portaria Principal",
  observacoes?: string
): { success: boolean; agendamento?: EntregaAgendamento; error?: string } {
  const agendamentos = getAgendamentos();
  const index = agendamentos.findIndex((a) => a.id === id);
  const agd = agendamentos[index];
  if (index === -1 || !agd) return { success: false, error: "Agendamento não localizado." };

  const now = new Date();

  // Janela prevista: pega o horário inicial da janela, ex: "08:00" de "08:00 - 10:00"
  const [horaInicio] = agd.janela.split(" - ");
  const [hPrev, mPrev] = (horaInicio || "08:00").split(":").map(Number);

  // Calcula diferença em minutos comparado ao início da janela
  const dataHoje = new Date();
  dataHoje.setHours(hPrev || 8, mPrev || 0, 0, 0);

  const diffMs = now.getTime() - dataHoje.getTime();
  const diffMinutos = Math.round(diffMs / 60000);

  let statusPontualidade: "no_horario" | "atrasado" | "antecipado" = "no_horario";
  if (diffMinutos > 20) {
    statusPontualidade = "atrasado";
  } else if (diffMinutos < -15) {
    statusPontualidade = "antecipado";
  }

  const updated: EntregaAgendamento = {
    ...agd,
    id: agd.id,
    status: "chegou_portaria",
    checkIn: {
      dataHoraChegada: now.toISOString(),
      horarioPrevisto: horaInicio || "08:00",
      tempoDiferencaMinutos: diffMinutos,
      statusPontualidade,
      responsavelPortaria,
      observacoesChegada: observacoes,
    },
    updatedAt: now.toISOString(),
  };

  agendamentos[index] = updated;
  saveAgendamentos(agendamentos);
  return { success: true, agendamento: updated };
}

// ── Exclusão de Agendamento ───────────────────────────────────────────
export function deleteAgendamento(id: string): { success: boolean; error?: string } {
  const agendamentos = getAgendamentos();
  const exists = agendamentos.some((a) => a.id === id);
  if (!exists) {
    return { success: false, error: "Agendamento não encontrado para exclusão." };
  }
  const filtered = agendamentos.filter((a) => a.id !== id);
  saveAgendamentos(filtered);
  return { success: true };
}

export function resetAgendamentosToSeed(): void {
  saveAgendamentos(SEED_AGENDAMENTOS);
}

// ── Consulta de Disponibilidade das Janelas ────────────────────────────
export function getDisponibilidadeJanelas(dataStr: string): JanelaCapacidadeInfo[] {
  const agendamentos = getAgendamentos();
  const bloqueios = getBloqueios();

  return JANELAS_PADRAO.map((janela) => {
    const agendamentosJanela = agendamentos.filter(
      (a) => a.data === dataStr && a.janela === janela && a.status !== "cancelado"
    );

    const totalFornecedores = agendamentosJanela.length;
    const totalVolumes = agendamentosJanela.reduce(
      (sum, a) => sum + (Number(a.quantidadeVolumes) || 0),
      0
    );

    const bloqueio = bloqueios.find(
      (b) => b.data === dataStr && (b.janela === "todas" || b.janela === janela)
    );

    const bloqueada = Boolean(bloqueio);
    const motivoBloqueio = bloqueio?.motivo;

    // Não permite agendamento quando qualquer um dos limites for atingido ou estiver bloqueada
    const disponivel =
      !bloqueada &&
      totalFornecedores < MAX_FORNECEDORES_POR_JANELA &&
      totalVolumes < MAX_VOLUMES_POR_JANELA;

    return {
      janela,
      data: dataStr,
      totalFornecedores,
      maxFornecedores: MAX_FORNECEDORES_POR_JANELA,
      totalVolumes,
      maxVolumes: MAX_VOLUMES_POR_JANELA,
      disponivel,
      bloqueada,
      motivoBloqueio,
      agendamentos: agendamentosJanela,
    };
  });
}

// ── Bloqueio e Desbloqueio de Janelas ──────────────────────────────────
export function toggleBloqueioJanela(
  dataStr: string,
  janela: JanelaHorario,
  motivo: string = "Operação interna do CD",
  docaId?: string,
  criadoPor: string = "Administrador"
): { success: boolean; bloqueada: boolean } {
  const bloqueios = getBloqueios();
  const existIdx = bloqueios.findIndex(
    (b) => b.data === dataStr && (b.janela === janela || b.janela === "todas")
  );

  if (existIdx >= 0) {
    // Desbloqueia
    const updated = bloqueios.filter((_, idx) => idx !== existIdx);
    saveBloqueios(updated);
    return { success: true, bloqueada: false };
  } else {
    // Bloqueia
    const novoBloqueio: BloqueioJanela = {
      id: `blq-${Date.now()}`,
      data: dataStr,
      janela,
      motivo,
      docaId,
      criadoPor,
      createdAt: new Date().toISOString(),
    };
    saveBloqueios([...bloqueios, novoBloqueio]);
    return { success: true, bloqueada: true };
  }
}

// ── Cálculo dos Indicadores do Módulo 01 (Item 2.7) ─────────────────────
export function getIndicadoresAgendamento(dataStr?: string): IndicadoresAgendamento {
  const targetData = dataStr || new Date().toISOString().split("T")[0]!;
  const allAgendamentos = getAgendamentos();
  const agendamentosDia = allAgendamentos.filter((a) => a.data === targetData);

  const totalAgendamentosDia = agendamentosDia.length;
  const totalVolumesPrevistos = agendamentosDia.reduce(
    (acc, a) => acc + (a.status !== "cancelado" ? Number(a.quantidadeVolumes) || 0 : 0),
    0
  );

  // Capacidade total do dia: 5 janelas * 500 volumes = 2500 volumes max
  const capacidadeTotalVolumes = JANELAS_PADRAO.length * MAX_VOLUMES_POR_JANELA;
  const taxaOcupacaoGeralPct = Math.min(
    100,
    Math.round((totalVolumesPrevistos / capacidadeTotalVolumes) * 100)
  );

  const entregasFinalizadas = agendamentosDia.filter((a) => a.status === "finalizado").length;
  const naoCompareceram = agendamentosDia.filter((a) => a.status === "nao_compareceu").length;

  const entregasComCheckIn = agendamentosDia.filter((a) => a.checkIn);
  const entregasNoHorario = entregasComCheckIn.filter(
    (a) => a.checkIn?.statusPontualidade === "no_horario" || a.checkIn?.statusPontualidade === "antecipado"
  ).length;
  const entregasAtrasadas = entregasComCheckIn.filter(
    (a) => a.checkIn?.statusPontualidade === "atrasado"
  ).length;

  // Tempo médio entre chegada e início da descarga
  const entregasComDescarga = agendamentosDia.filter(
    (a) => typeof a.tempoEsperaMinutos === "number" && a.tempoEsperaMinutos >= 0
  );
  const tempoMedioEsperaMinutos =
    entregasComDescarga.length > 0
      ? Math.round(
          entregasComDescarga.reduce((sum, a) => sum + (a.tempoEsperaMinutos || 0), 0) /
            entregasComDescarga.length
        )
      : 18;

  // Volume previsto por horário (gráfico de janelas)
  const volumesPorJanela = JANELAS_PADRAO.map((janela) => {
    const agds = agendamentosDia.filter((a) => a.janela === janela && a.status !== "cancelado");
    const vols = agds.reduce((sum, a) => sum + (Number(a.quantidadeVolumes) || 0), 0);
    return {
      janela,
      volumes: vols,
      fornecedores: agds.length,
    };
  });

  // Distribuição por canais
  const canais: AgendamentoCanal[] = ["portal_web", "app_mobile", "whatsapp"];
  const distribuicaoCanais = canais.map((canal) => {
    const count = agendamentosDia.filter((a) => a.canal === canal).length;
    const pct = totalAgendamentosDia > 0 ? Math.round((count / totalAgendamentosDia) * 100) : 0;
    return { canal, count, pct };
  });

  return {
    totalAgendamentosDia,
    totalVolumesPrevistos,
    taxaOcupacaoGeralPct,
    entregasFinalizadas,
    entregasNoHorario,
    entregasAtrasadas,
    naoCompareceram,
    tempoMedioEsperaMinutos,
    volumesPorJanela,
    distribuicaoCanais,
  };
}
