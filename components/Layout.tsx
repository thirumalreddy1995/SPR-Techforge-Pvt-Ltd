
import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo, Button } from './Components';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; badge?: number }> = ({ to, icon, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 font-medium relative ${isActive ? 'bg-spr-accent text-white shadow-md shadow-sky-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="absolute right-2 top-3 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
          {badge}
        </span>
      ) : null}
    </Link>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isCloudEnabled, passwordResetRequests } = useApp();
  const navigate = useNavigate();

  if (!user) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const hasModule = (mod: string) => user.role === 'admin' || user.modules.includes(mod);
  const isAdmin = user.role === 'admin';

  const resetRequestCount = passwordResetRequests ? passwordResetRequests.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed h-full left-0 top-0 z-10 shadow-sm print:hidden">
        <div className="p-6 border-b border-gray-100">
          <Logo />
        </div>
        <nav className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="mb-6">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Main</p>
            <NavItem to="/dashboard" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
          </div>
          
          {hasModule('candidates') && (
            <div className="mb-6">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Training</p>
              <NavItem to="/candidates" label="Candidates" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
            </div>
          )}

          {hasModule('finance') && (
            <div className="mb-6">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Finance</p>
              <NavItem to="/finance/transactions" label="Transactions" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
              <NavItem to="/finance/accounts" label="Ledger Accounts" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
              <NavItem to="/finance/financial-statements" label="Financial Statements" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
              <NavItem to="/finance/reports" label="Data & Backup" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>} />
            </div>
          )}

          {hasModule('users') && (
            <div className="mb-6">
              <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin</p>
              <NavItem 
                to="/admin/users" 
                label="User Management" 
                badge={user.role === 'admin' ? resetRequestCount : 0}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} 
              />
              {isAdmin && (
                 <NavItem to="/admin/logs" label="System Logs" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
              )}
              <NavItem to="/admin/test-runner" label="System Diagnostics" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
              <NavItem to="/admin/cloud" label="Cloud Setup" icon={<svg className={`w-5 h-5 ${isCloudEnabled ? 'text-emerald-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
            </div>
          )}

          <div className="mt-auto">
             <div className="px-4 py-4 bg-gray-50 rounded-lg mb-4 border border-gray-100">
               <p className="text-sm text-gray-900 font-bold truncate" title={user.name || user.username}>{user.name || user.username}</p>
               <p className="text-xs text-gray-500 capitalize">{user.role}</p>
             </div>
             <Button variant="danger" onClick={handleLogout} className="w-full text-sm">
               Sign Out
             </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen print:ml-0 print:p-0">
        <div className="max-w-7xl mx-auto print:max-w-none">
           {children}
        </div>
      </main>
    </div>
  );
};
