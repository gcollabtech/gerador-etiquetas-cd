import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Produto, ProdutoFiltros, SEED_PRODUTOS } from "./productTypes";

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

function getProductsFilePath(): string {
  return path.join(getDataDir(), "produtos.json");
}

function atomicWrite(filePath: string, data: any): void {
  const temp = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(temp, filePath);
  } catch (err) {
    console.error("Erro na gravacao atomica de produtos:", err);
  }
}

function readLocalProducts(): Produto[] {
  const file = getProductsFilePath();
  if (!fs.existsSync(file)) {
    atomicWrite(file, SEED_PRODUTOS);
    return SEED_PRODUTOS;
  }
  try {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_PRODUTOS;
  } catch {
    return SEED_PRODUTOS;
  }
}

function toDbRow(p: Produto): Record<string, any> {
  return {
    id: p.id || crypto.randomUUID(),
    cod_produto: String(p.cod_produto || "").trim(),
    descricao: String(p.descricao || "").trim().toUpperCase(),
    ean: String(p.ean || "").replace(/\D/g, ""),
    updated_at: new Date().toISOString(),
  };
}

function fromDbRow(row: any): Produto {
  return {
    id: String(row.id),
    cod_produto: String(row.cod_produto || ""),
    descricao: String(row.descricao || ""),
    ean: String(row.ean || ""),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,
  };
}

/**
 * Consulta produtos com suporte a busca textual por descrição, código ou EAN.
 */
export async function getProducts(filters?: ProdutoFiltros): Promise<Produto[]> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      let queryUrl = `${cfg.url}/rest/v1/produtos?select=*&order=created_at.desc`;
      
      const res = await fetch(queryUrl, {
        headers: getSupabaseHeaders(cfg.key),
        cache: "no-store",
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          let list = rows.map(fromDbRow);
          
          if (filters?.search) {
            const term = filters.search.trim().toLowerCase();
            list = list.filter(
              (p) =>
                p.descricao.toLowerCase().includes(term) ||
                p.cod_produto.toLowerCase().includes(term) ||
                p.ean.includes(term)
            );
          }
          return list;
        }
      } else {
        console.warn("Supabase /rest/v1/produtos retornou status:", res.status);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos no Supabase:", err);
    }
  }

  // Fallback local
  let local = readLocalProducts();
  if (filters?.search) {
    const term = filters.search.trim().toLowerCase();
    local = local.filter(
      (p) =>
        p.descricao.toLowerCase().includes(term) ||
        p.cod_produto.toLowerCase().includes(term) ||
        p.ean.includes(term)
    );
  }
  return local;
}

/**
 * Salva ou atualiza um produto individual.
 */
export async function saveProduct(product: Partial<Produto>): Promise<Produto> {
  const item: Produto = {
    id: product.id || `prd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    cod_produto: String(product.cod_produto || "").trim(),
    descricao: String(product.descricao || "").trim().toUpperCase(),
    ean: String(product.ean || "").replace(/\D/g, ""),
    created_at: product.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const dbRow = toDbRow(item);
      const res = await fetch(`${cfg.url}/rest/v1/produtos`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(cfg.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(dbRow),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          return fromDbRow(data[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar produto no Supabase:", err);
    }
  }

  // Fallback local
  const local = readLocalProducts();
  const idx = local.findIndex((p) => p.id === item.id || p.cod_produto === item.cod_produto);
  if (idx >= 0) {
    local[idx] = item;
  } else {
    local.unshift(item);
  }
  atomicWrite(getProductsFilePath(), local);
  return item;
}

/**
 * Salva múltiplos produtos em massa (essencial para importação de planilhas Excel).
 */
export async function bulkSaveProducts(products: Partial<Produto>[]): Promise<{ count: number; saved: Produto[] }> {
  const prepared: Produto[] = products.map((p, i) => ({
    id: p.id || `prd-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
    cod_produto: String(p.cod_produto || "").trim(),
    descricao: String(p.descricao || "").trim().toUpperCase(),
    ean: String(p.ean || "").replace(/\D/g, ""),
    created_at: p.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const dbRows = prepared.map(toDbRow);
      const res = await fetch(`${cfg.url}/rest/v1/produtos`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(cfg.key),
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(dbRows),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return { count: data.length, saved: data.map(fromDbRow) };
        }
      } else {
        console.warn("Falha no upsert em massa Supabase:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Erro no upsert em massa de produtos no Supabase:", err);
    }
  }

  // Fallback local
  const local = readLocalProducts();
  for (const item of prepared) {
    const idx = local.findIndex((p) => p.id === item.id || p.cod_produto === item.cod_produto);
    if (idx >= 0) {
      local[idx] = item;
    } else {
      local.unshift(item);
    }
  }
  atomicWrite(getProductsFilePath(), local);
  return { count: prepared.length, saved: prepared };
}

/**
 * Exclui um produto por ID.
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/produtos?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getSupabaseHeaders(cfg.key),
      });
      if (res.ok) return true;
    } catch (err) {
      console.error("Erro ao excluir produto no Supabase:", err);
    }
  }

  // Fallback local
  const local = readLocalProducts();
  const filtered = local.filter((p) => p.id !== id);
  atomicWrite(getProductsFilePath(), filtered);
  return true;
}

/**
 * Exclui múltiplos produtos por lista de IDs.
 */
export async function bulkDeleteProducts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const filterIn = ids.map((id) => `"${id}"`).join(",");
      const res = await fetch(`${cfg.url}/rest/v1/produtos?id=in.(${filterIn})`, {
        method: "DELETE",
        headers: getSupabaseHeaders(cfg.key),
      });
      if (res.ok) return ids.length;
    } catch (err) {
      console.error("Erro ao excluir múltiplos produtos no Supabase:", err);
    }
  }

  // Fallback local
  const local = readLocalProducts();
  const set = new Set(ids);
  const filtered = local.filter((p) => !set.has(p.id));
  atomicWrite(getProductsFilePath(), filtered);
  return ids.length;
}
