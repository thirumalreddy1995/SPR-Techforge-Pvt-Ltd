
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button } from '../../components/Components';
import { TransactionType, AccountType } from '../../types';
import * as utils from '../../utils';

export const FinancialStatements: React.FC = () => {
  const { transactions, accounts, candidates, getEntityBalance } = useApp();
  const [activeTab, setActiveTab] = useState<'BS' | 'PL'>('BS');
  
  // --- PROFIT & LOSS CALCULATION ---
  const incomeTransactions = transactions.filter(t => t.type === TransactionType.Income);
  const expenseTransactions = transactions.filter(t => t.type === TransactionType.Expense);

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Group Expenses by Category (Destination Account Name)
  const expenseBreakdown = expenseTransactions.reduce((acc, t) => {
    // Get account name or category
    let category = "General Expense";
    if (t.toEntityType === 'Account') {
        const accObj = accounts.find(a => a.id === t.toEntityId);
        if (accObj) category = accObj.subType || accObj.name;
    }
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // --- BALANCE SHEET CALCULATION ---
  
  // Assets
  const cashAccounts = accounts.filter(a => a.type === AccountType.Cash);
  const bankAccounts = accounts.filter(a => a.type === AccountType.Bank);
  const debtors = accounts.filter(a => a.type === AccountType.Debtor);
  
  const totalCash = cashAccounts.reduce((sum, a) => sum + getEntityBalance(a.id, 'Account'), 0);
  const totalBank = bankAccounts.reduce((sum, a) => sum + getEntityBalance(a.id, 'Account'), 0);
  const totalDebtors = debtors.reduce((sum, a) => sum + getEntityBalance(a.id, 'Account'), 0);

  // Candidate Receivables
  const totalCandidateReceivables = candidates.reduce((sum, c) => {
      if (!c.isActive && c.status === 'Discontinued') return sum; // Don't count discontinued as asset unless specifically tracked
      const paid = transactions
        .filter(t => t.fromEntityId === c.id && t.type === TransactionType.Income)
        .reduce((s, t) => s + t.amount, 0);
      const refunded = transactions
        .filter(t => t.toEntityId === c.id && t.type === TransactionType.Refund)
        .reduce((s, t) => s + t.amount, 0);
      const netPaid = paid - refunded;
      const due = c.agreedAmount - netPaid;
      return sum + (due > 0 ? due : 0);
  }, 0);

  const totalAssets = totalCash + totalBank + totalDebtors + totalCandidateReceivables;

  // Liabilities
  const creditors = accounts.filter(a => a.type === AccountType.Creditor);
  const totalCreditors = creditors.reduce((sum, a) => {
      const bal = getEntityBalance(a.id, 'Account');
      return sum + (bal < 0 ? Math.abs(bal) : 0); // Creditor balance is usually negative if we owe them
  }, 0);

  // Equity (Simplified: Assets - Liabilities)
  // In a real double entry, Equity = Capital + Retained Earnings (Net Profit)
  // Here check if it matches
  const impliedEquity = totalAssets - totalCreditors;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">Financial Statements</h1>
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
      </div>

      <div className="print:hidden flex space-x-4 border-b border-gray-200">
        <button 
          className={`py-2 px-4 font-medium border-b-2 transition-colors ${activeTab === 'BS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('BS')}
        >
          Balance Sheet
        </button>
        <button 
          className={`py-2 px-4 font-medium border-b-2 transition-colors ${activeTab === 'PL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('PL')}
        >
          Profit & Loss
        </button>
      </div>

      {/* PRINTABLE AREA */}
      <div className="bg-white p-8 min-h-screen shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
         
         {/* HEADER */}
         <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-widest">SPR Techforge Pvt Ltd</h2>
            <p className="text-gray-600 mt-1">Consultancy & Training Services</p>
            <p className="text-sm text-gray-500 mt-2">Generated on: {new Date().toLocaleDateString()}</p>
         </div>

         {(activeTab === 'BS' || typeof window !== 'undefined') && (
           <div className={activeTab === 'BS' ? 'block' : 'hidden print:block print:break-after-page'}>
              <h3 className="text-xl font-bold text-center underline mb-6">BALANCE SHEET</h3>
              
              <div className="grid grid-cols-2 gap-8">
                 {/* ASSETS */}
                 <div>
                    <div className="flex justify-between border-b border-gray-400 pb-1 mb-2">
                       <span className="font-bold text-emerald-800">ASSETS</span>
                       <span className="font-bold text-emerald-800">Amount (₹)</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between font-semibold text-gray-700">
                          <span>Current Assets</span>
                       </div>
                       <div className="flex justify-between pl-4 text-gray-600">
                          <span>Cash on Hand</span>
                          <span>{utils.formatCurrency(totalCash)}</span>
                       </div>
                       <div className="flex justify-between pl-4 text-gray-600">
                          <span>Bank Accounts</span>
                          <span>{utils.formatCurrency(totalBank)}</span>
                       </div>
                       
                       <div className="flex justify-between font-semibold text-gray-700 mt-4">
                          <span>Receivables</span>
                       </div>
                       <div className="flex justify-between pl-4 text-gray-600">
                          <span>Candidate Fees Pending</span>
                          <span>{utils.formatCurrency(totalCandidateReceivables)}</span>
                       </div>
                       <div className="flex justify-between pl-4 text-gray-600">
                          <span>Sundry Debtors</span>
                          <span>{utils.formatCurrency(totalDebtors)}</span>
                       </div>
                    </div>

                    <div className="flex justify-between border-t border-gray-800 pt-2 mt-8 font-bold text-gray-900 text-lg">
                       <span>TOTAL ASSETS</span>
                       <span>{utils.formatCurrency(totalAssets)}</span>
                    </div>
                 </div>

                 {/* LIABILITIES & EQUITY */}
                 <div>
                    <div className="flex justify-between border-b border-gray-400 pb-1 mb-2">
                       <span className="font-bold text-red-800">LIABILITIES</span>
                       <span className="font-bold text-red-800">Amount (₹)</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between font-semibold text-gray-700">
                          <span>Current Liabilities</span>
                       </div>
                       <div className="flex justify-between pl-4 text-gray-600">
                          <span>Sundry Creditors</span>
                          <span>{utils.formatCurrency(totalCreditors)}</span>
                       </div>
                    </div>

                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-8 font-bold text-gray-700">
                       <span>Total Liabilities</span>
                       <span>{utils.formatCurrency(totalCreditors)}</span>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between border-b border-gray-400 pb-1 mb-2">
                           <span className="font-bold text-indigo-800">EQUITY</span>
                           <span className="font-bold text-indigo-800">Amount (₹)</span>
                        </div>
                        <div className="space-y-2 text-sm">
                           <div className="flex justify-between pl-4 text-gray-600">
                              <span>Owners Capital / Net Value</span>
                              <span>{utils.formatCurrency(impliedEquity)}</span>
                           </div>
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-gray-800 pt-2 mt-8 font-bold text-gray-900 text-lg">
                       <span>TOTAL LIABILITIES & EQUITY</span>
                       <span>{utils.formatCurrency(totalCreditors + impliedEquity)}</span>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {(activeTab === 'PL' || typeof window !== 'undefined') && (
           <div className={`${activeTab === 'PL' ? 'block' : 'hidden print:block'} print:mt-8`}>
              <h3 className="text-xl font-bold text-center underline mb-6">PROFIT & LOSS ACCOUNT</h3>
              
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-900 font-bold">
                       <tr>
                          <th className="p-3 border-r border-gray-300 w-2/3">Particulars</th>
                          <th className="p-3 text-right">Amount (₹)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                       {/* INCOME */}
                       <tr className="bg-emerald-50/50 font-bold text-emerald-800">
                          <td className="p-3 border-r border-gray-200">INCOME (Revenue)</td>
                          <td className="p-3 text-right"></td>
                       </tr>
                       <tr>
                          <td className="p-3 pl-8 border-r border-gray-200 text-gray-700">Consultancy Fees Received</td>
                          <td className="p-3 text-right text-gray-900">{utils.formatCurrency(totalIncome)}</td>
                       </tr>
                       <tr className="font-bold bg-gray-50">
                          <td className="p-3 border-r border-gray-200 text-right">Total Income (A)</td>
                          <td className="p-3 text-right text-emerald-700">{utils.formatCurrency(totalIncome)}</td>
                       </tr>

                       {/* EXPENSES */}
                       <tr className="bg-red-50/50 font-bold text-red-800">
                          <td className="p-3 border-r border-gray-200">EXPENSES</td>
                          <td className="p-3 text-right"></td>
                       </tr>
                       {Object.entries(expenseBreakdown).map(([cat, amt]: [string, number]) => (
                          <tr key={cat}>
                             <td className="p-3 pl-8 border-r border-gray-200 text-gray-700">{cat}</td>
                             <td className="p-3 text-right text-gray-900">{utils.formatCurrency(amt)}</td>
                          </tr>
                       ))}
                       <tr className="font-bold bg-gray-50">
                          <td className="p-3 border-r border-gray-200 text-right">Total Expenses (B)</td>
                          <td className="p-3 text-right text-red-700">{utils.formatCurrency(totalExpense)}</td>
                       </tr>

                       {/* NET RESULT */}
                       <tr className={`text-lg font-bold ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                          <td className="p-4 border-r border-gray-300 text-right uppercase">
                             {netProfit >= 0 ? 'Net Profit (A - B)' : 'Net Loss (A - B)'}
                          </td>
                          <td className="p-4 text-right">
                             {utils.formatCurrency(netProfit)}
                          </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         <div className="mt-12 text-center text-xs text-gray-400">
             <p>This is a computer-generated statement.</p>
         </div>
      </div>
    </div>
  );
};
