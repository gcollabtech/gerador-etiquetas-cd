"use client";

import { useState, useEffect } from "react";
import {
  AddressParams,
  ValidationResult,
  AddressPreset,
} from "@/lib/types";
import {
  parseComponentNumber,
  formatComponent,
} from "@/lib/addressGenerator";
import { isCustomPreset } from "@/lib/historyStorage";
import {
  SlidersHorizontal,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Plus,
  Ruler,
  Maximize2,
  Type,
  Barcode,
  Save,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
  FolderDown,
  Sparkles,
} from "lucide-react";

interface ConfigPanelProps {
  params: AddressParams;
  onChange: (updated: AddressParams) => void;
  validation: ValidationResult;
  presets: AddressPreset[];
  activePresetId?: string | null;
  onSelectPreset: (preset: AddressPreset) => void;
  onSaveCurrentAsPreset: (name: string, description: string) => void;
  onUpdatePreset?: (id: string, name: string, description: string) => void;
  onDeletePreset?: (id: string) => void;
  onResetPresets?: () => void;
  isExternalSaveModalOpen?: boolean;
  onCloseExternalSaveModal?: () => void;
}

export function ConfigPanel({
  params,
  onChange,
  validation,
  presets,
  activePresetId,
  onSelectPreset,
  onSaveCurrentAsPreset,
  onUpdatePreset,
  onDeletePreset,
  onResetPresets,
  isExternalSaveModalOpen,
  onCloseExternalSaveModal,
}: ConfigPanelProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [modalModelName, setModalModelName] = useState("");
  const [modalModelDesc, setModalModelDesc] = useState("");
  const [modalExcluirPreset, setModalExcluirPreset] = useState<AddressPreset | null>(null);
  const [isGerenciarModelosOpen, setIsGerenciarModelosOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sincroniza se o modal foi acionado externamente pelo botão do header
  useEffect(() => {
    if (isExternalSaveModalOpen) {
      setModalModelName(`Modelo ${params.larguraCm || 10}x${params.alturaCm || 5}cm - ${new Date().toLocaleDateString("pt-BR")}`);
      setModalModelDesc(`Configuração com barras de ${params.alturaCodigoBarrasMm || 20}mm e endereçamento R${params.ruaInicio}..R${params.ruaFim}`);
      setIsSaveModalOpen(true);
    }
  }, [isExternalSaveModalOpen, params]);

  const activePreset = presets.find((p) => p.id === activePresetId);
  const customPresets = presets.filter(isCustomPreset);

  const handleOpenSaveModal = () => {
    setModalModelName(
      activePreset && isCustomPreset(activePreset)
        ? `${activePreset.name} (Cópia)`
        : `Modelo CD ${params.larguraCm || 10}x${params.alturaCm || 5}cm (${params.ruaInicio}-${params.ruaFim})`
    );
    setModalModelDesc(
      `Dimensões: ${params.larguraCm || 10}×${params.alturaCm || 5}cm • Barras: ${params.alturaCodigoBarrasMm || 20}mm • ${params.ruaInicio}..${params.ruaFim}, ${params.predioInicio}..${params.predioFim}, ${params.aptoInicio}..${params.aptoFim}, ${params.nivelInicio}..${params.nivelFim}`
    );
    setIsSaveModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSaveModalOpen(false);
    onCloseExternalSaveModal?.();
  };

  const handleConfirmSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalModelName.trim()) return;

    const finalDesc =
      modalModelDesc.trim() ||
      `Dimensões: ${params.larguraCm || 10}×${params.alturaCm || 5}cm • Barras: ${params.alturaCodigoBarrasMm || 20}mm • Ruas: ${params.ruaInicio}..${params.ruaFim}`;

    onSaveCurrentAsPreset(modalModelName.trim(), finalDesc);
    setFeedbackMsg(`Modelo "${modalModelName.trim()}" gravado com sucesso!`);
    setTimeout(() => setFeedbackMsg(null), 4000);
    handleCloseModal();
  };

  const handleConfirmDeletePreset = () => {
    if (!modalExcluirPreset) return;
    const target = modalExcluirPreset;
    onDeletePreset?.(target.id);
    setFeedbackMsg(`Modelo "${target.name}" excluído com sucesso!`);
    setTimeout(() => setFeedbackMsg(null), 4000);
    setModalExcluirPreset(null);
  };

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

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm no-print space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
          <SlidersHorizontal size={17} className="text-[var(--collab-mostarda)]" />
          <span>Configuração dos Parâmetros de Armazenagem</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            title="Gravar modelo atual de etiqueta para reutilização futura"
          >
            <Save size={13} />
            <span>Gravar Modelo Atual</span>
          </button>
        </div>
      </div>

      {/* 3.0. SEÇÃO DE MODELOS DE ETIQUETA PARAMETRIZADOS */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center shrink-0 mt-0.5">
              <BookmarkCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide">
                  Modelos de Etiqueta Parametrizados
                </h3>
                {activePreset && isCustomPreset(activePreset) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--collab-mostarda)] text-black">
                    Modelo Personalizado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Grave e reutilize modelos completos (dimensões em cm, altura de barras Code 128 e faixas de endereçamento).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activePreset && onUpdatePreset && (
              <button
                type="button"
                onClick={() => {
                  onUpdatePreset(activePreset.id, activePreset.name, activePreset.description);
                  setFeedbackMsg(`Modelo "${activePreset.name}" atualizado com os parâmetros correntes!`);
                  setTimeout(() => setFeedbackMsg(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] bg-[var(--card)] text-xs text-[var(--foreground)] font-semibold cursor-pointer transition-all"
                title="Salvar alterações atuais neste modelo"
              >
                <RotateCcw size={12} className="text-[var(--collab-mostarda)]" />
                <span>Atualizar Modelo</span>
              </button>
            )}

            {activePreset && onDeletePreset && (
              <button
                type="button"
                onClick={() => setModalExcluirPreset(activePreset)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-xs text-red-400 hover:text-red-300 font-bold cursor-pointer transition-all shadow-sm"
                title="Excluir o modelo selecionado"
              >
                <Trash2 size={13} className="text-red-400" />
                <span>Excluir Modelo Ativo</span>
              </button>
            )}

            {customPresets.length > 0 && (
              <button
                type="button"
                onClick={() => setIsGerenciarModelosOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] bg-[var(--card)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-medium cursor-pointer transition-all"
                title="Ver e gerenciar todos os modelos personalizados gravados"
              >
                <FolderDown size={12} className="text-[var(--collab-mostarda)]" />
                <span>Gerenciar ({customPresets.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              title="Gravar como novo modelo com outro nome"
            >
              <Plus size={13} />
              <span>Gravar Novo Modelo</span>
            </button>
          </div>
        </div>

        {/* Banner de Feedback */}
        {feedbackMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span className="font-semibold">{feedbackMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Grade de Modelos Disponíveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {presets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const isCustom = isCustomPreset(preset);
            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 group ${
                  isSelected
                    ? "bg-[var(--card)] border-[var(--collab-mostarda)] ring-1 ring-[var(--collab-mostarda)]/60 shadow-md"
                    : "bg-[var(--card)] border-[var(--card-border)] hover:border-[var(--collab-mostarda)]/40 hover:bg-[var(--secondary)]/40"
                }`}
              >
                {/* Linha de Topo do Card com Nome, Badge e Botão Excluir */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--collab-mostarda)] transition-colors block">
                      {preset.name}
                    </span>
                    <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                      isCustom
                        ? "bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border-[var(--collab-mostarda)]/30"
                        : "bg-[var(--secondary)] text-[var(--muted)] border-[var(--card-border)]"
                    }`}>
                      {isCustom ? "Personalizado" : "Padrão CD"}
                    </span>
                  </div>

                  {onDeletePreset && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalExcluirPreset(preset);
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 cursor-pointer transition-all shrink-0"
                      title={`Excluir modelo "${preset.name}"`}
                      aria-label="Excluir modelo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>

                {/* Rodapé do Card com Parâmetros e Botão de Ação de Exclusão */}
                <div className="pt-2.5 border-t border-[var(--card-border)]/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--collab-mostarda)] font-semibold flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)]">
                      {preset.params.larguraCm || 10} × {preset.params.alturaCm || 5} cm
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--card-border)]">
                      {preset.params.alturaCodigoBarrasMm || 20} mm
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onDeletePreset && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalExcluirPreset(preset);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-[11px] font-bold cursor-pointer transition-colors"
                        title={`Excluir modelo "${preset.name}"`}
                      >
                        <Trash2 size={12} />
                        <span>Excluir</span>
                      </button>
                    )}

                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Ativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {onResetPresets && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onResetPresets}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--collab-mostarda)] cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              <span>Restaurar modelos originais de fábrica do CD</span>
            </button>
          </div>
        )}
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
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--card-border)]">
        <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">
          3.2. Quantidade de Níveis e Apartamentos (Controle de Validação)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                Quantidade de Níveis por Prédio
              </label>
              <p className="text-[11px] text-[var(--muted)]">
                Ex: 4 níveis previstos (N01 a N04)
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

          <div className="p-3.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg flex items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-0.5">
                Quantidade de Apartamentos por Nível
              </label>
              <p className="text-[11px] text-[var(--muted)]">
                Ex: 10 ou 20 apartamentos por nível
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
            ex: R01-P01-N01-A01
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
        <button
          type="button"
          onClick={handleOpenSaveModal}
          className="inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--collab-mostarda)] transition-colors cursor-pointer"
        >
          <Save size={13} />
          <span>Gravar esta parametrização como modelo permanente</span>
        </button>

        <span className="font-mono text-[11px] text-[var(--collab-mostarda)]">
          Padrão CD: R01-P01-N01-A01
        </span>
      </div>

      {/* ── MODAL PARA GRAVAR MODELO DE ETIQUETA PARAMETRIZADO ────────────── */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center">
                  <Save size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Gravar Modelo de Etiqueta Parametrizado
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Mantenha os dados salvos para reutilizar em novas impressões
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveModel} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--foreground)] block">
                  Nome do Modelo de Etiqueta *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={modalModelName}
                  onChange={(e) => setModalModelName(e.target.value)}
                  placeholder="Ex: Porta-Paletes Setor A (10x5cm)"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] font-semibold focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--foreground)] block">
                  Descrição / Finalidade (Opcional)
                </label>
                <input
                  type="text"
                  value={modalModelDesc}
                  onChange={(e) => setModalModelDesc(e.target.value)}
                  placeholder="Ex: Modelo de etiqueta com barras de 20mm para leitor óptico"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--collab-mostarda)]"
                />
              </div>

              {/* Resumo visual dos parâmetros que serão gravados */}
              <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3.5 text-xs space-y-2.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--muted)] block">
                  Parâmetros gravados neste modelo:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                    <span className="text-[var(--muted)] block text-[10px]">Dimensões Físicas:</span>
                    <strong className="text-[var(--foreground)] font-mono">
                      {Number(params.larguraCm || 10)} × {Number(params.alturaCm || 5)} cm
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                    <span className="text-[var(--muted)] block text-[10px]">Código de Barras:</span>
                    <strong className="text-[var(--foreground)] font-mono">
                      CODE 128 • {Number(params.alturaCodigoBarrasMm || 20)} mm
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                    <span className="text-[var(--muted)] block text-[10px]">Tipografia:</span>
                    <strong className="text-[var(--foreground)] font-mono">
                      {params.fonteFamilia || "Helvetica"} ({params.tamanhoFontePt || 16} pt)
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                    <span className="text-[var(--muted)] block text-[10px]">Intervalos:</span>
                    <strong className="text-[var(--foreground)] font-mono">
                      R{params.ruaInicio}..{params.ruaFim} • P{params.predioInicio}..{params.predioFim}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--collab-mostarda)] hover:bg-[var(--mostarda-300)] text-[#080808] font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all"
                >
                  <Save size={13} />
                  <span>Gravar Modelo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE MODELO ──────────────────── */}
      {modalExcluirPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card)] border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                  Excluir Modelo de Etiqueta
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Esta ação removerá este modelo permanentemente da sua lista de predefinições.
                </p>
              </div>
            </div>

            <div className="bg-[var(--background)] p-3.5 rounded-xl border border-[var(--card-border)] text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Modelo:</span>
                <strong className="text-[var(--collab-mostarda)]">{modalExcluirPreset.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Dimensões:</span>
                <strong className="text-[var(--foreground)]">
                  {modalExcluirPreset.params.larguraCm || 10} × {modalExcluirPreset.params.alturaCm || 5} cm
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Barras Code 128:</span>
                <strong className="text-[var(--foreground)]">
                  {modalExcluirPreset.params.alturaCodigoBarrasMm || 20} mm
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Faixa:</span>
                <strong className="text-[var(--foreground)]">
                  R{modalExcluirPreset.params.ruaInicio}..{modalExcluirPreset.params.ruaFim} • P{modalExcluirPreset.params.predioInicio}..{modalExcluirPreset.params.predioFim}
                </strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 leading-relaxed flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-red-500" />
              <span>Atenção: A exclusão é definitiva. O modelo não estará mais disponível para novas impressões.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalExcluirPreset(null)}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs font-semibold cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePreset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                <Trash2 size={13} />
                <span>Sim, Excluir Modelo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE GERENCIAMENTO DE TODOS OS MODELOS PERSONALIZADOS ───── */}
      {isGerenciarModelosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--collab-mostarda)] flex items-center justify-center">
                  <BookmarkCheck size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Modelos de Etiqueta Criados
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Gerencie, selecione ou exclua os modelos personalizados salvos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGerenciarModelosOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {customPresets.length === 0 ? (
                <div className="p-8 text-center bg-[var(--background)] rounded-xl border border-[var(--card-border)] space-y-2">
                  <p className="text-xs text-[var(--muted)]">
                    Você ainda não gravou nenhum modelo personalizado.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGerenciarModelosOpen(false);
                      handleOpenSaveModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--collab-mostarda)] text-black font-bold text-xs cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Gravar Primeiro Modelo</span>
                  </button>
                </div>
              ) : (
                customPresets.map((preset) => {
                  const isCurrent = activePresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-[var(--card)] border-[var(--collab-mostarda)] ring-1 ring-[var(--collab-mostarda)]/50"
                          : "bg-[var(--background)] border-[var(--card-border)]"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                            {preset.name}
                          </h4>
                          {preset.createdAt && (
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              Criado em: {preset.createdAt}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--muted)] line-clamp-1">
                          {preset.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--collab-mostarda)] flex-wrap">
                          <span>{preset.params.larguraCm || 10}×{preset.params.alturaCm || 5}cm</span>
                          <span>•</span>
                          <span>Barras {preset.params.alturaCodigoBarrasMm || 20}mm</span>
                          <span>•</span>
                          <span>{preset.params.tamanhoFontePt || 16}pt</span>
                          <span>•</span>
                          <span>R{preset.params.ruaInicio}..R{preset.params.ruaFim}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPreset(preset);
                            setIsGerenciarModelosOpen(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            isCurrent
                              ? "bg-[var(--collab-mostarda)] text-black font-bold"
                              : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--collab-mostarda)]"
                          }`}
                        >
                          {isCurrent ? "Modelo Ativo" : "Usar Modelo"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalExcluirPreset(preset)}
                          className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer transition-colors"
                          title="Excluir este modelo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">
                Total de modelos gravados: <strong>{customPresets.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsGerenciarModelosOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--secondary)] font-medium cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
