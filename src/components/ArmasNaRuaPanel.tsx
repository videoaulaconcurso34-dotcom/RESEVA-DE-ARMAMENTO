import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Edit3,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Boxes,
  Users,
  X,
} from 'lucide-react';
import { Retirada, ItemEstoque, MilitarReserva, StatusRetirada, CategoriaMaterial } from '../types';
import { HeaderBar } from './HeaderBar';
import { db } from '../services/db';
import { dispararAutoSyncSupabase } from '../services/supabase';
import { ModalEditarPedidoEmEspera } from './ModalEditarPedidoEmEspera';

interface ArmasNaRuaPanelProps {
  retiradasNaRua: Retirada[];
  todasRetiradas?: Retirada[];
  estoque: ItemEstoque[];
  armeiroAtivo?: MilitarReserva | null;
  onAtualizar?: () => void;
  onOpenDevolucao: (retiradaId: string) => void;
  onVisualizarTermo?: (retirada: Retirada) => void;
  onOpenNovaCautela: () => void;
}

interface ItemMilitarDetalhe {
  militarNome: string;
  militarGuerra: string;
  militarPatente: string;
  militarMatricula: string;
  batalhao: string;
  cautelaNumero: string;
  dataSaida: string;
  status: StatusRetirada;
  quantidade: number;
  nArmamento: string;
  calibre?: string;
}

interface MaterialAgrupado {
  chave: string;
  nomeModelo: string;
  categoria: CategoriaMaterial | string;
  calibre: string;
  totalQuantidade: number;
  distribuicaoStatus: Record<string, number>;
  militares: ItemMilitarDetalhe[];
}

const STATUS_CONFIG: Array<{
  id: StatusRetirada;
  label: string;
  textColor: string;
  borderColor: string;
  activeBg: string;
  inactiveBg: string;
  dotColor: string;
}> = [
  {
    id: 'EM SERVIÇO',
    label: 'EM SERVIÇO',
    textColor: 'text-[#a7cba3]',
    borderColor: 'border-[#385334]',
    activeBg: 'bg-[#182717]',
    inactiveBg: 'bg-[#0f1510]',
    dotColor: 'bg-[#7eb864]',
  },
  {
    id: 'MISSÃO',
    label: 'MISSÃO',
    textColor: 'text-[#e5b25d]',
    borderColor: 'border-[#664b20]',
    activeBg: 'bg-[#2b1f0f]',
    inactiveBg: 'bg-[#14100c]',
    dotColor: 'bg-[#e5a93c]',
  },
  {
    id: 'CAUTELADO',
    label: 'CAUTELADO',
    textColor: 'text-[#c2b3e5]',
    borderColor: 'border-[#513e73]',
    activeBg: 'bg-[#211a2f]',
    inactiveBg: 'bg-[#120e1a]',
    dotColor: 'bg-[#9f85d8]',
  },
  {
    id: 'EM ESPERA',
    label: 'EM ESPERA',
    textColor: 'text-[#f5a3a3]',
    borderColor: 'border-[#6b2a2a]',
    activeBg: 'bg-[#291313]',
    inactiveBg: 'bg-[#140b0b]',
    dotColor: 'bg-red-400',
  },
  {
    id: 'DEVOLVIDO',
    label: 'DEVOLVIDO',
    textColor: 'text-[#94a3b8]',
    borderColor: 'border-[#334155]',
    activeBg: 'bg-[#17202e]',
    inactiveBg: 'bg-[#0d121a]',
    dotColor: 'bg-slate-400',
  },
];

