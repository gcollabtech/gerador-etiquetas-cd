import fs from "fs";
import path from "path";
import {
  PedidoSeparacao,
  OndaSeparacao,
  EmbalagemPicking,
  TarefaPicking,
  ItemTarefaSeparacao,
  RegistroProdutividadePicking,
  IndicadoresPickingCD,
  CalculoEmbalagensResult,
  EMBALAGENS_PADRAO,
  PEDIDOS_SEED,
  ONDAS_SEED,
  TAREFAS_SEED,
  PRODUTIVIDADE_SEED,
  EstrategiaPicking,
  PrioridadePedido,
  ItemPedidoSeparacao,
} from "./wmsPickingTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const PEDIDOS_FILE = path.join(DATA_DIR, "wms_pedidos_separacao.json");
const ONDAS_FILE = path.join(DATA_DIR, "wms_ondas_separacao.json");
const EMBALAGENS_FILE = path.join(DATA_DIR, "wms_embalagens.json");
const TAREFAS_FILE = path.join(DATA_DIR, "wms_tarefas_picking.json");
const PRODUTIVIDADE_FILE = path.join(DATA_DIR, "wms_produtividade_picking.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── GETTERS COM FALLBACK PARA SEED ──────────────────────────────────────────

export function getPedidosSeparacao(): PedidoSeparacao[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(PEDIDOS_FILE)) {
      fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(PEDIDOS_SEED, null, 2), "utf8");
      return PEDIDOS_SEED;
    }
    const data = fs.readFileSync(PEDIDOS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler pedidos de separação:", err);
    return PEDIDOS_SEED;
  }
}

export function savePedidosSeparacao(pedidos: PedidoSeparacao[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar pedidos de separação:", err);
  }
}

export function getEmbalagensPicking(): EmbalagemPicking[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(EMBALAGENS_FILE)) {
      fs.writeFileSync(EMBALAGENS_FILE, JSON.stringify(EMBALAGENS_PADRAO, null, 2), "utf8");
      return EMBALAGENS_PADRAO;
    }
    const data = fs.readFileSync(EMBALAGENS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler embalagens de picking:", err);
    return EMBALAGENS_PADRAO;
  }
}

