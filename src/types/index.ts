import type { DiaSemana } from "../utils";

export interface Cronograma {
  id: string;
  mes: number;
  ano: number;
  nomeUBSF?: string;
  enfermeiro?: string;
  medico?: string;
  criadoEm: string;
  atualizadoEm: string;
  atividades?: Atividade[];
}

export interface Atividade {
  id: string;
  cronogramaId: string;
  data: string;
  diaSemana: DiaSemana;
  descricao: string;
  criadoEm: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  cronogramas?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCronogramaData {
  mes: number;
  ano: number;
  nomeUBSF?: string;
  enfermeiro?: string;
  medico?: string;
}

export interface UpdateCronogramaData {
  nomeUBSF?: string;
  enfermeiro?: string;
  medico?: string;
}

export interface CreateAtividadeData {
  cronogramaId?: string;
  data: string;
  diaSemana: DiaSemana;
  descricao: string;
}

export interface UpdateAtividadeData {
  data?: string;
  diaSemana?: DiaSemana;
  descricao?: string;
}

// Aliases para compatibilidade
export type CreateAtividadeDTO = CreateAtividadeData;
export type UpdateAtividadeDTO = UpdateAtividadeData;

export const DIAS_SEMANA: DiaSemana[] = [
  'SEGUNDA-MANHÃ',
  'SEGUNDA-TARDE',
  'TERÇA-MANHÃ',
  'TERÇA-TARDE',
  'QUARTA-MANHÃ',
  'QUARTA-TARDE',
  'QUINTA-MANHÃ',
  'QUINTA-TARDE',
  'SEXTA-MANHÃ',
  'SEXTA-TARDE',
  'SABADO-MANHÃ',
  'SABADO-TARDE'
];

export const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];