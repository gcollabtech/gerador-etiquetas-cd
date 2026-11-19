# Gerador de Endereços de Armazenagem e Etiquetas CODE 128 (10 × 5 cm)

Ferramenta web autônoma e especializada para a criação automática de endereços de armazenagem e geração/impressão de etiquetas com código de barras **CODE 128** em dimensões físicas reais de **10 cm × 5 cm (100 mm × 50 mm)** para Centro de Distribuição (CD) — **Big Master / Collab**.

---

## 📋 1. Regras de Negócio e Especificações Atendidas

### 🏷️ 1.1. Padrão Obrigatório de Identificação
Todos os endereços seguem rigorosamente a nomenclatura:
```
R01-P01-N01-A01
```
- **R** = Rua (com dois dígitos numéricos, ex: `R01`, `R02` ... `R99`)
- **P** = Prédio (com dois dígitos numéricos, ex: `P01`, `P02` ... `P99`)
- **N** = Nível (com dois dígitos numéricos, ex: `N01`, `N02` ... `N99`)
- **A** = Apartamento (com dois dígitos numéricos, ex: `A01`, `A02` ... `A99`)
- *Preservação estrita dos zeros à esquerda em todas as telas, códigos de barras, PDFs e relatórios.*

### 🎯 1.2. Regra Obrigatória do Posicionamento das Setas
Aplicada de forma **100% automática** pelo sistema com base no número do nível:
- **Nível igual a N01 (Solo):** Seta aponta para **BAIXO** (`↓`).
- **Nível superior a N01 (N02, N03, N04...):** Seta aponta para **CIMA** (`↑`).
- *A seta é grande, preta, vetorizada e posicionada no lado direito da área útil da etiqueta.*

### 📊 1.3. Padrão do Código de Barras — CODE 128
- Padrão **CODE 128 (Subset B / ISO/IEC 15417)** de alta densidade alfanumérica.
- O conteúdo codificado é **exatamente** o código do endereço (ex: `R01-P01-N01-A01`), sem caracteres adicionais.
- Preservação das margens de silêncio (*quiet zones*) laterais.
- Leitura testada e compatível com **coletores de dados RF (Zebra, Honeywell, Datalogic)** e leitores ópticos convencionais.
- Texto do endereço renderizado em fonte negrito de grande porte centralizado logo abaixo das barras.

### 📐 1.4. Dimensões Físicas Reais (Milímetros)
- **Dimensão total da etiqueta:** 10 cm × 5 cm (**100 mm × 50 mm**).
- **Margens de segurança:** 1 cm (**10 mm**) em todos os quatro lados.
- **Área útil central:** 8 cm × 3 cm (**80 mm × 30 mm**).
- **Composição da área útil:**
  1. Identificação corporativa no lado esquerdo: `BIG MASTER • COLLAB CD`.
  2. Código de barras Code 128 ocupando a parte superior central.
  3. Texto do endereço centralizado logo abaixo das barras.
  4. Seta direcional grande de alto contraste no lado direito.

---

## 🖨️ 2. Impressão e Geração de PDF

O sistema possui dois motores de saída em escala **100% real (sem redimensionamento)**:

1. **Gerador Vetorial de PDF (.pdf):**
   - Constrói o PDF nativo em coordenadas físicas exatas (`MediaBox: 100mm × 50mm`).
   - Cada etiqueta constitui uma página individual no arquivo PDF, ideal para envio direto a **impressoras térmicas de bobina** (Zebra ZD220/ZD230, Argox OS-214 Plus, Elgin L42 Pro, Honeywell PC42t).
   - Inclui botão de download direto e **pré-visualizador integrado** antes da impressão.

2. **Impressão Nativa do Navegador (Ctrl+P):**
   - Configurado via CSS `@page { size: 100mm 50mm; margin: 0; }`.
   - Permite impressão direta sem depender de drivers adicionais.

---

## 🧪 3. Bateria de Testes e Critérios de Aceite (Item 11)

A ferramenta possui um painel interativo de validação com os **6 Critérios de Aceite Oficiais**:
- **Teste 1 (Geração de Endereços):** `R01..R01`, `P01..P01`, `A01..A02`, `N01..N03` → Gera exatamente 6 etiquetas.
- **Teste 2 (Posicionamento das Setas):** `N01` aponta para baixo (`↓`), `N02` e `N03` apontam para cima (`↑`).
- **Teste 3 (Código de Barras):** Validação da codificação Code 128 B, checksum e caracteres de parada.
- **Teste 4 (Dimensões Físicas):** 100 × 50 mm nominal, 10 mm margens, 80 × 30 mm área útil.
- **Teste 5 (Sequenciamento):** Sequência estrita Rua → Prédio → Apartamento → Nível sem saltos ou duplicidades.
- **Teste 6 (Escala de Impressão):** Preservação da escala física 100% em milímetros reais.

*(Acesse pelo botão **"Critérios de Aceite (1 a 6)"** no topo da tela).*

---

## 🚀 4. Como Executar o Projeto

### 4.1. Instalação das dependências

```bash
cd gerador-etiquetas-cd
npm install
```

### 4.2. Iniciar em ambiente de desenvolvimento

```bash
npm run dev
```

Acesse em: **[http://localhost:3002](http://localhost:3002)**  
*(Porta 3002 configurada para coexistir de forma isolada do Portal Financeiro 3000 e do Institucional 3001).*

### 4.3. Build para Produção

```bash
npm run build
npm start
```

---

## 📁 5. Estrutura de Arquivos

```
gerador-etiquetas-cd/
├── src/
│   ├── app/
│   │   ├── globals.css          # Estilos globais e regras @page { size: 100mm 50mm }
│   │   ├── layout.tsx           # Layout raiz com tema escuro/claro e metadados
│   │   └── page.tsx             # Aplicação principal
│   ├── components/
│   │   ├── Header.tsx           # Barra superior com atalhos de teste e histórico
│   │   ├── ConfigPanel.tsx      # Intervalos 3.1 e controle de quantidades 3.2
│   │   ├── GenerationSummaryCard.tsx # Resumo de cálculo e botão de geração
│   │   ├── LabelPreview.tsx     # Pré-visualização da etiqueta 10×5cm com guias de margem
│   │   ├── LabelsGrid.tsx       # Grade de etiquetas geradas com filtros e seleção
│   │   ├── PrintModal.tsx       # Modal de impressão e download do PDF vetorial
│   │   ├── HistoryDrawer.tsx    # Gaveta com histórico de lotes e restauração
│   │   └── TestAcceptanceModal.tsx # Bateria dos 6 critérios de aceite oficiais
│   └── lib/
│       ├── types.ts             # Tipos TypeScript do sistema
│       ├── code128.ts           # Motor ISO/IEC 15417 do CODE 128 (Subset B)
│       ├── addressGenerator.ts  # Algoritmo de sequenciamento e validação cruzada
│       ├── pdfGenerator.ts      # Construtor vetorial de PDF com medidas em mm
│       ├── historyStorage.ts    # Gerenciador de histórico e predefinições (presets)
│       └── utils.ts             # Utilitários de classes CSS
├── public/
│   ├── fonts/                   # Tipografias Agrandir e Montserrat
│   └── logo/                    # Ícones e logotipos corporativos
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```
