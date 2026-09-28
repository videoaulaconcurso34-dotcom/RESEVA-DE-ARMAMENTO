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
        "Nº Cautela / Evento",
        "Tipo de Registro",
        "Status",
        "Militar (Posto/Grad)",
        "Nome de Guerra",
        "RE / Matrícula",
        "Armeiro de Saída",
        "Data Saída",
        "Devolução Prevista",
        "Data Devolução",
        "Armeiro Recebedor",
        "Materiais desta Linha",
        "Tiros Consumidos",
        "Nº BO",
        "Motivo / Observações",
        "Hash SHA-256 (Autenticidade)"
      ];

      var rowsCautelas = [headerCautelas];
      for (var i = 0; i < data.retiradas.length; i++) {
        var r = data.retiradas[i];

        // Se a cautela possui histórico de devoluções registradas:
        if (r.historicoDevolucoes && r.historicoDevolucoes.length > 0) {
          // Linha 1: Registro da Saída
          var itensSaidaStr = (r.itens || []).map(function(it) {
            return (it.quantidade || 1) + "x " + (it.materialNome || "") + " (Série: " + (it.nArmamento || "S/N") + ")";
          }).join(" | ");

          rowsCautelas.push([
            r.numeroCautela || "",
            "SAÍDA INICIAL",
            r.status || "",
            (r.militarServicoPatente || "") + " " + (r.militarServicoNome || ""),
            r.militarServicoGuerra || "",
            r.militarServicoMatricula || "",
            (r.militarReservaPatente || "") + " " + (r.militarReservaNome || ""),
            r.dataSaida || "",
            r.dataDevolucaoPrevista || "",
            "-",
            "-",
            itensSaidaStr,
            0,
            "",
            r.motivoDetalhado || r.tipoDestino || "",
            r.hashAssinaturaSaida || r.hashAutenticacao || ""
          ]);

          // Linhas seguintes: Cada devolução separada, mostrando APENAS os materiais devolvidos nela e o armeiro que a recebeu
          for (var d = 0; d < r.historicoDevolucoes.length; d++) {
            var dev = r.historicoDevolucoes[d];
            var materiaisDevStr = (dev.itensDevolvidos || []).map(function(it) {
              return (it.quantidadeDevolvida || 1) + "x " + (it.materialNome || "") + " (Série: " + (it.nArmamento || "S/N") + ")";
            }).join(" | ");

            rowsCautelas.push([
              (r.numeroCautela || "") + " [" + (d + 1) + "ª DEV. " + dev.tipoDevolucao + "]",
              (d + 1) + "ª DEVOLUÇÃO (" + dev.tipoDevolucao + ")",
              dev.tipoDevolucao === "PARCIAL" ? "DEVOLUÇÃO PARCIAL" : "DEVOLVIDO",
              (dev.militarDevolucaoPatente || r.militarServicoPatente || "") + " " + (dev.militarDevolucaoNome || r.militarServicoNome || ""),
              dev.militarDevolucaoGuerra || r.militarServicoGuerra || "",
              dev.militarDevolucaoMatricula || r.militarServicoMatricula || "",
              (r.militarReservaPatente || "") + " " + (r.militarReservaNome || ""),
              r.dataSaida || "",
              r.dataDevolucaoPrevista || "",
              dev.dataHora || "",
              (dev.armeiroRecebedorPatente || "") + " " + (dev.armeiroRecebedorNome || ""),
              materiaisDevStr || "Conferido",
              dev.quantidadeTotalTirosConsumidos || 0,
              dev.numeroBoletimOcorrencia || "",
              dev.observacoes || "Devolução registrada",
              dev.hashAssinaturaDevolucao || ""
            ]);
          }

          // Se a cautela ainda estiver com materiais pendentes na rua:
          if (r.status === "DEVOLUÇÃO PARCIAL") {
            var itensPendentes = (r.itens || []).filter(function(it) {
              var saldo = (it.quantidade || 0) - (it.quantidadeDevolvida || 0) - (it.quantidadeConsumida || 0);
              return saldo > 0;
            }).map(function(it) {
              var saldo = (it.quantidade || 0) - (it.quantidadeDevolvida || 0) - (it.quantidadeConsumida || 0);
              return saldo + "x " + (it.materialNome || "") + " (Série: " + (it.nArmamento || "S/N") + ")";
            }).join(" | ");

            if (itensPendentes) {
              rowsCautelas.push([
                (r.numeroCautela || "") + " [PENDENTE NA RUA]",
                "SALDO PENDENTE",
                "EM SERVIÇO (PARCIAL)",
                (r.militarServicoPatente || "") + " " + (r.militarServicoNome || ""),
                r.militarServicoGuerra || "",
                r.militarServicoMatricula || "",
                (r.militarReservaPatente || "") + " " + (r.militarReservaNome || ""),
                r.dataSaida || "",
                r.dataDevolucaoPrevista || "",
                "Aguardando Devolução",
                "-",
                itensPendentes,
                0,
                "",
                "Material em posse do policial aguardando devolução",
                ""
              ]);
            }
          }
        } else {
          // Cautela única (sem devoluções ou em andamento)
          var itensNormalStr = (r.itens || []).map(function(it) {
            return (it.quantidade || 1) + "x " + (it.materialNome || "") + " (Série: " + (it.nArmamento || "S/N") + ")";
          }).join(" | ");

          rowsCautelas.push([
            r.numeroCautela || "",
            "CAUTELA INTEGRAL",
            r.status || "",
            (r.militarServicoPatente || "") + " " + (r.militarServicoNome || ""),
            r.militarServicoGuerra || "",
            r.militarServicoMatricula || "",
            (r.militarReservaPatente || "") + " " + (r.militarReservaNome || ""),
            r.dataSaida || "",
            r.dataDevolucaoPrevista || "",
            r.dataDevolucao || "-",
            r.armeiroRecebedorNome || "-",
            itensNormalStr,
            r.quantidadeTotalTirosConsumidos || 0,
            r.numeroBoletimOcorrencia || "",
            r.motivoDetalhado || r.tipoDestino || "",
            r.hashAssinaturaSaida || r.hashAutenticacao || ""
          ]);
        }
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
      'Nº Cautela / Evento',
      'Tipo Registro',
      'Status',
      'Posto Militar',
      'Nome Guerra',
      'RE/Matrícula',
      'Armeiro Saída',
      'Data Saída',
      'Data Devolução Prevista',
      'Data Devolução Efetiva',
      'Armeiro Recebedor',
      'Materiais da Linha',
      'Tiros Consumidos',
      'Nº BO',
      'Destino/Motivo',
      'Hash SHA-256',
    ];

    const rows: string[] = [];

    retiradas.forEach((r) => {
      if (r.historicoDevolucoes && r.historicoDevolucoes.length > 0) {
        // Linha da Saída Inicial
        const itensSaidaStr = (r.itens || [])
          .map((it) => `${it.quantidade}x ${it.materialNome} (Série: ${it.nArmamento || 'S/N'})`)
          .join(' ; ');

        rows.push(
          [
            `"${r.numeroCautela || ''}"`,
            `"SAÍDA INICIAL"`,
            `"${r.status || ''}"`,
            `"${r.militarServicoPatente || ''}"`,
            `"${r.militarServicoGuerra || ''}"`,
            `"${r.militarServicoMatricula || ''}"`,
            `"${r.militarReservaNome || ''}"`,
            `"${r.dataSaida || ''}"`,
            `"${r.dataDevolucaoPrevista || ''}"`,
            `"-"`,
            `"-"`,
            `"${itensSaidaStr}"`,
            `"0"`,
            `""`,
            `"${r.motivoDetalhado || r.tipoDestino || ''}"`,
            `"${r.hashAssinaturaSaida || r.hashAutenticacao || ''}"`,
          ].join(';')
        );

        // Linha para cada devolução (mostrando APENAS os materiais devolvidos nela e o armeiro que recebeu)
        r.historicoDevolucoes.forEach((dev, idx) => {
          const itensDevStr = (dev.itensDevolvidos || [])
            .map((it) => `${it.quantidadeDevolvida}x ${it.materialNome} (Série: ${it.nArmamento || 'S/N'})`)
            .join(' ; ');

          rows.push(
            [
              `"${r.numeroCautela} [${idx + 1}ª DEV. ${dev.tipoDevolucao}]"`,
              `"${idx + 1}ª DEVOLUÇÃO (${dev.tipoDevolucao})"`,
              `"${dev.tipoDevolucao === 'PARCIAL' ? 'DEVOLUÇÃO PARCIAL' : 'DEVOLVIDO'}"`,
              `"${dev.militarDevolucaoPatente || r.militarServicoPatente || ''}"`,
              `"${dev.militarDevolucaoGuerra || r.militarServicoGuerra || ''}"`,
              `"${dev.militarDevolucaoMatricula || r.militarServicoMatricula || ''}"`,
              `"${r.militarReservaNome || ''}"`,
              `"${r.dataSaida || ''}"`,
              `"${r.dataDevolucaoPrevista || ''}"`,
              `"${dev.dataHora || ''}"`,
              `"${dev.armeiroRecebedorPatente || ''} ${dev.armeiroRecebedorNome || ''}"`,
              `"${itensDevStr || 'Conferido'}"`,
              `"${dev.quantidadeTotalTirosConsumidos || 0}"`,
              `"${dev.numeroBoletimOcorrencia || ''}"`,
              `"${dev.observacoes || 'Devolução registrada'}"`,
              `"${dev.hashAssinaturaDevolucao || ''}"`,
            ].join(';')
          );
        });

        // Se ainda estiver com materiais pendentes na rua
        if (r.status === 'DEVOLUÇÃO PARCIAL') {
          const pendentesStr = (r.itens || [])
            .filter((it) => {
              const saldo = (it.quantidade || 0) - (it.quantidadeDevolvida || 0) - (it.quantidadeConsumida || 0);
              return saldo > 0;
            })
            .map((it) => {
              const saldo = (it.quantidade || 0) - (it.quantidadeDevolvida || 0) - (it.quantidadeConsumida || 0);
              return `${saldo}x ${it.materialNome} (Série: ${it.nArmamento || 'S/N'})`;
            })
            .join(' ; ');

          if (pendentesStr) {
            rows.push(
              [
                `"${r.numeroCautela} [PENDENTE NA RUA]"`,
                `"SALDO PENDENTE"`,
                `"EM SERVIÇO (PARCIAL)"`,
                `"${r.militarServicoPatente || ''}"`,
                `"${r.militarServicoGuerra || ''}"`,
                `"${r.militarServicoMatricula || ''}"`,
                `"${r.militarReservaNome || ''}"`,
                `"${r.dataSaida || ''}"`,
                `"${r.dataDevolucaoPrevista || ''}"`,
                `"Aguardando Devolução"`,
                `"-"`,
                `"${pendentesStr}"`,
                `"0"`,
                `""`,
                `"Material em posse do policial aguardando devolução"`,
                `""`,
              ].join(';')
            );
          }
        }
      } else {
        // Cautela sem devolução registrada ainda
        const itensStr = (r.itens || [])
          .map((it) => `${it.quantidade}x ${it.materialNome} (Série: ${it.nArmamento || 'S/N'})`)
          .join(' ; ');

        rows.push(
          [
            `"${r.numeroCautela || ''}"`,
            `"CAUTELA INTEGRAL"`,
            `"${r.status || ''}"`,
            `"${r.militarServicoPatente || ''}"`,
            `"${r.militarServicoGuerra || ''}"`,
            `"${r.militarServicoMatricula || ''}"`,
            `"${r.militarReservaNome || ''}"`,
            `"${r.dataSaida || ''}"`,
            `"${r.dataDevolucaoPrevista || ''}"`,
            `"${r.dataDevolucao || '-'}"`,
            `"${r.armeiroRecebedorNome || '-'}"`,
            `"${itensStr}"`,
            `"${r.quantidadeTotalTirosConsumidos || 0}"`,
            `"${r.numeroBoletimOcorrencia || ''}"`,
            `"${r.motivoDetalhado || r.tipoDestino || ''}"`,
            `"${r.hashAssinaturaSaida || r.hashAutenticacao || ''}"`,
          ].join(';')
        );
      }
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