export const ArmasNaRuaPanel: React.FC<ArmasNaRuaPanelProps> = ({
  retiradasNaRua,
  todasRetiradas,
  estoque,
  armeiroAtivo,
  onAtualizar,
  onOpenDevolucao,
  onOpenNovaCautela,
}) => {
  const [statusSelecionados, setStatusSelecionados] = useState<StatusRetirada[]>([
    'EM SERVIÇO',
    'MISSÃO',
  ]);

  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [buscaMaterial, setBuscaMaterial] = useState<string>('');
  const [materialModalDetalhes, setMaterialModalDetalhes] = useState<MaterialAgrupado | null>(null);

  const [searchTermFichas, setSearchTermFichas] = useState('');
  const [senhaArmeiroModal, setSenhaArmeiroModal] = useState<string>('');
  const [pedidoAutorizandoId, setPedidoAutorizandoId] = useState<string | null>(null);
  const [erroAutorizacao, setErroAutorizacao] = useState<string | null>(null);
  const [pedidoEmEdicao, setPedidoEmEdicao] = useState<Retirada | null>(null);

  const agora = Date.now();

  const fonteRetiradas = useMemo(() => {
    if (todasRetiradas && todasRetiradas.length > 0) return todasRetiradas;
    return db.getRetiradas();
  }, [todasRetiradas]);

  const pedidosEmEspera = useMemo(() => {
    return fonteRetiradas.filter((r) => r.status === 'EM ESPERA');
  }, [fonteRetiradas]);

  const handleConfirmarAutorizacao = (pedidoId: string) => {
    setErroAutorizacao(null);
    if (!armeiroAtivo) {
      setErroAutorizacao('Selecione o armeiro ativo.');
      return;
    }
    if (!senhaArmeiroModal.trim()) {
      setErroAutorizacao('Digite a senha do armeiro para autorizar.');
      return;
    }

    try {
      db.autorizarPedidoPeloArmeiro({
        retiradaId: pedidoId,
        armeiroId: armeiroAtivo.id,
        senhaArmeiro: senhaArmeiroModal.trim(),
      });
      dispararAutoSyncSupabase(() => ({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      }));
      setPedidoAutorizandoId(null);
      setSenhaArmeiroModal('');
      if (onAtualizar) onAtualizar();
    } catch (err: any) {
      setErroAutorizacao(err.message || 'Erro ao autorizar pedido.');
    }
  };

  const handleRecusarPedido = (pedidoId: string) => {
    if (!window.confirm('Deseja realmente recusar e cancelar esta solicitação em espera?')) return;
    try {
      db.recusarPedidoEmEspera(pedidoId, 'Cancelado pelo Armeiro de Plantão');
      dispararAutoSyncSupabase(() => ({
        militares: db.getMilitares(),
        armeiros: db.getArmeiros(),
        estoque: db.getEstoque(),
        retiradas: db.getRetiradas(),
        auditoria: db.getAuditoria(),
      }));
      if (onAtualizar) onAtualizar();
    } catch (err: any) {
      alert(err.message || 'Erro ao recusar pedido.');
    }
  };

  const handleToggleStatus = (statusId: StatusRetirada) => {
    setStatusSelecionados((prev) => {
      if (prev.includes(statusId)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  const aplicarPreset = (tipo: 'MISSAO_SERVICO' | 'TODOS_EMPENHADOS' | 'TODOS' | 'LIMPAR') => {
    if (tipo === 'MISSAO_SERVICO') {
      setStatusSelecionados(['EM SERVIÇO', 'MISSÃO']);
    } else if (tipo === 'TODOS_EMPENHADOS') {
      setStatusSelecionados(['EM SERVIÇO', 'MISSÃO', 'CAUTELADO']);
    } else if (tipo === 'TODOS') {
      setStatusSelecionados([
        'EM SERVIÇO',
        'MISSÃO',
        'CAUTELADO',
        'EM ESPERA',
        'DEVOLVIDO',
      ]);
    } else if (tipo === 'LIMPAR') {
      setStatusSelecionados(['EM SERVIÇO']);
    }
  };

  const contagemGeralPorStatus = useMemo(() => {
    const mapa: Record<string, { cautelas: number; itens: number }> = {};
    for (const conf of STATUS_CONFIG) {
      mapa[conf.id] = { cautelas: 0, itens: 0 };
    }

    for (const r of fonteRetiradas) {
      if (!mapa[r.status]) {
        mapa[r.status] = { cautelas: 0, itens: 0 };
      }
      mapa[r.status].cautelas += 1;

      for (const it of r.itens) {
        let qtd = 0;
        if (r.status === 'DEVOLVIDO') {
          qtd = it.quantidadeDevolvida || it.quantidade;
        } else {
          qtd = Math.max(0, it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0));
          if (qtd === 0 && (r.status === 'EM ESPERA' || r.status === 'SEPARANDO')) {
            qtd = it.quantidade;
          }
        }
        mapa[r.status].itens += qtd;
      }
    }
    return mapa;
  }, [fonteRetiradas]);

  const materiaisAgrupados = useMemo(() => {
    const mapa = new Map<string, MaterialAgrupado>();
    const retiradasNoFiltro = fonteRetiradas.filter((r) => statusSelecionados.includes(r.status));

    for (const r of retiradasNoFiltro) {
      for (const it of r.itens) {
        let qtd = 0;
        if (r.status === 'DEVOLVIDO') {
          qtd = it.quantidadeDevolvida || it.quantidade;
        } else {
          qtd = it.quantidade - (it.quantidadeDevolvida ?? 0) - (it.quantidadeConsumida ?? 0);
          if (qtd <= 0 && (r.status === 'EM ESPERA' || r.status === 'SEPARANDO')) {
            qtd = it.quantidade;
          }
        }

        if (qtd <= 0) continue;

        const estItem = estoque.find((e) => e.id === it.estoqueId || e.nMaterial === it.nArmamento);
        const nomeModelo = it.materialNome.trim();
        const categoria = it.categoria || estItem?.categoria || 'ARMAMENTO';
        const calibre = it.calibre || estItem?.calibre || '';

        const chave = `${categoria}:::${nomeModelo.toLowerCase()}`;

        if (!mapa.has(chave)) {
          mapa.set(chave, {
            chave,
            nomeModelo,
            categoria,
            calibre,
            totalQuantidade: 0,
            distribuicaoStatus: {},
            militares: [],
          });
        }

        const registro = mapa.get(chave)!;
        registro.totalQuantidade += qtd;
        registro.distribuicaoStatus[r.status] = (registro.distribuicaoStatus[r.status] || 0) + qtd;

        registro.militares.push({
          militarNome: r.militarServicoNome,
          militarGuerra: r.militarServicoGuerra,
          militarPatente: r.militarServicoPatente,
          militarMatricula: r.militarServicoMatricula,
          batalhao: r.militarServicoBatalhao || 'Unidade Operacional',
          cautelaNumero: r.numeroCautela || r.id,
          dataSaida: r.dataSaida,
          status: r.status,
          quantidade: qtd,
          nArmamento: it.nArmamento,
          calibre: it.calibre,
        });
      }
    }

    let lista = Array.from(mapa.values());

    if (filtroCategoria !== 'TODAS') {
      lista = lista.filter((m) => m.categoria === filtroCategoria);
    }

    if (buscaMaterial.trim()) {
      const q = buscaMaterial.toLowerCase();
      lista = lista.filter(
        (m) =>
          m.nomeModelo.toLowerCase().includes(q) ||
          m.calibre.toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q)
      );
    }

    return lista.sort((a, b) => b.totalQuantidade - a.totalQuantidade);
  }, [fonteRetiradas, statusSelecionados, estoque, filtroCategoria, buscaMaterial]);

  const totalGeralUnidadesAcumuladas = useMemo(() => {
    return materiaisAgrupados.reduce((acc, m) => acc + m.totalQuantidade, 0);
  }, [materiaisAgrupados]);

  const fichasFiltradas = useMemo(() => {
    let lista = fonteRetiradas.filter((r) => statusSelecionados.includes(r.status));

    if (searchTermFichas.trim()) {
      const q = searchTermFichas.toLowerCase();
      lista = lista.filter((r) => {
        const matchMilitar =
          r.militarServicoNome.toLowerCase().includes(q) ||
          r.militarServicoGuerra.toLowerCase().includes(q) ||
          r.militarServicoMatricula.toLowerCase().includes(q) ||
          r.numeroCautela.toLowerCase().includes(q) ||
          r.motivoDetalhado.toLowerCase().includes(q);

        const matchItem = r.itens.some(
          (i) =>
            i.materialNome.toLowerCase().includes(q) ||
            i.nArmamento.toLowerCase().includes(q) ||
            (i.calibre && i.calibre.toLowerCase().includes(q))
        );

        return matchMilitar || matchItem;
      });
    }

    return lista;
  }, [fonteRetiradas, statusSelecionados, searchTermFichas]);

  const formatTempoDecorrido = (dataIso: string) => {
    const diffMs = Math.max(0, agora - new Date(dataIso).getTime());
    const totalMinutos = Math.floor(diffMs / (1000 * 60));
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    return `há ${horas}h${String(mins).padStart(2, '0')}min`;
  };

  const formatDataHoraMilitar = (dataIso: string) => {
    const d = new Date(dataIso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear()).slice(2);
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano}, ${hora}:${min}`;
  };

  return (
    <div className="space-y-6 font-mono">
      <HeaderBar title="PAINEL — MATERIAL EMPENHADO" />

      {/* SEGMENTADOR DE DADOS */}
      <div className="bg-[#101610] border-2 border-[#2b3a28] rounded-sm p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2a1d] pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#e5a93c]" />
            <h2 className="text-xs font-bold text-[#d8e6d5] uppercase tracking-wider">
              SEGMENTADOR DE DADOS — FILTRO DINÂMICO DE STATUS
            </h2>
            <span className="px-2 py-0.5 bg-[#172418] border border-[#2e472a] text-[#a7cba3] text-[10px] font-bold rounded">
              {statusSelecionados.length} SELECIONADO(S)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-[#6d7e6c] uppercase font-bold mr-1">Atalhos:</span>
            <button
              type="button"
              onClick={() => aplicarPreset('MISSAO_SERVICO')}
              className={`px-2 py-1 border rounded transition-all font-bold uppercase cursor-pointer ${
                statusSelecionados.length === 2 &&
                statusSelecionados.includes('MISSÃO') &&
                statusSelecionados.includes('EM SERVIÇO')
                  ? 'bg-[#293623] border-[#567a4c] text-white shadow-sm'
                  : 'bg-[#141b14] border-[#253323] text-[#93a791] hover:bg-[#1d261d]'
              }`}
            >
              Missão + Em Serviço
            </button>

            <button
              type="button"
              onClick={() => aplicarPreset('TODOS_EMPENHADOS')}
              className="px-2 py-1 bg-[#141b14] hover:bg-[#1d261d] border border-[#253323] text-[#93a791] rounded font-bold uppercase transition-all cursor-pointer"
            >
              Todos Empenhados
            </button>

            <button
              type="button"
              onClick={() => aplicarPreset('TODOS')}
              className="px-2 py-1 bg-[#141b14] hover:bg-[#1d261d] border border-[#253323] text-[#93a791] rounded font-bold uppercase transition-all cursor-pointer"
            >
              Selecionar Todos
            </button>

            <button
              type="button"
              onClick={() => aplicarPreset('LIMPAR')}
              className="px-2 py-1 bg-[#181515] hover:bg-[#251d1d] border border-[#3d2727] text-[#c78888] rounded font-bold uppercase transition-all cursor-pointer"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {STATUS_CONFIG.map((conf) => {
            const isSelected = statusSelecionados.includes(conf.id);
            const dadosStatus = contagemGeralPorStatus[conf.id] || { cautelas: 0, itens: 0 };

            return (
              <button
                key={conf.id}
                type="button"
                onClick={() => handleToggleStatus(conf.id)}
                className={`p-2.5 rounded-sm border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                  isSelected
                    ? `${conf.activeBg} ${conf.borderColor} shadow-sm ring-1 ring-[#527448]`
                    : `${conf.inactiveBg} border-[#1e281d] opacity-50 hover:opacity-85`
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${conf.dotColor}`} />
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isSelected ? conf.textColor : 'text-[#7a8c7b]'
                      }`}
                    >
                      {conf.label}
                    </span>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#7eb864]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[#425440]" />
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-1 text-[10px]">
                  <span className="text-[#6f826e]">Qtd. Itens:</span>
                  <span
                    className={`font-mono font-bold ${
                      isSelected ? 'text-white text-xs' : 'text-[#7a8c7b]'
                    }`}
                  >
                    {dadosStatus.itens} und
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#1a2419] text-xs text-[11px] text-[#9eb29c]">
          <span className="text-[10px] text-[#6e806c] uppercase font-bold">Filtro Ativo:</span>
          {statusSelecionados.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 bg-[#172318] border border-[#2b3e28] text-[#cde2ca] rounded text-[10px] font-bold uppercase"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* TABELA CONSOLIDADA DE MATERIAL EMPENHADO */}
      <div className="bg-[#101610] border border-[#232f22] rounded-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1f281e] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#e5a93c]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                QUANTITATIVO CONSOLIDADO POR MATERIAL / MODELO
              </h3>
            </div>
            <p className="text-[11px] text-[#7a8c7b] mt-0.5">
              Total acumulado somando todos os lotes e números de série com base nos status selecionados acima.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7a8c7b] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar modelo (ex: Glock, IA2, TS9)..."
                value={buscaMaterial}
                onChange={(e) => setBuscaMaterial(e.target.value)}
                className="bg-[#0c110d] border border-[#232f22] rounded px-2.5 pl-8 py-1.5 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439] w-48 sm:w-60"
              />
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-xs text-[#cfdfc7] focus:outline-none focus:border-[#425439]"
            >
              <option value="TODAS">Todas as Categorias</option>
              <option value="ARMAMENTO">Armamentos</option>
              <option value="MUNIÇÃO">Munições</option>
              <option value="CARREGADOR">Carregadores</option>
              <option value="PROTEÇÃO">Proteção Balística</option>
              <option value="ACESSÓRIOS">Acessórios</option>
              <option value="COMUNICAÇÃO">Comunicação</option>
            </select>
          </div>
        </div>

        {materiaisAgrupados.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7a8c7b] uppercase bg-[#0c110d] border border-[#1f281e] rounded">
            Nenhum material empenhado encontrado para os status selecionados (
            {statusSelecionados.join(', ')}).
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#1f281e] rounded">
            <table className="w-full text-left text-xs text-[#cfdfc7]">
              <thead className="bg-[#0c110d] text-[10px] text-[#7a8c7b] uppercase font-bold border-b border-[#1f281e] select-none">
                <tr>
                  <th className="py-2.5 px-3">Material / Modelo</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Distribuição por Status</th>
                  <th className="py-2.5 px-3 text-right">Total Acumulado</th>
                  <th className="py-2.5 px-3 text-center">Militares de Posse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182218]">
                {materiaisAgrupados.map((mat) => {
                  return (
                    <tr
                      key={mat.chave}
                      className="hover:bg-[#131b14] transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white text-sm">
                          {mat.nomeModelo}
                        </div>
                        {mat.calibre && (
                          <div className="text-[11px] text-[#7a8c7b]">
                            Calibre: {mat.calibre}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-[#141d15] border border-[#253526] text-[#93a791] text-[10px] font-bold rounded uppercase">
                          {mat.categoria}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Object.entries(mat.distribuicaoStatus).map(([st, qtd]) => {
                            const conf = STATUS_CONFIG.find((c) => c.id === st);
                            return (
                              <span
                                key={st}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  conf
                                    ? `${conf.activeBg} ${conf.borderColor} ${conf.textColor}`
                                    : 'bg-[#182218] border-[#2f3f2e] text-[#cfdfc7]'
                                }`}
                              >
                                <strong>{qtd} un</strong> em {st}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-baseline gap-1 px-3 py-1 bg-[#172218] border border-[#2d422a] rounded">
                          <span className="font-mono text-base font-bold text-[#e5a93c]">
                            {mat.totalQuantidade}
                          </span>
                          <span className="text-[10px] text-[#8d9f8e] uppercase font-bold">
                            und
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setMaterialModalDetalhes(mat)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#192318] hover:bg-[#253524] text-[#a7cba3] border border-[#2b3e29] rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        >
                          <Users className="w-3 h-3 text-[#7eb864]" />
                          <span>Ver {mat.militares.length} Registro(s)</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#0b100c] text-xs font-bold border-t border-[#232f22]">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-[#7a8c7b] uppercase">
                    Totalizador do Consolidado ({materiaisAgrupados.length} modelos de materiais)
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-sm text-[#e5a93c] font-mono">
                      {totalGeralUnidadesAcumuladas} und
                    </span>
                  </td>
                  <td className="py-3 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Seção de Pedidos Em Espera */}
      {pedidosEmEspera.length > 0 && statusSelecionados.includes('EM ESPERA') && (
        <div className="p-4 bg-[#141a12] border-2 border-[#3d5936] rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5a93c] animate-pulse" />
              <h3 className="text-xs font-bold text-[#d4e6cf] uppercase tracking-wider">
                SOLICITAÇÕES EM ESPERA DE LIBERAÇÃO ({pedidosEmEspera.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#8d9f8e] uppercase">
              Militar aguardando conferência no balcão
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pedidosEmEspera.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-[#0b100c] border border-[#273824] p-3 rounded space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-white uppercase">
                      {pedido.militarServicoPatente} {pedido.militarServicoGuerra}
                    </div>
                    <div className="text-[10px] text-[#7a8c7b]">
                      RE: {pedido.militarServicoMatricula} • {pedido.motivoDetalhado}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#262013] border border-[#594424] text-[#e5a93c] text-[10px] font-bold rounded">
                    EM ESPERA
                  </span>
                </div>

                <div className="border-t border-dashed border-[#1f281e] pt-1.5 text-[11px] text-[#a4b8a2] space-y-0.5">
                  <div className="font-bold text-[10px] text-[#6e826d] uppercase">Materiais Solicitados:</div>
                  {pedido.itens.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>• {it.materialNome}</span>
                      <span className="text-white font-mono">
                        {it.quantidade > 1 ? `${it.quantidade} un` : `#${it.nArmamento}`}
                      </span>
                    </div>
                  ))}
                </div>

                {pedidoAutorizandoId === pedido.id ? (
                  <div className="pt-2 border-t border-[#232f22] space-y-2">
                    <label className="block text-[10px] font-bold text-[#b7cbb5] uppercase">
                      Senha do Armeiro ({armeiroAtivo?.nomeGuerra || 'Plantão'}):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={senhaArmeiroModal}
                        onChange={(e) => setSenhaArmeiroModal(e.target.value)}
                        placeholder="Senha do armeiro..."
                        className="bg-[#080d09] border border-[#273824] rounded px-2.5 py-1 text-xs text-white focus:outline-none flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmarAutorizacao(pedido.id)}
                        className="px-3 py-1 bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] rounded text-xs font-bold uppercase cursor-pointer"
                      >
                        CONFIRMAR
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPedidoAutorizandoId(null);
                          setSenhaArmeiroModal('');
                          setErroAutorizacao(null);
                        }}
                        className="px-2 py-1 text-[#7a8c7b] hover:text-white text-xs uppercase cursor-pointer"
                      >
                        CANCELAR
                      </button>
                    </div>
                    {erroAutorizacao && (
                      <div className="text-[10px] text-red-400 font-bold">{erroAutorizacao}</div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#1f281e] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPedidoEmEdicao(pedido)}
                      className="px-2.5 py-1 bg-[#121812] hover:bg-[#1b241b] text-[#8d9f8e] hover:text-[#cde2ca] border border-[#232f22] rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      EDITAR ITENS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecusarPedido(pedido.id)}
                      className="px-2.5 py-1 bg-[#211414] hover:bg-[#2d1b1b] text-red-300 border border-[#4a2424] rounded text-[10px] font-bold uppercase cursor-pointer"
                    >
                      RECUSAR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPedidoAutorizandoId(pedido.id);
                        setSenhaArmeiroModal('');
                        setErroAutorizacao(null);
                      }}
                      className="px-3 py-1 bg-[#1f351e] hover:bg-[#2a4a29] text-[#bde0b5] border border-[#3a6137] rounded text-[10px] font-bold uppercase cursor-pointer"
                    >
                      AUTORIZAR & ENTREGAR
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FICHAS INDIVIDUAIS DE CAUTELA */}
      <div className="pt-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="text-xs font-bold text-[#8d9f8e] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#7eb864]" />
            <span>FICHAS INDIVIDUAIS DE CAUTELA — TEMPO REAL</span>
            <span className="text-[#e5a93c]">({fichasFiltradas.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#7a8c7b] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar militar, série ou cautela..."
                value={searchTermFichas}
                onChange={(e) => setSearchTermFichas(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 pl-8 py-1.5 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439]"
              />
            </div>

            <button
              onClick={onOpenNovaCautela}
              className="bg-[#2a3826] hover:bg-[#384b33] text-[#cfdfc7] border border-[#3e5337] px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">NOVA CAUTELA</span>
            </button>
          </div>
        </div>

        {fichasFiltradas.length === 0 ? (
          <div className="bg-[#101610] border border-[#232f22] p-8 text-center rounded-sm">
            <p className="text-xs text-[#7a8c7b] uppercase">
              {searchTermFichas
                ? 'Nenhuma cautela encontrada com esse filtro de busca.'
                : 'Nenhuma cautela encontrada para os status selecionados no segmentador.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fichasFiltradas.map((ret) => {
              const temParcial = ret.itens.some((it) => (it.quantidadeDevolvida ?? 0) > 0);
              const confStatus = STATUS_CONFIG.find((c) => c.id === ret.status);

              return (
                <div
                  key={ret.id}
                  className="bg-[#0f1510] border border-[#263327] rounded-sm p-4 text-xs space-y-2.5 transition-all hover:border-[#3d523b] shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-[#7a8c7b] uppercase font-bold tracking-wider">
                          {ret.numeroCautela || ret.id}
                        </div>
                        <div className="font-bold text-sm text-white uppercase mt-0.5">
                          {ret.militarServicoPatente} {ret.militarServicoGuerra}
                        </div>
                        <div className="text-[11px] text-[#7a8c7b] truncate max-w-[200px]">
                          {ret.militarServicoBatalhao || 'BATALHÃO OPERACIONAL'}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                            confStatus
                              ? `${confStatus.borderColor} ${confStatus.textColor} ${confStatus.activeBg}`
                              : 'border-[#d4a34b] text-[#e5a93c]'
                          }`}
                        >
                          {ret.status}
                        </span>

                        {temParcial && (
                          <span className="text-[9px] text-[#7eb864] font-bold border border-[#2a4d2c] bg-[#142616] px-1.5 py-0.5 rounded">
                            ● PARCIAL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-b border-dashed border-[#232f22] my-2.5" />

                    <div className="space-y-1.5 my-1">
                      {ret.itens.map((it) => {
                        const isRecolhido = (it.quantidadeDevolvida ?? 0) >= it.quantidade;
                        const pendente =
                          it.quantidade -
                          (it.quantidadeDevolvida ?? 0) -
                          (it.quantidadeConsumida ?? 0);

                        return (
                          <div
                            key={it.id}
                            className="flex items-baseline justify-between gap-2 text-xs"
                          >
                            <div className="truncate">
                              <span
                                className={
                                  isRecolhido
                                    ? 'line-through text-[#556956]'
                                    : 'text-white font-bold'
                                }
                              >
                                {it.materialNome}
                              </span>
                              {it.quantidade > 1 && (
                                <span className="text-[#a1b59f] font-normal ml-1">
                                  {isRecolhido ? `(x${it.quantidade})` : `(${pendente} pendente)`}
                                </span>
                              )}
                              {isRecolhido && (
                                <span className="ml-1.5 text-[9px] text-[#7eb864] font-semibold uppercase">
                                  ✓ Recolhido
                                </span>
                              )}
                            </div>
                            <div className="text-[#7a8c7b] text-[11px] font-mono flex-shrink-0">
                              #{it.nArmamento}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-b border-dashed border-[#232f22] my-2.5" />

                    <div className="text-[11px] text-[#7a8c7b] space-y-0.5">
                      <div>
                        Saída {formatDataHoraMilitar(ret.dataSaida)} • Armeiro:{' '}
                        <span className="text-[#a1b59f] font-semibold">
                          {ret.militarReservaNome.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[#e5a93c] font-bold">
                        {formatTempoDecorrido(ret.dataSaida)}
                      </div>
                    </div>
                  </div>

                  {ret.status !== 'DEVOLVIDO' && (
                    <div className="pt-2 border-t border-[#1f281e] flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenDevolucao(ret.id)}
                        className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-[#9bb88d]" />
                        Receber Devolução
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALHES NOMINAIS */}
      {materialModalDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono select-none">
          <div className="bg-[#0f1510] border-2 border-[#385334] rounded-sm max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 bg-[#141d15] border-b border-[#253526] flex items-start justify-between">
              <div>
                <div className="text-[10px] text-[#7a8c7b] uppercase font-bold tracking-wider">
                  DETALHAMENTO NOMINAL DE MATERIAL EMPENHADO
                </div>
                <h3 className="text-base font-bold text-white uppercase mt-0.5">
                  {materialModalDetalhes.nomeModelo}
                </h3>
                <div className="text-xs text-[#e5a93c] font-bold mt-0.5">
                  Total Acumulado no Filtro Atual: {materialModalDetalhes.totalQuantidade} und
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaterialModalDetalhes(null)}
                className="p-1 text-[#7a8c7b] hover:text-white hover:bg-[#1f2d20] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              <div className="text-[11px] text-[#7a8c7b] mb-2 uppercase font-bold">
                Relação de Policiais Militares de Posse ({materialModalDetalhes.militares.length} Registros):
              </div>

              <div className="space-y-2">
                {materialModalDetalhes.militares.map((m, idx) => {
                  const conf = STATUS_CONFIG.find((c) => c.id === m.status);
                  return (
                    <div
                      key={`${m.cautelaNumero}-${idx}`}
                      className="p-3 bg-[#0a0e0a] border border-[#212f22] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white uppercase">
                            {m.militarPatente} {m.militarGuerra}
                          </span>
                          <span className="text-xs text-[#7a8c7b]">
                            (RE: {m.militarMatricula})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8d9f8e]">
                          {m.batalhao} • Cautela: <strong className="text-white font-mono">{m.cautelaNumero}</strong>
                        </div>
                        <div className="text-[10px] text-[#6e806d] mt-0.5">
                          Saída: {formatDataHoraMilitar(m.dataSaida)} ({formatTempoDecorrido(m.dataSaida)})
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase ${
                            conf
                              ? `${conf.activeBg} ${conf.borderColor} ${conf.textColor}`
                              : 'bg-[#182218] border-[#2f3f2e] text-[#cfdfc7]'
                          }`}
                        >
                          {m.status}
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-[#e5a93c]">
                            {m.quantidade} und
                          </span>
                          {m.nArmamento && (
                            <span className="block text-[10px] text-[#7a8c7b] font-mono">
                              #{m.nArmamento}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-[#121912] border-t border-[#232f22] flex items-center justify-between">
              <span className="text-[11px] text-[#7a8c7b]">
                Conferido via Sistema SisReserva
              </span>
              <button
                type="button"
                onClick={() => setMaterialModalDetalhes(null)}
                className="px-4 py-1.5 bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] rounded text-xs font-bold uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {pedidoEmEdicao && (
        <ModalEditarPedidoEmEspera
          pedido={pedidoEmEdicao}
          estoque={estoque}
          onSalvar={() => {
            if (onAtualizar) onAtualizar();
          }}
          onClose={() => setPedidoEmEdicao(null)}
        />
      )}
    </div>
  );
};
