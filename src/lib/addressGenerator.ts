import {
  AddressParams,
  StorageAddress,
  GenerationSummary,
  ValidationResult,
  ArrowDirection,
} from "./types";

export function parseComponentNumber(val: string | number | undefined): number {
  if (val === undefined || val === null) return NaN;
  if (typeof val === "number") return val;
  const digits = val.toString().replace(/[^0-9]/g, "");
  if (!digits) return NaN;
  return parseInt(digits, 10);
}

export function formatComponent(num: number, prefix: "R" | "P" | "A" | "N"): string {
  const pad = num.toString().padStart(2, "0");
  return `${prefix}${pad}`;
}

export function validateAddressParams(params: AddressParams): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rIni = parseComponentNumber(params.ruaInicio);
  const rFim = parseComponentNumber(params.ruaFim);
  const pIni = parseComponentNumber(params.predioInicio);
  const pFim = parseComponentNumber(params.predioFim);
  const aIni = parseComponentNumber(params.aptoInicio);
  const aFim = parseComponentNumber(params.aptoFim);
  const nIni = parseComponentNumber(params.nivelInicio);
  const nFim = parseComponentNumber(params.nivelFim);

  if (isNaN(rIni)) errors.push("Rua inicial não informada ou inválida.");
  if (isNaN(rFim)) errors.push("Rua final não informada ou inválida.");
  if (isNaN(pIni)) errors.push("Prédio inicial não informado ou inválido.");
  if (isNaN(pFim)) errors.push("Prédio final não informado ou inválido.");
  if (isNaN(aIni)) errors.push("Apartamento inicial não informado ou inválido.");
  if (isNaN(aFim)) errors.push("Apartamento final não informado ou inválido.");
  if (isNaN(nIni)) errors.push("Nível inicial não informado ou inválido.");
  if (isNaN(nFim)) errors.push("Nível final não informado ou inválido.");

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  if (rIni < 1) errors.push("Rua inicial deve ser maior ou igual a 1.");
  if (rIni > rFim) errors.push(`Rua inicial (${rIni}) não pode ser maior que a rua final (${rFim}).`);

  if (pIni < 1) errors.push("Prédio inicial deve ser maior ou igual a 1.");
  if (pIni > pFim) errors.push(`Prédio inicial (${pIni}) não pode ser maior que o prédio final (${pFim}).`);

  if (aIni < 1) errors.push("Apartamento inicial deve ser maior ou igual a 1.");
  if (aIni > aFim) errors.push(`Apartamento inicial (${aIni}) não pode ser maior que o apartamento final (${aFim}).`);

  if (nIni < 1) errors.push("Nível inicial deve ser maior ou igual a 1.");
  if (nIni > nFim) errors.push(`Nível inicial (${nIni}) não pode ser maior que o nível final (${nFim}).`);

  const calcAptos = aFim - aIni + 1;
  if (params.qtdAptos !== undefined && params.qtdAptos !== "" && !isNaN(Number(params.qtdAptos))) {
    const qA = Number(params.qtdAptos);
    if (qA <= 0) {
      errors.push("Quantidade de apartamentos deve ser maior que zero.");
    } else if (qA !== calcAptos) {
      warnings.push(
        `Divergência detectada: a quantidade informada (${qA} aptos) difere do intervalo (${calcAptos} aptos de A${aIni.toString().padStart(2, "0")} até A${aFim.toString().padStart(2, "0")}). O intervalo será utilizado como referência.`
      );
    }
  }

  const calcNiveis = nFim - nIni + 1;
  if (params.qtdNiveis !== undefined && params.qtdNiveis !== "" && !isNaN(Number(params.qtdNiveis))) {
    const qN = Number(params.qtdNiveis);
    if (qN <= 0) {
      errors.push("Quantidade de níveis deve ser maior que zero.");
    } else if (qN !== calcNiveis) {
      warnings.push(
        `Divergência detectada: a quantidade informada (${qN} níveis) difere do intervalo (${calcNiveis} níveis de N${nIni.toString().padStart(2, "0")} até N${nFim.toString().padStart(2, "0")}). O intervalo será utilizado como referência.`
      );
    }
  }

  if (params.larguraCm !== undefined && params.larguraCm !== "") {
    const w = Number(params.larguraCm);
    if (isNaN(w) || w <= 0) {
      errors.push("A largura da etiqueta deve ser um número maior que zero.");
    } else if (w < 3 || w > 30) {
      warnings.push(`Largura informada (${w} cm): os padrões térmicos e de bobinas usuais variam entre 3 cm e 22 cm.`);
    }
  }

  if (params.alturaCm !== undefined && params.alturaCm !== "") {
    const h = Number(params.alturaCm);
    if (isNaN(h) || h <= 0) {
      errors.push("A altura da etiqueta deve ser um número maior que zero.");
    } else if (h < 2 || h > 30) {
      warnings.push(`Altura informada (${h} cm): os padrões térmicos e de bobinas usuais variam entre 2 cm e 30 cm.`);
    }
  }

  const total = (rFim - rIni + 1) * (pFim - pIni + 1) * calcAptos * calcNiveis;
  if (total > 3000) {
    warnings.push(
      `Atenção: A geração totalizará ${total.toLocaleString("pt-BR")} etiquetas. Para impressões em massa, recomenda-se gerar por rua ou prédio para melhor desempenho do coletor/impressora.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function calculateGenerationSummary(params: AddressParams): GenerationSummary {
  const rIni = parseComponentNumber(params.ruaInicio);
  const rFim = parseComponentNumber(params.ruaFim);
  const pIni = parseComponentNumber(params.predioInicio);
  const pFim = parseComponentNumber(params.predioFim);
  const aIni = parseComponentNumber(params.aptoInicio);
  const aFim = parseComponentNumber(params.aptoFim);
  const nIni = parseComponentNumber(params.nivelInicio);
  const nFim = parseComponentNumber(params.nivelFim);

  if (
    isNaN(rIni) || isNaN(rFim) || rIni > rFim ||
    isNaN(pIni) || isNaN(pFim) || pIni > pFim ||
    isNaN(aIni) || isNaN(aFim) || aIni > aFim ||
    isNaN(nIni) || isNaN(nFim) || nIni > nFim
  ) {
    return {
      qtdRuas: 0,
      qtdPrediosPorRua: 0,
      qtdNiveisPorPredio: 0,
      qtdAptosPorNivel: 0,
      qtdAptosPorPredio: 0,
      qtdNiveisPorApto: 0,
      totalEnderecos: 0,
      totalEtiquetas: 0,
    };
  }

  const qtdRuas = rFim - rIni + 1;
  const qtdPrediosPorRua = pFim - pIni + 1;
  const qtdNiveisPorPredio = nFim - nIni + 1;
  const qtdAptosPorNivel = aFim - aIni + 1;
  const totalEnderecos = qtdRuas * qtdPrediosPorRua * qtdNiveisPorPredio * qtdAptosPorNivel;

  return {
    qtdRuas,
    qtdPrediosPorRua,
    qtdNiveisPorPredio,
    qtdAptosPorNivel,
    qtdAptosPorPredio: qtdAptosPorNivel,
    qtdNiveisPorApto: qtdNiveisPorPredio,
    totalEnderecos,
    totalEtiquetas: totalEnderecos,
  };
}

export function generateStorageAddresses(params: AddressParams): StorageAddress[] {
  const validation = validateAddressParams(params);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  const rIni = parseComponentNumber(params.ruaInicio);
  const rFim = parseComponentNumber(params.ruaFim);
  const pIni = parseComponentNumber(params.predioInicio);
  const pFim = parseComponentNumber(params.predioFim);
  const nIni = parseComponentNumber(params.nivelInicio);
  const nFim = parseComponentNumber(params.nivelFim);
  const aIni = parseComponentNumber(params.aptoInicio);
  const aFim = parseComponentNumber(params.aptoFim);

  const addresses: StorageAddress[] = [];
  let index = 1;

  for (let r = rIni; r <= rFim; r++) {
    const ruaStr = formatComponent(r, "R");

    for (let p = pIni; p <= pFim; p++) {
      const predioStr = formatComponent(p, "P");

      for (let n = nIni; n <= nFim; n++) {
        const nivelStr = formatComponent(n, "N");
        const arrowDirection: ArrowDirection = n <= 1 ? "down" : "up";

        for (let a = aIni; a <= aFim; a++) {
          const aptoStr = formatComponent(a, "A");
          // Sequência homologada: Rua, Prédio, Nível e Apartamento
          const code = `${ruaStr}-${predioStr}-${nivelStr}-${aptoStr}`;

          addresses.push({
            id: code,
            code,
            rua: r,
            predio: p,
            nivel: n,
            apto: a,
            ruaStr,
            predioStr,
            nivelStr,
            aptoStr,
            arrowDirection,
            barcode: code,
            index,
          });

          index++;
        }
      }
    }
  }

  return addresses;
}
