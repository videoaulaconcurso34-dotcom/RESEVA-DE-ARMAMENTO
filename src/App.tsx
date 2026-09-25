import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  Shield,
  Bell,
  RefreshCw,
} from 'lucide-react';
import {
  MilitarServico,
  MilitarReserva,
  ItemEstoque,
  Retirada,
  RegistroAuditoria,
  SessaoUsuario,
} from './types';
import { db } from './services/db';
import { dispararAutoSyncSupabase } from './services/supabase';

// Components
import { Sidebar } from './components/Sidebar';
import { TelaLogin } from './components/TelaLogin';
import { ArmasNaRuaPanel } from './components/ArmasNaRuaPanel';
import { NovaRetiradaWizard } from './components/NovaRetiradaWizard';
import { DevolucaoModal } from './components/DevolucaoModal';
import { EstoqueReserva } from './components/EstoqueReserva';
import { MilitaresGerenciamento } from './components/MilitaresGerenciamento';
import { AuditoriaLogs } from './components/AuditoriaLogs';
import { GoogleSheetsIntegration } from './components/GoogleSheetsIntegration';
import { SupabaseIntegration } from './components/SupabaseIntegration';
import { DocumentacaoTecnicaModal } from './components/DocumentacaoTecnicaModal';
import { TermoCautelaModal } from './components/TermoCautelaModal';

