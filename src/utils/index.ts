import { MESES } from '../types';

/**
 * Tipo para representar os dias da semana com períodos
 */
export type DiaSemana = 
  | 'SEGUNDA-MANHÃ' | 'SEGUNDA-TARDE'
  | 'TERÇA-MANHÃ' | 'TERÇA-TARDE'
  | 'QUARTA-MANHÃ' | 'QUARTA-TARDE'
  | 'QUINTA-MANHÃ' | 'QUINTA-TARDE'
  | 'SEXTA-MANHÃ' | 'SEXTA-TARDE'
  | 'SABADO-MANHÃ' | 'SABADO-TARDE';

/**
 * Formata uma data para o formato brasileiro (DD/MM/AAAA)
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Converte número do mês para nome
 */
export const getMonthName = (month: number): string => {
  const monthObj = MESES.find(m => m.value === month);
  return monthObj ? monthObj.label : 'Mês inválido';
};

/**
 * Formata o período do cronograma (Mês/Ano)
 */
export const formatPeriod = (month: number, year: number): string => {
  return `${getMonthName(month)} ${year}`;
};

/**
 * Converte dia da semana para formato mais legível
 */
export const formatDiaSemana = (diaSemana: string): string => {
  const [dia, periodo] = diaSemana.split('-');
  const diaFormatado = dia.charAt(0) + dia.slice(1).toLowerCase();
  const periodoFormatado = periodo.charAt(0) + periodo.slice(1).toLowerCase();
  return `${diaFormatado} - ${periodoFormatado}`;
};

/**
 * Gera os dias de um mês específico
 */
export const getDaysInMonth = (month: number, year: number): Date[] => {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month - 1, day));
  }
  
  return days;
};

/**
 * Obtém o nome do dia da semana em português
 */
export const getDayName = (date: Date): string => {
  const days = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  return days[date.getDay()];
};

/**
 * Valida se uma data é válida
 */
export const isValidDate = (date: Date | string): boolean => {
  const d = date instanceof Date ? date : new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Valida se uma data está dentro do mês/ano especificado
 */
export const isDateInMonth = (date: string, month: number, year: number): boolean => {
  const d = new Date(date);
  return d.getMonth() + 1 === month && d.getFullYear() === year;
};

/**
 * Debounce function para otimizar pesquisas
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Trunca texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitaliza a primeira letra de cada palavra
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Gera um ID único simples
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Valida se um email é válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Remove acentos de uma string
 */
export const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Filtra array por texto de busca
 */
export const filterBySearch = <T>(
  items: T[],
  searchText: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchText.trim()) return items;
  
  const search = removeAccents(searchText.toLowerCase());
  
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return removeAccents(value.toLowerCase()).includes(search);
      }
      return false;
    })
  );
};

/**
 * Gera o enum DiaSemana baseado numa data e período
 */
export const getDiaSemanaEnum = (date: Date, periodo: 'MANHÃ' | 'TARDE'): DiaSemana => {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  const dayNames: Record<number, string> = {
    1: 'SEGUNDA',
    2: 'TERÇA',
    3: 'QUARTA',
    4: 'QUINTA',
    5: 'SEXTA',
    6: 'SABADO'
  };
  
  const dayName = dayNames[dayOfWeek];
  if (!dayName) {
    throw new Error('Dia da semana inválido. Apenas segunda a sábado são permitidos.');
  }
  
  return `${dayName}-${periodo}` as DiaSemana;
};