import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { RegistroAuditoria } from '../types';
import { HeaderBar } from './HeaderBar';

interface AuditoriaLogsProps {
  logs: RegistroAuditoria[];
}

export const AuditoriaLogs: React.FC<AuditoriaLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAcao, setFiltroAcao] = useState<string>('TODAS');

  const normalizedLogs = logs.map((l) => ({
    id: l.id,
    dataHora: l.dataHora,
    acao: l.acao || l.tipoEvento || 'EVENTO',
    detalhes: l.detalhes || l.descricao || '',
    usuarioNome: l.usuarioNome || l.militarEnvolvido || l.armeiroResponsavel || 'Sistema',
    usuarioTipo: l.usuarioTipo || (l.armeiroResponsavel ? 'ARMEIRO' : 'MILITAR'),
    hash: l.hash || l.hashValidacao || '',
    numeroCautela: l.numeroCautela || l.retiradaId || '',
  }));

  const filteredLogs = normalizedLogs.filter((l) => {
    if (filtroAcao !== 'TODAS' && l.acao !== filtroAcao) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.acao.toLowerCase().includes(q) ||
      l.detalhes.toLowerCase().includes(q) ||
      l.usuarioNome.toLowerCase().includes(q) ||
      l.hash.toLowerCase().includes(q) ||
      l.numeroCautela.toLowerCase().includes(q)
    );
  });

  const exportarCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Ação', 'Usuário', 'Tipo', 'Detalhes', 'Hash SHA-256'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.dataHora).toLocaleString('pt-BR'),
      l.acao,
      l.usuarioNome,
      l.usuarioTipo,
      `"${l.detalhes.replace(/"/g, '""')}"`,
      l.hash,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sisreserva_auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono">
      <HeaderBar title="LIVRO DE CARGA E DESCARGA DIGITAL (AUDITORIA)" />

      <div className="bg-[#101610] border border-[#232f22] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-[#7a8c7b] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cautela, militar, ação, hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0c110d] border border-[#232f22] rounded px-2.5 pl-8 py-1.5 text-xs text-[#e2e8e2] placeholder-[#556956] focus:outline-none focus:border-[#425439]"
            />
          </div>

          <select
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            className="bg-[#0c110d] text-[#7a8c7b] border border-[#232f22] text-xs rounded px-2.5 py-1.5 focus:outline-none"
          >
            <option value="TODAS">TODAS AS AÇÕES</option>
            <option value="CRIACAO_PEDIDO_ESPERA">PEDIDO EM ESPERA</option>
            <option value="EXPEDICAO_CAUTELA">EXPEDIÇÃO DE CAUTELA</option>
            <option value="SAIDA_CONFIRMADA">SAÍDA CONFIRMADA</option>
            <option value="DEVOLUCAO_TOTAL">DEVOLUÇÃO TOTAL</option>
            <option value="DEVOLUCAO_PARCIAL">DEVOLUÇÃO PARCIAL</option>
            <option value="BAIXA_ESTOQUE">BAIXA DE MATERIAL</option>
          </select>
        </div>

        <button
          onClick={exportarCSV}
          className="bg-[#182417] hover:bg-[#233521] text-[#9bb88d] border border-[#2d4529] px-3.5 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORTAR CSV</span>
        </button>
      </div>

      <div className="bg-[#101610] border border-[#232f22] rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#232f22] text-[#7a8c7b] bg-[#0c110d]">
                <th className="py-3 px-4 font-bold uppercase">DATA / HORA</th>
                <th className="py-3 px-4 font-bold uppercase">AÇÃO</th>
                <th className="py-3 px-4 font-bold uppercase">USUÁRIO RESPONSÁVEL</th>
                <th className="py-3 px-4 font-bold uppercase">HISTÓRICO / DETALHES</th>
                <th className="py-3 px-4 font-bold uppercase text-right">HASH DE INTEGRIDADE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f281e]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7a8c7b]">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#131a12] transition-colors">
                    <td className="py-3 px-4 text-[#8d9f8e] whitespace-nowrap">
                      {new Date(log.dataHora).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          log.acao.includes('SAIDA') || log.acao.includes('EXPEDICAO')
                            ? 'bg-[#261e0e] border-[#70521e] text-[#fcd34d]'
                            : log.acao.includes('DEVOLUCAO')
                            ? 'bg-[#142313] border-[#2b592f] text-[#86efac]'
                            : log.acao.includes('BAIXA')
                            ? 'bg-red-950/40 border-red-800 text-red-300'
                            : 'bg-[#161f17] border-[#2c3d2a] text-[#cfdfc7]'
                        }`}
                      >
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-bold whitespace-nowrap">
                      {log.usuarioNome}
                      <span className="text-[10px] text-[#7a8c7b] block font-normal">
                        Tipo: {log.usuarioTipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#cfdfc7] max-w-md">
                      {log.detalhes}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[10px] text-[#7eb864] whitespace-nowrap">
                      {log.hash ? `${log.hash.substring(0, 16)}...` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
