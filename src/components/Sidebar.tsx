import React from 'react';
import {
  LogOut,
  Code2,
  Shield,
} from 'lucide-react';
import { MilitarReserva, SessaoUsuario } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  itensNaRuaCount: number;
  atrasosCount: number;
  armeiros: MilitarReserva[];
  armeiroAtivo: MilitarReserva | null;
  sessaoUsuario?: SessaoUsuario | null;
  setArmeiroAtivo: (armeiro: MilitarReserva) => void;
  onOpenDocTecnica: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  itensNaRuaCount,
  armeiroAtivo,
  sessaoUsuario,
  onOpenDocTecnica,
  onLogout,
}) => {
  const isResponsavel = Boolean(
    sessaoUsuario?.isResponsavelSetor ||
    sessaoUsuario?.isAdmin ||
    sessaoUsuario?.nomeGuerra?.toUpperCase().includes('VENTURA') ||
    sessaoUsuario?.nome?.toUpperCase().includes('VENTURA') ||
    (armeiroAtivo && (
      armeiroAtivo.nomeGuerra?.toUpperCase().includes('VENTURA') ||
      armeiroAtivo.nome?.toUpperCase().includes('VENTURA') ||
      armeiroAtivo.funcao === 'Responsável pelo Setor'
    ))
  );

  const isMilitar = sessaoUsuario?.tipo === 'MILITAR' && !isResponsavel;

  const todosNavItems = [
    {
      id: 'armas-na-rua',
      label: 'PAINEL — MATERIAL EMPENHADO',
      badge: itensNaRuaCount > 0 ? String(itensNaRuaCount) : undefined,
      badgeColor: 'bg-[#537346]',
      icon: (
        <span className="inline-block w-2.5 h-2.5 border border-current mr-1.5 opacity-80" />
      ),
      apenasArmeiro: true,
    },
    {
      id: 'nova-retirada',
      label: isMilitar ? 'SOLICITAR CAUTELA' : 'NOVA RETIRADA',
      icon: <span className="font-mono font-bold mr-1.5 text-xs">+</span>,
      apenasArmeiro: false,
    },
    {
      id: 'devolucao',
      label: 'DEVOLUÇÃO',
      icon: <span className="font-mono mr-1.5 text-xs">↩</span>,
      apenasArmeiro: true,
    },
    {
      id: 'estoque',
      label: 'ESTOQUE',
      icon: <span className="font-mono mr-1.5 text-xs">≡</span>,
      apenasArmeiro: true,
    },
    {
      id: 'militares',
      label: 'EFETIVO & ARMEIROS',
      icon: <span className="font-mono mr-1.5 text-xs">👥</span>,
      apenasArmeiro: true,
    },
    {
      id: 'historico',
      label: 'HISTÓRICO',
      icon: <span className="font-mono mr-1.5 text-xs">=</span>,
      apenasArmeiro: true,
    },
    {
      id: 'sheets',
      label: 'GOOGLE SHEETS',
      badge: 'SYNC',
      badgeColor: 'bg-emerald-800 text-emerald-200',
      icon: <span className="font-mono mr-1.5 text-xs">📊</span>,
      apenasArmeiro: true,
    },
    {
      id: 'supabase',
      label: 'SUPABASE CLOUD',
      badge: 'SQL',
      badgeColor: 'bg-emerald-700 text-white',
      icon: <span className="font-mono mr-1.5 text-xs">⚡</span>,
      apenasArmeiro: true,
    },
  ];

  const navItems = isMilitar
    ? todosNavItems.filter((item) => !item.apenasArmeiro)
    : todosNavItems;

  return (
    <aside className="w-56 sm:w-60 bg-[#0d120e] border-r border-[#1f281e] flex flex-col justify-between h-screen sticky top-0 font-mono select-none flex-shrink-0 z-30">
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-[#1f281e]">
          <div
            onClick={() => {
              if (!isMilitar) setActiveTab('armas-na-rua');
            }}
            className={isMilitar ? '' : 'cursor-pointer'}
          >
            <h1 className="font-bold text-sm tracking-wider text-[#e2e8e2] uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#7eb864]" />
              <span>SISRESERVA</span>
            </h1>
            <p className="text-[9px] text-[#7a8c7b] tracking-widest uppercase mt-0.5">
              {isResponsavel
                ? 'RESPONSÁVEL DO SETOR • TOTAL ACESSO'
                : isMilitar
                ? 'PORTAL DO POLICIAL (RESTRITO)'
                : 'RESERVA DE ARMAMENTO'}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {isMilitar && (
            <div className="px-2 py-1.5 mb-2 bg-[#1b2219] border border-[#2b3a27] rounded text-[10px] text-[#9eb599]">
              ACESSO RESTRITO: Permissão exclusiva para Solicitação de Cautela de armamento.
            </div>
          )}

          {isResponsavel && (
            <div className="px-2 py-1 mb-1.5 bg-[#1f2819] border border-[#4d6639] rounded text-[9px] text-[#bbf7d0] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              <span>SUPER-ADMINISTRADOR (VENTURA)</span>
            </div>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-[#182218] text-[#9bb88d] border border-[#2f3f2e] font-bold shadow-sm'
                    : 'text-[#8d9f8e] hover:text-[#e2e8e2] hover:bg-[#131913] border border-transparent'
                }`}
              >
                <div className="flex items-center truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {!isMilitar && (
            <div className="pt-2 border-t border-[#1f281e] mt-2">
              <button
                onClick={onOpenDocTecnica}
                className="w-full text-left px-3 py-2 rounded text-xs text-[#7a8c7b] hover:text-[#9bb88d] hover:bg-[#131913] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>PARECER TÉCNICO & SQL</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Profile Box: Active Armeiro / Militar & Logout */}
      <div className="p-3 border-t border-[#1f281e] bg-[#0c120e] text-xs font-mono">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#7a8c7b] uppercase font-bold tracking-wider">
            {isResponsavel
              ? 'RESPONSÁVEL DO SETOR'
              : isMilitar
              ? 'MILITAR AUTENTICADO'
              : 'ARMEIRO DE PLANTÃO'}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] text-[#7eb864] bg-[#162718] px-1.5 py-0.5 rounded border border-[#2b4429] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52b339] animate-pulse" />
            {isResponsavel ? 'SUPER-ADMIN' : 'ONLINE'}
          </span>
        </div>

        <div className="bg-[#121a13] p-2 rounded border border-[#223321] mb-2.5">
          <div className="text-white font-bold text-xs uppercase truncate">
            {sessaoUsuario?.nomeExibicao ||
              (armeiroAtivo ? `${armeiroAtivo.patente} ${armeiroAtivo.nomeGuerra}` : 'NENHUM')}
          </div>
          <div className="text-[10px] text-[#86efac] font-bold uppercase mt-0.5 truncate">
            {isResponsavel
              ? '★ CHEFE DO SETOR / ADMINISTRADOR'
              : sessaoUsuario?.graduacao || (armeiroAtivo ? armeiroAtivo.funcao : '')}
          </div>
        </div>

        {/* Botão de SAIR / DESCONECTAR */}
        <button
          onClick={onLogout}
          title="Encerrar sessão atual e retornar à tela de login"
          className="w-full flex items-center justify-center gap-2 py-2 px-2.5 bg-[#261515] hover:bg-[#381c1c] border border-[#592a2a] hover:border-[#823a3a] text-[#fca5a5] hover:text-white font-bold text-[11px] rounded transition-all shadow cursor-pointer uppercase"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span>{isMilitar ? 'DESCONECTAR POLICIAL' : 'PASSAR PLANTÃO / SAIR'}</span>
        </button>
      </div>
    </aside>
  );
};
