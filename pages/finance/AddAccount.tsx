import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Select } from '../../components/Components';
import { useNavigate, useParams } from 'react-router-dom';
import { Account, AccountType } from '../../types';
import * as utils from '../../utils';

export const AddAccount: React.FC = () => {
  const { addAccount, updateAccount, accounts } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<Partial<Account>>({
    name: '',
    type: AccountType.Expense,
    subType: '',
    openingBalance: 0,
    description: ''
  });

  useEffect(() => {
    if (id) {
      const existing = accounts.find(a => a.id === id);
      if (existing) setForm(existing);
    }
  }, [id, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert('Account Name is required');

    const accData: Account = {
      ...form as Account,
      id: id || utils.generateId(),
    };

    if (id) {
      updateAccount(accData);
    } else {
      addAccount(accData);
    }
    navigate('/finance/accounts');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{id ? 'Edit Account' : 'Add New Account'}</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Account Name" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="e.g. Axis Bank, Rent, Cleaning"
              required
            />
            <Select 
              label="Account Type"
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value as AccountType})}
            >
              {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            
            {form.type === AccountType.Expense && (
               <Input 
                label="Expense Sub-Category (Optional)" 
                value={form.subType} 
                onChange={e => setForm({...form, subType: e.target.value})} 
                placeholder="e.g. Utilities, Maintenance"
              />
            )}

            <Input 
              label="Opening Balance (₹)" 
              type="number"
              value={form.openingBalance} 
              onChange={e => setForm({...form, openingBalance: parseFloat(e.target.value) || 0})} 
            />
          </div>
          
          <div className="mt-4">
             <Input 
              label="Description" 
              value={form.description || ''} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>

          <div className="mt-6 flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate('/finance/accounts')}>Cancel</Button>
            <Button type="submit">Save Account</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};