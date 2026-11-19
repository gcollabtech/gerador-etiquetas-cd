import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  RegraReposicao,
  TarefaReabastecimento,
  PrioridadeReabastecimento,
  StatusReabastecimento,
  FlowRackInfoConsulta,
  SEED_REGRAS_REPOSICAO,
  SEED_TAREFAS_REABASTECIMENTO,
} from "./wmsReabastecimentoTypes";
import { getEnderecos, registrarMovimentacao } from "./serverArmazenagem";

function getSupabaseConfig(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://jnfvvcvoubimkdwrasro.supabase.co";

  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

function getSupabaseHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

const CANONICAL_DATA_DIR = "/Users/fragoso/Documents/collab-finance/collab-finance/gerador-etiquetas-cd/data";

function getDataDir(): string {
  if (fs.existsSync(CANONICAL_DATA_DIR)) return CANONICAL_DATA_DIR;
  const inGerador = path.join(process.cwd(), "gerador-etiquetas-cd", "data");
  if (fs.existsSync(inGerador)) return inGerador;
  const inCwd = path.join(process.cwd(), "data");
  if (!fs.existsSync(inCwd)) {
    try {
      fs.mkdirSync(inCwd, { recursive: true });
    } catch {}
  }
  return inCwd;
}

function getRegrasFilePath(): string {
  return path.join(getDataDir(), "wms_regras_reposicao.json");
}

function getTarefasFilePath(): string {
  return path.join(getDataDir(), "wms_tarefas_reabastecimento.json");
}

function atomicWrite(filePath: string, data: any): void {
  const temp = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(temp, filePath);
  } catch (err) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }
}

// ─── REGRAS DE REPOSIÇÃO ───────────────────────────────────────────────

export async function getRegrasReposicao(): Promise<RegraReposicao[]> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/wms_regras_reposicao?select=*&order=cod_produto.asc`, {
        headers: getSupabaseHeaders(cfg.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          atomicWrite(getRegrasFilePath(), rows);
          return rows;
        }
      }
    } catch (err) {
      console.warn("[serverReabastecimento] Falha ao consultar Supabase regras, usando local:", err);
    }
  }

  const filePath = getRegrasFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  atomicWrite(filePath, SEED_REGRAS_REPOSICAO);
  return SEED_REGRAS_REPOSICAO;
}

export async function saveRegraReposicao(regra: RegraReposicao): Promise<RegraReposicao> {
  const cfg = getSupabaseConfig();
  const agora = new Date().toISOString();
  const payload: RegraReposicao = {
    ...regra,
    id: regra.id || `reg-${crypto.randomUUID()}`,
    updated_at: agora,
    created_at: regra.created_at || agora,
  };

  if (cfg) {
    try {
      await fetch(`${cfg.url}/rest/v1/wms_regras_reposicao?on_conflict=cod_produto`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(cfg.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("[serverReabastecimento] Erro ao salvar regra no Supabase:", err);
    }
  }

  const todas = await getRegrasReposicao();
  const idx = todas.findIndex((r) => r.cod_produto === regra.cod_produto || r.id === regra.id);
  if (idx >= 0) {
    todas[idx] = payload;
  } else {
    todas.push(payload);
  }
  atomicWrite(getRegrasFilePath(), todas);
  return payload;
}

// ─── TAREFAS DE REABASTECIMENTO ───────────────────────────────────────

export async function getTarefasReabastecimento(filtros?: {
  status?: string;
  prioridade?: string;
  operador?: string;
}): Promise<TarefaReabastecimento[]> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/wms_tarefas_reabastecimento?select=*&order=criado_em.desc`, {
        headers: getSupabaseHeaders(cfg.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          atomicWrite(getTarefasFilePath(), rows);
          let filtradas = rows;
          if (filtros?.status && filtros.status !== "todos") {
            filtradas = filtradas.filter((t) => t.status === filtros.status);
          }
          if (filtros?.prioridade && filtros.prioridade !== "todas") {
            filtradas = filtradas.filter((t) => t.prioridade === filtros.prioridade);
          }
          return filtradas;
        }
      }
    } catch (err) {
      console.warn("[serverReabastecimento] Falha ao consultar Supabase tarefas, usando local:", err);
    }
  }

  const filePath = getTarefasFilePath();
  let todas: TarefaReabastecimento[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) todas = parsed;
    } catch {}
  }

  if (todas.length === 0) {
    todas = SEED_TAREFAS_REABASTECIMENTO;
    atomicWrite(filePath, todas);
  }

  if (filtros?.status && filtros.status !== "todos") {
    todas = todas.filter((t) => t.status === filtros.status);
  }
  if (filtros?.prioridade && filtros.prioridade !== "todas") {
    todas = todas.filter((t) => t.prioridade === filtros.prioridade);
  }
  return todas;
}

