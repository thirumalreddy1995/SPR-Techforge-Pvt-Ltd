import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Select } from '../../components/Components';
import { useNavigate, useParams } from 'react-router-dom';
import { Transaction, TransactionType, AccountType } from '../../types';
import * as utils from '../../utils';

// Simplified interface for UI selection
interface EntityOption {
  id: string;
  name: string;
  type: 'Account' | 'Candidate';
  category?: string; // e.g. "Bank", "Expense", "Debtor"
}

export const AddTransaction: React.FC = () => {
  const { addTransaction, updateTransaction, transactions, accounts, candidates, user } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TransactionType>(TransactionType.Income);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  const getEntityOptions = (direction: 'from' | 'to'): EntityOption[] => {
    const opts: EntityOption[] = [];

    const addAccounts = (filterFn: (a: any) => boolean) => {
      accounts.filter(filterFn).forEach(a => {
        opts.push({ id: a.id, name: a.name, type: 'Account', category: a.type });
      });
    };

    const addCandidates = () => {
      const sortedCandidates = [...candidates].sort((a, b) => a.name.localeCompare(b.name));
      sortedCandidates.forEach(c => {
        const inactiveLabel = c.isActive ? '' : ' (Inactive)';
        opts.push({ 
          id: c.id, 
          name: `${c.name} (${c.batchId})${inactiveLabel}`, 
          type: 'Candidate', 
          category: 'Candidate' 
        });
      });
    };

    if (direction === 'from') {
      if (type === TransactionType.Income) {
        addCandidates(); // Students paying fees
        addAccounts(a => a.type === AccountType.Debtor || a.type === AccountType.Income);
      } else if (type === TransactionType.Expense || type === TransactionType.Transfer || type === TransactionType.Refund) {
        addAccounts(a => a.type === AccountType.Bank || a.type === AccountType.Cash); // Paying from Wallet
      }
    } else {
      // direction === 'to'
      if (type === TransactionType.Income || type === TransactionType.Transfer) {
        addAccounts(a => a.type === AccountType.Bank || a.type === AccountType.Cash); // Money going into Wallet
      } else if (type === TransactionType.Expense) {
        addAccounts(a => a.type === AccountType.Expense || a.type === AccountType.Creditor);
      } else if (type === TransactionType.Refund) {
        addCandidates();
        addAccounts(a => a.type === AccountType.Debtor); // Returning money to debtor? Rare but possible
      }
    }
    return opts;
  };

  const fromOptions = getEntityOptions('from');
  const toOptions = getEntityOptions('to');

  useEffect(() => {
    if (id) {
      const t = transactions.find(x => x.id === id);
      if (t) {
        setType(t.type);
        setDate(t.date.split('T')[0]);
        setAmount(t.amount.toString());
        setDescription(t.description);
        setFromId(t.fromEntityId);
        setToId(t.toEntityId);
      }
    }
  }, [id, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) { setError('Date is required'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Valid amount is required'); return; }
    if (!fromId) { setError('Source (From) is required'); return; }
    if (!toId) { setError('Destination (To) is required'); return; }
    if (!description || !description.trim()) { setError('Description is required'); return; }

    const fromEnt = fromOptions.find(o => o.id === fromId);
    const toEnt = toOptions.find(o => o.id === toId);

    if (!fromEnt || !toEnt) {
        setError('Invalid Source or Destination for selected transaction type.');
        return;
    }

    // Duplicate / Logic checks could go here, but transactions are often similar.
    // We check if the user is trying to transfer to the same account
    if (fromId === toId && fromEnt.type === toEnt.type) {
       setError('Source and Destination cannot be the same.');
       return;
    }

    const tData: Transaction = {
      id: id || utils.generateId(),
      date: new Date(date).toISOString(),
      type,
      amount: parseFloat(amount),
      description,
      fromEntityId: fromId,
      fromEntityType: fromEnt.type,
      toEntityId: toId,
      toEntityType: toEnt.type,
      isLocked: false
    };

    if (id) {
       if (transactions.find(t => t.id === id)?.isLocked && user?.role !== 'admin') {
         setError('Cannot edit locked transaction');
         return;
       }
       updateTransaction(tData);
    } else {
       addTransaction(tData);
    }
    navigate('/finance/transactions');
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setFromId('');
    setToId('');
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{id ? 'Edit Transaction' : 'Record Transaction'}</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm animate-fade-in">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Transaction Type Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              {Object.values(TransactionType).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === t ? 'bg-spr-accent text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Amount (₹)</label>
              <Input 
                type="number" 
                step="0.01"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 required-label">
                {type === 'Income' ? "Received From (Payer)" : "Paid From (Source)"}
              </label>
              <Select 
                value={fromId}
                onChange={e => setFromId(e.target.value)}
                required
              >
                <option value="">-- Select Source --</option>
                {fromOptions.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.type === 'Candidate' ? '' : `[${o.category}]`}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 required-label">
                {type === 'Expense' ? "Paid To (Expense/Vendor)" : "Deposit To (Dest)"}
              </label>
              <Select 
                value={toId}
                onChange={e => setToId(e.target.value)}
                required
              >
                <option value="">-- Select Destination --</option>
                {toOptions.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.type === 'Candidate' ? '' : `[${o.category}]`}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Description / Reference</label>
            <Input 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder={type === 'Income' ? "e.g., Advance Payment for Java Batch" : "e.g., Office Rent Jan 2025"}
              required
            />
          </div>

          <div className="mt-6 flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate('/finance/transactions')}>Cancel</Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};