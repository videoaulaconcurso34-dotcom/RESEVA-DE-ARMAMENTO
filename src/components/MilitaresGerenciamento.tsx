import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MilitarServico, MilitarReserva, SessaoUsuario } from '../types';
import { db } from '../services/db';
import { HeaderBar } from './HeaderBar';
import { PATENTES_PM } from '../data/catalogoMaterial';
import { BATALHOES_PM } from '../data/unidadesPM';

interface MilitaresGerenciamentoProps {
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  armeiroAtivo?: MilitarReserva | null;
  sessaoUsuario?: SessaoUsuario | null;
  onAtualizar: () => void;
}

export const MilitaresGerenciamento: React.FC<MilitaresGerenciamentoProps> = ({
  militares,
  armeiros,
  armeiroAtivo,
  sessaoUsuario,
  onAtualizar,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'SERVICO' | 'ARMEIROS'>('SERVICO');

  // Responsável do Setor (Ventura) ou Admin Geral
  const isResponsavelDirect = Boolean(
    sessaoUsuario?.isResponsavelSetor ||
    sessaoUsuario?.isAdmin ||
    sessaoUsuario?.nomeGuerra?.toUpperCase().includes('VENTURA') ||
    sessaoUsuario?.nome?.toUpperCase().includes('VENTURA') ||
    armeiroAtivo?.nomeGuerra?.toUpperCase().includes('VENTURA') ||
    armeiroAtivo?.nome?.toUpperCase().includes('VENTURA') ||
    armeiroAtivo?.funcao === 'Responsável pelo Setor'
  );
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const isAdmin = isResponsavelDirect || adminAutenticado;

  // Visualização de senhas (exclusiva para o Responsável pelo Setor)
  const [mostrarTodasSenhas, setMostrarTodasSenhas] = useState(false);
  const [senhasReveladasMilitar, setSenhasReveladasMilitar] = useState<Record<string, boolean>>({});
  const [senhasReveladasArmeiro, setSenhasReveladasArmeiro] = useState<Record<string, boolean>>({});

  const toggleVerSenhaMilitar = (id: string) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    setSenhasReveladasMilitar((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleVerSenhaArmeiro = (id: string) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    setSenhasReveladasArmeiro((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [modalAdminAuthOpen, setModalAdminAuthOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const [modalMilitarOpen, setModalMilitarOpen] = useState(false);
  const [militarEmEdicao, setMilitarEmEdicao] = useState<MilitarServico | null>(null);

  const [formNome, setFormNome] = useState('');
  const [formNomeGuerra, setFormNomeGuerra] = useState('');
  const [formPatente, setFormPatente] = useState(PATENTES_PM[6] || 'Cb PM');
  const [formMatricula, setFormMatricula] = useState('');
  const [formBatalhao, setFormBatalhao] = useState(BATALHOES_PM[0]?.sigla || '1º BPM/M');
  const [formCia, setFormCia] = useState('1ª Cia');
  const [formPelotao, setFormPelotao] = useState('1º Pelotão');
  const [formStatus, setFormStatus] = useState<'ATIVO' | 'FÉRIAS' | 'LICENÇA' | 'AFASTADO'>('ATIVO');
  const [formNovaSenha, setFormNovaSenha] = useState('');
  const [mostrarFormSenha, setMostrarFormSenha] = useState(false);

  const [modalArmeiroOpen, setModalArmeiroOpen] = useState(false);
  const [armeiroEmEdicao, setArmeiroEmEdicao] = useState<MilitarReserva | null>(null);
  const [formArmNome, setFormArmNome] = useState('');
  const [formArmNomeGuerra, setFormArmNomeGuerra] = useState('');
  const [formArmPatente, setFormArmPatente] = useState('3º Sgt PM');
  const [formArmMatricula, setFormArmMatricula] = useState('');
  const [formArmFuncao, setFormArmFuncao] = useState<any>('Armeiro Auxiliar');
  const [formArmSenha, setFormArmSenha] = useState('');
  const [mostrarFormArmSenha, setMostrarFormArmSenha] = useState(false);

  const [modalSenhaOpen, setModalSenhaOpen] = useState(false);
  const [militarRedefinirSenha, setMilitarRedefinirSenha] = useState<MilitarServico | null>(null);
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState(false);

  const handleAutenticarAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const valido = db.validarSenhaResponsavel(adminPinInput);

    if (valido) {
      setAdminAutenticado(true);
      setModalAdminAuthOpen(false);
      setAdminPinInput('');
      setAdminPinError('');
    } else {
      setAdminPinError('Senha incorreta! Permissão restrita exclusivamente ao Responsável pelo Setor (VENTURA).');
    }
  };

  const handleAbrirCriarMilitar = () => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    setMilitarEmEdicao(null);
    setFormNome('');
    setFormNomeGuerra('');
    setFormPatente(PATENTES_PM[6] || 'Cb PM');
    setFormMatricula('');
    setFormBatalhao(BATALHOES_PM[0]?.sigla || '1º BPM/M');
    setFormCia('1ª Cia');
    setFormPelotao('1º Pelotão');
    setFormStatus('ATIVO');
    setFormNovaSenha('1234');
    setModalMilitarOpen(true);
  };

  const handleAbrirEditarMilitar = (m: MilitarServico) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    setMilitarEmEdicao(m);
    setFormNome(m.nome);
    setFormNomeGuerra(m.nomeGuerra);
    setFormPatente(m.patente);
    setFormMatricula(m.matricula);
    setFormBatalhao(m.batalhao);
    setFormCia(m.companhia || '1ª Cia');
    setFormPelotao(m.pelotao || '1º Pelotão');
    setFormStatus((m.status as any) || (m.ativo ? 'ATIVO' : 'AFASTADO'));
    setFormNovaSenha('');
    setModalMilitarOpen(true);
  };

  const handleSalvarMilitar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Permissão restrita exclusivamente ao Responsável pelo Setor.');
      return;
    }
    if (!formNome.trim() || !formNomeGuerra.trim() || !formMatricula.trim()) {
      alert('Preencha os campos obrigatórios (Nome, Nome de Guerra e RE/Matrícula).');
      return;
    }

    if (militarEmEdicao) {
      db.atualizarMilitar(militarEmEdicao.id, {
        nome: formNome.trim(),
        nomeGuerra: formNomeGuerra.trim().toUpperCase(),
        patente: formPatente as any,
        matricula: formMatricula.trim(),
        batalhao: formBatalhao,
        companhia: formCia,
        pelotao: formPelotao,
        status: formStatus,
        ...(formNovaSenha ? { senhaHash: formNovaSenha } : {}),
      });
    } else {
      db.adicionarMilitar({
        nome: formNome.trim(),
        nomeGuerra: formNomeGuerra.trim().toUpperCase(),
        patente: formPatente as any,
        matricula: formMatricula.trim(),
        batalhao: formBatalhao,
        companhia: formCia,
        pelotao: formPelotao,
        status: formStatus,
        senhaHash: formNovaSenha || '1234',
        ativo: formStatus === 'ATIVO',
      });
    }

    setModalMilitarOpen(false);
    onAtualizar();
  };

  const handleExcluirMilitar = (m: MilitarServico) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    if (confirm(`Deseja realmente desativar/excluir o cadastro de ${m.patente} ${m.nomeGuerra}?`)) {
      try {
        db.excluirMilitar(m.id);
        onAtualizar();
      } catch (e: any) {
        alert(e.message || 'Erro ao excluir militar.');
      }
    }
  };

  const handleAbrirRedefinirSenha = (m: MilitarServico) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    setMilitarRedefinirSenha(m);
    setNovaSenhaInput('1234');
    setSucessoSenha(false);
    setModalSenhaOpen(true);
  };

  const handleConfirmarRedefinicaoSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!militarRedefinirSenha || !novaSenhaInput) return;
    db.atualizarMilitar(militarRedefinirSenha.id, {
      senhaHash: novaSenhaInput,
    });
    setSucessoSenha(true);
    setTimeout(() => {
      setModalSenhaOpen(false);
      onAtualizar();
    }, 1200);
  };

  const handleSalvarArmeiro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Permissão restrita exclusivamente ao Responsável pelo Setor.');
      return;
    }
    if (!formArmNome.trim() || !formArmMatricula.trim()) {
      alert('Preencha os campos obrigatórios do armeiro.');
      return;
    }

    if (armeiroEmEdicao) {
      db.atualizarArmeiro(armeiroEmEdicao.id, {
        nome: formArmNome.trim(),
        nomeGuerra: (formArmNomeGuerra.trim() || formArmNome.trim().split(' ')[0]).toUpperCase(),
        patente: formArmPatente as any,
        matricula: formArmMatricula.trim(),
        funcao: formArmFuncao as any,
        ...(formArmSenha ? { senhaHash: formArmSenha } : {}),
      });
    } else {
      db.adicionarArmeiro({
        nome: formArmNome.trim(),
        nomeGuerra: (formArmNomeGuerra.trim() || formArmNome.trim().split(' ')[0]).toUpperCase(),
        patente: formArmPatente as any,
        matricula: formArmMatricula.trim(),
        funcao: formArmFuncao as any,
        senhaHash: formArmSenha || 'admin',
        ativo: true,
      });
    }

    setModalArmeiroOpen(false);
    onAtualizar();
  };

  const filteredMilitares = militares.filter((m) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.nome.toLowerCase().includes(q) ||
      m.nomeGuerra.toLowerCase().includes(q) ||
      m.matricula.toLowerCase().includes(q) ||
      m.patente.toLowerCase().includes(q) ||
      m.batalhao.toLowerCase().includes(q)
    );
  });

  const filteredArmeiros = armeiros.filter((a) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.nome.toLowerCase().includes(q) ||
      a.nomeGuerra.toLowerCase().includes(q) ||
      a.matricula.toLowerCase().includes(q) ||
      a.funcao.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-mono">
      <HeaderBar title="EFETIVO POLICIAL & ARMEIROS" />

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#232f22] pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAbaAtiva('SERVICO')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
              abaAtiva === 'SERVICO'
                ? 'bg-[#1a2618] text-[#cfdfc7] border-b-2 border-[#7eb864]'
                : 'text-[#7a8c7b] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>MILITARES DE SERVIÇO ({militares.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('ARMEIROS')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
              abaAtiva === 'ARMEIROS'
                ? 'bg-[#1a2618] text-[#cfdfc7] border-b-2 border-[#7eb864]'
                : 'text-[#7a8c7b] hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ARMEIROS DE PLANTÃO ({armeiros.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin ? (
            <button
              onClick={() => {
                setAdminPinInput('');
                setAdminPinError('');
                setModalAdminAuthOpen(true);
              }}
              className="text-[11px] bg-[#221808] hover:bg-[#33240d] border border-[#6b4c19] text-[#fcd34d] px-2.5 py-1.5 rounded font-bold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Autenticar como Ventura para ter acesso total e ver senhas"
            >
              <Lock className="w-3.5 h-3.5 text-[#eab308]" />
              <span>DESBLOQUEAR (VENTURA)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#142313] border border-[#2b592f] text-[#86efac] px-2.5 py-1.5 rounded font-bold uppercase inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>ACESSO TOTAL: VENTURA</span>
              </span>
              <button
                onClick={() => setMostrarTodasSenhas(!mostrarTodasSenhas)}
                className="text-[10px] bg-[#1c291b] hover:bg-[#283d26] border border-[#3b5c36] text-[#bbf7d0] px-2.5 py-1.5 rounded font-bold uppercase inline-flex items-center gap-1 transition-colors cursor-pointer"
                title={mostrarTodasSenhas ? 'Ocultar senhas visíveis' : 'Revelar todas as senhas dos armeiros e militares'}
              >
                {mostrarTodasSenhas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{mostrarTodasSenhas ? 'OCULTAR SENHAS' : 'REVELAR TODAS AS SENHAS'}</span>
              </button>
            </div>
          )}

          {abaAtiva === 'SERVICO' ? (
            <button
              onClick={handleAbrirCriarMilitar}
              className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-3.5 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-[#eab308]" />}
              <span>+ CADASTRAR MILITAR</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (!isAdmin) {
                  setAdminPinInput('');
                  setAdminPinError('');
                  setModalAdminAuthOpen(true);
                  return;
                }
                setArmeiroEmEdicao(null);
                setFormArmNome('');
                setFormArmNomeGuerra('');
                setFormArmPatente('3º Sgt PM');
                setFormArmMatricula('');
                setFormArmFuncao('Armeiro Auxiliar');
                setFormArmSenha('admin');
                setModalArmeiroOpen(true);
              }}
              className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-3.5 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-[#eab308]" />}
              <span>+ CADASTRAR ARMEIRO</span>
            </button>
          )}
        </div>
      </div>

      {/* BANNER INFORMATIVO DE SEGURANÇA E PRIVACIDADE DE SENHAS */}
      {isAdmin ? (
        <div className="p-3 bg-[#111d13] border border-[#2d4d2b] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#bbf7d0]">
            <ShieldCheck className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
            <div>
              <strong className="uppercase">Acesso Administrativo Autorizado — Responsável do Setor (VENTURA)</strong>
              <span className="text-[#86efac] text-[11px] block sm:inline sm:ml-2">
                Você tem permissão total exclusiva para visualizar e redefinir as senhas de todos os armeiros e militares.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMostrarTodasSenhas(!mostrarTodasSenhas)}
            className="px-2.5 py-1 bg-[#1a2e1d] hover:bg-[#254229] border border-[#3f6d3c] text-white rounded text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            {mostrarTodasSenhas ? <EyeOff className="w-3 h-3 text-[#fca5a5]" /> : <Eye className="w-3 h-3 text-[#4ade80]" />}
            <span>{mostrarTodasSenhas ? 'Ocultar Senhas' : 'Exibir Todas as Senhas'}</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-[#18140c] border border-[#4d3817] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#fef08a]">
            <Lock className="w-4 h-4 text-[#facc15] flex-shrink-0" />
            <div>
              <strong className="uppercase">Controle de Senhas e Credenciais Restrito</strong>
              <span className="text-[#fde047] text-[11px] block sm:inline sm:ml-2">
                Apenas o Responsável do Setor (<strong>VENTURA</strong>) com sua senha individual tem autorização para visualizar as senhas de outros militares e armeiros.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdminPinInput('');
              setAdminPinError('');
              setModalAdminAuthOpen(true);
            }}
            className="px-3 py-1 bg-[#2f2310] hover:bg-[#453315] border border-[#78541e] text-[#fef08a] rounded text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Unlock className="w-3 h-3" />
            <span>Desbloquear com Senha do Ventura</span>
          </button>
        </div>
      )}

      {/* Busca */}
      <div className="relative w-full sm:w-80">
        <Search className="w-3.5 h-3.5 text-[#7a8c7b] absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar militar por nome, RE ou patente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 pl-8 py-1.5 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439]"
        />
      </div>

      {/* TABELA MILITARES DE SERVIÇO */}
      {abaAtiva === 'SERVICO' && (
        <div className="bg-[#101610] border border-[#232f22] rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#232f22] text-[#7a8c7b] bg-[#0c110d]">
                <th className="py-3 px-4 font-bold uppercase">PATENTE / NOME DE GUERRA</th>
                <th className="py-3 px-4 font-bold uppercase">NOME COMPLETO</th>
                <th className="py-3 px-4 font-bold uppercase">RE / MATRÍCULA</th>
                <th className="py-3 px-4 font-bold uppercase">UNIDADE / OPM</th>
                <th className="py-3 px-4 font-bold uppercase">STATUS</th>
                <th className="py-3 px-4 font-bold uppercase">SENHA / PIN (EXCLUSIVO VENTURA)</th>
                <th className="py-3 px-4 font-bold uppercase text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f281e]">
              {filteredMilitares.map((m) => (
                <tr key={m.id} className="hover:bg-[#131a12] transition-colors">
                  <td className="py-3 px-4 font-bold text-white uppercase">
                    {m.patente} {m.nomeGuerra}
                  </td>
                  <td className="py-3 px-4 text-[#cfdfc7]">{m.nome}</td>
                  <td className="py-3 px-4 text-[#8d9f8e] font-mono">#{m.matricula}</td>
                  <td className="py-3 px-4 text-[#7a8c7b]">
                    {m.batalhao} {m.companhia ? `• ${m.companhia}` : ''}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        (m.status || (m.ativo ? 'ATIVO' : 'AFASTADO')) === 'ATIVO'
                          ? 'bg-[#142313] border-[#2b592f] text-[#86efac]'
                          : 'bg-[#291e12] border-[#6b471d] text-[#fcd34d]'
                      }`}
                    >
                      {m.status || (m.ativo ? 'ATIVO' : 'AFASTADO')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {isAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#86efac] bg-[#091209] px-2 py-0.5 rounded border border-[#2b4429] text-[11px] tracking-wider">
                          {mostrarTodasSenhas || senhasReveladasMilitar[m.id] ? (m.senhaHash || '1234') : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleVerSenhaMilitar(m.id)}
                          className="p-1 text-[#7a8c7b] hover:text-[#7eb864] cursor-pointer"
                          title={senhasReveladasMilitar[m.id] ? 'Ocultar PIN' : 'Ver PIN do militar'}
                        >
                          {mostrarTodasSenhas || senhasReveladasMilitar[m.id] ? (
                            <EyeOff className="w-3.5 h-3.5 text-[#fca5a5]" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminPinInput('');
                          setAdminPinError('');
                          setModalAdminAuthOpen(true);
                        }}
                        className="flex items-center gap-1 text-[11px] text-[#6b7d6a] hover:text-[#eab308] cursor-pointer transition-colors group"
                        title="Apenas o Responsável (Ventura) com sua senha pode ver esta credencial"
                      >
                        <Lock className="w-3 h-3 text-[#7a8c7b] group-hover:text-[#eab308]" />
                        <span className="font-mono">••••</span>
                        <span className="text-[9px] uppercase opacity-75">(Restrito Ventura)</span>
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleAbrirRedefinirSenha(m)}
                      className="p-1 text-[#e5a93c] hover:text-[#fcd34d] cursor-pointer"
                      title="Redefinir Senha do Militar"
                    >
                      <Key className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => handleAbrirEditarMilitar(m)}
                      className="p-1 text-[#8d9f8e] hover:text-white cursor-pointer"
                      title="Editar Dados"
                    >
                      <Edit2 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => handleExcluirMilitar(m)}
                      className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                      title="Excluir Militar"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABELA ARMEIROS DE PLANTÃO */}
      {abaAtiva === 'ARMEIROS' && (
        <div className="bg-[#101610] border border-[#232f22] rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#232f22] text-[#7a8c7b] bg-[#0c110d]">
                <th className="py-3 px-4 font-bold uppercase">GRADUAÇÃO / NOME DE GUERRA</th>
                <th className="py-3 px-4 font-bold uppercase">NOME COMPLETO</th>
                <th className="py-3 px-4 font-bold uppercase">RE / MATRÍCULA</th>
                <th className="py-3 px-4 font-bold uppercase">FUNÇÃO NA RESERVA</th>
                <th className="py-3 px-4 font-bold uppercase">SENHA DE ACESSO (EXCLUSIVO VENTURA)</th>
                <th className="py-3 px-4 font-bold uppercase text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f281e]">
              {filteredArmeiros.map((a) => {
                const isVenturaItem =
                  a.nomeGuerra.toUpperCase().includes('VENTURA') ||
                  a.nome.toUpperCase().includes('VENTURA') ||
                  a.funcao === 'Responsável pelo Setor';
                return (
                  <tr key={a.id} className="hover:bg-[#131a12] transition-colors">
                    <td className="py-3 px-4 font-bold text-white uppercase">
                      {isVenturaItem ? '★ ' : ''}
                      {a.patente} {a.nomeGuerra}
                    </td>
                    <td className="py-3 px-4 text-[#cfdfc7]">{a.nome}</td>
                    <td className="py-3 px-4 text-[#8d9f8e] font-mono">#{a.matricula}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                          isVenturaItem
                            ? 'bg-[#1b2b18] border-[#3f6d38] text-[#86efac]'
                            : 'bg-[#142313] border-[#2b592f] text-[#cfdfc7]'
                        }`}
                      >
                        {a.funcao}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#86efac] bg-[#091209] px-2 py-0.5 rounded border border-[#2b4429] text-[11px] tracking-wider">
                            {mostrarTodasSenhas || senhasReveladasArmeiro[a.id] ? (a.senhaHash || 'admin') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleVerSenhaArmeiro(a.id)}
                            className="p-1 text-[#7a8c7b] hover:text-[#7eb864] cursor-pointer"
                            title={senhasReveladasArmeiro[a.id] ? 'Ocultar senha' : 'Ver senha do armeiro'}
                          >
                            {mostrarTodasSenhas || senhasReveladasArmeiro[a.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-[#fca5a5]" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdminPinInput('');
                            setAdminPinError('');
                            setModalAdminAuthOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] text-[#6b7d6a] hover:text-[#eab308] cursor-pointer transition-colors group"
                          title="Apenas o Responsável (Ventura) com sua senha pode ver esta credencial"
                        >
                          <Lock className="w-3 h-3 text-[#7a8c7b] group-hover:text-[#eab308]" />
                          <span className="font-mono">••••••••</span>
                          <span className="text-[9px] uppercase opacity-75">(Restrito Ventura)</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            setAdminPinInput('');
                            setAdminPinError('');
                            setModalAdminAuthOpen(true);
                            return;
                          }
                          setArmeiroEmEdicao(a);
                          setFormArmNome(a.nome);
                          setFormArmNomeGuerra(a.nomeGuerra);
                          setFormArmPatente(a.patente);
                          setFormArmMatricula(a.matricula);
                          setFormArmFuncao(a.funcao);
                          setFormArmSenha(a.senhaHash || '');
                          setMostrarFormArmSenha(false);
                          setModalArmeiroOpen(true);
                        }}
                        className="p-1 text-[#8d9f8e] hover:text-white cursor-pointer"
                        title="Editar Armeiro"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL REDEFINIR SENHA */}
      {modalSenhaOpen && militarRedefinirSenha && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101610] border border-[#232f22] max-w-sm w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232f22] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Key className="w-4 h-4 text-[#e5a93c]" />
                REDEFINIR SENHA DO MILITAR
              </h3>
              <button
                onClick={() => setModalSenhaOpen(false)}
                className="text-[#7a8c7b] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#cfdfc7]">
              Defina a nova senha para {militarRedefinirSenha.patente} {militarRedefinirSenha.nomeGuerra}:
            </p>

            {sucessoSenha ? (
              <div className="p-3 bg-[#142313] border border-[#2b592f] text-[#86efac] text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Senha atualizada com sucesso!</span>
              </div>
            ) : (
              <form onSubmit={handleConfirmarRedefinicaoSenha} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-[#7a8c7b] uppercase block">
                      Nova Senha (Ex: 1234)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMostrarFormSenha(!mostrarFormSenha)}
                      className="text-[10px] text-[#7eb864] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {mostrarFormSenha ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{mostrarFormSenha ? 'Ocultar' : 'Visualizar'}</span>
                    </button>
                  </div>
                  <input
                    type={mostrarFormSenha ? 'text' : 'password'}
                    required
                    value={novaSenhaInput}
                    onChange={(e) => setNovaSenhaInput(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-[#425439]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalSenhaOpen(false)}
                    className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase cursor-pointer"
                  >
                    SALVAR NOVA SENHA
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR / EDITAR MILITAR */}
      {modalMilitarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101610] border border-[#232f22] max-w-md w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232f22] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9bb88d]" />
                {militarEmEdicao ? 'EDITAR MILITAR' : 'CADASTRAR MILITAR'}
              </h3>
              <button
                onClick={() => setModalMilitarOpen(false)}
                className="text-[#7a8c7b] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarMilitar} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Graduação / Posto *
                  </label>
                  <select
                    value={formPatente}
                    onChange={(e) => setFormPatente(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none"
                  >
                    {PATENTES_PM.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Nome de Guerra *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SILVA"
                    value={formNomeGuerra}
                    onChange={(e) => setFormNomeGuerra(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva Santos"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    RE / Matrícula Funcional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 198452-9"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Unidade / Batalhão *
                  </label>
                  <select
                    value={formBatalhao}
                    onChange={(e) => setFormBatalhao(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none"
                  >
                    {BATALHOES_PM.map((b) => (
                      <option key={b.sigla} value={b.sigla}>
                        {b.sigla}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Companhia / Seção
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1ª Cia, Força Tática"
                    value={formCia}
                    onChange={(e) => setFormCia(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Pelotão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1º Pelotão"
                    value={formPelotao}
                    onChange={(e) => setFormPelotao(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Status Funcional
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="FÉRIAS">FÉRIAS</option>
                    <option value="LICENÇA">LICENÇA</option>
                    <option value="AFASTADO">AFASTADO</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-[#7a8c7b] uppercase block">
                      Senha Pessoal (PIN 4 dígitos)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMostrarFormSenha(!mostrarFormSenha)}
                      className="text-[10px] text-[#7eb864] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {mostrarFormSenha ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{mostrarFormSenha ? 'Ocultar' : 'Visualizar'}</span>
                    </button>
                  </div>
                  <input
                    type={mostrarFormSenha ? 'text' : 'password'}
                    placeholder={militarEmEdicao ? 'Manter senha atual' : 'Padrão: 1234'}
                    value={formNovaSenha}
                    onChange={(e) => setFormNovaSenha(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232f22]">
                <button
                  type="button"
                  onClick={() => setModalMilitarOpen(false)}
                  className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase cursor-pointer"
                >
                  SALVAR MILITAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR / EDITAR ARMEIRO */}
      {modalArmeiroOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101610] border border-[#232f22] max-w-md w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232f22] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#9bb88d]" />
                {armeiroEmEdicao ? 'EDITAR ARMEIRO' : 'CADASTRAR ARMEIRO'}
              </h3>
              <button
                onClick={() => setModalArmeiroOpen(false)}
                className="text-[#7a8c7b] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarArmeiro} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Graduação *
                  </label>
                  <select
                    value={formArmPatente}
                    onChange={(e) => setFormArmPatente(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none"
                  >
                    {PATENTES_PM.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Nome de Guerra *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SOUZA"
                    value={formArmNomeGuerra}
                    onChange={(e) => setFormArmNomeGuerra(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos de Souza"
                  value={formArmNome}
                  onChange={(e) => setFormArmNome(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    RE / Matrícula Funcional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 172901-4"
                    value={formArmMatricula}
                    onChange={(e) => setFormArmMatricula(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Função na Reserva *
                  </label>
                  <select
                    value={formArmFuncao}
                    onChange={(e) => setFormArmFuncao(e.target.value as any)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none"
                  >
                    <option value="Responsável pelo Setor">Responsável pelo Setor</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Armeiro Titular">Armeiro Titular</option>
                    <option value="Armeiro Adjunto">Armeiro Adjunto</option>
                    <option value="Armeiro Auxiliar">Armeiro Auxiliar</option>
                    <option value="Auxiliar de Reserva">Auxiliar de Reserva</option>
                    <option value="Oficial de Dia">Oficial de Dia</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[#7a8c7b] uppercase block">
                    Senha de Acesso (Padrão: admin ou 4669 para Ventura)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarFormArmSenha(!mostrarFormArmSenha)}
                    className="text-[10px] text-[#7eb864] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {mostrarFormArmSenha ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{mostrarFormArmSenha ? 'Ocultar' : 'Visualizar'}</span>
                  </button>
                </div>
                <input
                  type={mostrarFormArmSenha ? 'text' : 'password'}
                  placeholder={armeiroEmEdicao ? 'Manter senha atual' : 'Padrão: admin'}
                  value={formArmSenha}
                  onChange={(e) => setFormArmSenha(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232f22]">
                <button
                  type="button"
                  onClick={() => setModalArmeiroOpen(false)}
                  className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase cursor-pointer"
                >
                  SALVAR ARMEIRO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICAÇÃO DO RESPONSÁVEL */}
      {modalAdminAuthOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101610] border border-[#232f22] max-w-sm w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232f22] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#eab308]" />
                RESPONSÁVEL PELO SETOR (VENTURA)
              </h3>
              <button
                onClick={() => setModalAdminAuthOpen(false)}
                className="text-[#7a8c7b] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#cfdfc7]">
              O acesso total ao programa e a <strong className="text-white">visualização de senhas de outros armeiros e policiais</strong> é privilégio exclusivo do{' '}
              <strong className="text-[#86efac]">Responsável pelo Setor (VENTURA)</strong> / Administrador. Insira a senha do Ventura para liberar:
            </p>

            {adminPinError && (
              <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{adminPinError}</span>
              </div>
            )}

            <form onSubmit={handleAutenticarAdmin} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                  Senha do Responsável pelo Setor (VENTURA)
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Digite a senha (padrão: 4669)..."
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-3 py-2 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-[#425439]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAdminAuthOpen(false)}
                  className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="bg-[#3a2e12] hover:bg-[#524118] text-[#fef08a] border border-[#71541e] px-4 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>AUTORIZAR ACESSO TOTAL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
