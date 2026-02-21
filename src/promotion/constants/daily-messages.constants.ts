import { DAILY_MESSAGES } from './bar_constats';

export interface DailyMessage {
  readonly message: string;
  readonly suffix: string;
}

/**
 * Zwraca wiadomość dnia na podstawie aktualnej daty.
 * Używa dnia miesiąca (1-31) z modulo 30 dla konsystencji.
 *
 * @returns Wiadomość odpowiadająca bieżącemu dniu miesiąca
 *
 * @example
 * // Dla dnia 1 stycznia
 * getDailyMessage() // "Dzień dobry! 😊"
 *
 * @example
 * // Dla dnia 31 stycznia (wrap do dnia 1)
 * getDailyMessage() // "Dzień dobry! 😊"
 */
export function getDailyMessage(): DailyMessage {
  const dayOfMonth = new Date().getDate(); // 1-31
  const index = (dayOfMonth - 1) % DAILY_MESSAGES.length; // 0-29
  return DAILY_MESSAGES[index];
}
