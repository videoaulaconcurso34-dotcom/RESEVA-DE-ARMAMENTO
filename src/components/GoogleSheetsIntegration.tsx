import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Save,
  Download,
} from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import { sheetsService } from '../services/sheetsService';
import { db } from '../services/db';

export const GoogleSheetsIntegration: React.FC = () => {
  const [config, setConfig] = useState(() => sheetsService.getConfig());
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [isTestando, setIsTestando] = useState(false);
  const [resultadoMsg, setResultadoMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    sheetsService.salvarConfig({
      spreadsheetId: spreadsheetId.trim(),
      apiKey: apiKey.trim(),
      webhookUrl: webhookUrl.trim(),
      autoSync: config.autoSync,
    });
    setConfig(sheetsService.getConfig());
    setResultadoMsg({
      tipo: 'sucesso',
      texto: 'Configurações do Google Sheets salvas com sucesso no navegador.',
    });
  };

  const handleExportarAgora = async () => {
    setIsTestando(true);
    setResultadoMsg(null);
    try {
      const retiradas = db.getRetiradas();
      const estoque = db.getEstoque();
      const sucesso = await sheetsService.exportarDadosParaSheets(retiradas, estoque);
      if (sucesso) {
        setResultadoMsg({
          tipo: 'sucesso',
          texto: 'Dados sincronizados com o Google Sheets / Webhook com sucesso!',
        });
      } else {
        setResultadoMsg({
          tipo: 'erro',
          texto: 'Falha ao conectar com o Google Sheets. Verifique a URL do Webhook ou ID da planilha.',
        });
      }
    } catch (e: any) {
      setResultadoMsg({
        tipo: 'erro',
        texto: e.message || 'Erro inesperado na sincronização.',
      });
    } finally {
      setIsTestando(false);
    }
  };

  const handleBaixarCSVBackup = () => {
    const dados = {
      retiradas: db.getRetiradas(),
      estoque: db.getEstoque(),
      militares: db.getMilitares(),
      auditoria: db.getAuditoria(),
    };
    const jsonStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sisreserva_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono max-w-4xl">
      <HeaderBar title="INTEGRAÇÃO GOOGLE SHEETS" />

      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#142313] border border-[#2b592f] rounded text-[#86efac]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              SINCRONIZAÇÃO COM PLANILHA GOOGLE (LIVRO DIGITAL)
            </h3>
            <p className="text-xs text-[#7a8c7b] mt-1 leading-relaxed">
              Conecte o SISRESERVA diretamente a uma planilha do Google Sheets através do Google Apps Script Webhook ou da Google Sheets API v4. Permite espelhamento automático das cautelas e devoluções para a 4ª Seção (Logística/P4).
            </p>
          </div>
        </div>

        {resultadoMsg && (
          <div
            className={`p-3 rounded border text-xs flex items-center gap-2 ${
              resultadoMsg.tipo === 'sucesso'
                ? 'bg-[#142313] border-[#2b592f] text-[#86efac]'
                : 'bg-red-950/50 border-red-800 text-red-300'
            }`}
          >
            {resultadoMsg.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{resultadoMsg.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarConfig} className="space-y-4 text-xs pt-2">
          <div>
            <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
              Google Apps Script Webhook URL (Recomendado para Sincronização Direta)
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
            />
            <span className="text-[10px] text-[#5b6e58] block mt-1">
              URL do Web App gerado no editor do Google Apps Script com permissão "Anyone".
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                ID da Planilha Google (Spreadsheet ID)
              </label>
              <input
                type="text"
                placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                Google Cloud API Key (Opcional para Leitura)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1f281e]">
            <button
              type="button"
              onClick={handleBaixarCSVBackup}
              className="bg-[#121812] hover:bg-[#1b231a] text-[#a5bca3] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORTAR BACKUP JSON</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isTestando}
                onClick={handleExportarAgora}
                className="bg-[#1b2619] hover:bg-[#253623] text-[#86efac] border border-[#2f4d2b] px-4 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestando ? 'animate-spin' : ''}`} />
                <span>{isTestando ? 'SINCRONIZANDO...' : 'TESTAR / SINCRONIZAR AGORA'}</span>
              </button>

              <button
                type="submit"
                className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SALVAR CONFIGURAÇÃO</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-3 text-xs">
        <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#86efac]" />
          INSTRUÇÕES PARA GOOGLE APPS SCRIPT
        </h4>
        <p className="text-[11px] text-[#7a8c7b] leading-relaxed">
          Para receber os lançamentos em tempo real em sua planilha do Google Drive sem expor credenciais privadas, cole o código do Apps Script fornecido na documentação técnica no menu <em>Extensões &gt; Apps Script</em> da sua planilha e implante como Web App.
        </p>
      </div>
    </div>
  );
};
