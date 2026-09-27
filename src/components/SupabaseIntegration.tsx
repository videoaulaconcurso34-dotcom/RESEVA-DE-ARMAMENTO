import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shield,
  FileCode2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Table,
  Eye,
  EyeOff,
  Trash2,
  Lock,
} from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import {
  carregarConfigSupabase,
  salvarConfigSupabase,
  testarConexaoSupabase,
  sincronizarDadosComSupabase,
  puxarDadosDoSupabase,
  limparCredenciaisSupabase,
  hasCustomSupabaseConfig,
  normalizarSupabaseUrl,
  normalizarSupabaseKey,
  SCRIPT_SQL_SUPABASE,
  StatusTabelasSupabase,
} from '../services/supabase';
import { db } from '../services/db';

interface SupabaseIntegrationProps {
  onSincronizacaoConcluida?: () => void;
  onAbrirDocumentacao?: () => void;
}

export const SupabaseIntegration: React.FC<SupabaseIntegrationProps> = ({
  onSincronizacaoConcluida,
  onAbrirDocumentacao,
}) => {
  const [config, setConfig] = useState(() => carregarConfigSupabase());
  const [supabaseUrl, setSupabaseUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [mostrarKey, setMostrarKey] = useState(false);
  const [isCarregando, setIsCarregando] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; texto: string } | null>(null);
  const [statusTabelas, setStatusTabelas] = useState<StatusTabelasSupabase | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [mostrarScript, setMostrarScript] = useState(false);
  const [jaConfigurado, setJaConfigurado] = useState(() => hasCustomSupabaseConfig());

  // Testa tabelas silenciosamente ao abrir se houver URL e Key salvas
  useEffect(() => {
    if (supabaseUrl && anonKey && !anonKey.includes('placeholder')) {
      testarConexaoSupabase({ url: supabaseUrl, anonKey })
        .then((res) => {
          if (res.status) setStatusTabelas(res.status);
        })
        .catch(() => {});
    }
  }, []);

  const handleCopiarScript = () => {
    navigator.clipboard.writeText(SCRIPT_SQL_SUPABASE);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleSalvarEConectar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const urlLimpa = normalizarSupabaseUrl(supabaseUrl);
    const keyLimpa = normalizarSupabaseKey(anonKey);

    if (!urlLimpa || !keyLimpa) {
      setStatusMsg({
        tipo: 'erro',
        texto: 'Por favor, preencha a URL do Projeto e a Chave Anon antes de salvar.',
      });
      return;
    }

    // Salva no localStorage
    salvarConfigSupabase({
      url: urlLimpa,
      anonKey: keyLimpa,
      autoSync: config.autoSync,
    });
    setSupabaseUrl(urlLimpa);
    setAnonKey(keyLimpa);
    setConfig(carregarConfigSupabase());
    setJaConfigurado(true);

    // Imediatamente testa a conexão para dar feedback ao usuário
    setIsCarregando(true);
    setStatusMsg(null);
    try {
      const res = await testarConexaoSupabase({
        url: urlLimpa,
        anonKey: keyLimpa,
      });
      if (res.status) {
        setStatusTabelas(res.status);
      }
      if (res.sucesso) {
        setStatusMsg({
          tipo: 'sucesso',
          texto: `Credenciais salvas com sucesso! ${res.mensagem}`,
        });
      } else {
        setStatusMsg({
          tipo: res.tabelasFaltando && res.tabelasFaltando.length > 0 ? 'aviso' : 'erro',
          texto: `Credenciais salvas no navegador! ${res.mensagem}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        tipo: 'erro',
        texto: `Credenciais salvas, mas houve erro ao testar conexão: ${err.message || 'Falha de rede'}`,
      });
    } finally {
      setIsCarregando(false);
    }
  };

  const handleLimparCredenciais = () => {
    if (!confirm('Deseja limpar as credenciais salvas e voltar ao padrão?')) return;
    limparCredenciaisSupabase();
    setSupabaseUrl('');
    setAnonKey('');
    setConfig(carregarConfigSupabase());
    setStatusTabelas(null);
    setJaConfigurado(false);
    setStatusMsg({
      tipo: 'aviso',
      texto: 'Credenciais removidas. Cole a URL e a Chave do seu projeto Supabase e clique em SALVAR CREDENCIAIS.',
    });
  };

  const handleEnviarTudo = async () => {
    setIsCarregando(true);
    setStatusMsg(null);
    try {
      const res = await sincronizarDadosComSupabase({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      });
      if (res.sucesso) {
        setStatusMsg({
          tipo: 'sucesso',
          texto: `Sincronização concluída! ${res.mensagem}`,
        });
        if (onSincronizacaoConcluida) onSincronizacaoConcluida();
      } else {
        setStatusMsg({
          tipo: 'erro',
          texto: res.mensagem,
        });
      }
    } catch (e: any) {
      setStatusMsg({
        tipo: 'erro',
        texto: e.message || 'Erro ao enviar dados.',
      });
    } finally {
      setIsCarregando(false);
    }
  };

  const handlePuxarTudo = async () => {
    if (!confirm('Deseja puxar os dados do Supabase e mesclar com a base local?')) return;
    setIsCarregando(true);
    setStatusMsg(null);
    try {
      const res = await puxarDadosDoSupabase();
      if (res.sucesso && res.dados) {
        if (res.dados.militares && res.dados.militares.length > 0) {
          localStorage.setItem('sisarm_militares', JSON.stringify(res.dados.militares));
        }
        if (res.dados.armeiros && res.dados.armeiros.length > 0) {
          localStorage.setItem('sisarm_armeiros', JSON.stringify(res.dados.armeiros));
        }
        if (res.dados.estoque && res.dados.estoque.length > 0) {
          localStorage.setItem('sisarm_estoque', JSON.stringify(res.dados.estoque));
        }
        if (res.dados.retiradas && res.dados.retiradas.length > 0) {
          localStorage.setItem('sisarm_retiradas', JSON.stringify(res.dados.retiradas));
        }
        if (res.dados.auditoria && res.dados.auditoria.length > 0) {
          localStorage.setItem('sisarm_auditoria', JSON.stringify(res.dados.auditoria));
        }
        db.recarregar();
        setStatusMsg({
          tipo: 'sucesso',
          texto: 'Dados restaurados do Supabase com sucesso!',
        });
        if (onSincronizacaoConcluida) onSincronizacaoConcluida();
      } else {
        setStatusMsg({
          tipo: 'erro',
          texto: res.mensagem,
        });
      }
    } catch (e: any) {
      setStatusMsg({
        tipo: 'erro',
        texto: e.message || 'Erro ao puxar dados.',
      });
    } finally {
      setIsCarregando(false);
    }
  };

  const tabelasObrigatorias = [
    {
      nome: 'militares_servico',
      rotulo: 'Militares de Serviço (Policiais)',
      existe: statusTabelas?.militares_servico,
    },
    {
      nome: 'armeiros',
      rotulo: 'Armeiros da Reserva',
      existe: statusTabelas?.armeiros,
    },
    {
      nome: 'estoque',
      rotulo: 'Estoque de Armamento & Material',
      existe: statusTabelas?.estoque,
    },
    {
      nome: 'retiradas',
      rotulo: 'Retiradas & Cautelas Bélicas',
      existe: statusTabelas?.retiradas,
    },
    {
      nome: 'auditoria_logs',
      rotulo: 'Auditoria & Logs do Sistema',
      existe: statusTabelas?.auditoria_logs,
    },
  ];

  return (
    <div className="space-y-6 font-mono max-w-4xl">
      <HeaderBar title="INTEGRAÇÃO SUPABASE (POSTGRESQL)" />

      {/* Caixa Principal de Configuração */}
      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#142313] border border-[#2b592f] rounded text-[#86efac]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  BANCO DE DADOS EM NUVEM (SUPABASE / POSTGRESQL)
                </h3>
                {jaConfigurado ? (
                  <span className="text-[10px] font-bold text-[#86efac] bg-[#142313] border border-[#2b592f] px-2 py-0.5 rounded">
                    ● CREDENCIAIS PERSONALIZADAS ATIVAS
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                    ○ AGUARDANDO CREDENCIAIS DO SEU PROJETO
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7a8c7b] mt-1 leading-relaxed">
                O SISRESERVA opera em modo híbrido (Offline-First). O banco de dados Supabase permite persistência permanente com sincronização bidirecional em tempo real.
              </p>
            </div>
          </div>

          {onAbrirDocumentacao && (
            <button
              onClick={onAbrirDocumentacao}
              className="text-[11px] bg-[#1a2618] border border-[#2d422a] text-[#86efac] px-3 py-1.5 rounded font-bold uppercase flex items-center gap-1.5 hover:bg-[#253723] cursor-pointer flex-shrink-0"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>DOCUMENTAÇÃO TÉCNICA</span>
            </button>
          )}
        </div>

        {/* Banner de tranquilidade */}
        <div className="bg-[#121b13] border border-[#2b4c29] p-3 rounded text-xs text-[#a3c99f] flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#86efac] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-[#86efac] uppercase block">
              O SISRESERVA JÁ ESTÁ 100% OPERACIONAL E SALVANDO NO SEU COMPUTADOR!
            </span>
            <span className="text-[11px] text-[#8ea88c]">
              Mesmo sem configurar o Supabase, todos os cadastros de policiais, armamento, cautelas, devoluções e relatórios já funcionam e ficam permanentemente salvos no seu navegador (Offline-First). O Supabase é apenas um backup opcional na nuvem.
            </span>
          </div>
        </div>

        {/* Bloco de Colar Rápido / Auto-Detecção */}
        <div className="bg-[#0b120c] border border-[#1e2e1d] p-3.5 rounded text-xs space-y-2">
          <label className="text-[11px] font-bold text-[#86efac] uppercase flex items-center gap-1.5">
            <span>⚡ COLAR RÁPIDO (AUTO-DETECÇÃO INTELIGENTE)</span>
          </label>
          <p className="text-[11px] text-[#7a8c7b] leading-relaxed">
            Tem dúvida de qual campo preencher? Cole qualquer texto aqui (o link da barra de navegação do Supabase, o ID do projeto, ou a chave inteira) e o sistema identificará automaticamente:
          </p>
          <input
            type="text"
            placeholder="Cole aqui a URL do Supabase, o ID do projeto ou a chave anon..."
            onChange={(e) => {
              const val = e.target.value.trim();
              if (!val) return;
              const urlDetectada = normalizarSupabaseUrl(val);
              const keyDetectada = normalizarSupabaseKey(val);

              let alterou = false;
              if (urlDetectada && urlDetectada.includes('.supabase.co')) {
                setSupabaseUrl(urlDetectada);
                alterou = true;
              }
              if (keyDetectada && (keyDetectada.startsWith('eyJ') || keyDetectada.startsWith('sb_'))) {
                setAnonKey(keyDetectada);
                alterou = true;
              }

              if (alterou) {
                setStatusMsg({
                  tipo: 'sucesso',
                  texto: 'Dados detectados e preenchidos automaticamente nos campos abaixo! Clique em "SALVAR CREDENCIAIS E TESTAR".',
                });
                e.target.value = '';
              }
            }}
            className="w-full bg-[#070b08] border border-[#2b4c29] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#86efac]"
          />
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded border text-xs flex items-center gap-2 ${
              statusMsg.tipo === 'sucesso'
                ? 'bg-[#142313] border-[#2b592f] text-[#86efac]'
                : statusMsg.tipo === 'aviso'
                ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                : 'bg-red-950/50 border-red-800 text-red-300'
            }`}
          >
            {statusMsg.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="leading-relaxed">{statusMsg.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvarEConectar} className="space-y-4 text-xs pt-2">
          {/* Campo URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[#7a8c7b] uppercase font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#86efac]" />
                Supabase Project URL *
              </label>
              <span className="text-[10px] text-[#86efac]">
                No Supabase: Project Settings ➔ API ➔ Project URL
              </span>
            </div>
            <input
              type="text"
              required
              placeholder="https://seu-projeto-id.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
            />
          </div>

          {/* Campo Anon Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[#7a8c7b] uppercase font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#86efac]" />
                Supabase Anon / Public API Key *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarKey(!mostrarKey)}
                  className="text-[10px] text-[#86efac] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {mostrarKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{mostrarKey ? 'Ocultar Chave' : 'Exibir Chave'}</span>
                </button>
                <span className="text-[10px] text-[#7a8c7b]">|</span>
                <span className="text-[10px] text-[#86efac]">
                  No Supabase: Project Settings ➔ API ➔ chave anon / public
                </span>
              </div>
            </div>
            <div className="relative">
              <input
                type={mostrarKey ? 'text' : 'password'}
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439] pr-10"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1f281e]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={isCarregando}
                className="bg-[#243d22] hover:bg-[#325730] text-[#86efac] border border-[#3e743a] px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SALVAR CREDENCIAIS E TESTAR</span>
              </button>

              <button
                type="button"
                disabled={isCarregando}
                onClick={() => handleSalvarEConectar()}
                className="bg-[#1b2619] hover:bg-[#253623] text-[#cfdfc7] border border-[#2f4d2b] px-3.5 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCarregando ? 'animate-spin' : ''}`} />
                <span>TESTAR CONEXÃO</span>
              </button>

              {jaConfigurado && (
                <button
                  type="button"
                  onClick={handleLimparCredenciais}
                  className="bg-[#1a1414] hover:bg-[#2b1818] text-red-300 border border-red-900/60 px-3 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  title="Limpa as credenciais salvas no navegador"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>LIMPAR</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isCarregando}
                onClick={handleEnviarTudo}
                className="bg-[#182417] hover:bg-[#233521] text-[#9bb88d] border border-[#2d4529] px-3 py-2 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Envia todo o estoque, militares e histórico de cautelas para o Supabase"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <span>ENVIAR TUDO (PUSH)</span>
              </button>

              <button
                type="button"
                disabled={isCarregando}
                onClick={handlePuxarTudo}
                className="bg-[#182417] hover:bg-[#233521] text-[#9bb88d] border border-[#2d4529] px-3 py-2 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Puxa os dados salvos na nuvem do Supabase para o navegador"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>PUXAR NUVEM (PULL)</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Monitor de Tabelas do Supabase */}
      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
            <Table className="w-4 h-4 text-[#86efac]" />
            STATUS DAS 5 TABELAS REQUERIDAS NO SUPABASE
          </h4>
          <span className="text-[10px] text-[#7a8c7b]">
            Verificação em tempo real via REST API
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {tabelasObrigatorias.map((tab) => (
            <div
              key={tab.nome}
              className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                tab.existe === true
                  ? 'bg-[#132014] border-[#2e542d] text-[#86efac]'
                  : tab.existe === false
                  ? 'bg-red-950/40 border-red-900/60 text-red-300'
                  : 'bg-[#0c110d] border-[#1f281e] text-[#7a8c7b]'
              }`}
            >
              <div>
                <span className="font-bold block text-[11px] uppercase">
                  {tab.nome}
                </span>
                <span className="text-[10px] opacity-75">{tab.rotulo}</span>
              </div>
              <div>
                {tab.existe === true ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#86efac] bg-[#1a2d1a] px-2 py-0.5 rounded border border-[#3e6838]">
                    <CheckCircle2 className="w-3 h-3" /> PRONTA
                  </span>
                ) : tab.existe === false ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                    <AlertCircle className="w-3 h-3" /> CRIAR DDL
                  </span>
                ) : (
                  <span className="text-[10px] text-[#7a8c7b]">Pendente</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção do Script DDL e Instruções de Instalação */}
      <div className="bg-[#101610] border-2 border-[#2b592f] p-5 rounded-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232f22] pb-3">
          <div>
            <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#86efac]" />
              SCRIPT DDL SQL OFICIAL PARA O SUPABASE
            </h4>
            <p className="text-[11px] text-[#9eb29b] mt-1 leading-relaxed">
              Cria automaticamente as tabelas <code>militares_servico</code>, <code>armeiros</code>, <code>estoque</code>, <code>retiradas</code> e <code>auditoria_logs</code> com chaves primárias textuais e permissões liberadas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopiarScript}
            className="bg-[#243d22] hover:bg-[#325730] text-[#86efac] border border-[#3e743a] px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-2 cursor-pointer shadow-md flex-shrink-0 transition-colors"
          >
            {copiado ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? 'SCRIPT COPIADO COM SUCESSO!' : 'COPIAR SCRIPT DDL SQL'}</span>
          </button>
        </div>

        {/* Passo a Passo */}
        <div className="bg-[#0b100c] border border-[#1e2a1b] p-3.5 rounded text-xs space-y-2">
          <span className="font-bold text-[#86efac] block uppercase tracking-wide">
            COMO EXECUTAR NO SEU PAINEL SUPABASE (30 SEGUNDOS):
          </span>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#c2d6bf] leading-relaxed">
            <li>
              Clique no botão verde acima <strong>"COPIAR SCRIPT DDL SQL"</strong>.
            </li>
            <li>
              Acesse o painel do seu projeto no site do Supabase (ex:{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[#86efac] underline hover:text-white"
              >
                https://supabase.com/dashboard
              </a>
              ).
            </li>
            <li>
              No menu lateral esquerdo, clique no ícone do <strong>SQL Editor</strong>.
            </li>
            <li>
              Clique no botão <strong>+ New query</strong>.
            </li>
            <li>
              Cole o script copiado no editor e clique no botão verde <strong>Run</strong> (ou aperte Ctrl+Enter).
            </li>
            <li>
              Volte a esta página e clique em <strong>SALVAR CREDENCIAIS E TESTAR</strong>!
            </li>
          </ol>
        </div>

        {/* Alerta de Tradução Automática do Navegador */}
        <div className="bg-[#1c1809] border border-[#6b5816] p-3.5 rounded text-xs text-[#fed7aa] space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#fde047] uppercase">
            <AlertCircle className="w-4 h-4 text-[#fde047] flex-shrink-0" />
            <span>ATENÇÃO: DESATIVE A TRADUÇÃO AUTOMÁTICA DO GOOGLE CHROME NO SUPABASE</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#fef08a]/90">
            Se o painel do Supabase travar com o erro <em>"Falhou ao executar 'removeChild' em 'Node'"</em>, isso ocorre porque o <strong>Google Tradutor / Chrome Translate</strong> altera os textos da interface interna do Supabase (que usa React).
          </p>
          <div className="bg-[#121006] p-2 rounded text-[11px] space-y-1 text-[#fef9c3]">
            <p className="font-bold text-white">Como resolver em 5 segundos:</p>
            <p>1. Na barra de endereço do navegador no Supabase, clique no ícone do <strong>Google Tradutor</strong>.</p>
            <p>2. Selecione <strong>"Inglês"</strong> (idioma original) ou marque <strong>"Nunca traduzir este site"</strong>.</p>
            <p>3. Pressione <strong>F5</strong> (Recarregar). Ou abra o Supabase em uma <strong>Janela Anônima (Ctrl + Shift + N)</strong>.</p>
          </div>
        </div>

        {/* Visualizador de Script Expansível */}
        <div>
          <button
            type="button"
            onClick={() => setMostrarScript(!mostrarScript)}
            className="flex items-center gap-1.5 text-xs text-[#86efac] hover:text-white font-bold uppercase cursor-pointer"
          >
            {mostrarScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{mostrarScript ? 'Ocultar Código SQL' : 'Visualizar Código SQL Completo'}</span>
          </button>

          {mostrarScript && (
            <div className="mt-2 relative">
              <pre className="bg-[#070a08] border border-[#232f22] p-4 rounded text-[11px] text-[#a8cca2] font-mono overflow-x-auto max-h-80 select-all leading-relaxed">
                {SCRIPT_SQL_SUPABASE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
