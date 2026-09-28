import { MilitarServico, MilitarReserva, ItemEstoque, Retirada, RegistroAuditoria } from '../types';

export const DEFAULT_PROJECT_ID = 'ivkahtrzxmgruqygfxna';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a2FodHJ6eG1ncnVxeWdmeG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MjA1NTU1NTU1NX0.placeholder';

export const SCRIPT_SQL_SUPABASE = `-- ============================================================================
-- SISRESERVA / SISARM-LOG - DDL COMPLETO PARA O SUPABASE (POSTGRESQL)
-- Instruções:
-- 1. Acesse o painel do seu projeto Supabase (ex: https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique em "SQL Editor"
-- 3. Clique em "+ New query"
-- 4. Cole TODO este script abaixo e clique no botão verde "Run"
-- ============================================================================

-- 1. TABELA DE MILITARES DE SERVIÇO (POLICIAIS)
CREATE TABLE IF NOT EXISTS militares_servico (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_guerra TEXT NOT NULL,
  patente TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  batalhao TEXT NOT NULL,
  companhia TEXT,
  pelotao TEXT,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  ativo BOOLEAN DEFAULT true,
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE ARMEIROS (GESTORES DA RESERVA DE ARMAMENTO)
CREATE TABLE IF NOT EXISTS armeiros (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_guerra TEXT NOT NULL,
  patente TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  funcao TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE ESTOQUE DE MATERIAL BÉLICO
CREATE TABLE IF NOT EXISTS estoque (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  modelo TEXT,
  categoria TEXT NOT NULL,
  calibre TEXT,
  n_material TEXT,
  numero_serie TEXT,
  lote TEXT,
  status TEXT NOT NULL DEFAULT 'DISPONÍVEL',
  estado TEXT NOT NULL DEFAULT 'EXCELENTE',
  local_armazenamento TEXT NOT NULL,
  quantidade_total INTEGER DEFAULT 1,
  quantidade_disponivel INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE RETIRADAS E CAUTELAS
CREATE TABLE IF NOT EXISTS retiradas (
  id TEXT PRIMARY KEY,
  numero_cautela TEXT NOT NULL UNIQUE,
  data_saida TIMESTAMPTZ NOT NULL,
  data_devolucao_prevista TIMESTAMPTZ,
  data_devolucao TIMESTAMPTZ,
  militar_servico_id TEXT,
  militar_servico_nome TEXT NOT NULL,
  militar_servico_guerra TEXT NOT NULL,
  militar_servico_patente TEXT NOT NULL,
  militar_servico_matricula TEXT NOT NULL,
  militar_reserva_id TEXT,
  militar_reserva_nome TEXT NOT NULL,
  militar_reserva_patente TEXT,
  tipo_destino TEXT NOT NULL,
  motivo_detalhado TEXT,
  prazo_previsto_horas INTEGER DEFAULT 24,
  status TEXT NOT NULL DEFAULT 'EM SERVIÇO',
  hash_assinatura_saida TEXT,
  hash_autenticacao TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  militar_devolucao_id TEXT,
  militar_devolucao_nome TEXT,
  militar_devolucao_patente TEXT,
  armeiro_recebedor_id TEXT,
  armeiro_recebedor_nome TEXT,
  hash_assinatura_devolucao TEXT,
  houve_disparos BOOLEAN DEFAULT false,
  quantidade_total_tiros_consumidos INTEGER DEFAULT 0,
  numero_boletim_ocorrencia TEXT,
  observacoes_gerais TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA DE AUDITORIA E LOGS DO SISTEMA
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id TEXT PRIMARY KEY,
  data_hora TIMESTAMPTZ DEFAULT now(),
  tipo_evento TEXT,
  acao TEXT,
  descricao TEXT,
  detalhes TEXT,
  militar_envolvido TEXT,
  armeiro_responsavel TEXT,
  usuario_nome TEXT,
  usuario_tipo TEXT,
  hash TEXT,
  hash_validacao TEXT,
  numero_cautela TEXT,
  retirada_id TEXT
);

-- 6. TABELA DE EVENTOS DE DEVOLUÇÃO (HISTÓRICO LINHA POR LINHA DE DEVOLUÇÕES PARCIAIS E TOTAIS)
CREATE TABLE IF NOT EXISTS devolucoes_eventos (
  id TEXT PRIMARY KEY,
  retirada_id TEXT NOT NULL,
  numero_cautela TEXT NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo_devolucao TEXT NOT NULL DEFAULT 'TOTAL',
  militar_nome TEXT NOT NULL,
  militar_guerra TEXT NOT NULL,
  militar_matricula TEXT NOT NULL,
  militar_patente TEXT NOT NULL,
  armeiro_recebedor_id TEXT,
  armeiro_recebedor_nome TEXT NOT NULL,
  armeiro_recebedor_patente TEXT,
  materiais_devolvidos_resumo TEXT NOT NULL,
  itens_devolvidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  tiros_consumidos INTEGER DEFAULT 0,
  numero_boletim_ocorrencia TEXT,
  observacoes TEXT,
  hash_assinatura TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- POLÍTICAS DE ACESSO (PERMISSÕES PARA API REST DO CLIENTE)
-- ============================================================================

-- Desativar RLS para operação pública via chave anônima (recomendado para SPA direta):
ALTER TABLE militares_servico DISABLE ROW LEVEL SECURITY;
ALTER TABLE armeiros DISABLE ROW LEVEL SECURITY;
ALTER TABLE estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas DISABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_eventos DISABLE ROW LEVEL SECURITY;

-- Políticas de contingência para o caso do RLS ser reativado pelo Supabase:
ALTER TABLE militares_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE armeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon acesso total devolucoes_eventos" ON devolucoes_eventos;
CREATE POLICY "Anon acesso total devolucoes_eventos" ON devolucoes_eventos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon acesso total militares_servico" ON militares_servico;
CREATE POLICY "Anon acesso total militares_servico" ON militares_servico FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso total armeiros" ON armeiros;
CREATE POLICY "Anon acesso total armeiros" ON armeiros FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso total estoque" ON estoque;
CREATE POLICY "Anon acesso total estoque" ON estoque FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso total retiradas" ON retiradas;
CREATE POLICY "Anon acesso total retiradas" ON retiradas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso total auditoria_logs" ON auditoria_logs;
CREATE POLICY "Anon acesso total auditoria_logs" ON auditoria_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Criar VIEW de compatibilidade caso tabelas antigas sejam consultadas
CREATE OR REPLACE VIEW militares AS SELECT * FROM militares_servico;
`;

