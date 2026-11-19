import { DashboardCompletoData, FiltrosRelatorio, RelatorioLinhaItem } from "./dashboardTypes";

export async function fetchDashboardData(
  filtros?: FiltrosRelatorio
): Promise<DashboardCompletoData> {
  const params = new URLSearchParams();
  if (filtros) {
    if (filtros.periodoPredefinido) params.set("periodo", filtros.periodoPredefinido);
    if (filtros.dataInicio) params.set("dataInicio", filtros.dataInicio);
    if (filtros.dataFim) params.set("dataFim", filtros.dataFim);
    if (filtros.loja) params.set("loja", filtros.loja);
    if (filtros.fornecedor) params.set("fornecedor", filtros.fornecedor);
    if (filtros.produto) params.set("produto", filtros.produto);
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.operador) params.set("operador", filtros.operador);
    if (filtros.setor) params.set("setor", filtros.setor);
    if (filtros.lote) params.set("lote", filtros.lote);
    if (filtros.notaFiscal) params.set("notaFiscal", filtros.notaFiscal);
    if (filtros.transportadora) params.set("transportadora", filtros.transportadora);
  }

  const url = `/api/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro ao carregar dashboard");
  return json.data;
}

/**
 * Exporta os dados do relatório para arquivo CSV compatível com Excel em português
 */
export function exportarRelatorioCsv(itens: RelatorioLinhaItem[]): void {
  const cabecalhos = [
    "Data/Hora",
    "Loja Destino",
    "Código Loja",
    "Fornecedor",
    "Produto",
    "SKU",
    "Categoria",
    "Operador",
    "Setor",
    "Endereço",
    "Lote",
    "Validade",
    "Nota Fiscal",
    "Transportadora",
    "Quantidade",
    "Unidade",
    "Status Operacional",
    "Tempo de Ciclo (min)",
    "Divergência",
  ];

  const linhas = itens.map((i) => [
    `"${i.data}"`,
    `"${i.loja}"`,
    `"${i.codLoja}"`,
    `"${i.fornecedor}"`,
    `"${i.produto}"`,
    `"${i.sku}"`,
    `"${i.categoria}"`,
    `"${i.operador}"`,
    `"${i.setor}"`,
    `"${i.endereco}"`,
    `"${i.lote}"`,
    `"${i.validade}"`,
    `"${i.notaFiscal}"`,
    `"${i.transportadora}"`,
    i.quantidade,
    `"${i.unidadeMedida}"`,
    `"${i.statusOperacional}"`,
    i.tempoCicloMinutos || 0,
    i.divergencia ? "Sim" : "Não",
  ]);

  const csvContent =
    "\uFEFF" +
    [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `relatorio_wms_cd_collab_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta para Excel formato compatível SpreadsheetML (.xls)
 */
