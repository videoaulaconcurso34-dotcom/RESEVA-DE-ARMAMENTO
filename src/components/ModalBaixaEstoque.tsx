import React, { useState, useMemo } from 'react';
import {
  ItemEstoque,
  MilitarReserva,
  RegistroBaixa,
} from '../types';
import { db } from '../services/db';
import {
  PackageMinus,
  X,
  Search,
  AlertTriangle,
  Shield,
  ArrowLeft,
} from 'lucide-react';

interface ModalBaixaEstoqueProps {
  isOpen: boolean;
  onClose: () => void;
  estoque: ItemEstoque[];
  armeiros: MilitarReserva[];
  armeiroAtivo?: MilitarReserva | null;
  onSucesso: () => void;
  baixaParaVisualizar?: RegistroBaixa | null;
}

const MOTIVOS_BAIXA_PADRAO = [
  'INSERVIBILIDADE / DESCARTE DEFINITIVO (DANO IRREPARÁVEL)',
  'TRANSFERÊNCIA DE CARGA PATRIMONIAL (OUTRA UNIDADE / OPM)',
  'OBSOLESCÊNCIA TECNOLÓGICA / DESATIVAÇÃO REGULAMENTAR',
  'DEVOLUÇÃO / RECOLHIMENTO AO COMANDO SUPERIOR (D-LOG / EXÉRCITO)',
  'EXTRAVIO / FURTO / PERDA (APENSO A SINDICÂNCIA OU BO)',
  'CONSUMO EM INSTRUÇÃO / TREINAMENTO DE TIRO REGULAMENTAR',
  'OUTRO MOTIVO REGULAMENTAR',
];

