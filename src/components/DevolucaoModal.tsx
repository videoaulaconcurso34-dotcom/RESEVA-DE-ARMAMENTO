import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Shield,
  CheckSquare,
  Square,
  PackageCheck,
  Clock,
  FileText,
  ChevronRight,
  Info,
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

  const [modoDevolucao, setModoDevolucao] = useState<'TOTAL' | 'PARCIAL'>('TOTAL');
  const [itensDevolvidos, setItensDevolvidos] = useState<Record<string, boolean>>({});
  const [quantidadesDevolvidas, setQuantidadesDevolvidas] = useState<Record<string, number>>({});
  const [houveDisparos, setHouveDisparos] = useState<boolean>(false);
  const [disparosPorItem, setDisparosPorItem] = useState<Record<string, number>>({});
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

  // Sincroniza estado ao selecionar uma cautela
  useEffect(() => {
    if (retiradaAtual) {
      const mapaCheck: Record<string, boolean> = {};
      const mapaQtd: Record<string, number> = {};
      const mapaDisparos: Record<string, number> = {};

      retiradaAtual.itens.forEach((it) => {
        const jaDevolvido = (it.quantidadeDevolvida ?? 0) >= it.quantidade;
        const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
        mapaCheck[it.id] = !jaDevolvido && pendente > 0;
        mapaQtd[it.id] = pendente;
        mapaDisparos[it.id] = 0;
      });

      setItensDevolvidos(mapaCheck);
      setQuantidadesDevolvidas(mapaQtd);
      setDisparosPorItem(mapaDisparos);
      setHouveDisparos(false);
      setNumeroBO('');
      setSenhaMilitar('');
      setSenhaArmeiro('');
      setErroMsg(null);
      // Se a cautela já está em DEVOLUÇÃO PARCIAL, abre direto em modo parcial para facilitar
      if (retiradaAtual.status === 'DEVOLUÇÃO PARCIAL') {
        setModoDevolucao('PARCIAL');
      } else {
        setModoDevolucao('TOTAL');
      }
    }
  }, [retiradaAtual?.id]);

  const aplicarModoTotal = () => {
    if (!retiradaAtual) return;
    setModoDevolucao('TOTAL');
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
  };

  const aplicarModoParcial = () => {
    setModoDevolucao('PARCIAL');
  };

  const marcarTodosItens = () => {
    if (!retiradaAtual) return;
    const mapaCheck: Record<string, boolean> = {};
    const mapaQtd: Record<string, number> = {};
    retiradaAtual.itens.forEach((it) => {
      const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
      if (pendente > 0) {
        mapaCheck[it.id] = true;
        mapaQtd[it.id] = pendente;
      }
    });
    setItensDevolvidos(mapaCheck);
    setQuantidadesDevolvidas(mapaQtd);
  };

  const desmarcarTodosItens = () => {
    if (!retiradaAtual) return;
    const mapaCheck: Record<string, boolean> = {};
    const mapaQtd: Record<string, number> = {};
    retiradaAtual.itens.forEach((it) => {
      mapaCheck[it.id] = false;
      mapaQtd[it.id] = 0;
    });
    setItensDevolvidos(mapaCheck);
    setQuantidadesDevolvidas(mapaQtd);
  };

  const toggleItem = (id: string) => {
    setItensDevolvidos((prev) => {
      const novoChecked = !prev[id];
      const itemOriginal = retiradaAtual?.itens.find((i) => i.id === id);
      const pendente = itemOriginal
        ? Math.max(0, itemOriginal.quantidade - (itemOriginal.quantidadeDevolvida ?? 0) - (itemOriginal.quantidadeConsumida ?? 0))
        : 1;

      setQuantidadesDevolvidas((qPrev) => ({
        ...qPrev,
        [id]: novoChecked ? pendente : 0,
      }));

      return { ...prev, [id]: novoChecked };
    });
  };

  const handleQtdChange = (id: string, novaQtd: number, maxQtd: number) => {
    const qtdValida = Math.max(0, Math.min(novaQtd, maxQtd));
    setQuantidadesDevolvidas((prev) => ({ ...prev, [id]: qtdValida }));
    setItensDevolvidos((prev) => ({ ...prev, [id]: qtdValida > 0 }));
  };

  const handleDisparosQtdChange = (id: string, qtd: number, maxDisp: number) => {
    const qtdValida = Math.max(0, Math.min(qtd, maxDisp));
    setDisparosPorItem((prev) => ({ ...prev, [id]: qtdValida }));
  };

  // Cálculo de munições disparadas pelo militar
  const totalTirosDeflagrados = useMemo(() => {
    if (!houveDisparos || !retiradaAtual) return 0;
    let total = 0;
    retiradaAtual.itens.forEach((it) => {
      if (it.categoria === 'MUNIÇÃO') {
        const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
        const devAgora = itensDevolvidos[it.id] ? (quantidadesDevolvidas[it.id] ?? 0) : 0;
        const maxConsumo = Math.max(0, pendente - devAgora);
        const consumoInformado = disparosPorItem[it.id] || 0;
        total += Math.min(maxConsumo, consumoInformado);
      }
    });
    return total;
  }, [houveDisparos, retiradaAtual, itensDevolvidos, quantidadesDevolvidas, disparosPorItem]);

  // Contagem de itens que serão devolvidos nesta etapa
  const resumoItensDevolvendoAgora = useMemo(() => {
    if (!retiradaAtual) return { qtdItensTotal: 0, itensRecolhendo: [], itensFicandoNaRua: [] };

    const itensRecolhendo: string[] = [];
    const itensFicandoNaRua: string[] = [];
    let qtdItensTotal = 0;

    retiradaAtual.itens.forEach((it) => {
      const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
      if (pendente <= 0) return;

      const isMarcado = Boolean(itensDevolvidos[it.id]);
      const qtdDev = isMarcado
        ? (it.quantidade > 1 || it.categoria === 'MUNIÇÃO' ? Math.min(pendente, quantidadesDevolvidas[it.id] ?? pendente) : 1)
        : 0;

      const qtdTiros = houveDisparos && it.categoria === 'MUNIÇÃO'
        ? Math.min(Math.max(0, pendente - qtdDev), disparosPorItem[it.id] || 0)
        : 0;

      const saldoPermanecendo = Math.max(0, pendente - qtdDev - qtdTiros);

      if (qtdDev > 0) {
        itensRecolhendo.push(`${qtdDev}x ${it.materialNome} (${it.nArmamento || 'S/N'})`);
        qtdItensTotal += qtdDev;
      }
      if (saldoPermanecendo > 0) {
        itensFicandoNaRua.push(`${saldoPermanecendo}x ${it.materialNome} (${it.nArmamento || 'S/N'})`);
      }
    });

    return { qtdItensTotal, itensRecolhendo, itensFicandoNaRua };
  }, [retiradaAtual, itensDevolvidos, quantidadesDevolvidas, houveDisparos, disparosPorItem]);

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
      setErroMsg(`Senha do armeiro ${armeiroObj.nomeGuerra} incorreta (Padrão: admin ou 4669).`);
      return;
    }

    // Monta itens da conferência estritamente com base no que foi marcado para devolução
    const itensConferencia = retiradaAtual.itens.map((it) => {
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

      const foiMarcadoDevolver = Boolean(itensDevolvidos[it.id]);
      let qtdDevolvida = 0;
      if (foiMarcadoDevolver) {
        if (it.quantidade > 1 || it.categoria === 'MUNIÇÃO') {
          qtdDevolvida = Math.min(pendente, Math.max(1, quantidadesDevolvidas[it.id] ?? pendente));
        } else {
          qtdDevolvida = 1;
        }
      }

      let qtdConsumida = 0;
      if (houveDisparos && it.categoria === 'MUNIÇÃO') {
        const saldoAposDev = Math.max(0, pendente - qtdDevolvida);
        const consumoDesejado = disparosPorItem[it.id] || 0;
        qtdConsumida = Math.min(saldoAposDev, Math.max(0, consumoDesejado));
      }

      return {
        carrinhoId: it.id,
        quantidadeDevolvida: qtdDevolvida,
        quantidadeConsumida: qtdConsumida,
        motivoConsumo: qtdConsumida > 0 ? `Consumo/Disparos em Serviço - BO: ${numeroBO.trim() || 'NÃO INFORMADO'}` : undefined,
        estadoDevolucao: 'EXCELENTE' as EstadoConservacao,
        observacao: observacoes,
      };
    });

    const totalDevolvendoGeral = itensConferencia.reduce(
      (acc, i) => acc + i.quantidadeDevolvida + i.quantidadeConsumida,
      0
    );

    if (totalDevolvendoGeral === 0) {
      setErroMsg('Nenhum material selecionado para devolução. Marque ao menos um item ou especifique a quantidade a recolher.');
      return;
    }

    if (houveDisparos && totalTirosDeflagrados > 0 && !numeroBO.trim()) {
      setErroMsg('É obrigatório informar o número do Boletim de Ocorrência (BO) para justificar as munições disparadas em serviço.');
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
        houveDisparos: houveDisparos && totalTirosDeflagrados > 0,
        numeroBoletimOcorrencia: numeroBO.trim() || undefined,
        observacoesGerais: observacoes.trim() || undefined,
        itensConferencia,
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
            Nenhuma cautela aberta pendente de devolução no momento. Todos os materiais estão no armorial.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Retiradas em Aberto */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
              <span>RETIRADAS EM ABERTO ({retiradasNaRua.length})</span>
              <span className="text-[10px] text-[#7eb864] bg-[#142616] px-2 py-0.5 border border-[#233f25] rounded">
                NA RUA
              </span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {retiradasNaRua.map((ret) => {
                const isSelected = ret.id === retiradaAtual?.id;
                const pendentesCount = ret.itens.filter(
                  (it) => (it.quantidadeDevolvida ?? 0) < it.quantidade
                ).length;
                const isParcial = ret.status === 'DEVOLUÇÃO PARCIAL' || ret.itens.some((it) => (it.quantidadeDevolvida ?? 0) > 0);

                return (
                  <div
                    key={ret.id}
                    onClick={() => setSelectedRetiradaId(ret.id)}
                    className={`p-3 rounded-sm border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-[#182218] border-[#638555] text-white shadow-sm ring-1 ring-[#7eb864]/50'
                        : 'bg-[#0c110d] border-[#232f22] text-[#7a8c7b] hover:border-[#334232] hover:text-[#e2e8e2]'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-bold uppercase truncate flex items-center gap-1.5">
                        <span>{ret.numeroCautela || ret.id}</span>
                        <span className="text-[#a4b5a3] font-normal">— {ret.militarServicoPatente} {ret.militarServicoGuerra}</span>
                      </div>
                      <div className="text-[10px] text-[#7a8c7b]">
                        {pendentesCount} de {ret.itens.length} material(is) ainda com o militar
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {ret.status === 'DEVOLUÇÃO PARCIAL' ? (
                        <span className="text-[9px] font-bold text-[#f59e0b] bg-[#291b0c] border border-[#854d0e] px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          DEV. PARCIAL
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#e5a93c] border border-[#d4a34b] px-1.5 py-0.5 uppercase">
                          ● {ret.status}
                        </span>
                      )}
                      {isParcial && ret.status !== 'DEVOLUÇÃO PARCIAL' && (
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
            <div className="flex items-center justify-between text-xs font-bold text-[#8d9f8e] uppercase tracking-wider">
              <span>FICHA DE CONFERÊNCIA E RECEBIMENTO</span>
              {retiradaAtual?.status === 'DEVOLUÇÃO PARCIAL' && (
                <span className="text-[10px] font-bold text-[#f59e0b] bg-[#291b0c] border border-[#854d0e] px-2 py-0.5 rounded">
                  CAUTELA EM DEVOLUÇÃO PARCIAL
                </span>
              )}
            </div>

            {retiradaAtual && (
              <div className="bg-[#101610] border border-[#232f22] p-5 rounded-sm space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-[#1f281e] pb-3">
                  <div>
                    <div className="text-[10px] text-[#7a8c7b] uppercase font-bold flex items-center gap-1.5">
                      <span>CAUTELA:</span>
                      <span className="text-[#86efac]">{retiradaAtual.numeroCautela || retiradaAtual.id}</span>
                    </div>
                    <div className="text-base font-bold text-white uppercase mt-0.5">
                      {retiradaAtual.militarServicoPatente} {retiradaAtual.militarServicoGuerra} ({retiradaAtual.militarServicoNome})
                    </div>
                    <div className="text-[11px] text-[#7a8c7b] mt-0.5 flex items-center gap-2">
                      <span>RE: {retiradaAtual.militarServicoMatricula}</span>
                      <span>•</span>
                      <span>Saída em {formatDataHora(retiradaAtual.dataSaida)} ({formatTempoDecorrido(retiradaAtual.dataSaida)})</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="border border-[#d4a34b] text-[#e5a93c] px-2 py-0.5 text-[10px] font-bold uppercase">
                      {retiradaAtual.status}
                    </span>
                    {retiradaAtual.status === 'DEVOLUÇÃO PARCIAL' && (
                      <span className="text-[9px] font-bold text-[#f59e0b] bg-[#291b0c] border border-[#854d0e] px-1.5 py-0.5 rounded uppercase">
                        PARTE JÁ ENTREGUE
                      </span>
                    )}
                  </div>
                </div>

                {/* Histórico Detalhado de Devoluções Anteriores nesta Cautela */}
                {retiradaAtual.historicoDevolucoes && retiradaAtual.historicoDevolucoes.length > 0 && (
                  <div className="bg-[#121c13] border border-[#2b542a] p-3 rounded text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-[#86efac] uppercase text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[#86efac]" />
                      <span>DEVOLUÇÕES ANTERIORES JÁ REGISTRADAS NESTA CAUTELA:</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-[#c3dec0]">
                      {retiradaAtual.historicoDevolucoes.map((dev, idx) => (
                        <div
                          key={dev.id || idx}
                          className="bg-[#0b120c] p-2.5 rounded border border-[#1e331c] space-y-1"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <span className="text-white font-bold">{idx + 1}ª Devolução ({dev.tipoDevolucao}):</span> recebida por{' '}
                              <span className="text-[#86efac] font-bold">{dev.armeiroRecebedorPatente} {dev.armeiroRecebedorNome}</span> em{' '}
                              {formatDataHora(dev.dataHora)}
                            </div>
                            <span className="text-[9px] text-[#7eb864] bg-[#142616] px-1.5 py-0.5 rounded border border-[#2b542a]">
                              ✓ CONCLUÍDA
                            </span>
                          </div>
                          <div className="text-[10px] text-[#9eb29b] bg-[#141d14] px-2 py-1 rounded">
                            <strong className="text-white">Materiais recebidos nesta entrega: </strong>
                            {dev.itensDevolvidos?.map((it) => `${it.quantidadeDevolvida}x ${it.materialNome} (${it.nArmamento || 'S/N'})`).join(' | ')}
                          </div>
                          {dev.materiaisSaldoPendenteResumo && (
                            <div className="text-[10px] text-amber-300">
                              <strong>Saldo restante que permaneceu na rua: </strong>
                              {dev.materiaisSaldoPendenteResumo}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seletores de Modo: Total vs Parcial */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#8d9f8e] uppercase flex items-center justify-between">
                    <span>TIPO DE DEVOLUÇÃO A REALIZAR:</span>
                    <span className="text-[10px] text-[#7a8c7b]">Escolha o modo desejado:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={aplicarModoTotal}
                      className={`p-2.5 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        modoDevolucao === 'TOTAL'
                          ? 'bg-[#1b3319] border-[#4a7244] text-white shadow-sm ring-1 ring-[#7eb864]'
                          : 'bg-[#0c110d] border-[#232f22] text-[#7a8c7b] hover:border-[#384937] hover:text-[#d1ddd1]'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4 text-[#7eb864]" />
                      <span>DEVOLUÇÃO TOTAL (100%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={aplicarModoParcial}
                      className={`p-2.5 rounded text-xs font-bold uppercase flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        modoDevolucao === 'PARCIAL'
                          ? 'bg-[#291b0c] border-[#854d0e] text-[#fcd34d] shadow-sm ring-1 ring-[#f59e0b]'
                          : 'bg-[#0c110d] border-[#232f22] text-[#7a8c7b] hover:border-[#4d3a24] hover:text-[#fcd34d]'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>DEVOLUÇÃO PARCIAL (SELEÇÃO)</span>
                    </button>
                  </div>

                  {modoDevolucao === 'PARCIAL' && (
                    <div className="p-2.5 bg-[#1f160b] border border-[#694819] rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                        <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Marque apenas os itens que estão sendo entregues agora. Os outros continuarão acautelados.</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={marcarTodosItens}
                          className="px-2 py-0.5 bg-[#2c1d0d] hover:bg-[#3d2a13] text-amber-300 border border-[#5a3c18] rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Marcar Todos
                        </button>
                        <button
                          type="button"
                          onClick={desmarcarTodosItens}
                          className="px-2 py-0.5 bg-[#2c1d0d] hover:bg-[#3d2a13] text-amber-300 border border-[#5a3c18] rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Desmarcar Todos
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Materiais da Cautela */}
                <div className="bg-[#0c110d] border border-[#232f22] p-3 rounded-sm space-y-2.5">
                  <div className="text-[10px] font-bold text-[#7a8c7b] uppercase tracking-wider mb-1">
                    CONFERÊNCIA DOS MATERIAIS DESTA CAUTELA:
                  </div>

                  {retiradaAtual.itens.map((item) => {
                    const isJaRecolhido = (item.quantidadeDevolvida ?? 0) >= item.quantidade;
                    const pendente = Math.max(0, item.quantidade - (item.quantidadeDevolvida ?? 0) - (item.quantidadeConsumida ?? 0));

                    // Se já foi 100% devolvido em entregas anteriores:
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

                    const isChecked = Boolean(itensDevolvidos[item.id]);
                    const isMultiplo = item.quantidade > 1 || item.categoria === 'MUNIÇÃO';
                    const qtdDev = isChecked
                      ? (isMultiplo ? Math.min(pendente, Math.max(1, quantidadesDevolvidas[item.id] ?? pendente)) : 1)
                      : 0;
                    const saldoFicaNaRua = Math.max(0, pendente - qtdDev);

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-sm border transition-colors gap-2 ${
                          isChecked
                            ? 'bg-[#131b13] border-[#293828] text-white'
                            : 'bg-[#0f0e0c] border-[#2b2416] text-[#8c826e]'
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
                            <span className={`font-bold uppercase text-xs mr-2 ${isChecked ? 'text-white' : 'text-amber-200'}`}>
                              {item.materialNome}
                            </span>
                            <span className="text-[#7a8c7b] text-[11px]">
                              #{item.nArmamento}
                            </span>
                            {(item.quantidadeDevolvida ?? 0) > 0 && (
                              <span className="text-[10px] text-[#7eb864] ml-2 font-mono">
                                ({item.quantidadeDevolvida} un já entregue anteriormente)
                              </span>
                            )}
                          </div>
                        </label>

                        {/* Controles de Quantidade */}
                        {isMultiplo ? (
                          <div className="flex items-center gap-2 pl-7 sm:pl-0 flex-shrink-0">
                            {isChecked ? (
                              <div className="flex items-center bg-[#0a0f0b] border border-[#232f22] rounded px-2 py-1">
                                <span className="text-[10px] text-[#7a8c7b] uppercase mr-1.5">Devolver:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={pendente}
                                  value={qtdDev}
                                  onChange={(e) => handleQtdChange(item.id, parseInt(e.target.value, 10) || 0, pendente)}
                                  className="w-14 bg-[#141c14] border border-[#344433] px-1.5 py-0.5 text-center text-xs font-bold text-white rounded focus:outline-none focus:border-[#7eb864]"
                                />
                                <span className="text-[10px] text-[#7a8c7b] ml-1">/ {pendente} un</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-[#241a0d] border border-[#523916] px-2 py-0.5 rounded">
                                ● Permanece na rua ({pendente} un)
                              </span>
                            )}

                            {isChecked && saldoFicaNaRua > 0 && (
                              <span className="text-[10px] font-bold text-amber-300 bg-[#291b0c] border border-[#6b4718] px-1.5 py-0.5 rounded">
                                +{saldoFicaNaRua} un ficará na rua
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center text-[10px] pl-7 sm:pl-0 flex-shrink-0">
                            {isChecked ? (
                              <span className="text-[#86efac] font-bold bg-[#142616] border border-[#2b542a] px-2 py-0.5 rounded">
                                ✓ Devolver agora (1 un)
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold bg-[#291b0c] border border-[#854d0e] px-2 py-0.5 rounded">
                                ● Permanece com o militar
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Painel Informativo do Resumo do que está sendo Devolvido */}
                <div className="p-3 bg-[#0d140e] border border-[#1f3321] rounded text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-[#86efac] uppercase flex items-center justify-between">
                    <span>RESUMO DESTA OPERAÇÃO:</span>
                    <span>
                      {resumoItensDevolvendoAgora.itensFicandoNaRua.length > 0 ? (
                        <span className="text-amber-400 font-bold bg-[#27190b] px-2 py-0.5 rounded border border-[#6b4718]">
                          DEVOLUÇÃO PARCIAL
                        </span>
                      ) : (
                        <span className="text-[#86efac] font-bold bg-[#142616] px-2 py-0.5 rounded border border-[#2b542a]">
                          DEVOLUÇÃO TOTAL (ENCERRAMENTO)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#b4ccb2]">
                    <strong>Recolhendo ao estoque agora: </strong>
                    {resumoItensDevolvendoAgora.itensRecolhendo.length > 0 ? (
                      resumoItensDevolvendoAgora.itensRecolhendo.join(' | ')
                    ) : (
                      <span className="text-red-400">Nenhum item marcado!</span>
                    )}
                  </div>

                  {resumoItensDevolvendoAgora.itensFicandoNaRua.length > 0 && (
                    <div className="text-[11px] text-amber-300">
                      <strong>Permanecerá na rua sob responsabilidade do militar: </strong>
                      {resumoItensDevolvendoAgora.itensFicandoNaRua.join(' | ')}
                    </div>
                  )}
                </div>

                {/* Opção Específica para Disparos / Consumo de Munições */}
                <div className="p-3 bg-[#111612] border border-[#223324] rounded text-xs space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={houveDisparos}
                      onChange={(e) => setHouveDisparos(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#131913] border-[#2f3f2e] text-[#638555] accent-[#e5a93c]"
                    />
                    <span className="text-xs font-bold uppercase text-[#e5a93c]">
                      Houve disparos em serviço ou munições deflagradas/consumidas?
                    </span>
                  </label>

                  {houveDisparos && (
                    <div className="space-y-3 pt-2 border-t border-[#3d2f1a] bg-[#1a140c] p-3 rounded">
                      <p className="text-[11px] text-[#cfb78f]">
                        Especifique a quantidade de munições consumidas/disparadas e o número do Boletim de Ocorrência:
                      </p>

                      <div className="space-y-2">
                        {retiradaAtual.itens
                          .filter((it) => it.categoria === 'MUNIÇÃO')
                          .map((it) => {
                            const pendente = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
                            const devAgora = itensDevolvidos[it.id] ? (quantidadesDevolvidas[it.id] ?? 0) : 0;
                            const maxConsumo = Math.max(0, pendente - devAgora);

                            return (
                              <div key={it.id} className="flex items-center justify-between text-xs bg-[#0f0c08] p-2 rounded border border-[#4d3615]">
                                <span className="text-white font-bold">{it.materialNome}:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#bda176]">Disparadas:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxConsumo}
                                    value={disparosPorItem[it.id] || 0}
                                    onChange={(e) => handleDisparosQtdChange(it.id, parseInt(e.target.value, 10) || 0, maxConsumo)}
                                    className="w-16 bg-[#1a140c] border border-[#7a5522] px-1.5 py-0.5 text-center text-xs font-bold text-white rounded"
                                  />
                                  <span className="text-[10px] text-[#8f7a5b]">máx: {maxConsumo}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>

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
                            HISTÓRICO DA OCORRÊNCIA
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Disparos em confronto / ocorrência"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="w-full bg-[#0c110d] border border-[#593d18] px-2.5 py-1.5 text-xs text-white rounded focus:outline-none focus:border-[#e5a93c]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assinaturas Digitais: Militar e Armeiro */}
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
                      ARMEIRO RECEBEDOR DESTA ENTREGA
                    </label>
                    <select
                      value={armeiroId}
                      onChange={(e) => setArmeiroId(e.target.value)}
                      className="w-full bg-[#0c110d] border border-[#232f22] px-2 py-1 text-xs text-white rounded focus:outline-none"
                    >
                      {armeiros.map((arm) => (
                        <option key={arm.id} value={arm.id}>
                          {arm.patente} {arm.nomeGuerra} ({arm.funcao || 'Armeiro'})
                        </option>
                      ))}
                    </select>

                    <input
                      type="password"
                      value={senhaArmeiro}
                      onChange={(e) => setSenhaArmeiro(e.target.value)}
                      placeholder="Senha Armeiro (admin ou 4669)"
                      className="w-full bg-[#0c110d] border border-[#232f22] px-2 py-1 text-xs text-white rounded mt-1 focus:outline-none"
                    />
                  </div>
                </div>

                {erroMsg && (
                  <div className="p-2.5 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{erroMsg}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#1f281e]">
                  <button
                    onClick={handleConfirmarDevolucao}
                    disabled={isProcessando}
                    className={`w-full py-3 px-4 rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      resumoItensDevolvendoAgora.itensFicandoNaRua.length > 0
                        ? 'bg-[#3b2713] hover:bg-[#4d3319] text-[#fcd34d] border border-[#6b4718]'
                        : 'bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630]'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {resumoItensDevolvendoAgora.itensFicandoNaRua.length > 0
                        ? 'CONFIRMAR DEVOLUÇÃO PARCIAL (MANTER SALDO NA RUA) →'
                        : 'CONFIRMAR DEVOLUÇÃO TOTAL (ENCERRAR CAUTELA) →'}
                    </span>
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
