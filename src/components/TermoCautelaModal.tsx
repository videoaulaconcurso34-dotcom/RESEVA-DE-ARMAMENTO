import React from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Retirada } from '../types';

interface TermoCautelaModalProps {
  retirada: Retirada | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TermoCautelaModal: React.FC<TermoCautelaModalProps> = ({
  retirada,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !retirada) return null;

  const formatDataHora = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-mono">
      <div className="bg-[#0f141c] border border-[#1f2937] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden my-4">
        {/* Barra superior de Ações */}
        <div className="bg-[#07090d] px-4 py-3 border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#142313] border border-[#2b592f] rounded text-[#86efac]">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                TERMO DIGITAL DE CAUTELA DE MATERIAL BÉLICO
              </h2>
              <span className="text-[10px] text-[#7a8c7b] block">
                Cautela Nº {retirada.numeroCautela} • SISARM-LOG (REGISTRO EXCLUSIVAMENTE DIGITAL)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#121c13] text-[#86efac] border border-[#274627] px-2.5 py-1 rounded font-bold uppercase hidden sm:inline-block">
              100% DIGITAL • SEM PDF
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#161f2e] cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Termo Digital */}
        <div className="p-4 sm:p-8 space-y-6 text-slate-900 font-serif bg-white shadow-inner">
          {/* Cabeçalho Oficial Militar */}
          <div className="text-center border-b-2 border-black pb-4 space-y-1">
            <div className="font-bold text-xs uppercase tracking-widest text-slate-700 font-sans">
              ESTADO DE SÃO PAULO • POLÍCIA MILITAR
            </div>
            <div className="font-bold text-sm uppercase tracking-wider text-black font-sans">
              COMANDO DE POLICIAMENTO DA CAPITAL • SEÇÃO DE MATERIAL BÉLICO
            </div>
            <div className="font-bold text-xs uppercase tracking-wide text-slate-800 font-sans">
              RESERVA DE ARMAMENTO E TIRO (ARMORIAL)
            </div>
            <div className="font-bold text-base uppercase tracking-wider pt-2 text-black font-sans">
              TERMO DE RESPONSABILIDADE E CAUTELA DE ARMAMENTO
            </div>
            <div className="font-mono text-xs font-bold text-slate-800">
              CAUTELA Nº: {retirada.numeroCautela} • REGISTRO EM: {formatDataHora(retirada.dataSaida)}
            </div>
          </div>

          {/* Dados do Militar e Destino */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 border border-slate-300 font-sans">
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Militar Responsável (Recebedor):
              </span>
              <span className="font-bold text-slate-900">
                {retirada.militarServicoPatente} {retirada.militarServicoGuerra} — {retirada.militarServicoNome}
              </span>
              <span className="text-slate-600 block text-[11px]">
                RE: {retirada.militarServicoMatricula}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Armeiro Expedidor de Plantão:
              </span>
              <span className="font-bold text-slate-900">
                {retirada.militarReservaNome}
              </span>
              <span className="text-slate-600 block text-[11px]">
                Status Cautela: {retirada.status}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Finalidade / Destino Operacional:
              </span>
              <span className="font-bold text-slate-900">{retirada.tipoDestino}</span>
              <span className="text-slate-600 block text-[11px]">
                {retirada.motivoDetalhado || 'Serviço Operacional de Patrulhamento'}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Prazo Previsto para Devolução:
              </span>
              <span className="font-bold text-slate-900">
                {retirada.dataDevolucaoPrevista ? formatDataHora(retirada.dataDevolucaoPrevista) : 'Término do Turno'}
              </span>
            </div>
          </div>

          {/* Relação de Materiais */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
              Material Bélico Acautelado ({retirada.itens.length} itens)
            </div>

            <div className="overflow-x-auto border border-black">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-200 border-b border-black text-[11px]">
                    <th className="p-2 border-r border-black w-8 text-center">#</th>
                    <th className="p-2 border-r border-black">CATEGORIA</th>
                    <th className="p-2 border-r border-black">DESCRIÇÃO DO MATERIAL</th>
                    <th className="p-2 border-r border-black">Nº SÉRIE / PATRIMÔNIO</th>
                    <th className="p-2 border-r border-black text-center w-16">QTD</th>
                    <th className="p-2 text-center w-28">SITUAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {retirada.itens.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-black text-center font-mono font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-black font-bold uppercase text-[10px]">
                        {it.categoria}
                      </td>
                      <td className="p-2 border-r border-black font-semibold">
                        {it.materialNome}
                      </td>
                      <td className="p-2 border-r border-black font-mono font-bold">
                        #{it.nArmamento}
                      </td>
                      <td className="p-2 border-r border-black text-center font-mono font-bold">
                        {it.quantidade} un
                      </td>
                      <td className="p-2 text-center text-[10px] uppercase font-bold">
                        {(it.quantidadeDevolvida ?? 0) >= it.quantidade
                          ? '✓ DEVOLVIDO'
                          : (it.quantidadeDevolvida ?? 0) > 0
                          ? `PARCIAL (${it.quantidadeDevolvida}/${it.quantidade})`
                          : 'EM CARGA'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Declaração de Compromisso */}
          <div className="border border-slate-300 p-4 text-[11px] leading-relaxed text-justify space-y-2 font-sans bg-slate-50">
            <div className="font-bold text-xs uppercase text-slate-900 border-b border-slate-300 pb-1">
              Declaração de Responsabilidade e Guarda
            </div>
            <p>
              Declaro que recebi da Reserva de Armamento os materiais bélicos e equipamentos discriminados
              acima em perfeitas condições de uso, conservação e funcionamento. Assumo inteira responsabilidade
              civil, penal e militar pela guarda, integridade e correto emprego do armamento durante a execução
              do serviço operacional, comprometendo-me a restituí-lo imediatamente ao final da jornada.
            </p>
          </div>

          {/* Assinaturas Digitais */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center font-sans text-xs">
            <div className="space-y-1">
              <div className="border-t border-black pt-1 font-bold">
                {retirada.militarServicoPatente} {retirada.militarServicoGuerra}
              </div>
              <div className="text-[11px] text-slate-600">Militar Acautelado (RE: {retirada.militarServicoMatricula})</div>
              <div className="text-[10px] text-[#2b592f] font-mono font-bold">
                ✓ Assinado digitalmente com PIN pessoal
              </div>
            </div>

            <div className="space-y-1">
              <div className="border-t border-black pt-1 font-bold">
                {retirada.militarReservaNome}
              </div>
              <div className="text-[11px] text-slate-600">Armeiro Expedidor de Plantão</div>
              <div className="text-[10px] text-[#2b592f] font-mono font-bold">
                ✓ Assinado digitalmente com PIN funcional
              </div>
            </div>
          </div>

          {/* Rodapé e Hash */}
          <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <div>
              SISARM-LOG • HASH SHA-256: {retirada.hashAutenticacao}
            </div>
            <div>
              Registro Imutável de Não-Repúdio
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
