
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Pagination, Modal, ConfirmationModal } from '../../components/Components';
import { Link, useNavigate } from 'react-router-dom';
import * as utils from '../../utils';
import { TransactionType, Transaction } from '../../types';

export const TransactionList: React.FC = () => {
  const { transactions, getEntityName, deleteTransaction, user, accounts, candidates } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [lockFilter, setLockFilter] = useState<string>('All');
  const [fromFilter, setFromFilter] = useState<string>('');
  const [toFilter, setToFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 10;

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = sortedTransactions.filter(t => {
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    
    const matchesLock = lockFilter === 'All' || 
                        (lockFilter === 'Locked' && t.isLocked) || 
                        (lockFilter === 'Unlocked' && !t.isLocked);
    
    const matchesFrom = fromFilter === '' || t.fromEntityId === fromFilter;
    const matchesTo = toFilter === '' || t.toEntityId === toFilter;

    const fromName = getEntityName(t.fromEntityId, t.fromEntityType).toLowerCase();
    const toName = getEntityName(t.toEntityId, t.toEntityType).toLowerCase();
    const matchesText = 
      t.description.toLowerCase().includes(filterText.toLowerCase()) ||
      fromName.includes(filterText.toLowerCase()) ||
      toName.includes(filterText.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && new Date(t.date) >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.date) <= end;
    }

    return matchesType && matchesText && matchesDate && matchesLock && matchesFrom && matchesTo;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDeleteClick = (t: Transaction) => {
    if (t.isLocked && user?.role !== 'admin') {
      alert('This transaction is locked.');
      return;
    }
    setDeleteId(t.id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  // Export formatter
  const handleExport = () => {
    const exportData = filtered.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Type: t.type,
      Description: t.description,
      From: getEntityName(t.fromEntityId, t.fromEntityType),
      To: getEntityName(t.toEntityId, t.toEntityType),
      Amount: t.amount,
      Locked: t.isLocked ? 'Yes' : 'No'
    }));
    utils.downloadCSV(exportData, 'transactions.csv');
  };

  // Prepare sorted lists for dropdowns
  const sortedAccounts = [...accounts].sort((a, b) => a.name.localeCompare(b.name));
  const sortedCandidates = [...candidates].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
          <Link to="/finance/transactions/new">
            <Button>+ New Entry</Button>
          </Link>
        </div>
      </div>

      <Card>
        {/* Filters Container */}
        <div className="mb-6 space-y-4">
          {/* Row 1: Search & Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input 
              placeholder="Search description..." 
              className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none placeholder-gray-400"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
            <select 
               className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none"
               value={typeFilter}
               onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select 
               className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none"
               value={lockFilter}
               onChange={e => setLockFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Locked">Locked</option>
              <option value="Unlocked">Unlocked</option>
            </select>
          </div>
          
          {/* Row 2: Entity Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
             <select 
               className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none"
               value={fromFilter}
               onChange={e => setFromFilter(e.target.value)}
             >
               <option value="">All Sources (From)</option>
               <optgroup label="Accounts">
                 {sortedAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </optgroup>
               <optgroup label="Candidates">
                 {sortedCandidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.batchId})</option>)}
               </optgroup>
             </select>

             <select 
               className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none"
               value={toFilter}
               onChange={e => setToFilter(e.target.value)}
             >
               <option value="">All Destinations (To)</option>
               <optgroup label="Accounts">
                 {sortedAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </optgroup>
               <optgroup label="Candidates">
                 {sortedCandidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.batchId})</option>)}
               </optgroup>
             </select>
          </div>

          {/* Row 3: Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-bold w-12">From</span>
                <input 
                  type="date"
                  className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none placeholder-gray-400"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-bold w-12">To</span>
                <input 
                  type="date"
                  className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 w-full focus:ring-1 focus:ring-spr-accent outline-none placeholder-gray-400"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-600">
            <thead>
              <tr className="border-b border-spr-700 text-xs uppercase tracking-wider text-gray-500 bg-gray-50">
                <th className="py-3 px-4 w-28">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">From (Source)</th>
                <th className="py-3 px-4">To (Dest)</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spr-700">
              {paginatedData.length > 0 ? paginatedData.map(t => {
                const isLocked = t.isLocked;
                const isEditable = !isLocked || user?.role === 'admin';

                return (
                  <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${isLocked ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 cursor-pointer group" onClick={() => setViewTransaction(t)}>
                      <div className={`font-medium flex items-center gap-2 transition-colors ${isLocked ? 'text-gray-500' : 'text-gray-900 hover:text-indigo-600'}`}>
                        {t.description}
                        {isLocked ? (
                          <svg className="w-4 h-4 text-amber-600/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <title>Locked Transaction</title>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <title>Editable</title>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 inline-block px-1 rounded bg-gray-100 border border-gray-200">{t.type}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{getEntityName(t.fromEntityId, t.fromEntityType)}</td>
                    <td className="py-3 px-4 text-sm">{getEntityName(t.toEntityId, t.toEntityType)}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${t.type === 'Income' ? 'text-emerald-600' : t.type === 'Expense' ? 'text-red-600' : 'text-gray-700'}`}>
                      {utils.formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => setViewTransaction(t)} className="text-gray-400 hover:text-gray-900 p-1 rounded hover:bg-gray-100" title="View Details">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                             </svg>
                           </button>
                           {isEditable ? (
                             <>
                               <button onClick={() => navigate(`/finance/transactions/edit/${t.id}`)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Edit">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               </button>
                               <button onClick={() => handleDeleteClick(t)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Delete">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               </button>
                             </>
                           ) : (
                             <div className="p-1 px-2" title="Locked">
                               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                               </svg>
                             </div>
                           )}
                        </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No transactions found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      <Modal isOpen={!!viewTransaction} onClose={() => setViewTransaction(null)} title="Transaction Details">
        {viewTransaction && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-spr-700">
               <p className="text-gray-500 text-sm uppercase tracking-wider font-bold">Amount</p>
               <p className={`text-4xl font-bold mt-2 ${viewTransaction.type === 'Income' ? 'text-emerald-600' : viewTransaction.type === 'Expense' ? 'text-red-600' : 'text-gray-900'}`}>
                 {utils.formatCurrency(viewTransaction.amount)}
               </p>
               <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                  {viewTransaction.type}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Date</p>
                <p className="text-gray-900 font-medium">{new Date(viewTransaction.date).toDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Transaction ID</p>
                <p className="text-gray-600 font-mono text-sm truncate" title={viewTransaction.id}>
                  {viewTransaction.id}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Description</p>
              <div className="flex items-center gap-2">
                 <p className="text-gray-900 text-lg leading-relaxed">{viewTransaction.description}</p>
                 {viewTransaction.isLocked && (
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <title>Locked</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                 )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-spr-700 space-y-4">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">From (Source)</p>
                    <p className="text-indigo-600 font-bold">{getEntityName(viewTransaction.fromEntityId, viewTransaction.fromEntityType)}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-xs px-2 py-1 rounded bg-white text-gray-500 border border-spr-700 font-medium">{viewTransaction.fromEntityType}</span>
                  </div>
               </div>
               
               <div className="flex justify-center">
                 <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                 </svg>
               </div>

               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">To (Destination)</p>
                    <p className="text-indigo-600 font-bold">{getEntityName(viewTransaction.toEntityId, viewTransaction.toEntityType)}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-xs px-2 py-1 rounded bg-white text-gray-500 border border-spr-700 font-medium">{viewTransaction.toEntityType}</span>
                  </div>
               </div>
            </div>
            
            {viewTransaction.isLocked && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                This transaction is locked and cannot be modified by staff.
              </div>
            )}

            <div className="flex justify-end">
               <Button variant="secondary" onClick={() => setViewTransaction(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will affect account balances."
      />
    </div>
  );
};
