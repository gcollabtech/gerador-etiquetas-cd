"use client";

import { useState } from "react";
import { StorageAddress, LabelFontFamily } from "@/lib/types";
import { generateCode128Svg } from "@/lib/code128";
import {
  Eye,
  Ruler,
} from "lucide-react";

interface LabelPreviewProps {
  address: StorageAddress | null;
  includeLogo?: boolean;
  larguraCm?: number | "";
  alturaCm?: number | "";
  fonteFamilia?: LabelFontFamily;
  tamanhoFontePt?: number | "";
  alturaCodigoBarrasMm?: number | "";
}

export function LabelPreview({
  address,
  includeLogo = true,
  larguraCm = 10,
  alturaCm = 5,
  fonteFamilia = "Helvetica",
  tamanhoFontePt,
  alturaCodigoBarrasMm,
}: LabelPreviewProps) {
  const [showGuides, setShowGuides] = useState(true);

  const wCm = Number(larguraCm) > 0 ? Number(larguraCm) : 10;
  const hCm = Number(alturaCm) > 0 ? Number(alturaCm) : 5;
  const aspectRatio = `${wCm} / ${hCm}`;

  const customBarHeightMm = Number(alturaCodigoBarrasMm);
  const defaultBarHeightMm = Math.max(12, Math.min(42, Math.round((hCm * 10) * 0.40)));
  const barHeightMm = customBarHeightMm > 0 ? customBarHeightMm : defaultBarHeightMm;

  const resolvedFontFamily =
    fonteFamilia === "Courier"
      ? "'Courier New', Courier, monospace"
      : fonteFamilia === "Times"
      ? "'Times New Roman', Times, serif"
      : "Helvetica, Arial, sans-serif";

  const resolvedFontSize =
    tamanhoFontePt && Number(tamanhoFontePt) > 0
      ? `${Number(tamanhoFontePt)}px`
      : "clamp(11px, 3vw, 20px)";

  const sampleAddress: StorageAddress = address || {
    id: "sample",
    code: "R01-P01-N01-A01",
    rua: 1,
    predio: 1,
    nivel: 1,
    apto: 1,
    ruaStr: "R01",
    predioStr: "P01",
    nivelStr: "N01",
    aptoStr: "A01",
    arrowDirection: "down",
    barcode: "R01-P01-N01-A01",
    index: 1,
  };

  const isLevelOne = sampleAddress.nivel <= 1;
  const svgHeight = Math.max(30, Math.min(90, Math.round(barHeightMm * 2.8)));
  const barcodeSvg = generateCode128Svg(sampleAddress.code, 280, svgHeight, 6);

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm no-print space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)]">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={15} className="text-[var(--collab-mostarda)]" />
            <span>3. Pré-visualização da Etiqueta em Escala Proporcional ({wCm} × {hCm} cm)</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Endereço atual: <strong className="text-[var(--foreground)] font-mono">{sampleAddress.code}</strong>{" "}
            (Nível {sampleAddress.nivelStr} → Seta aponta para{" "}
            <strong className="text-[var(--collab-mostarda)] uppercase">
              {sampleAddress.arrowDirection === "down" ? "Baixo (↓)" : "Cima (↑)"}
            </strong>
            ) • Formato: <span className="font-semibold text-[var(--foreground)]">{wCm} cm larg. × {hCm} cm alt.</span>
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
          <span>{showGuides ? "Ocultar Guias" : "Exibir Guias"}</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-[var(--background)] rounded-lg border border-[var(--card-border)] overflow-x-auto">
        <div className="w-full max-w-[520px] flex items-center justify-between text-[11px] font-mono text-[var(--muted)] mb-1 px-1">
          <span>0 cm</span>
          <span>◄─── Largura Nominal: {wCm} cm ({wCm * 10} mm) ───►</span>
          <span>{wCm} cm</span>
        </div>

        {/* Outer orange frame (borda ultra-fina o mais fina possível) */}
        <div
          className="relative select-none transition-all duration-200"
          style={{
            backgroundColor: "#FF6400",
            borderRadius: "4px",
            padding: "1.5px", // borda o mais fina possível
            boxSizing: "border-box",
            fontFamily: "Helvetica, Arial, sans-serif",
            aspectRatio: aspectRatio,
            width: "100%",
            maxWidth: wCm >= hCm ? "520px" : "360px",
            maxHeight: "360px",
          }}
        >
          {/* Inner white area */}
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "3px",
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {showGuides && (
              <div
                className="absolute inset-0 border-2 border-dashed border-blue-400 pointer-events-none z-20 flex items-start justify-end p-1"
              >
                <span className="text-[9px] font-mono font-bold bg-blue-100 text-blue-700 px-1 rounded shadow-sm opacity-90">
                  Área Útil
                </span>
              </div>
            )}

            {/* Left column — Collab vertical logo (14% simétrico) */}
            {includeLogo && (
              <div
                style={{
                  width: "14%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: "2px solid #000000",
                  flexShrink: 0,
                  padding: "4px 2px",
                  boxSizing: "border-box",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-collab-vertical.png"
                  alt="Grupo Collab"
                  style={{
                    maxHeight: "92%",
                    maxWidth: "88%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Center — barcode + address perfeitamente centralizados (72% de área útil) */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.5% 1%",
                overflow: "hidden",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  paddingTop: "2px",
                }}
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              <div
                style={{
                  width: "100%",
                  fontFamily: resolvedFontFamily,
                  fontWeight: 900,
                  fontSize: resolvedFontSize,
                  color: "#000000",
                  letterSpacing: "0.05em",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  paddingBottom: "18px", // sobe significativamente as informações de endereço
                }}
              >
                {sampleAddress.code}
              </div>
            </div>

            {/* Right column — directional arrow alinhada com a barra (14% simétrico) */}
            <div
              style={{
                width: "14%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                padding: "1.5% 1%",
                boxSizing: "border-box",
              }}
            >
              {/* Arrow container: perfeitamente pareado com a imagem do código de barras */}
              <div
                style={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  paddingTop: "2px",
                }}
              >
                {sampleAddress.arrowDirection === "down" ? (
                  <svg
                    viewBox="0 0 42 64"
                    style={{ width: "80%", height: "92%", maxHeight: "100%" }}
                    fill="#000000"
                  >
                    <rect x="12" y="2" width="18" height="34" />
                    <polygon points="21,62 1,32 41,32" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 42 64"
                    style={{ width: "80%", height: "92%", maxHeight: "100%" }}
                    fill="#000000"
                  >
                    <polygon points="21,2 1,32 41,32" />
                    <rect x="12" y="28" width="18" height="34" />
                  </svg>
                )}
              </div>

              {/* Espaçador inferior idêntico ao texto do endereço para travar o alinhamento da seta com o código de barras */}
              <div
                style={{
                  width: "100%",
                  fontSize: resolvedFontSize,
                  lineHeight: 1,
                  paddingBottom: "18px",
                  visibility: "hidden",
                  userSelect: "none",
                }}
              >
                &nbsp;
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[520px] flex items-center justify-between text-[11px] font-mono text-[var(--muted)] mt-2 px-1">
          <span>Largura: <strong className="text-[var(--foreground)]">{wCm} cm</strong> ({wCm * 10} mm)</span>
          <span>Altura: <strong className="text-[var(--foreground)]">{hCm} cm</strong> ({hCm * 10} mm)</span>
          <span>Proporção: <strong className="text-[var(--collab-mostarda)]">{(wCm / hCm).toFixed(2)} : 1</strong></span>
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
