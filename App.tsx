
import React from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom'; // Using HashRouter for compatibility
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CandidateList } from './pages/candidates/CandidateList';
import { AddCandidate } from './pages/candidates/AddCandidate';
import { CandidateAgreement } from './pages/candidates/CandidateAgreement';
import { TransactionList } from './pages/finance/TransactionList';
import { AddTransaction } from './pages/finance/AddTransaction';
import { AccountList } from './pages/finance/AccountList';
import { AddAccount } from './pages/finance/AddAccount';
import { AccountStatement } from './pages/finance/AccountStatement';
import { FinancialStatements } from './pages/finance/FinancialStatements';
import { Reports } from './pages/Reports';
import { UserList } from './pages/admin/UserList';
import { AddUser } from './pages/admin/AddUser';
import { ActivityLogs } from './pages/admin/ActivityLogs';
import { TestRunner } from './pages/admin/TestRunner';
import { CloudSetup } from './pages/admin/CloudSetup';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  // For simplicity, check if user has 'users' module or is admin
  const hasAccess = user.role === 'admin' || user.modules.includes('users');
  if (!hasAccess) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      
      <Route path="/candidates" element={<ProtectedRoute><Layout><CandidateList /></Layout></ProtectedRoute>} />
      <Route path="/candidates/new" element={<ProtectedRoute><Layout><AddCandidate /></Layout></ProtectedRoute>} />
      <Route path="/candidates/edit/:id" element={<ProtectedRoute><Layout><AddCandidate /></Layout></ProtectedRoute>} />
      <Route path="/candidates/agreement/:id" element={<ProtectedRoute><CandidateAgreement /></ProtectedRoute>} />
      
      <Route path="/finance/transactions" element={<ProtectedRoute><Layout><TransactionList /></Layout></ProtectedRoute>} />
      <Route path="/finance/transactions/new" element={<ProtectedRoute><Layout><AddTransaction /></Layout></ProtectedRoute>} />
      <Route path="/finance/transactions/edit/:id" element={<ProtectedRoute><Layout><AddTransaction /></Layout></ProtectedRoute>} />
      
      <Route path="/finance/accounts" element={<ProtectedRoute><Layout><AccountList /></Layout></ProtectedRoute>} />
      <Route path="/finance/accounts/new" element={<ProtectedRoute><Layout><AddAccount /></Layout></ProtectedRoute>} />
      <Route path="/finance/accounts/edit/:id" element={<ProtectedRoute><Layout><AddAccount /></Layout></ProtectedRoute>} />
      <Route path="/finance/statement/:type/:id" element={<ProtectedRoute><Layout><AccountStatement /></Layout></ProtectedRoute>} />
      <Route path="/finance/financial-statements" element={<ProtectedRoute><Layout><FinancialStatements /></Layout></ProtectedRoute>} />
      
      <Route path="/finance/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />

      <Route path="/admin/users" element={<AdminRoute><Layout><UserList /></Layout></AdminRoute>} />
      <Route path="/admin/users/new" element={<AdminRoute><Layout><AddUser /></Layout></AdminRoute>} />
      <Route path="/admin/users/edit/:id" element={<AdminRoute><Layout><AddUser /></Layout></AdminRoute>} />
      <Route path="/admin/logs" element={<AdminRoute><Layout><ActivityLogs /></Layout></AdminRoute>} />
      <Route path="/admin/test-runner" element={<AdminRoute><Layout><TestRunner /></Layout></AdminRoute>} />
      <Route path="/admin/cloud" element={<AdminRoute><Layout><CloudSetup /></Layout></AdminRoute>} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
