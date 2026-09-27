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
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Trash2,
  Table,
} from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import {
  sheetsService,
  SCRIPT_GOOGLE_APPS_SCRIPT,
  normalizarWebhookUrl,
} from '../services/sheetsService';
import { db } from '../services/db';

export const GoogleSheetsIntegration: React.FC = () => {
  const [config, setConfig] = useState(() => sheetsService.getConfig());
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || '');
  const [isTestando, setIsTestando] = useState(false);
  const [resultadoMsg, setResultadoMsg] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [mostrarScript, setMostrarScript] = useState(false);

  const webhookConfigurado = Boolean(webhookUrl && webhookUrl.includes('script.google.com'));

  const handleCopiarScript = () => {
    navigator.clipboard.writeText(SCRIPT_GOOGLE_APPS_SCRIPT);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleSalvarConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const urlLimpa = normalizarWebhookUrl(webhookUrl);
    sheetsService.salvarConfig({
      spreadsheetId: spreadsheetId.trim(),
      apiKey: '',
      webhookUrl: urlLimpa,
      autoSync: config.autoSync,
    });
    setWebhookUrl(urlLimpa);
    setConfig(sheetsService.getConfig());
    setResultadoMsg({
      tipo: 'sucesso',
      texto: 'Configuração do Google Sheets salva no navegador com sucesso!',
    });
  };

  const handleLimparConfig = () => {
    if (!confirm('Deseja remover as configurações salvas da planilha?')) return;
    sheetsService.limparConfig();
    setWebhookUrl('');
    setSpreadsheetId('');
    setConfig(sheetsService.getConfig());
    setResultadoMsg({
      tipo: 'aviso',
      texto: 'Configurações removidas. Insira a nova URL do Webhook do Google Apps Script.',
    });
  };

  const handleExportarAgora = async () => {
    const urlLimpa = normalizarWebhookUrl(webhookUrl);
    if (!urlLimpa) {
      setResultadoMsg({
        tipo: 'erro',
        texto: 'Por favor, informe a URL do Webhook do Google Apps Script antes de sincronizar.',
      });
      return;
    }

    // Salva antes de disparar
    sheetsService.salvarConfig({
      spreadsheetId: spreadsheetId.trim(),
      apiKey: '',
      webhookUrl: urlLimpa,
      autoSync: config.autoSync,
    });
    setConfig(sheetsService.getConfig());

    setIsTestando(true);
    setResultadoMsg(null);
    try {
      const retiradas = db.getRetiradas();
      const estoque = db.getEstoque();
      const militares = db.getMilitares();
      const armeiros = db.getArmeiros();

      const res = await sheetsService.exportarDadosParaSheets(retiradas, estoque, militares, armeiros);
      if (res.sucesso) {
        setResultadoMsg({
          tipo: 'sucesso',
          texto: `${res.mensagem} Foram enviados ${retiradas.length} cautelas, ${estoque.length} itens de estoque e ${militares.length} militares.`,
        });
      } else {
        setResultadoMsg({
          tipo: 'erro',
          texto: res.mensagem,
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

  const handleBaixarCSVCautelas = () => {
    const retiradas = db.getRetiradas();
    const csvContent = '\uFEFF' + sheetsService.gerarCSVRetiradas(retiradas);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sisreserva_cautelas_livro_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBaixarCSVEstoque = () => {
    const estoque = db.getEstoque();
    const csvContent = '\uFEFF' + sheetsService.gerarCSVEstoque(estoque);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sisreserva_estoque_inventario_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBaixarJSONBackup = () => {
    const dados = {
      retiradas: db.getRetiradas(),
      estoque: db.getEstoque(),
      militares: db.getMilitares(),
      armeiros: db.getArmeiros(),
      auditoria: db.getAuditoria(),
      exportadoEm: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sisreserva_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono max-w-4xl">
      <HeaderBar title="INTEGRAÇÃO GOOGLE SHEETS" />

      {/* Caixa de Explicação Netlify & Arquitetura */}
      <div className="bg-[#121c13] border border-[#2b542a] p-4 rounded text-xs text-[#a5cfa2] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#86efac] uppercase">
          <Globe className="w-4 h-4 text-[#86efac] flex-shrink-0" />
          <span>COMO FUNCIONA NO NETLIFY (SEM SERVIDOR E 100% GRATUITO)</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#c3dec0]">
          O SISRESERVA hospedado no <strong>Netlify</strong> é uma aplicação estática moderna (SPA). Ele envia os dados diretamente do navegador para a sua planilha Google através de um <strong>Google Apps Script Webhook</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
          <div className="bg-[#0b120c] p-2 rounded border border-[#1e331c]">
            <strong className="text-white block">✓ Sem Backend</strong>
            <span>Não precisa de servidor Node.js ou banco no Netlify.</span>
          </div>
          <div className="bg-[#0b120c] p-2 rounded border border-[#1e331c]">
            <strong className="text-white block">✓ Gratuito & Ilimitado</strong>
            <span>Usa sua própria conta Google sem custos de API.</span>
          </div>
          <div className="bg-[#0b120c] p-2 rounded border border-[#1e331c]">
            <strong className="text-white block">✓ Formatação Pronta</strong>
            <span>Cria abas, cores militares e cabeçalhos automaticamente.</span>
          </div>
        </div>
      </div>

      {/* Caixa Principal de Configuração */}
      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#142313] border border-[#2b592f] rounded text-[#86efac]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  SINCRONIZAÇÃO COM PLANILHA GOOGLE (LIVRO DIGITAL)
                </h3>
                {webhookConfigurado ? (
                  <span className="text-[10px] font-bold text-[#86efac] bg-[#142313] border border-[#2b592f] px-2 py-0.5 rounded">
                    ● WEBHOOK ATIVO E CONFIGURADO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                    ○ AGUARDANDO CONFIGURAÇÃO DO WEBHOOK
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7a8c7b] mt-1 leading-relaxed">
                Espelhamento automático das cautelas, devoluções, estoque de armamento e efetivo policial para a 4ª Seção (Logística / P4).
              </p>
            </div>
          </div>
        </div>

        {resultadoMsg && (
          <div
            className={`p-3 rounded border text-xs flex items-center gap-2 ${
              resultadoMsg.tipo === 'sucesso'
                ? 'bg-[#142313] border-[#2b592f] text-[#86efac]'
                : resultadoMsg.tipo === 'aviso'
                ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                : 'bg-red-950/50 border-red-800 text-red-300'
            }`}
          >
            {resultadoMsg.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="leading-relaxed">{resultadoMsg.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarConfig} className="space-y-4 text-xs pt-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[#7a8c7b] uppercase block font-bold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#86efac]" />
                Google Apps Script Webhook URL *
              </label>
              <span className="text-[10px] text-[#86efac]">
                Gerada na sua planilha em: Implantar ➔ App da Web
              </span>
            </div>
            <input
              type="text"
              required
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
            />
            <span className="text-[10px] text-[#5b6e58] block mt-1">
              Cole a URL que termina com <code>/exec</code> obtida ao implantar o script na sua planilha.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[#7a8c7b] uppercase block font-bold">
                ID da Planilha Google (Opcional para Referência)
              </label>
              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#86efac] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir Planilha no Google Drive</span>
                </a>
              )}
            </div>
            <input
              type="text"
              placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
            />
          </div>

          {/* Botões Principais */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1f281e]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isTestando}
                onClick={handleExportarAgora}
                className="bg-[#243d22] hover:bg-[#325730] text-[#86efac] border border-[#3e743a] px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestando ? 'animate-spin' : ''}`} />
                <span>{isTestando ? 'ENVIANDO DADOS...' : 'TESTAR / SINCRONIZAR AGORA'}</span>
              </button>

              <button
                type="submit"
                className="bg-[#1b2619] hover:bg-[#253623] text-[#cfdfc7] border border-[#2f4d2b] px-3.5 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SALVAR CONFIGURAÇÃO</span>
              </button>

              {webhookConfigurado && (
                <button
                  type="button"
                  onClick={handleLimparConfig}
                  className="bg-[#1a1414] hover:bg-[#2b1818] text-red-300 border border-red-900/60 px-3 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>LIMPAR</span>
                </button>
              )}
            </div>

            {/* Exportações Manuais Locais */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBaixarCSVCautelas}
                className="bg-[#121812] hover:bg-[#1b231a] text-[#86efac] border border-[#254223] px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                title="Baixa a planilha das cautelas em formato CSV compatível com Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>BAIXAR CAUTELAS (.CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleBaixarCSVEstoque}
                className="bg-[#121812] hover:bg-[#1b231a] text-[#86efac] border border-[#254223] px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                title="Baixa a planilha de estoque em formato CSV compatível com Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>BAIXAR ESTOQUE (.CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleBaixarJSONBackup}
                className="bg-[#121812] hover:bg-[#1b231a] text-[#a5bca3] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                title="Backup completo de todo o banco em formato JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>BACKUP COMPLETO (.JSON)</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Script Google Apps Script com Copiar em 1 Clique */}
      <div className="bg-[#101610] border-2 border-[#2b592f] p-5 rounded-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232f22] pb-3">
          <div>
            <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#86efac]" />
              CÓDIGO OFICIAL DO GOOGLE APPS SCRIPT (WEBHOOK)
            </h4>
            <p className="text-[11px] text-[#9eb29b] mt-1 leading-relaxed">
              Cole este código na sua Planilha Google para receber as cautelas, estoque e policiais automaticamente em abas separadas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopiarScript}
            className="bg-[#243d22] hover:bg-[#325730] text-[#86efac] border border-[#3e743a] px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-2 cursor-pointer shadow-md flex-shrink-0 transition-colors"
          >
            {copiado ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO APPS SCRIPT'}</span>
          </button>
        </div>

        {/* Passo a Passo Completo para Netlify */}
        <div className="bg-[#0b100c] border border-[#1e2a1b] p-4 rounded text-xs space-y-3">
          <span className="font-bold text-[#86efac] block uppercase tracking-wide">
            PASSO A PASSO DE CONFIGURAÇÃO (EM MENOS DE 2 MINUTOS):
          </span>
          <ol className="list-decimal list-inside space-y-2 text-[11px] text-[#c2d6bf] leading-relaxed">
            <li>
              Acesse o seu <strong>Google Drive</strong> e crie uma nova Planilha Google em branco com o nome que desejar (ex: <em>"SISRESERVA - LIVRO DE CARGA E DESCARGA"</em>).
            </li>
            <li>
              No menu superior da planilha, clique em <strong>Extensões ➔ Apps Script</strong>.
            </li>
            <li>
              Apague qualquer texto que estiver lá dentro, clique no botão acima <strong>"COPIAR CÓDIGO APPS SCRIPT"</strong> e cole no editor.
            </li>
            <li>
              No canto superior direito do Apps Script, clique no botão azul <strong>Implantar ➔ Nova implantação</strong>.
            </li>
            <li>
              Clique na <strong>Engrenagem ⚙️</strong> ao lado de "Selecione o tipo" e escolha <strong>App da Web</strong>.
            </li>
            <li>
              Preencha:
              <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-[#86efac]">
                <li>Descrição: <em>Webhook SISRESERVA</em></li>
                <li>Executar como: <strong>Eu (seu_email@gmail.com)</strong></li>
                <li>Quem tem acesso: <strong>Qualquer pessoa (Anyone)</strong> <span className="text-[#a5bca3]">(obrigatório para o Netlify conseguir enviar os dados)</span></li>
              </ul>
            </li>
            <li>
              Clique em <strong>Implantar</strong>. O Google exibirá a tela de permissão da sua própria conta.
              <div className="mt-2 p-2.5 bg-[#1b1c11] border border-amber-800/80 rounded text-amber-200 space-y-1">
                <strong className="block text-amber-300">⚠️ Se aparecer: "O Google não verificou esse aplicativo":</strong>
                <p>Isso é 100% normal e padrão do Google para scripts particulares criados por você mesmo. Para autorizar:</p>
                <div className="pl-2 space-y-0.5 font-sans text-[11px] text-amber-100">
                  <div>1. Clique no link pequeno <strong>"Avançado"</strong> (no canto inferior esquerdo da janela).</div>
                  <div>2. Clique em <strong>"Acessar projeto (não seguro)"</strong> ou <em>"Acessar Webhook SISRESERVA"</em>.</div>
                  <div>3. Na próxima tela, role até o final e clique no botão azul <strong>"Permitir"</strong>.</div>
                </div>
              </div>
            </li>
            <li>
              Pronto! O Google exibirá a <strong>URL do app da web</strong> gerada (ela termina com <code>/exec</code>). Clique no botão <strong>Copiar</strong>.
            </li>
            <li>
              Volte aqui nesta tela do SISRESERVA, cole no campo <strong>Google Apps Script Webhook URL</strong> e clique em <strong>"TESTAR / SINCRONIZAR AGORA"</strong>!
            </li>
          </ol>
        </div>

        {/* Abas Criadas */}
        <div className="bg-[#0b100c] border border-[#1e2a1b] p-3 rounded text-[11px] text-[#a5bca3] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase text-xs">
            <Table className="w-3.5 h-3.5 text-[#86efac]" />
            <span>ABAS QUE SERÃO CRIADAS AUTOMATICAMENTE NA SUA PLANILHA:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2 bg-[#121812] border border-[#1f281e] rounded">
              <strong className="text-[#86efac] block">1. CAUTELAS_HISTORICO</strong>
              <span className="text-[10px]">Número da Cautela, Policial, Armeiro, Itens, Datas, Tiros disparados, BO e Hash de Segurança.</span>
            </div>
            <div className="p-2 bg-[#121812] border border-[#1f281e] rounded">
              <strong className="text-[#86efac] block">2. ESTOQUE_ARMORIAL</strong>
              <span className="text-[10px]">Inventário completo, números de série, calibres, lotes, estado de conservação e localização.</span>
            </div>
            <div className="p-2 bg-[#121812] border border-[#1f281e] rounded">
              <strong className="text-[#86efac] block">3. MILITARES_EFETIVO</strong>
              <span className="text-[10px]">Posto, RE/Matrícula, Nome de Guerra, Batalhão, Companhia e situação cadastral.</span>
            </div>
          </div>
        </div>

        {/* Visualizador de Código */}
        <div>
          <button
            type="button"
            onClick={() => setMostrarScript(!mostrarScript)}
            className="flex items-center gap-1.5 text-xs text-[#86efac] hover:text-white font-bold uppercase cursor-pointer"
          >
            {mostrarScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{mostrarScript ? 'Ocultar Código do Apps Script' : 'Visualizar Código do Apps Script Completo'}</span>
          </button>

          {mostrarScript && (
            <div className="mt-2 relative">
              <pre className="bg-[#070a08] border border-[#232f22] p-4 rounded text-[11px] text-[#a8cca2] font-mono overflow-x-auto max-h-80 select-all leading-relaxed">
                {SCRIPT_GOOGLE_APPS_SCRIPT}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