export function saveEmbalagensPicking(embalagens: EmbalagemPicking[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(EMBALAGENS_FILE, JSON.stringify(embalagens, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar embalagens de picking:", err);
  }
}

export function getOndasSeparacao(): OndaSeparacao[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(ONDAS_FILE)) {
      fs.writeFileSync(ONDAS_FILE, JSON.stringify(ONDAS_SEED, null, 2), "utf8");
      return ONDAS_SEED;
    }
    const data = fs.readFileSync(ONDAS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler ondas de separação:", err);
    return ONDAS_SEED;
  }
}

export function saveOndasSeparacao(ondas: OndaSeparacao[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(ONDAS_FILE, JSON.stringify(ondas, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar ondas de separação:", err);
  }
}

export function getTarefasPicking(): TarefaPicking[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(TAREFAS_FILE)) {
      fs.writeFileSync(TAREFAS_FILE, JSON.stringify(TAREFAS_SEED, null, 2), "utf8");
      return TAREFAS_SEED;
    }
    const data = fs.readFileSync(TAREFAS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler tarefas de picking:", err);
    return TAREFAS_SEED;
  }
}

export function saveTarefasPicking(tarefas: TarefaPicking[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(TAREFAS_FILE, JSON.stringify(tarefas, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar tarefas de picking:", err);
  }
}

export function getProdutividadePicking(): RegistroProdutividadePicking[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(PRODUTIVIDADE_FILE)) {
      fs.writeFileSync(PRODUTIVIDADE_FILE, JSON.stringify(PRODUTIVIDADE_SEED, null, 2), "utf8");
      return PRODUTIVIDADE_SEED;
    }
    const data = fs.readFileSync(PRODUTIVIDADE_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler produtividade de picking:", err);
    return PRODUTIVIDADE_SEED;
  }
}

export function saveProdutividadePicking(registros: RegistroProdutividadePicking[]): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(PRODUTIVIDADE_FILE, JSON.stringify(registros, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar produtividade de picking:", err);
  }
}

// ── CÁLCULO DE CUBAGEM E EMBALAGENS (ITEM 5.5) ──────────────────────────────

export function calcularCubagemEmbalagens(
  itens: Array<{ cod_produto: string; quantidade: number; cubagem_m3?: number; peso_kg?: number }>
): CalculoEmbalagensResult {
  const embalagensAtivas = getEmbalagensPicking().filter((e) => e.ativa);
  const fallbackEmb: EmbalagemPicking = EMBALAGENS_PADRAO[0] || {
    id: "emb-cx-m",
    codigo: "CX-M",
    nome: "Caixa Média Padrão 40x30x25",
    comprimento_cm: 40,
    largura_cm: 30,
    altura_cm: 25,
    volume_m3: 0.03,
    capacidade_peso_kg: 15,
    fator_utilizacao_pct: 85,
    ativa: true,
  };
  const embalagemPadrao: EmbalagemPicking =
    embalagensAtivas.find((e) => e.codigo === "CX-M") || embalagensAtivas[0] || fallbackEmb;

  let cubagemTotal = 0;
  let pesoTotal = 0;

  for (const item of itens) {
    const vol = item.cubagem_m3 || 0.0015;
    const peso = item.peso_kg || 0.5;
    cubagemTotal += vol * item.quantidade;
    pesoTotal += peso * item.quantidade;
  }

  // Volume útil considerando fator de aproveitamento
  const volUtilEmb = embalagemPadrao.volume_m3 * (embalagemPadrao.fator_utilizacao_pct / 100);
  const qtdPorVolume = Math.ceil(cubagemTotal / Math.max(0.005, volUtilEmb)) || 1;
  const qtdPorPeso = Math.ceil(pesoTotal / Math.max(1, embalagemPadrao.capacidade_peso_kg)) || 1;
  const qtdFinal = Math.max(qtdPorVolume, qtdPorPeso);

  return {
    cubagem_total_m3: parseFloat(cubagemTotal.toFixed(4)),
    peso_total_kg: parseFloat(pesoTotal.toFixed(2)),
    embalagem_recomendada: embalagemPadrao,
    quantidade_embalagens: qtdFinal,
    detalhe_distribuicao: [
      {
        embalagem: embalagemPadrao.nome,
        quantidade: qtdFinal,
        volume_utilizado_m3: parseFloat(cubagemTotal.toFixed(4)),
      },
    ],
  };
}

// ── INTEGRAÇÃO ERP: IMPORTAÇÃO DE PEDIDOS (ITEM 5.2) ────────────────────────

export function importarPedidosErp(): { success: boolean; importados: number; total: number } {
  const pedidos = getPedidosSeparacao();

  // Simula novos pedidos vindos da API do ERP
  const novosPedidosMock: PedidoSeparacao[] = [
    {
      id: `ped-erp-${Date.now().toString().slice(-4)}`,
      numero_pedido: `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      loja_destino: "Loja 22 - Bourbon Shopping Pompéia",
      cod_loja: "LJ-022",
      regiao: "Capital",
      rota_entrega: "Rota 05 - Zona Oeste",
      transportadora: "Frota Própria Collab",
      tipo_pedido: "abastecimento_diario",
      cliente_canal: "lojas_proprias",
      data_emissao: new Date().toISOString().split("T")[0] || "2026-11-19",
      prioridade: "alta",
      horario_expedicao_corte: "16:00",
      status: "pendente",
      total_itens: 48,
      total_volumes_estimados: 3,
      cubagem_total_m3: 0.065,
      observacoes: "Pedido importado automaticamente via Barramento de Integração ERP Collab.",
      itens: [
        {
          id: `item-erp-1`,
          cod_produto: "PRD-1001",
          descricao: "DETERGENTE LÍQUIDO NEUTRO 500ML",
          ean: "7891000315504",
          quantidade_solicitada: 24,
          quantidade_separada: 0,
          unidade_medida: "UN",
          restricao_validade_dias: 180,
          lote_preferencial: "LT-202611-A",
          peso_unitario_kg: 0.52,
          cubagem_unitaria_m3: 0.0009,
        },
        {
          id: `item-erp-2`,
          cod_produto: "PRD-1004",
          descricao: "DESINFETANTE FLORAL 1L",
          ean: "7896000123456",
          quantidade_solicitada: 24,
          quantidade_separada: 0,
          unidade_medida: "UN",
          restricao_validade_dias: 200,
          lote_preferencial: "LT-202611-D",
          peso_unitario_kg: 1.05,
          cubagem_unitaria_m3: 0.0016,
        },
      ],
    },
  ];

  // Insere no início se não existir duplicata
  let adicionados = 0;
  for (const n of novosPedidosMock) {
    if (!pedidos.some((p) => p.numero_pedido === n.numero_pedido)) {
      pedidos.unshift(n);
      adicionados++;
    }
  }

  savePedidosSeparacao(pedidos);
  return { success: true, importados: adicionados, total: pedidos.length };
}

// ── FORMAÇÃO DE ONDAS E GERAÇÃO DE TAREFAS (ITENS 5.3, 5.4, 5.5) ────────────

export function criarOndaSeparacao(dados: {
  nome: string;
  modo: "fixo" | "flexivel";
  estrategia: EstrategiaPicking;
  pedidos_ids: string[];
  horario_corte?: string;
  prioridade?: PrioridadePedido;
  criado_por?: string;
}): { success: boolean; onda?: OndaSeparacao; tarefasGeradas?: number; error?: string } {
  if (!dados.pedidos_ids || dados.pedidos_ids.length === 0) {
    return { success: false, error: "Selecione pelo menos um pedido para formar a onda." };
  }

  const pedidos = getPedidosSeparacao();
  const ondas = getOndasSeparacao();
  const tarefas = getTarefasPicking();

  const pedidosSelecionados = pedidos.filter((p) => dados.pedidos_ids.includes(p.id));
  if (pedidosSelecionados.length === 0) {
    return { success: false, error: "Nenhum pedido válido encontrado para a seleção." };
  }

  const ondaId = `onda-${Date.now().toString().slice(-6)}`;
  const numeroOnda = `ONDA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let totalItens = 0;
  let totalCubagem = 0;

  for (const ped of pedidosSelecionados) {
    for (const it of ped.itens) {
      totalItens += it.quantidade_solicitada;
      totalCubagem += (it.cubagem_unitaria_m3 || 0.0015) * it.quantidade_solicitada;
    }
  }

  // Gera uma tarefa por pedido (ou consolidada conforme estratégia)
  let tarefasCount = 0;

  for (const ped of pedidosSelecionados) {
    const calcEmb = calcularCubagemEmbalagens(
      ped.itens.map((i) => ({
        cod_produto: i.cod_produto,
        quantidade: i.quantidade_solicitada,
        cubagem_m3: i.cubagem_unitaria_m3,
        peso_kg: i.peso_unitario_kg,
      }))
    );

    const itensTarefa: ItemTarefaSeparacao[] = ped.itens.map((it, idx) => {
      // Mapeia endereços de picking do CD para os produtos
      let enderecoOrigem = "R01-P01-N01-A01";
      let setorFlow: string | undefined = "Flow Rack Setor A";
      if (it.cod_produto === "PRD-1002") {
        enderecoOrigem = "R01-P01-N01-A02";
      } else if (it.cod_produto === "PRD-1003") {
        enderecoOrigem = "R01-P02-N01-A01";
        setorFlow = undefined;
      } else if (it.cod_produto === "PRD-1004") {
        enderecoOrigem = "R01-P02-N01-A02";
        setorFlow = undefined;
      } else if (it.cod_produto === "PRD-1005") {
        enderecoOrigem = "R02-P01-N02-A01";
        setorFlow = "Flow Rack Setor B";
      } else if (it.cod_produto === "PRD-1006") {
        enderecoOrigem = "R02-P01-N01-A02";
        setorFlow = "Flow Rack Setor B";
      }

      return {
        id: `tar-it-${Date.now()}-${idx}`,
        cod_produto: it.cod_produto,
        descricao: it.descricao,
        ean: it.ean,
        quantidade_solicitada: it.quantidade_solicitada,
        quantidade_separada: 0,
        unidade_medida: it.unidade_medida,
        endereco_origem: enderecoOrigem,
        endereco_destino: `Gaiola-${ped.cod_loja} / Doca-02`,
        lote_recomendado: it.lote_preferencial || "LT-PADRAO-01",
        data_validade: "2028-12-31",
        setor_flow_rack: setorFlow,
        zona: setorFlow ? "Flow Rack" : "Porta-Paletes",
        cubagem_m3: (it.cubagem_unitaria_m3 || 0.0015) * it.quantidade_solicitada,
        status: "pendente",
      };
    });

    const novaTarefa: TarefaPicking = {
      id: `tar-pick-${Date.now()}-${tarefasCount}`,
      numero_tarefa: `TS-${Math.floor(8000 + Math.random() * 1999)}`,
      onda_id: ondaId,
      numero_onda: numeroOnda,
      pedido_id: ped.id,
      numero_pedido: ped.numero_pedido,
      loja_destino: ped.loja_destino,
      cod_loja: ped.cod_loja,
      estrategia: dados.estrategia,
      prioridade: dados.prioridade || ped.prioridade,
      status: "pendente",
      data_criacao: new Date().toISOString().replace("T", " ").slice(0, 16),
      itens: itensTarefa,
      volumes_embalagens_utilizados: calcEmb.quantidade_embalagens,
      embalagem_utilizada_id: calcEmb.embalagem_recomendada.id,
      embalagem_utilizada_nome: calcEmb.embalagem_recomendada.nome,
      cubagem_total_m3: calcEmb.cubagem_total_m3,
      total_itens_solicitados: ped.itens.reduce((acc, i) => acc + i.quantidade_solicitada, 0),
      total_itens_separados: 0,
      total_linhas: ped.itens.length,
      divergencias_contagem: 0,
      observacoes: `Separação para ${ped.loja_destino} (${calcEmb.quantidade_embalagens} volumes ${calcEmb.embalagem_recomendada.codigo})`,
    };

    tarefas.unshift(novaTarefa);
    tarefasCount++;

    // Atualiza status do pedido para "em_onda"
    ped.status = "em_onda";
    ped.onda_id = ondaId;
  }

  const novaOnda: OndaSeparacao = {
    id: ondaId,
    numero_onda: numeroOnda,
    nome: dados.nome || `Onda ${numeroOnda}`,
    modo: dados.modo,
    estrategia: dados.estrategia,
    data_criacao: new Date().toISOString().replace("T", " ").slice(0, 16),
    horario_corte: dados.horario_corte || "18:00",
    prioridade: dados.prioridade || "normal",
    status: "liberada",
    pedidos_ids: dados.pedidos_ids,
    quantidade_pedidos: pedidosSelecionados.length,
    total_itens: totalItens,
    total_volumes_estimados: Math.ceil(totalCubagem / 0.03) || 1,
    cubagem_total_m3: parseFloat(totalCubagem.toFixed(4)),
    tarefas_geradas: tarefasCount,
    tarefas_concluidas: 0,
    criado_por: dados.criado_por || "Supervisor de Separação",
  };

  ondas.unshift(novaOnda);

  saveOndasSeparacao(ondas);
  savePedidosSeparacao(pedidos);
  saveTarefasPicking(tarefas);

  return {
    success: true,
    onda: novaOnda,
    tarefasGeradas: tarefasCount,
  };
}

// ── ALOCAÇÃO DE TAREFAS PARA O OPERADOR (ITEM 5.5) ───────────────────────────

export function alocarTarefaOperador(
  tarefaId: string,
  operadorId: string,
  operadorNome: string
): { success: boolean; tarefa?: TarefaPicking; error?: string } {
  const tarefas = getTarefasPicking();
  const tarefa = tarefas.find((t) => t.id === tarefaId);

  if (!tarefa) {
    return { success: false, error: "Tarefa não encontrada." };
  }

  tarefa.operador_id = operadorId;
  tarefa.operador_nome = operadorNome;
  tarefa.status = "alocada";

  saveTarefasPicking(tarefas);
  return { success: true, tarefa };
}

// ── VALIDAÇÕES E TRAVAS DO COLETOR RF (ITEM 5.5) ────────────────────────────

export interface BipagemSeparacaoInput {
  tarefa_id: string;
  item_id: string;
  endereco_bipado: string;
  produto_bipado: string; // EAN ou Código
  quantidade_informada: number;
  lote_bipado?: string;
  validade_bipada?: string;
  operador_nome?: string;
}

export function executarBipagemSeparacao(
  input: BipagemSeparacaoInput
): {
  success: boolean;
  bloqueado: boolean;
  motivo_bloqueio?: string;
  tarefa?: TarefaPicking;
  itemAtualizado?: ItemTarefaSeparacao;
} {
  const tarefas = getTarefasPicking();
  const tarefa = tarefas.find((t) => t.id === input.tarefa_id);

  if (!tarefa) {
    return { success: false, bloqueado: true, motivo_bloqueio: "Tarefa de picking não localizada." };
  }

  const item = tarefa.itens.find((it) => it.id === input.item_id);
  if (!item) {
    return { success: false, bloqueado: true, motivo_bloqueio: "Item da tarefa não encontrado." };
  }

  // 1. BLOQUEIO: Endereço incorreto
  const enderecoLimpo = input.endereco_bipado.trim().toUpperCase();
  const enderecoEsperado = item.endereco_origem.trim().toUpperCase();
  if (enderecoLimpo !== enderecoEsperado) {
    item.status = "bloqueado";
    item.motivo_bloqueio = `Endereço incorreto! Bipado '${enderecoLimpo}', esperado '${enderecoEsperado}'`;
    saveTarefasPicking(tarefas);
    return {
      success: false,
      bloqueado: true,
      motivo_bloqueio: `BLOQUEIO: Endereço incorreto! Dirija-se ao endereço correto: ${enderecoEsperado}`,
    };
  }

  // 2. BLOQUEIO: Produto diferente do solicitado
  const produtoLimpo = input.produto_bipado.trim().toUpperCase();
  const codEsperado = item.cod_produto.trim().toUpperCase();
  const eanEsperado = item.ean.trim().toUpperCase();

  if (produtoLimpo !== codEsperado && produtoLimpo !== eanEsperado) {
    item.status = "bloqueado";
    item.motivo_bloqueio = `Produto incorreto! Bipado '${produtoLimpo}', esperado '${item.descricao}' (${codEsperado})`;
    saveTarefasPicking(tarefas);
    return {
      success: false,
      bloqueado: true,
      motivo_bloqueio: `BLOQUEIO: Produto diferente do solicitado! O sistema bloqueou a separação de item não constante no pedido.`,
    };
  }

  // 3. BLOQUEIO: Quantidade superior à permitida
  const qtdNova = input.quantidade_informada;
  if (qtdNova > item.quantidade_solicitada) {
    return {
      success: false,
      bloqueado: true,
      motivo_bloqueio: `BLOQUEIO: Quantidade informada (${qtdNova} ${item.unidade_medida}) é superior ao solicitado no pedido (${item.quantidade_solicitada} ${item.unidade_medida})!`,
    };
  }

  // 4. BLOQUEIO: Lote bloqueado ou divergente
  if (input.lote_bipado && input.lote_bipado.toUpperCase().includes("BLOQ")) {
    return {
      success: false,
      bloqueado: true,
      motivo_bloqueio: `BLOQUEIO: O lote informado '${input.lote_bipado}' está bloqueado pela Garantia de Qualidade/Quarentena!`,
    };
  }

  // 5. BLOQUEIO: Produto vencido
  if (input.validade_bipada) {
    const dataVal = new Date(input.validade_bipada);
    const hoje = new Date();
    if (dataVal <= hoje) {
      return {
        success: false,
        bloqueado: true,
        motivo_bloqueio: `BLOQUEIO: Produto com data de validade vencida (${input.validade_bipada})! Não é permitida a expedição para lojas.`,
      };
    }
  }

  // Se tudo correto: Confirma separação do item
  item.quantidade_separada = qtdNova;
  item.status = qtdNova === item.quantidade_solicitada ? "separado_ok" : "divergencia";
  item.motivo_bloqueio = undefined;

  // Inicia tarefa se estava alocada
  if (tarefa.status === "alocada" || tarefa.status === "pendente") {
    tarefa.status = "em_separacao";
    if (!tarefa.data_inicio) {
      tarefa.data_inicio = new Date().toISOString().replace("T", " ").slice(0, 16);
    }
  }

  // Recalcula totais da tarefa
  tarefa.total_itens_separados = tarefa.itens.reduce((acc, it) => acc + it.quantidade_separada, 0);

  // Verifica se todos os itens foram separados
  const todosSeparados = tarefa.itens.every((it) => it.status === "separado_ok");
  if (todosSeparados) {
    tarefa.status = "concluida";
    tarefa.data_fim = new Date().toISOString().replace("T", " ").slice(0, 16);
  }

  saveTarefasPicking(tarefas);

  return {
    success: true,
    bloqueado: false,
    tarefa,
    itemAtualizado: item,
  };
}

// ── FINALIZAÇÃO DA TAREFA E REGISTRO DE PRODUTIVIDADE (ITEM 5.6) ─────────────

export function finalizarTarefaPicking(
  tarefaId: string,
  dadosFinalizacao?: {
    volumes_embalagens_utilizados?: number;
    embalagem_id?: string;
    observacoes?: string;
  }
): { success: boolean; tarefa?: TarefaPicking; produtividade?: RegistroProdutividadePicking; error?: string } {
  const tarefas = getTarefasPicking();
  const pedidos = getPedidosSeparacao();
  const ondas = getOndasSeparacao();
  const produtividades = getProdutividadePicking();

  const tarefa = tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) {
    return { success: false, error: "Tarefa não encontrada." };
  }

  const horaFim = new Date().toISOString().replace("T", " ").slice(0, 16);
  tarefa.status = "concluida";
  tarefa.data_fim = horaFim;

  if (dadosFinalizacao?.volumes_embalagens_utilizados) {
    tarefa.volumes_embalagens_utilizados = dadosFinalizacao.volumes_embalagens_utilizados;
  }
  if (dadosFinalizacao?.observacoes) {
    tarefa.observacoes = dadosFinalizacao.observacoes;
  }

  // Calcula duração
  const inicioDate = tarefa.data_inicio ? new Date(tarefa.data_inicio) : new Date(Date.now() - 35 * 60 * 1000);
  const fimDate = new Date();
  const duracaoMinutos = Math.max(1, Math.round((fimDate.getTime() - inicioDate.getTime()) / 60000));
  tarefa.duracao_minutos = duracaoMinutos;

  // Atualiza pedido correspondente
  const pedido = pedidos.find((p) => p.id === tarefa.pedido_id);
  if (pedido) {
    pedido.status = "separado";
  }

  // Atualiza onda correspondente
  if (tarefa.onda_id) {
    const onda = ondas.find((o) => o.id === tarefa.onda_id);
    if (onda) {
      onda.tarefas_concluidas = (onda.tarefas_concluidas || 0) + 1;
      if (onda.tarefas_concluidas >= onda.tarefas_geradas) {
        onda.status = "concluida";
      }
    }
  }

  // Gera registro de produtividade (Item 5.6)
  const itensPorHora = parseFloat(((tarefa.total_itens_separados / duracaoMinutos) * 60).toFixed(1));
  const linhasPorHora = parseFloat(((tarefa.total_linhas / duracaoMinutos) * 60).toFixed(1));

  const novoRegistro: RegistroProdutividadePicking = {
    id: `prod-${Date.now()}`,
    operador_id: tarefa.operador_id || "usr-03",
    operador_nome: tarefa.operador_nome || "Operador de Picking",
    tarefa_id: tarefa.id,
    numero_tarefa: tarefa.numero_tarefa,
    pedido_id: tarefa.pedido_id,
    numero_pedido: tarefa.numero_pedido,
    loja_destino: tarefa.loja_destino,
    data: new Date().toISOString().split("T")[0] || "2026-11-19",
    hora_inicio: tarefa.data_inicio ? tarefa.data_inicio.split(" ")[1] || "09:00" : "09:00",
    hora_fim: horaFim.split(" ")[1] || "09:35",
    duracao_minutos: duracaoMinutos,
    quantidade_itens: tarefa.total_itens_separados,
    quantidade_linhas: tarefa.total_linhas,
    itens_por_hora: itensPorHora,
    linhas_por_hora: linhasPorHora,
    divergencias: tarefa.divergencias_contagem || 0,
    observacao: tarefa.observacoes,
  };

  produtividades.unshift(novoRegistro);

  saveTarefasPicking(tarefas);
  savePedidosSeparacao(pedidos);
  saveOndasSeparacao(ondas);
  saveProdutividadePicking(produtividades);

  return {
    success: true,
    tarefa,
    produtividade: novoRegistro,
  };
}

// ── INDICADORES GERENCIAIS DE PICKING (ITEM 5.6) ─────────────────────────────

export function getIndicadoresPicking(): IndicadoresPickingCD {
  const pedidos = getPedidosSeparacao();
  const ondas = getOndasSeparacao();
  const tarefas = getTarefasPicking();
  const produtividades = getProdutividadePicking();

  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter((p) => p.status === "pendente" || p.status === "em_onda").length;
  const pedidosEmSeparacao = pedidos.filter((p) => p.status === "em_separacao").length;
  const pedidosConcluidos = pedidos.filter((p) => p.status === "separado" || p.status === "conferido").length;
  const taxaAtendimento = totalPedidos > 0 ? parseFloat(((pedidosConcluidos / totalPedidos) * 100).toFixed(1)) : 100;

  const ondasAtivas = ondas.filter((o) => o.status === "liberada" || o.status === "em_separacao").length;
  const tarefasAbertas = tarefas.filter((t) => t.status === "pendente" || t.status === "alocada" || t.status === "em_separacao").length;

  let somaItensHora = 0;
  let somaLinhasHora = 0;
  let somaTempoMinutos = 0;
  let divergenciasHoje = 0;
  const operadoresUnicos = new Set<string>();

  for (const reg of produtividades) {
    somaItensHora += reg.itens_por_hora;
    somaLinhasHora += reg.linhas_por_hora;
    somaTempoMinutos += reg.duracao_minutos;
    divergenciasHoje += reg.divergencias;
    operadoresUnicos.add(reg.operador_id);
  }

  const totalRegs = Math.max(1, produtividades.length);
  const mediaItensHora = parseFloat((somaItensHora / totalRegs).toFixed(1));
  const mediaLinhasHora = parseFloat((somaLinhasHora / totalRegs).toFixed(1));
  const mediaTempoMinutos = Math.round(somaTempoMinutos / totalRegs);

  return {
    total_pedidos_hoje: totalPedidos,
    pedidos_pendentes: pedidosPendentes,
    pedidos_em_separacao: pedidosEmSeparacao,
    pedidos_concluidos: pedidosConcluidos,
    taxa_atendimento_pct: taxaAtendimento,
    ondas_ativas: ondasAtivas,
    total_tarefas_abertas: tarefasAbertas,
    produtividade_media_itens_hora: mediaItensHora || 145,
    produtividade_media_linhas_hora: mediaLinhasHora || 9.5,
    tempo_medio_separacao_minutos: mediaTempoMinutos || 38,
    divergencias_hoje: divergenciasHoje,
    operadores_ativos: Math.max(2, operadoresUnicos.size),
  };
}
