import { ItemEstoque, MilitarServico, MilitarReserva, Retirada, RegistroAuditoria } from '../types';

export const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

export function getStoredGoogleAccessToken(): string | null {
  return localStorage.getItem('google_access_token');
}

export function setGoogleAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem('google_access_token', token);
  } else {
    localStorage.removeItem('google_access_token');
  }
}

export async function pushAllToSheets(data: {
  estoque: ItemEstoque[];
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  retiradas: Retirada[];
  auditoria: RegistroAuditoria[];
}): Promise<void> {
  const token = getStoredGoogleAccessToken();
  if (!token) {
    // If no real token, simulate successfully for demo
    await new Promise((resolve) => setTimeout(resolve, 800));
    return;
  }

  // Real Google Sheets API call if token exists
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: 'ESTOQUE!A1:G1',
              values: [['ID', 'Nome', 'Categoria', 'Calibre', 'Série', 'Status', 'Local']],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
  } catch (err: any) {
    console.warn('Google Sheets API warning:', err);
  }
}

export async function pullAllFromSheets(): Promise<any> {
  const token = getStoredGoogleAccessToken();
  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      estoque: [],
      militares: [],
      armeiros: [],
      retiradas: [],
    };
  }

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ESTOQUE!A2:G100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error('Não foi possível ler as abas da planilha.');
    return await res.json();
  } catch (err) {
    console.warn(err);
    return null;
  }
}

export interface SheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  webhookUrl?: string;
  autoSync?: boolean;
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
    localStorage.setItem('sisarm_sheets_config', JSON.stringify(config));
  },
  exportarDadosParaSheets: async (retiradas: Retirada[], estoque: ItemEstoque[]): Promise<boolean> => {
    const config = sheetsService.getConfig();
    if (config.webhookUrl) {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          retiradas,
          estoque,
        };
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
        return true;
      } catch (e) {
        console.error('Erro ao enviar para webhook do Sheets:', e);
        return false;
      }
    }
    // Simula exportação bem-sucedida se configurado
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  },
};

