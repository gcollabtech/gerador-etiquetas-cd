import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  WmsEndereco,
  WmsMovimentacao,
  SugestaoSlottingInput,
  SugestaoSlottingResultado,
  ProdutoAlocado,
  SEED_ENDERECOS,
  SEED_MOVIMENTACOES,
  formatarCodigoEndereco,
  EnderecoTipo,
  CurvaAbc,
} from "./wmsArmazenagemTypes";

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

function getEnderecosFilePath(): string {
  return path.join(getDataDir(), "wms_enderecos.json");
}

function getMovimentacoesFilePath(): string {
  return path.join(getDataDir(), "wms_movimentacoes.json");
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

// ─── ENDEREÇOS LOCAL & CLOUD ──────────────────────────────────────────

export async function getEnderecos(): Promise<WmsEndereco[]> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/wms_enderecos?select=*&order=codigo.asc`, {
        headers: getSupabaseHeaders(cfg.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          atomicWrite(getEnderecosFilePath(), rows);
          return rows;
        }
      }
    } catch (err) {
      console.warn("[serverArmazenagem] Falha ao consultar Supabase, usando arquivo local:", err);
    }
  }

  // Fallback local
  const filePath = getEnderecosFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  // Seed padrão
  atomicWrite(filePath, SEED_ENDERECOS);
  return SEED_ENDERECOS;
}

export async function saveEndereco(endereco: WmsEndereco): Promise<WmsEndereco> {
  const cfg = getSupabaseConfig();
  const agora = new Date().toISOString();
  const payload = {
    ...endereco,
    updated_at: agora,
    created_at: endereco.created_at || agora,
  };

  if (cfg) {
    try {
      await fetch(`${cfg.url}/rest/v1/wms_enderecos?on_conflict=codigo`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(cfg.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("[serverArmazenagem] Erro ao salvar endereco no Supabase:", err);
    }
  }

  // Atualiza local
  const todos = await getEnderecos();
  const idx = todos.findIndex((e) => e.codigo === endereco.codigo || e.id === endereco.id);
  if (idx >= 0) {
    todos[idx] = payload;
  } else {
    todos.push(payload);
  }
  atomicWrite(getEnderecosFilePath(), todos);
  return payload;
}

export async function bloquearEndereco(
  codigo: string,
  motivo: string,
  operadorNome: string
): Promise<{ success: boolean; endereco?: WmsEndereco; error?: string }> {
  const enderecos = await getEnderecos();
  const end = enderecos.find((e) => e.codigo === codigo);
  if (!end) return { success: false, error: "Endereço não encontrado." };

  end.status = "bloqueado";
  end.motivo_bloqueio = motivo;
  end.bloqueado_em = new Date().toISOString();
  end.bloqueado_por = operadorNome;

  const atualizado = await saveEndereco(end);
  return { success: true, endereco: atualizado };
}

export async function desbloquearEndereco(
  codigo: string,
  operadorNome: string
): Promise<{ success: boolean; endereco?: WmsEndereco; error?: string }> {
  const enderecos = await getEnderecos();
  const end = enderecos.find((e) => e.codigo === codigo);
  if (!end) return { success: false, error: "Endereço não encontrado." };

  end.status = end.produtos_alocados.length > 0 ? "ocupado" : "livre";
  end.motivo_bloqueio = undefined;
  end.bloqueado_em = undefined;
  end.bloqueado_por = undefined;

  const atualizado = await saveEndereco(end);
  return { success: true, endereco: atualizado };
}

// ─── GERADOR DE LAYOUT EM MASSA ───────────────────────────────────────
export async function gerarLayoutEmMassa(params: {
  setor: string;
  ruaInicio: number;
  ruaFim: number;
  predioInicio: number;
  predioFim: number;
  niveis: number[];
  posicoesPorNivel: number[];
  tipoPadrao: EnderecoTipo;
  pesoMaximoKg?: number;
  volumeMaximoM3?: number;
}): Promise<{ totalGerados: number; enderecos: WmsEndereco[] }> {
  const existentes = await getEnderecos();
  const mapaExistentes = new Map(existentes.map((e) => [e.codigo, e]));
  const novos: WmsEndereco[] = [];

  for (let r = params.ruaInicio; r <= params.ruaFim; r++) {
    for (let p = params.predioInicio; p <= params.predioFim; p++) {
      for (const nivel of params.niveis) {
        for (const pos of params.posicoesPorNivel) {
          const cod = formatarCodigoEndereco(
            params.setor,
            String(r),
            String(p),
            String(nivel),
            String(pos)
          );

          if (!mapaExistentes.has(cod)) {
            // Nível 01 padrão picking ergonômico, níveis superiores pulmão/porta-paletes
            let tipo = params.tipoPadrao;
            if (nivel === 1 && params.tipoPadrao === "porta_paletes") {
              tipo = "picking";
            } else if (nivel >= 3 && params.tipoPadrao === "picking") {
              tipo = "pulmao";
            }

            const novo: WmsEndereco = {
              id: `end-${crypto.randomUUID()}`,
              codigo: cod,
              setor: params.setor.toUpperCase(),
              rua: String(r).padStart(2, "0"),
              predio: String(p).padStart(2, "0"),
              nivel: String(nivel).padStart(2, "0"),
              posicao: String(pos).padStart(2, "0"),
              tipo,
              status: "livre",
              peso_max_kg: params.pesoMaximoKg || (nivel === 1 ? 1200 : nivel <= 3 ? 1000 : 800),
              peso_atual_kg: 0,
              volume_max_m3: params.volumeMaximoM3 || 2.4,
              volume_atual_m3: 0,
              curva_abc_permitida: nivel <= 2 ? "A" : "todas",
              temperatura: "ambiente",
              produtos_alocados: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            novos.push(novo);
            mapaExistentes.set(cod, novo);
          }
        }
      }
    }
  }

  if (novos.length > 0) {
    const todos = Array.from(mapaExistentes.values());
    atomicWrite(getEnderecosFilePath(), todos);

    // Salva em lote no Supabase se disponível
    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.url}/rest/v1/wms_enderecos?on_conflict=codigo`, {
          method: "POST",
          headers: {
            ...getSupabaseHeaders(cfg.key),
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(novos),
        });
      } catch (err) {
        console.warn("[serverArmazenagem] Erro ao sincronizar layout com Supabase:", err);
      }
    }
  }

  return { totalGerados: novos.length, enderecos: novos };
}

