import { ItemEstoque, MilitarServico, MilitarReserva, Retirada, RegistroAuditoria } from '../types';

export const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

export const SCRIPT_GOOGLE_APPS_SCRIPT = `/**
 * ====================================================================
 * SISRESERVA - GOOGLE APPS SCRIPT WEBHOOK V4
 * Integração Oficial com o Sistema de Reserva de Armamento
 * Compatível com Netlify, Vercel e Servidores Locais
 * ====================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "online", sistema: "SISRESERVA", versao: "4.0", timestamp: new Date() })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ABA: CAUTELAS_HISTORICO
    if (data.retiradas && data.retiradas.length > 0) {
      var sheetCautelas = ss.getSheetByName("CAUTELAS_HISTORICO");
      if (!sheetCautelas) {
        sheetCautelas = ss.insertSheet("CAUTELAS_HISTORICO");
      }
      sheetCautelas.clearContents();

      var headerCautelas = [
        "Nº Cautela",
        "Status",
        "Militar (Posto/Grad)",
        "Nome de Guerra",
        "RE / Matrícula",
        "Armeiro de Saída",
        "Data Saída",
        "Devolução Prevista",
        "Data Devolução",
        "Armeiro Recebedor",
        "Itens Cautelados",
        "Tiros Consumidos",
        "Nº BO",
        "Motivo / Destino",
        "Hash SHA-256 (Autenticidade)"
      ];

      var rowsCautelas = [headerCautelas];
      for (var i = 0; i < data.retiradas.length; i++) {
        var r = data.retiradas[i];
        var itensStr = "";
        if (r.itens && r.itens.length > 0) {
          itensStr = r.itens.map(function(it) {
            return (it.quantidade || 1) + "x " + (it.materialNome || "") + " (Série: " + (it.nArmamento || "S/N") + ")";
          }).join(" | ");
        }

        rowsCautelas.push([
          r.numeroCautela || "",
          r.status || "",
          (r.militarServicoPatente || "") + " " + (r.militarServicoNome || ""),
          r.militarServicoGuerra || "",
          r.militarServicoMatricula || "",
          (r.militarReservaPatente || "") + " " + (r.militarReservaNome || ""),
          r.dataSaida || "",
          r.dataDevolucaoPrevista || "",
          r.dataDevolucao || "",
          r.armeiroRecebedorNome || "",
          itensStr,
          r.quantidadeTotalTirosConsumidos || 0,
          r.numeroBoletimOcorrencia || "",
          r.motivoDetalhado || r.tipoDestino || "",
          r.hashAssinaturaSaida || r.hashAutenticacao || ""
        ]);
      }

      sheetCautelas.getRange(1, 1, rowsCautelas.length, headerCautelas.length).setValues(rowsCautelas);
      formatarAba(sheetCautelas, headerCautelas.length);
    }

    // 2. ABA: ESTOQUE_ARMORIAL
    if (data.estoque && data.estoque.length > 0) {
      var sheetEstoque = ss.getSheetByName("ESTOQUE_ARMORIAL");
      if (!sheetEstoque) {
        sheetEstoque = ss.insertSheet("ESTOQUE_ARMORIAL");
      }
      sheetEstoque.clearContents();

      var headerEstoque = [
        "ID",
        "Categoria",
        "Nome do Material / Armamento",
        "Calibre",
        "Nº de Série / Patrimônio",
        "Lote",
        "Status Atual",
        "Estado Conservação",
        "Local de Guarda",
        "Qtd Disponível"
      ];

      var rowsEstoque = [headerEstoque];
      for (var j = 0; j < data.estoque.length; j++) {
        var item = data.estoque[j];
        rowsEstoque.push([
          item.id || "",
          item.categoria || "",
          item.nome || "",
          item.calibre || "-",
          item.nMaterial || "",
          item.lote || "-",
          item.status || "",
          item.estado || "",
          item.localArmazenamento || "",
          item.quantidadeDisponivel != null ? item.quantidadeDisponivel : 1
        ]);
      }

      sheetEstoque.getRange(1, 1, rowsEstoque.length, headerEstoque.length).setValues(rowsEstoque);
      formatarAba(sheetEstoque, headerEstoque.length);
    }

    // 3. ABA: MILITARES_EFETIVO
    if (data.militares && data.militares.length > 0) {
      var sheetMil = ss.getSheetByName("MILITARES_EFETIVO");
      if (!sheetMil) {
        sheetMil = ss.insertSheet("MILITARES_EFETIVO");
      }
      sheetMil.clearContents();

      var headerMil = [
        "Posto / Graduação",
        "Nome de Guerra",
        "Nome Completo",
        "RE / Matrícula",
        "Batalhão / Companhia",
        "Pelotão / Equipe",
        "Status Cadastral"
      ];

      var rowsMil = [headerMil];
      for (var k = 0; k < data.militares.length; k++) {
        var m = data.militares[k];
        rowsMil.push([
          m.patente || "",
          m.nomeGuerra || "",
          m.nome || m.nomeCompleto || "",
          m.matricula || "",
          m.batalhao || m.batalhaoCompanhia || "",
          m.pelotao || "",
          m.ativo ? "ATIVO" : "INATIVO"
        ]);
      }

      sheetMil.getRange(1, 1, rowsMil.length, headerMil.length).setValues(rowsMil);
      formatarAba(sheetMil, headerMil.length);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "sucesso", mensagem: "Dados sincronizados com sucesso no Google Sheets!" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "erro", mensagem: erro.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatarAba(sheet, numColunas) {
  var headerRange = sheet.getRange(1, 1, 1, numColunas);
  headerRange.setBackground("#1b3319"); // Verde militar escuro
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
  for (var c = 1; c <= numColunas; c++) {
    sheet.autoResizeColumn(c);
  }
}
`;

