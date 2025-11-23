
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, ConfirmationModal } from '../../components/Components';
import { Link, useNavigate } from 'react-router-dom';
import * as utils from '../../utils';
import { Account } from '../../types';

export const AccountList: React.FC = () => {
  const { accounts, getEntityBalance, deleteAccount } = useApp();
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string, isSystem: boolean | undefined) => {
    if (isSystem) {
      alert("Cannot delete system accounts");
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteAccount(deleteId);
      setDeleteId(null);
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-emerald-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  // Filter accounts based on search text
  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(filterText.toLowerCase()) || 
    (a.subType && a.subType.toLowerCase().includes(filterText.toLowerCase()))
  );

  // Group accounts by type for better view
  const grouped = filteredAccounts.reduce((acc, curr) => {
    const t = curr.type;
    if (!acc[t]) acc[t] = [];
    acc[t].push(curr);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Ledger Accounts</h1>
        <Link to="/finance/accounts/new">
          <Button>+ Add Account</Button>
        </Link>
      </div>

      <Card className="p-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            placeholder="Search accounts by name or sub-type..." 
            className="w-full bg-white border-none rounded-lg px-2 py-1 text-gray-900 focus:ring-0 outline-none placeholder-gray-400"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
      </Card>

      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([type, accs]: [string, Account[]]) => (
          <Card key={type} title={`${type} Accounts`} className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-600">
                 <thead>
                  <tr className="border-b border-spr-700 text-xs uppercase text-gray-500 bg-gray-50">
                    <th className="py-2 px-4">Account Name</th>
                    <th className="py-2 px-4">Sub Type</th>
                    <th className="py-2 px-4 text-right">Current Balance</th>
                    <th className="py-2 px-4 text-center">Action</th>
                  </tr>
                 </thead>
                 <tbody className="divide-y divide-spr-700">
                   {accs.map(a => {
                     const balance = getEntityBalance(a.id, 'Account');
                     return (
                       <tr key={a.id} className="hover:bg-gray-50">
                         <td className="py-3 px-4 font-medium text-gray-900">{a.name}</td>
                         <td className="py-3 px-4 text-sm">{a.subType || '-'}</td>
                         <td className={`py-3 px-4 text-right font-mono font-bold ${getBalanceColor(balance)}`}>
                           {utils.formatCurrency(balance)}
                         </td>
                         <td className="py-3 px-4 text-center flex justify-center gap-2">
                           <button 
                              onClick={() => navigate(`/finance/statement/Account/${a.id}`)} 
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              Stmt
                           </button>
                           <button 
                             onClick={() => navigate(`/finance/accounts/edit/${a.id}`)} 
                             className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                           >
                             Edit
                           </button>
                           {!a.isSystem && (
                             <button onClick={() => handleDeleteClick(a.id, a.isSystem)} className="text-red-500 hover:text-red-700 text-sm font-medium">Del</button>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
              </table>
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-gray-300 border-dashed">
          <p>No ledger accounts found matching "{filterText}".</p>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Account"
        message="Are you sure you want to delete this account? History will be preserved but the account name will be lost in filters."
      />
    </div>
  );
};