export function normalizarSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';

  // 1. Se colou a URL do navegador no painel do Supabase:
  // ex: https://supabase.com/dashboard/project/ivkahtrzxmgruqygfxna
  const matchDashboard = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (matchDashboard && matchDashboard[1]) {
    return `https://${matchDashboard[1]}.supabase.co`;
  }

  // 2. Se colou a connection string do banco Postgres:
  // ex: postgresql://postgres:...@db.ivkahtrzxmgruqygfxna.supabase.co:5432/postgres
  const matchPostgres = url.match(/db\.([a-z0-9_-]+)\.supabase\.co/i);
  if (matchPostgres && matchPostgres[1]) {
    return `https://${matchPostgres[1]}.supabase.co`;
  }

  // 3. Se colou apenas o ID do projeto (ex: ivkahtrzxmgruqygfxna):
  if (/^[a-z0-9]{15,35}$/i.test(url)) {
    return `https://${url}.supabase.co`;
  }

  // 4. Se colou sem https://
  if (url.includes('.supabase.co') && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Remove caminhos extras como /settings/api ou /rest/v1
  url = url.replace(/\/settings\/api.*$/i, '');
  url = url.replace(/\/rest\/v1.*$/i, '');
  url = url.replace(/\/+$/, '');

  return url;
}

