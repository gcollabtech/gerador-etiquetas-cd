"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Barcode,
  History,
  CheckCircle2,
  Sun,
  Moon,
  Layers,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenAcceptanceTests: () => void;
  totalGeneratedCount: number;
}

export function Header({
  onOpenHistory,
  onOpenAcceptanceTests,
  totalGeneratedCount,
}: HeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cd-labels-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cd-labels-theme", next);
  };

  return (
    <header className="bg-[var(--card)] border-b border-[var(--card-border)] py-4 px-4 sm:px-6 lg:px-8 no-print sticky top-0 z-40 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 flex items-center justify-center shrink-0">
            <Barcode size={22} className="text-[var(--collab-mostarda)]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
                GERADOR DE ENDEREÇOS E ETIQUETAS
              </h1>
              <span className="text-[10px] font-mono font-bold bg-[var(--collab-mostarda)] text-[#080808] px-1.5 py-0.5 rounded">
                CODE 128
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] flex items-center gap-2">
              <span>Centro de Distribuição Big Master / Collab</span>
              <span>•</span>
              <span className="font-mono text-[var(--foreground)] font-semibold">100 × 50 mm</span>
              <span>•</span>
              <span>Área Útil 80 × 30 mm</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botão Testes de Aceite */}
          <button
            type="button"
            onClick={onOpenAcceptanceTests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] hover:text-[var(--collab-mostarda)] transition-all"
            title="Executar os 6 Critérios de Aceite Oficiais"
          >
            <CheckCircle2 size={14} className="text-[var(--collab-mostarda)]" />
            <span>Critérios de Aceite (1 a 6)</span>
          </button>

          {/* Botão Histórico */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all"
            title="Ver Histórico de Lotes Gerados"
          >
            <History size={14} className="text-[var(--muted)]" />
            <span>Histórico</span>
          </button>

          {/* Contador de Lote Atual */}
          {totalGeneratedCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-[var(--collab-mostarda)]/10 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/25">
              <Layers size={13} />
              <span>{totalGeneratedCount} geradas</span>
            </div>
          )}

          {/* Alternador de Tema */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded bg-[var(--secondary)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)] text-[var(--foreground)] transition-all"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
