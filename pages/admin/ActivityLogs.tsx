
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, Pagination } from '../../components/Components';
import * as utils from '../../utils';

export const ActivityLogs: React.FC = () => {
  const { activityLogs, exportData } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');

  const ITEMS_PER_PAGE = 15;

  const uniqueEntityTypes = Array.from(new Set(activityLogs.map(l => l.entityType)));

  const filtered = activityLogs.filter(log => {
    const matchesText = 
      log.description.toLowerCase().includes(filterText.toLowerCase()) ||
      log.actorName.toLowerCase().includes(filterText.toLowerCase());
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'All' || log.entityType === entityFilter;
    
    return matchesText && matchesAction && matchesEntity;
  });

  // Logs are already sorted desc by timestamp in context
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedLogs = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'text-emerald-600 bg-emerald-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'LOGIN': return 'text-gray-600 bg-gray-100';
      case 'RESTORE': return 'text-amber-600 bg-amber-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">System Audit Logs</h1>
            <p className="text-gray-500">Track all changes made within the application.</p>
        </div>
        <Button variant="secondary" onClick={exportData}>Export Full Logs</Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input 
            placeholder="Search description or user..." 
            className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:ring-1 focus:ring-spr-accent outline-none"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
          <select 
            className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:ring-1 focus:ring-spr-accent outline-none"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="All">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="RESTORE">Restore</option>
          </select>
          <select 
            className="bg-white border border-spr-700 rounded-lg px-4 py-2 text-gray-900 focus:ring-1 focus:ring-spr-accent outline-none"
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
          >
            <option value="All">All Entities</option>
            {uniqueEntityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-600">
            <thead>
              <tr className="border-b border-spr-700 text-xs uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User (Actor)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spr-700">
              {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {log.actorName}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                       {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                     {log.entityType}
                     {log.entityId && <span className="block text-xs text-gray-400 font-mono">{log.entityId}</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {log.description}
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={5} className="py-8 text-center text-gray-500">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>
    </div>
  );
};