export const ModalBaixaEstoque: React.FC<ModalBaixaEstoqueProps> = ({
  isOpen,
  onClose,
  estoque,
  armeiros,
  armeiroAtivo,
  onSucesso,
  baixaParaVisualizar,
}) => {
  const [modo, setModo] = useState<'FORM' | 'COMPROVANTE'>(
    baixaParaVisualizar ? 'COMPROVANTE' : 'FORM'
  );
  const [baixaAtual, setBaixaAtual] = useState<RegistroBaixa | null>(
    baixaParaVisualizar || null
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [itensSelecionados, setItensSelecionados] = useState<
    Array<{
      estoqueId: string;
      quantidade: number;
      motivoItem?: string;
    }>
  >([]);

  const [motivoGeral, setMotivoGeral] = useState<string>(
    MOTIVOS_BAIXA_PADRAO[0]
  );
  const [motivoCustomizado, setMotivoCustomizado] = useState('');
  const [documentoReferencia, setDocumentoReferencia] = useState('');
  const [destinoOrgao, setDestinoOrgao] = useState('Diretoria de Apoio Logístico (DAL) / P4');
  const [armeiroId, setArmeiroId] = useState<string>(
    armeiroAtivo?.id || armeiros[0]?.id || ''
  );
  const [observacoes, setObservacoes] = useState('');
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  React.useEffect(() => {
    if (baixaParaVisualizar) {
      setBaixaAtual(baixaParaVisualizar);
      setModo('COMPROVANTE');
    } else {
      setModo('FORM');
      setBaixaAtual(null);
    }
  }, [baixaParaVisualizar]);

  const itensElegiveis = useMemo(() => {
    return estoque.filter((it) => {
      if (it.status === 'INDISPONÍVEL/NA RUA' || it.status === 'SAÍDA' || it.status === 'BAIXADO') {
        return false;
      }
      const isControleUnitario =
        it.categoria === 'ARMAMENTO' ||
        it.categoria === 'COMUNICAÇÃO' ||
        it.categoria === 'ACESSÓRIOS';
      if (isControleUnitario) {
        return it.status === 'DISPONÍVEL';
      }
      return (it.quantidadeDisponivel ?? it.quantidadeTotal ?? 0) > 0;
    });
  }, [estoque]);

  const itensFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return itensElegiveis;
    const term = searchTerm.toLowerCase();
    return itensElegiveis.filter(
      (it) =>
        it.nome.toLowerCase().includes(term) ||
        it.nMaterial.toLowerCase().includes(term) ||
        (it.calibre && it.calibre.toLowerCase().includes(term)) ||
        (it.lote && it.lote.toLowerCase().includes(term)) ||
        it.categoria.toLowerCase().includes(term)
    );
  }, [itensElegiveis, searchTerm]);

  if (!isOpen) return null;

  const handleToggleItem = (item: ItemEstoque) => {
    setErroValidacao(null);
    const jaSelecionado = itensSelecionados.some((i) => i.estoqueId === item.id);
    if (jaSelecionado) {
      setItensSelecionados((prev) => prev.filter((i) => i.estoqueId !== item.id));
    } else {
      const isControleUnitario =
        item.categoria === 'ARMAMENTO' ||
        item.categoria === 'COMUNICAÇÃO' ||
        item.categoria === 'ACESSÓRIOS';
      const maxQtd = isControleUnitario
        ? 1
        : item.quantidadeDisponivel ?? item.quantidadeTotal ?? 1;
      setItensSelecionados((prev) => [
        ...prev,
        {
          estoqueId: item.id,
          quantidade: Math.max(1, maxQtd),
        },
      ]);
    }
  };

  const handleQtdChange = (estoqueId: string, novaQtd: number, maxQtd: number) => {
    const qtdAjustada = Math.min(Math.max(1, novaQtd), maxQtd);
    setItensSelecionados((prev) =>
      prev.map((i) => (i.estoqueId === estoqueId ? { ...i, quantidade: qtdAjustada } : i))
    );
  };

  const handleConfirmarBaixa = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    if (itensSelecionados.length === 0) {
      setErroValidacao('Selecione ao menos um material para efetuar a baixa de carga.');
      return;
    }

    if (!documentoReferencia.trim()) {
      setErroValidacao('Informe o Documento de Amparo Legal (Portaria, Ofício, Processo SEI ou BO).');
      return;
    }

    const armeiroObj = armeiros.find((a) => a.id === armeiroId) || armeiroAtivo || armeiros[0];
    if (!armeiroObj) {
      setErroValidacao('Selecione o Armeiro Responsável pela baixa.');
      return;
    }

    const motivoFinal =
      motivoGeral === 'OUTRO MOTIVO REGULAMENTAR' && motivoCustomizado.trim()
        ? motivoCustomizado.trim()
        : motivoGeral;

    setIsProcessando(true);

    try {
      const baixaRegistrada = db.registrarBaixaEstoque({
        motivo: motivoFinal,
        documentoReferencia: documentoReferencia.trim(),
        destinoOrgao: destinoOrgao.trim() || undefined,
        armeiroResponsavelId: armeiroObj.id,
        armeiroResponsavelNome: armeiroObj.nomeGuerra || armeiroObj.nome,
        armeiroResponsavelPatente: armeiroObj.patente,
        observacoes: observacoes.trim() || undefined,
        itens: itensSelecionados,
      });

      setBaixaAtual(baixaRegistrada);
      setModo('COMPROVANTE');
      onSucesso();
    } catch (err: any) {
      setErroValidacao(err.message || 'Erro ao processar baixa de materiais.');
    } finally {
      setIsProcessando(false);
    }
  };

  const formatDataHoraMilitar = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-mono">
      <div className="bg-[#0f141c] border border-[#1f2937] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-4">
        
        <div className="bg-[#07090d] px-4 py-3 border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-950/80 border border-red-800/80 rounded text-red-400">
              <PackageMinus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {modo === 'FORM'
                  ? 'BAIXA / DESCARGA DEFINITIVA DE MATERIAL DO ESTOQUE'
                  : 'COMPROVANTE DIGITAL OFICIAL DE BAIXA DE ESTOQUE'}
              </h2>
              <span className="text-[10px] text-[#7a8c7b] block">
                {modo === 'FORM'
                  ? 'Descarga patrimonial regulamentar com registro oficial em tela'
                  : `Termo Nº ${baixaAtual?.numeroTermo || '-'} • SISARM-LOG (100% DIGITAL • SEM PDF)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modo === 'COMPROVANTE' && (
              <>
                {!baixaParaVisualizar && (
                  <button
                    onClick={() => {
                      setModo('FORM');
                      setItensSelecionados([]);
                      setDocumentoReferencia('');
                      setObservacoes('');
                    }}
                    className="text-xs text-[#7a8c7b] hover:text-white px-2.5 py-1 rounded border border-[#232f22] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Nova Baixa
                  </button>
                )}
                <span className="text-[10px] bg-[#121c13] text-[#86efac] border border-[#274627] px-2.5 py-1 rounded font-bold uppercase hidden sm:inline-block">
                  100% DIGITAL • SEM PDF
                </span>
              </>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#161f2e] cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {modo === 'FORM' && (
          <form onSubmit={handleConfirmarBaixa} className="p-4 sm:p-6 space-y-5">
            {erroValidacao && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded flex items-center gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{erroValidacao}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#7eb864]" />
                  1. Selecionar Materiais para Baixa ({itensSelecionados.length} selecionado(s))
                </label>
                <span className="text-[10px] text-[#7a8c7b]">
                  Apenas materiais no armorial e não acautelados podem sofrer baixa
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7a8c7b] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por nome, série, calibre, lote ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 pl-8 py-1.5 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439]"
                />
              </div>

              <div className="border border-[#232f22] rounded bg-[#090d0a] max-h-52 overflow-y-auto divide-y divide-[#182218]">
                {itensFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#5f7360]">
                    Nenhum material disponível encontrado com os critérios de busca.
                  </div>
                ) : (
                  itensFiltrados.map((item) => {
                    const isChecked = itensSelecionados.some((i) => i.estoqueId === item.id);
                    const itemSel = itensSelecionados.find((i) => i.estoqueId === item.id);
                    const isControleUnitario =
                      item.categoria === 'ARMAMENTO' ||
                      item.categoria === 'COMUNICAÇÃO' ||
                      item.categoria === 'ACESSÓRIOS';
                    const maxSaldo = isControleUnitario
                      ? 1
                      : item.quantidadeDisponivel ?? item.quantidadeTotal ?? 1;

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                          isChecked ? 'bg-[#142313]/70' : 'hover:bg-[#0f1710]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item)}
                            className="rounded border-[#344630] text-[#7eb864] focus:ring-0 bg-[#0c110d] w-4 h-4 cursor-pointer"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">
                                {item.nome}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase bg-[#0c110d] text-[#a1b59f] border-[#232f22]">
                                {item.categoria}
                              </span>
                              {item.calibre && (
                                <span className="text-[10px] text-[#7a8c7b]">
                                  {item.calibre}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7a8c7b] mt-0.5">
                              Série: <span className="text-[#a1b59f] font-mono">#{item.nMaterial}</span>
                              {item.lote && ` • Lote: ${item.lote}`}
                              {` • Local: ${item.localArmazenamento}`}
                              {` • Saldo Atual: ${maxSaldo} un`}
                            </div>
                          </div>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-2 pl-6 sm:pl-0 flex-shrink-0">
                            {!isControleUnitario ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[#7a8c7b]">Qtd Baixa:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={maxSaldo}
                                  value={itemSel?.quantidade || 1}
                                  onChange={(e) =>
                                    handleQtdChange(item.id, parseInt(e.target.value, 10) || 1, maxSaldo)
                                  }
                                  className="w-16 bg-[#0c110d] border border-[#344630] rounded px-1.5 py-0.5 text-xs text-white text-center font-bold focus:outline-none focus:border-[#7eb864]"
                                />
                                <span className="text-[10px] text-[#7a8c7b]">/ {maxSaldo} un</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-[#86efac] bg-[#142313] border border-[#2b592f] px-2 py-0.5 rounded">
                                1 un (Item Unitário)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1f2937]">
              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                  2. Motivo Regulamentar da Baixa *
                </label>
                <select
                  value={motivoGeral}
                  onChange={(e) => setMotivoGeral(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#425439]"
                >
                  {MOTIVOS_BAIXA_PADRAO.map((mot) => (
                    <option key={mot} value={mot}>
                      {mot}
                    </option>
                  ))}
                </select>

                {motivoGeral === 'OUTRO MOTIVO REGULAMENTAR' && (
                  <input
                    type="text"
                    placeholder="Descreva o motivo regulamentar específico..."
                    value={motivoCustomizado}
                    onChange={(e) => setMotivoCustomizado(e.target.value)}
                    className="w-full mt-2 bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                  3. Documento de Amparo Legal (Portaria / Ofício / Processo) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Portaria nº 042/2026-DLog, Ofício 114/BPM, Processo SEI nº..."
                  value={documentoReferencia}
                  onChange={(e) => setDocumentoReferencia(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#425439]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                  4. Destino da Carga / Órgão Receptor
                </label>
                <input
                  type="text"
                  placeholder="Ex: Diretoria de Apoio Logístico (DAL), Comissão de Destruição, 15º BPM"
                  value={destinoOrgao}
                  onChange={(e) => setDestinoOrgao(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#425439]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                  5. Armeiro / Responsável pela Baixa *
                </label>
                <select
                  value={armeiroId}
                  onChange={(e) => setArmeiroId(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#425439]"
                >
                  {armeiros.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.patente} {a.nomeGuerra || a.nome} — {a.funcao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1 font-bold">
                6. Observações e Justificativa Circunstanciada
              </label>
              <textarea
                rows={2}
                placeholder="Observações complementares, estado detalhado dos componentes, laudos periciais anexos..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#425439]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1f2937]">
              <div className="text-[11px] text-[#7a8c7b]">
                Itens marcados: <strong className="text-white">{itensSelecionados.length}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isProcessando || itensSelecionados.length === 0}
                  className="bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <PackageMinus className="w-4 h-4" />
                  {isProcessando ? 'PROCESSANDO...' : 'CONFIRMAR BAIXA DEFINITIVA'}
                </button>
              </div>
            </div>
          </form>
        )}

        {modo === 'COMPROVANTE' && baixaAtual && (
          <div className="p-4 sm:p-8 space-y-6 text-slate-900 font-serif bg-white shadow-inner">
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <div className="font-bold text-xs uppercase tracking-widest text-slate-700 font-sans">
                REPÚBLICA FEDERATIVA DO BRASIL • MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA
              </div>
              <div className="font-bold text-sm uppercase tracking-wider text-black font-sans">
                SECRETARIA DE SEGURANÇA PÚBLICA • POLÍCIA MILITAR
              </div>
              <div className="font-bold text-xs uppercase tracking-wide text-slate-800 font-sans">
                SEÇÃO DE LOGÍSTICA E MATERIAL BÉLICO (4ª SEÇÃO) • RESERVA DE ARMAMENTO E TIRO (SISARM-LOG)
              </div>
              <div className="font-bold text-base uppercase tracking-wider pt-2 text-black font-sans">
                TERMO OFICIAL DE BAIXA E DESCARGA DE MATERIAL BÉLICO
              </div>
              <div className="font-mono text-xs font-bold text-slate-800">
                Nº DE CONTROLE: {baixaAtual.numeroTermo} • EMISSÃO: {formatDataHoraMilitar(baixaAtual.dataHora)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 border border-slate-300 font-sans">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Motivo Regulamentar da Baixa:
                </span>
                <span className="font-bold text-slate-900">{baixaAtual.motivo}</span>
              </div>

              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Documento de Amparo Legal:
                </span>
                <span className="font-bold text-slate-900">{baixaAtual.documentoReferencia}</span>
              </div>

              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Destino / Órgão Receptor:
                </span>
                <span className="text-slate-900">{baixaAtual.destinoOrgao || 'Diretoria de Apoio Logístico (DAL)'}</span>
              </div>

              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Armeiro Expedidor Responsável:
                </span>
                <span className="font-bold text-slate-900">
                  {baixaAtual.armeiroResponsavelPatente} {baixaAtual.armeiroResponsavelNome}
                </span>
              </div>

              {baixaAtual.observacoes && (
                <div className="sm:col-span-2 pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-600 block text-[10px] uppercase">
                    Observações / Circunstância:
                  </span>
                  <span className="text-slate-800 italic">{baixaAtual.observacoes}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                Relação Discriminada dos Materiais Baixados ({baixaAtual.itens.length} itens)
              </div>

              <div className="overflow-x-auto border border-black">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-200 border-b border-black text-[11px]">
                      <th className="p-2 border-r border-black w-10 text-center">#</th>
                      <th className="p-2 border-r border-black">CATEGORIA</th>
                      <th className="p-2 border-r border-black">DESCRIÇÃO DO MATERIAL</th>
                      <th className="p-2 border-r border-black">CALIBRE</th>
                      <th className="p-2 border-r border-black">Nº SÉRIE / LOTE</th>
                      <th className="p-2 border-r border-black">ESTADO</th>
                      <th className="p-2 text-center w-20">QTD. BAIXADA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {baixaAtual.itens.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-black text-center font-mono font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r border-black font-bold uppercase text-[10px]">
                          {item.categoria}
                        </td>
                        <td className="p-2 border-r border-black font-semibold">
                          {item.nome}
                        </td>
                        <td className="p-2 border-r border-black font-mono">
                          {item.calibre || '-'}
                        </td>
                        <td className="p-2 border-r border-black font-mono font-bold">
                          #{item.nMaterial}
                        </td>
                        <td className="p-2 border-r border-black text-[10px] uppercase">
                          {item.estado}
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-sm">
                          {item.quantidade} un
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-black font-bold">
                      <td colSpan={6} className="p-2 text-right uppercase border-r border-black">
                        Total de Unidades Baixadas:
                      </td>
                      <td className="p-2 text-center font-mono text-sm">
                        {baixaAtual.itens.reduce((acc, i) => acc + i.quantidade, 0)} un
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="border border-slate-300 p-4 text-[11px] leading-relaxed text-justify space-y-2 font-sans bg-slate-50">
              <div className="font-bold text-xs uppercase text-slate-900 border-b border-slate-300 pb-1">
                Certidão de Descarga Patrimonial e Desincorporação de Carga
              </div>
              <p>
                Certifico que os materiais e armamentos bélicos acima discriminados foram conferidos
                presencialmente e numericamente, tendo sido efetivada sua baixa definitiva do inventário ativo
                desta Reserva de Armamento (Armorial), desonerando a Unidade Policial de sua carga patrimonial
                operacional nos termos do documento legal de amparo supracitado.
              </p>
              <p className="text-[10px] text-slate-600">
                Este documento é lavrado em conformidade com o Regulamento de Administração do Exército (R-105 / RAE),
                as normas da Diretoria de Apoio Logístico (DAL) e as diretrizes de controle de material bélico.
              </p>
            </div>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center font-sans text-xs">
              <div className="space-y-1">
                <div className="border-t border-black pt-1 font-bold">
                  {baixaAtual.armeiroResponsavelPatente} {baixaAtual.armeiroResponsavelNome}
                </div>
                <div className="text-[11px] text-slate-600">Armeiro / Responsável pela Expedição da Baixa</div>
                <div className="text-[10px] text-slate-500 font-mono">Assinado digitalmente via SISARM</div>
              </div>

              <div className="space-y-1">
                <div className="border-t border-black pt-1 font-bold">
                  Fiscal Administrativo / Chefe da Reserva de Armamento
                </div>
                <div className="text-[11px] text-slate-600">Comando / Seção de Logística (P/4 - DAL)</div>
                <div className="text-[10px] text-slate-500 font-mono">Homologação de Carga</div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-3 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 font-mono">
              <div>
                SISARM-LOG • HASH SHA-256: {baixaAtual.hashIntegridade}
              </div>
              <div>
                Documento de fé pública militar • {baixaAtual.numeroTermo}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
