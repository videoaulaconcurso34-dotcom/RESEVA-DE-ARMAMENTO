import React, { useState } from 'react';
import {
  FileCode2,
  X,
  Database,
  Table,
  Lock,
  Copy,
  Check,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../services/db';

interface DocumentacaoTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentacaoTecnicaModal: React.FC<DocumentacaoTecnicaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const schemaSQL = `-- ============================================================================
-- SISRESERVA / SISARM-LOG - ESTRUTURA COMPLETA SUPABASE / POSTGRESQL (DDL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS militares_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_guerra TEXT NOT NULL,
  patente TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  batalhao TEXT NOT NULL,
  companhia TEXT,
  pelotao TEXT,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS armeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_guerra TEXT NOT NULL,
  patente TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  funcao TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  modelo TEXT,
  categoria TEXT NOT NULL,
  calibre TEXT,
  n_material TEXT NOT NULL UNIQUE,
  lote TEXT,
  status TEXT NOT NULL DEFAULT 'DISPONÍVEL',
  estado TEXT NOT NULL DEFAULT 'EXCELENTE',
  local_armazenamento TEXT NOT NULL,
  quantidade_total INTEGER DEFAULT 1,
  quantidade_disponivel INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retiradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cautela TEXT NOT NULL UNIQUE,
  data_saida TIMESTAMPTZ NOT NULL,
  data_devolucao_prevista TIMESTAMPTZ,
  data_devolucao_real TIMESTAMPTZ,
  militar_servico_id UUID REFERENCES militares_servico(id),
  militar_servico_nome TEXT NOT NULL,
  militar_servico_guerra TEXT NOT NULL,
  militar_servico_patente TEXT NOT NULL,
  militar_servico_matricula TEXT NOT NULL,
  militar_reserva_id UUID REFERENCES armeiros(id),
  militar_reserva_nome TEXT NOT NULL,
  tipo_destino TEXT NOT NULL,
  motivo_detalhado TEXT,
  status TEXT NOT NULL DEFAULT 'EM SERVIÇO',
  hash_autenticacao TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auditoria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TIMESTAMPTZ DEFAULT now(),
  acao TEXT NOT NULL,
  usuario_id UUID,
  usuario_nome TEXT NOT NULL,
  usuario_tipo TEXT NOT NULL,
  detalhes TEXT NOT NULL,
  hash TEXT NOT NULL,
  numero_cautela TEXT
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-mono">
      <div className="bg-[#0f141c] border border-[#1f2937] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-4">
        <div className="bg-[#07090d] px-4 py-3 border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#142313] border border-[#2b592f] rounded text-[#86efac]">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                DOCUMENTAÇÃO TÉCNICA DO SISTEMA & DDL SUPABASE / GOOGLE SHEETS
              </h2>
              <span className="text-[10px] text-[#7a8c7b] block">
                Especificação de arquitetura, banco relacional e regras de negócio
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#161f2e] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-[#cfdfc7]">
          {/* Módulo Arquitetura */}
          <div className="space-y-2 bg-[#121812] border border-[#232f22] p-4 rounded">
            <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#86efac]" />
              1. ARQUITETURA DE SEGURANÇA E CONFORMIDADE MILITAR
            </h3>
            <p className="text-[11px] text-[#a5bca3] leading-relaxed">
              O SISRESERVA (SISARM-LOG) foi concebido para atender rigorosamente às normas de controle de armamento das Polícias Militares e Forças Armadas (R-105 / RAE).
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#9bb88d]">
              <li><strong>Dupla Autenticação (PIN):</strong> Cautelas e devoluções exigem assinatura digital simultânea do Militar de Serviço e do Armeiro de Plantão.</li>
              <li><strong>Assinatura Criptográfica SHA-256:</strong> Cada cautela gera um hash imutável de não-repúdio vinculando itens, séries, timestamp e matrículas.</li>
              <li><strong>Regra 1 p/ 1 (Armamento):</strong> Rastreabilidade individual de armas de fogo por número de série exclusivo.</li>
              <li><strong>Offline-First:</strong> Operação ininterrupta em contingência através do LocalStorage com sincronização sob demanda via Supabase REST e Google Sheets.</li>
            </ul>
          </div>

          {/* DDL SQL */}
          <div className="space-y-2 bg-[#121812] border border-[#232f22] p-4 rounded">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-[#86efac]" />
                2. ESQUEMA RELACIONAL POSTGRESQL / SUPABASE (DDL)
              </h3>
              <button
                onClick={() => handleCopy(schemaSQL, 'sql')}
                className="text-[10px] bg-[#1a2618] border border-[#2d422a] text-[#86efac] px-2.5 py-1 rounded font-bold uppercase flex items-center gap-1 hover:bg-[#253723] cursor-pointer"
              >
                {copiedSection === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'sql' ? 'COPIADO!' : 'COPIAR SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#080d09] border border-[#1f291f] text-[10px] text-[#7eb864] font-mono rounded overflow-x-auto max-h-60">
              {schemaSQL}
            </pre>
          </div>

          {/* Planilha Google Sheets */}
          <div className="space-y-2 bg-[#121812] border border-[#232f22] p-4 rounded">
            <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#86efac]" />
              3. INTEGRAÇÃO COM GOOGLE SHEETS
            </h3>
            <p className="text-[11px] text-[#a5bca3] leading-relaxed">
              O sistema permite exportar a totalidade dos registros operacionais para uma planilha Google Sheets configurada via Script Webhook ou API, alimentando automaticamente o "Livro de Carga e Descarga Geral".
            </p>
            <div className="bg-[#080d09] p-2.5 border border-[#1f291f] rounded text-[10px] text-[#7a8c7b] space-y-1">
              <div>• <strong>Aba 1:</strong> RETIRADAS_ATIVAS (Número, RE, Militar, Itens, Data/Hora, Status)</div>
              <div>• <strong>Aba 2:</strong> HISTORICO_DEVOLUCOES (Número, Militar, Armeiro, BO, Consumo de Munições)</div>
              <div>• <strong>Aba 3:</strong> INVENTARIO_ARMORIAL (Patrimônio, Modelo, Calibre, Status, Localização)</div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#1f2937] bg-[#07090d] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#182417] hover:bg-[#233521] text-[#9bb88d] border border-[#2d4529] px-4 py-1.5 rounded text-xs uppercase cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
