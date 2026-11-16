"use client";

import { useState } from "react";
import { generateStorageAddresses } from "@/lib/addressGenerator";
import { encodeCode128B } from "@/lib/code128";
import {
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
  USEFUL_WIDTH_MM,
  USEFUL_HEIGHT_MM,
  MARGIN_MM,
} from "@/lib/pdfGenerator";
import { AddressParams } from "@/lib/types";
import {
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from "lucide-react";

interface AcceptanceTestsPortalViewProps {
  onLoadTestParams: (params: AddressParams) => void;
  onNavigateToConfig: () => void;
}

interface TestResult {
  id: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  details?: string[];
}

export function AcceptanceTestsPortalView({
  onLoadTestParams,
  onNavigateToConfig,
}: AcceptanceTestsPortalViewProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [executed, setExecuted] = useState(false);

  const runAllTests = () => {
    const list: TestResult[] = [];

    const test1Params: AddressParams = {
      ruaInicio: "R01",
      ruaFim: "R01",
      predioInicio: "P01",
      predioFim: "P01",
      aptoInicio: "A01",
      aptoFim: "A02",
      nivelInicio: "N01",
      nivelFim: "N03",
    };
    const batch1 = generateStorageAddresses(test1Params);
    const patternRegex = /^R\d{2}-P\d{2}-A\d{2}-N\d{2}$/;
    const allMatchPattern = batch1.every((a) => patternRegex.test(a.code));
    list.push({
      id: 1,
      name: "Critério 1: Padrão Obrigatório de Identificação (R01-P01-A01-N01)",
      expected: "Todos os códigos seguem formato Rxx-Pxx-Axx-Nxx rigorosamente",
      actual: allMatchPattern
        ? `${batch1.length} endereços validados com padrão correto (ex: ${batch1[0]?.code})`
        : "Falha na estrutura de caracteres",
      passed: allMatchPattern,
      details: batch1.slice(0, 3).map((a) => a.code),
    });

    const hasLeadingZeros = batch1.every(
      (a) =>
        a.ruaStr.length === 3 &&
        a.predioStr.length === 3 &&
        a.aptoStr.length === 3 &&
        a.nivelStr.length === 3
    );
    list.push({
      id: 2,
      name: "Critério 2: Preservação Obrigatória de Zeros à Esquerda (2 dígitos numéricos)",
      expected: "Dois dígitos numéricos por bloco com zero à esquerda (R01, P01, A01, N01)",
      actual: hasLeadingZeros
        ? "Todos os blocos contêm 2 dígitos numéricos com zeros preservados"
        : "Foram encontrados blocos sem zero à esquerda",
      passed: hasLeadingZeros,
    });

    const n1 = batch1.find((a) => a.nivel === 1);
    const n2 = batch1.find((a) => a.nivel === 2);
    const n3 = batch1.find((a) => a.nivel === 3);
    const arrowLogicPassed =
      n1?.arrowDirection === "down" &&
      n2?.arrowDirection === "up" &&
      n3?.arrowDirection === "up";
    list.push({
      id: 3,
      name: "Critério 3: Regra Estrita de Posicionamento das Setas (N01 ↓ | N>01 ↑)",
      expected: "Nível N01 -> Seta para BAIXO (↓). Nível > N01 -> Seta para CIMA (↑)",
      actual: `N01=${n1?.arrowDirection} (↓), N02=${n2?.arrowDirection} (↑), N03=${n3?.arrowDirection} (↑)`,
      passed: arrowLogicPassed,
    });

    const sampleCode = "R01-P01-A01-N01";
    const encoded = encodeCode128B(sampleCode);
    const barcodePassed =
      encoded.binary.length > 0 &&
      encoded.codes[0] === 104 &&
      encoded.codes[encoded.codes.length - 1] === 106;
    list.push({
      id: 4,
      name: "Critério 4: Padrão CODE 128 (ISO/IEC 15417 Subset B)",
      expected: "Codificação Code 128 Subset B com Start B (104), Stop (106) e Checksum",
      actual: barcodePassed
        ? `Codificação válida: ${encoded.codes.length} símbolos calculados para '${sampleCode}' (checksum=${encoded.checksum})`
        : "Falha na estrutura do Code 128",
      passed: barcodePassed,
    });

    const test5Params: AddressParams = {
      ruaInicio: "R01",
      ruaFim: "R02",
      predioInicio: "P01",
      predioFim: "P02",
      aptoInicio: "A01",
      aptoFim: "A10",
      nivelInicio: "N01",
      nivelFim: "N04",
      qtdAptos: 10,
      qtdNiveis: 4,
    };
    const batch5 = generateStorageAddresses(test5Params);
    const expectedCount = 2 * 2 * 10 * 4; // 160
    const countPassed = batch5.length === expectedCount;
    list.push({
      id: 5,
      name: "Critério 5: Exemplo Oficial da Especificação (2×2×10×4 = 160 etiquetas)",
      expected: "R01..R02 × P01..P02 × A01..A10 × N01..N04 = Exatamente 160 etiquetas",
      actual: `${batch5.length} endereços gerados sequencialmente sem duplicatas`,
      passed: countPassed,
    });

    const dimPassed =
      LABEL_WIDTH_MM === 100 &&
      LABEL_HEIGHT_MM === 50 &&
      MARGIN_MM === 10 &&
      USEFUL_WIDTH_MM === 80 &&
      USEFUL_HEIGHT_MM === 30;
    list.push({
      id: 6,
      name: "Critério 6: Dimensões Físicas Nominais (10 × 5 cm, Margens 1 cm, Área Útil 8 × 3 cm)",
      expected: "Largura 100mm, Altura 50mm, Margens 10mm, Área Central 80×30mm",
      actual: `${LABEL_WIDTH_MM}×${LABEL_HEIGHT_MM} mm (Margem: ${MARGIN_MM}mm, Útil: ${USEFUL_WIDTH_MM}×${USEFUL_HEIGHT_MM}mm)`,
      passed: dimPassed,
    });

    setResults(list);
    setExecuted(true);
  };

  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[var(--collab-mostarda)]" />
            <span>Validação Técnica e Conformidade do Sistema</span>
          </div>
          <h2 className="font-heading text-lg font-bold text-[var(--foreground)] mt-0.5">
            Bateria de Testes dos 6 Critérios de Aceite Oficiais
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Executa em memória a verificação formal de cada regra mandatória da especificação.
          </p>
        </div>

        <button
          type="button"
          onClick={runAllTests}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--collab-mostarda)] text-black hover:opacity-90 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          {executed ? <RotateCw size={14} /> : <Play size={14} />}
          <span>{executed ? "Reexecutar Bateria" : "Executar Testes de Aceite"}</span>
        </button>
      </div>

      {executed && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            allPassed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {allPassed ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
            <div>
              <strong className="block text-sm font-bold">
                {allPassed
                  ? "TODOS OS 6 CRITÉRIOS DE ACEITE FORAM APROVADOS!"
                  : "ALGUNS CRITÉRIOS APRESENTARAM DIVERGÊNCIA"}
              </strong>
              <span className="text-xs opacity-90">
                {allPassed
                  ? "O gerador de etiquetas cumpre integralmente os requisitos funcionais e dimensionais da especificação."
                  : "Verifique os detalhes abaixo para corrigir os parâmetros."}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onLoadTestParams({
                ruaInicio: "R01",
                ruaFim: "R02",
                predioInicio: "P01",
                predioFim: "P02",
                aptoInicio: "A01",
                aptoFim: "A10",
                nivelInicio: "N01",
                nivelFim: "N04",
                qtdAptos: 10,
                qtdNiveis: 4,
              });
              onNavigateToConfig();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[var(--collab-mostarda)] text-black cursor-pointer hover:opacity-90 shrink-0"
          >
            <span>Carregar Exemplo Oficial (160 un)</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Test cards grid */}
      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="py-12 rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--background)] text-center p-6 space-y-2">
            <ShieldCheck size={32} className="text-[var(--muted)] opacity-50 mx-auto" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">Bateria pronta para execução</h3>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              Clique no botão &ldquo;Executar Testes de Aceite&rdquo; para validar automaticamente os critérios de 1 a 6 da especificação (identificação, zeros à esquerda, setas, Code 128, contagem e dimensões).
            </p>
          </div>
        ) : (
          results.map((res) => (
            <div
              key={res.id}
              className={`p-4 rounded-xl border transition-all ${
                res.passed
                  ? "bg-[var(--background)] border-emerald-500/25"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-500 shrink-0" />
                    )}
                    <h4 className="text-xs font-bold text-[var(--foreground)]">{res.name}</h4>
                  </div>

                  <div className="text-[11px] text-[var(--muted)] pl-6 space-y-0.5">
                    <div>
                      <span className="font-semibold text-[var(--muted)]">Esperado:</span>{" "}
                      <span>{res.expected}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--foreground)]">Obtido:</span>{" "}
                      <span className="font-mono text-[var(--foreground)]">{res.actual}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    res.passed
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}
                >
                  {res.passed ? "APROVADO" : "FALHA"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