export interface SheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  webhookUrl?: string;
  autoSync?: boolean;
}

export function normalizarWebhookUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/+$/, '');
}

export const sheetsService = {
  getConfig: (): SheetsConfig => {
    try {
      const saved = localStorage.getItem('sisarm_sheets_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      spreadsheetId: SPREADSHEET_ID,
      apiKey: '',
      webhookUrl: '',
      autoSync: false,
    };
  },

  salvarConfig: (config: SheetsConfig) => {
    const configNormalizada: SheetsConfig = {
      ...config,
      webhookUrl: normalizarWebhookUrl(config.webhookUrl || ''),
      spreadsheetId: (config.spreadsheetId || '').trim(),
      apiKey: (config.apiKey || '').trim(),
    };
    localStorage.setItem('sisarm_sheets_config', JSON.stringify(configNormalizada));
  },

  limparConfig: () => {
    localStorage.removeItem('sisarm_sheets_config');
  },

  exportarDadosParaSheets: async (
    retiradas: Retirada[],
    estoque: ItemEstoque[],
    militares?: MilitarServico[],
    armeiros?: MilitarReserva[]
  ): Promise<{ sucesso: boolean; mensagem: string }> => {
    const config = sheetsService.getConfig();
    const webhook = normalizarWebhookUrl(config.webhookUrl || '');

    if (!webhook) {
      return {
        sucesso: false,
        mensagem: 'URL do Google Apps Script Webhook não configurada. Cole a URL gerada no menu da sua planilha.',
      };
    }

    try {
      const payload = {
        acao: 'sincronizar_total',
        timestamp: new Date().toISOString(),
        retiradas,
        estoque,
        militares: militares || [],
        armeiros: armeiros || [],
      };

      // Usa no-cors para evitar bloqueios de CORS do navegador ao chamar o Apps Script
      await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      return {
        sucesso: true,
        mensagem: 'Dados enviados com sucesso para a planilha do Google Sheets via Webhook!',
      };
    } catch (e: any) {
      console.error('Erro ao enviar para webhook do Sheets:', e);
      return {
        sucesso: false,
        mensagem: `Erro na conexão com o Webhook: ${e.message || 'Falha de rede'}`,
      };
    }
  },

  gerarCSVRetiradas: (retiradas: Retirada[]): string => {
    const headers = [
      'Nº Cautela',
      'Status',
      'Posto Militar',
      'Nome Guerra',
      'RE/Matrícula',
      'Armeiro Saída',
      'Data Saída',
      'Data Devolução Prevista',
      'Data Devolução Efetiva',
      'Armeiro Recebedor',
      'Itens Cautelados',
      'Tiros Consumidos',
      'Nº BO',
      'Destino/Motivo',
      'Hash SHA-256',
    ];

    const rows = retiradas.map((r) => {
      const itensStr = (r.itens || [])
        .map((it) => `${it.quantidade}x ${it.materialNome} (Série: ${it.nArmamento || 'S/N'})`)
        .join(' ; ');

      return [
        `"${r.numeroCautela || ''}"`,
        `"${r.status || ''}"`,
        `"${r.militarServicoPatente || ''}"`,
        `"${r.militarServicoGuerra || ''}"`,
        `"${r.militarServicoMatricula || ''}"`,
        `"${r.militarReservaNome || ''}"`,
        `"${r.dataSaida || ''}"`,
        `"${r.dataDevolucaoPrevista || ''}"`,
        `"${r.dataDevolucao || ''}"`,
        `"${r.armeiroRecebedorNome || ''}"`,
        `"${itensStr}"`,
        `"${r.quantidadeTotalTirosConsumidos || 0}"`,
        `"${r.numeroBoletimOcorrencia || ''}"`,
        `"${r.motivoDetalhado || r.tipoDestino || ''}"`,
        `"${r.hashAssinaturaSaida || r.hashAutenticacao || ''}"`,
      ].join(';');
    });

    return [headers.join(';'), ...rows].join('\r\n');
  },

  gerarCSVEstoque: (estoque: ItemEstoque[]): string => {
    const headers = [
      'ID',
      'Categoria',
      'Nome / Modelo',
      'Calibre',
      'Nº de Série / Patrimônio',
      'Lote',
      'Status',
      'Estado Conservação',
      'Local Armazenamento',
      'Quantidade Disponível',
    ];

    const rows = estoque.map((item) => [
      `"${item.id || ''}"`,
      `"${item.categoria || ''}"`,
      `"${item.nome || ''}"`,
      `"${item.calibre || '-'}"`,
      `"${item.nMaterial || ''}"`,
      `"${item.lote || '-'}"`,
      `"${item.status || ''}"`,
      `"${item.estado || ''}"`,
      `"${item.localArmazenamento || ''}"`,
      `"${item.quantidadeDisponivel != null ? item.quantidadeDisponivel : 1}"`,
    ].join(';'));

    return [headers.join(';'), ...rows].join('\r\n');
  },
};
