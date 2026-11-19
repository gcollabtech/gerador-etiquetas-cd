import {
  WmsEndereco,
  WmsMovimentacao,
  SugestaoSlottingInput,
  SugestaoSlottingResultado,
  EnderecoTipo,
} from "./wmsArmazenagemTypes";
import { FilaSaidaEstoque } from "./serverArmazenagem";

export async function fetchEnderecosApi(filtros?: {
  rua?: string;
  setor?: string;
  tipo?: string;
  status?: string;
}): Promise<WmsEndereco[]> {
  try {
    const params = new URLSearchParams();
    if (filtros?.rua) params.set("rua", filtros.rua);
    if (filtros?.setor) params.set("setor", filtros.setor);
    if (filtros?.tipo) params.set("tipo", filtros.tipo);
    if (filtros?.status) params.set("status", filtros.status);

    const res = await fetch(`/api/wms/armazenagem/enderecos?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.enderecos)) {
        return data.enderecos;
      }
    }
  } catch (err) {
    console.error("[wmsArmazenagemService] Erro ao buscar endereços:", err);
  }
  return [];
}

export async function fetchMovimentacoesApi(): Promise<WmsMovimentacao[]> {
  try {
    const res = await fetch("/api/wms/armazenagem/movimentacoes");
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.movimentacoes)) {
        return data.movimentacoes;
      }
    }
  } catch (err) {
    console.error("[wmsArmazenagemService] Erro ao buscar movimentações:", err);
  }
  return [];
}

export async function registrarMovimentacaoApi(input: {
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
  try {
    const res = await fetch("/api/wms/armazenagem/movimentacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao conectar com API de movimentação." };
  }
}

export async function bloquearEnderecoApi(
  codigo: string,
  motivo: string,
  operadorNome: string
): Promise<{ success: boolean; endereco?: WmsEndereco; error?: string }> {
  try {
    const res = await fetch("/api/wms/armazenagem/enderecos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bloquear", codigo, motivo, operadorNome }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao bloquear endereço." };
  }
}

export async function desbloquearEnderecoApi(
  codigo: string,
  operadorNome: string
): Promise<{ success: boolean; endereco?: WmsEndereco; error?: string }> {
  try {
    const res = await fetch("/api/wms/armazenagem/enderecos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "desbloquear", codigo, operadorNome }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao desbloquear endereço." };
  }
}

export async function sugerirMelhorEnderecoApi(
  input: SugestaoSlottingInput
): Promise<{ success: boolean; sugestoes?: SugestaoSlottingResultado[]; error?: string }> {
  try {
    const res = await fetch("/api/wms/armazenagem/sugerir-endereco", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao calcular sugestão de slotting." };
  }
}

export async function gerarLayoutEmMassaApi(params: {
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
}): Promise<{ success: boolean; totalGerados?: number; error?: string }> {
  try {
    const res = await fetch("/api/wms/armazenagem/enderecos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gerar_em_massa", ...params }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao gerar layout em massa." };
  }
}

export async function fetchFilaSaidaEstoqueApi(sku?: string): Promise<FilaSaidaEstoque[]> {
  try {
    const params = new URLSearchParams();
    if (sku) params.set("sku", sku);
    const res = await fetch(`/api/wms/armazenagem/fila-saida?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.filas)) {
        return data.filas;
      }
    }
  } catch (err) {
    console.error("[wmsArmazenagemService] Erro ao buscar fila de saída:", err);
  }
  return [];
}
