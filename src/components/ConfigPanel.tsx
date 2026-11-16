"use client";

import { useState } from "react";
import {
  AddressParams,
  ValidationResult,
  AddressPreset,
} from "@/lib/types";
import {
  parseComponentNumber,
  formatComponent,
} from "@/lib/addressGenerator";
import {
  SlidersHorizontal,
  AlertTriangle,
  Bookmark,
  Plus,
  Ruler,
  Maximize2,
  Type,
  Barcode,
} from "lucide-react";

interface ConfigPanelProps {
  params: AddressParams;
  onChange: (updated: AddressParams) => void;
  validation: ValidationResult;
  presets: AddressPreset[];
  onSelectPreset: (preset: AddressPreset) => void;
  onSaveCurrentAsPreset: (name: string, description: string) => void;
}

export function ConfigPanel({
  params,
  onChange,
  validation,
  presets,
  onSelectPreset,
  onSaveCurrentAsPreset,
}: ConfigPanelProps) {
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const handleBlur = (
    field: keyof AddressParams,
    prefix: "R" | "P" | "A" | "N"
  ) => {
    const raw = params[field];
    if (typeof raw === "string" && raw.trim() !== "") {
      const num = parseComponentNumber(raw);
      if (!isNaN(num) && num > 0) {
        onChange({
          ...params,
          [field]: formatComponent(num, prefix),
        });
      }
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCurrentAsPreset(
      newPresetName.trim(),
      `Configuração: Rua ${params.ruaInicio}..${params.ruaFim}, Prédio ${params.predioInicio}..${params.predioFim}, Apto ${params.aptoInicio}..${params.aptoFim}, Nível ${params.nivelInicio}..${params.nivelFim}`
    );
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm no-print space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
          <SlidersHorizontal size={17} className="text-[var(--collab-mostarda)]" />
          <span>Configuração dos Parâmetros de Armazenagem</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--muted)] flex items-center gap-1">
            <Bookmark size={12} />
            <span>Padrões:</span>
          </span>
          {presets.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p)}
              className="text-xs px-2.5 py-1 rounded bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all font-medium cursor-pointer"
              title={p.description}
            >
              {p.name.split(" ")[0]} ({p.id === "teste-aceite-6" ? "6 un" : p.id === "exemplo-cd-160" ? "160 un" : "400 un"})
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>3.1. Intervalos de Endereçamento (Inclusivos)</span>
          <span className="text-[11px] font-normal lowercase text-[var(--muted)]">
            ex: R01 a R10, P01 a P05
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--collab-mostarda)]" />
                Rua (R)
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono">01 a 99</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Inicial</label>
                <input
                  type="text"
                  value={params.ruaInicio}
                  onChange={(e) => onChange({ ...params, ruaInicio: e.target.value })}
                  onBlur={() => handleBlur("ruaInicio", "R")}
                  placeholder="R01"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Final</label>
                <input
                  type="text"
                  value={params.ruaFim}
                  onChange={(e) => onChange({ ...params, ruaFim: e.target.value })}
                  onBlur={() => handleBlur("ruaFim", "R")}
                  placeholder="R02"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--collab-mostarda)]" />
                Prédio (P)
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono">01 a 99</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Inicial</label>
                <input
                  type="text"
                  value={params.predioInicio}
                  onChange={(e) => onChange({ ...params, predioInicio: e.target.value })}
                  onBlur={() => handleBlur("predioInicio", "P")}
                  placeholder="P01"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Final</label>
                <input
                  type="text"
                  value={params.predioFim}
                  onChange={(e) => onChange({ ...params, predioFim: e.target.value })}
                  onBlur={() => handleBlur("predioFim", "P")}
                  placeholder="P02"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--collab-mostarda)]" />
                Apartamento (A)
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono">01 a 99</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Inicial</label>
                <input
                  type="text"
                  value={params.aptoInicio}
                  onChange={(e) => onChange({ ...params, aptoInicio: e.target.value })}
                  onBlur={() => handleBlur("aptoInicio", "A")}
                  placeholder="A01"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Final</label>
                <input
                  type="text"
                  value={params.aptoFim}
                  onChange={(e) => onChange({ ...params, aptoFim: e.target.value })}
                  onBlur={() => handleBlur("aptoFim", "A")}
                  placeholder="A10"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--collab-mostarda)]" />
                Nível (N)
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono">01 a 99</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Inicial</label>
                <input
                  type="text"
                  value={params.nivelInicio}
                  onChange={(e) => onChange({ ...params, nivelInicio: e.target.value })}
                  onBlur={() => handleBlur("nivelInicio", "N")}
                  placeholder="N01"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--muted)] mb-1">Final</label>
                <input
                  type="text"
                  value={params.nivelFim}
                  onChange={(e) => onChange({ ...params, nivelFim: e.target.value })}
                  onBlur={() => handleBlur("nivelFim", "N")}
                  placeholder="N04"
                  className="w-full px-2.5 py-1.5 text-sm font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--card-border)]">
        <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">
          3.2. Quantidade de Apartamentos e Níveis (Controle de Validação)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                Quantidade de Apartamentos por Prédio
              </label>
              <p className="text-[11px] text-[var(--muted)]">
                Ex: 10 ou 20 apartamentos previstos
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={params.qtdAptos ?? ""}
              onChange={(e) =>
                onChange({
                  ...params,
                  qtdAptos: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                })
              }
              placeholder="10"
              className="w-24 px-3 py-2 text-sm font-mono font-bold text-center bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
            />
          </div>

          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                Quantidade de Níveis por Apartamento
              </label>
              <p className="text-[11px] text-[var(--muted)]">
                Ex: 4 níveis (N01 a N04)
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={params.qtdNiveis ?? ""}
              onChange={(e) =>
                onChange({
                  ...params,
                  qtdNiveis: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                })
              }
              placeholder="4"
              className="w-24 px-3 py-2 text-sm font-mono font-bold text-center bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--card-border)]">
        <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Ruler size={14} className="text-[var(--collab-mostarda)]" />
            <span>3.3. Dimensões Físicas da Etiqueta (Parametrizável em cm)</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--collab-mostarda)] font-semibold">
            {Number(params.larguraCm || 10)} × {Number(params.alturaCm || 5)} cm ({(Number(params.larguraCm || 10) * 10)} × {(Number(params.alturaCm || 5) * 10)} mm)
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                  Largura da Etiqueta (cm)
                </label>
                <p className="text-[11px] text-[var(--muted)]">
                  Padrão CD: <strong>10 cm</strong> (100 mm)
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="30"
                  value={params.larguraCm ?? 10}
                  onChange={(e) =>
                    onChange({
                      ...params,
                      larguraCm: e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  placeholder="10"
                  className="w-24 px-3 py-2 text-sm font-mono font-bold text-center bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
                <span className="text-xs font-mono font-bold text-[var(--muted)]">cm</span>
              </div>
            </div>

            <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                  Altura da Etiqueta (cm)
                </label>
                <p className="text-[11px] text-[var(--muted)]">
                  Padrão CD: <strong>5 cm</strong> (50 mm)
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="30"
                  value={params.alturaCm ?? 5}
                  onChange={(e) =>
                    onChange({
                      ...params,
                      alturaCm: e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  placeholder="5"
                  className="w-24 px-3 py-2 text-sm font-mono font-bold text-center bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
                <span className="text-xs font-mono font-bold text-[var(--muted)]">cm</span>
              </div>
            </div>
          </div>

          {/* Quick Dimension Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="text-[11px] font-medium text-[var(--muted)] flex items-center gap-1">
              <Maximize2 size={12} />
              <span>Tamanhos Comuns:</span>
            </span>

            {[
              { label: "10 × 5 cm (Padrão CD)", w: 10, h: 5 },
              { label: "10 × 7 cm (Média)", w: 10, h: 7 },
              { label: "10 × 15 cm (Transporte)", w: 10, h: 15 },
              { label: "7 × 4 cm (Prateleira)", w: 7, h: 4 },
              { label: "5 × 3 cm (Caixas)", w: 5, h: 3 },
            ].map((dim) => {
              const isSelected =
                (Number(params.larguraCm || 10) === dim.w) &&
                (Number(params.alturaCm || 5) === dim.h);

              return (
                <button
                  key={dim.label}
                  type="button"
                  onClick={() => onChange({ ...params, larguraCm: dim.w, alturaCm: dim.h })}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)] shadow-sm"
                      : "bg-[var(--secondary)] border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)]"
                  }`}
                >
                  {dim.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3.3. Tipografia das Etiquetas (Fonte e Tamanho das Letras e Números) */}
      <div className="pt-2 border-t border-[var(--card-border)]">
        <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type size={14} className="text-[var(--collab-mostarda)]" />
            <span>3.3. Tipografia das Etiquetas (Ruas, Andares/Prédios, Aptos e Níveis)</span>
          </span>
          <span className="text-[11px] font-normal lowercase text-[var(--muted)]">
            ex: R01-P01-A01-N01
          </span>
        </div>

        <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Família da Fonte */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] block">
                Família da Fonte:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Helvetica", label: "Helvetica", desc: "Sans padrão" },
                  { id: "Courier", label: "Courier", desc: "Monoespaçada" },
                  { id: "Times", label: "Times", desc: "Com serifa" },
                ].map((f) => {
                  const isSelected = (params.fonteFamilia || "Helvetica") === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...params,
                          fonteFamilia: f.id as "Helvetica" | "Courier" | "Times",
                        })
                      }
                      className={`px-2 py-2 text-xs rounded border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)] shadow-sm"
                          : "bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                      }`}
                    >
                      <span className="block font-medium">{f.label}</span>
                      <span className="text-[10px] opacity-75 block">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tamanho da Fonte (pt) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] flex items-center justify-between">
                <span>Tamanho das Letras e Números:</span>
                <span className="text-[11px] font-mono text-[var(--collab-mostarda)]">
                  {params.tamanhoFontePt && Number(params.tamanhoFontePt) > 0
                    ? `${params.tamanhoFontePt} pt`
                    : "Automático proporcional"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="8"
                  max="36"
                  step="1"
                  value={params.tamanhoFontePt ?? 16}
                  onChange={(e) =>
                    onChange({
                      ...params,
                      tamanhoFontePt: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="16"
                  className="w-24 px-3 py-2 text-sm font-mono font-bold text-center bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
                <span className="text-xs font-mono font-bold text-[var(--muted)]">pt</span>

                <button
                  type="button"
                  onClick={() => onChange({ ...params, tamanhoFontePt: "" })}
                  className={`px-2.5 py-2 text-xs rounded border transition-all cursor-pointer ${
                    !params.tamanhoFontePt
                      ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                      : "bg-[var(--card)] border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                  title="Ajustar automaticamente conforme altura da etiqueta"
                >
                  Auto
                </button>
              </div>

              {/* Quick Font Size Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[12, 14, 16, 18, 20, 24].map((sz) => {
                  const isSelected = Number(params.tamanhoFontePt) === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onChange({ ...params, tamanhoFontePt: sz })}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                          : "bg-[var(--secondary)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                      }`}
                    >
                      {sz}pt
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5. Dimensão do Código de Barras (CODE 128) */}
      <div className="pt-2 border-t border-[var(--card-border)]">
        <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Barcode size={14} className="text-[var(--collab-mostarda)]" />
            <span>3.5. Dimensão das Barras do Código de Barras (CODE 128)</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--collab-mostarda)] font-semibold">
            {params.alturaCodigoBarrasMm && Number(params.alturaCodigoBarrasMm) > 0
              ? `${params.alturaCodigoBarrasMm} mm (${(Number(params.alturaCodigoBarrasMm) / 10).toFixed(1)} cm)`
              : "Auto proporcional (~20 mm)"}
          </span>
        </div>

        <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                Altura da Barra do Código de Barras (mm)
              </label>
              <p className="text-[11px] text-[var(--muted)]">
                Ajuste a altura vertical das barras CODE 128 para garantir a leitura perfeita por coletores ópticos e leitores laser em etiquetas de diferentes tamanhos ({Number(params.larguraCm || 10)} × {Number(params.alturaCm || 5)} cm).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="6"
                max="80"
                step="1"
                value={params.alturaCodigoBarrasMm ?? 20}
                onChange={(e) =>
                  onChange({
                    ...params,
                    alturaCodigoBarrasMm: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                  })
                }
                placeholder="20"
                className="w-24 px-3 py-2 text-sm font-mono font-bold text-center bg-[var(--card)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
              />
              <span className="text-xs font-mono font-bold text-[var(--muted)]">mm</span>

              <button
                type="button"
                onClick={() => onChange({ ...params, alturaCodigoBarrasMm: "" })}
                className={`px-2.5 py-2 text-xs rounded border transition-all cursor-pointer ${
                  !params.alturaCodigoBarrasMm
                    ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)]"
                    : "bg-[var(--card)] border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                title="Ajustar automaticamente proporcional à altura da etiqueta"
              >
                Auto
              </button>
            </div>
          </div>

          {/* Quick Barcode Height Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[var(--card-border)]">
            <span className="text-[11px] text-[var(--muted)] font-medium mr-1">
              Alturas Recomendadas:
            </span>
            {[
              { label: "12 mm (Compacta)", val: 12 },
              { label: "16 mm (Pequena)", val: 16 },
              { label: "20 mm (Padrão CD)", val: 20 },
              { label: "25 mm (Média)", val: 25 },
              { label: "30 mm (Alta)", val: 30 },
              { label: "38 mm (Extra Alta)", val: 38 },
            ].map((p) => {
              const isSelected = Number(params.alturaCodigoBarrasMm) === p.val;
              return (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => onChange({ ...params, alturaCodigoBarrasMm: p.val })}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--collab-mostarda)] text-black font-bold border-[var(--collab-mostarda)] shadow-sm"
                      : "bg-[var(--secondary)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {validation.warnings.length > 0 && (
        <div className="p-3.5 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-lg space-y-1">
          {validation.warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[var(--warning)] font-medium">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="p-3.5 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-lg space-y-1">
          {validation.errors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[var(--danger)] font-medium">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs text-[var(--muted)]">
        {isSavingPreset ? (
          <form onSubmit={handleSavePreset} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              required
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Nome do padrão (ex: Mezanino Sul)"
              className="px-2.5 py-1 text-xs bg-[var(--background)] border border-[var(--card-border)] rounded text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-[var(--collab-mostarda)] text-[#080808] font-bold rounded hover:opacity-90 transition-opacity cursor-pointer"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsSavingPreset(false)}
              className="px-2 py-1 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsSavingPreset(true)}
            className="inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--collab-mostarda)] transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Salvar esta configuração como predefinição permanente</span>
          </button>
        )}

        <span className="font-mono text-[11px] text-[var(--collab-mostarda)]">
          Padrão: R01-P01-A01-N01
        </span>
      </div>
    </div>
  );
}
