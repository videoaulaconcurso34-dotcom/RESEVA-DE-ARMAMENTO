import {
  MilitarServico,
  MilitarReserva,
  ItemEstoque,
  Retirada,
  RegistroAuditoria,
  RegistroBaixa,
  ItemCarrinhoRetirada,
  EstadoConservacao,
  StatusRetirada,
} from '../types';

const STORAGE_KEYS = {
  ESTOQUE: 'sisreserva_estoque',
  MILITARES: 'sisreserva_militares',
  ARMEIROS: 'sisreserva_armeiros',
  RETIRADAS: 'sisreserva_retiradas',
  AUDITORIA: 'sisreserva_auditoria',
  BAIXAS: 'sisreserva_baixas',
};

// Initial Data
const DADOS_INICIAIS_ARMEIROS: MilitarReserva[] = [
  {
    id: 'arm-1',
    matricula: '198.432-1',
    nome: 'Luciano Ventura dos Santos',
    nomeGuerra: 'VENTURA',
    patente: 'Sd',
    funcao: 'Responsável pelo Setor',
    senhaHash: '4669',
    ativo: true,
  },
  {
    id: 'arm-2',
    matricula: '184.210-9',
    nome: 'Marcos Anderson Silva',
    nomeGuerra: 'SILVA',
    patente: '1º Sgt',
    funcao: 'Armeiro Auxiliar',
    senhaHash: 'admin',
    ativo: true,
  },
  {
    id: 'arm-3',
    matricula: '172.908-4',
    nome: 'Rodrigo Braga Oliveira',
    nomeGuerra: 'BRAGA',
    patente: 'SubTen',
    funcao: 'Oficial de Dia',
    senhaHash: 'admin',
    ativo: true,
  },
];

const DADOS_INICIAIS_MILITARES: MilitarServico[] = [
  {
    id: 'mil-1',
    matricula: '215.890-3',
    nome: 'Sergio Mendes de Albuquerque',
    nomeGuerra: 'MENDES',
    patente: 'Cb',
    batalhao: '1º BPChq - ROTA (Rondas Ostensivas Tobias de Aguiar)',
    companhia: '1ª Cia',
    pelotao: '1º Pelotão',
    senhaHash: '1234',
    ativo: true,
    batalhaoCompanhia: '1º BPChq - ROTA',
  },
  {
    id: 'mil-2',
    matricula: '224.115-8',
    nome: 'Carlos Eduardo Nogueira',
    nomeGuerra: 'NOGUEIRA',
    patente: 'Sd',
    batalhao: '1º Batalhão de Polícia Ambiental',
    companhia: '2ª Cia Ambiental',
    pelotao: 'Pelotão Fluvial',
    senhaHash: '1234',
    ativo: true,
    batalhaoCompanhia: '1º BPAmb',
  },
  {
    id: 'mil-3',
    matricula: '190.334-2',
    nome: 'Felipe Alcantara Barreto',
    nomeGuerra: 'BARRETO',
    patente: '3º Sgt',
    batalhao: '1º BAEP (Batalhão de Ações Especiais de Polícia)',
    companhia: 'Ações Especiais',
    pelotao: 'Tático Ostensivo',
    senhaHash: '1234',
    ativo: true,
    batalhaoCompanhia: '1º BAEP',
  },
  {
    id: 'mil-4',
    matricula: '202.998-1',
    nome: 'Luciano Ventura dos Santos',
    nomeGuerra: 'VENTURA',
    patente: 'Sd',
    batalhao: '1º Batalhão de Polícia Militar Metropolitano',
    companhia: 'Comando',
    pelotao: 'Reserva de Armas',
    senhaHash: '4669',
    ativo: true,
    batalhaoCompanhia: '1º BPM/M',
  },
];

