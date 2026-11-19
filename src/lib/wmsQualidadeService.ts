import {
  InspecaoQualidade,
  NaoConformidadeQualidade,
  BloqueioQualidade,
  IndicadoresQualidade,
  DestinacaoQualidade,
  TipoBloqueioQualidade,
  TipoOcorrenciaNC,
  TipoInspecao,
  QUALIDADE_SEED,
} from "./wmsQualidadeTypes";

export async function fetchQualidadeData(): Promise<{
  inspecoes: InspecaoQualidade[];
  naoConformidades: NaoConformidadeQualidade[];
  bloqueios: BloqueioQualidade[];
  indicadores: IndicadoresQualidade;
}> {
  try {
    const res = await fetch("/api/wms/qualidade", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    if (json.success) {
      return {
        inspecoes: json.data.inspecoes,
        naoConformidades: json.data.naoConformidades,
        bloqueios: json.data.bloqueios,
        indicadores: json.indicadores,
      };
    }
    throw new Error(json.error || "Erro ao obter dados");
  } catch (err) {
    console.warn("Fallback offline para dados de Qualidade:", err);
    return {
      inspecoes: QUALIDADE_SEED.inspecoes,
      naoConformidades: QUALIDADE_SEED.naoConformidades,
      bloqueios: QUALIDADE_SEED.bloqueios,
      indicadores: {
        totalInspecoes: QUALIDADE_SEED.inspecoes.length,
        taxaConformidade: 67,
        inspecoesAprovadas: 1,
        inspecoesQuarentena: 1,
        inspecoesRejeitadas: 1,
        rncsAbertas: 2,
        totalBloqueiosAtivos: 3,
        skusBloqueados: 2,
        lotesBloqueados: 1,
        enderecosBloqueados: 2,
        devolucoesPendentes: 1,
        descartesAprovados: 0,
      },
    };
  }
}

export async function submitNovaInspecao(params: {
  tipoInspecao: TipoInspecao;
  origem: "recebimento" | "armazenado_cd";
  inspetor: string;
  produtoId: string;
  produtoDescricao: string;
  sku: string;
  lote: string;
  validade: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNotaFiscal: string;
  chaveNfe?: string;
  enderecoArmazenamento?: string;
  quantidadeTotalLote: number;
  quantidadeInspecionada: number;
  unidadeMedida: string;
  temperaturaAferida?: number;
  temperaturaMinExigida?: number;
  temperaturaMaxExigida?: number;
  condicoesTransporte?: {
    veiculoHigienizado: boolean;
    ausenciaOdoresPragas: boolean;
    bauFechadoTermico: boolean;
    observacaoTransporte?: string;
  };
  checklist: {
    integridadeEmbalagem: boolean;
    validadeConforme: boolean;
    loteLegivel: boolean;
    identificacaoRotulagem: boolean;
    condicoesFisicas: boolean;
    temperaturaConforme?: boolean;
    transporteConforme?: boolean;
  };
  parecerTecnico: string;
}): Promise<{ success: boolean; error?: string; inspecao?: InspecaoQualidade }> {
  try {
    const res = await fetch("/api/wms/qualidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao submeter inspeção." };
  }
}

export async function submitNovaNaoConformidade(params: {
  produtoId: string;
  produtoDescricao: string;
  sku: string;
  lote: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNotaFiscal: string;
  quantidadeAfetada: number;
  unidadeMedida: string;
  tipoOcorrencia: TipoOcorrenciaNC;
  fotos?: Array<{ legenda: string; url: string }>;
  responsavel: string;
  parecer: string;
  destinacao: DestinacaoQualidade;
  endereco?: string;
  bloquearEstoque?: boolean;
}): Promise<{ success: boolean; error?: string; rnc?: NaoConformidadeQualidade }> {
  try {
    const res = await fetch("/api/wms/qualidade/nao-conformidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao registrar RNC." };
  }
}

export async function submitNovoBloqueio(params: {
  tipoBloqueio: TipoBloqueioQualidade;
  motivo: string;
  produtoId?: string;
  sku?: string;
  produtoDescricao?: string;
  lote?: string;
  endereco?: string;
  numeroNotaFiscal?: string;
  quantidadeBloqueada?: number;
  unidadeMedida?: string;
  responsavel: string;
}): Promise<{ success: boolean; error?: string; bloqueio?: BloqueioQualidade }> {
  try {
    const res = await fetch("/api/wms/qualidade/bloqueios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao criar bloqueio." };
  }
}

export async function submitDesbloqueio(params: {
  bloqueioId: string;
  responsavel: string;
  justificativa: string;
}): Promise<{ success: boolean; error?: string; bloqueio?: BloqueioQualidade }> {
  try {
    const res = await fetch("/api/wms/qualidade/bloqueios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "desbloquear",
        ...params,
      }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao desbloquear item." };
  }
}

export async function submitDestinacaoRnc(params: {
  rncId: string;
  destinacao: DestinacaoQualidade;
  responsavel: string;
  parecer: string;
  liberarBloqueioAssociado?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  rnc?: NaoConformidadeQualidade;
  protocoloGerado?: string;
}> {
  try {
    const res = await fetch("/api/wms/qualidade/destinacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao definir destinação." };
  }
}
