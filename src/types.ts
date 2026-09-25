export type CategoriaMaterial =
  | 'ARMAMENTO'
  | 'MUNIÇÃO'
  | 'CARREGADOR'
  | 'PROTEÇÃO'
  | 'COMUNICAÇÃO'
  | 'ACESSÓRIOS';

export type StatusEstoque =
  | 'DISPONÍVEL'
  | 'INDISPONÍVEL/NA RUA'
  | 'MANUTENÇÃO'
  | 'PERÍCIA'
  | 'SAÍDA'
  | 'BAIXADO';

export type EstadoConservacao =
  | 'EXCELENTE'
  | 'BOM'
  | 'REGULAR'
  | 'RUIM'
  | 'DANIFICADO';

export type StatusRetirada =
  | 'SEPARANDO'
  | 'EM ESPERA'
  | 'EM SERVIÇO'
  | 'CAUTELADO'
  | 'MISSÃO'
  | 'DEVOLVIDO'
  | 'DIVERGÊNCIA';

export type PatenteMilitar =
  | 'Cel'
  | 'Ten-Cel'
  | 'Maj'
  | 'Cap'
  | '1º Ten'
  | '2º Ten'
  | 'Asp Of'
  | 'SubTen'
  | '1º Sgt'
  | '2º Sgt'
  | '3º Sgt'
  | 'Cb'
  | 'Sd';

export interface MilitarServico {
  id: string;
  matricula: string;
  nome: string;
  nomeGuerra: string;
  patente: PatenteMilitar;
  batalhao: string;
  companhia: string;
  pelotao?: string;
  senhaHash: string;
  ativo: boolean;
  status?: string;
  contato?: string;
  nomeCompleto?: string;
  batalhaoCompanhia?: string;
  createdAt?: string;
}

export interface MilitarReserva {
  id: string;
  matricula: string;
  nome: string;
  nomeGuerra: string;
  patente: PatenteMilitar;
  funcao:
    | 'Responsável pelo Setor'
    | 'Administrador'
    | 'Armeiro Titular'
    | 'Armeiro Auxiliar'
    | 'Oficial de Dia'
    | 'Adjunto de Serviço'
    | 'Armeiro Adjunto'
    | 'Auxiliar de Reserva';
  senhaHash: string;
  ativo: boolean;
  createdAt?: string;
}

export interface ItemEstoque {
  id: string;
  categoria: CategoriaMaterial;
  nome: string;
  modelo?: string;
  calibre?: string;
  nMaterial: string;
  lote?: string;
  status: StatusEstoque;
  estado: EstadoConservacao;
  localArmazenamento: string;
  quantidadeDisponivel?: number;
  quantidadeTotal?: number;
  militarAtualId?: string;
  retiradaAtualId?: string;
  createdAt?: string;
}

export interface ItemCarrinhoRetirada {
  id: string;
  estoqueId: string;
  categoria: CategoriaMaterial;
  materialNome: string;
  nArmamento: string;
  calibre?: string;
  quantidade: number;
  quantidadeDevolvida?: number;
  quantidadeConsumida?: number;
  estadoDevolucao?: EstadoConservacao;
}

export interface Retirada {
  id: string;
  numeroCautela: string;
  dataSaida: string;
  status: StatusRetirada;
  tipoDestino: 'EM SERVIÇO' | 'CAUTELADO' | 'MISSÃO';
  motivoDetalhado: string;
  prazoPrevistoHoras: number;
  dataDevolucaoPrevista?: string;
  hashAutenticacao?: string;
  militarServicoId: string;
  militarServicoNome: string;
  militarServicoGuerra: string;
  militarServicoPatente: string;
  militarServicoMatricula: string;
  militarServicoBatalhao?: string;
  militarReservaId: string;
  militarReservaNome: string;
  militarReservaPatente: string;
  passwordSaidaValidada?: boolean;
  hashAssinaturaSaida?: string;
  dataDevolucao?: string;
  militarDevolucaoId?: string;
  militarDevolucaoNome?: string;
  militarDevolucaoPatente?: string;
  armeiroRecebedorId?: string;
  armeiroRecebedorNome?: string;
  passwordDevolucaoValidada?: boolean;
  hashAssinaturaDevolucao?: string;
  houveDisparos?: boolean;
  quantidadeTotalTirosConsumidos?: number;
  numeroBoletimOcorrencia?: string;
  observacoesGerais?: string;
  itens: ItemCarrinhoRetirada[];
}

export interface RegistroAuditoria {
  id: string;
  dataHora: string;
  tipoEvento: string;
  descricao: string;
  retiradaId?: string;
  militarEnvolvido: string;
  armeiroResponsavel: string;
  hashValidacao: string;
  acao?: string;
  detalhes?: string;
  usuarioNome?: string;
  usuarioTipo?: string;
  hash?: string;
  numeroCautela?: string;
}

export type TipoUsuarioSessao = 'ARMEIRO' | 'MILITAR';

export interface SessaoUsuario {
  tipo: TipoUsuarioSessao;
  id?: string;
  armeiro?: MilitarReserva;
  militar?: MilitarServico;
  militarId?: string;
  armeiroId?: string;
  nomeExibicao?: string;
  graduacao?: string;
  nome?: string;
  nomeGuerra?: string;
  patente?: string;
  matricula?: string;
  isResponsavelSetor?: boolean;
  isAdmin?: boolean;
}

export interface ItemBaixa {
  estoqueId: string;
  nome: string;
  categoria: CategoriaMaterial;
  nMaterial: string;
  calibre?: string;
  quantidade: number;
  estado: EstadoConservacao;
  motivoItem?: string;
}

export interface RegistroBaixa {
  id: string;
  numeroTermo: string;
  dataHora: string;
  motivo: string;
  documentoReferencia: string;
  destinoOrgao?: string;
  armeiroResponsavelId: string;
  armeiroResponsavelNome: string;
  armeiroResponsavelPatente: string;
  observacoes?: string;
  itens: ItemBaixa[];
  hashIntegridade: string;
}
