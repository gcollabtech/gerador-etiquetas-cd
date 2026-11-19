-- ====================================================================
-- MÓDULO 04 — WMS REABASTECIMENTO DE PICKING & FLOW RACK (SUPABASE DDL)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://jnfvvcvoubimkdwrasro.supabase.co
-- ====================================================================

-- 1. Tabela de Regras e Parâmetros de Reposição por Produto
CREATE TABLE IF NOT EXISTS wms_regras_reposicao (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  produto_id TEXT,
  cod_produto TEXT NOT NULL UNIQUE,     -- Ex: BEB-COCA-2L
  descricao TEXT NOT NULL,
  ean TEXT,
  estoque_min_picking NUMERIC NOT NULL,  -- Ponto de ressuprimento
  estoque_max_picking NUMERIC NOT NULL,  -- Capacidade máxima do endereço
  quantidade_reposicao NUMERIC NOT NULL, -- Lote de reposição padrão
  endereco_picking TEXT NOT NULL,       -- Endereço físico de picking (nível 01)
  endereco_flow_rack TEXT,              -- Endereço físico de Flow Rack (se aplicável)
  endereco_pulmao TEXT NOT NULL,        -- Endereço padrão de pulmão de origem
  unidade_movimentacao TEXT NOT NULL DEFAULT 'UN', -- UN, CX, FD, PAL
  capacidade_caixas_flow_rack NUMERIC DEFAULT 10,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wms_reg_prod ON wms_regras_reposicao (cod_produto);
CREATE INDEX IF NOT EXISTS idx_wms_reg_picking ON wms_regras_reposicao (endereco_picking);
CREATE INDEX IF NOT EXISTS idx_wms_reg_flow ON wms_regras_reposicao (endereco_flow_rack);

-- 2. Tabela de Tarefas Operacionais de Reabastecimento
CREATE TABLE IF NOT EXISTS wms_tarefas_reabastecimento (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  numero_tarefa TEXT NOT NULL UNIQUE,   -- Ex: REAB-2026-0001
  produto_id TEXT,
  cod_produto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ean TEXT,
  lote TEXT,
  tipo_local TEXT NOT NULL DEFAULT 'picking', -- 'picking' | 'flow_rack'
  prioridade TEXT NOT NULL DEFAULT 'alta',    -- 'urgente' | 'alta' | 'programada'
  status TEXT NOT NULL DEFAULT 'pendente',    -- 'pendente' | 'em_execucao' | 'concluida' | 'cancelada' | 'com_divergencia'
  endereco_origem TEXT NOT NULL,        -- Pulmão
  endereco_destino TEXT NOT NULL,       -- Picking ou Flow Rack
  saldo_atual_destino NUMERIC DEFAULT 0,
  estoque_min_destino NUMERIC DEFAULT 0,
  quantidade_solicitada NUMERIC NOT NULL,
  quantidade_atendida NUMERIC DEFAULT 0,
  unidade_movimentacao TEXT NOT NULL DEFAULT 'UN',
  origem_gatilho TEXT NOT NULL DEFAULT 'estoque_minimo', -- 'estoque_minimo' | 'onda_separacao' | 'manual' | 'bipagem_flow_rack'
  onda_separacao_id TEXT,
  operador_id TEXT,
  operador_nome TEXT,
  supervisor_id TEXT,
  supervisor_nome TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  divergencia_motivo TEXT,
  divergencia_qtd NUMERIC,
  bipagens_conferencia JSONB NOT NULL DEFAULT '{"origem_bipada": false, "produto_bipado": false, "destino_bipado": false}'::jsonb,
  observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_wms_tar_numero ON wms_tarefas_reabastecimento (numero_tarefa);
CREATE INDEX IF NOT EXISTS idx_wms_tar_status ON wms_tarefas_reabastecimento (status);
CREATE INDEX IF NOT EXISTS idx_wms_tar_prioridade ON wms_tarefas_reabastecimento (prioridade);
CREATE INDEX IF NOT EXISTS idx_wms_tar_operador ON wms_tarefas_reabastecimento (operador_nome);
CREATE INDEX IF NOT EXISTS idx_wms_tar_criado_em ON wms_tarefas_reabastecimento (criado_em DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE wms_regras_reposicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_tarefas_reabastecimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total wms_regras_reposicao" ON wms_regras_reposicao;
CREATE POLICY "Acesso total wms_regras_reposicao" ON wms_regras_reposicao
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total wms_tarefas_reabastecimento" ON wms_tarefas_reabastecimento;
CREATE POLICY "Acesso total wms_tarefas_reabastecimento" ON wms_tarefas_reabastecimento
  FOR ALL
  USING (true)
  WITH CHECK (true);