export async function saveTarefaReabastecimento(tarefa: TarefaReabastecimento): Promise<TarefaReabastecimento> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      await fetch(`${cfg.url}/rest/v1/wms_tarefas_reabastecimento?on_conflict=id`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(cfg.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(tarefa),
      });
    } catch (err) {
      console.warn("[serverReabastecimento] Erro ao salvar tarefa no Supabase:", err);
    }
  }

  const filePath = getTarefasFilePath();
  let todas: TarefaReabastecimento[] = [];
  if (fs.existsSync(filePath)) {
    try {
      todas = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {}
  }
  if (todas.length === 0) todas = SEED_TAREFAS_REABASTECIMENTO;

  const idx = todas.findIndex((t) => t.id === tarefa.id || t.numero_tarefa === tarefa.numero_tarefa);
  if (idx >= 0) {
    todas[idx] = tarefa;
  } else {
    todas.unshift(tarefa);
  }
  atomicWrite(filePath, todas);
  return tarefa;
}

// ─── GERAÇÃO AUTOMÁTICA DE TAREFAS POR ESTOQUE MÍNIMO / ONDA ──────────

export async function verificarEGerarTarefasAutomaticas(params?: {
  ondaId?: string;
  supervisorNome?: string;
}): Promise<{ totalGeradas: number; tarefas: TarefaReabastecimento[] }> {
  const [enderecos, regras, tarefasExistentes] = await Promise.all([
    getEnderecos(),
    getRegrasReposicao(),
    getTarefasReabastecimento(),
  ]);

  const novasTarefas: TarefaReabastecimento[] = [];
  const anoAtual = new Date().getFullYear();

  for (const regra of regras) {
    if (!regra.ativo) continue;

    // Determina o endereço de destino (Flow Rack se existir ou Picking)
    const enderecoDestinoCod = regra.endereco_flow_rack || regra.endereco_picking;
    const tipoLocal = regra.endereco_flow_rack ? "flow_rack" : "picking";

    // Localiza o endereço físico no CD
    const endDestino = enderecos.find((e) => e.codigo === enderecoDestinoCod);
    const prodNoDestino = endDestino?.produtos_alocados.find(
      (p) => p.codigo.trim().toUpperCase() === regra.cod_produto.trim().toUpperCase()
    );

    const saldoAtual = prodNoDestino ? prodNoDestino.quantidade : 0;

    // Condição de Reposição: saldo == 0 (Urgente) ou saldo <= estoque_min (Alta)
    const semEstoque = saldoAtual === 0;
    const abaixoDoMinimo = saldoAtual <= regra.estoque_min_picking;

    if (semEstoque || abaixoDoMinimo || params?.ondaId) {
      // Verifica se já existe tarefa pendente ou em execução para este produto e destino
      const jaTemTarefaAtiva = tarefasExistentes.some(
        (t) =>
          t.cod_produto.toUpperCase() === regra.cod_produto.toUpperCase() &&
          t.endereco_destino === enderecoDestinoCod &&
          (t.status === "pendente" || t.status === "em_execucao")
      );

      if (!jaTemTarefaAtiva) {
        let prioridade: PrioridadeReabastecimento = "programada";
        if (semEstoque) {
          prioridade = "urgente";
        } else if (abaixoDoMinimo) {
          prioridade = "alta";
        }

        // Quantidade a solicitar: para encher até o estoque máximo ou o lote econômico de reposição
        const qtdParaCompletar = Math.max(
          regra.quantidade_reposicao,
          regra.estoque_max_picking - saldoAtual
        );

        // Busca o lote com melhor rotação (FEFO) no pulmão sugerido
        const endPulmao = enderecos.find((e) => e.codigo === regra.endereco_pulmao);
        const prodPulmao = endPulmao?.produtos_alocados.find(
          (p) => p.codigo.trim().toUpperCase() === regra.cod_produto.trim().toUpperCase()
        );
        const loteOrigem = prodPulmao?.lote || "LOTE-PULMAO";

        const seq = (tarefasExistentes.length + novasTarefas.length + 1).toString().padStart(4, "0");
        const numeroTarefa = `REAB-${anoAtual}-${seq}`;

        const novaTarefa: TarefaReabastecimento = {
          id: `tar-${crypto.randomUUID()}`,
          numero_tarefa: numeroTarefa,
          cod_produto: regra.cod_produto,
          descricao: regra.descricao,
          ean: regra.ean,
          lote: loteOrigem,
          tipo_local: tipoLocal,
          prioridade,
          status: "pendente",
          endereco_origem: regra.endereco_pulmao,
          endereco_destino: enderecoDestinoCod,
          saldo_atual_destino: saldoAtual,
          estoque_min_destino: regra.estoque_min_picking,
          quantidade_solicitada: qtdParaCompletar,
          quantidade_atendida: 0,
          unidade_movimentacao: regra.unidade_movimentacao,
          origem_gatilho: params?.ondaId ? "onda_separacao" : "estoque_minimo",
          onda_separacao_id: params?.ondaId,
          supervisor_nome: params?.supervisorNome || "Monitor Inteligente WMS",
          criado_em: new Date().toISOString(),
          bipagens_conferencia: {
            origem_bipada: false,
            produto_bipado: false,
            destino_bipado: false,
          },
          observacoes: semEstoque
            ? `Ruptura crítica detectada: Picking [${enderecoDestinoCod}] sem estoque! Abastecimento urgente.`
            : `Saldo atual (${saldoAtual}) atingiu o ponto de ressuprimento mínimo (${regra.estoque_min_picking}).`,
        };

        novasTarefas.push(novaTarefa);
      }
    }
  }

  for (const t of novasTarefas) {
    await saveTarefaReabastecimento(t);
  }

  return { totalGeradas: novasTarefas.length, tarefas: novasTarefas };
}

