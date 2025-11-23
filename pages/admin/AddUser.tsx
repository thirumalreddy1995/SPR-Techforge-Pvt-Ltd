import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Select } from '../../components/Components';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '../../types';
import * as utils from '../../utils';

export const AddUser: React.FC = () => {
  const { users, addUser, updateUser } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: 'staff',
    modules: ['candidates']
  });

  useEffect(() => {
    if (id) {
      const existing = users.find(u => u.id === id);
      if (existing) setForm(existing);
    }
  }, [id, users]);

  const handleNameChange = (val: string) => {
    // Auto generate credentials if creating new user
    if (!id) {
      const generatedUser = val.replace(/\s+/g, '').toLowerCase() + '@sprtechforge.com';
      setForm({
        ...form,
        name: val,
        username: generatedUser,
        password: val // Default password is the Name
      });
    } else {
      setForm({ ...form, name: val });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!form.name || !form.name.trim()) { setError('Full Name is required'); return; }
    if (!form.username || !form.username.trim()) { setError('Login ID is required'); return; }

    // Check for duplicate username
    const isDuplicate = users.some(u => u.username.toLowerCase() === form.username?.toLowerCase().trim() && u.id !== id);
    if (isDuplicate) {
       setError("A user with this Login ID already exists. Please choose another.");
       return;
    }

    const userData: User = {
      id: id || utils.generateId(),
      name: form.name,
      username: form.username.trim() || '',
      password: form.password || form.name || 'password', // Fallback
      role: form.role as 'admin' | 'staff',
      modules: form.role === 'admin' ? ['candidates', 'finance', 'users'] : form.modules || [],
      authProvider: 'local',
      isPasswordChanged: id ? form.isPasswordChanged : false // New users must change password
    };

    if (id) {
      updateUser(userData);
    } else {
      addUser(userData);
    }
    navigate('/admin/users');
  };

  const toggleModule = (mod: string) => {
    if (form.modules?.includes(mod)) {
      setForm({ ...form, modules: form.modules.filter(m => m !== mod) });
    } else {
      setForm({ ...form, modules: [...(form.modules || []), mod] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{id ? 'Edit User' : 'Add New User'}</h1>
      
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
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Full Name</label>
             <Input 
              value={form.name} 
              onChange={e => handleNameChange(e.target.value)} 
              placeholder="e.g. Ravi Kumar"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-spr-700">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 required-label">Auto-Generated Login ID</label>
              <Input 
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                required
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 required-label">Default Password</label>
              <div className="text-gray-900 font-mono mt-2">{id ? '********' : (form.password || '-')}</div>
              {!id && <p className="text-xs text-gray-400 mt-1">Same as Full Name</p>}
            </div>
            {!id && (
               <div className="col-span-2 mt-2 text-xs text-amber-600 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  User will be forced to change this password on first login.
               </div>
            )}
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Role</label>
             <Select 
              value={form.role} 
              onChange={e => setForm({...form, role: e.target.value as any})}
              required
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </Select>
          </div>

          {form.role === 'staff' && (
            <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-2">Access Modules</label>
               <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded border border-spr-700">
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                     <input type="checkbox" checked={form.modules?.includes('candidates')} onChange={() => toggleModule('candidates')} />
                     Training (Candidates)
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                     <input type="checkbox" checked={form.modules?.includes('finance')} onChange={() => toggleModule('finance')} />
                     Finance (Transactions, Accounts, Reports)
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                     <input type="checkbox" checked={form.modules?.includes('users')} onChange={() => toggleModule('users')} />
                     User Management
                  </label>
               </div>
            </div>
          )}

          <div className="mt-6 flex gap-4 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>Cancel</Button>
            <Button type="submit">Save User</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};