export default function App() {
  // Estado local sincronizado com DatabaseService
  const [militares, setMilitares] = useState<MilitarServico[]>(() => db.getMilitares());
  const [armeiros, setArmeiros] = useState<MilitarReserva[]>(() => db.getArmeiros());
  const [estoque, setEstoque] = useState<ItemEstoque[]>(() => db.getEstoque());
  const [retiradas, setRetiradas] = useState<Retirada[]>(() => db.getRetiradas());
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>(() => db.getAuditoria());

  // Inscrição reativa para atualizações do banco de dados local
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setMilitares(db.getMilitares());
      setArmeiros(db.getArmeiros());
      setEstoque(db.getEstoque());
      setRetiradas(db.getRetiradas());
      setAuditoria(db.getAuditoria());
    });
    return () => unsubscribe();
  }, []);

  // Sessão de autenticação do usuário
  const [sessaoUsuario, setSessaoUsuario] = useState<SessaoUsuario | null>(() => {
    try {
      const salva = localStorage.getItem('sisarm_sessao_usuario');
      if (salva) {
        return JSON.parse(salva);
      }
    } catch {
      // Ignora erro de parse
    }
    // Armeiro padrão ativo na primeira inicialização
    const armeiroPadrao = db.getArmeiros()[0];
    if (armeiroPadrao) {
      return {
        tipo: 'ARMEIRO',
        id: armeiroPadrao.id,
        nome: armeiroPadrao.nome,
        nomeGuerra: armeiroPadrao.nomeGuerra,
        patente: armeiroPadrao.patente,
        matricula: armeiroPadrao.matricula,
        armeiroId: armeiroPadrao.id,
      };
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('armas-na-rua');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modais globais
  const [docTecnicaOpen, setDocTecnicaOpen] = useState(false);
  const [termoModalOpen, setTermoModalOpen] = useState(false);
  const [retiradaTermoSelecionada, setRetiradaTermoSelecionada] = useState<Retirada | null>(null);
  const [devolucaoPreSelecionadaId, setDevolucaoPreSelecionadaId] = useState<string | null>(null);

  // Salva sessão no localStorage
  const handleLoginSucesso = (sessao: SessaoUsuario) => {
    setSessaoUsuario(sessao);
    localStorage.setItem('sisarm_sessao_usuario', JSON.stringify(sessao));
    if (sessao.tipo === 'MILITAR') {
      setActiveTab('nova-retirada');
    } else {
      setActiveTab('armas-na-rua');
    }
  };

  const handleLogout = () => {
    setSessaoUsuario(null);
    localStorage.removeItem('sisarm_sessao_usuario');
  };

  // Armeiro ativo derivado da sessão
  const armeiroAtivo = useMemo(() => {
    if (sessaoUsuario?.tipo === 'ARMEIRO') {
      return armeiros.find((a) => a.id === sessaoUsuario.armeiroId) || armeiros[0] || null;
    }
    return armeiros[0] || null;
  }, [sessaoUsuario, armeiros]);

  // Retiradas em aberto (Na rua / empenhadas)
  const retiradasNaRua = useMemo(() => {
    return retiradas.filter(
      (r) =>
        r.status === 'EM SERVIÇO' ||
        r.status === 'MISSÃO' ||
        r.status === 'CAUTELADO' ||
        r.status === 'SEPARANDO'
    );
  }, [retiradas]);

  // Contagem de cautelas atrasadas
  const atrasosCount = useMemo(() => {
    const agora = Date.now();
    return retiradasNaRua.filter((r) => {
      if (!r.dataDevolucaoPrevista) return false;
      return new Date(r.dataDevolucaoPrevista).getTime() < agora;
    }).length;
  }, [retiradasNaRua]);

  // Contagem de pedidos aguardando liberação do armeiro
  const pedidosEmEsperaCount = useMemo(() => {
    return retiradas.filter((r) => r.status === 'EM ESPERA').length;
  }, [retiradas]);

  const handleOpenDevolucao = (retiradaId: string) => {
    setDevolucaoPreSelecionadaId(retiradaId);
    setActiveTab('devolucao');
  };

  const handleVisualizarTermo = (ret: Retirada) => {
    setRetiradaTermoSelecionada(ret);
    setTermoModalOpen(true);
  };

  // Se não estiver logado, exibe tela de autenticação
  if (!sessaoUsuario) {
    return (
      <TelaLogin
        militares={militares}
        armeiros={armeiros}
        onLoginSucesso={handleLoginSucesso}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070a08] text-[#e2e8e2] font-mono flex flex-col md:flex-row antialiased select-text">
      {/* Barra Superior Mobile */}
      <header className="md:hidden bg-[#0d120e] border-b border-[#1f281e] p-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#7eb864]" />
          <div>
            <span className="font-bold text-xs uppercase text-white tracking-wider block">
              SISRESERVA
            </span>
            <span className="text-[9px] text-[#7a8c7b] block uppercase">
              {sessaoUsuario.tipo === 'MILITAR' ? 'POLICIAL' : 'ARMORIAL'} • {sessaoUsuario.nomeGuerra}
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded border border-[#232f22] bg-[#121812] text-[#cfdfc7] cursor-pointer"
          title="Menu de navegação"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
          <div className="w-64 bg-[#0d120e] h-full shadow-2xl overflow-y-auto">
            <div className="p-3 border-b border-[#1f281e] flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-white">MENU DO SISTEMA</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#7a8c7b] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(t) => {
                setActiveTab(t);
                setMobileMenuOpen(false);
              }}
              itensNaRuaCount={retiradasNaRua.length}
              atrasosCount={atrasosCount}
              armeiros={armeiros}
              armeiroAtivo={armeiroAtivo}
              sessaoUsuario={sessaoUsuario}
              setArmeiroAtivo={() => {}}
              onOpenDocTecnica={() => {
                setDocTecnicaOpen(true);
                setMobileMenuOpen(false);
              }}
              onLogout={handleLogout}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          itensNaRuaCount={retiradasNaRua.length}
          atrasosCount={atrasosCount}
          armeiros={armeiros}
          armeiroAtivo={armeiroAtivo}
          sessaoUsuario={sessaoUsuario}
          setArmeiroAtivo={() => {}}
          onOpenDocTecnica={() => setDocTecnicaOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Notificação de Pedidos em Espera para o Armeiro */}
        {sessaoUsuario.tipo === 'ARMEIRO' && pedidosEmEsperaCount > 0 && activeTab !== 'armas-na-rua' && (
          <div
            onClick={() => setActiveTab('armas-na-rua')}
            className="mb-4 p-3 bg-[#1e2a18] border border-[#3e6632] rounded text-xs text-[#9bd48e] flex items-center justify-between cursor-pointer hover:bg-[#253620] transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7eb864] animate-bounce" />
              <span>
                <strong>{pedidosEmEsperaCount} SOLICITAÇÃO(ÕES) EM ESPERA NO BALCÃO:</strong> Policiais aguardam conferência e liberação de armamento.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase bg-[#142614] border border-[#2a4d29] px-2 py-0.5 rounded text-white">
              VER NO PAINEL →
            </span>
          </div>
        )}

        {/* Renderização das Telas */}
        {activeTab === 'armas-na-rua' && (
          <ArmasNaRuaPanel
            retiradasNaRua={retiradasNaRua}
            todasRetiradas={retiradas}
            estoque={estoque}
            armeiroAtivo={armeiroAtivo}
            onAtualizar={() => db.recarregar()}
            onOpenDevolucao={handleOpenDevolucao}
            onVisualizarTermo={handleVisualizarTermo}
            onOpenNovaCautela={() => setActiveTab('nova-retirada')}
          />
        )}

        {activeTab === 'nova-retirada' && (
          <NovaRetiradaWizard
            militares={militares}
            armeiros={armeiros}
            estoque={estoque}
            armeiroPadrao={armeiroAtivo}
            sessaoUsuario={sessaoUsuario}
            onSucesso={(ret) => {
              if (sessaoUsuario.tipo === 'MILITAR') {
                // Notificação exibida no próprio wizard
              } else {
                handleVisualizarTermo(ret);
                setActiveTab('armas-na-rua');
              }
            }}
            onVisualizarTermo={handleVisualizarTermo}
            onCancelar={() => setActiveTab('armas-na-rua')}
          />
        )}

        {activeTab === 'devolucao' && (
          <DevolucaoModal
            retiradasNaRua={retiradasNaRua}
            armeiros={armeiros}
            armeiroPadrao={armeiroAtivo}
            retiradaPreSelecionadaId={devolucaoPreSelecionadaId}
            onSucesso={() => {
              setDevolucaoPreSelecionadaId(null);
              setActiveTab('armas-na-rua');
            }}
            onClose={() => setActiveTab('armas-na-rua')}
          />
        )}

        {activeTab === 'estoque' && (
          <EstoqueReserva
            estoque={estoque}
            retiradas={retiradas}
            armeiroAtivo={armeiroAtivo}
            militares={militares}
            armeiros={armeiros}
            onAtualizar={() => db.recarregar()}
          />
        )}

        {activeTab === 'militares' && (
          <MilitaresGerenciamento
            militares={militares}
            armeiros={armeiros}
            armeiroAtivo={armeiroAtivo}
            sessaoUsuario={sessaoUsuario}
            onAtualizar={() => db.recarregar()}
          />
        )}

        {activeTab === 'historico' && (
          <AuditoriaLogs logs={auditoria} />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsIntegration />
        )}

        {activeTab === 'supabase' && (
          <SupabaseIntegration
            onSincronizacaoConcluida={() => db.recarregar()}
            onAbrirDocumentacao={() => setDocTecnicaOpen(true)}
          />
        )}
      </main>

      {/* Modais Globais */}
      <DocumentacaoTecnicaModal
        isOpen={docTecnicaOpen}
        onClose={() => setDocTecnicaOpen(false)}
      />

      <TermoCautelaModal
        retirada={retiradaTermoSelecionada}
        isOpen={termoModalOpen}
        onClose={() => {
          setTermoModalOpen(false);
          setRetiradaTermoSelecionada(null);
        }}
      />
    </div>
  );
}