export function exportarRelatorioExcel(itens: RelatorioLinhaItem[]): void {
  const rows = itens
    .map(
      (i) => `
    <Row>
      <Cell><Data ss:Type="String">${i.data}</Data></Cell>
      <Cell><Data ss:Type="String">${i.loja}</Data></Cell>
      <Cell><Data ss:Type="String">${i.codLoja}</Data></Cell>
      <Cell><Data ss:Type="String">${i.fornecedor}</Data></Cell>
      <Cell><Data ss:Type="String">${i.produto}</Data></Cell>
      <Cell><Data ss:Type="String">${i.sku}</Data></Cell>
      <Cell><Data ss:Type="String">${i.categoria}</Data></Cell>
      <Cell><Data ss:Type="String">${i.operador}</Data></Cell>
      <Cell><Data ss:Type="String">${i.setor}</Data></Cell>
      <Cell><Data ss:Type="String">${i.endereco}</Data></Cell>
      <Cell><Data ss:Type="String">${i.lote}</Data></Cell>
      <Cell><Data ss:Type="String">${i.validade}</Data></Cell>
      <Cell><Data ss:Type="String">${i.notaFiscal}</Data></Cell>
      <Cell><Data ss:Type="String">${i.transportadora}</Data></Cell>
      <Cell><Data ss:Type="Number">${i.quantidade}</Data></Cell>
      <Cell><Data ss:Type="String">${i.unidadeMedida}</Data></Cell>
      <Cell><Data ss:Type="String">${i.statusOperacional}</Data></Cell>
      <Cell><Data ss:Type="Number">${i.tempoCicloMinutos || 0}</Data></Cell>
      <Cell><Data ss:Type="String">${i.divergencia ? "Sim" : "Não"}</Data></Cell>
    </Row>`
    )
    .join("");

  const excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Relatorio WMS">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Data/Hora</Data></Cell>
    <Cell><Data ss:Type="String">Loja Destino</Data></Cell>
    <Cell><Data ss:Type="String">Código Loja</Data></Cell>
    <Cell><Data ss:Type="String">Fornecedor</Data></Cell>
    <Cell><Data ss:Type="String">Produto</Data></Cell>
    <Cell><Data ss:Type="String">SKU</Data></Cell>
    <Cell><Data ss:Type="String">Categoria</Data></Cell>
    <Cell><Data ss:Type="String">Operador</Data></Cell>
    <Cell><Data ss:Type="String">Setor</Data></Cell>
    <Cell><Data ss:Type="String">Endereço</Data></Cell>
    <Cell><Data ss:Type="String">Lote</Data></Cell>
    <Cell><Data ss:Type="String">Validade</Data></Cell>
    <Cell><Data ss:Type="String">Nota Fiscal</Data></Cell>
    <Cell><Data ss:Type="String">Transportadora</Data></Cell>
    <Cell><Data ss:Type="String">Quantidade</Data></Cell>
    <Cell><Data ss:Type="String">Unidade</Data></Cell>
    <Cell><Data ss:Type="String">Status Operacional</Data></Cell>
    <Cell><Data ss:Type="String">Tempo Ciclo (min)</Data></Cell>
    <Cell><Data ss:Type="String">Divergência</Data></Cell>
   </Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([excelXml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `relatorio_wms_cd_collab_${new Date().toISOString().slice(0, 10)}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Dispara impressão / Salvar como PDF formatado
 */
export function imprimirRelatorioPdf(itens: RelatorioLinhaItem[], filtros?: FiltrosRelatorio): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, habilite popups para gerar a impressão em PDF.");
    return;
  }

  const rowsHtml = itens
    .map(
      (i) => `
    <tr>
      <td>${i.data}</td>
      <td><strong>${i.loja}</strong></td>
      <td>${i.fornecedor}</td>
      <td><strong>${i.produto}</strong><br><small style="color:#666">${i.sku}</small></td>
      <td>${i.categoria}</td>
      <td>${i.operador}</td>
      <td>${i.setor} (${i.endereco})</td>
      <td><code>${i.lote}</code></td>
      <td>${i.notaFiscal}</td>
      <td>${i.transportadora}</td>
      <td style="text-align:right"><strong>${i.quantidade}</strong> ${i.unidadeMedida}</td>
      <td>${i.statusOperacional}</td>
    </tr>`
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório Operacional WMS - CD Big Master</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FF6400; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 900; margin: 0; color: #111; }
          .subtitle { font-size: 11px; color: #555; margin-top: 2px; }
          .meta { font-size: 10px; color: #777; text-align: right; }
          .summary { display: flex; gap: 16px; background: #f5f5f5; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #f0f0f0; border-bottom: 1px solid #ccc; padding: 6px 4px; text-align: left; font-weight: bold; }
          td { border-bottom: 1px solid #eee; padding: 5px 4px; }
          @media print {
            body { padding: 0; }
            @page { size: landscape; margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">COLLAB LOG — CENTRO DE DISTRIBUIÇÃO BIG MASTER</h1>
            <div class="subtitle">Relatório Gerencial de Movimentações, Pedidos e Estoque</div>
          </div>
          <div class="meta">
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}<br>
            Total de Registros: <strong>${itens.length}</strong>
          </div>
        </div>

        <div class="summary">
          <div><strong>Filtro Loja:</strong> ${filtros?.loja || "Todas"}</div>
          <div><strong>Fornecedor:</strong> ${filtros?.fornecedor || "Todos"}</div>
          <div><strong>Categoria:</strong> ${filtros?.categoria || "Todas"}</div>
          <div><strong>Setor:</strong> ${filtros?.setor || "Todos"}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Loja</th>
              <th>Fornecedor</th>
              <th>Produto / SKU</th>
              <th>Categoria</th>
              <th>Operador</th>
              <th>Setor / Endereço</th>
              <th>Lote</th>
              <th>NF</th>
              <th>Transportadora</th>
              <th style="text-align:right">Qtd</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
