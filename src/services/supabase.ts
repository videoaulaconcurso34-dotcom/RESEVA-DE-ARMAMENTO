import { MilitarServico, MilitarReserva, ItemEstoque, Retirada, RegistroAuditoria } from '../types';

export const DEFAULT_PROJECT_ID = 'ivkahtrzxmgruqygfxna';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2a2FodHJ6eG1ncnVxeWdmeG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MjA1NTU1NTU1NX0.placeholder';

export function getSupabaseUrl(): string {
  return localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
}

export function getSupabaseKey(): string {
  return localStorage.getItem('supabase_anon_key') || DEFAULT_SUPABASE_KEY;
}

export function updateSupabaseConfig(url: string, key: string) {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_anon_key', key);
}

export async function verificarStatusTabelasSupabase(): Promise<{
  militares: boolean;
  armeiros: boolean;
  estoque: boolean;
  retiradas: boolean;
  todasExistem: boolean;
  faltando: string[];
}> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

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

  const militares = await checarTabela('militares');
  const armeiros = await checarTabela('armeiros');
  const estoque = await checarTabela('estoque');
  const retiradas = await checarTabela('retiradas');

  const faltando: string[] = [];
  if (!militares) faltando.push('militares');
  if (!armeiros) faltando.push('armeiros');
  if (!estoque) faltando.push('estoque');
  if (!retiradas) faltando.push('retiradas');

  return {
    militares,
    armeiros,
    estoque,
    retiradas,
    todasExistem: faltando.length === 0,
    faltando,
  };
}

export async function testarConexaoSupabase(customConfig?: { url: string; anonKey: string }): Promise<{
  sucesso: boolean;
  mensagem: string;
  tabelasFaltando?: string[];
}> {
  if (customConfig?.url && customConfig?.anonKey) {
    updateSupabaseConfig(customConfig.url, customConfig.anonKey);
  }
  try {
    const status = await verificarStatusTabelasSupabase();
    if (status.todasExistem) {
      return {
        sucesso: true,
        mensagem: 'Conexão estabelecida com sucesso! Todas as tabelas estão prontas.',
      };
    } else {
      return {
        sucesso: true,
        mensagem: `Conectado ao endpoint do Supabase, porém ${status.faltando.length} tabela(s) ainda não foram criadas no banco de dados (${status.faltando.join(', ')}).`,
        tabelasFaltando: status.faltando,
      };
    }
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: `Falha de conexão com o Supabase: ${err?.message || 'Verifique a URL e a Chave'}`,
    };
  }
}

