export interface UnidadePM {
  sigla: string;
  nome: string;
  categoria: string;
}

export const UNIDADES_PM: UnidadePM[] = [
  // Especializadas
  { sigla: 'ROTA', nome: '1º BPChq - ROTA (Rondas Ostensivas Tobias de Aguiar)', categoria: 'Policiamento de Choque' },
  { sigla: 'COE', nome: '4º BPChq - COE / GATE (Comandos e Operações Especiais)', categoria: 'Policiamento de Choque' },
  { sigla: 'BAEP 1', nome: '1º BAEP (Batalhão de Ações Especiais de Polícia)', categoria: 'Ações Especiais' },
  { sigla: 'BAEP 2', nome: '2º BAEP (Batalhão de Ações Especiais de Polícia)', categoria: 'Ações Especiais' },
  { sigla: '1º BPAmb', nome: '1º Batalhão de Polícia Ambiental', categoria: 'Ambiental' },
  { sigla: '2º BPAmb', nome: '2º Batalhão de Polícia Ambiental', categoria: 'Ambiental' },
  { sigla: '1º BPRv', nome: '1º Batalhão de Polícia Rodoviária', categoria: 'Rodoviária' },
  { sigla: '2º BPRv', nome: '2º Batalhão de Polícia Rodoviária', categoria: 'Rodoviária' },
  { sigla: 'GRPAe', nome: 'Comando de Aviação (Águia)', categoria: 'Aviação Policial' },
  
  // Batalhões Territoriais
  { sigla: '1º BPM/M', nome: '1º Batalhão de Polícia Militar Metropolitano', categoria: 'Metropolitano' },
  { sigla: '2º BPM/M', nome: '2º Batalhão de Polícia Militar Metropolitano', categoria: 'Metropolitano' },
  { sigla: '5º BPM/M', nome: '5º Batalhão de Polícia Militar Metropolitano', categoria: 'Metropolitano' },
  { sigla: '9º BPM/M', nome: '9º Batalhão de Polícia Militar Metropolitano', categoria: 'Metropolitano' },
  { sigla: '11º BPM/M', nome: '11º Batalhão de Polícia Militar Metropolitano', categoria: 'Metropolitano' },
  { sigla: '1º BPM/I', nome: '1º Batalhão de Polícia Militar do Interior', categoria: 'Interior' },
  { sigla: '2º BPM/I', nome: '2º Batalhão de Polícia Militar do Interior', categoria: 'Interior' },
  { sigla: '3º BPM/I', nome: '3º Batalhão de Polícia Militar do Interior', categoria: 'Interior' },
  { sigla: '4º BPM/I', nome: '4º Batalhão de Polícia Militar do Interior', categoria: 'Interior' },
  { sigla: '15º BPM/I', nome: '15º Batalhão de Polícia Militar do Interior', categoria: 'Interior' },
];

export const BATALHOES_PM = UNIDADES_PM;

