
import { Transaction } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(',')
  ).join('\n');
  const csvContent = `${headers}\n${rows}`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Core Business Logic extracted for Testing
export const calculateEntityBalance = (
  id: string, 
  type: 'Account' | 'Candidate', 
  transactions: Transaction[], 
  openingBalance: number = 0
): number => {
  let balance = 0;

  // Initial Opening Balance (Only relevant for Accounts usually)
  if (type === 'Account') {
    balance += openingBalance;
  } 

  transactions.forEach(t => {
    // If entity is the DESTINATION (Received money)
    if (t.toEntityId === id && t.toEntityType === type) {
      balance += t.amount; 
    }
    // If entity is the SOURCE (Paid money)
    if (t.fromEntityId === id && t.fromEntityType === type) {
      balance -= t.amount;
    }
  });

  return balance;
};