// ─── CONSULTA ESPECIAL PARA FLOW RACK (Item 4.2) ──────────────────────
// "Para flow rack, ao bipar o endereço, o sistema deve informar qual SKU deve ser abastecido,
// mantendo o mesmo SKU no mesmo lugar (local fixo), e o sistema informar qual a localização deve ser
// retirado (estoque pulmão para flow rack) e quantidade necessária de acordo com a capacidade do local/caixa"

export async function consultarFlowRackPorBipagem(
  enderecoCodigo: string
): Promise<FlowRackInfoConsulta | null> {
  const [enderecos, regras] = await Promise.all([getEnderecos(), getRegrasReposicao()]);

  const end = enderecos.find(
    (e) => e.codigo.trim().toUpperCase() === enderecoCodigo.trim().toUpperCase()
  );

  // Procura regra cadastrada vinculada a este endereço
  const regra = regras.find(
    (r) =>
      (r.endereco_flow_rack && r.endereco_flow_rack.toUpperCase() === enderecoCodigo.toUpperCase()) ||
      r.endereco_picking.toUpperCase() === enderecoCodigo.toUpperCase()
  );

  if (!regra && (!end || end.produtos_alocados.length === 0)) {
    return null;
  }

  const codProduto = regra ? regra.cod_produto : end?.produtos_alocados[0]?.codigo || "SKU-DESCONHECIDO";
  const descricao = regra ? regra.descricao : end?.produtos_alocados[0]?.descricao || "Produto Flow Rack";
  const ean = regra?.ean || (end?.produtos_alocados[0]?.ean ?? "");
  const estoqueMin = regra ? regra.estoque_min_picking : 100;
  const estoqueMax = regra ? regra.estoque_max_picking : 500;
  const capacidadeCaixas = regra?.capacidade_caixas_flow_rack || 20;
  const pulmaoPadrao = regra ? regra.endereco_pulmao : "A-01-02-02-01";

  // Saldo atual presente no flow rack
  const prodNoLocal = end?.produtos_alocados.find(
    (p) => p.codigo.trim().toUpperCase() === codProduto.trim().toUpperCase()
  );
  const saldoAtual = prodNoLocal ? prodNoLocal.quantidade : 0;
  const precisaReabastecer = saldoAtual <= estoqueMin;

  let prioridade: PrioridadeReabastecimento = "programada";
  if (saldoAtual === 0) prioridade = "urgente";
  else if (saldoAtual <= estoqueMin) prioridade = "alta";

  const qtdNecessaria = Math.max(0, estoqueMax - saldoAtual);

  return {
    endereco_codigo: enderecoCodigo.toUpperCase(),
    cod_produto: codProduto,
    descricao,
    ean,
    saldo_atual: saldoAtual,
    estoque_minimo: estoqueMin,
    estoque_maximo: estoqueMax,
    capacidade_caixas: capacidadeCaixas,
    pulmao_sugerido: pulmaoPadrao,
    quantidade_necessaria: qtdNecessaria,
    precisa_reabastecer: precisaReabastecer,
    prioridade_sugerida: prioridade,
  };
}

