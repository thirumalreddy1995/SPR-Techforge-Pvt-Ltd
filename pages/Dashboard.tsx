
import React from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/Components';
import { AccountType, TransactionType, CandidateStatus } from '../types';
import * as utils from '../utils';

export const Dashboard: React.FC = () => {
  const { candidates, accounts, transactions, getEntityBalance } = useApp();

  // 1. Cash in Hand & Bank
  const cashAccounts = accounts.filter(a => a.type === AccountType.Cash);
  const bankAccounts = accounts.filter(a => a.type === AccountType.Bank);

  const totalCash = cashAccounts.reduce((sum, acc) => sum + getEntityBalance(acc.id, 'Account'), 0);
  const totalBank = bankAccounts.reduce((sum, acc) => sum + getEntityBalance(acc.id, 'Account'), 0);

  // 2. Candidate Stats
  const totalCandidates = candidates.length;
  const placedCandidates = candidates.filter(c => c.status === CandidateStatus.Placed);
  
  // 3. Financial Totals
  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.Expense)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.Income)
    .reduce((sum, t) => sum + t.amount, 0);

  // --- New Candidate Financial Logic ---
  const getCandidatePaid = (cId: string) => {
     const income = transactions
       .filter(t => t.fromEntityId === cId && t.type === TransactionType.Income)
       .reduce((sum, t) => sum + t.amount, 0);
     const refunds = transactions
       .filter(t => t.toEntityId === cId && t.type === TransactionType.Refund)
       .reduce((sum, t) => sum + t.amount, 0);
     return income - refunds;
  };

  const incomeFromPlaced = placedCandidates.reduce((sum, c) => sum + getCandidatePaid(c.id), 0);

  const existingCandidates = candidates.filter(c => 
    c.status !== CandidateStatus.Placed && 
    c.status !== CandidateStatus.Discontinued &&
    c.isActive
  );
  const incomeFromExisting = existingCandidates.reduce((sum, c) => sum + getCandidatePaid(c.id), 0);

  const activeCandidates = candidates.filter(c => c.isActive);
  const totalPendingReceivables = activeCandidates.reduce((sum, c) => {
      const paid = getCandidatePaid(c.id);
      const due = c.agreedAmount - paid;
      return sum + (due > 0 ? due : 0);
  }, 0);


  // --- Personal Accounting (Debts/Credits) ---
  const debtors = accounts.filter(a => a.type === AccountType.Debtor);
  const totalDebtorsReceivable = debtors.reduce((sum, a) => {
      const bal = getEntityBalance(a.id, 'Account');
      return sum + (bal > 0 ? bal : 0); 
  }, 0);

  const creditors = accounts.filter(a => a.type === AccountType.Creditor);
  const totalCreditorsPayable = creditors.reduce((sum, a) => {
      const bal = getEntityBalance(a.id, 'Account');
      return sum + (bal < 0 ? Math.abs(bal) : 0);
  }, 0);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, oversee your consultancy metrics.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase font-bold">Net Liquidity</p>
          <p className="text-2xl font-bold text-emerald-600">{utils.formatCurrency(totalCash + totalBank)}</p>
        </div>
      </div>

      {/* Financial Liquidity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-emerald-200 border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Cash in Hand</p>
              <p className="text-xl font-bold text-gray-900">{utils.formatCurrency(totalCash)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total of {cashAccounts.length} Cash A/c</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white border-blue-200 border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Bank Balance</p>
              <p className="text-xl font-bold text-gray-900">{utils.formatCurrency(totalBank)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total of {bankAccounts.length} Bank A/c</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-indigo-200 border shadow-sm">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Income</p>
              <p className="text-xl font-bold text-gray-900">{utils.formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-red-200 border shadow-sm">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900">{utils.formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Financial Overview */}
        <Card title="Candidate Financials" className="lg:col-span-2">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Total Candidates</p>
                 <p className="text-2xl font-bold text-gray-900 mt-1">{totalCandidates}</p>
                 <p className="text-xs text-gray-500 mt-1">{activeCandidates.length} Active</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <p className="text-emerald-600 text-xs uppercase tracking-wider font-bold">From Placed</p>
                 <p className="text-xl font-bold text-emerald-600 mt-1">{utils.formatCurrency(incomeFromPlaced)}</p>
                 <p className="text-xs text-gray-500 mt-1">Received</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <p className="text-blue-600 text-xs uppercase tracking-wider font-bold">From Existing</p>
                 <p className="text-xl font-bold text-blue-600 mt-1">{utils.formatCurrency(incomeFromExisting)}</p>
                 <p className="text-xs text-gray-500 mt-1">Received (Advances)</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2 md:col-span-3 flex items-center justify-between">
                 <div>
                    <p className="text-amber-600 text-xs uppercase tracking-wider font-bold">Pending Collectibles (Active Candidates)</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{utils.formatCurrency(totalPendingReceivables)}</p>
                 </div>
                 <div className="text-right">
                    <span className="text-xs text-gray-500 block">Potential Revenue</span>
                 </div>
              </div>
           </div>
        </Card>

        {/* Personal Accounting (Debts & Credits) */}
        <Card title="Personal Ledger">
           <div className="space-y-4">
             <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">My Debtors</p>
                    <p className="text-lg font-bold text-gray-900">Receivables</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-medium">Assets</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 mt-2">{utils.formatCurrency(totalDebtorsReceivable)}</p>
                <p className="text-xs text-gray-500 mt-1">People owe me</p>
             </div>

             <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs text-gray-500 uppercase font-bold">My Creditors</p>
                     <p className="text-lg font-bold text-gray-900">Payables</p>
                  </div>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-medium">Liabilities</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-2">{utils.formatCurrency(totalCreditorsPayable)}</p>
                <p className="text-xs text-gray-500 mt-1">I owe people</p>
             </div>
           </div>
        </Card>
      </div>

      {/* Profitability Estimate */}
      <Card title="Profit & Loss Estimation">
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-gray-600">Total Income (Realized)</span>
              <span className="text-emerald-600 font-bold">{utils.formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-gray-600">Total Expenses (Realized)</span>
              <span className="text-red-600 font-bold">- {utils.formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-900 text-lg font-bold">Net Profit / Loss</span>
              <span className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {utils.formatCurrency(totalIncome - totalExpenses)}
              </span>
            </div>
        </div>
      </Card>
    </div>
  );
};
