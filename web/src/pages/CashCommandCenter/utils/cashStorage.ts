export interface CashEntry {
  id: string;
  date: string;
  time: string;
  personName: string;
  type: 'credit' | 'debit';
  notes: Record<number, number>;
  coins: Record<number, number>;
  cashTotal: number;
  onlineAmount: number;
  manualAddition: number;
  manualDeduction: number;
  grandTotal: number;
}

export const getCashHistory = (): CashEntry[] => {
  try {
    const data = localStorage.getItem('thor_wms_cash_history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCashEntry = (entry: Omit<CashEntry, 'id' | 'date' | 'time'>) => {
  const history = getCashHistory();
  const now = new Date();
  const newEntry: CashEntry = {
    ...entry,
    id: 'CSH-' + Date.now().toString(36).toUpperCase(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString(),
  };
  history.unshift(newEntry);
  localStorage.setItem('thor_wms_cash_history', JSON.stringify(history));
  return newEntry;
};

export const deleteCashEntry = (id: string) => {
  const history = getCashHistory();
  const newHistory = history.filter(e => e.id !== id);
  localStorage.setItem('thor_wms_cash_history', JSON.stringify(newHistory));
};
