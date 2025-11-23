
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button } from '../../components/Components';
import { useParams, useNavigate } from 'react-router-dom';
import * as utils from '../../utils';

export const AccountStatement: React.FC = () => {
  const { transactions, getEntityName, accounts, candidates } = useApp();
  const { type, id } = useParams<{ type: string, id: string }>(); // type = 'Account' | 'Candidate'
  const navigate = useNavigate();

  if (!type || !id) return <div>Invalid Parameters</div>;

  // Find Entity Info
  const entityName = type === 'Candidate' 
    ? candidates.find(c => c.id === id)?.name 
    : accounts.find(a => a.id === id)?.name;

  if (!entityName) return <div className="text-gray-900 p-4">Entity not found.</div>;

  const history = transactions
    .filter(t => 
      (t.fromEntityId === id && t.fromEntityType === type) || 
      (t.toEntityId === id && t.toEntityType === type)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ascHistory = [...history].reverse();
  let runningBal = 0;
  
  if (type === 'Account') {
     const acc = accounts.find(a => a.id === id);
     if (acc) runningBal = acc.openingBalance;
  }

  const rowsWithBalance = ascHistory.map(t => {
     let impact = 0;
     
     if (t.toEntityId === id && t.toEntityType === type) {
       impact = t.amount; // Inflow
     } else {
       impact = -t.amount; // Outflow
     }
     runningBal += impact;
     return { ...t, impact, runningBalance: runningBal };
  }).reverse(); // Show newest first

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <Button variant="secondary" onClick={() => navigate(-1)} className="mb-2 text-xs">Back</Button>
           <h1 className="text-2xl font-bold text-gray-900">Statement: {entityName}</h1>
           <p className="text-gray-500 text-sm font-medium">{type}</p>
        </div>
        <Button onClick={() => utils.downloadCSV(rowsWithBalance, `${entityName}_Statement.csv`)}>
           Download CSV
        </Button>
      </div>

      <Card>
        <table className="w-full text-left text-gray-600">
          <thead>
            <tr className="border-b border-spr-700 text-xs uppercase text-gray-500 bg-gray-50">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Credit (+)</th>
              <th className="py-3 px-4 text-right">Debit (-)</th>
              <th className="py-3 px-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spr-700">
            {rowsWithBalance.length > 0 ? rowsWithBalance.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium">{new Date(t.date).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="text-gray-900">{t.description}</div>
                  <div className="text-xs text-gray-500">
                     {t.impact > 0 ? `From: ${getEntityName(t.fromEntityId, t.fromEntityType)}` : `To: ${getEntityName(t.toEntityId, t.toEntityType)}`}
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                  {t.impact > 0 ? utils.formatCurrency(t.amount) : '-'}
                </td>
                <td className="py-3 px-4 text-right text-red-600 font-medium">
                  {t.impact < 0 ? utils.formatCurrency(t.amount) : '-'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                  {utils.formatCurrency(t.runningBalance)}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No transactions recorded for this entity.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
