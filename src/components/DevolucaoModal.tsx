import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Retirada, MilitarReserva, EstadoConservacao } from '../types';
import { db } from '../services/db';
import { HeaderBar } from './HeaderBar';
import { dispararAutoSyncSupabase } from '../services/supabase';

interface DevolucaoModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  retiradasNaRua: Retirada[];
  armeiros: MilitarReserva[];
  armeiroPadrao: MilitarReserva | null;
  retiradaPreSelecionadaId?: string | null;
  onSucesso: () => void;
}

export const DevolucaoModal: React.FC<DevolucaoModalProps> = ({
  onClose,
  retiradasNaRua,
  armeiros,
  armeiroPadrao,
  retiradaPreSelecionadaId,
  onSucesso,
}) => {
  const [selectedRetiradaId, setSelectedRetiradaId] = useState<string>(
    retiradaPreSelecionadaId || (retiradasNaRua[0]?.id ?? '')
  );

  const [itensDevolvidos, setItensDevolvidos] = useState<Record<string, boolean>>({});
  const [quantidadesDevolvidas, setQuantidadesDevolvidas] = useState<Record<string, number>>({});
  const [houveDisparos, setHouveDisparos] = useState<boolean>(false);
  const [numeroBO, setNumeroBO] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');

  const [armeiroId, setArmeiroId] = useState<string>(armeiroPadrao?.id || (armeiros[0]?.id ?? ''));
  const [senhaMilitar, setSenhaMilitar] = useState<string>('');
  const [senhaArmeiro, setSenhaArmeiro] = useState<string>('');
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState<boolean>(false);

  const retiradaAtual = useMemo(() => {
    return retiradasNaRua.find((r) => r.id === selectedRetiradaId) || retiradasNaRua[0] || null;
  }, [retiradasNaRua, selectedRetiradaId]);

  React.useEffect(() => {
    if (retiradaAtual) {
      const mapaCheck: Record<string, boolean> = {};
      const mapaQtd: Record<string, number> = {};
      retiradaAtual.itens.forEach((it) => {
        const jaDevolvido = (it.quantidadeDevolvida ?? 0) >= it.quantidade;
        const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
        mapaCheck[it.id] = !jaDevolvido && pendente > 0;
        mapaQtd[it.id] = pendente;
      });
      setItensDevolvidos(mapaCheck);
      setQuantidadesDevolvidas(mapaQtd);
      setHouveDisparos(false);
      setNumeroBO('');
      setSenhaMilitar('');
      setSenhaArmeiro('');
      setErroMsg(null);
    }
  }, [retiradaAtual?.id]);

  const toggleItem = (id: string) => {
    setItensDevolvidos((prev) => {
      const novoChecked = !prev[id];
      if (!novoChecked) {
        setQuantidadesDevolvidas((qPrev) => ({ ...qPrev, [id]: 0 }));
      } else {
        const itemOriginal = retiradaAtual?.itens.find((i) => i.id === id);
        const pendente = itemOriginal
          ? Math.max(0, itemOriginal.quantidade - (itemOriginal.quantidadeDevolvida ?? 0) - (itemOriginal.quantidadeConsumida ?? 0))
          : 1;
        setQuantidadesDevolvidas((qPrev) => ({
          ...qPrev,
          [id]: pendente,
        }));
      }
      return { ...prev, [id]: novoChecked };
    });
  };

  const handleQtdChange = (id: string, novaQtd: number, maxQtd: number) => {
    const qtdValida = Math.max(0, Math.min(novaQtd, maxQtd));
    setQuantidadesDevolvidas((prev) => ({ ...prev, [id]: qtdValida }));
    setItensDevolvidos((prev) => ({ ...prev, [id]: qtdValida > 0 }));
  };

  const consumoMunicaoCalculado = useMemo(() => {
    if (!retiradaAtual) return { totalConsumido: 0, temConsumoMunicao: false };
    let totalConsumido = 0;
    let temConsumoMunicao = false;

    retiradaAtual.itens.forEach((it) => {
      const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
      if (pendente > 0 && it.categoria === 'MUNIÇÃO') {
        const qtdDev = quantidadesDevolvidas[it.id] ?? (itensDevolvidos[it.id] ? pendente : 0);
        const diferenca = Math.max(0, pendente - qtdDev);
        if (diferenca > 0) {
          totalConsumido += diferenca;
          temConsumoMunicao = true;
        }
      }
    });

    return { totalConsumido, temConsumoMunicao };
  }, [retiradaAtual, quantidadesDevolvidas, itensDevolvidos]);

  const formatTempoDecorrido = (dataIso: string) => {
    const diffMs = Math.max(0, Date.now() - new Date(dataIso).getTime());
    const totalMinutos = Math.floor(diffMs / (1000 * 60));
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    return `há ${horas}h${String(mins).padStart(2, '0')}min`;
  };

  const formatDataHora = (dataIso: string) => {
    const d = new Date(dataIso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear()).slice(2);
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano}, ${hora}:${min}`;
  };

  const handleConfirmarDevolucao = () => {
    setErroMsg(null);

    if (!retiradaAtual) {
      setErroMsg('Nenhuma cautela selecionada.');
      return;
    }

    const armeiroObj = armeiros.find((a) => a.id === armeiroId) || armeiroPadrao;
    if (!armeiroObj) {
      setErroMsg('Selecione o armeiro recebedor.');
      return;
    }

    if (!senhaMilitar) {
      setErroMsg('Digite a senha pessoal do militar.');
      return;
    }

    const senhaMilitarOk = db.validarSenhaMilitar(retiradaAtual.militarServicoId, senhaMilitar);
    if (!senhaMilitarOk) {
      setErroMsg(`Senha do militar ${retiradaAtual.militarServicoGuerra} incorreta (Padrão: 1234).`);
      return;
    }

    const senhaArmeiroOk = db.validarSenhaArmeiro(armeiroObj.id, senhaArmeiro);
    if (!senhaArmeiroOk) {
      setErroMsg(`Senha do armeiro ${armeiroObj.nomeGuerra} incorreta (Padrão: admin).`);
      return;
    }

    const temConsumo = consumoMunicaoCalculado.temConsumoMunicao || houveDisparos;
    if (temConsumo && consumoMunicaoCalculado.totalConsumido > 0 && !numeroBO.trim()) {
      setErroMsg('É obrigatório informar o número do Boletim de Ocorrência (BO) para justificar o consumo/disparo de munições em serviço.');
      return;
    }

    setIsProcessando(true);
    try {
      db.registrarDevolucao({
        retiradaId: retiradaAtual.id,
        militarDevolucaoId: retiradaAtual.militarServicoId,
        senhaMilitar: senhaMilitar,
        armeiroRecebedorId: armeiroObj.id,
        senhaArmeiro: senhaArmeiro,
        houveDisparos: temConsumo,
        numeroBoletimOcorrencia: numeroBO,
        observacoesGerais: observacoes,
        itensConferencia: retiradaAtual.itens.map((it) => {
          const jaDevolvido = (it.quantidadeDevolvida ?? 0) >= it.quantidade;
          const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));

          if (jaDevolvido || pendente <= 0) {
            return {
              carrinhoId: it.id,
              quantidadeDevolvida: 0,
              quantidadeConsumida: 0,
              estadoDevolucao: 'EXCELENTE' as EstadoConservacao,
              observacao: observacoes,
            };
          }

          const foiDevolvido = itensDevolvidos[it.id] ?? false;
          const qtdDevolvida = it.quantidade > 1 
            ? (quantidadesDevolvidas[it.id] ?? (foiDevolvido ? pendente : 0))
            : (foiDevolvido ? 1 : 0);
          
          const isMunicao = it.categoria === 'MUNIÇÃO';
          const qtdConsumida = isMunicao ? Math.max(0, pendente - qtdDevolvida) : 0;

          return {
            carrinhoId: it.id,
            quantidadeDevolvida: qtdDevolvida,
            quantidadeConsumida: qtdConsumida,
            motivoConsumo: qtdConsumida > 0 ? `Consumo/Disparos em Serviço - BO: ${numeroBO || 'NÃO INFORMADO'}` : undefined,
            estadoDevolucao: 'EXCELENTE' as EstadoConservacao,
            observacao: observacoes,
          };
        }),
      });

      dispararAutoSyncSupabase(() => ({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      }));

      onSucesso();
      if (onClose) onClose();
    } catch (e: any) {
      setErroMsg(e.message || 'Erro ao registrar devolução.');
    } finally {
      setIsProcessando(false);
    }
  };

  return (
    <div className="space-y-6 font-mono max-w-5xl">
      <HeaderBar title="REGISTRAR DEVOLUÇÃO" />

      {retiradasNaRua.length === 0 ? (
        <div className="bg-[#101610] border border-[#232f22] p-8 text-center rounded-sm">
          <CheckCircle2 className="w-8 h-8 text-[#7eb864] mx-auto mb-2" />
          <p className="text-xs text-[#7a8c7b] uppercase">
            Nenhuma cautela aberta pendente de devolução no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Retiradas em Aberto */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
              RETIRADAS EM ABERTO ({retiradasNaRua.length})
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {retiradasNaRua.map((ret) => {
                const isSelected = ret.id === retiradaAtual?.id;
                const pendentesCount = ret.itens.filter(
                  (it) => (it.quantidadeDevolvida ?? 0) < it.quantidade
                ).length;
                const temParcial = ret.itens.some(
                  (it) => (it.quantidadeDevolvida ?? 0) > 0
                );

                return (
                  <div
                    key={ret.id}
                    onClick={() => setSelectedRetiradaId(ret.id)}
                    className={`p-3 rounded-sm border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-[#182218] border-[#638555] text-white shadow-sm'
                        : 'bg-[#0c110d] border-[#232f22] text-[#7a8c7b] hover:border-[#334232] hover:text-[#e2e8e2]'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-bold uppercase truncate">
                        {ret.numeroCautela || ret.id} — {ret.militarServicoPatente} {ret.militarServicoGuerra}
                      </div>
                      <div className="text-[10px] text-[#7a8c7b]">
                        {pendentesCount} de {ret.itens.length} material(is) pendente(s)
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[9px] font-bold text-[#e5a93c] border border-[#d4a34b] px-1.5 py-0.5 uppercase">
                        ● {ret.status}
                      </span>
                      {temParcial && (
                        <span className="text-[8px] font-bold text-[#7eb864] bg-[#142616] border border-[#2a4d2c] px-1 py-0.2 rounded uppercase">
                          PARCIAL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Ficha de Devolução */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
              FICHA DE DEVOLUÇÃO
            </div>

            {retiradaAtual && (
              <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-[#7a8c7b] uppercase font-bold">
                      {retiradaAtual.numeroCautela || retiradaAtual.id}
                    </div>
                    <div className="text-base font-bold text-white uppercase mt-0.5">
                      {retiradaAtual.militarServicoPatente} {retiradaAtual.militarServicoGuerra}
                    </div>
                    <div className="text-[11px] text-[#7a8c7b] mt-0.5">
                      Saída em {formatDataHora(retiradaAtual.dataSaida)} - {formatTempoDecorrido(retiradaAtual.dataSaida)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="border border-[#d4a34b] text-[#e5a93c] px-2 py-0.5 text-[10px] font-bold uppercase">
                      {retiradaAtual.status}
                    </span>
                    {retiradaAtual.itens.some((it) => (it.quantidadeDevolvida ?? 0) > 0) && (
                      <span className="text-[9px] font-bold text-[#7eb864] bg-[#142616] border border-[#2a4d2c] px-1.5 py-0.5 rounded uppercase">
                        ● DEVOLUÇÃO PARCIAL EM ANDAMENTO
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#0c110d] border border-[#232f22] p-3 rounded-sm space-y-2.5">
                  {retiradaAtual.itens.map((item) => {
                    const isJaRecolhido = (item.quantidadeDevolvida ?? 0) >= item.quantidade;
                    const pendente = Math.max(0, item.quantidade - (item.quantidadeDevolvida ?? 0) - (item.quantidadeConsumida ?? 0));

                    if (isJaRecolhido || pendente <= 0) {
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-sm border bg-[#091209] border-[#1b331c] text-[#7eb864]"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <CheckCircle2 className="w-4 h-4 text-[#7eb864] flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-bold uppercase text-xs line-through text-[#738870] mr-2">
                                {item.materialNome}
                              </span>
                              <span className="text-[#495c47] text-[11px]">
                                #{item.nArmamento}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold bg-[#142616] border border-[#2a4d2c] px-2 py-0.5 rounded text-[#7eb864] flex-shrink-0">
                            ✓ Já Recolhido à Reserva ({item.quantidadeDevolvida || item.quantidade} un)
                          </span>
                        </div>
                      );
                    }

                    const isChecked = itensDevolvidos[item.id] ?? true;
                    const isMultiplo = item.quantidade > 1 || item.categoria === 'MUNIÇÃO';
                    const qtdDev = quantidadesDevolvidas[item.id] ?? (isChecked ? pendente : 0);
                    const diferencaConsumida = Math.max(0, pendente - qtdDev);

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-sm border transition-colors gap-2 ${
                          isChecked
                            ? 'bg-[#131b13] border-[#293828] text-white'
                            : 'bg-[#090d0a] border-[#1a2319] text-[#5b6a5c]'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(item.id)}
                            className="w-4 h-4 rounded bg-[#131913] border-[#2f3f2e] text-[#638555] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#638555] flex-shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold uppercase text-xs text-white mr-2">
                              {item.materialNome}
                            </span>
                            <span className="text-[#7a8c7b] text-[11px]">
                              #{item.nArmamento}
                            </span>
                            {(item.quantidadeDevolvida ?? 0) > 0 && (
                              <span className="text-[10px] text-[#7eb864] ml-2 font-mono">
                                ({item.quantidadeDevolvida} recolhido / {pendente} pendente)
                              </span>
                            )}
                          </div>
                        </label>

                        {isMultiplo ? (
                          <div className="flex items-center gap-2 pl-7 sm:pl-0 flex-shrink-0">
                            <div className="flex items-center bg-[#0a0f0b] border border-[#232f22] rounded px-1.5 py-0.5">
                              <span className="text-[10px] text-[#7a8c7b] uppercase mr-1.5">Devolvendo:</span>
                              <input
                                type="number"
                                min={0}
                                max={pendente}
                                value={qtdDev}
                                onChange={(e) => handleQtdChange(item.id, parseInt(e.target.value, 10) || 0, pendente)}
                                className="w-14 bg-[#141c14] border border-[#344433] px-1.5 py-0.5 text-center text-xs font-bold text-white rounded focus:outline-none focus:border-[#7eb864]"
                              />
                              <span className="text-[10px] text-[#7a8c7b] ml-1">/ {pendente} un</span>
                            </div>

                            {diferencaConsumida > 0 && (
                              <span className="text-[10px] font-bold text-[#e5a93c] bg-[#2a1d0d] border border-[#593d18] px-1.5 py-0.5 rounded uppercase">
                                -{diferencaConsumida} utilizada(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center text-[10px] text-[#7a8c7b] pl-7 sm:pl-0 flex-shrink-0">
                            {isChecked ? (
                              <span className="text-[#7eb864] font-bold">Devolver agora (1 un)</span>
                            ) : (
                              <span className="text-amber-500 font-bold">Manter com militar</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {consumoMunicaoCalculado.temConsumoMunicao && (
                  <div className="p-3 bg-[#1e170c] border border-[#694819] rounded-sm text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-[#e5a93c] uppercase">
                      <span>⚠ CONSUMO DE MUNIÇÃO DETECTADO ({consumoMunicaoCalculado.totalConsumido} disparadas/utilizadas)</span>
                    </div>
                    <p className="text-[11px] text-[#cfb78f]">
                      Foi identificada divergência na contagem de munições devolvidas. É obrigatório registrar o número do BO para prestação de contas.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-[#bda176] uppercase font-bold block mb-1">
                          Nº BOLETIM DE OCORRÊNCIA (BO) *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: BO-2026/04918-B"
                          value={numeroBO}
                          onChange={(e) => setNumeroBO(e.target.value)}
                          className="w-full bg-[#0c110d] border border-[#593d18] px-2.5 py-1.5 text-xs text-white rounded focus:outline-none focus:border-[#e5a93c]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#bda176] uppercase font-bold block mb-1">
                          MOTIVO / HISTÓRICO DA OCORRÊNCIA
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Disparos em confronto na ocorrência X"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          className="w-full bg-[#0c110d] border border-[#593d18] px-2.5 py-1.5 text-xs text-white rounded focus:outline-none focus:border-[#e5a93c]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-[#7a8c7b] leading-relaxed">
                  Ajuste as quantidades de munições caso tenham sido deflagradas/utilizadas. Desmarque itens não devolvidos (ficarão pendentes). A confirmação exige a senha pessoal de {retiradaAtual.militarServicoGuerra}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1f281e]">
                  <div>
                    <label className="text-[11px] text-[#8d9f8e] uppercase font-bold block mb-1">
                      SENHA DO MILITAR ({retiradaAtual.militarServicoGuerra})
                    </label>
                    <input
                      type="password"
                      value={senhaMilitar}
                      onChange={(e) => setSenhaMilitar(e.target.value)}
                      placeholder="Senha (Padrão: 1234)"
                      className="w-full bg-[#0c110d] border border-[#232f22] px-3 py-1.5 text-xs text-white rounded focus:outline-none focus:border-[#425439]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8d9f8e] uppercase font-bold block mb-1">
                      ARMEIRO RECEBEDOR
                    </label>
                    <select
                      value={armeiroId}
                      onChange={(e) => setArmeiroId(e.target.value)}
                      className="w-full bg-[#0c110d] border border-[#232f22] px-2 py-1 text-xs text-white rounded focus:outline-none"
                    >
                      {armeiros.map((arm) => (
                        <option key={arm.id} value={arm.id}>
                          {arm.patente} {arm.nomeGuerra}
                        </option>
                      ))}
                    </select>

                    <input
                      type="password"
                      value={senhaArmeiro}
                      onChange={(e) => setSenhaArmeiro(e.target.value)}
                      placeholder="Senha Armeiro (admin)"
                      className="w-full bg-[#0c110d] border border-[#232f22] px-2 py-1 text-xs text-white rounded mt-1 focus:outline-none"
                    />
                  </div>
                </div>

                {erroMsg && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded">
                    {erroMsg}
                  </div>
                )}

                <div className="pt-3 border-t border-[#1f281e]">
                  <button
                    onClick={handleConfirmarDevolucao}
                    disabled={isProcessando}
                    className="w-full bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] py-2.5 px-4 rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#9bb88d]" />
                    <span>CONFIRMAR DEVOLUÇÃO COM SENHA DO MILITAR →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
