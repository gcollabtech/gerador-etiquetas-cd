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

        {/* Outer orange frame */}
        <div
          className="relative w-full max-w-[500px] aspect-[2/1] select-none"
          style={{
            backgroundColor: "#FF6400",
            borderRadius: "14px",
            padding: "5%",
            boxSizing: "border-box",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          {/* Inner white area */}
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
              borderRadius: "9px",
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

            {/* Left column — Collab vertical logo */}
            {includeLogo && (
              <div
                style={{
                  width: "14%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: "2.5px solid #CC0000",
                  flexShrink: 0,
                  padding: "6px 2px",
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

            {/* Center — barcode + address */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "3% 2%",
                overflow: "hidden",
              }}
            >
              <div
                style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              <div
                style={{
                  fontFamily: "monospace, Helvetica, Arial",
                  fontWeight: 900,
                  fontSize: "clamp(11px, 3vw, 20px)",
                  color: "#000000",
                  letterSpacing: "0.04em",
                  textAlign: "center",
                  lineHeight: 1,
                  paddingTop: "2%",
                }}
              >
                {sampleAddress.code}
              </div>
            </div>

            {/* Right column — wide bold arrow */}
            <div
              style={{
                width: "20%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: "2px",
                boxSizing: "border-box",
              }}
            >
              {sampleAddress.arrowDirection === "down" ? (
                <svg viewBox="0 0 48 80" style={{ width: "88%", height: "88%", maxHeight: "92%" }} fill="#000000">
                  <rect x="11" y="2" width="26" height="42" />
                  <polygon points="24,78 0,42 48,42" />
                </svg>
              ) : (
                <svg viewBox="0 0 48 80" style={{ width: "88%", height: "88%", maxHeight: "92%" }} fill="#000000">
                  <polygon points="24,2 0,38 48,38" />
                  <rect x="11" y="36" width="26" height="42" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[500px] flex items-center justify-between text-[11px] font-mono text-[var(--muted)] mt-1 px-1">
          <span>Altura: 5 cm (50 mm)</span>
          <span>Frame laranja • Interior branco</span>
          <span>Collab® | Barcode | Seta</span>
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