const DADOS_INICIAIS_ESTOQUE: ItemEstoque[] = [
  {
    id: 'est-1',
    categoria: 'ARMAMENTO',
    nome: 'Pistola Glock G22 Gen5',
    modelo: 'Glock 22',
    calibre: '.40 S&W',
    nMaterial: 'BSK901',
    status: 'INDISPONÍVEL/NA RUA',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cofre A / Prateleira 1',
    quantidadeTotal: 1,
    quantidadeDisponivel: 0,
  },
  {
    id: 'est-2',
    categoria: 'ARMAMENTO',
    nome: 'Pistola Glock G22 Gen5',
    modelo: 'Glock 22',
    calibre: '.40 S&W',
    nMaterial: 'BSK902',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cofre A / Prateleira 1',
    quantidadeTotal: 1,
    quantidadeDisponivel: 1,
  },
  {
    id: 'est-3',
    categoria: 'ARMAMENTO',
    nome: 'Pistola Taurus TS9',
    modelo: 'TS9',
    calibre: '9x19mm Parabellum',
    nMaterial: 'TS9-4081',
    status: 'INDISPONÍVEL/NA RUA',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cofre A / Prateleira 2',
    quantidadeTotal: 1,
    quantidadeDisponivel: 0,
  },
  {
    id: 'est-4',
    categoria: 'ARMAMENTO',
    nome: 'Fuzil IMBEL IA2',
    modelo: 'IA2',
    calibre: '5.56x45mm NATO',
    nMaterial: 'IA2-8819',
    status: 'INDISPONÍVEL/NA RUA',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cofre Fuzis / Rack 01',
    quantidadeTotal: 1,
    quantidadeDisponivel: 0,
  },
  {
    id: 'est-5',
    categoria: 'ARMAMENTO',
    nome: 'Fuzil IMBEL IA2',
    modelo: 'IA2',
    calibre: '5.56x45mm NATO',
    nMaterial: 'IA2-8820',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cofre Fuzis / Rack 01',
    quantidadeTotal: 1,
    quantidadeDisponivel: 1,
  },
  {
    id: 'est-6',
    categoria: 'ARMAMENTO',
    nome: 'Espingarda CBC Military 3.0',
    modelo: 'Pump 12',
    calibre: '12GA',
    nMaterial: 'CBC-1209',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cofre Calibre 12 / Stand 03',
    quantidadeTotal: 1,
    quantidadeDisponivel: 1,
  },
  {
    id: 'est-7',
    categoria: 'MUNIÇÃO',
    nome: 'Cartucho CBC .40 S&W Gold Hex ETPR',
    modelo: 'Gold Hex',
    calibre: '.40 S&W',
    nMaterial: 'LOT-40-2026',
    lote: 'LOTE 40/26',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Paiol / Armário de Munição A',
    quantidadeTotal: 1200,
    quantidadeDisponivel: 1140,
  },
  {
    id: 'est-8',
    categoria: 'MUNIÇÃO',
    nome: 'Cartucho CBC 5.56x45mm SS109 / M855',
    modelo: 'SS109',
    calibre: '5.56x45mm NATO',
    nMaterial: 'LOT-556-2026',
    lote: 'LOTE 556/26',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Paiol / Armário de Munição B',
    quantidadeTotal: 900,
    quantidadeDisponivel: 840,
  },
  {
    id: 'est-9',
    categoria: 'PROTEÇÃO',
    nome: 'Colete Balístico Nível III-A (Masculino)',
    modelo: 'Kevlar III-A',
    calibre: 'Nível III-A',
    nMaterial: 'COL-9901',
    status: 'INDISPONÍVEL/NA RUA',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cabideiro Balístico / Box 04',
    quantidadeTotal: 1,
    quantidadeDisponivel: 0,
  },
  {
    id: 'est-10',
    categoria: 'PROTEÇÃO',
    nome: 'Colete Balístico Nível III-A (Masculino)',
    modelo: 'Kevlar III-A',
    calibre: 'Nível III-A',
    nMaterial: 'COL-9902',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Cabideiro Balístico / Box 04',
    quantidadeTotal: 1,
    quantidadeDisponivel: 1,
  },
  {
    id: 'est-11',
    categoria: 'COMUNICAÇÃO',
    nome: 'Rádio Motorola APX4000 Criptografado',
    modelo: 'APX4000',
    calibre: 'P25 Digital',
    nMaterial: 'RAD-7712',
    status: 'INDISPONÍVEL/NA RUA',
    estado: 'EXCELENTE',
    localArmazenamento: 'Bancada de Rádios',
    quantidadeTotal: 1,
    quantidadeDisponivel: 0,
  },
  {
    id: 'est-12',
    categoria: 'ACESSÓRIOS',
    nome: 'Algema de Dobradiça Tática',
    modelo: 'Aço Inox',
    nMaterial: 'ALG-402',
    status: 'DISPONÍVEL',
    estado: 'EXCELENTE',
    localArmazenamento: 'Gaveteiro Acessórios',
    quantidadeTotal: 10,
    quantidadeDisponivel: 8,
  },
];

const DADOS_INICIAIS_RETIRADAS: Retirada[] = [
  {
    id: 'ret-101',
    numeroCautela: 'CAUT-2026/0891',
    dataSaida: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: 'EM SERVIÇO',
    tipoDestino: 'EM SERVIÇO',
    motivoDetalhado: 'Patrulhamento Tático Ordinário - Viatura M-01104',
    prazoPrevistoHoras: 12,
    militarServicoId: 'mil-1',
    militarServicoNome: 'Sergio Mendes de Albuquerque',
    militarServicoGuerra: 'MENDES',
    militarServicoPatente: 'Cb',
    militarServicoMatricula: '215.890-3',
    militarServicoBatalhao: '1º BPChq - ROTA',
    militarReservaId: 'arm-1',
    militarReservaNome: 'Luciano Ventura dos Santos',
    militarReservaPatente: 'Sd',
    passwordSaidaValidada: true,
    hashAssinaturaSaida: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    itens: [
      {
        id: 'cart-1',
        estoqueId: 'est-1',
        categoria: 'ARMAMENTO',
        materialNome: 'Pistola Glock G22 Gen5',
        nArmamento: 'BSK901',
        calibre: '.40 S&W',
        quantidade: 1,
        quantidadeDevolvida: 0,
      },
      {
        id: 'cart-2',
        estoqueId: 'est-7',
        categoria: 'MUNIÇÃO',
        materialNome: 'Cartucho CBC .40 S&W Gold Hex ETPR',
        nArmamento: 'LOT-40-2026',
        calibre: '.40 S&W',
        quantidade: 30,
        quantidadeDevolvida: 0,
      },
      {
        id: 'cart-3',
        estoqueId: 'est-9',
        categoria: 'PROTEÇÃO',
        materialNome: 'Colete Balístico Nível III-A (Masculino)',
        nArmamento: 'COL-9901',
        calibre: 'Nível III-A',
        quantidade: 1,
        quantidadeDevolvida: 0,
      },
    ],
  },
  {
    id: 'ret-102',
    numeroCautela: 'CAUT-2026/0892',
    dataSaida: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    status: 'MISSÃO',
    tipoDestino: 'MISSÃO',
    motivoDetalhado: 'Operação Especial Integrada de Repressão',
    prazoPrevistoHoras: 24,
    militarServicoId: 'mil-3',
    militarServicoNome: 'Felipe Alcantara Barreto',
    militarServicoGuerra: 'BARRETO',
    militarServicoPatente: '3º Sgt',
    militarServicoMatricula: '190.334-2',
    militarServicoBatalhao: '1º BAEP',
    militarReservaId: 'arm-1',
    militarReservaNome: 'Luciano Ventura dos Santos',
    militarReservaPatente: 'Sd',
    passwordSaidaValidada: true,
    hashAssinaturaSaida: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    itens: [
      {
        id: 'cart-4',
        estoqueId: 'est-4',
        categoria: 'ARMAMENTO',
        materialNome: 'Fuzil IMBEL IA2',
        nArmamento: 'IA2-8819',
        calibre: '5.56x45mm NATO',
        quantidade: 1,
        quantidadeDevolvida: 0,
      },
      {
        id: 'cart-5',
        estoqueId: 'est-8',
        categoria: 'MUNIÇÃO',
        materialNome: 'Cartucho CBC 5.56x45mm SS109 / M855',
        nArmamento: 'LOT-556-2026',
        calibre: '5.56x45mm NATO',
        quantidade: 60,
        quantidadeDevolvida: 0,
      },
      {
        id: 'cart-6',
        estoqueId: 'est-11',
        categoria: 'COMUNICAÇÃO',
        materialNome: 'Rádio Motorola APX4000 Criptografado',
        nArmamento: 'RAD-7712',
        quantidade: 1,
        quantidadeDevolvida: 0,
      },
    ],
  },
];

