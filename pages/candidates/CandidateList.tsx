
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Pagination, ConfirmationModal } from '../../components/Components';
import { Link } from 'react-router-dom';
import * as utils from '../../utils';
import { CandidateStatus, TransactionType, Candidate } from '../../types';

export const CandidateList: React.FC = () => {
  const { candidates, deleteCandidate, updateCandidate, transactions, candidateStatuses } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('joinedDesc');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Filter logic
  const filtered = candidates.filter(c => {
    const term = filterText.toLowerCase();
    const matchesText = 
      c.name.toLowerCase().includes(term) || 
      c.batchId.toLowerCase().includes(term) ||
      (c.referredBy && c.referredBy.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesText && matchesStatus;
  });

  // Sorting Logic
  filtered.sort((a, b) => {
    if (sortBy === 'joinedDesc') return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
    if (sortBy === 'joinedAsc') return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
    if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
    
    // Balance Sort needs calculation
    if (sortBy === 'balanceDesc') {
       const getBal = (c: Candidate) => {
         const paid = Math.abs(transactions.filter(t => t.fromEntityId === c.id && t.type === TransactionType.Income).reduce((sum, t) => sum + t.amount, 0));
         return c.agreedAmount - paid;
       };
       return getBal(b) - getBal(a);
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedCandidates = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteCandidate(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleActive = (c: Candidate) => {
    updateCandidate({ ...c, isActive: !c.isActive });
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case CandidateStatus.Placed: return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case CandidateStatus.Training: return 'bg-blue-100 text-blue-800 border border-blue-200';
      case CandidateStatus.ReadyForInterview: return 'bg-amber-100 text-amber-800 border border-amber-200';
      case CandidateStatus.Discontinued: return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200'; 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={() => utils.downloadCSV(filtered, 'candidates.csv')}>
             Export CSV
           </Button>
           <Link to="/candidates/new">
             <Button>+ Add Candidate</Button>
           </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <input 
            placeholder="Search name, batch, or referral..." 
            className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 flex-1 focus:ring-1 focus:ring-spr-accent outline-none"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
          <div className="flex gap-4">
            <select 
               className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:ring-1 focus:ring-spr-accent outline-none"
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {candidateStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
               className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:ring-1 focus:ring-spr-accent outline-none"
               value={sortBy}
               onChange={e => setSortBy(e.target.value)}
            >
              <option value="joinedDesc">Newest First</option>
              <option value="joinedAsc">Oldest First</option>
              <option value="nameAsc">Name (A-Z)</option>
              <option value="balanceDesc">Highest Due Amount</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-600">
            <thead>
              <tr className="border-b border-spr-700 text-xs uppercase tracking-wider text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4 text-center">Active</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Due Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spr-700">
              {paginatedCandidates.length > 0 ? paginatedCandidates.map(c => {
                const paidAmount = Math.abs(transactions
                  .filter(t => t.fromEntityId === c.id && t.type === TransactionType.Income)
                  .reduce((sum, t) => sum + t.amount, 0));
                
                const refundedAmount = transactions
                   .filter(t => t.toEntityId === c.id && t.type === TransactionType.Refund)
                   .reduce((sum, t) => sum + t.amount, 0);

                const netPaid = paidAmount - refundedAmount;
                const balanceDue = c.agreedAmount - netPaid;
                
                const isInactive = !c.isActive;

                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isInactive ? 'opacity-60 bg-gray-50/50 grayscale' : ''}`}>
                    <td className="py-3 px-4 font-mono text-sm text-indigo-600 font-medium align-top">
                      {c.batchId}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 align-top">
                       <div>{c.name}</div>
                       <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
                          <span>{c.phone} {c.alternatePhone ? `/ ${c.alternatePhone}` : ''}</span>
                          {c.referredBy && <span className="text-indigo-500">Ref: {c.referredBy}</span>}
                          {c.status === CandidateStatus.Placed && c.placedCompany && (
                             <span className="text-emerald-600 font-bold">Placed @ {c.placedCompany} ({c.packageDetails})</span>
                          )}
                       </div>
                    </td>
                    <td className="py-3 px-4 text-center align-top">
                       <button 
                         onClick={() => handleToggleActive(c)}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${c.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                         title={c.isActive ? "Mark as Inactive" : "Mark as Active"}
                       >
                         <span className="sr-only">Toggle Active</span>
                         <span
                           className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${c.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                         />
                       </button>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right align-top`}>
                       <div className={`font-bold ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {utils.formatCurrency(balanceDue)}
                       </div>
                       <div className="text-xs text-gray-400">
                         Paid: {utils.formatCurrency(netPaid)}
                       </div>
                    </td>
                    <td className="py-3 px-4 text-center align-top">
                      <div className="flex justify-center gap-2">
                        <Link to={`/candidates/edit/${c.id}`} className="text-blue-600 hover:text-blue-800 text-sm" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </Link>
                        <Link to={`/finance/statement/Candidate/${c.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm" title="Statement">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </Link>
                        <Link to={`/candidates/agreement/${c.id}`} className="text-amber-600 hover:text-amber-800 text-sm" title="Agreement">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </Link>
                        <button onClick={() => handleDeleteClick(c.id)} className="text-red-500 hover:text-red-700 text-sm" title="Delete">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No candidates found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? Transactions associated with them will remain but will lose their direct link."
      />
    </div>
  );
};
