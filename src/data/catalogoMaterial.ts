import { CategoriaMaterial } from '../types';

export const PATENTES_PM = [
  'Soldado PM',
  'Cabo PM',
  '3º Sargento PM',
  '2º Sargento PM',
  '1º Sargento PM',
  'Subtenente PM',
  'Aspirante a Oficial PM',
  '2º Tenente PM',
  '1º Tenente PM',
  'Capitão PM',
  'Major PM',
  'Tenente-Coronel PM',
  'Coronel PM',
];

export interface ModeloCatalogo {
  nome: string;
  calibre?: string;
}

export const CATALOGO_POR_CATEGORIA: Record<CategoriaMaterial, ModeloCatalogo[]> = {
  ARMAMENTO: [
    { nome: 'Pistola Glock G22 Gen5', calibre: '.40 S&W' },
    { nome: 'Pistola Glock G19 Gen5', calibre: '9x19mm Parabellum' },
    { nome: 'Pistola Taurus TS9', calibre: '9x19mm Parabellum' },
    { nome: 'Pistola Taurus PT100', calibre: '.40 S&W' },
    { nome: 'Pistola Taurus PT24/7 PRO', calibre: '.40 S&W' },
    { nome: 'Fuzil IMBEL IA2', calibre: '5.56x45mm NATO' },
    { nome: 'Fuzil Taurus T4', calibre: '5.56x45mm NATO' },
    { nome: 'Carabina CTT40', calibre: '.40 S&W' },
    { nome: 'Espingarda CBC Military 3.0', calibre: '12GA' },
    { nome: 'Espingarda Boito Pump', calibre: '12GA' },
    { nome: 'Lançador AM-600', calibre: '37/38mm / 40mm' },
  ],
  MUNIÇÃO: [
    { nome: 'Cartucho CBC .40 S&W Gold Hex ETPR', calibre: '.40 S&W' },
    { nome: 'Cartucho CBC .40 S&W Treinamento NTA', calibre: '.40 S&W' },
    { nome: 'Cartucho CBC 9mm Luger Bonded +P', calibre: '9x19mm Parabellum' },
    { nome: 'Cartucho CBC 9mm Treinamento', calibre: '9x19mm Parabellum' },
    { nome: 'Cartucho CBC 5.56x45mm SS109 / M855', calibre: '5.56x45mm NATO' },
    { nome: 'Cartucho CBC 12GA Balote SG', calibre: '12GA' },
    { nome: 'Cartucho CBC 12GA Elastômero (Menos Letal)', calibre: '12GA' },
    { nome: 'Cartucho Calibre 12 Balote Frangível', calibre: '12GA' },
  ],
  CARREGADOR: [
    { nome: 'Carregador Glock G22 (.40 - 15 tiros)', calibre: '.40 S&W' },
    { nome: 'Carregador Glock G19 (9mm - 15 tiros)', calibre: '9x19mm' },
    { nome: 'Carregador Taurus TS9 (9mm - 17 tiros)', calibre: '9x19mm' },
    { nome: 'Carregador IMBEL IA2 (5.56 - 30 tiros)', calibre: '5.56x45mm' },
    { nome: 'Carregador Magpul PMAG 30 (5.56)', calibre: '5.56x45mm' },
    { nome: 'Carregador CTT40 (.40 - 30 tiros)', calibre: '.40 S&W' },
  ],
  PROTEÇÃO: [
    { nome: 'Colete Balístico Nível III-A (Masculino)', calibre: 'Nível III-A' },
    { nome: 'Colete Balístico Nível III-A (Feminino)', calibre: 'Nível III-A' },
    { nome: 'Placa Balística Stand Alone Nível IV', calibre: 'Nível IV (Fuzil)' },
    { nome: 'Capacete Balístico Kevlar Nível III-A', calibre: 'Nível III-A' },
    { nome: 'Escudo Balístico Nível III-A com Visor', calibre: 'Nível III-A' },
    { nome: 'Capa Tática Modular MOLLE', calibre: 'Padrão' },
  ],
  COMUNICAÇÃO: [
    { nome: 'Rádio Transceptor Portátil Motorola APX2000', calibre: 'VHF/UHF' },
    { nome: 'Rádio Motorola APX4000 Criptografado', calibre: 'P25 Digital' },
    { nome: 'Microfone de Lapela / PTT Tático', calibre: 'Acessório' },
    { nome: 'Bateria Reserva Motorola Impres', calibre: 'Íon-Lítio' },
  ],
  ACESSÓRIOS: [
    { nome: 'Algema de Corrente Aço Inox com Chave', calibre: 'Padrão' },
    { nome: 'Algema de Dobradiça Tática', calibre: 'Padrão' },
    { nome: 'Coldre de Polímero com Retenção Nível 3', calibre: 'Destro' },
    { nome: 'Lanterna Tática Tática LED 1000 Lumens', calibre: 'Recarregável' },
    { nome: 'Espargidor de Pimenta GL-108 Max', calibre: 'OC / Menos Letal' },
    { nome: 'Bastão Tonfa Rígido em Polímero', calibre: 'Padrão PM' },
  ],
};
