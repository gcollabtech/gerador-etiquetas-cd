-- ====================================================================
-- MÓDULO 02 — WMS RECEBIMENTO DE MERCADORIAS (SUPABASE DDL)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://jnfvvcvoubimkdwrasro.supabase.co
-- ====================================================================

CREATE TABLE IF NOT EXISTS wms_recebimentos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chave_nfe TEXT NOT NULL,
  numero_nfe TEXT NOT NULL,
  serie_nfe TEXT,
  data_emissao TEXT,
  fornecedor_nome TEXT NOT NULL,
  fornecedor_cnpj TEXT NOT NULL,
  pedido_compra TEXT,
  valor_total NUMERIC DEFAULT 0,
  doca TEXT,
  agendamento_id TEXT,
  status TEXT NOT NULL DEFAULT 'em_recebimento',
  operador_id TEXT,
  operador_nome TEXT,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  erp_status TEXT DEFAULT 'validado',
  erp_protocolo TEXT,
  itens JSONB DEFAULT '[]'::jsonb,
  divergencias JSONB DEFAULT '[]'::jsonb,
  tarefas_armazenagem JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas rápidas de recebimentos
CREATE INDEX IF NOT EXISTS idx_wms_rec_chave ON wms_recebimentos (chave_nfe);
CREATE INDEX IF NOT EXISTS idx_wms_rec_numero ON wms_recebimentos (numero_nfe);
CREATE INDEX IF NOT EXISTS idx_wms_rec_fornecedor ON wms_recebimentos (fornecedor_nome);
CREATE INDEX IF NOT EXISTS idx_wms_rec_status ON wms_recebimentos (status);
CREATE INDEX IF NOT EXISTS idx_wms_rec_doca ON wms_recebimentos (doca);
CREATE INDEX IF NOT EXISTS idx_wms_rec_data_inicio ON wms_recebimentos (data_inicio DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE wms_recebimentos ENABLE ROW LEVEL SECURITY;

-- Política de acesso da aplicação
DROP POLICY IF EXISTS "Acesso total wms_recebimentos" ON wms_recebimentos;
CREATE POLICY "Acesso total wms_recebimentos" ON wms_recebimentos
  FOR ALL
  USING (true)
  WITH CHECK (true);
