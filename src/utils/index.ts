import { MESES } from '../types';

// Movido de types.ts para ser usado localmente e exportado
export type DiaSemana = 
  | 'SEGUNDA-MANHÃ'
  | 'SEGUNDA-TARDE'
  | 'TERÇA-MANHÃ'
  | 'TERÇA-TARDE'
  | 'QUARTA-MANHÃ'
  | 'QUARTA-TARDE'
  | 'QUINTA-MANHÃ'
  | 'QUINTA-TARDE'
  | 'SEXTA-MANHÃ'
  | 'SEXTA-TARDE'
  | 'SABADO-MANHÃ'
  | 'SABADO-TARDE'
  | 'DOMINGO-MANHÃ' // Adicionado para cobrir todos os dias
  | 'DOMINGO-TARDE';

/**
 * Formata uma data para o formato brasileiro (DD/MM/AAAA) ou AAAA-MM-DD
 */
export const formatDate = (date: string | Date, format: 'DD/MM/AAAA' | 'YYYY-MM-DD' = 'DD/MM/AAAA'): string => {
  const d = new Date(date);
  
  if (!isValidDate(d)) return 'Data inválida';

  if (format === 'YYYY-MM-DD') {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Default to DD/MM/AAAA
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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
 * Converte um objeto Date e um período ('MANHÃ' ou 'TARDE') para o enum DiaSemana.
 * Ex: new Date('2025-06-02'), 'MANHÃ' => 'SEGUNDA-MANHÃ'
 */
export const getDiaSemanaEnum = (date: Date, periodo: 'MANHÃ' | 'TARDE'): DiaSemana => {
  const dias: (string | DiaSemana)[] = [
    'DOMINGO-MANHÃ', 'SEGUNDA-MANHÃ', 'TERÇA-MANHÃ', 'QUARTA-MANHÃ', 
    'QUINTA-MANHÃ', 'SEXTA-MANHÃ', 'SABADO-MANHÃ'
  ];
  const diaBase = dias[date.getUTCDay()]; // Usar getUTCDay para consistência
  return diaBase.replace('MANHÃ', periodo) as DiaSemana;
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
  return days[date.getUTCDay()]; // Usar getUTCDay para consistência
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
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as NodeJS.Timeout;
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