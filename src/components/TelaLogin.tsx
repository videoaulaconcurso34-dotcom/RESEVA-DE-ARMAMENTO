import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Users,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { MilitarServico, MilitarReserva, SessaoUsuario } from '../types';
import { db } from '../services/db';

interface TelaLoginProps {
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  onLoginSucesso: (sessao: SessaoUsuario) => void;
}

export const TelaLogin: React.FC<TelaLoginProps> = ({
  militares,
  armeiros,
  onLoginSucesso,
}) => {
  const [tipoLogin, setTipoLogin] = useState<'ARMEIRO' | 'MILITAR'>('ARMEIRO');
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<string>('');
  const [senhaInput, setSenhaInput] = useState<string>('');
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [mostrarDica, setMostrarDica] = useState(false);

  React.useEffect(() => {
    if (tipoLogin === 'ARMEIRO') {
      setUsuarioSelecionadoId(armeiros[0]?.id || '');
    } else {
      setUsuarioSelecionadoId(militares[0]?.id || '');
    }
    setSenhaInput('');
    setErroMsg(null);
  }, [tipoLogin, armeiros, militares]);

  const handleEntrar = (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg(null);

    if (!usuarioSelecionadoId) {
      setErroMsg('Selecione seu usuário ou militar.');
      return;
    }

    if (tipoLogin === 'ARMEIRO') {
      const armeiro = armeiros.find((a) => a.id === usuarioSelecionadoId);
      if (!armeiro) {
        setErroMsg('Armeiro não encontrado.');
        return;
      }
      const senhaCorreta = db.validarSenhaArmeiro(armeiro.id, senhaInput);
      if (!senhaCorreta) {
        setErroMsg(`Senha incorreta para ${armeiro.patente} ${armeiro.nomeGuerra} (Padrão: admin).`);
        return;
      }

      const isResponsavel = db.isUsuarioResponsavel(armeiro);
      onLoginSucesso({
        tipo: 'ARMEIRO',
        id: armeiro.id,
        nome: armeiro.nome,
        nomeGuerra: armeiro.nomeGuerra,
        patente: armeiro.patente,
        matricula: armeiro.matricula,
        armeiroId: armeiro.id,
        militarId: undefined,
        isResponsavelSetor: isResponsavel,
        isAdmin: isResponsavel,
      });
    } else {
      const militar = militares.find((m) => m.id === usuarioSelecionadoId);
      if (!militar) {
        setErroMsg('Militar não encontrado.');
        return;
      }
      const senhaCorreta = db.validarSenhaMilitar(militar.id, senhaInput);
      if (!senhaCorreta) {
        setErroMsg(`Senha pessoal incorreta para ${militar.patente} ${militar.nomeGuerra} (Padrão: 1234).`);
        return;
      }

      const isResponsavel = db.isUsuarioResponsavel(militar);
      onLoginSucesso({
        tipo: 'MILITAR',
        id: militar.id,
        nome: militar.nome,
        nomeGuerra: militar.nomeGuerra,
        patente: militar.patente,
        matricula: militar.matricula,
        militarId: militar.id,
        armeiroId: isResponsavel ? armeiros.find((a) => db.isUsuarioResponsavel(a))?.id : undefined,
        isResponsavelSetor: isResponsavel,
        isAdmin: isResponsavel,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b08] flex items-center justify-center p-4 font-mono text-[#e2e8e2]">
      <div className="w-full max-w-md bg-[#0f1610] border border-[#232f22] rounded-lg shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#172318] border-2 border-[#3d5e38] flex items-center justify-center text-[#7eb864] shadow-inner">
            <Shield className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] text-[#7a8c7b] uppercase tracking-widest block font-bold">
              POLÍCIA MILITAR • SEÇÃO DE MATERIAL BÉLICO (4ª SEÇÃO)
            </span>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider mt-1">
              SISRESERVA
            </h1>
            <span className="text-xs text-[#7eb864] font-semibold block">
              SISARM-LOG • CONTROLE TÁTICO DE ARMAMENTO
            </span>
          </div>
        </div>

        {/* Alternador de Perfil */}
        <div className="grid grid-cols-2 gap-2 bg-[#090d09] p-1.5 rounded border border-[#1f281e]">
          <button
            type="button"
            onClick={() => setTipoLogin('ARMEIRO')}
            className={`py-2 px-3 rounded text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tipoLogin === 'ARMEIRO'
                ? 'bg-[#1e2e1c] text-[#cfdfc7] border border-[#3e6838] shadow-sm'
                : 'text-[#7a8c7b] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#7eb864]" />
            <span>ARMEIRO / OP</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoLogin('MILITAR')}
            className={`py-2 px-3 rounded text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tipoLogin === 'MILITAR'
                ? 'bg-[#1e2e1c] text-[#cfdfc7] border border-[#3e6838] shadow-sm'
                : 'text-[#7a8c7b] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#86efac]" />
            <span>MILITAR SERVIÇO</span>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleEntrar} className="space-y-4 text-xs">
          {erroMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{erroMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
              {tipoLogin === 'ARMEIRO' ? 'Armeiro de Plantão' : 'Policial de Serviço'}
            </label>
            <select
              value={usuarioSelecionadoId}
              onChange={(e) => setUsuarioSelecionadoId(e.target.value)}
              className="w-full bg-[#090d09] border border-[#232f22] rounded px-3 py-2.5 text-white focus:outline-none focus:border-[#425439]"
            >
              {tipoLogin === 'ARMEIRO'
                ? armeiros.map((a) => {
                    const isResp = db.isUsuarioResponsavel(a);
                    return (
                      <option key={a.id} value={a.id}>
                        {isResp ? '★ ' : ''}{a.patente} {a.nomeGuerra} — RE: {a.matricula} ({a.funcao})
                        {isResp ? ' [RESPONSÁVEL / ADMIN GERAL]' : ''}
                      </option>
                    );
                  })
                : militares.map((m) => {
                    const isResp = db.isUsuarioResponsavel(m);
                    return (
                      <option key={m.id} value={m.id}>
                        {isResp ? '★ ' : ''}{m.patente} {m.nomeGuerra} — RE: {m.matricula} • {m.batalhao}
                        {isResp ? ' [RESPONSÁVEL / ADMIN GERAL]' : ''}
                      </option>
                    );
                  })}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[#7a8c7b] uppercase font-bold">
                Senha / PIN Individual *
              </label>
              <button
                type="button"
                onClick={() => setMostrarDica(!mostrarDica)}
                className="text-[10px] text-[#7eb864] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Ver senhas padrão</span>
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#7a8c7b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                placeholder={tipoLogin === 'ARMEIRO' ? 'Senha do Armeiro (ex: admin ou 4669)' : 'PIN 4 dígitos (ex: 1234 ou 4669)'}
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)}
                className="w-full bg-[#090d09] border border-[#232f22] rounded pl-9 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#425439]"
              />
            </div>

            {mostrarDica && (
              <div className="mt-2 p-2.5 bg-[#121a13] border border-[#232f22] rounded text-[11px] text-[#a5bca3] space-y-1">
                <div>• Responsável pelo Setor / Admin (<strong>VENTURA</strong>): PIN/Senha <strong>4669</strong> (Acesso Total & Visão de Senhas)</div>
                <div>• Armeiros de Plantão: senha padrão <strong>admin</strong></div>
                <div>• Militares de Serviço: PIN pessoal padrão <strong>1234</strong></div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#7eb864]" />
            <span>AUTENTICAR E ACESSAR SISTEMA →</span>
          </button>
        </form>

        <div className="pt-2 border-t border-[#1f281e] text-center text-[10px] text-[#556956]">
          SISRESERVA v2.4 • Criptografia SHA-256 • Livro de Carga Regulamentar
        </div>
      </div>
    </div>
  );
};
