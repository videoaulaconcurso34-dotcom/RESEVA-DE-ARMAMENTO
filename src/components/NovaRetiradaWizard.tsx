import React, { useState } from 'react';
import {
  Check,
  Search,
  Trash2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  MilitarServico,
  MilitarReserva,
  ItemEstoque,
  Retirada,
  SessaoUsuario,
} from '../types';
import { db } from '../services/db';
import { HeaderBar } from './HeaderBar';
import { dispararAutoSyncSupabase } from '../services/supabase';

interface NovaRetiradaWizardProps {
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  estoque: ItemEstoque[];
  armeiroPadrao: MilitarReserva | null;
  sessaoUsuario?: SessaoUsuario | null;
  onSucesso: (retirada: Retirada) => void;
  onCancelar?: () => void;
}

export const NovaRetiradaWizard: React.FC<NovaRetiradaWizardProps> = ({
  militares,
  armeiros,
  estoque,
  armeiroPadrao,
  sessaoUsuario,
  onSucesso,
}) => {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // Etapa 1
  const [militarId, setMilitarId] = useState<string>(() => {
    if (sessaoUsuario?.tipo === 'MILITAR' && sessaoUsuario.militarId) {
      return sessaoUsuario.militarId;
    }
    return '';
  });
  const [tipoDestino, setTipoDestino] = useState<'EM SERVIÇO' | 'CAUTELADO' | 'MISSÃO'>('EM SERVIÇO');
  const [motivo, setMotivo] = useState<string>('Serviço Ordinário de Patrulhamento');
  const [prazoHoras, setPrazoHoras] = useState<number>(24);

  // Etapa 2 (Carrinho)
  const [carrinho, setCarrinho] = useState<Array<{
    item: ItemEstoque;
    quantidade: number;
  }>>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [buscaEstoque, setBuscaEstoque] = useState<string>('');

  // Etapa 3 (Senha & Armeiro)
  const [armeiroId, setArmeiroId] = useState<string>(armeiroPadrao?.id || (armeiros[0]?.id ?? ''));
  const [senhaMilitar, setSenhaMilitar] = useState<string>('');
  const [senhaArmeiro, setSenhaArmeiro] = useState<string>('');
  const [erroAuth, setErroAuth] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState<boolean>(false);
  const [pedidoEmEsperaCriado, setPedidoEmEsperaCriado] = useState<Retirada | null>(null);

  const itensDisponiveis = estoque.filter((item) => {
    if (item.status !== 'DISPONÍVEL') return false;

    const qtdDisp = item.categoria === 'ARMAMENTO'
      ? 1
      : (item.quantidadeDisponivel !== undefined ? item.quantidadeDisponivel : (item.quantidadeTotal ?? 1));

    if (qtdDisp <= 0) return false;

    if (item.categoria === 'ARMAMENTO' && carrinho.some((c) => c.item.id === item.id)) return false;

    if (filtroCategoria !== 'TODAS' && item.categoria !== filtroCategoria) return false;

    if (buscaEstoque.trim()) {
      const q = buscaEstoque.toLowerCase();
      const matchNome = item.nome.toLowerCase().includes(q);
      const matchSerie = item.nMaterial.toLowerCase().includes(q);
      const matchCalibre = item.calibre ? item.calibre.toLowerCase().includes(q) : false;
      return matchNome || matchSerie || matchCalibre;
    }

    return true;
  });

  const handleAdicionarItem = (item: ItemEstoque) => {
    const qtdDisp = item.categoria === 'ARMAMENTO'
      ? (item.status === 'DISPONÍVEL' ? 1 : 0)
      : (item.quantidadeDisponivel !== undefined ? item.quantidadeDisponivel : (item.quantidadeTotal ?? 1));

    if (qtdDisp <= 0) return;

    const jaExisteIndex = carrinho.findIndex((c) => c.item.id === item.id);
    if (jaExisteIndex >= 0) {
      const novo = [...carrinho];
      const atual = novo[jaExisteIndex].quantidade;
      if (atual < qtdDisp) {
        const incremento = item.categoria === 'MUNIÇÃO' ? Math.min(15, qtdDisp - atual) : 1;
        novo[jaExisteIndex].quantidade += incremento;
        setCarrinho(novo);
      }
    } else {
      const qtdInicial = item.categoria === 'MUNIÇÃO' ? Math.min(30, qtdDisp) : 1;
      setCarrinho([...carrinho, { item, quantidade: qtdInicial }]);
    }
  };

  const handleRemoverItem = (itemId: string) => {
    setCarrinho(carrinho.filter((c) => c.item.id !== itemId));
  };

  const handleAlterarQtd = (itemId: string, novaQtd: number) => {
    if (novaQtd <= 0) {
      handleRemoverItem(itemId);
      return;
    }
    const itemEst = estoque.find((e) => e.id === itemId);
    const maxDisp = itemEst
      ? (itemEst.categoria === 'ARMAMENTO' ? 1 : (itemEst.quantidadeDisponivel !== undefined ? itemEst.quantidadeDisponivel : 1))
      : 1;
    const qtdFinal = Math.min(novaQtd, maxDisp);
    setCarrinho(
      carrinho.map((c) => (c.item.id === itemId ? { ...c, quantidade: qtdFinal } : c))
    );
  };

  const militarSelecionado = militares.find((m) => m.id === militarId);
  const armeiroSelecionado = armeiros.find((a) => a.id === armeiroId);

  const handleFinalizar = () => {
    setErroAuth(null);

    if (!militarSelecionado || !armeiroSelecionado) {
      setErroAuth('Militar ou Armeiro inválido.');
      return;
    }

    if (!senhaMilitar) {
      setErroAuth('Digite a senha pessoal do militar para autenticação.');
      return;
    }

    const senhaMilitarCorreta = db.validarSenhaMilitar(militarSelecionado.id, senhaMilitar);
    if (!senhaMilitarCorreta) {
      setErroAuth(`Senha do militar ${militarSelecionado.nomeGuerra} incorreta (Senha padrão: 1234).`);
      return;
    }

    const senhaArmeiroCorreta = db.validarSenhaArmeiro(armeiroSelecionado.id, senhaArmeiro);
    if (!senhaArmeiroCorreta) {
      setErroAuth(`Senha do armeiro ${armeiroSelecionado.nomeGuerra} incorreta (Senha padrão: admin).`);
      return;
    }

    setIsProcessando(true);
    try {
      const novaRet = db.criarRetiradaSeparando({
        militarServicoId: militarSelecionado.id,
        militarReservaId: armeiroSelecionado.id,
        tipoDestino,
        motivoDetalhado: motivo || `${tipoDestino} - Escala Oficial`,
        prazoPrevistoHoras: prazoHoras,
        itens: carrinho.map((c) => ({
          estoqueId: c.item.id,
          quantidade: c.quantidade,
        })),
      });

      const retConfirmada = db.confirmarSaida({
        retiradaId: novaRet.id,
        senhaMilitar: senhaMilitar,
      });

      dispararAutoSyncSupabase(() => ({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      }));

      onSucesso(retConfirmada);
    } catch (err: any) {
      setErroAuth(err.message || 'Erro ao processar cautela.');
    } finally {
      setIsProcessando(false);
    }
  };

  const handleCriarPedidoEspera = () => {
    setErroAuth(null);
    if (!militarSelecionado) {
      setErroAuth('Militar solicitante não identificado.');
      return;
    }
    if (!senhaMilitar) {
      setErroAuth(`Digite a senha do militar (${militarSelecionado.nomeGuerra}) para assinar a solicitação.`);
      return;
    }
    const senhaMilitarCorreta = db.validarSenhaMilitar(militarSelecionado.id, senhaMilitar);
    if (!senhaMilitarCorreta) {
      setErroAuth(`Senha incorreta para ${militarSelecionado.patente} ${militarSelecionado.nomeGuerra} (Padrão: 1234).`);
      return;
    }

    setIsProcessando(true);
    try {
      const pedido = db.criarPedidoEmEsperaMilitar({
        militarServicoId: militarSelecionado.id,
        tipoDestino,
        motivoDetalhado: motivo || `${tipoDestino} - Escala Operacional`,
        prazoPrevistoHoras: prazoHoras,
        itens: carrinho.map((c) => ({
          estoqueId: c.item.id,
          quantidade: c.quantidade,
        })),
        senhaMilitar: senhaMilitar,
      });

      dispararAutoSyncSupabase(() => ({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      }));

      setPedidoEmEsperaCriado(pedido);
      onSucesso(pedido);
    } catch (err: any) {
      setErroAuth(err.message || 'Erro ao registrar pedido em espera.');
    } finally {
      setIsProcessando(false);
    }
  };

  return (
    <div className="space-y-6 font-mono max-w-5xl">
      <HeaderBar
        title={
          sessaoUsuario?.tipo === 'MILITAR'
            ? 'SOLICITAÇÃO DE CAUTELA — POLICIAL DE SERVIÇO'
            : 'NOVA RETIRADA'
        }
      />

      {/* Stepper Superior */}
      <div className="flex items-center justify-between text-xs font-bold text-[#7a8c7b] border-b border-[#1f281e] pb-4 select-none">
        <div
          className={`flex items-center gap-2 cursor-pointer ${
            etapa === 1 ? 'text-white' : etapa > 1 ? 'text-[#9bb88d]' : 'text-[#7a8c7b]'
          }`}
          onClick={() => setEtapa(1)}
        >
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              etapa === 1
                ? 'border-[#9bb88d] text-[#cfdfc7] bg-[#1a2618]'
                : etapa > 1
                ? 'border-[#9bb88d] bg-[#1a2618] text-[#9bb88d]'
                : 'border-[#334232]'
            }`}
          >
            {etapa > 1 ? <Check className="w-3 h-3" /> : '1'}
          </span>
          <span className="uppercase">MILITAR & FINALIDADE</span>
        </div>

        <div className="flex-1 border-b border-[#232f22] mx-4" />

        <div
          className={`flex items-center gap-2 cursor-pointer ${
            etapa === 2 ? 'text-white' : etapa > 2 ? 'text-[#9bb88d]' : 'text-[#7a8c7b]'
          }`}
          onClick={() => militarId && setEtapa(2)}
        >
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              etapa === 2
                ? 'border-[#9bb88d] text-[#cfdfc7] bg-[#1a2618]'
                : etapa > 2
                ? 'border-[#9bb88d] bg-[#1a2618] text-[#9bb88d]'
                : 'border-[#334232]'
            }`}
          >
            {etapa > 2 ? <Check className="w-3 h-3" /> : '2'}
          </span>
          <span className="uppercase">MONTAR CARRINHO</span>
        </div>

        <div className="flex-1 border-b border-[#232f22] mx-4" />

        <div
          className={`flex items-center gap-2 ${
            etapa === 3 ? 'text-white' : 'text-[#7a8c7b]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
              etapa === 3
                ? 'border-[#9bb88d] text-[#cfdfc7] bg-[#1a2618]'
                : 'border-[#334232]'
            }`}
          >
            3
          </span>
          <span className="uppercase">CONFERÊNCIA & SENHA</span>
        </div>
      </div>

      {/* CONTEÚDO DO PASSO 1 */}
      {etapa === 1 && (
        <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-[#8d9f8e] uppercase font-bold tracking-wider block">
              MILITAR DE SERVIÇO
            </label>
            {sessaoUsuario?.tipo === 'MILITAR' && militarSelecionado ? (
              <div className="p-3 bg-[#0c110d] border border-[#2b3a27] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-[#cfdfc7] font-bold block uppercase">
                    {militarSelecionado.patente} {militarSelecionado.nomeGuerra} — {militarSelecionado.nome}
                  </span>
                  <span className="text-[11px] text-[#7a8c7b] block">
                    RE: {militarSelecionado.matricula} • {militarSelecionado.batalhao}
                  </span>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 bg-[#1a2d1a] border border-[#3e6838] text-[#9bd48e] text-[10px] font-bold uppercase rounded tracking-wider">
                  POLICIAL AUTENTICADO
                </span>
              </div>
            ) : (
              <select
                value={militarId}
                onChange={(e) => setMilitarId(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#263327] text-sm text-[#e2e8e2] rounded px-3 py-2.5 focus:outline-none focus:border-[#425439]"
              >
                <option value="">Selecione...</option>
                {militares.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.patente} {m.nomeGuerra} — {m.nome} (RE: {m.matricula}) • {m.batalhao}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#8d9f8e] uppercase font-bold tracking-wider block">
              FINALIDADE DA RETIRADA
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['EM SERVIÇO', 'CAUTELADO', 'MISSÃO'] as const).map((tipo) => {
                const isSelected = tipoDestino === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      setTipoDestino(tipo);
                      if (tipo === 'EM SERVIÇO') setPrazoHoras(12);
                      else if (tipo === 'CAUTELADO') setPrazoHoras(24);
                      else setPrazoHoras(48);
                    }}
                    className={`py-3.5 px-4 rounded-sm border text-xs font-bold uppercase transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-[#638555] bg-[#1b2619] text-[#d6e6d1] shadow-sm'
                        : 'border-[#232f22] bg-[#0c110d] text-[#7a8c7b] hover:text-[#e2e8e2] hover:border-[#334232]'
                    }`}
                  >
                    {tipo}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1f281e]">
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#7a8c7b] uppercase">
                MOTIVO / DESTINO OPERACIONAL
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Ronda Tática Noturna Viatura 104"
                className="w-full bg-[#0c110d] border border-[#263327] text-xs text-[#e2e8e2] rounded px-3 py-2.5 focus:outline-none focus:border-[#425439]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1f281e]">
            <button
              onClick={() => {
                if (!militarId) {
                  alert('Selecione o Militar de Serviço antes de avançar.');
                  return;
                }
                setEtapa(2);
              }}
              className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-5 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>AVANÇAR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO DO PASSO 2 */}
      {etapa === 2 && (
        <div className="space-y-6">
          <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
                ESTOQUE DISPONÍVEL
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="w-3 h-3 text-[#7a8c7b] absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou série..."
                    value={buscaEstoque}
                    onChange={(e) => setBuscaEstoque(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 pl-7 py-1 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(['TODAS', 'ARMAMENTO', 'MUNIÇÃO', 'PROTEÇÃO', 'CARREGADOR', 'ACESSÓRIOS'] as const).map((cat) => {
                const isSel = filtroCategoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFiltroCategoria(cat)}
                    className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSel
                        ? 'bg-[#233520] text-[#cfdfc7] border border-[#44663e] shadow-sm'
                        : 'bg-[#0c110d] text-[#7a8c7b] border border-[#1f281e] hover:border-[#334232] hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat === 'ARMAMENTO' && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#162514] text-[#7eb864] border border-[#2d4729]">
                        1 p/ 1
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {filtroCategoria === 'ARMAMENTO' && (
              <div className="p-2 bg-[#121b11] border border-[#273824] rounded text-[11px] text-[#9bb88d] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7eb864]" />
                <span>
                  <strong>Regra 1 p/ 1 (Armamento):</strong> Cada arma é única e individual. Selecione a unidade específica pela numeração de patrimônio/série.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {itensDisponiveis.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0c110d] border border-[#232f22] p-3 rounded-sm flex items-center justify-between gap-2 hover:border-[#334232] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold text-xs text-white uppercase truncate">
                      {item.nome}
                    </div>

                    <div className="text-[10px] text-[#7a8c7b] truncate">
                      {item.nMaterial ? `#${item.nMaterial}` : item.lote ? `${item.lote}` : ''}
                      {item.quantidadeDisponivel !== undefined && ` • ${item.quantidadeDisponivel} disp.`}
                    </div>

                    <div className="inline-flex items-center gap-1 text-[9px] text-[#9bb88d] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7eb864]" />
                      <span>{item.categoria}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdicionarItem(item)}
                    className="bg-[#182218] hover:bg-[#253625] text-[#cfdfc7] border border-[#2e402c] px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-colors flex-shrink-0 cursor-pointer"
                  >
                    ADICIONAR
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Carrinho */}
          <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
            <div className="text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
              CARRINHO DA RETIRADA ({carrinho.length})
            </div>

            {carrinho.length === 0 ? (
              <div className="text-xs text-[#7a8c7b] py-2">
                Nenhum item adicionado ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {carrinho.map(({ item, quantidade }) => (
                  <div
                    key={item.id}
                    className="bg-[#0c110d] border border-[#232f22] px-3 py-2 rounded-sm flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{item.nome}</span>
                      <span className="text-[#7a8c7b] text-[11px]">#{item.nMaterial}</span>
                      <span className="text-[10px] text-[#9bb88d] border border-[#2e402c] px-1.5 py-0.2 rounded">
                        {item.categoria}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.categoria === 'MUNIÇÃO' ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#7a8c7b]">
                          <span>Qtd:</span>
                          <input
                            type="number"
                            min={1}
                            max={item.quantidadeDisponivel || 500}
                            value={quantidade}
                            onChange={(e) => handleAlterarQtd(item.id, Number(e.target.value))}
                            className="w-16 bg-[#151c15] border border-[#263327] rounded px-1.5 py-0.5 text-center text-white"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-[#7a8c7b]">1 un</span>
                      )}

                      <button
                        onClick={() => handleRemoverItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#1f281e]">
              <button
                onClick={() => setEtapa(1)}
                className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>VOLTAR</span>
              </button>

              <button
                onClick={() => {
                  if (carrinho.length === 0) {
                    alert('Adicione ao menos um item ao carrinho.');
                    return;
                  }
                  setEtapa(3);
                }}
                disabled={carrinho.length === 0}
                className="bg-[#243321] hover:bg-[#32452e] disabled:opacity-50 text-[#cfdfc7] border border-[#344630] px-5 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>AVANÇAR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DO PASSO 3 */}
      {etapa === 3 && (
        <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-6">
          {pedidoEmEsperaCriado ? (
            <div className="p-6 bg-[#132014] border-2 border-[#3d5e38] rounded-sm space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#1b2f1c] border border-[#52804b] flex items-center justify-center text-[#7eb864]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="px-3 py-1 bg-[#1a2d1a] border border-[#3e6838] text-[#9bd48e] text-xs font-bold rounded uppercase inline-block mb-2">
                  SITUAÇÃO: EM ESPERA DE LIBERAÇÃO
                </span>
                <h3 className="text-base font-bold text-white uppercase">
                  SOLICITAÇÃO DE CAUTELA Nº {pedidoEmEsperaCriado.numeroCautela} REGISTRADA!
                </h3>
                <p className="text-xs text-[#9eb29b] mt-1 max-w-md mx-auto">
                  A solicitação foi assinada com a senha do militar e aguarda a conferência e autorização do Armeiro de Plantão no balcão do Armorial.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPedidoEmEsperaCriado(null);
                    setCarrinho([]);
                    setSenhaMilitar('');
                    setEtapa(1);
                  }}
                  className="bg-[#161f17] hover:bg-[#233124] text-[#a7c5a2] border border-[#2d422a] px-5 py-2.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  + NOVA SOLICITAÇÃO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSucesso(pedidoEmEsperaCriado);
                  }}
                  className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-6 py-2.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  OK, CONCLUIR
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
                CONFERÊNCIA DE MATERIAIS & AUTENTICAÇÃO DIGITAL
              </div>

              <div className="bg-[#0c110d] border border-[#232f22] p-4 rounded-sm space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[#7a8c7b]">
                  <div>
                    <span className="block text-[10px] uppercase">MILITAR:</span>
                    <span className="font-bold text-white uppercase">
                      {militarSelecionado?.patente} {militarSelecionado?.nomeGuerra}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase">FINALIDADE:</span>
                    <span className="font-bold text-[#e5a93c] uppercase">{tipoDestino}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase">ITENS ACATELADOS:</span>
                    <span className="font-bold text-white">{carrinho.length} tipo(s)</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-[#232f22] pt-2">
                  <div className="text-[11px] text-[#7a8c7b] mb-1">Relação de Armas e Munições:</div>
                  <ul className="space-y-1 text-xs">
                    {carrinho.map(({ item, quantidade }) => (
                      <li key={item.id} className="flex justify-between text-[#cfdfc7]">
                        <span>• {item.nome} {item.calibre ? `(${item.calibre})` : ''}</span>
                        <span className="text-[#8d9f8e]">
                          {quantidade > 1 ? `${quantidade} un` : `#${item.nMaterial}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {sessaoUsuario?.tipo === 'MILITAR' ? (
                <div className="space-y-2 max-w-lg">
                  <label className="text-xs text-[#8d9f8e] uppercase font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#e5a93c]" />
                    <span>SUA SENHA PESSOAL ({militarSelecionado?.nomeGuerra}) *</span>
                  </label>
                  <input
                    type="password"
                    value={senhaMilitar}
                    onChange={(e) => setSenhaMilitar(e.target.value)}
                    placeholder="Digite seu PIN de 4 dígitos (Padrão: 1234)"
                    className="w-full bg-[#0c110d] border border-[#263327] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#425439]"
                  />
                  <span className="text-[11px] text-[#7a8c7b] block">
                    Sua assinatura digital autentica a solicitação. Ao enviar, dirija-se à Reserva para a conferência e entrega física das armas pelo armeiro de plantão.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8d9f8e] uppercase font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#e5a93c]" />
                      <span>SENHA DO MILITAR ({militarSelecionado?.nomeGuerra}) *</span>
                    </label>
                    <input
                      type="password"
                      value={senhaMilitar}
                      onChange={(e) => setSenhaMilitar(e.target.value)}
                      placeholder="Senha de 4 dígitos (Padrão: 1234)"
                      className="w-full bg-[#0c110d] border border-[#263327] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#425439]"
                    />
                    <span className="text-[10px] text-[#7a8c7b]">
                      Autenticação de aceite e responsabilidade legal sobre o armamento.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8d9f8e] uppercase font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#9bb88d]" />
                      <span>ARMEIRO RESPONSÁVEL PELA LIBERAÇÃO</span>
                    </label>
                    <select
                      value={armeiroId}
                      onChange={(e) => setArmeiroId(e.target.value)}
                      className="w-full bg-[#0c110d] border border-[#263327] rounded px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {armeiros.map((arm) => (
                        <option key={arm.id} value={arm.id}>
                          {arm.patente} {arm.nomeGuerra} ({arm.funcao})
                        </option>
                      ))}
                    </select>

                    <input
                      type="password"
                      value={senhaArmeiro}
                      onChange={(e) => setSenhaArmeiro(e.target.value)}
                      placeholder="Senha do Armeiro (Padrão: admin)"
                      className="w-full bg-[#0c110d] border border-[#263327] rounded px-3 py-1.5 text-xs text-white mt-1 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#7a8c7b]">
                      Senha individual do armeiro de plantão.
                    </span>
                  </div>
                </div>
              )}

              {erroAuth && (
                <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{erroAuth}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1f281e]">
                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>VOLTAR</span>
                </button>

                {sessaoUsuario?.tipo === 'MILITAR' ? (
                  <button
                    type="button"
                    onClick={handleCriarPedidoEspera}
                    disabled={isProcessando}
                    className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-6 py-2.5 rounded text-xs font-bold uppercase flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#9bb88d]" />
                    <span>{isProcessando ? 'ENVIANDO SOLICITAÇÃO...' : 'ENVIAR SOLICITAÇÃO DE CAUTELA (AGUARDAR BALCÃO) →'}</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCriarPedidoEspera}
                      disabled={isProcessando}
                      className="bg-[#172318] hover:bg-[#203322] text-[#9bb88d] border border-[#2d472c] px-4 py-2.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span>ENVIAR SOLICITAÇÃO (EM ESPERA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalizar}
                      disabled={isProcessando}
                      className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-6 py-2.5 rounded text-xs font-bold uppercase flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#9bb88d]" />
                      <span>{isProcessando ? 'AUTENTICANDO...' : 'LIBERAR CAUTELA / SAÍDA →'}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
