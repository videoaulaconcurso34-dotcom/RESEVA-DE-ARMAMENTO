import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Shield,
  FileCode2,
} from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import {
  carregarConfigSupabase,
  salvarConfigSupabase,
  testarConexaoSupabase,
  sincronizarDadosComSupabase,
  puxarDadosDoSupabase,
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
  const [isCarregando, setIsCarregando] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfigSupabase({
      url: supabaseUrl.trim(),
      anonKey: anonKey.trim(),
      autoSync: config.autoSync,
    });
    setConfig(carregarConfigSupabase());
    setStatusMsg({
      tipo: 'sucesso',
      texto: 'Credenciais do Supabase salvas localmente com sucesso.',
    });
  };

  const handleTestar = async () => {
    setIsCarregando(true);
    setStatusMsg(null);
    try {
      const res = await testarConexaoSupabase({
        url: supabaseUrl.trim(),
        anonKey: anonKey.trim(),
      });
      if (res.sucesso) {
        setStatusMsg({
          tipo: 'sucesso',
          texto: res.mensagem,
        });
      } else {
        setStatusMsg({
          tipo: 'erro',
          texto: res.mensagem,
        });
      }
    } catch (e: any) {
      setStatusMsg({
        tipo: 'erro',
        texto: e.message || 'Erro ao conectar.',
      });
    } finally {
      setIsCarregando(false);
    }
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

  return (
    <div className="space-y-6 font-mono max-w-4xl">
      <HeaderBar title="INTEGRAÇÃO SUPABASE (POSTGRESQL)" />

      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#142313] border border-[#2b592f] rounded text-[#86efac]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                BANCO DE DADOS EM NUVEM (SUPABASE / POSTGRESQL)
              </h3>
              <p className="text-xs text-[#7a8c7b] mt-1 leading-relaxed">
                O SISRESERVA opera em modo híbrido (Offline-First). O banco de dados Supabase permite persistência relacional permanente com sincronização bidirecional via API REST nativa.
              </p>
            </div>
          </div>

          {onAbrirDocumentacao && (
            <button
              onClick={onAbrirDocumentacao}
              className="text-[11px] bg-[#1a2618] border border-[#2d422a] text-[#86efac] px-3 py-1.5 rounded font-bold uppercase flex items-center gap-1.5 hover:bg-[#253723] cursor-pointer flex-shrink-0"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>DDL / SCHEMA SQL</span>
            </button>
          )}
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded border text-xs flex items-center gap-2 ${
              statusMsg.tipo === 'sucesso'
                ? 'bg-[#142313] border-[#2b592f] text-[#86efac]'
                : 'bg-red-950/50 border-red-800 text-red-300'
            }`}
          >
            {statusMsg.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMsg.texto}</span>
          </div>
        )}

        <form onSubmit={handleSalvar} className="space-y-4 text-xs pt-2">
          <div>
            <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
              Supabase Project URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
              Supabase Anon / Public API Key *
            </label>
            <input
              type="password"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#425439]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1f281e]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isCarregando}
                onClick={handleTestar}
                className="bg-[#1b2619] hover:bg-[#253623] text-[#86efac] border border-[#2f4d2b] px-3.5 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCarregando ? 'animate-spin' : ''}`} />
                <span>TESTAR CONEXÃO</span>
              </button>

              <button
                type="submit"
                className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SALVAR CREDENCIAIS</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isCarregando}
                onClick={handleEnviarTudo}
                className="bg-[#182417] hover:bg-[#233521] text-[#9bb88d] border border-[#2d4529] px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Envia todo o estoque, militares e histórico de cautelas para o Supabase"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <span>ENVIAR TUDO (PUSH)</span>
              </button>

              <button
                type="button"
                disabled={isCarregando}
                onClick={handlePuxarTudo}
                className="bg-[#182417] hover:bg-[#233521] text-[#9bb88d] border border-[#2d4529] px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Puxa os dados salvos na nuvem do Supabase para o navegador"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>PUXAR NUVEM (PULL)</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-3 text-xs">
        <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#86efac]" />
          TABELAS REQUERIDAS NO SUPABASE
        </h4>
        <p className="text-[11px] text-[#7a8c7b] leading-relaxed">
          Certifique-se de executar o script DDL SQL no menu <strong>SQL Editor</strong> do painel do seu projeto Supabase para criar as tabelas: <code>militares_servico</code>, <code>armeiros</code>, <code>estoque</code>, <code>retiradas</code> e <code>auditoria_logs</code>.
        </p>
      </div>
    </div>
  );
};
