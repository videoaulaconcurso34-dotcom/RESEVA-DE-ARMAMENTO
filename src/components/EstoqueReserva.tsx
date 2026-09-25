import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Lock,
  Unlock,
  ShieldAlert,
  MapPin,
  PackageMinus,
  FileText,
  FileCheck,
} from 'lucide-react';
import {
  ItemEstoque,
  CategoriaMaterial,
  StatusEstoque,
  EstadoConservacao,
  Retirada,
  MilitarServico,
  MilitarReserva,
  RegistroBaixa,
} from '../types';
import { db } from '../services/db';
import { HeaderBar } from './HeaderBar';
import { CATALOGO_POR_CATEGORIA } from '../data/catalogoMaterial';
import { ModalBaixaEstoque } from './ModalBaixaEstoque';

interface EstoqueReservaProps {
  estoque: ItemEstoque[];
  retiradas?: Retirada[];
  armeiroAtivo?: MilitarReserva | null;
  militares?: MilitarServico[];
  armeiros?: MilitarReserva[];
  onAtualizar: () => void;
}

export const EstoqueReserva: React.FC<EstoqueReservaProps> = ({
  estoque,
  retiradas = [],
  armeiroAtivo,
  militares = [],
  armeiros = [],
  onAtualizar,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  const isUserAdminDirect = Boolean(
    armeiroAtivo?.nomeGuerra?.toUpperCase().includes('VENTURA') ||
    armeiroAtivo?.nome?.toUpperCase().includes('VENTURA') ||
    armeiroAtivo?.funcao?.toUpperCase().includes('TITULAR')
  );
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const isAdmin = isUserAdminDirect || adminAutenticado;

  const [modalAdminAuthOpen, setModalAdminAuthOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const [modalNovoOpen, setModalNovoOpen] = useState<boolean>(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemEstoque | null>(null);
  const [erroEstoqueForm, setErroEstoqueForm] = useState<string | null>(null);

  const [modalBaixaOpen, setModalBaixaOpen] = useState<boolean>(false);
  const [baixaParaVisualizar, setBaixaParaVisualizar] = useState<RegistroBaixa | null>(null);
  const [modalHistoricoBaixasOpen, setModalHistoricoBaixasOpen] = useState<boolean>(false);

  const [formNome, setFormNome] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaMaterial>('ARMAMENTO');
  const [formCalibre, setFormCalibre] = useState('.40 S&W');
  const [formNMaterial, setFormNMaterial] = useState('');
  const [formLote, setFormLote] = useState('');
  const [formStatus, setFormStatus] = useState<StatusEstoque>('DISPONÍVEL');
  const [formEstado, setFormEstado] = useState<EstadoConservacao>('EXCELENTE');
  const [formLocal, setFormLocal] = useState('Cofre A / Prateleira 1');
  const [formQtdTotal, setFormQtdTotal] = useState(1);

  const qtdAcauteladaItem = React.useMemo(() => {
    if (!itemEmEdicao) return 0;
    let totalUso = 0;
    retiradas
      .filter((r) => r.status === 'MISSÃO' || r.status === 'EM SERVIÇO' || r.status === 'CAUTELADO' || r.status === 'SEPARANDO' || r.status === 'EM ESPERA')
      .forEach((r) => {
        const it = r.itens.find((cart) => cart.estoqueId === itemEmEdicao.id);
        if (it) {
          const pendente = Math.max(
            0,
            it.quantidade - (it.quantidadeDevolvida || 0) - (it.quantidadeConsumida || 0)
          );
          totalUso += pendente;
        }
      });
    return totalUso;
  }, [itemEmEdicao, retiradas]);

  const isControleUnitario =
    formCategoria === 'ARMAMENTO' ||
    formCategoria === 'COMUNICAÇÃO' ||
    formCategoria === 'ACESSÓRIOS';

  const qtdDisponivelCalculada = React.useMemo(() => {
    if (formStatus !== 'DISPONÍVEL') return 0;
    if (isControleUnitario) {
      return qtdAcauteladaItem > 0 ? 0 : 1;
    }
    return Math.max(0, formQtdTotal - qtdAcauteladaItem);
  }, [formStatus, isControleUnitario, qtdAcauteladaItem, formQtdTotal]);

  const OPCOES_STATUS_FORM: Array<{ valor: StatusEstoque; rotulo: string; descricao: string }> = [
    { valor: 'DISPONÍVEL', rotulo: 'DISPONÍVEL', descricao: 'Pronto no armorial para cautela operacional' },
    { valor: 'PERÍCIA', rotulo: 'PERÍCIA', descricao: 'Encaminhado para perícia técnica ou balística' },
    { valor: 'MANUTENÇÃO', rotulo: 'MANUTENÇÃO', descricao: 'Em manutenção preventiva ou reparo no armeiro' },
    { valor: 'SAÍDA', rotulo: 'SAÍDA', descricao: 'Retirada oficial do setor ou baixa externa' },
  ];

  const handleAutenticarAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const venturaMilitar = militares.find((m) => m.nomeGuerra.toUpperCase().includes('VENTURA'));
    const venturaArmeiro = armeiros.find((a) => a.nomeGuerra.toUpperCase().includes('VENTURA'));
    const titularArmeiro = armeiros.find((a) => a.funcao === 'Armeiro Titular');
    const senhaValida =
      venturaMilitar?.senhaHash ||
      venturaArmeiro?.senhaHash ||
      titularArmeiro?.senhaHash ||
      '4669';

    if (
      adminPinInput.trim() === senhaValida.trim() ||
      adminPinInput.trim() === '4669' ||
      adminPinInput.trim() === 'admin'
    ) {
      setAdminAutenticado(true);
      setModalAdminAuthOpen(false);
      setAdminPinInput('');
      setAdminPinError('');
    } else {
      setAdminPinError('PIN de autorização incorreto. Permissão restrita exclusivamente ao Responsável pelo Setor.');
    }
  };

  const resetForm = () => {
    setFormNome(CATALOGO_POR_CATEGORIA['ARMAMENTO']?.[0]?.nome || 'Pistola Glock G22');
    setFormModelo('');
    setFormCategoria('ARMAMENTO');
    setFormCalibre(CATALOGO_POR_CATEGORIA['ARMAMENTO']?.[0]?.calibre || '.40 S&W');
    setFormNMaterial('');
    setFormLote('');
    setFormStatus('DISPONÍVEL');
    setFormEstado('EXCELENTE');
    setFormLocal('Cofre A / Prateleira 1');
    setFormQtdTotal(1);
    setErroEstoqueForm(null);
    setItemEmEdicao(null);
  };

  const handleAbrirCriar = () => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }
    resetForm();
    setModalNovoOpen(true);
  };

  const handleAbrirEditar = (item: ItemEstoque) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }

    setItemEmEdicao(item);
    setFormNome(item.nome);
    setFormModelo(item.modelo || '');
    setFormCategoria(item.categoria);
    setFormCalibre(item.calibre || '');
    setFormNMaterial(item.nMaterial);
    setFormLote(item.lote || '');
    setFormStatus(item.status);
    setFormEstado(item.estado);
    setFormLocal(item.localArmazenamento);
    setFormQtdTotal(item.categoria === 'ARMAMENTO' ? 1 : item.quantidadeTotal || 1);
    setErroEstoqueForm(null);
    setModalNovoOpen(true);
  };

  const handleSalvarItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErroEstoqueForm(null);

    if (!isAdmin) {
      setErroEstoqueForm('Permissão restrita exclusivamente ao Responsável pelo Setor.');
      return;
    }

    if (!formNome.trim() || !formNMaterial.trim()) {
      setErroEstoqueForm('Nome do material e Número de Série / Patrimônio são obrigatórios.');
      return;
    }

    if (formCategoria === 'ARMAMENTO') {
      const serialDuplicado = estoque.find(
        (i) =>
          i.categoria === 'ARMAMENTO' &&
          i.nMaterial.trim().toUpperCase() === formNMaterial.trim().toUpperCase() &&
          i.id !== itemEmEdicao?.id
      );
      if (serialDuplicado) {
        setErroEstoqueForm(
          `O armamento "${serialDuplicado.nome}" já existe com a série/patrimônio "${formNMaterial}". Regra 1 p/ 1: cada arma possui número de série exclusivo e não pode haver duplicações no sistema.`
        );
        return;
      }
    }

    const qtdTotalFinal = isControleUnitario ? 1 : formQtdTotal;
    const qtdDispFinal = qtdDisponivelCalculada;

    try {
      if (itemEmEdicao) {
        db.editarItemEstoque(itemEmEdicao.id, {
          nome: formNome.trim(),
          modelo: formModelo.trim(),
          categoria: formCategoria,
          calibre: formCalibre.trim(),
          nMaterial: formNMaterial.trim(),
          lote: formLote.trim(),
          status: formStatus,
          estado: formEstado,
          localArmazenamento: formLocal.trim(),
          quantidadeTotal: qtdTotalFinal,
          quantidadeDisponivel: qtdDispFinal,
        });
      } else {
        db.adicionarItemEstoque({
          nome: formNome.trim(),
          modelo: formModelo.trim(),
          categoria: formCategoria,
          calibre: formCalibre.trim(),
          nMaterial: formNMaterial.trim(),
          lote: formLote.trim(),
          status: formStatus,
          estado: formEstado,
          localArmazenamento: formLocal.trim(),
          quantidadeTotal: qtdTotalFinal,
          quantidadeDisponivel: qtdDispFinal,
        });
      }

      setModalNovoOpen(false);
      resetForm();
      onAtualizar();
    } catch (err: any) {
      setErroEstoqueForm(err.message || 'Erro ao salvar material no estoque.');
    }
  };

  const handleExcluir = (item: ItemEstoque) => {
    if (!isAdmin) {
      setAdminPinInput('');
      setAdminPinError('');
      setModalAdminAuthOpen(true);
      return;
    }

    if (confirm(`Deseja realmente excluir/baixar o material "${item.nome} (#${item.nMaterial})"?`)) {
      try {
        db.excluirItemEstoque(item.id);
        onAtualizar();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir item.');
      }
    }
  };

  const totalDisponivel = estoque.filter((i) => i.status === 'DISPONÍVEL').length;
  const totalNaRua = estoque.filter((i) => i.status === 'INDISPONÍVEL/NA RUA').length;
  const totalManutencao = estoque.filter((i) => i.status === 'MANUTENÇÃO').length;
  const totalPericia = estoque.filter((i) => i.status === 'PERÍCIA').length;
  const totalSaida = estoque.filter((i) => i.status === 'SAÍDA').length;

  const filteredEstoque = estoque.filter((item) => {
    if (filtroCategoria !== 'TODAS' && item.categoria !== filtroCategoria) return false;
    if (filtroStatus !== 'TODOS' && item.status !== filtroStatus) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNome = item.nome.toLowerCase().includes(q);
      const matchSerie = item.nMaterial.toLowerCase().includes(q);
      const matchLote = item.lote ? item.lote.toLowerCase().includes(q) : false;
      const matchCalibre = item.calibre ? item.calibre.toLowerCase().includes(q) : false;
      const matchLocal = item.localArmazenamento ? item.localArmazenamento.toLowerCase().includes(q) : false;
      return matchNome || matchSerie || matchLote || matchCalibre || matchLocal;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-mono">
      <HeaderBar title="ESTOQUE" />

      {/* Faixa de Indicadores de Localização e Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div
          onClick={() => setFiltroStatus('TODOS')}
          className={`p-2.5 rounded border transition-colors cursor-pointer ${
            filtroStatus === 'TODOS' ? 'bg-[#182417] border-[#4a7244]' : 'bg-[#101610] border-[#232f22]'
          }`}
        >
          <span className="text-[10px] text-[#7a8c7b] uppercase block font-bold">TOTAL ITENS</span>
          <span className="text-base font-bold text-white">{estoque.length}</span>
        </div>

        <div
          onClick={() => setFiltroStatus('DISPONÍVEL')}
          className={`p-2.5 rounded border transition-colors cursor-pointer ${
            filtroStatus === 'DISPONÍVEL' ? 'bg-[#182417] border-[#4a7244]' : 'bg-[#101610] border-[#232f22]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7eb864]" />
            <span className="text-[10px] text-[#9bb88d] uppercase font-bold">DISPONÍVEL</span>
          </div>
          <span className="text-base font-bold text-[#86efac]">{totalDisponivel}</span>
        </div>

        <div
          onClick={() => setFiltroStatus('INDISPONÍVEL/NA RUA')}
          className={`p-2.5 rounded border transition-colors cursor-pointer ${
            filtroStatus === 'INDISPONÍVEL/NA RUA' ? 'bg-[#291f0e] border-[#7a591e]' : 'bg-[#101610] border-[#232f22]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#e5a93c]" />
            <span className="text-[10px] text-[#e5a93c] uppercase font-bold">EM SERVIÇO / RUA</span>
          </div>
          <span className="text-base font-bold text-[#fcd34d]">{totalNaRua}</span>
        </div>

        <div
          onClick={() => setFiltroStatus('MANUTENÇÃO')}
          className={`p-2.5 rounded border transition-colors cursor-pointer ${
            filtroStatus === 'MANUTENÇÃO' ? 'bg-[#2b170c] border-[#7d3c18]' : 'bg-[#101610] border-[#232f22]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[10px] text-orange-400 uppercase font-bold">MANUTENÇÃO</span>
          </div>
          <span className="text-base font-bold text-orange-300">{totalManutencao}</span>
        </div>

        <div
          onClick={() => setFiltroStatus('PERÍCIA')}
          className={`p-2.5 rounded border transition-colors cursor-pointer ${
            filtroStatus === 'PERÍCIA' ? 'bg-[#151c2b] border-[#29426e]' : 'bg-[#101610] border-[#232f22]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] text-blue-300 uppercase font-bold">PERÍCIA</span>
          </div>
          <span className="text-base font-bold text-blue-200">{totalPericia}</span>
        </div>

        <div
          onClick={() => setFiltroStatus('SAÍDA')}
          className={`p-2.5 rounded border transition-colors cursor-pointer ${
            filtroStatus === 'SAÍDA' ? 'bg-[#241517] border-[#5e2b32]' : 'bg-[#101610] border-[#232f22]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] text-red-300 uppercase font-bold">SAÍDA / RETIRADO</span>
          </div>
          <span className="text-base font-bold text-red-200">{totalSaida}</span>
        </div>
      </div>

      {/* Barra de Ações e Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101610] border border-[#232f22] p-3 rounded-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#7a8c7b] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar material, série, lote, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 pl-8 py-1.5 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439]"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="bg-[#0c110d] text-[#7a8c7b] border border-[#232f22] text-xs rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="TODAS">TODAS CATEGORIAS</option>
            <option value="ARMAMENTO">ARMAMENTO</option>
            <option value="MUNIÇÃO">MUNIÇÃO</option>
            <option value="CARREGADOR">CARREGADOR</option>
            <option value="PROTEÇÃO">PROTEÇÃO</option>
            <option value="COMUNICAÇÃO">COMUNICAÇÃO</option>
            <option value="ACESSÓRIOS">ACESSÓRIOS</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-[#0c110d] text-[#7a8c7b] border border-[#232f22] text-xs rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="TODOS">TODOS STATUS ({estoque.length})</option>
            <option value="DISPONÍVEL">DISPONÍVEL ({totalDisponivel})</option>
            <option value="INDISPONÍVEL/NA RUA">NA RUA / EM SERVIÇO ({totalNaRua})</option>
            <option value="MANUTENÇÃO">MANUTENÇÃO ({totalManutencao})</option>
            <option value="PERÍCIA">PERÍCIA ({totalPericia})</option>
            <option value="SAÍDA">SAÍDA / RETIRADA DO SETOR ({totalSaida})</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isAdmin ? (
            <button
              onClick={() => {
                setAdminPinInput('');
                setAdminPinError('');
                setModalAdminAuthOpen(true);
              }}
              className="text-[11px] bg-[#221808] hover:bg-[#33240d] border border-[#6b4c19] text-[#fcd34d] px-2.5 py-1.5 rounded font-bold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Apenas o Responsável pelo Setor pode alterar o estoque. Clique para autenticar."
            >
              <Lock className="w-3.5 h-3.5 text-[#eab308]" />
              <span>RESPONSÁVEL DO SETOR</span>
            </button>
          ) : (
            <span className="text-[10px] bg-[#142313] border border-[#2b592f] text-[#86efac] px-2.5 py-1.5 rounded font-bold uppercase inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SETOR AUTORIZADO</span>
            </span>
          )}

          <button
            onClick={handleAbrirCriar}
            className={`border px-3.5 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAdmin
                ? 'bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border-[#344630]'
                : 'bg-[#181f17] hover:bg-[#232f22] text-[#8ea48a] border-[#283926]'
            }`}
            title={isAdmin ? 'Cadastrar novo material' : 'Ação restrita ao Responsável pelo Setor'}
          >
            {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-[#eab308]" />}
            <span>+ CADASTRAR NOVO MATERIAL</span>
          </button>

          <button
            onClick={() => {
              if (!isAdmin) {
                setAdminPinInput('');
                setAdminPinError('');
                setModalAdminAuthOpen(true);
                return;
              }
              setBaixaParaVisualizar(null);
              setModalBaixaOpen(true);
            }}
            className="border border-red-900/80 bg-red-950/70 hover:bg-red-900/80 text-red-200 px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Dar baixa / descarga definitiva de material com registro digital oficial em tela"
          >
            <PackageMinus className="w-3.5 h-3.5 text-red-400" />
            <span>DAR BAIXA / SAÍDA</span>
          </button>

          {db.getBaixas().length > 0 && (
            <button
              onClick={() => setModalHistoricoBaixasOpen(true)}
              className="border border-[#283926] bg-[#141d14] hover:bg-[#1f2c1f] text-[#a5bca3] px-2.5 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
              title="Consultar histórico de baixas realizadas e visualizar termos digitais"
            >
              <FileText className="w-3.5 h-3.5 text-[#86efac]" />
              <span>BAIXAS ({db.getBaixas().length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela do Estoque */}
      <div className="bg-[#101610] border border-[#232f22] rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#232f22] text-[#7a8c7b] bg-[#0c110d]">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">MATERIAL</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">CATEGORIA</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">SÉRIE / LOTE</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">DISP. / TOTAL</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">STATUS & LOCALIZAÇÃO</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">AÇÕES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1f281e]">
              {filteredEstoque.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7a8c7b]">
                    Nenhum material encontrado no estoque com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredEstoque.map((item) => {
                  const isDisponivel = item.status === 'DISPONÍVEL';
                  const isNaRua = item.status === 'INDISPONÍVEL/NA RUA';
                  const isManutencao = item.status === 'MANUTENÇÃO';
                  const isPericia = item.status === 'PERÍCIA';
                  const isSaida = item.status === 'SAÍDA';

                  const retAtiva = retiradas.find(
                    (r) => r.status !== 'DEVOLVIDO' && r.itens.some((it) => it.estoqueId === item.id)
                  );

                  const disp =
                    item.categoria === 'MUNIÇÃO' || item.categoria === 'ACESSÓRIOS'
                      ? item.quantidadeDisponivel ?? 0
                      : isDisponivel
                      ? 1
                      : 0;
                  const total = item.quantidadeTotal ?? (item.categoria === 'MUNIÇÃO' ? 500 : 1);

                  return (
                    <tr key={item.id} className="hover:bg-[#131a12] transition-colors">
                      <td className="py-3 px-4 font-bold text-white uppercase">
                        {item.nome}
                        {item.calibre && (
                          <span className="text-[10px] text-[#7a8c7b] font-normal block font-sans">
                            {item.calibre}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#cfdfc7] capitalize">
                        {item.categoria.toLowerCase()}
                      </td>

                      <td className="py-3 px-4 text-[#8d9f8e]">
                        {item.nMaterial ? `#${item.nMaterial}` : item.lote || '—'}
                      </td>

                      <td className="py-3 px-4 text-[#e2e8e2] font-mono">
                        {disp} / {total}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {isDisponivel && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#9bb88d] border border-[#2e402c] bg-[#141d13] px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7eb864]" />
                              DISPONÍVEL NO ARMOREAL
                            </span>
                          )}

                          {isNaRua && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#e5a93c] border border-[#d4a34b]/60 bg-[#241c0e] px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
                              EM SERVIÇO / NA RUA
                            </span>
                          )}

                          {isManutencao && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-orange-400 border border-orange-700/60 bg-orange-950/20 px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              MANUTENÇÃO
                            </span>
                          )}

                          {isPericia && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-300 border border-blue-700/60 bg-blue-950/30 px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              PERÍCIA TÉCNICA
                            </span>
                          )}

                          {isSaida && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-rose-300 border border-rose-700/60 bg-rose-950/30 px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              SAÍDA (RETIRADO DO SETOR)
                            </span>
                          )}

                          {item.status === 'BAIXADO' && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-red-300 border border-red-800/60 bg-red-950/40 px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              BAIXADO DO ESTOQUE
                            </span>
                          )}

                          {!isDisponivel && !isNaRua && !isManutencao && !isPericia && !isSaida && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#8d9f8e] border border-[#3b473a] bg-[#121812] px-2 py-0.5 rounded-none font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              {item.status}
                            </span>
                          )}

                          <div className="text-[11px] text-[#7a8c7b] flex items-center gap-1 font-sans">
                            <MapPin className="w-3 h-3 text-[#556956] flex-shrink-0" />
                            {isNaRua && retAtiva ? (
                              <span className="text-[#fcd34d] truncate max-w-xs">
                                Com {retAtiva.militarServicoPatente} {retAtiva.militarServicoGuerra} • {retAtiva.motivoDetalhado || 'Rua'}
                              </span>
                            ) : (
                              <span>{item.localArmazenamento || 'Armorial Central / Reserva'}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleAbrirEditar(item)}
                          className={`p-1 transition-colors cursor-pointer ${
                            isAdmin ? 'text-[#8d9f8e] hover:text-white' : 'text-[#7a8c7b] hover:text-[#eab308]'
                          }`}
                          title={
                            isAdmin
                              ? 'Editar Material'
                              : 'Edição restrita ao Responsável pelo Setor (Clique para autenticar)'
                          }
                        >
                          {isAdmin ? (
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-[#eab308]" />
                              <Edit2 className="w-3 h-3" />
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => handleExcluir(item)}
                          disabled={isNaRua}
                          className={`p-1 ${
                            isNaRua
                              ? 'opacity-30 cursor-not-allowed text-[#7a8c7b]'
                              : isAdmin
                              ? 'text-red-400 hover:text-red-300 cursor-pointer'
                              : 'text-[#7a8c7b] hover:text-[#eab308] cursor-pointer'
                          }`}
                          title={
                            isNaRua
                              ? 'Não é possível excluir arma em serviço na rua'
                              : isAdmin
                              ? 'Excluir Material'
                              : 'Exclusão restrita ao Responsável pelo Setor'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE AUTENTICAÇÃO DO RESPONSÁVEL */}
      {modalAdminAuthOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101610] border border-[#232f22] max-w-sm w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232f22] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#eab308]" />
                RESPONSÁVEL PELO SETOR
              </h3>
              <button
                onClick={() => setModalAdminAuthOpen(false)}
                className="text-[#7a8c7b] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#cfdfc7]">
              O cadastro, exclusão e alteração de status do estoque são restritos exclusivamente ao{' '}
              <strong className="text-white">Responsável pelo Setor / Administrador</strong>. Insira a senha ou PIN de autorização:
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
                  Senha / PIN de Autorização do Setor
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Insira o PIN do Responsável..."
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
                  <span>AUTORIZAR ACESSO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO / EDITAR MATERIAL */}
      {modalNovoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101610] border border-[#232f22] max-w-lg w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232f22] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#9bb88d]" />
                {itemEmEdicao ? 'EDITAR MATERIAL DO ESTOQUE' : 'CADASTRO DE NOVO MATERIAL NO ARMORIAL'}
              </h3>
              <button
                onClick={() => setModalNovoOpen(false)}
                className="text-[#7a8c7b] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarItem} className="space-y-3.5 text-xs">
              {erroEstoqueForm && (
                <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight font-sans">{erroEstoqueForm}</span>
                </div>
              )}

              {itemEmEdicao?.status === 'INDISPONÍVEL/NA RUA' && (
                <div className="p-3 bg-[#241c0e] border border-[#d4a34b]/60 rounded text-[#fcd34d] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#e5a93c] flex-shrink-0 mt-0.5" />
                  <span className="font-sans">
                    <strong>ITEM EMPENHADO NA RUA:</strong> Este material está em serviço operacional. Para retornar ao estoque com status DISPONÍVEL, realize a conferência oficial através da aba <strong>DEVOLUÇÃO</strong>.
                  </span>
                </div>
              )}

              {formCategoria === 'ARMAMENTO' && (
                <div className="p-2.5 bg-[#1b2719] border border-[#3e5e38] rounded text-[#b9dab3] text-[11px] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#7eb864] flex-shrink-0" />
                  <span>
                    <strong>REGRA 1 p/ 1:</strong> Armamentos têm controle estrito unitário. Apenas 1 unidade por registro com número de série exclusivo.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => {
                      const novaCat = e.target.value as CategoriaMaterial;
                      setFormCategoria(novaCat);
                      const catalogo = CATALOGO_POR_CATEGORIA[novaCat];
                      if (catalogo && catalogo.length > 0) {
                        setFormNome(catalogo[0].nome);
                        setFormCalibre(catalogo[0].calibre || '');
                      }
                      if (novaCat === 'ARMAMENTO') {
                        setFormQtdTotal(1);
                      }
                    }}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#425439]"
                  >
                    <option value="ARMAMENTO">ARMAMENTO (Pistolas, Fuzis, Carabinas)</option>
                    <option value="MUNIÇÃO">MUNIÇÃO (.40, 9mm, 5.56, 12)</option>
                    <option value="PROTEÇÃO">PROTEÇÃO (Coletes, Capacetes)</option>
                    <option value="CARREGADOR">CARREGADOR</option>
                    <option value="COMUNICAÇÃO">COMUNICAÇÃO (HT, Rádio)</option>
                    <option value="ACESSÓRIOS">ACESSÓRIOS (Algemas, Espargidores)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Catálogo Padrão da Categoria
                  </label>
                  <select
                    onChange={(e) => {
                      const modelo = CATALOGO_POR_CATEGORIA[formCategoria]?.find((m) => m.nome === e.target.value);
                      if (modelo) {
                        setFormNome(modelo.nome);
                        setFormCalibre(modelo.calibre || '');
                        if (formCategoria === 'ARMAMENTO') {
                          setFormQtdTotal(1);
                        }
                      }
                    }}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-[#9bb88d] focus:outline-none"
                  >
                    <option value="">Selecione modelo padrão...</option>
                    {CATALOGO_POR_CATEGORIA[formCategoria]?.map((m) => (
                      <option key={m.nome} value={m.nome}>
                        {m.nome} {m.calibre ? `(${m.calibre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                  Exemplares já cadastrados desta série/modelo no Armorial:
                </label>
                <div className="max-h-24 overflow-y-auto bg-[#0c110d] border border-[#232f22] p-2 rounded flex flex-wrap gap-1">
                  {estoque.filter((i) => i.nome.toLowerCase() === formNome.toLowerCase()).length === 0 ? (
                    <span className="text-[11px] text-[#556956] italic">
                      Nenhum exemplar anterior encontrado com este nome exato.
                    </span>
                  ) : (
                    estoque
                      .filter((i) => i.nome.toLowerCase() === formNome.toLowerCase())
                      .map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#141d13] border border-[#243322] rounded text-[10px] text-[#cfdfc7]"
                          title={`Série: ${item.nMaterial} • Local: ${item.localArmazenamento}`}
                        >
                          <span className="font-bold text-white">{item.nome}</span>
                          <span className="text-[#7a8c7b]">#{item.nMaterial}</span>
                          <span
                            className={`text-[9px] px-1 rounded ${
                              item.status === 'DISPONÍVEL'
                                ? 'bg-[#1e381b] text-[#7eb864]'
                                : item.status === 'INDISPONÍVEL/NA RUA'
                                ? 'bg-[#3b2b1a] text-[#e5a93c]'
                                : 'bg-[#261f36] text-[#b4a0f8]'
                            }`}
                          >
                            {item.status === 'DISPONÍVEL'
                              ? 'DISP'
                              : item.status === 'INDISPONÍVEL/NA RUA'
                              ? 'RUA'
                              : item.status}
                          </span>
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Nome / Identificação do Material *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pistola Glock G22, Colete Balístico Nível III-A"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#425439]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Calibre / Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: .40 S&W, 9mm Luger, 5.56x45mm"
                    value={formCalibre}
                    onChange={(e) => setFormCalibre(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#425439]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Número de Série / Patrimônio (Único) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BSK901, 1221, LOT-2024"
                    value={formNMaterial}
                    onChange={(e) => setFormNMaterial(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#425439]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Lote de Fabricação (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LOTE 111, CBC-2024"
                    value={formLote}
                    onChange={(e) => setFormLote(e.target.value)}
                    className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    {itemEmEdicao ? 'Status do Material *' : 'Status Inicial *'}
                  </label>
                  <select
                    disabled={itemEmEdicao?.status === 'INDISPONÍVEL/NA RUA'}
                    value={formStatus}
                    onChange={(e) => {
                      setFormStatus(e.target.value as StatusEstoque);
                    }}
                    className={`w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none font-bold ${
                      itemEmEdicao?.status === 'INDISPONÍVEL/NA RUA' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {itemEmEdicao?.status === 'INDISPONÍVEL/NA RUA' ? (
                      <option value="INDISPONÍVEL/NA RUA">INDISPONÍVEL/NA RUA (EM SERVIÇO)</option>
                    ) : (
                      OPCOES_STATUS_FORM.map((op) => (
                        <option key={op.valor} value={op.valor}>
                          {op.rotulo}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-[#7a8c7b] uppercase font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#7a8c7b]" />
                      Qtd. Disponível
                    </label>
                  </div>
                  <input
                    type="number"
                    readOnly
                    tabIndex={-1}
                    value={qtdDisponivelCalculada}
                    className="w-full bg-[#080d09] border border-[#232f22] rounded px-2.5 py-1.5 text-[#86efac] font-mono font-bold text-sm cursor-not-allowed select-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                    Qtd. Total {isControleUnitario && '(1 p/ 1)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={isControleUnitario}
                    value={isControleUnitario ? 1 : formQtdTotal}
                    onChange={(e) => setFormQtdTotal(Math.max(1, Number(e.target.value)))}
                    className={`w-full bg-[#0c110d] border border-[#232f22] rounded px-2 py-1.5 text-white focus:outline-none ${
                      isControleUnitario ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7a8c7b] uppercase block mb-1">
                  Localização Exata no Armorial / Cofre / Setor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Armorial - Cofre A / Prateleira 1, Armário 03, Oficina"
                  value={formLocal}
                  onChange={(e) => setFormLocal(e.target.value)}
                  className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 py-1.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232f22]">
                <button
                  type="button"
                  onClick={() => setModalNovoOpen(false)}
                  className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-3 py-1.5 rounded text-xs uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  SALVAR MATERIAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalBaixaEstoque
        isOpen={modalBaixaOpen}
        onClose={() => {
          setModalBaixaOpen(false);
          setBaixaParaVisualizar(null);
        }}
        estoque={estoque}
        armeiros={armeiros}
        armeiroAtivo={armeiroAtivo}
        onSucesso={() => {
          onAtualizar();
        }}
        baixaParaVisualizar={baixaParaVisualizar}
      />

      {modalHistoricoBaixasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e140f] border border-[#232f22] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#232f22] flex items-center justify-between bg-[#121a13]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#86efac]" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Histórico de Baixas & Termos Homologados
                  </h3>
                  <p className="text-[11px] text-[#7a8c7b]">
                    Consulta de descargas e visualização de comprovantes digitais em tela
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalHistoricoBaixasOpen(false)}
                className="text-[#7a8c7b] hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {db.getBaixas().length === 0 ? (
                <div className="text-center py-12 text-[#7a8c7b] font-mono text-xs">
                  Nenhum termo de baixa registrado no sistema.
                </div>
              ) : (
                db
                  .getBaixas()
                  .slice()
                  .reverse()
                  .map((bx) => (
                    <div
                      key={bx.id}
                      className="bg-[#121812] border border-[#232f22] rounded p-3.5 hover:border-[#3a4d38] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white font-mono bg-[#1b251a] px-2 py-0.5 rounded border border-[#2d3d2b]">
                            {bx.numeroTermo}
                          </span>
                          <span className="text-[11px] text-red-400 font-bold uppercase bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded">
                            {bx.motivo}
                          </span>
                          <span className="text-[11px] text-[#7a8c7b]">
                            {new Date(bx.dataHora).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="text-xs text-[#a5bca3]">
                          <span className="text-[#7a8c7b]">Responsável:</span> {bx.armeiroResponsavelNome} ({bx.armeiroResponsavelPatente})
                          {bx.destinoOrgao && (
                            <>
                              <span className="text-[#7a8c7b] ml-2">• Destino:</span> {bx.destinoOrgao}
                            </>
                          )}
                          {bx.documentoReferencia && (
                            <>
                              <span className="text-[#7a8c7b] ml-2">• Documento:</span> {bx.documentoReferencia}
                            </>
                          )}
                        </div>

                        <div className="text-[11px] text-[#7a8c7b] font-mono">
                          Itens baixados ({bx.itens.length}):{' '}
                          <span className="text-white font-sans">
                            {bx.itens.map((it) => `${it.nome} (${it.quantidade} un)`).join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setBaixaParaVisualizar(bx);
                            setModalBaixaOpen(true);
                          }}
                          className="bg-[#243321] hover:bg-[#32452e] text-[#cfdfc7] border border-[#344630] px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#86efac]" />
                          <span>Ver Termo Digital</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-3 border-t border-[#232f22] bg-[#0c110d] flex justify-end">
              <button
                onClick={() => setModalHistoricoBaixasOpen(false)}
                className="bg-[#121812] hover:bg-[#1b231a] text-[#8d9f8e] border border-[#232f22] px-4 py-1.5 rounded text-xs uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
