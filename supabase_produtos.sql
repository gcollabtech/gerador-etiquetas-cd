-- ====================================================================
-- TABELA DE PRODUTOS PARA ETIQUETAS E CÓDIGOS DE BARRAS (EAN-13 & ALFANUMÉRICO)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://jnfvvcvoubimkdwrasro.supabase.co
-- ====================================================================

CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cod_produto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ean TEXT,
  barra TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir que a coluna 'barra' exista caso a tabela já tenha sido criada anteriormente
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS barra TEXT;

-- Índices para alta performance de consulta, filtros e ordenação
CREATE INDEX IF NOT EXISTS idx_produtos_cod_produto ON produtos (cod_produto);
CREATE INDEX IF NOT EXISTS idx_produtos_ean ON produtos (ean);
CREATE INDEX IF NOT EXISTS idx_produtos_barra ON produtos (barra);
CREATE INDEX IF NOT EXISTS idx_produtos_descricao ON produtos (descricao);
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos (created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para operações do portal
DROP POLICY IF EXISTS "Acesso total produtos" ON produtos;
CREATE POLICY "Acesso total produtos" ON produtos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Carga inicial de demonstração com EAN e Barras Alfanuméricas
INSERT INTO produtos (id, cod_produto, descricao, ean, barra)
VALUES
  ('prd-1001', 'PRD-1001', 'DETERGENTE LÍQUIDO NEUTRO 500ML', '7891000315507', NULL),
  ('prd-1002', 'PRD-1002', 'SABÃO EM PÓ CONCENTRADO 1KG', '7891234567895', NULL),
  ('prd-1003', 'PRD-1003', 'ÁGUA SANITÁRIA CLORADA 2L', '7898912345678', NULL),
  ('prd-1004', 'PRD-1004', 'DESINFETANTE FLORAL 1L', '7896000123456', NULL),
  ('prd-1005', 'PRD-1005', 'CANETA ESFEROGRÁFICA AZUL 1.0MM', '7891000315507', NULL),
  ('prd-1006', 'PRD-1006', 'PAPEL SULFITE A4 75G PCT 500 FLS', '7891027116521', NULL),
  ('prd-1007', 'CX-MASTER-01', 'CAIXA MASTER FIO DENTAL 50UN', NULL, 'CX-MASTER-FD-050'),
  ('prd-1008', 'PLT-LOG-99', 'PALETE LOGÍSTICO REFRIGERADO', NULL, 'PLT-R01-P02-N04')
ON CONFLICT (id) DO NOTHING;