// ─── EXECUÇÃO GUIADA PELO COLETOR (Item 4.3) ───────────────────────────

export async function executarPassoColetor(params: {
  tarefaId: string;
  passo: "bipar_origem" | "bipar_produto" | "informar_qtd" | "bipar_destino" | "concluir";
  valorBipado?: string;
  quantidadeInformada?: number;
  operadorNome: string;
  divergenciaMotivo?: string;
}): Promise<{ success: boolean; tarefa?: TarefaReabastecimento; error?: string }> {
  const tarefas = await getTarefasReabastecimento();
  const tarefa = tarefas.find((t) => t.id === params.tarefaId);

  if (!tarefa) {
    return { success: false, error: "Tarefa de reabastecimento não encontrada." };
  }

  if (tarefa.status === "concluida") {
    return { success: false, error: "Esta tarefa já foi concluída anteriormente." };
  }

  if (tarefa.status === "cancelada") {
    return { success: false, error: "Esta tarefa foi cancelada pela supervisão." };
  }

  // 1. Passo: Bipar Origem (Pulmão)
  if (params.passo === "bipar_origem") {
    const esperado = tarefa.endereco_origem.trim().toUpperCase();
    const bipado = (params.valorBipado || "").trim().toUpperCase();

    if (bipado !== esperado) {
      return {
        success: false,
        error: `Endereço de origem incorreto! Esperado [${esperado}], bipado [${bipado}]. Dirija-se ao pulmão correto.`,
      };
    }

    tarefa.bipagens_conferencia.origem_bipada = true;
    tarefa.status = "em_execucao";
    tarefa.operador_nome = params.operadorNome;
    if (!tarefa.iniciado_em) tarefa.iniciado_em = new Date().toISOString();

    const salva = await saveTarefaReabastecimento(tarefa);
    return { success: true, tarefa: salva };
  }

  // 2. Passo: Bipar Produto
  if (params.passo === "bipar_produto") {
    if (!tarefa.bipagens_conferencia.origem_bipada) {
      return { success: false, error: "Bipe primeiro o endereço de origem no pulmão." };
    }

    const bipado = (params.valorBipado || "").trim().toUpperCase();
    const codEsperado = tarefa.cod_produto.trim().toUpperCase();
    const eanEsperado = (tarefa.ean || "").trim().toUpperCase();

    if (bipado !== codEsperado && bipado !== eanEsperado) {
      return {
        success: false,
        error: `Produto incorreto! Esperado [${codEsperado}], bipado [${bipado}]. Verifique a embalagem.`,
      };
    }

    tarefa.bipagens_conferencia.produto_bipado = true;
    const salva = await saveTarefaReabastecimento(tarefa);
    return { success: true, tarefa: salva };
  }

  // 3. Passo: Informar Quantidade Retirada
  if (params.passo === "informar_qtd") {
    const qtd = Number(params.quantidadeInformada);
    if (isNaN(qtd) || qtd <= 0) {
      return { success: false, error: "Informe uma quantidade válida maior que zero." };
    }

    tarefa.bipagens_conferencia.qtd_confirmada = qtd;
    tarefa.quantidade_atendida = qtd;

    if (qtd !== tarefa.quantidade_solicitada) {
      tarefa.divergencia_qtd = tarefa.quantidade_solicitada - qtd;
      tarefa.divergencia_motivo =
        params.divergenciaMotivo || "Quantidade física no pulmão divergente da solicitada";
    }

    const salva = await saveTarefaReabastecimento(tarefa);
    return { success: true, tarefa: salva };
  }

  // 4. Passo: Bipar Destino (Picking ou Flow Rack)
  if (params.passo === "bipar_destino") {
    const esperado = tarefa.endereco_destino.trim().toUpperCase();
    const bipado = (params.valorBipado || "").trim().toUpperCase();

    if (bipado !== esperado) {
      return {
        success: false,
        error: `Endereço de destino incorreto! Esperado [${esperado}], bipado [${bipado}]. Não abasteça no local errado.`,
      };
    }

    tarefa.bipagens_conferencia.destino_bipado = true;
    const salva = await saveTarefaReabastecimento(tarefa);
    return { success: true, tarefa: salva };
  }

  // 5. Passo: Concluir Movimentação Física no WMS
  if (params.passo === "concluir") {
    if (!tarefa.bipagens_conferencia.origem_bipada || !tarefa.bipagens_conferencia.produto_bipado || !tarefa.bipagens_conferencia.destino_bipado) {
      return {
        success: false,
        error: "Todas as etapas de bipagem (origem, produto e destino) devem ser validadas antes de concluir.",
      };
    }

    const qtdMovimentar = tarefa.quantidade_atendida || tarefa.quantidade_solicitada;

    // Efetiva a movimentação atômica no estoque do armazém (Módulo 03)
    const movResult = await registrarMovimentacao({
      produto_codigo: tarefa.cod_produto,
      produto_descricao: tarefa.descricao,
      ean: tarefa.ean,
      lote: tarefa.lote,
      quantidade: qtdMovimentar,
      unidade_medida: tarefa.unidade_movimentacao,
      origem_endereco: tarefa.endereco_origem,
      destino_endereco: tarefa.endereco_destino,
      regra_estoque: "FEFO",
      motivo: "Ressuprimento de Picking",
      observacao: `Execução da tarefa ${tarefa.numero_tarefa} via coletor por ${params.operadorNome}`,
      usuario_nome: params.operadorNome,
    });

    if (!movResult.success) {
      return {
        success: false,
        error: `Erro ao movimentar estoque físico: ${movResult.error}`,
      };
    }

    tarefa.status = tarefa.divergencia_motivo ? "com_divergencia" : "concluida";
    tarefa.concluido_em = new Date().toISOString();
    tarefa.operador_nome = params.operadorNome;

    const salva = await saveTarefaReabastecimento(tarefa);
    return { success: true, tarefa: salva };
  }

  return { success: false, error: "Passo operacional desconhecido." };
}