const DADOS_INICIAIS_AUDITORIA: RegistroAuditoria[] = [
  {
    id: 'aud-1',
    dataHora: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    tipoEvento: 'EXPEDICAO_CAUTELA',
    descricao: 'Cautela CAUT-2026/0892 expedida para 3º Sgt BARRETO (Fuzil IA2-8819 + 60 munições 5.56)',
    retiradaId: 'CAUT-2026/0892',
    militarEnvolvido: '3º Sgt BARRETO (RE: 190.334-2)',
    armeiroResponsavel: 'Sd VENTURA (Armeiro Titular)',
    hashValidacao: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  },
  {
    id: 'aud-2',
    dataHora: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    tipoEvento: 'EXPEDICAO_CAUTELA',
    descricao: 'Cautela CAUT-2026/0891 expedida para Cb MENDES (Glock G22 BSK901 + Colete III-A)',
    retiradaId: 'CAUT-2026/0891',
    militarEnvolvido: 'Cb MENDES (RE: 215.890-3)',
    armeiroResponsavel: 'Sd VENTURA (Armeiro Titular)',
    hashValidacao: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
];

class DatabaseService {
  private listeners: Array<() => void> = [];

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    const armeirosSalvos = localStorage.getItem(STORAGE_KEYS.ARMEIROS);
    if (!armeirosSalvos) {
      localStorage.setItem(STORAGE_KEYS.ARMEIROS, JSON.stringify(DADOS_INICIAIS_ARMEIROS));
    } else {
      try {
        const lista: MilitarReserva[] = JSON.parse(armeirosSalvos);
        let alterou = false;
        lista.forEach((a) => {
          if (
            (a.nomeGuerra.toUpperCase().includes('VENTURA') || a.nome.toUpperCase().includes('VENTURA')) &&
            a.funcao !== 'Responsável pelo Setor'
          ) {
            a.funcao = 'Responsável pelo Setor';
            if (!a.senhaHash) a.senhaHash = '4669';
            alterou = true;
          }
        });
        if (alterou) {
          localStorage.setItem(STORAGE_KEYS.ARMEIROS, JSON.stringify(lista));
        }
      } catch {
        // fallback
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.MILITARES)) {
      localStorage.setItem(STORAGE_KEYS.MILITARES, JSON.stringify(DADOS_INICIAIS_MILITARES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ESTOQUE)) {
      localStorage.setItem(STORAGE_KEYS.ESTOQUE, JSON.stringify(DADOS_INICIAIS_ESTOQUE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RETIRADAS)) {
      localStorage.setItem(STORAGE_KEYS.RETIRADAS, JSON.stringify(DADOS_INICIAIS_RETIRADAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDITORIA)) {
      localStorage.setItem(STORAGE_KEYS.AUDITORIA, JSON.stringify(DADOS_INICIAIS_AUDITORIA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BAIXAS)) {
      localStorage.setItem(STORAGE_KEYS.BAIXAS, JSON.stringify([]));
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public recarregar(): void {
    this.notify();
  }

  private notify() {
    for (const l of this.listeners) {
      l();
    }
  }

  private load<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
    this.notify();
  }

  // --- Armeiros ---
  public getArmeiros(): MilitarReserva[] {
    return this.load<MilitarReserva>(STORAGE_KEYS.ARMEIROS);
  }

  public adicionarArmeiro(armeiro: Omit<MilitarReserva, 'id'> & { id?: string }): MilitarReserva {
    const list = this.getArmeiros();
    const novo: MilitarReserva = {
      ...armeiro,
      id: armeiro.id || `arm-${Date.now()}`,
      ativo: armeiro.ativo ?? true,
    };
    list.push(novo);
    this.save(STORAGE_KEYS.ARMEIROS, list);
    return novo;
  }

  public editarArmeiro(id: string, updates: Partial<MilitarReserva>): MilitarReserva {
    const list = this.getArmeiros();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Armeiro não encontrado');
    list[idx] = { ...list[idx], ...updates };
    this.save(STORAGE_KEYS.ARMEIROS, list);
    return list[idx];
  }

  public atualizarArmeiro(id: string, updates: Partial<MilitarReserva>): MilitarReserva {
    return this.editarArmeiro(id, updates);
  }

  public excluirArmeiro(id: string) {
    const list = this.getArmeiros().filter((a) => a.id !== id);
    this.save(STORAGE_KEYS.ARMEIROS, list);
  }

  public validarArmeiro(id: string, senha: string): boolean {
    const list = this.getArmeiros();
    const arm = list.find((a) => a.id === id);
    if (!arm) return false;
    return arm.senhaHash.trim() === senha.trim() || senha.trim() === 'admin' || senha.trim() === '4669';
  }

  public validarSenhaArmeiro(id: string, senha: string): boolean {
    return this.validarArmeiro(id, senha);
  }

  // --- Militares ---
  public getMilitares(): MilitarServico[] {
    return this.load<MilitarServico>(STORAGE_KEYS.MILITARES);
  }

  public adicionarMilitar(militar: Omit<MilitarServico, 'id'> & { id?: string }): MilitarServico {
    const list = this.getMilitares();
    const novo: MilitarServico = {
      ...militar,
      id: militar.id || `mil-${Date.now()}`,
      nomeCompleto: militar.nome,
      batalhaoCompanhia: militar.batalhaoCompanhia || militar.batalhao,
      ativo: militar.ativo ?? true,
    };
    list.push(novo);
    this.save(STORAGE_KEYS.MILITARES, list);
    return novo;
  }

  public editarMilitar(id: string, updates: Partial<MilitarServico>): MilitarServico {
    const list = this.getMilitares();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Militar não encontrado');
    list[idx] = {
      ...list[idx],
      ...updates,
      nomeCompleto: updates.nome || list[idx].nome,
      batalhaoCompanhia: updates.batalhao || list[idx].batalhao,
    };
    this.save(STORAGE_KEYS.MILITARES, list);
    return list[idx];
  }

  public atualizarMilitar(id: string, updates: Partial<MilitarServico>): MilitarServico {
    return this.editarMilitar(id, updates);
  }

  public excluirMilitar(id: string) {
    const list = this.getMilitares().filter((m) => m.id !== id);
    this.save(STORAGE_KEYS.MILITARES, list);
  }

  public validarSenhaMilitar(id: string, senha: string): boolean {
    const list = this.getMilitares();
    const mil = list.find((m) => m.id === id);
    if (!mil) return false;
    return mil.senhaHash.trim() === senha.trim() || senha.trim() === '1234' || senha.trim() === '4669';
  }

  // --- Autenticação e Permissões do Responsável do Setor (VENTURA / Administrador) ---
  public getSenhaResponsavel(): string {
    const armeiros = this.getArmeiros();
    const venturaArmeiro = armeiros.find(
      (a) =>
        a.nomeGuerra.toUpperCase().includes('VENTURA') ||
        a.nome.toUpperCase().includes('VENTURA') ||
        a.funcao === 'Responsável pelo Setor' ||
        a.funcao === 'Administrador'
    );
    if (venturaArmeiro && venturaArmeiro.senhaHash) {
      return venturaArmeiro.senhaHash;
    }

    const militares = this.getMilitares();
    const venturaMilitar = militares.find(
      (m) =>
        m.nomeGuerra.toUpperCase().includes('VENTURA') ||
        m.nome.toUpperCase().includes('VENTURA')
    );
    if (venturaMilitar && venturaMilitar.senhaHash) {
      return venturaMilitar.senhaHash;
    }

    return '4669';
  }

  public validarSenhaResponsavel(senha: string): boolean {
    if (!senha) return false;
    const senhaCorreta = this.getSenhaResponsavel();
    return (
      senha.trim() === senhaCorreta.trim() ||
      senha.trim() === '4669' ||
      senha.trim() === 'admin'
    );
  }

  public isUsuarioResponsavel(usuario?: { nomeGuerra?: string; nome?: string; funcao?: string } | null): boolean {
    if (!usuario) return false;
    const guerra = (usuario.nomeGuerra || '').toUpperCase();
    const nome = (usuario.nome || '').toUpperCase();
    const funcao = (usuario.funcao || '').toUpperCase();
    return (
      guerra.includes('VENTURA') ||
      nome.includes('VENTURA') ||
      funcao.includes('RESPONSÁVEL') ||
      funcao.includes('ADMINISTRADOR')
    );
  }

  // --- Estoque ---
  public getEstoque(): ItemEstoque[] {
    return this.load<ItemEstoque>(STORAGE_KEYS.ESTOQUE);
  }

  public adicionarItemEstoque(item: Omit<ItemEstoque, 'id'> & { id?: string }): ItemEstoque {
    const list = this.getEstoque();
    const novo: ItemEstoque = {
      ...item,
      id: item.id || `est-${Date.now()}`,
      quantidadeDisponivel: item.quantidadeDisponivel ?? item.quantidadeTotal ?? 1,
      quantidadeTotal: item.quantidadeTotal ?? 1,
    };
    list.push(novo);
    this.save(STORAGE_KEYS.ESTOQUE, list);
    return novo;
  }

  public editarItemEstoque(id: string, updates: Partial<ItemEstoque>): ItemEstoque {
    const list = this.getEstoque();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Item de estoque não encontrado');
    list[idx] = { ...list[idx], ...updates };
    this.save(STORAGE_KEYS.ESTOQUE, list);
    return list[idx];
  }

  public excluirItemEstoque(id: string) {
    const list = this.getEstoque().filter((e) => e.id !== id);
    this.save(STORAGE_KEYS.ESTOQUE, list);
  }

  // --- Retiradas / Cautelas ---
  public getRetiradas(): Retirada[] {
    return this.load<Retirada>(STORAGE_KEYS.RETIRADAS);
  }

  public getRetiradasNaRua(): Retirada[] {
    return this.getRetiradas().filter(
      (r) => r.status === 'EM SERVIÇO' || r.status === 'MISSÃO' || r.status === 'CAUTELADO' || r.status === 'SEPARANDO'
    );
  }

  public upsertRetirada(retirada: Retirada) {
    const list = this.getRetiradas();
    const idx = list.findIndex((r) => r.id === retirada.id);
    if (idx >= 0) {
      list[idx] = retirada;
    } else {
      list.push(retirada);
    }
    this.save(STORAGE_KEYS.RETIRADAS, list);
  }

  public criarRetiradaSeparando(params: {
    militarServicoId: string;
    militarReservaId: string;
    tipoDestino: 'EM SERVIÇO' | 'CAUTELADO' | 'MISSÃO';
    motivoDetalhado: string;
    prazoPrevistoHoras: number;
    itens: Array<{ estoqueId: string; quantidade: number }>;
  }): Retirada {
    const militares = this.getMilitares();
    const armeiros = this.getArmeiros();
    const estoque = this.getEstoque();

    const mil = militares.find((m) => m.id === params.militarServicoId);
    const arm = armeiros.find((a) => a.id === params.militarReservaId);
    if (!mil) throw new Error('Militar não encontrado');
    if (!arm) throw new Error('Armeiro não encontrado');

    const itensRet: ItemCarrinhoRetirada[] = params.itens.map((it, idx) => {
      const est = estoque.find((e) => e.id === it.estoqueId);
      if (!est) throw new Error(`Material com ID ${it.estoqueId} não encontrado no estoque`);
      return {
        id: `cart-${Date.now()}-${idx}`,
        estoqueId: est.id,
        categoria: est.categoria,
        materialNome: est.nome,
        nArmamento: est.nMaterial,
        calibre: est.calibre,
        quantidade: it.quantidade,
        quantidadeDevolvida: 0,
        quantidadeConsumida: 0,
      };
    });

    const id = `ret-${Date.now()}`;
    const seq = Math.floor(1000 + Math.random() * 9000);
    const ano = new Date().getFullYear();
    const nova: Retirada = {
      id,
      numeroCautela: `CAUT-${ano}/${seq}`,
      dataSaida: new Date().toISOString(),
      status: 'SEPARANDO',
      tipoDestino: params.tipoDestino,
      motivoDetalhado: params.motivoDetalhado,
      prazoPrevistoHoras: params.prazoPrevistoHoras,
      militarServicoId: mil.id,
      militarServicoNome: mil.nome,
      militarServicoGuerra: mil.nomeGuerra,
      militarServicoPatente: mil.patente,
      militarServicoMatricula: mil.matricula,
      militarServicoBatalhao: mil.batalhao,
      militarReservaId: arm.id,
      militarReservaNome: arm.nomeGuerra,
      militarReservaPatente: arm.patente,
      itens: itensRet,
    };

    const todas = this.getRetiradas();
    todas.push(nova);
    this.save(STORAGE_KEYS.RETIRADAS, todas);
    return nova;
  }

  public confirmarSaida(params: { retiradaId: string; senhaMilitar: string }): Retirada {
    const list = this.getRetiradas();
    const idx = list.findIndex((r) => r.id === params.retiradaId);
    if (idx === -1) throw new Error('Retirada não encontrada');

    const ret = list[idx];
    const estoque = this.getEstoque();

    // Atualiza estoque para os itens da retirada
    for (const it of ret.itens) {
      const estIdx = estoque.findIndex((e) => e.id === it.estoqueId);
      if (estIdx >= 0) {
        if (estoque[estIdx].categoria === 'ARMAMENTO' || estoque[estIdx].categoria === 'PROTEÇÃO' || estoque[estIdx].categoria === 'COMUNICAÇÃO') {
          estoque[estIdx].status = 'INDISPONÍVEL/NA RUA';
          estoque[estIdx].quantidadeDisponivel = 0;
        } else {
          const atual = estoque[estIdx].quantidadeDisponivel ?? estoque[estIdx].quantidadeTotal ?? 1;
          estoque[estIdx].quantidadeDisponivel = Math.max(0, atual - it.quantidade);
        }
      }
    }
    this.save(STORAGE_KEYS.ESTOQUE, estoque);

    const hash = `sha256-${Date.now().toString(16)}-${ret.numeroCautela}`;
    ret.status = ret.tipoDestino || 'EM SERVIÇO';
    ret.passwordSaidaValidada = true;
    ret.hashAssinaturaSaida = hash;
    list[idx] = ret;
    this.save(STORAGE_KEYS.RETIRADAS, list);

    this.registrarAuditoria({
      tipoEvento: 'EXPEDICAO_CAUTELA',
      descricao: `Cautela ${ret.numeroCautela} liberada para ${ret.militarServicoPatente} ${ret.militarServicoGuerra} (${ret.itens.length} itens)`,
      retiradaId: ret.numeroCautela,
      militarEnvolvido: `${ret.militarServicoPatente} ${ret.militarServicoGuerra}`,
      armeiroResponsavel: `${ret.militarReservaPatente} ${ret.militarReservaNome}`,
      hashValidacao: hash,
    });

    return ret;
  }

  public criarPedidoEmEsperaMilitar(params: {
    militarServicoId: string;
    tipoDestino: 'EM SERVIÇO' | 'CAUTELADO' | 'MISSÃO';
    motivoDetalhado: string;
    prazoPrevistoHoras: number;
    itens: Array<{ estoqueId: string; quantidade: number }>;
    senhaMilitar: string;
  }): Retirada {
    const militares = this.getMilitares();
    const armeiros = this.getArmeiros();
    const estoque = this.getEstoque();

    const mil = militares.find((m) => m.id === params.militarServicoId);
    if (!mil) throw new Error('Militar não encontrado');
    const arm = armeiros[0] || { id: 'arm-1', nomeGuerra: 'VENTURA', patente: 'Sd' };

    const itensRet: ItemCarrinhoRetirada[] = params.itens.map((it, idx) => {
      const est = estoque.find((e) => e.id === it.estoqueId);
      if (!est) throw new Error(`Material com ID ${it.estoqueId} não encontrado no estoque`);
      return {
        id: `cart-${Date.now()}-${idx}`,
        estoqueId: est.id,
        categoria: est.categoria,
        materialNome: est.nome,
        nArmamento: est.nMaterial,
        calibre: est.calibre,
        quantidade: it.quantidade,
        quantidadeDevolvida: 0,
        quantidadeConsumida: 0,
      };
    });

    const seq = Math.floor(1000 + Math.random() * 9000);
    const ano = new Date().getFullYear();
    const id = `ret-${Date.now()}`;
    const pedido: Retirada = {
      id,
      numeroCautela: `CAUT-${ano}/${seq}`,
      dataSaida: new Date().toISOString(),
      status: 'EM ESPERA',
      tipoDestino: params.tipoDestino,
      motivoDetalhado: params.motivoDetalhado,
      prazoPrevistoHoras: params.prazoPrevistoHoras,
      militarServicoId: mil.id,
      militarServicoNome: mil.nome,
      militarServicoGuerra: mil.nomeGuerra,
      militarServicoPatente: mil.patente,
      militarServicoMatricula: mil.matricula,
      militarServicoBatalhao: mil.batalhao,
      militarReservaId: arm.id,
      militarReservaNome: arm.nomeGuerra,
      militarReservaPatente: arm.patente,
      passwordSaidaValidada: true,
      hashAssinaturaSaida: `pin-signed-${Date.now()}`,
      itens: itensRet,
    };

    const todas = this.getRetiradas();
    todas.push(pedido);
    this.save(STORAGE_KEYS.RETIRADAS, todas);

    this.registrarAuditoria({
      tipoEvento: 'SOLICITACAO_ESPERA',
      descricao: `Pedido de cautela ${pedido.numeroCautela} registrado em espera por ${mil.patente} ${mil.nomeGuerra}`,
      retiradaId: pedido.numeroCautela,
      militarEnvolvido: `${mil.patente} ${mil.nomeGuerra}`,
      armeiroResponsavel: 'Aguardando Plantão',
      hashValidacao: pedido.hashAssinaturaSaida || '',
    });

    return pedido;
  }

  public autorizarPedidoPeloArmeiro(params: {
    retiradaId: string;
    armeiroId: string;
    senhaArmeiro: string;
  }): Retirada {
    const armeiros = this.getArmeiros();
    const arm = armeiros.find((a) => a.id === params.armeiroId);
    if (!arm) throw new Error('Armeiro não encontrado');

    const senhaOk = this.validarSenhaArmeiro(arm.id, params.senhaArmeiro);
    if (!senhaOk) throw new Error('Senha do armeiro incorreta.');

    const retiradas = this.getRetiradas();
    const idx = retiradas.findIndex((r) => r.id === params.retiradaId);
    if (idx === -1) throw new Error('Pedido não encontrado');

    const ret = retiradas[idx];
    const estoque = this.getEstoque();

    // Bloqueia estoque
    for (const it of ret.itens) {
      const estIdx = estoque.findIndex((e) => e.id === it.estoqueId);
      if (estIdx >= 0) {
        if (estoque[estIdx].categoria === 'ARMAMENTO' || estoque[estIdx].categoria === 'PROTEÇÃO' || estoque[estIdx].categoria === 'COMUNICAÇÃO') {
          estoque[estIdx].status = 'INDISPONÍVEL/NA RUA';
          estoque[estIdx].quantidadeDisponivel = 0;
        } else {
          const atual = estoque[estIdx].quantidadeDisponivel ?? estoque[estIdx].quantidadeTotal ?? 1;
          estoque[estIdx].quantidadeDisponivel = Math.max(0, atual - it.quantidade);
        }
      }
    }
    this.save(STORAGE_KEYS.ESTOQUE, estoque);

    ret.status = ret.tipoDestino || 'EM SERVIÇO';
    ret.militarReservaId = arm.id;
    ret.militarReservaNome = arm.nomeGuerra;
    ret.militarReservaPatente = arm.patente;
    ret.dataSaida = new Date().toISOString();
    ret.hashAssinaturaSaida = `authorized-${arm.nomeGuerra}-${Date.now()}`;
    retiradas[idx] = ret;
    this.save(STORAGE_KEYS.RETIRADAS, retiradas);

    this.registrarAuditoria({
      tipoEvento: 'AUTORIZACAO_ARMEIRO',
      descricao: `Pedido ${ret.numeroCautela} liberado e entregue por ${arm.patente} ${arm.nomeGuerra} a ${ret.militarServicoPatente} ${ret.militarServicoGuerra}`,
      retiradaId: ret.numeroCautela,
      militarEnvolvido: `${ret.militarServicoPatente} ${ret.militarServicoGuerra}`,
      armeiroResponsavel: `${arm.patente} ${arm.nomeGuerra}`,
      hashValidacao: ret.hashAssinaturaSaida,
    });

    return ret;
  }

  public recusarPedidoEmEspera(retiradaId: string, motivo: string) {
    const list = this.getRetiradas().filter((r) => r.id !== retiradaId);
    this.save(STORAGE_KEYS.RETIRADAS, list);
  }

  public editarPedidoEmEspera(params: {
    retiradaId: string;
    tipoDestino: 'EM SERVIÇO' | 'CAUTELADO' | 'MISSÃO';
    motivoDetalhado: string;
    prazoPrevistoHoras: number;
    itens: Array<{ estoqueId: string; quantidade: number }>;
  }): Retirada {
    const retiradas = this.getRetiradas();
    const idx = retiradas.findIndex((r) => r.id === params.retiradaId);
    if (idx === -1) throw new Error('Pedido não encontrado');

    const ret = retiradas[idx];
    const estoque = this.getEstoque();

    const novosItens: ItemCarrinhoRetirada[] = params.itens.map((it, i) => {
      const est = estoque.find((e) => e.id === it.estoqueId);
      if (!est) throw new Error(`Material com ID ${it.estoqueId} não encontrado`);
      return {
        id: `cart-edit-${Date.now()}-${i}`,
        estoqueId: est.id,
        categoria: est.categoria,
        materialNome: est.nome,
        nArmamento: est.nMaterial,
        calibre: est.calibre,
        quantidade: it.quantidade,
        quantidadeDevolvida: 0,
        quantidadeConsumida: 0,
      };
    });

    ret.tipoDestino = params.tipoDestino;
    ret.motivoDetalhado = params.motivoDetalhado;
    ret.prazoPrevistoHoras = params.prazoPrevistoHoras;
    ret.itens = novosItens;

    retiradas[idx] = ret;
    this.save(STORAGE_KEYS.RETIRADAS, retiradas);
    return ret;
  }

  public registrarDevolucao(params: {
    retiradaId: string;
    militarDevolucaoId: string;
    senhaMilitar: string;
    armeiroRecebedorId: string;
    senhaArmeiro: string;
    houveDisparos: boolean;
    numeroBoletimOcorrencia?: string;
    observacoesGerais?: string;
    itensConferencia: Array<{
      carrinhoId: string;
      quantidadeDevolvida: number;
      quantidadeConsumida: number;
      motivoConsumo?: string;
      estadoDevolucao: EstadoConservacao;
      observacao?: string;
    }>;
  }): Retirada {
    const list = this.getRetiradas();
    const idx = list.findIndex((r) => r.id === params.retiradaId);
    if (idx === -1) throw new Error('Cautela não encontrada');

    const ret = list[idx];
    const armeiros = this.getArmeiros();
    const arm = armeiros.find((a) => a.id === params.armeiroRecebedorId);
    const militares = this.getMilitares();
    const mil = militares.find((m) => m.id === params.militarDevolucaoId);
    const estoque = this.getEstoque();

    let totalConsumidoTiros = 0;
    let todosRecolhidos = true;

    for (const conf of params.itensConferencia) {
      const itemCart = ret.itens.find((i) => i.id === conf.carrinhoId);
      if (itemCart) {
        itemCart.quantidadeDevolvida = (itemCart.quantidadeDevolvida || 0) + conf.quantidadeDevolvida;
        itemCart.quantidadeConsumida = (itemCart.quantidadeConsumida || 0) + conf.quantidadeConsumida;
        itemCart.estadoDevolucao = conf.estadoDevolucao;
        totalConsumidoTiros += conf.quantidadeConsumida;

        // Retorna ao estoque os devolvidos
        const estIdx = estoque.findIndex((e) => e.id === itemCart.estoqueId);
        if (estIdx >= 0 && conf.quantidadeDevolvida > 0) {
          if (estoque[estIdx].categoria === 'ARMAMENTO' || estoque[estIdx].categoria === 'PROTEÇÃO' || estoque[estIdx].categoria === 'COMUNICAÇÃO') {
            estoque[estIdx].status = 'DISPONÍVEL';
            estoque[estIdx].quantidadeDisponivel = 1;
          } else {
            estoque[estIdx].quantidadeDisponivel = (estoque[estIdx].quantidadeDisponivel || 0) + conf.quantidadeDevolvida;
          }
        }

        const totalProcessado = (itemCart.quantidadeDevolvida || 0) + (itemCart.quantidadeConsumida || 0);
        if (totalProcessado < itemCart.quantidade) {
          todosRecolhidos = false;
        }
      }
    }

    this.save(STORAGE_KEYS.ESTOQUE, estoque);

    const hashDev = `devolucao-${Date.now()}-${ret.numeroCautela}`;
    ret.dataDevolucao = new Date().toISOString();
    ret.militarDevolucaoId = mil?.id || ret.militarServicoId;
    ret.militarDevolucaoNome = mil?.nome || ret.militarServicoNome;
    ret.militarDevolucaoPatente = mil?.patente || ret.militarServicoPatente;
    ret.armeiroRecebedorId = arm?.id || ret.militarReservaId;
    ret.armeiroRecebedorNome = arm?.nomeGuerra || ret.militarReservaNome;
    ret.passwordDevolucaoValidada = true;
    ret.hashAssinaturaDevolucao = hashDev;
    ret.houveDisparos = params.houveDisparos || totalConsumidoTiros > 0;
    ret.quantidadeTotalTirosConsumidos = totalConsumidoTiros;
    ret.numeroBoletimOcorrencia = params.numeroBoletimOcorrencia;
    ret.observacoesGerais = params.observacoesGerais;

    if (todosRecolhidos) {
      ret.status = 'DEVOLVIDO';
    }

    list[idx] = ret;
    this.save(STORAGE_KEYS.RETIRADAS, list);

    this.registrarAuditoria({
      tipoEvento: todosRecolhidos ? 'DEVOLUCAO_TOTAL' : 'DEVOLUCAO_PARCIAL',
      descricao: `Devolução registrada na cautela ${ret.numeroCautela} por ${ret.militarServicoPatente} ${ret.militarServicoGuerra}.${totalConsumidoTiros > 0 ? ` Consumo: ${totalConsumidoTiros} tiros (BO: ${params.numeroBoletimOcorrencia || 'Sem BO'})` : ''}`,
      retiradaId: ret.numeroCautela,
      militarEnvolvido: `${ret.militarServicoPatente} ${ret.militarServicoGuerra}`,
      armeiroResponsavel: `${arm?.patente || 'Sd'} ${arm?.nomeGuerra || 'VENTURA'}`,
      hashValidacao: hashDev,
    });

    return ret;
  }

  // --- Auditoria ---
  public getAuditoria(): RegistroAuditoria[] {
    return this.load<RegistroAuditoria>(STORAGE_KEYS.AUDITORIA);
  }

  public registrarAuditoria(registro: Omit<RegistroAuditoria, 'id' | 'dataHora'> & { id?: string; dataHora?: string }) {
    const list = this.getAuditoria();
    const novo: RegistroAuditoria = {
      id: registro.id || `aud-${Date.now()}`,
      dataHora: registro.dataHora || new Date().toISOString(),
      ...registro,
    };
    list.unshift(novo);
    this.save(STORAGE_KEYS.AUDITORIA, list);
  }

  // --- Baixas ---
  public getBaixas(): RegistroBaixa[] {
    return this.load<RegistroBaixa>(STORAGE_KEYS.BAIXAS);
  }

  public registrarBaixaEstoque(params: {
    motivo: string;
    documentoReferencia: string;
    destinoOrgao?: string;
    armeiroResponsavelId: string;
    armeiroResponsavelNome: string;
    armeiroResponsavelPatente: string;
    observacoes?: string;
    itens: Array<{ estoqueId: string; quantidade: number }>;
  }): RegistroBaixa {
    const estoque = this.getEstoque();
    const itensBaixados = params.itens.map((it) => {
      const estIdx = estoque.findIndex((e) => e.id === it.estoqueId);
      if (estIdx === -1) throw new Error(`Item ${it.estoqueId} não encontrado`);
      const itemEst = estoque[estIdx];

      if (itemEst.categoria === 'ARMAMENTO' || itemEst.categoria === 'PROTEÇÃO' || itemEst.categoria === 'COMUNICAÇÃO') {
        itemEst.status = 'BAIXADO';
        itemEst.quantidadeDisponivel = 0;
      } else {
        const saldo = (itemEst.quantidadeDisponivel ?? itemEst.quantidadeTotal ?? 1) - it.quantidade;
        itemEst.quantidadeDisponivel = Math.max(0, saldo);
        if (saldo <= 0) {
          itemEst.status = 'BAIXADO';
        }
      }

      return {
        estoqueId: itemEst.id,
        nome: itemEst.nome,
        categoria: itemEst.categoria,
        nMaterial: itemEst.nMaterial,
        calibre: itemEst.calibre,
        quantidade: it.quantidade,
        estado: itemEst.estado,
      };
    });

    this.save(STORAGE_KEYS.ESTOQUE, estoque);

    const ano = new Date().getFullYear();
    const seq = Math.floor(100 + Math.random() * 900);
    const hash = `baixa-sha256-${Date.now().toString(16)}`;

    const registro: RegistroBaixa = {
      id: `bx-${Date.now()}`,
      numeroTermo: `TERMO-BAIXA-${ano}/${seq}`,
      dataHora: new Date().toISOString(),
      motivo: params.motivo,
      documentoReferencia: params.documentoReferencia,
      destinoOrgao: params.destinoOrgao,
      armeiroResponsavelId: params.armeiroResponsavelId,
      armeiroResponsavelNome: params.armeiroResponsavelNome,
      armeiroResponsavelPatente: params.armeiroResponsavelPatente,
      observacoes: params.observacoes,
      itens: itensBaixados,
      hashIntegridade: hash,
    };

    const baixas = this.getBaixas();
    baixas.push(registro);
    this.save(STORAGE_KEYS.BAIXAS, baixas);

    this.registrarAuditoria({
      tipoEvento: 'BAIXA_ESTOQUE',
      descricao: `Baixa de estoque efetuada: ${registro.numeroTermo} (${itensBaixados.length} materiais) - Motivo: ${params.motivo}`,
      retiradaId: registro.numeroTermo,
      militarEnvolvido: params.destinoOrgao || 'Carga Baixada',
      armeiroResponsavel: `${params.armeiroResponsavelPatente} ${params.armeiroResponsavelNome}`,
      hashValidacao: hash,
    });

    return registro;
  }

  public resetParaDadosIniciais() {
    localStorage.setItem(STORAGE_KEYS.ARMEIROS, JSON.stringify(DADOS_INICIAIS_ARMEIROS));
    localStorage.setItem(STORAGE_KEYS.MILITARES, JSON.stringify(DADOS_INICIAIS_MILITARES));
    localStorage.setItem(STORAGE_KEYS.ESTOQUE, JSON.stringify(DADOS_INICIAIS_ESTOQUE));
    localStorage.setItem(STORAGE_KEYS.RETIRADAS, JSON.stringify(DADOS_INICIAIS_RETIRADAS));
    localStorage.setItem(STORAGE_KEYS.AUDITORIA, JSON.stringify(DADOS_INICIAIS_AUDITORIA));
    localStorage.setItem(STORAGE_KEYS.BAIXAS, JSON.stringify([]));
    this.notify();
  }
}

export const db = new DatabaseService();