// ─── MOVIMENTAÇÕES INTERNAS ───────────────────────────────────────────

export async function getMovimentacoes(): Promise<WmsMovimentacao[]> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/wms_movimentacoes?select=*&order=created_at.desc`, {
        headers: getSupabaseHeaders(cfg.key),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          atomicWrite(getMovimentacoesFilePath(), rows);
          return rows;
        }
      }
    } catch {}
  }

  const filePath = getMovimentacoesFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  atomicWrite(filePath, SEED_MOVIMENTACOES);
  return SEED_MOVIMENTACOES;
}

export async function registrarMovimentacao(input: {
  produto_id?: string;
  produto_codigo: string;
  produto_descricao: string;
  ean?: string;
  lote?: string;
  data_validade?: string;
  quantidade: number;
  unidade_medida?: string;
  origem_endereco: string;
  destino_endereco: string;
  regra_estoque?: "FEFO" | "FIFO" | "LIFO" | "MANUAL";
  motivo: string;
  observacao?: string;
  usuario_id?: string;
  usuario_nome: string;
}): Promise<{ success: boolean; movimentacao?: WmsMovimentacao; error?: string }> {
  if (input.origem_endereco === input.destino_endereco) {
    return { success: false, error: "O endereço de origem e destino não podem ser iguais." };
  }
  if (input.quantidade <= 0) {
    return { success: false, error: "A quantidade a ser movimentada deve ser maior que zero." };
  }

  const enderecos = await getEnderecos();
  const endOrigem = enderecos.find((e) => e.codigo.trim() === input.origem_endereco.trim());
  const endDestino = enderecos.find((e) => e.codigo.trim() === input.destino_endereco.trim());

  if (!endOrigem) {
    return { success: false, error: `Endereço de origem [${input.origem_endereco}] não foi encontrado no CD.` };
  }
  if (!endDestino) {
    return { success: false, error: `Endereço de destino [${input.destino_endereco}] não foi encontrado no CD.` };
  }

  if (endDestino.status === "bloqueado") {
    return {
      success: false,
      error: `Endereço de destino [${input.destino_endereco}] está bloqueado: ${endDestino.motivo_bloqueio || "Interdição operacional"}.`,
    };
  }

  // 1. Localiza o produto na origem (exceto se for doca/recebimento onde pode ser entrada nova)
  let itemOrigem = endOrigem.produtos_alocados.find(
    (p) =>
      p.codigo.trim().toUpperCase() === input.produto_codigo.trim().toUpperCase() ||
      (input.ean && p.ean === input.ean)
  );

  if (!itemOrigem && endOrigem.tipo !== "recebimento") {
    return {
      success: false,
      error: `Produto [${input.produto_codigo}] não está alocado no endereço de origem [${input.origem_endereco}].`,
    };
  }

  if (itemOrigem && itemOrigem.quantidade < input.quantidade) {
    return {
      success: false,
      error: `Saldo insuficiente na origem [${input.origem_endereco}]: disponível ${itemOrigem.quantidade} ${itemOrigem.unidade_medida}, solicitado ${input.quantidade}.`,
    };
  }

  // 2. Desconta na Origem
  if (itemOrigem) {
    itemOrigem.quantidade -= input.quantidade;
    if (itemOrigem.quantidade <= 0) {
      endOrigem.produtos_alocados = endOrigem.produtos_alocados.filter((p) => p.id !== itemOrigem!.id);
    }
  }

  // Recalcula peso e volume da origem
  endOrigem.peso_atual_kg = endOrigem.produtos_alocados.reduce((acc, p) => acc + p.quantidade * p.peso_unit_kg, 0);
  endOrigem.volume_atual_m3 = endOrigem.produtos_alocados.reduce((acc, p) => acc + p.quantidade * p.volume_unit_m3, 0);
  if (endOrigem.status !== "bloqueado") {
    endOrigem.status = endOrigem.produtos_alocados.length === 0 ? "livre" : "ocupado";
  }

  // 3. Adiciona no Destino
  const pesoUnitario = itemOrigem?.peso_unit_kg || 1.0;
  const volumeUnitario = itemOrigem?.volume_unit_m3 || 0.005;
  const pesoMovimentado = input.quantidade * pesoUnitario;
  const volumeMovimentado = input.quantidade * volumeUnitario;

  // Validação de capacidade de peso no destino
  if (endDestino.peso_atual_kg + pesoMovimentado > endDestino.peso_max_kg) {
    return {
      success: false,
      error: `Capacidade de peso excedida no destino [${endDestino.codigo}]. Máx: ${endDestino.peso_max_kg}kg, Atual: ${endDestino.peso_atual_kg}kg, Adicional: ${pesoMovimentado}kg.`,
    };
  }

  let itemDestino = endDestino.produtos_alocados.find(
    (p) =>
      p.codigo.trim().toUpperCase() === input.produto_codigo.trim().toUpperCase() &&
      (!input.lote || p.lote === input.lote)
  );

  if (itemDestino) {
    itemDestino.quantidade += input.quantidade;
    if (input.data_validade) itemDestino.data_validade = input.data_validade;
    itemDestino.dias_sem_movimentacao = 0;
  } else {
    const novoProduto: ProdutoAlocado = {
      id: `prod-${crypto.randomUUID()}`,
      produto_id: input.produto_id || itemOrigem?.produto_id || `p-${Date.now()}`,
      codigo: input.produto_codigo,
      descricao: input.produto_descricao || itemOrigem?.descricao || input.produto_codigo,
      ean: input.ean || itemOrigem?.ean || "",
      lote: input.lote || itemOrigem?.lote || "LOTE-PADRAO",
      data_fabricacao: itemOrigem?.data_fabricacao || new Date().toISOString().split("T")[0],
      data_validade: input.data_validade || itemOrigem?.data_validade,
      quantidade: input.quantidade,
      unidade_medida: input.unidade_medida || itemOrigem?.unidade_medida || "UN",
      peso_unit_kg: pesoUnitario,
      volume_unit_m3: volumeUnitario,
      categoria: itemOrigem?.categoria || "Geral",
      curva_abc: itemOrigem?.curva_abc || "A",
      data_entrada: new Date().toISOString().split("T")[0] || "2026-11-19",
      dias_sem_movimentacao: 0,
    };
    endDestino.produtos_alocados.push(novoProduto);
  }

  endDestino.peso_atual_kg += pesoMovimentado;
  endDestino.volume_atual_m3 += volumeMovimentado;
  endDestino.status = "ocupado";

  // 4. Salva os dois endereços atualizados
  await saveEndereco(endOrigem);
  await saveEndereco(endDestino);

  // 5. Registra o log da movimentação
  const mov: WmsMovimentacao = {
    id: `mov-${crypto.randomUUID()}`,
    produto_id: input.produto_id || itemOrigem?.produto_id || `p-${Date.now()}`,
    produto_codigo: input.produto_codigo,
    produto_descricao: input.produto_descricao,
    ean: input.ean || itemOrigem?.ean,
    lote: input.lote || itemOrigem?.lote,
    data_validade: input.data_validade || itemOrigem?.data_validade,
    quantidade: input.quantidade,
    unidade_medida: input.unidade_medida || itemOrigem?.unidade_medida || "UN",
    origem_endereco: endOrigem.codigo,
    destino_endereco: endDestino.codigo,
    regra_estoque: input.regra_estoque || "FEFO",
    motivo: input.motivo,
    observacao: input.observacao,
    usuario_id: input.usuario_id,
    usuario_nome: input.usuario_nome,
    created_at: new Date().toISOString(),
  };

  const todasMovs = await getMovimentacoes();
  todasMovs.unshift(mov);
  atomicWrite(getMovimentacoesFilePath(), todasMovs);

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      await fetch(`${cfg.url}/rest/v1/wms_movimentacoes`, {
        method: "POST",
        headers: getSupabaseHeaders(cfg.key),
        body: JSON.stringify(mov),
      });
    } catch {}
  }

  return { success: true, movimentacao: mov };
}

// ─── REGRAS DE ESTOQUE (FIFO / FEFO / LIFO) ────────────────────────────
export interface FilaSaidaEstoque {
  produto_codigo: string;
  produto_descricao: string;
  ean: string;
  regra_recomendada: "FEFO" | "FIFO" | "LIFO";
  motivo_regra: string;
  itens_ordenados: {
    endereco_codigo: string;
    endereco_tipo: EnderecoTipo;
    lote: string;
    data_validade?: string;
    data_entrada: string;
    quantidade: number;
    unidade_medida: string;
    dias_para_vencer?: number;
    dias_estocado: number;
    prioridade_saida: number; // 1 = retirar primeiro
    status_validade: "critica" | "atencao" | "ok" | "vencido";
  }[];
}

export async function calcularFilaSaidaEstoque(skuFiltro?: string): Promise<FilaSaidaEstoque[]> {
  const enderecos = await getEnderecos();
  const mapaPorSku = new Map<string, { desc: string; ean: string; lotes: any[] }>();

  for (const end of enderecos) {
    if (end.tipo === "quarentena" || end.tipo === "avaria" || end.status === "bloqueado") {
      // Ignora áreas segregadas para saída comum
      continue;
    }
    for (const prod of end.produtos_alocados) {
      if (skuFiltro && !prod.codigo.toLowerCase().includes(skuFiltro.toLowerCase()) && !prod.ean.includes(skuFiltro)) {
        continue;
      }

      if (!mapaPorSku.has(prod.codigo)) {
        mapaPorSku.set(prod.codigo, {
          desc: prod.descricao,
          ean: prod.ean,
          lotes: [],
        });
      }

      const hoje = new Date();
      let diasVencer: number | undefined = undefined;
      let statusValidade: "critica" | "atencao" | "ok" | "vencido" = "ok";

      if (prod.data_validade) {
        const dVal = new Date(prod.data_validade);
        const diffMs = dVal.getTime() - hoje.getTime();
        diasVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diasVencer < 0) statusValidade = "vencido";
        else if (diasVencer <= 30) statusValidade = "critica";
        else if (diasVencer <= 60) statusValidade = "atencao";
      }

      const dEnt = new Date(prod.data_entrada);
      const diasEstocado = Math.max(0, Math.ceil((hoje.getTime() - dEnt.getTime()) / (1000 * 60 * 60 * 24)));

      mapaPorSku.get(prod.codigo)!.lotes.push({
        endereco_codigo: end.codigo,
        endereco_tipo: end.tipo,
        lote: prod.lote,
        data_validade: prod.data_validade,
        data_entrada: prod.data_entrada,
        quantidade: prod.quantidade,
        unidade_medida: prod.unidade_medida,
        dias_para_vencer: diasVencer,
        dias_estocado: diasEstocado,
        status_validade: statusValidade,
      });
    }
  }

  const filas: FilaSaidaEstoque[] = [];

  for (const [cod, data] of mapaPorSku.entries()) {
    // Se o produto tiver data de validade, FEFO é compulsório
    const temValidade = data.lotes.some((l) => Boolean(l.data_validade));
    const regra: "FEFO" | "FIFO" | "LIFO" = temValidade ? "FEFO" : "FIFO";
    const motivo = temValidade
      ? "FEFO obrigatório (Medicamentos / Alimentos perecíveis priorizam menor data de validade)"
      : "FIFO padrão (Itens sem validade estrita priorizam lote com maior tempo no armazém)";

    // Ordenação
    if (regra === "FEFO") {
      data.lotes.sort((a, b) => {
        if (!a.data_validade) return 1;
        if (!b.data_validade) return -1;
        return new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime();
      });
    } else {
      data.lotes.sort((a, b) => new Date(a.data_entrada).getTime() - new Date(b.data_entrada).getTime());
    }

    // Atribui ranking de prioridade
    const ordenados = data.lotes.map((item, idx) => ({
      ...item,
      prioridade_saida: idx + 1,
    }));

    filas.push({
      produto_codigo: cod,
      produto_descricao: data.desc,
      ean: data.ean,
      regra_recomendada: regra,
      motivo_regra: motivo,
      itens_ordenados: ordenados,
    });
  }

  return filas;
}

// ─── IA / ALGORITMO INTELIGENTE DE SLOTTING (Item 3.4) ────────────────
export async function sugerirMelhorEndereco(
  input: SugestaoSlottingInput
): Promise<SugestaoSlottingResultado[]> {
  const enderecos = await getEnderecos();

  // Filtra endereços elegíveis (não bloqueados, não quarentena, não avaria)
  const candidatos = enderecos.filter((e) => {
    if (e.status === "bloqueado") return false;
    if (e.tipo === "quarentena" || e.tipo === "avaria" || e.tipo === "bloqueado") return false;
    // Capacidade física de peso
    if (e.peso_atual_kg + input.peso_total_kg > e.peso_max_kg) return false;
    // Capacidade de volume
    if (e.volume_atual_m3 + input.volume_total_m3 > e.volume_max_m3) return false;
    return true;
  });

  const resultados: SugestaoSlottingResultado[] = [];

  for (const end of candidatos) {
    let score = 50; // Base neutra
    const motivos: string[] = [];
    const nivelNum = Number.parseInt(end.nivel, 10) || 1;

    // 1. Regra de Giro de Estoque & IA de Slotting Dinâmico
    // Produtos Curva A devem ficar concentrados em locais estratégicos:
    // Níveis ergonômicos 01 e 02 (Picking/Flow Rack) e Ruas próximas à expedição (ex: Rua 01)
    if (input.curva_abc === "A") {
      if (nivelNum <= 2) {
        score += 30;
        motivos.push("Alto Giro (Curva A): Posição ergonômica Nível baixo (01/02) reduz esforço e tempo de picking");
      } else {
        score -= 20;
        motivos.push("Penalidade: Curva A em nível aéreo (> 02) prejudica produtividade");
      }

      if (end.tipo === "picking" || end.tipo === "flow_rack" || end.tipo === "pulmao_flow_rack") {
        score += 20;
        motivos.push(`Tipo ideal [${end.tipo.toUpperCase()}] para separação rápida`);
      }

      if (end.rua === "01") {
        score += 10;
        motivos.push("Rua 01 de fluxo rápido e alta densidade operacional");
      }
    } else if (input.curva_abc === "B") {
      if (nivelNum >= 2 && nivelNum <= 3) {
        score += 20;
        motivos.push("Médio Giro (Curva B): Nível intermediário (02/03) balanceado");
      }
    } else if (input.curva_abc === "C") {
      // Baixo giro deve ir para níveis superiores (03, 04, 05) para não ocupar posições nobres
      if (nivelNum >= 3) {
        score += 30;
        motivos.push("Baixo Giro (Curva C): Alocado em nível superior (03/04/05), preservando posições nobres de picking");
      } else {
        score -= 15;
        motivos.push("Alerta: Curva C ocupando posição nobre de chão/nível 01");
      }
    }

    // 2. Regra de Segurança e Peso
    // Itens pesados (> 300kg) DEVEM ficar nos níveis 01 ou 02 por estabilidade estrutural
    let segurancaPeso = true;
    if (input.peso_total_kg > 300) {
      if (nivelNum <= 2) {
        score += 25;
        motivos.push(`Carga Pesada (${input.peso_total_kg}kg): Alocada com segurança estrutural no nível ${end.nivel}`);
      } else {
        score -= 40;
        segurancaPeso = false;
        motivos.push(`ALERTA DE SEGURANÇA: Carga pesada (${input.peso_total_kg}kg) em nível aéreo (${end.nivel})`);
      }
    }

    // 3. Consolidação de Estoque (Lote & SKU existente)
    const jaTemSku = end.produtos_alocados.some(
      (p) => p.codigo.trim().toUpperCase() === input.cod_produto.trim().toUpperCase()
    );
    if (jaTemSku) {
      score += 15;
      motivos.push("Consolidação: Endereço já possui o mesmo produto estocado");
    }

    // 4. Compatibilidade de Categoria
    if (input.categoria && end.categoria_permitida && end.categoria_permitida !== "todas") {
      if (end.categoria_permitida.toLowerCase() === input.categoria.toLowerCase()) {
        score += 10;
        motivos.push(`Compatibilidade de Categoria [${end.categoria_permitida}]`);
      } else {
        score -= 25;
        motivos.push(`Incompatibilidade: Endereço restrito para [${end.categoria_permitida}]`);
      }
    }

    // 5. Aproveitamento de Capacidade Residual
    const folgaPesoKg = end.peso_max_kg - (end.peso_atual_kg + input.peso_total_kg);
    if (folgaPesoKg >= 100) {
      score += 5;
    }

    const nivelErgo: "chao_picking" | "medio_ergonomico" | "aereo_pulmao" =
      nivelNum === 1 ? "chao_picking" : nivelNum === 2 ? "medio_ergonomico" : "aereo_pulmao";

    resultados.push({
      endereco: end,
      score: Math.min(100, Math.max(10, score)),
      motivos_recomendacao: motivos,
      nivel_ergonomico: nivelErgo,
      curva_adequada: input.curva_abc === "A" ? nivelNum <= 2 : input.curva_abc === "C" ? nivelNum >= 3 : true,
      seguranca_peso_ok: segurancaPeso,
    });
  }

  // Ordena por maior pontuação
  resultados.sort((a, b) => b.score - a.score);

  return resultados.slice(0, 6);
}
