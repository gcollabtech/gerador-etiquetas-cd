"use client";

import { useState } from "react";
import { StorageAddress } from "@/lib/types";
import { generateCode128Svg } from "@/lib/code128";
import {
  Eye,
  Ruler,
} from "lucide-react";

interface LabelPreviewProps {
  address: StorageAddress | null;
  includeLogo?: boolean;
}

export function LabelPreview({ address, includeLogo = true }: LabelPreviewProps) {
  const [showGuides, setShowGuides] = useState(true);

  const sampleAddress: StorageAddress = address || {
    id: "sample",
    code: "R01-P01-A01-N01",
    rua: 1,
    predio: 1,
    apto: 1,
    nivel: 1,
    ruaStr: "R01",
    predioStr: "P01",
    aptoStr: "A01",
    nivelStr: "N01",
    arrowDirection: "down",
    barcode: "R01-P01-A01-N01",
    index: 1,
  };

  const isLevelOne = sampleAddress.nivel <= 1;
  const barcodeSvg = generateCode128Svg(sampleAddress.code, 240, 52, 8);

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm no-print space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)]">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={15} className="text-[var(--collab-mostarda)]" />
            <span>6. Pré-visualização da Etiqueta em Escala Proporcional (10 × 5 cm)</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Endereço atual: <strong className="text-[var(--foreground)] font-mono">{sampleAddress.code}</strong>{" "}
            (Nível {sampleAddress.nivelStr} → Seta aponta para{" "}
            <strong className="text-[var(--collab-mostarda)] uppercase">
              {sampleAddress.arrowDirection === "down" ? "Baixo (↓)" : "Cima (↑)"}
            </strong>
            )
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGuides(!showGuides)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-all cursor-pointer ${
            showGuides
              ? "bg-[var(--collab-mostarda)]/15 border-[var(--collab-mostarda)] text-[var(--collab-mostarda)]"
              : "bg-[var(--secondary)] border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Ruler size={13} />
          <span>{showGuides ? "Ocultar Guias 10mm" : "Exibir Guias (10mm)"}</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-[var(--background)] rounded-lg border border-[var(--card-border)] overflow-x-auto">
        <div className="w-full max-w-[500px] flex items-center justify-between text-[11px] font-mono text-[var(--muted)] mb-1 px-1">
          <span>0 cm</span>
          <span>◄─── Largura Total: 10 cm (100 mm) ───►</span>
          <span>10 cm</span>
        </div>

        <div
          className="relative w-full max-w-[500px] aspect-[2/1] bg-white text-black rounded-sm shadow-2xl p-[10%] flex flex-col justify-between overflow-hidden border border-gray-300 select-none"
          style={{
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          {showGuides && (
            <div className="absolute inset-[10%] border-2 border-dashed border-red-400 pointer-events-none z-20 flex items-start justify-end p-1">
              <span className="text-[9px] font-mono font-bold bg-red-100 text-red-700 px-1 rounded shadow-sm opacity-90">
                Área Útil 8 × 3 cm
              </span>
            </div>
          )}

          <div className="w-full h-full flex items-center justify-between z-10 gap-2">
            {includeLogo && (
              <div className="h-full flex flex-col justify-center items-center pr-1 border-r border-gray-200 shrink-0">
                <div
                  className="text-[9px] font-black uppercase tracking-wider text-gray-800 rotate-180"
                  style={{ writingMode: "vertical-rl" }}
                >
                  BIG MASTER • COLLAB CD
                </div>
              </div>
            )}

            <div className="flex-1 h-full flex flex-col items-center justify-between py-1 px-1 overflow-hidden">
              <div
                className="w-full flex-1 flex items-center justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />

              <div className="font-mono font-black text-lg sm:text-2xl text-black tracking-wider leading-none text-center mt-1">
                {sampleAddress.code}
              </div>
            </div>

            <div className="h-full w-14 sm:w-16 flex items-center justify-center pl-1 shrink-0">
              {sampleAddress.arrowDirection === "down" ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-black">
                  <svg
                    viewBox="0 0 40 80"
                    className="w-10 sm:w-12 h-16 sm:h-20"
                    fill="currentColor"
                  >
                    <rect x="14" y="0" width="12" height="48" />
                    <polygon points="20,78 0,46 40,46" />
                  </svg>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-black">
                  <svg
                    viewBox="0 0 40 80"
                    className="w-10 sm:w-12 h-16 sm:h-20"
                    fill="currentColor"
                  >
                    <polygon points="20,2 0,34 40,34" />
                    <rect x="14" y="32" width="12" height="48" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[500px] flex items-center justify-between text-[11px] font-mono text-[var(--muted)] mt-1 px-1">
          <span>Altura: 5 cm (50 mm)</span>
          <span>Margens: 1 cm (10 mm)</span>
          <span>Área Útil: 8 × 3 cm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div
          className={`p-3 rounded border flex items-center gap-3 ${
            isLevelOne
              ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] text-[var(--foreground)]"
              : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)]"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
            ↓
          </div>
          <div>
            <strong className="block text-[var(--foreground)]">Nível N01 (Solo)</strong>
            <span>Seta aponta para BAIXO automaticamente.</span>
          </div>
        </div>

        <div
          className={`p-3 rounded border flex items-center gap-3 ${
            !isLevelOne
              ? "bg-[var(--collab-mostarda)]/10 border-[var(--collab-mostarda)] text-[var(--foreground)]"
              : "bg-[var(--background)] border-[var(--card-border)] text-[var(--muted)]"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
            ↑
          </div>
          <div>
            <strong className="block text-[var(--foreground)]">Nível superior a N01 (Aéreos)</strong>
            <span>Seta aponta para CIMA (N02, N03, N04...).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