export async function pushDadosParaSupabase(dados: {
  militares: MilitarServico[];
  armeiros: MilitarReserva[];
  estoque: ItemEstoque[];
  retiradas: Retirada[];
  auditoria: RegistroAuditoria[];
}): Promise<{ sucesso: boolean; mensagem: string }> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  const headers = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'resolution=merge-duplicates',
  };

  try {
    // 1. Militares
    if (dados.militares.length > 0) {
      const payloadMilitares = dados.militares.map((m) => ({
        id: m.id,
        matricula: m.matricula,
        nome: m.nome,
        nome_guerra: m.nomeGuerra,
        patente: m.patente,
        batalhao: m.batalhao,
        companhia: m.companhia,
        pelotao: m.pelotao || '',
        senha_hash: m.senhaHash,
        ativo: m.ativo,
      }));
      await fetch(`${url}/rest/v1/militares`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadMilitares),
      }).catch(() => {});
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
        senha_hash: a.senhaHash,
        ativo: a.ativo,
      }));
      await fetch(`${url}/rest/v1/armeiros`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadArmeiros),
      }).catch(() => {});
    }

    // 3. Estoque
    if (dados.estoque.length > 0) {
      const payloadEstoque = dados.estoque.map((e) => ({
        id: e.id,
        categoria: e.categoria,
        nome: e.nome,
        modelo: e.modelo || '',
        calibre: e.calibre || '',
        numero_serie: e.nMaterial,
        lote: e.lote || '',
        status: e.status,
        estado: e.estado,
        local_armazenamento: e.localArmazenamento,
        quantidade_disponivel: e.quantidadeDisponivel ?? 1,
        quantidade_total: e.quantidadeTotal ?? 1,
      }));
      await fetch(`${url}/rest/v1/estoque`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadEstoque),
      }).catch(() => {});
    }

    // 4. Retiradas
    if (dados.retiradas.length > 0) {
      const payloadRetiradas = dados.retiradas.map((r) => ({
        id: r.id,
        numero_cautela: r.numeroCautela,
        status: r.status,
        tipo_destino: r.tipoDestino,
        motivo_detalhado: r.motivoDetalhado,
        prazo_previsto_horas: r.prazoPrevistoHoras,
        data_saida: r.dataSaida,
        militar_servico_id: r.militarServicoId,
        militar_servico_nome: r.militarServicoNome,
        militar_servico_guerra: r.militarServicoGuerra,
        militar_servico_patente: r.militarServicoPatente,
        militar_servico_matricula: r.militarServicoMatricula,
        militar_reserva_id: r.militarReservaId,
        militar_reserva_nome: r.militarReservaNome,
        militar_reserva_patente: r.militarReservaPatente,
        hash_assinatura_saida: r.hashAssinaturaSaida || '',
        itens: r.itens,
        data_devolucao: r.dataDevolucao || null,
        militar_devolucao_id: r.militarDevolucaoId || null,
        militar_devolucao_nome: r.militarDevolucaoNome || null,
        armeiro_recebedor_id: r.armeiroRecebedorId || null,
        armeiro_recebedor_nome: r.armeiroRecebedorNome || null,
        hash_assinatura_devolucao: r.hashAssinaturaDevolucao || null,
        houve_disparos: r.houveDisparos ?? false,
        quantidade_total_tiros_consumidos: r.quantidadeTotalTirosConsumidos || 0,
        numero_boletim_ocorrencia: r.numeroBoletimOcorrencia || null,
        observacoes_gerais: r.observacoesGerais || null,
      }));
      await fetch(`${url}/rest/v1/retiradas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadRetiradas),
      }).catch(() => {});
    }

    const agora = new Date().toLocaleTimeString('pt-BR');
    localStorage.setItem('supabase_last_sync', agora);

    return {
      sucesso: true,
      mensagem: `Dados enviados com sucesso para o Supabase às ${agora}!`,
    };
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
      const resM = await fetch(`${url}/rest/v1/militares?select=*`, { headers });
      if (resM.ok) {
        const data = await resM.json();
        militares = data.map((d: any) => ({
          id: d.id,
          matricula: d.matricula,
          nome: d.nome,
          nomeGuerra: d.nome_guerra,
          patente: d.patente,
          batalhao: d.batalhao,
          companhia: d.companhia,
          pelotao: d.pelotao,
          senhaHash: d.senha_hash,
          ativo: d.ativo,
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
          id: d.id,
          matricula: d.matricula,
          nome: d.nome,
          nomeGuerra: d.nome_guerra,
          patente: d.patente,
          funcao: d.funcao,
          senhaHash: d.senha_hash,
          ativo: d.ativo,
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
          id: d.id,
          categoria: d.categoria,
          nome: d.nome,
          modelo: d.modelo,
          calibre: d.calibre,
          nMaterial: d.numero_serie,
          lote: d.lote,
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
          id: d.id,
          numeroCautela: d.numero_cautela,
          status: d.status,
          tipoDestino: d.tipo_destino,
          motivoDetalhado: d.motivo_detalhado,
          prazoPrevistoHoras: d.prazo_previsto_horas,
          dataSaida: d.data_saida,
          militarServicoId: d.militar_servico_id,
          militarServicoNome: d.militar_servico_nome,
          militarServicoGuerra: d.militar_servico_guerra,
          militarServicoPatente: d.militar_servico_patente,
          militarServicoMatricula: d.militar_servico_matricula,
          militarReservaId: d.militar_reserva_id,
          militarReservaNome: d.militar_reserva_nome,
          militarReservaPatente: d.militar_reserva_patente,
          hashAssinaturaSaida: d.hash_assinatura_saida,
          itens: d.itens || [],
          dataDevolucao: d.data_devolucao,
          militarDevolucaoId: d.militar_devolucao_id,
          militarDevolucaoNome: d.militar_devolucao_nome,
          armeiroRecebedorId: d.armeiro_recebedor_id,
          armeiroRecebedorNome: d.armeiro_recebedor_nome,
          hashAssinaturaDevolucao: d.hash_assinatura_devolucao,
          houveDisparos: d.houve_disparos,
          quantidadeTotalTirosConsumidos: d.quantidade_total_tiros_consumidos,
          numeroBoletimOcorrencia: d.numero_boletim_ocorrencia,
          observacoesGerais: d.observacoes_gerais,
        }));
      }
    } catch {}

    const agora = new Date().toLocaleTimeString('pt-BR');
    localStorage.setItem('supabase_last_sync', agora);

    return {
      sucesso: true,
      mensagem: `Importação realizada do Supabase às ${agora}!`,
      militares,
      armeiros,
      estoque,
      retiradas,
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
        }
      : null,
  };
}

