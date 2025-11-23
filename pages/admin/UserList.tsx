
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, Button, ConfirmationModal } from '../../components/Components';
import { Link, useNavigate } from 'react-router-dom';

export const UserList: React.FC = () => {
  const { users, deleteUser, user: currentUser, passwordResetRequests, resolvePasswordResetRequest } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDeleteClick = (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteUser(deleteId);
      setDeleteId(null);
    }
  };

  const handleResolveRequest = (reqId: string, userId: string) => {
     // Resolve request
     resolvePasswordResetRequest(reqId);
     // Navigate to edit user
     if (userId) {
       navigate(`/admin/users/edit/${userId}`);
     } else {
       alert("User not found. The request was dismissed.");
     }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <Link to="/admin/users/new">
          <Button>+ Add User</Button>
        </Link>
      </div>

      {/* Password Reset Requests Section */}
      {isAdmin && passwordResetRequests && passwordResetRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 animate-fade-in">
           <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             Pending Password Reset Requests ({passwordResetRequests.length})
           </h3>
           <div className="grid grid-cols-1 gap-4">
             {passwordResetRequests.map(req => {
               const requestingUser = users.find(u => u.username === req.username);
               return (
                 <div key={req.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                    <div>
                       <p className="font-bold text-gray-900">{req.username}</p>
                       <p className="text-xs text-gray-500">Requested: {new Date(req.requestDate).toLocaleString()}</p>
                       {!requestingUser && <span className="text-xs text-red-500 font-bold">User not found in system</span>}
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="secondary" 
                         onClick={() => resolvePasswordResetRequest(req.id)}
                         className="text-xs px-3 py-1"
                       >
                         Dismiss
                       </Button>
                       <Button 
                         onClick={() => handleResolveRequest(req.id, requestingUser?.id || '')}
                         className="text-xs px-3 py-1"
                         disabled={!requestingUser}
                       >
                         Reset Password
                       </Button>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-600">
            <thead>
              <tr className="border-b border-spr-700 text-xs uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Login ID</th>
                {isAdmin && <th className="py-3 px-4">Password</th>}
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Access Modules</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spr-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {u.name || u.username}
                    {u.id === currentUser?.id && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1 rounded border border-indigo-200">You</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                    {u.username}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-sm font-mono text-amber-600">
                      {u.password}
                      {u.isPasswordChanged === false && <span className="ml-2 text-[10px] text-red-500 font-bold uppercase">(Default)</span>}
                    </td>
                  )}
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4">
                     <div className="flex gap-1 flex-wrap">
                       {u.role === 'admin' ? (
                         <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200 font-medium">All Access</span>
                       ) : u.modules.length > 0 ? (
                         u.modules.map(m => (
                           <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 capitalize">{m}</span>
                         ))
                       ) : <span className="text-xs text-gray-400">No Access</span>}
                     </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                     <div className="flex justify-center gap-2">
                       <Link to={`/admin/users/edit/${u.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</Link>
                       {u.id !== currentUser?.id && (
                          <button onClick={() => handleDeleteClick(u.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Del</button>
                       )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
};