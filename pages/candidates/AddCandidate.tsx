import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Select } from '../../components/Components';
import { useNavigate, useParams } from 'react-router-dom';
import { Candidate, CandidateStatus } from '../../types';
import * as utils from '../../utils';

export const AddCandidate: React.FC = () => {
  const { addCandidate, updateCandidate, candidates, candidateStatuses, addCandidateStatus } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  
  const defaultAgreement = `CANDIDATURE AGREEMENT

1. I, [CANDIDATE NAME], agree to join SPR Techforge for the training program.
2. I agree to pay the total sum of [AMOUNT] as discussed.
3. I understand that the advance payment is non-refundable unless specified otherwise.
4. I will maintain professional conduct during the training period.
5. Upon placement, I agree to fulfill the financial obligations as per the agreement.

Date: _________________
Signature: _________________`;

  const [form, setForm] = useState<Partial<Candidate>>({
    name: '',
    batchId: '',
    email: '',
    phone: '',
    alternatePhone: '',
    referredBy: '',
    address: '',
    agreedAmount: 0,
    status: CandidateStatus.Training,
    placedCompany: '',
    packageDetails: '',
    isActive: true,
    notes: '',
    agreementText: defaultAgreement
  });

  useEffect(() => {
    if (id) {
      const existing = candidates.find(c => c.id === id);
      if (existing) {
        setForm({
          ...existing,
          agreementText: existing.agreementText || defaultAgreement.replace('[CANDIDATE NAME]', existing.name).replace('[AMOUNT]', existing.agreedAmount.toString())
        });
      }
    }
  }, [id, candidates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mandatory Field Check
    if (!form.name || !form.name.trim()) { setError('Full Name is required'); return; }
    if (!form.batchId || !form.batchId.trim()) { setError('Batch ID is required'); return; }
    if (!form.email || !form.email.trim()) { setError('Email Address is required'); return; }
    if (!form.phone || !form.phone.trim()) { setError('Phone Number is required'); return; }
    if (form.agreedAmount === undefined || form.agreedAmount < 0) { setError('Agreed Amount is required'); return; }

    // Duplicate Candidate Check
    const isDuplicate = candidates.some(c => 
      c.id !== (id || '') && // Ignore self if editing
      (
        (c.email && c.email.trim().toLowerCase() === form.email?.trim().toLowerCase()) ||
        (c.phone && c.phone.trim() === form.phone?.trim())
      )
    );

    if (isDuplicate) {
      setError('A candidate with this Email or Phone Number already exists.');
      return;
    }

    const candidateData: Candidate = {
      ...form as Candidate,
      id: id || utils.generateId(),
      joinedDate: form.joinedDate || new Date().toISOString(),
    };

    if (id) {
      updateCandidate(candidateData);
    } else {
      addCandidate(candidateData);
    }
    navigate('/candidates');
  };

  const handleAddStatus = () => {
    const newStatus = window.prompt("Enter new status name:");
    if (newStatus && newStatus.trim()) {
      addCandidateStatus(newStatus.trim());
      setForm({ ...form, status: newStatus.trim() });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{id ? 'Edit Candidate' : 'Add New Candidate'}</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm animate-fade-in">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Personal & Contact Details">
            <div className="flex justify-end mb-4">
                <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-spr-700 hover:bg-gray-100">
                   <span className="text-sm text-gray-700 font-medium">Active Status</span>
                   <div className="relative">
                     <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={form.isActive}
                       onChange={e => setForm({...form, isActive: e.target.checked})}
                     />
                     <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spr-accent"></div>
                   </div>
                </label>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Full Name</label>
                   <Input 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Batch ID</label>
                   <Input 
                    value={form.batchId} 
                    onChange={e => setForm({...form, batchId: e.target.value})} 
                    required
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Phone Number</label>
                    <Input 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})} 
                      required
                    />
                  </div>
                  <Input 
                    label="Alternate Phone" 
                    value={form.alternatePhone || ''} 
                    onChange={e => setForm({...form, alternatePhone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Email Address</label>
                  <Input 
                    type="email"
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    required
                  />
                </div>
                <Input 
                  label="Referred By" 
                  value={form.referredBy || ''} 
                  onChange={e => setForm({...form, referredBy: e.target.value})} 
                  placeholder="Name of referrer (Optional)"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                  <textarea 
                     className="w-full bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:border-spr-accent focus:ring-1 focus:ring-spr-accent outline-none"
                     rows={3}
                     value={form.address}
                     onChange={e => setForm({...form, address: e.target.value})}
                     placeholder="Enter full address"
                  ></textarea>
                </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Training & Placement Info">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 required-label">Agreed Total Amount (₹)</label>
                  <Input 
                    type="number"
                    value={form.agreedAmount} 
                    onChange={e => setForm({...form, agreedAmount: parseFloat(e.target.value) || 0})} 
                    required
                  />
                </div>
                
                <div className="mb-4">
                   <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700 required-label">Current Status</label>
                      <button type="button" onClick={handleAddStatus} className="text-xs text-spr-accent hover:underline font-medium">+ Add Status</button>
                   </div>
                   <select 
                     className="w-full bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:border-spr-accent focus:ring-1 focus:ring-spr-accent outline-none transition-colors"
                     value={form.status}
                     onChange={e => setForm({...form, status: e.target.value})}
                     required
                   >
                     {candidateStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>

                {form.status === CandidateStatus.Placed && (
                   <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4 space-y-3 animate-fade-in">
                     <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Placement Details</h4>
                     <Input 
                       label="Company Name" 
                       value={form.placedCompany || ''} 
                       onChange={e => setForm({...form, placedCompany: e.target.value})} 
                       placeholder="e.g. Google, Microsoft"
                     />
                     <Input 
                       label="Package / Salary Details" 
                       value={form.packageDetails || ''} 
                       onChange={e => setForm({...form, packageDetails: e.target.value})} 
                       placeholder="e.g. 12 LPA"
                     />
                   </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea 
                     className="w-full bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:border-spr-accent focus:ring-1 focus:ring-spr-accent outline-none"
                     rows={2}
                     value={form.notes}
                     onChange={e => setForm({...form, notes: e.target.value})}
                  ></textarea>
                </div>
            </Card>

            <Card title="Candidature Agreement">
               <div className="mb-2 text-xs text-gray-500">
                 Edit the terms below for this candidate. This text will be used when generating the agreement.
               </div>
               <textarea 
                 className="w-full bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-800 font-mono text-sm focus:border-spr-accent focus:ring-1 focus:ring-spr-accent outline-none"
                 rows={8}
                 value={form.agreementText}
                 onChange={e => setForm({...form, agreementText: e.target.value})}
               ></textarea>
            </Card>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4 justify-end pb-10">
            <Button type="button" variant="secondary" onClick={() => navigate('/candidates')}>Cancel</Button>
            <Button type="submit">{id ? 'Update Candidate' : 'Save Candidate'}</Button>
        </div>
      </form>
    </div>
  );
};