// ─── ALOCAÇÃO DE OPERADOR PELO SUPERVISOR ──────────────────────────────
export async function alocarOperadorTarefa(
  tarefaId: string,
  operadorNome: string,
  supervisorNome: string
): Promise<{ success: boolean; tarefa?: TarefaReabastecimento; error?: string }> {
  const tarefas = await getTarefasReabastecimento();
  const tarefa = tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) return { success: false, error: "Tarefa não encontrada." };

  tarefa.operador_nome = operadorNome;
  tarefa.supervisor_nome = supervisorNome;
  tarefa.status = "em_execucao";
  if (!tarefa.iniciado_em) tarefa.iniciado_em = new Date().toISOString();

  const salva = await saveTarefaReabastecimento(tarefa);
  return { success: true, tarefa: salva };
}

// ─── CANCELAMENTO DE TAREFA ───────────────────────────────────────────
export async function cancelarTarefaReabastecimento(
  tarefaId: string,
  motivo: string,
  supervisorNome: string
): Promise<{ success: boolean; tarefa?: TarefaReabastecimento; error?: string }> {
  const tarefas = await getTarefasReabastecimento();
  const tarefa = tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) return { success: false, error: "Tarefa não encontrada." };

  tarefa.status = "cancelada";
  tarefa.observacoes = `${tarefa.observacoes ? tarefa.observacoes + " | " : ""}Cancelada por ${supervisorNome}: ${motivo}`;

  const salva = await saveTarefaReabastecimento(tarefa);
  return { success: true, tarefa: salva };
}
