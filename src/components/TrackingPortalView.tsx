"use client";

import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Compass,
  ArrowUpRight,
} from "lucide-react";

export function TrackingPortalView() {
  const sampleDeliveries = [
    {
      code: "TRK-2026-9812",
      origin: "CD Matriz (Barueri - SP)",
      destination: "Filial Sul (Curitiba - PR)",
      driver: "Marcos Vinicius",
      vehicle: "Carreta Scania R450 • Placa ABC-4E12",
      status: "Em Trânsito",
      eta: "Hoje às 18:30",
      progress: 74,
      volume: "32 Paletes (R01-P01 a R01-P05)",
    },
    {
      code: "TRK-2026-9815",
      origin: "CD Matriz (Barueri - SP)",
      destination: "Hub Rio de Janeiro (Duque de Caxias - RJ)",
      driver: "Rafael Souza",
      vehicle: "Truck Volvo VM 330 • Placa XYZ-9876",
      status: "Em Rota de Entrega",
      eta: "Amanhã às 09:00",
      progress: 42,
      volume: "18 Paletes (R02-P01 a R02-P02)",
    },
    {
      code: "TRK-2026-9808",
      origin: "CD Matriz (Barueri - SP)",
      destination: "Distribuidora Minas (Contagem - MG)",
      driver: "Anderson Lima",
      vehicle: "Carreta Mercedes Actros • Placa LOG-1020",
      status: "Concluído",
      eta: "Entregue hoje às 14:15",
      progress: 100,
      volume: "28 Paletes",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={15} className="text-[var(--collab-mostarda)]" />
            <span>Collab Log • Módulo Operacional 02</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-[var(--foreground)] mt-0.5 flex items-center gap-2">
            <span>Rastreamento Logístico & Torre de Controle</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--collab-mostarda)]/15 text-[var(--collab-mostarda)] border border-[var(--collab-mostarda)]/30">
              Em Breve
            </span>
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Monitoramento em tempo real de frotas, status de transferências entre CDs e previsão de entrega (ETA).
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--collab-mostarda)]/15 border border-[var(--collab-mostarda)]/30 text-[var(--foreground)]">
          <Navigation size={14} className="text-[var(--collab-mostarda)]" />
          <span>Telemetria & GPS Ativo</span>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Cargas em Trânsito</span>
          <span className="font-heading text-2xl font-black text-[var(--collab-mostarda)]">
            24
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Transferências ativas</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Entregas no Prazo (OTIF)</span>
          <span className="font-heading text-2xl font-black text-emerald-500">
            98.2%
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Índice de pontualidade</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Ocorrências / Atrasos</span>
          <span className="font-heading text-2xl font-black text-amber-500">
            2
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Sob monitoramento</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
          <span className="text-xs text-[var(--muted)] block font-medium">Paletes em Movimento</span>
          <span className="font-heading text-2xl font-black text-[var(--foreground)]">
            680
          </span>
          <span className="text-[11px] text-[var(--muted)] block">Identificados por etiqueta CD</span>
        </div>
      </div>

      {/* Simulated Live Shipments */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Compass size={14} className="text-[var(--collab-mostarda)]" />
            <span>Cargas Monitoradas em Tempo Real:</span>
          </h2>
          <span className="text-[11px] text-[var(--muted)] font-mono">
            Atualizado a cada 30 segundos
          </span>
        </div>

        <div className="space-y-3">
          {sampleDeliveries.map((d) => (
            <div
              key={d.code}
              className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--collab-mostarda)]/50 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--collab-mostarda)] text-black">
                    {d.code}
                  </span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {d.origin} → {d.destination}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    d.status === "Concluído"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {d.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                <div>
                  <span className="opacity-75 block">Motorista & Veículo:</span>
                  <strong className="text-[var(--foreground)]">{d.driver}</strong> • {d.vehicle}
                </div>
                <div>
                  <span className="opacity-75 block">Carga & Volume:</span>
                  <strong className="text-[var(--foreground)]">{d.volume}</strong>
                </div>
                <div>
                  <span className="opacity-75 block">Previsão (ETA):</span>
                  <strong className="text-[var(--collab-mostarda)]">{d.eta}</strong>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-[var(--muted)]">
                  <span>Progresso do Roteiro</span>
                  <span className="font-bold text-[var(--foreground)]">{d.progress}%</span>
                </div>
                <div className="w-full bg-[var(--secondary)] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.progress === 100 ? "bg-emerald-500" : "bg-[var(--collab-mostarda)]"
                    }`}
                    style={{ width: `${d.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
