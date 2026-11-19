-- ====================================================================
-- MÓDULO 03 — WMS ARMAZENAGEM E ENDEREÇAMENTO (SUPABASE DDL)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://jnfvvcvoubimkdwrasro.supabase.co
-- ====================================================================

-- 1. Tabela de Endereços do Armazém
CREATE TABLE IF NOT EXISTS wms_enderecos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  codigo TEXT NOT NULL UNIQUE, -- Ex: A-02-03-04-01
  setor TEXT NOT NULL,         -- Ex: A, B, C, Frio, Quimico
  rua TEXT NOT NULL,           -- Ex: 01, 02, 03...
  predio TEXT NOT NULL,        -- Ex: 01, 02, 03...
  coluna TEXT DEFAULT '01',    -- Ex: 01, 02
  nivel TEXT NOT NULL,         -- Ex: 01, 02, 03, 04, 05
  posicao TEXT NOT NULL,       -- Ex: 01, 02
  tipo TEXT NOT NULL DEFAULT 'porta_paletes', 
  -- recebimento, quarentena, pulmao, pulmao_flow_rack, porta_paletes, 
  -- flow_rack, picking, separacao, conferencia, expedicao, devolucao, avaria, bloqueado
  status TEXT NOT NULL DEFAULT 'livre', 
  -- livre, ocupado, parcialmente_ocupado, bloqueado, manutencao
  peso_max_kg NUMERIC NOT NULL DEFAULT 1200,
  peso_atual_kg NUMERIC NOT NULL DEFAULT 0,
  volume_max_m3 NUMERIC NOT NULL DEFAULT 2.4,
  volume_atual_m3 NUMERIC NOT NULL DEFAULT 0,
  curva_abc_permitida TEXT NOT NULL DEFAULT 'todas', -- A, B, C, todas
  temperatura TEXT NOT NULL DEFAULT 'ambiente',     -- ambiente, refrigerado, congelado
  categoria_permitida TEXT DEFAULT 'todas',         -- geral, alimentos, quimicos, medicamentos, etc.
  motivo_bloqueio TEXT,
  bloqueado_em TIMESTAMPTZ,
  bloqueado_por TEXT,
  produtos_alocados JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas ultrarrápidas de endereçamento e mapa
CREATE INDEX IF NOT EXISTS idx_wms_end_codigo ON wms_enderecos (codigo);
CREATE INDEX IF NOT EXISTS idx_wms_end_setor_rua ON wms_enderecos (setor, rua);
CREATE INDEX IF NOT EXISTS idx_wms_end_tipo ON wms_enderecos (tipo);
CREATE INDEX IF NOT EXISTS idx_wms_end_status ON wms_enderecos (status);
CREATE INDEX IF NOT EXISTS idx_wms_end_nivel ON wms_enderecos (nivel);

-- 2. Tabela de Movimentações Internas (Rastreabilidade Total)
CREATE TABLE IF NOT EXISTS wms_movimentacoes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  produto_id TEXT NOT NULL,
  produto_codigo TEXT NOT NULL,
  produto_descricao TEXT NOT NULL,
  ean TEXT,
  lote TEXT,
  data_validade TEXT,
  quantidade NUMERIC NOT NULL,
  unidade_medida TEXT NOT NULL DEFAULT 'UN',
  origem_endereco TEXT NOT NULL,
  destino_endereco TEXT NOT NULL,
  regra_estoque TEXT NOT NULL DEFAULT 'FEFO', -- FEFO, FIFO, LIFO, MANUAL
  motivo TEXT NOT NULL,
  -- Ressuprimento de Picking, Slotting / Reorganização IA, Armazenagem de Recebimento,
  -- Transferência de Pulmão, Quarentena / Avaria, Desbloqueio, Ajuste de Inventário
  observacao TEXT,
  usuario_id TEXT,
  usuario_nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wms_mov_produto ON wms_movimentacoes (produto_codigo);
CREATE INDEX IF NOT EXISTS idx_wms_mov_origem ON wms_movimentacoes (origem_endereco);
CREATE INDEX IF NOT EXISTS idx_wms_mov_destino ON wms_movimentacoes (destino_endereco);
CREATE INDEX IF NOT EXISTS idx_wms_mov_data ON wms_movimentacoes (created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE wms_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_movimentacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total wms_enderecos" ON wms_enderecos;
CREATE POLICY "Acesso total wms_enderecos" ON wms_enderecos
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total wms_movimentacoes" ON wms_movimentacoes;
CREATE POLICY "Acesso total wms_movimentacoes" ON wms_movimentacoes
  FOR ALL
  USING (true)
  WITH CHECK (true);