export function normalizarSupabaseKey(rawKey: string): string {
  let key = (rawKey || '').trim();
  if (!key) return '';

  // Se veio no formato "SUPABASE_ANON_KEY=..." ou "apikey: ..."
  key = key.replace(/^(SUPABASE_ANON_KEY|ANON_KEY|API_KEY|apikey|Bearer)\s*[:=]\s*/i, '');

  // Remove aspas
  key = key.replace(/^["']|["']$/g, '');

  // Se o usuário colou um bloco de texto contendo um JWT (começa com eyJ...):
  const matchJwt = key.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (matchJwt) {
    return matchJwt[0];
  }

  // Se usou formato sb_publishable:
  const matchSb = key.match(/sb_publishable_[A-Za-z0-9_-]+/);
  if (matchSb) {
    return matchSb[0];
  }

  return key;
}

export function isChavePlaceholder(key: string): boolean {
  if (!key) return true;
  return key.includes('placeholder') || key.length < 25;
}

export function getSupabaseUrl(): string {
  const salvo = localStorage.getItem('supabase_url');
  if (salvo && salvo.trim()) return normalizarSupabaseUrl(salvo);
  return DEFAULT_SUPABASE_URL;
}

export function getSupabaseKey(): string {
  const salvo = localStorage.getItem('supabase_anon_key');
  if (salvo && salvo.trim()) return normalizarSupabaseKey(salvo);
  return DEFAULT_SUPABASE_KEY;
}

export function hasCustomSupabaseConfig(): boolean {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_anon_key');
  return Boolean(url && key && !isChavePlaceholder(key));
}

export function updateSupabaseConfig(url: string, key: string) {
  const normUrl = normalizarSupabaseUrl(url);
  const normKey = normalizarSupabaseKey(key);
  if (normUrl) localStorage.setItem('supabase_url', normUrl);
  if (normKey) localStorage.setItem('supabase_anon_key', normKey);
}

export function limparCredenciaisSupabase() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  localStorage.removeItem('supabase_last_sync');
}

export interface StatusTabelasSupabase {
  militares_servico: boolean;
  armeiros: boolean;
  estoque: boolean;
  retiradas: boolean;
  auditoria_logs: boolean;
  todasExistem: boolean;
  faltando: string[];
  tabelaMilitaresNome: 'militares_servico' | 'militares';
  erroGeral?: string;
}

export async function verificarStatusTabelasSupabase(): Promise<StatusTabelasSupabase> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (isChavePlaceholder(key)) {
    return {
      militares_servico: false,
      armeiros: false,
      estoque: false,
      retiradas: false,
      auditoria_logs: false,
      todasExistem: false,
      faltando: ['militares_servico', 'armeiros', 'estoque', 'retiradas', 'auditoria_logs'],
      tabelaMilitaresNome: 'militares_servico',
      erroGeral: 'A Chave Anon atual é o placeholder inicial. Cole a chave pública "anon / public" do seu projeto em Project Settings ➔ API no Supabase e clique em SALVAR CREDENCIAIS.',
    };
  }

  // Testa conectividade e autenticação básica no endpoint REST do Supabase
  try {
    const rootCheck = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (rootCheck.status === 401 || rootCheck.status === 403) {
      return {
        militares_servico: false,
        armeiros: false,
        estoque: false,
        retiradas: false,
        auditoria_logs: false,
        todasExistem: false,
        faltando: ['militares_servico', 'armeiros', 'estoque', 'retiradas', 'auditoria_logs'],
        tabelaMilitaresNome: 'militares_servico',
        erroGeral: `Chave Anon / API Key inválida (Erro ${rootCheck.status}). Acesse seu projeto Supabase ➔ Project Settings ➔ API e copie a chave "anon / public".`,
      };
    }
  } catch (err: any) {
    return {
      militares_servico: false,
      armeiros: false,
      estoque: false,
      retiradas: false,
      auditoria_logs: false,
      todasExistem: false,
      faltando: ['militares_servico', 'armeiros', 'estoque', 'retiradas', 'auditoria_logs'],
      tabelaMilitaresNome: 'militares_servico',
      erroGeral: `Não foi possível conectar ao servidor Supabase em ${url}. Verifique se a URL do projeto está correta (ex: https://xyz.supabase.co).`,
    };
  }

  const checarTabela = async (tabela: string): Promise<boolean> => {
    try {
      const resp = await fetch(`${url}/rest/v1/${tabela}?select=*&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      return resp.ok;
    } catch {
      return false;
    }
  };

  // Verifica militares_servico primeiro, e depois militares como fallback
  let militaresExiste = await checarTabela('militares_servico');
  let tabelaMilitaresNome: 'militares_servico' | 'militares' = 'militares_servico';
  if (!militaresExiste) {
    const fallbackMil = await checarTabela('militares');
    if (fallbackMil) {
      militaresExiste = true;
      tabelaMilitaresNome = 'militares';
    }
  }

  const armeiros = await checarTabela('armeiros');
  const estoque = await checarTabela('estoque');
  const retiradas = await checarTabela('retiradas');
  const auditoriaLogs = await checarTabela('auditoria_logs');

  const faltando: string[] = [];
  if (!militaresExiste) faltando.push('militares_servico');
  if (!armeiros) faltando.push('armeiros');
  if (!estoque) faltando.push('estoque');
  if (!retiradas) faltando.push('retiradas');
  if (!auditoriaLogs) faltando.push('auditoria_logs');

  return {
    militares_servico: militaresExiste,
    armeiros,
    estoque,
    retiradas,
    auditoria_logs: auditoriaLogs,
    todasExistem: faltando.length === 0,
    faltando,
    tabelaMilitaresNome,
  };
}

export async function testarConexaoSupabase(customConfig?: { url: string; anonKey: string }): Promise<{
  sucesso: boolean;
  mensagem: string;
  tabelasFaltando?: string[];
  status?: StatusTabelasSupabase;
}> {
  if (customConfig?.url && customConfig?.anonKey) {
    updateSupabaseConfig(customConfig.url, customConfig.anonKey);
  }
  try {
    const status = await verificarStatusTabelasSupabase();
    if (status.erroGeral) {
      return {
        sucesso: false,
        mensagem: status.erroGeral,
        status,
      };
    }
    if (status.todasExistem) {
      return {
        sucesso: true,
        mensagem: 'Conexão estabelecida com sucesso! Todas as 5 tabelas estão prontas e sincronizadas no Supabase.',
        status,
      };
    } else {
      return {
        sucesso: false,
        mensagem: `Conectado ao Supabase, porém faltam ${status.faltando.length} tabela(s) no banco: ${status.faltando.join(', ')}. Execute o Script DDL no SQL Editor.`,
        tabelasFaltando: status.faltando,
        status,
      };
    }
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: `Falha de conexão com o Supabase: ${err?.message || 'Verifique a URL e a Chave Anon'}`,
    };
  }
}

export async function pushDadosParaSupabase(dados: {
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  estoque: ItemEstoque[];
  retiradas: Retirada[];
  auditoria: RegistroAuditoria[];
}): Promise<{ sucesso: boolean; mensagem: string; erros?: string[] }> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  const headers = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'resolution=merge-duplicates',
  };

  const erros: string[] = [];

  try {
    // 1. Militares de Serviço (tenta militares_servico, se falhar tenta militares)
    if (dados.militares.length > 0) {
      const payloadMilitares = dados.militares.map((m) => ({
        id: m.id,
        matricula: m.matricula,
        nome: m.nome,
        nome_guerra: m.nomeGuerra,
        patente: m.patente,
        batalhao: m.batalhao,
        companhia: m.companhia || '',
        pelotao: m.pelotao || '',
        status: m.status || (m.ativo ? 'ATIVO' : 'INATIVO'),
        ativo: m.ativo ?? true,
        senha_hash: m.senhaHash,
      }));

      let resp = await fetch(`${url}/rest/v1/militares_servico`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadMilitares),
      });

      if (!resp.ok) {
        // Fallback para 'militares'
        resp = await fetch(`${url}/rest/v1/militares`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payloadMilitares),
        });
        if (!resp.ok) {
          erros.push('Tabela militares_servico');
        }
      }
    }

    // 2. Armeiros
    if (dados.armeiros.length > 0) {
      const payloadArmeiros = dados.armeiros.map((a) => ({
        id: a.id,
        matricula: a.matricula,
        nome: a.nome,
        nome_guerra: a.nomeGuerra,
        patente: a.patente,
        funcao: a.funcao,
        ativo: a.ativo ?? true,
        senha_hash: a.senhaHash,
      }));
      const resp = await fetch(`${url}/rest/v1/armeiros`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadArmeiros),
      });
      if (!resp.ok) erros.push('Tabela armeiros');
    }

    // 3. Estoque
    if (dados.estoque.length > 0) {
      const payloadEstoque = dados.estoque.map((e) => ({
        id: e.id,
        categoria: e.categoria,
        nome: e.nome,
        modelo: e.modelo || '',
        calibre: e.calibre || '',
        n_material: e.nMaterial,
        numero_serie: e.nMaterial,
        lote: e.lote || '',
        status: e.status,
        estado: e.estado,
        local_armazenamento: e.localArmazenamento,
        quantidade_disponivel: e.quantidadeDisponivel ?? 1,
        quantidade_total: e.quantidadeTotal ?? 1,
      }));
      const resp = await fetch(`${url}/rest/v1/estoque`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadEstoque),
      });
      if (!resp.ok) erros.push('Tabela estoque');
    }

    // 4. Retiradas
    if (dados.retiradas.length > 0) {
      const payloadRetiradas = dados.retiradas.map((r) => ({
        id: r.id,
        numero_cautela: r.numeroCautela,
        status: r.status,
        tipo_destino: r.tipoDestino,
        motivo_detalhado: r.motivoDetalhado || '',
        prazo_previsto_horas: r.prazoPrevistoHoras || 24,
        data_saida: r.dataSaida,
        data_devolucao_prevista: r.dataDevolucaoPrevista || null,
        data_devolucao: r.dataDevolucao || null,
        militar_servico_id: r.militarServicoId,
        militar_servico_nome: r.militarServicoNome,
        militar_servico_guerra: r.militarServicoGuerra,
        militar_servico_patente: r.militarServicoPatente,
        militar_servico_matricula: r.militarServicoMatricula,
        militar_reserva_id: r.militarReservaId,
        militar_reserva_nome: r.militarReservaNome,
        militar_reserva_patente: r.militarReservaPatente || '',
        hash_assinatura_saida: r.hashAssinaturaSaida || r.hashAutenticacao || '',
        hash_autenticacao: r.hashAutenticacao || r.hashAssinaturaSaida || '',
        itens: r.itens || [],
        militar_devolucao_id: r.militarDevolucaoId || null,
        militar_devolucao_nome: r.militarDevolucaoNome || null,
        militar_devolucao_patente: r.militarDevolucaoPatente || null,
        armeiro_recebedor_id: r.armeiroRecebedorId || null,
        armeiro_recebedor_nome: r.armeiroRecebedorNome || null,
        hash_assinatura_devolucao: r.hashAssinaturaDevolucao || null,
        houve_disparos: r.houveDisparos ?? false,
        quantidade_total_tiros_consumidos: r.quantidadeTotalTirosConsumidos || 0,
        numero_boletim_ocorrencia: r.numeroBoletimOcorrencia || null,
        observacoes_gerais: r.observacoesGerais || null,
        historico_devolucoes: r.historicoDevolucoes || [],
      }));
      const resp = await fetch(`${url}/rest/v1/retiradas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadRetiradas),
      });
      if (!resp.ok) erros.push('Tabela retiradas');

      // 4.1. Tabela de Eventos de Devolução (Linha por linha de cada devolução parcial ou final)
      const todosEventosDevolucao: any[] = [];
      dados.retiradas.forEach((r) => {
        if (r.historicoDevolucoes && r.historicoDevolucoes.length > 0) {
          r.historicoDevolucoes.forEach((ev) => {
            const resumoItens = (ev.itensDevolvidos || [])
              .map((it) => `${it.quantidadeDevolvida}x ${it.materialNome} (Série: ${it.nArmamento || 'S/N'})`)
              .join(' | ');

            todosEventosDevolucao.push({
              id: ev.id,
              retirada_id: r.id,
              numero_cautela: r.numeroCautela,
              data_hora: ev.dataHora,
              tipo_devolucao: ev.tipoDevolucao,
              militar_nome: ev.militarDevolucaoNome,
              militar_guerra: ev.militarDevolucaoGuerra,
              militar_patente: ev.militarDevolucaoPatente,
              militar_matricula: ev.militarDevolucaoMatricula || r.militarServicoMatricula,
              armeiro_recebedor_id: ev.armeiroRecebedorId,
              armeiro_recebedor_nome: ev.armeiroRecebedorNome,
              armeiro_recebedor_patente: ev.armeiroRecebedorPatente,
              materiais_devolvidos_resumo: resumoItens,
              itens_devolvidos: ev.itensDevolvidos || [],
              tiros_consumidos: ev.quantidadeTotalTirosConsumidos || 0,
              numero_boletim_ocorrencia: ev.numeroBoletimOcorrencia || null,
              observacoes: ev.observacoes || null,
              hash_assinatura: ev.hashAssinaturaDevolucao,
            });
          });
        }
      });

      if (todosEventosDevolucao.length > 0) {
        try {
          await fetch(`${url}/rest/v1/devolucoes_eventos`, {
            method: 'POST',
            headers,
            body: JSON.stringify(todosEventosDevolucao),
          });
        } catch {
          // Fallback silencioso se o usuário ainda não tiver rodado o DDL da tabela devolucoes_eventos
        }
      }
    }

    // 5. Auditoria Logs
    if (dados.auditoria && dados.auditoria.length > 0) {
      const payloadAuditoria = dados.auditoria.map((log) => ({
        id: log.id,
        data_hora: log.dataHora,
        tipo_evento: log.tipoEvento || log.acao || 'EVENTO',
        acao: log.acao || log.tipoEvento || 'EVENTO',
        descricao: log.descricao || log.detalhes || '',
        detalhes: log.detalhes || log.descricao || '',
        militar_envolvido: log.militarEnvolvido || '',
        armeiro_responsavel: log.armeiroResponsavel || '',
        usuario_nome: log.usuarioNome || log.armeiroResponsavel || 'SISTEMA',
        usuario_tipo: log.usuarioTipo || 'ARMEIRO',
        hash: log.hash || log.hashValidacao || '',
        hash_validacao: log.hashValidacao || log.hash || '',
        numero_cautela: log.numeroCautela || log.retiradaId || null,
        retirada_id: log.retiradaId || log.numeroCautela || null,
      }));
      const resp = await fetch(`${url}/rest/v1/auditoria_logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadAuditoria),
      });
      if (!resp.ok) erros.push('Tabela auditoria_logs');
    }

    const agora = new Date().toLocaleTimeString('pt-BR');
    localStorage.setItem('supabase_last_sync', agora);

    if (erros.length === 0) {
      return {
        sucesso: true,
        mensagem: `Todas as tabelas foram enviadas e sincronizadas no Supabase com sucesso às ${agora}!`,
      };
    } else {
      return {
        sucesso: false,
        mensagem: `Sincronização parcial: Falha ao enviar para ${erros.join(', ')}. Execute o script DDL SQL no Supabase para criá-las.`,
        erros,
      };
    }
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: `Erro ao enviar dados para o Supabase: ${err.message}`,
    };
  }
}

export async function pullDadosDoSupabase(): Promise<{
  sucesso: boolean;
  mensagem: string;
  militares?: MilitarServico[];
  armeiros?: MilitarReserva[];
  estoque?: ItemEstoque[];
  retiradas?: Retirada[];
  auditoria?: RegistroAuditoria[];
}> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  try {
    // 1. Militares
    let militares: MilitarServico[] = [];
    try {
      let resM = await fetch(`${url}/rest/v1/militares_servico?select=*`, { headers });
      if (!resM.ok) {
        resM = await fetch(`${url}/rest/v1/militares?select=*`, { headers });
      }
      if (resM.ok) {
        const data = await resM.json();
        militares = data.map((d: any) => ({
          id: String(d.id),
          matricula: d.matricula,
          nome: d.nome,
          nomeGuerra: d.nome_guerra,
          patente: d.patente,
          batalhao: d.batalhao,
          companhia: d.companhia || '',
          pelotao: d.pelotao || '',
          senhaHash: d.senha_hash,
          ativo: d.ativo ?? true,
          status: d.status || 'ATIVO',
        }));
      }
    } catch {}

    // 2. Armeiros
    let armeiros: MilitarReserva[] = [];
    try {
      const resA = await fetch(`${url}/rest/v1/armeiros?select=*`, { headers });
      if (resA.ok) {
        const data = await resA.json();
        armeiros = data.map((d: any) => ({
          id: String(d.id),
          matricula: d.matricula,
          nome: d.nome,
          nomeGuerra: d.nome_guerra,
          patente: d.patente,
          funcao: d.funcao,
          senhaHash: d.senha_hash,
          ativo: d.ativo ?? true,
        }));
      }
    } catch {}

    // 3. Estoque
    let estoque: ItemEstoque[] = [];
    try {
      const resE = await fetch(`${url}/rest/v1/estoque?select=*`, { headers });
      if (resE.ok) {
        const data = await resE.json();
        estoque = data.map((d: any) => ({
          id: String(d.id),
          categoria: d.categoria,
          nome: d.nome,
          modelo: d.modelo || '',
          calibre: d.calibre || '',
          nMaterial: d.n_material || d.numero_serie || '',
          lote: d.lote || '',
          status: d.status,
          estado: d.estado,
          localArmazenamento: d.local_armazenamento,
          quantidadeDisponivel: d.quantidade_disponivel,
          quantidadeTotal: d.quantidade_total,
        }));
      }
    } catch {}

    // 4. Retiradas
    let retiradas: Retirada[] = [];
    try {
      const resR = await fetch(`${url}/rest/v1/retiradas?select=*`, { headers });
      if (resR.ok) {
        const data = await resR.json();
        retiradas = data.map((d: any) => ({
          id: String(d.id),
          numeroCautela: d.numero_cautela,
          status: d.status,
          tipoDestino: d.tipo_destino,
          motivoDetalhado: d.motivo_detalhado || '',
          prazoPrevistoHoras: d.prazo_previsto_horas,
          dataSaida: d.data_saida,
          dataDevolucaoPrevista: d.data_devolucao_prevista,
          militarServicoId: d.militar_servico_id,
          militarServicoNome: d.militar_servico_nome,
          militarServicoGuerra: d.militar_servico_guerra,
          militarServicoPatente: d.militar_servico_patente,
          militarServicoMatricula: d.militar_servico_matricula,
          militarReservaId: d.militar_reserva_id,
          militarReservaNome: d.militar_reserva_nome,
          militarReservaPatente: d.militar_reserva_patente,
          hashAssinaturaSaida: d.hash_assinatura_saida || d.hash_autenticacao,
          hashAutenticacao: d.hash_autenticacao || d.hash_assinatura_saida,
          itens: d.itens || [],
          dataDevolucao: d.data_devolucao,
          militarDevolucaoId: d.militar_devolucao_id,
          militarDevolucaoNome: d.militar_devolucao_nome,
          militarDevolucaoPatente: d.militar_devolucao_patente,
          armeiroRecebedorId: d.armeiro_recebedor_id,
          armeiroRecebedorNome: d.armeiro_recebedor_nome,
          hashAssinaturaDevolucao: d.hash_assinatura_devolucao,
          houveDisparos: d.houve_disparos,
          quantidadeTotalTirosConsumidos: d.quantidade_total_tiros_consumidos,
          numeroBoletimOcorrencia: d.numero_boletim_ocorrencia,
          observacoesGerais: d.observacoes_gerais,
          historicoDevolucoes: d.historico_devolucoes || [],
        }));
      }
    } catch {}

    // 5. Auditoria Logs
    let auditoria: RegistroAuditoria[] = [];
    try {
      const resLog = await fetch(`${url}/rest/v1/auditoria_logs?select=*`, { headers });
      if (resLog.ok) {
        const data = await resLog.json();
        auditoria = data.map((d: any) => ({
          id: String(d.id),
          dataHora: d.data_hora,
          tipoEvento: d.tipo_evento || d.acao || 'EVENTO',
          descricao: d.descricao || d.detalhes || '',
          militarEnvolvido: d.militar_envolvido || '',
          armeiroResponsavel: d.armeiro_responsavel || '',
          hashValidacao: d.hash_validacao || d.hash || '',
          retiradaId: d.retirada_id || d.numero_cautela,
        }));
      }
    } catch {}

    const agora = new Date().toLocaleTimeString('pt-BR');
    localStorage.setItem('supabase_last_sync', agora);

    return {
      sucesso: true,
      mensagem: `Importação realizada do Supabase com sucesso às ${agora}!`,
      militares,
      armeiros,
      estoque,
      retiradas,
      auditoria,
    };
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: `Erro ao importar dados do Supabase: ${err.message}`,
    };
  }
}

let syncTimeout: any = null;

export function dispararAutoSyncSupabase(getData: () => {
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  estoque: ItemEstoque[];
  retiradas: Retirada[];
  auditoria: RegistroAuditoria[];
}) {
  if (localStorage.getItem('supabase_autosync') === 'false') return;

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const dados = getData();
      await pushDadosParaSupabase(dados);
      window.dispatchEvent(new CustomEvent('sisreserva_supabase_autosynced'));
    } catch {}
  }, 1000);
}

export function carregarConfigSupabase() {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseKey(),
    autoSync: localStorage.getItem('supabase_autosync') !== 'false',
  };
}

export function salvarConfigSupabase(config: { url: string; anonKey: string; autoSync?: boolean }) {
  updateSupabaseConfig(config.url, config.anonKey);
  if (config.autoSync !== undefined) {
    localStorage.setItem('supabase_autosync', String(config.autoSync));
  }
}

export const sincronizarDadosComSupabase = pushDadosParaSupabase;

export async function puxarDadosDoSupabase() {
  const res = await pullDadosDoSupabase();
  return {
    sucesso: res.sucesso,
    mensagem: res.mensagem,
    dados: res.sucesso
      ? {
          militares: res.militares,
          armeiros: res.armeiros,
          estoque: res.estoque,
          retiradas: res.retiradas,
          auditoria: res.auditoria,
        }
      : null,
  };
}
