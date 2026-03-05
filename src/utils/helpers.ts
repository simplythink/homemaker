import type { CleaningFrequency, CleaningTask } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const FREQUENCY_LABELS: Record<CleaningFrequency, string> = {
  daily: '每日',
  weekly: '每週',
  biweekly: '每兩週',
  monthly: '每月',
  quarterly: '每季',
  custom: '自訂',
};

export function getFrequencyDays(freq: CleaningFrequency, customDays?: number): number {
  switch (freq) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'custom': return customDays ?? 7;
    default: return 7;
  }
}

export function getNextDueDate(task: CleaningTask): Date {
  const days = getFrequencyDays(task.frequency, task.customDays);
  const base = task.lastCompletedAt ? new Date(task.lastCompletedAt) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function isOverdue(task: CleaningTask): boolean {
  return new Date() > getNextDueDate(task);
}
