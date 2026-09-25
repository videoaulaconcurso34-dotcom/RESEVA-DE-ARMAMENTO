import React, { useState } from 'react';
import { X, Edit3, Check, Trash2, Plus, AlertCircle, Shield } from 'lucide-react';
import { Retirada, ItemEstoque } from '../types';
import { db } from '../services/db';
import { dispararAutoSyncSupabase } from '../services/supabase';

interface ModalEditarPedidoEmEsperaProps {
  pedido: Retirada;
  estoque: ItemEstoque[];
  onSalvar: (retiradaAtualizada: Retirada) => void;
  onClose: () => void;
}

export const ModalEditarPedidoEmEspera: React.FC<ModalEditarPedidoEmEsperaProps> = ({
  pedido,
  estoque,
  onSalvar,
  onClose,
}) => {
  const [tipoDestino, setTipoDestino] = useState<'EM SERVIÇO' | 'CAUTELADO' | 'MISSÃO'>(
    pedido.tipoDestino || 'EM SERVIÇO'
  );
  const [motivoDetalhado, setMotivoDetalhado] = useState<string>(pedido.motivoDetalhado);
  const [prazoHoras, setPrazoHoras] = useState<number>(pedido.prazoPrevistoHoras || 24);

  // Lista editável de itens: mapeia para estoqueId e quantidade
  const [itensEditados, setItensEditados] = useState<
    Array<{
      estoqueId: string;
      quantidade: number;
    }>
  >(() => pedido.itens.map((it) => ({ estoqueId: it.estoqueId, quantidade: it.quantidade })));

  const [novoItemEstoqueId, setNovoItemEstoqueId] = useState<string>('');
  const [novaQtd, setNovaQtd] = useState<number>(1);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState<boolean>(false);

  // Armas disponíveis para troca (disponíveis + as que já estão no pedido)
  const armamentosDisponiveis = estoque.filter(
    (e) => e.categoria === 'ARMAMENTO' && (e.status === 'DISPONÍVEL' || pedido.itens.some((it) => it.estoqueId === e.id))
  );

  // Todos os itens disponíveis para adicionar novo
  const itensParaAdicionar = estoque.filter(
    (e) =>
      (e.status === 'DISPONÍVEL' || e.id === pedido.itens[0]?.estoqueId) &&
      !itensEditados.some((it) => it.estoqueId === e.id && e.categoria === 'ARMAMENTO')
  );

  const handleTrocarArmamento = (index: number, novoEstoqueId: string) => {
    setErroMsg(null);
    const novo = [...itensEditados];
    novo[index] = { estoqueId: novoEstoqueId, quantidade: 1 };
    setItensEditados(novo);
  };

  const handleAlterarQuantidade = (index: number, qtd: number) => {
    setErroMsg(null);
    const novo = [...itensEditados];
    const est = estoque.find((e) => e.id === novo[index].estoqueId);
    const maxDisp = est
      ? est.categoria === 'ARMAMENTO'
        ? 1
        : est.quantidadeDisponivel !== undefined
        ? est.quantidadeDisponivel
        : 999
      : 999;

    novo[index].quantidade = Math.max(1, Math.min(qtd, maxDisp));
    setItensEditados(novo);
  };

  const handleRemoverItem = (index: number) => {
    if (itensEditados.length <= 1) {
      setErroMsg('O pedido precisa ter ao menos um material.');
      return;
    }
    setItensEditados(itensEditados.filter((_, i) => i !== index));
  };

  const handleAdicionarItem = () => {
    if (!novoItemEstoqueId) return;
    const est = estoque.find((e) => e.id === novoItemEstoqueId);
    if (!est) return;

    if (itensEditados.some((i) => i.estoqueId === novoItemEstoqueId)) {
      setErroMsg('Este material já está incluído no pedido.');
      return;
    }

    setItensEditados([
      ...itensEditados,
      {
        estoqueId: novoItemEstoqueId,
        quantidade: est.categoria === 'ARMAMENTO' ? 1 : Math.max(1, novaQtd),
      },
    ]);
    setNovoItemEstoqueId('');
    setNovaQtd(1);
    setErroMsg(null);
  };

  const handleSalvar = () => {
    setErroMsg(null);
    if (itensEditados.length === 0) {
      setErroMsg('O pedido precisa conter ao menos um material.');
      return;
    }

    setIsProcessando(true);
    try {
      const atualizado = db.editarPedidoEmEspera({
        retiradaId: pedido.id,
        tipoDestino,
        motivoDetalhado,
        prazoPrevistoHoras: prazoHoras,
        itens: itensEditados,
      });

      dispararAutoSyncSupabase(() => ({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      }));

      onSalvar(atualizado);
      onClose();
    } catch (err: any) {
      setErroMsg(err.message || 'Erro ao editar pedido.');
    } finally {
      setIsProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-[#101610] border border-[#273824] max-w-2xl w-full p-5 rounded-sm space-y-4 shadow-2xl text-xs max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-[#232f22] pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#e5a93c]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              EDITAR PEDIDO DE CAUTELA — {pedido.numeroCautela}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#7a8c7b] hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informações do Militar */}
        <div className="bg-[#0b100c] border border-[#1f281e] p-3 rounded flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-bold text-white uppercase text-xs">
              {pedido.militarServicoPatente} {pedido.militarServicoGuerra}
            </div>
            <div className="text-[11px] text-[#7a8c7b]">
              RE: {pedido.militarServicoMatricula} • {pedido.militarServicoBatalhao}
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 bg-[#262013] border border-[#594424] text-[#e5a93c] text-[10px] font-bold rounded uppercase">
              STATUS: EM ESPERA
            </span>
            <div className="text-[10px] text-[#8d9f8e] mt-0.5">Aguardando separação / liberação</div>
          </div>
        </div>

        {erroMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded flex items-start gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{erroMsg}</span>
          </div>
        )}

        {/* Corpo rolável */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Parâmetros do Serviço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                Tipo de Destino:
              </label>
              <select
                value={tipoDestino}
                onChange={(e) => setTipoDestino(e.target.value as any)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none"
              >
                <option value="EM SERVIÇO">EM SERVIÇO</option>
                <option value="MISSÃO">MISSÃO</option>
                <option value="CAUTELADO">CAUTELADO</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                Motivo / Justificativa da Retirada:
              </label>
              <input
                type="text"
                value={motivoDetalhado}
                onChange={(e) => setMotivoDetalhado(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Seção de Ajuste e Troca de Armas / Materiais */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#cfdfc7] uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9bb88d]" />
                MATERIAIS E ARMAS DO PEDIDO (TROCAR ARMA DA CAIXA OU QUANTIDADES):
              </span>
              <span className="text-[10px] text-[#7a8c7b]">
                {itensEditados.length} item(ns) selecionado(s)
              </span>
            </div>

            <div className="space-y-2">
              {itensEditados.map((itemRef, idx) => {
                const est = estoque.find((e) => e.id === itemRef.estoqueId);
                if (!est) return null;
                const isArmamento = est.categoria === 'ARMAMENTO';

                return (
                  <div
                    key={`${itemRef.estoqueId}-${idx}`}
                    className="p-2.5 bg-[#0e140f] border border-[#232f22] rounded space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-[#172316] text-[#9bb88d] text-[10px] font-bold uppercase rounded border border-[#2a3e28]">
                          {est.categoria}
                        </span>
                        <span className="text-white font-bold text-xs">{est.nome}</span>
                        <span className="text-[#8d9f8e] text-[11px]">#{est.nMaterial}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverItem(idx)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        title="Remover item do pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isArmamento ? (
                      <div className="bg-[#090d09] border border-[#1b251a] p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] text-[#e5a93c] font-bold uppercase">
                          Trocar para outra arma física da reserva:
                        </span>
                        <select
                          value={itemRef.estoqueId}
                          onChange={(e) => handleTrocarArmamento(idx, e.target.value)}
                          className="bg-[#121a12] border border-[#2c3d2a] rounded px-2 py-1 text-white text-[11px] focus:outline-none"
                        >
                          {armamentosDisponiveis.map((arma) => (
                            <option key={arma.id} value={arma.id}>
                              {arma.nome} (#{arma.nMaterial}) - {arma.calibre || 'S/ Calibre'} [Local: {arma.localArmazenamento}]
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="bg-[#090d09] border border-[#1b251a] p-2 rounded flex items-center justify-between">
                        <span className="text-[10px] text-[#8d9f8e] uppercase">
                          Quantidade a ser entregue (Disp: {est.quantidadeDisponivel ?? est.quantidadeTotal}):
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={est.quantidadeDisponivel ?? est.quantidadeTotal ?? 100}
                            value={itemRef.quantidade}
                            onChange={(e) => handleAlterarQuantidade(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-16 bg-[#121a12] border border-[#2c3d2a] px-2 py-0.5 text-center text-xs font-bold text-white rounded focus:outline-none"
                          />
                          <span className="text-[#7a8c7b] text-[10px]">un</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adicionar Material Adicional ao Pedido */}
          <div className="p-3 bg-[#0a0f0b] border border-dashed border-[#232f22] rounded space-y-2">
            <span className="text-[10px] font-bold text-[#8d9f8e] uppercase block">
              Adicionar outro item ao pedido:
            </span>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <select
                value={novoItemEstoqueId}
                onChange={(e) => setNovoItemEstoqueId(e.target.value)}
                className="flex-1 bg-[#101610] border border-[#232f22] rounded px-2.5 py-1.5 text-white text-xs focus:outline-none"
              >
                <option value="">Selecione material disponível na reserva...</option>
                {itensParaAdicionar.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.categoria}] {item.nome} (#{item.nMaterial}) - Disp: {item.categoria === 'ARMAMENTO' ? 1 : item.quantidadeDisponivel ?? 1}
                  </option>
                ))}
              </select>

              {novoItemEstoqueId && estoque.find((e) => e.id === novoItemEstoqueId)?.categoria !== 'ARMAMENTO' && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={novaQtd}
                    onChange={(e) => setNovaQtd(parseInt(e.target.value, 10) || 1)}
                    className="w-14 bg-[#101610] border border-[#232f22] px-2 py-1 text-center text-xs text-white rounded"
                  />
                  <span className="text-[10px] text-[#7a8c7b]">un</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleAdicionarItem}
                disabled={!novoItemEstoqueId}
                className="px-3 py-1.5 bg-[#1b2619] hover:bg-[#253523] text-[#cfdfc7] border border-[#2e402c] rounded text-xs font-bold uppercase flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                ADICIONAR
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232f22] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={isProcessando}
            className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-[#7eb864]" />
            SALVAR ALTERAÇÕES
          </button>
        </div>
      </div>
    </div>
  );
};
