
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Candidate, Account, Transaction, AccountType, CandidateStatus, PasswordResetRequest, ActivityLog } from '../types';
import * as utils from '../utils';
import { cloudService } from '../services/cloud';

interface AppContextType {
  user: User | null;
  login: (username?: string, pass?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  
  // User Management
  users: User[];
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;

  // Password Resets
  passwordResetRequests: PasswordResetRequest[];
  addPasswordResetRequest: (username: string) => void;
  resolvePasswordResetRequest: (id: string) => void;

  candidates: Candidate[];
  addCandidate: (c: Candidate) => void;
  updateCandidate: (c: Candidate) => void;
  deleteCandidate: (id: string) => void;

  candidateStatuses: string[];
  addCandidateStatus: (status: string) => void;

  accounts: Account[];
  addAccount: (a: Account) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;

  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  lockTransaction: (id: string) => void;

  // Activity Logs
  activityLogs: ActivityLog[];

  // Helpers
  getEntityName: (id: string, type: 'Account' | 'Candidate') => string;
  getEntityBalance: (id: string, type: 'Account' | 'Candidate') => number;
  
  // Data
  exportData: () => void;
  importDatabase: (json: any) => Promise<void>;
  
  // Cloud
  isCloudEnabled: boolean;
  syncLocalToCloud: () => Promise<void>;
  cloudError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'SPR_TECHFORGE_DB_V3';

// Default Accounts
const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash-01', name: 'Office Cash', type: AccountType.Cash, openingBalance: 0, isSystem: true },
  { id: 'bank-01', name: 'HDFC Bank', type: AccountType.Bank, openingBalance: 0 },
];

// Default Statuses
const DEFAULT_STATUSES: string[] = [
  CandidateStatus.Training,
  CandidateStatus.ReadyForInterview,
  CandidateStatus.Placed,
  CandidateStatus.Discontinued
];

// Default Admin User
const DEFAULT_ADMIN: User = {
  id: 'admin-01',
  name: 'Thirumal Reddy',
  username: 'thirumalreddy@sprtechforge.com',
  password: 'Shooter@2026', 
  role: 'admin',
  modules: ['candidates', 'finance', 'users'],
  authProvider: 'local',
  isPasswordChanged: true // Default admin does not need to change password
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [candidateStatuses, setCandidateStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [cloudError, setCloudError] = useState<string | null>(null);
  
  const isCloudEnabled = cloudService.isConfigured();

  // Initial Load & Subscriptions
  useEffect(() => {
    if (isCloudEnabled) {
      console.log("App running in Cloud Mode");
      setCloudError(null);

      const handleSubError = (err: any) => {
         if (err && err.code === 'permission-denied') {
            setCloudError('Permission Denied: Your Firestore Rules are blocking access. Go to Cloud Setup > Rules Help for the fix.');
         } else {
            setCloudError(`Cloud Error: ${err.message}`);
         }
      };
      
      // 1. Subscribe to Data
      const unsubUsers = cloudService.subscribe('users', (data) => {
         // Ensure we have at least one admin if list is empty
         if (data.length === 0) {
            setUsers([DEFAULT_ADMIN]);
         } else {
            setUsers(data); 
         }
      }, handleSubError);
      const unsubCandidates = cloudService.subscribe('candidates', (data) => setCandidates(data), handleSubError);
      const unsubAccounts = cloudService.subscribe('accounts', (data) => setAccounts(data), handleSubError);
      const unsubTransactions = cloudService.subscribe('transactions', (data) => setTransactions(data), handleSubError);
      const unsubStatuses = cloudService.subscribe('settings', (data) => {
         const statusDoc = data.find(d => d.id === 'candidateStatuses');
         if (statusDoc && statusDoc.values) setCandidateStatuses(statusDoc.values);
      }, handleSubError);
      const unsubRequests = cloudService.subscribe('passwordResetRequests', (data) => setPasswordResetRequests(data), handleSubError);
      const unsubLogs = cloudService.subscribe('activityLogs', (data) => {
          // Sort logs by timestamp desc
          const sorted = data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivityLogs(sorted);
      }, handleSubError);

      return () => {
        unsubUsers();
        unsubCandidates();
        unsubAccounts();
        unsubTransactions();
        unsubStatuses();
        unsubRequests();
        unsubLogs();
      };
    } else {
      // Local Storage Mode
      console.log("App running in Local Mode");
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.users && data.users.length > 0) setUsers(data.users);
        else setUsers([DEFAULT_ADMIN]); // Fallback if LS exists but empty users
        
        if (data.candidates) {
           const sanitizedCandidates = data.candidates.map((c: any) => ({
             ...c,
             isActive: c.isActive !== undefined ? c.isActive : true
           }));
           setCandidates(sanitizedCandidates);
        }
        if (data.accounts && data.accounts.length > 0) setAccounts(data.accounts);
        if (data.transactions) setTransactions(data.transactions);
        if (data.candidateStatuses && data.candidateStatuses.length > 0) {
          setCandidateStatuses(data.candidateStatuses);
        }
        if (data.passwordResetRequests) setPasswordResetRequests(data.passwordResetRequests);
        if (data.activityLogs) setActivityLogs(data.activityLogs);
      }
    }
  }, [isCloudEnabled]);

  // Local Storage Persistence (Only if NOT in cloud mode)
  useEffect(() => {
    if (!isCloudEnabled) {
      const data = { users, candidates, accounts, transactions, candidateStatuses, passwordResetRequests, activityLogs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [users, candidates, accounts, transactions, candidateStatuses, passwordResetRequests, activityLogs, isCloudEnabled]);

  // --- Universal Save Helper ---
  const saveData = (collection: string, item: any) => {
    if (isCloudEnabled) {
      cloudService.saveItem(collection, item).catch(e => {
         setCloudError("Failed to save: " + e.message);
      });
    }
  };

  const removeData = (collection: string, id: string) => {
    if (isCloudEnabled) {
      cloudService.deleteItem(collection, id).catch(e => {
         setCloudError("Failed to delete: " + e.message);
      });
    }
  };

  // --- Logging Helper ---
  const logActivity = (
    action: ActivityLog['action'], 
    entityType: string, 
    description: string,
    entityId?: string
  ) => {
    // Don't log if it's a system restore action unless explicitly handled
    const newLog: ActivityLog = {
      id: utils.generateId(),
      timestamp: new Date().toISOString(),
      actorId: user?.id || 'system',
      actorName: user?.name || 'System',
      action,
      entityType,
      entityId,
      description
    };
    
    setActivityLogs(prev => [newLog, ...prev]);
    saveData('activityLogs', newLog);
  };

  // Login Logic (Applies to both Local and Cloud modes using the Synced User List)
  const login = async (username?: string, pass?: string): Promise<{ success: boolean; message?: string }> => {
    if (!username || !pass) return { success: false, message: 'Credentials missing' };
    
    // Find user in the synchronized state (whether from LS or Cloud)
    // Match case-insensitive for username
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!found) {
       return { success: false, message: 'User not found' };
    }

    // Check password (exact match)
    if (found.password !== pass) {
       return { success: false, message: 'Incorrect password' };
    }

    setUser(found);
    
    // We cannot rely on 'user' state here as it sets async, so we construct the log manually with found user
    const newLog: ActivityLog = {
      id: utils.generateId(),
      timestamp: new Date().toISOString(),
      actorId: found.id,
      actorName: found.name,
      action: 'LOGIN',
      entityType: 'User',
      description: 'User logged in'
    };
    setActivityLogs(prev => [newLog, ...prev]);
    saveData('activityLogs', newLog);

    return { success: true };
  };
  
  const logout = () => {
    if (user) {
      logActivity('LOGIN', 'User', 'User logged out');
    }
    setUser(null);
  };

  const addUser = (u: User) => {
    setUsers(prev => [...prev, u]);
    saveData('users', u);
    logActivity('CREATE', 'User', `Created user ${u.username}`, u.id);
  };
  const updateUser = (u: User) => {
    const updated = { ...u };
    setUsers(prev => prev.map(usr => usr.id === u.id ? updated : usr));
    
    // If we are updating the currently logged in user (e.g. password change), update session
    if (user && user.id === u.id) {
      setUser(updated);
    }

    saveData('users', updated);
    logActivity('UPDATE', 'User', `Updated user ${u.username}`, u.id);
  };
  const deleteUser = (id: string) => {
    const u = users.find(x => x.id === id);
    if (users.length <= 1) throw new Error("Cannot delete the last user.");
    setUsers(prev => prev.filter(u => u.id !== id));
    removeData('users', id);
    logActivity('DELETE', 'User', `Deleted user ${u?.username || id}`, id);
  };

  const addPasswordResetRequest = (username: string) => {
    const req: PasswordResetRequest = {
      id: utils.generateId(),
      username,
      requestDate: new Date().toISOString(),
      status: 'pending'
    };
    setPasswordResetRequests(prev => [...prev, req]);
    saveData('passwordResetRequests', req);
    // Anonymous log
    const newLog: ActivityLog = {
        id: utils.generateId(),
        timestamp: new Date().toISOString(),
        actorId: 'system',
        actorName: 'System',
        action: 'OTHER',
        entityType: 'User',
        description: `Password reset requested for ${username}`
      };
      setActivityLogs(prev => [newLog, ...prev]);
      saveData('activityLogs', newLog);
  };

  const resolvePasswordResetRequest = (id: string) => {
    setPasswordResetRequests(prev => prev.filter(r => r.id !== id));
    removeData('passwordResetRequests', id);
    logActivity('UPDATE', 'User', `Resolved password reset request`, id);
  };

  const addCandidate = (c: Candidate) => {
    setCandidates(prev => [...prev, c]);
    saveData('candidates', c);
    logActivity('CREATE', 'Candidate', `Created candidate ${c.name} (${c.batchId})`, c.id);
  };
  const updateCandidate = (c: Candidate) => {
    setCandidates(prev => prev.map(cand => cand.id === c.id ? c : cand));
    saveData('candidates', c);
    logActivity('UPDATE', 'Candidate', `Updated candidate ${c.name}`, c.id);
  };
  const deleteCandidate = (id: string) => {
    const c = candidates.find(x => x.id === id);
    setCandidates(prev => prev.filter(c => c.id !== id));
    removeData('candidates', id);
    logActivity('DELETE', 'Candidate', `Deleted candidate ${c?.name || id}`, id);
  };

  const addCandidateStatus = (status: string) => {
    const trimmed = status.trim();
    if (trimmed && !candidateStatuses.includes(trimmed)) {
      const newStatuses = [...candidateStatuses, trimmed];
      setCandidateStatuses(newStatuses);
      if (isCloudEnabled) {
        cloudService.saveItem('settings', { id: 'candidateStatuses', values: newStatuses });
      }
      logActivity('UPDATE', 'Settings', `Added candidate status: ${trimmed}`);
    }
  };

  const addAccount = (a: Account) => {
    setAccounts(prev => [...prev, a]);
    saveData('accounts', a);
    logActivity('CREATE', 'Account', `Created account ${a.name}`, a.id);
  };
  const updateAccount = (a: Account) => {
    setAccounts(prev => prev.map(acc => acc.id === a.id ? a : acc));
    saveData('accounts', a);
    logActivity('UPDATE', 'Account', `Updated account ${a.name}`, a.id);
  };
  const deleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (acc?.isSystem) throw new Error("Cannot delete a System Account.");
    setAccounts(prev => prev.filter(a => a.id !== id));
    removeData('accounts', id);
    logActivity('DELETE', 'Account', `Deleted account ${acc?.name || id}`, id);
  };

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    saveData('transactions', t);
    logActivity('CREATE', 'Transaction', `Recorded ${t.type} of ${t.amount}`, t.id);
  };
  const updateTransaction = (t: Transaction) => {
    setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
    saveData('transactions', t);
    logActivity('UPDATE', 'Transaction', `Updated transaction ${t.id}`, t.id);
  };
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    removeData('transactions', id);
    logActivity('DELETE', 'Transaction', `Deleted transaction ${id}`, id);
  };
  const lockTransaction = (id: string) => {
    const t = transactions.find(tr => tr.id === id);
    if (t) {
       const updated = { ...t, isLocked: true };
       setTransactions(prev => prev.map(tr => tr.id === id ? updated : tr));
       saveData('transactions', updated);
       logActivity('UPDATE', 'Transaction', `Locked transaction ${id}`, id);
    }
  };

  const getEntityName = (id: string, type: 'Account' | 'Candidate') => {
    if (type === 'Candidate') {
      const c = candidates.find(x => x.id === id);
      return c ? `${c.name} (${c.batchId})` : 'Unknown Candidate';
    } else {
      const a = accounts.find(x => x.id === id);
      return a ? a.name : 'Unknown Account';
    }
  };

  const getEntityBalance = (id: string, type: 'Account' | 'Candidate') => {
    let openingBalance = 0;
    if (type === 'Account') {
      const acc = accounts.find(a => a.id === id);
      if (acc) openingBalance = acc.openingBalance || 0;
    }
    return utils.calculateEntityBalance(id, type, transactions, openingBalance);
  };

  const exportData = () => {
    const data = { users, candidates, accounts, transactions, candidateStatuses, passwordResetRequests, activityLogs, exportDate: new Date().toISOString() };
    utils.downloadJSON(data, `SPR_Backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  const importDatabase = async (json: any) => {
    if (!json) return;
    try {
        // Update Local State
        if (json.users) setUsers(json.users);
        if (json.candidates) setCandidates(json.candidates);
        if (json.accounts) setAccounts(json.accounts);
        if (json.transactions) setTransactions(json.transactions);
        if (json.candidateStatuses) setCandidateStatuses(json.candidateStatuses);
        if (json.passwordResetRequests) setPasswordResetRequests(json.passwordResetRequests);
        if (json.activityLogs) setActivityLogs(json.activityLogs);
        
        // Log the Restore
        logActivity('RESTORE', 'System', 'Database restored from backup file');

        // If Cloud Enabled, upload everything
        if (isCloudEnabled) {
            await cloudService.uploadBatch('users', json.users || []);
            await cloudService.uploadBatch('candidates', json.candidates || []);
            await cloudService.uploadBatch('accounts', json.accounts || []);
            await cloudService.uploadBatch('transactions', json.transactions || []);
            await cloudService.uploadBatch('passwordResetRequests', json.passwordResetRequests || []);
            await cloudService.uploadBatch('activityLogs', json.activityLogs || []);
            if (json.candidateStatuses) {
              await cloudService.saveItem('settings', { id: 'candidateStatuses', values: json.candidateStatuses });
            }
            alert("Data imported and synced to cloud.");
        } else {
            alert("Data imported successfully.");
        }
    } catch (e: any) {
        console.error(e);
        alert("Failed to import data: " + e.message);
    }
  };

  const syncLocalToCloud = async () => {
    if (!isCloudEnabled) return;
    try {
      await cloudService.uploadBatch('users', users);
      await cloudService.uploadBatch('candidates', candidates);
      await cloudService.uploadBatch('accounts', accounts);
      await cloudService.uploadBatch('transactions', transactions);
      await cloudService.uploadBatch('passwordResetRequests', passwordResetRequests);
      await cloudService.uploadBatch('activityLogs', activityLogs);
      await cloudService.saveItem('settings', { id: 'candidateStatuses', values: candidateStatuses });
      alert("Local data successfully uploaded to Cloud Database.");
    } catch (e) {
      alert("Failed to sync data. Check console.");
      console.error(e);
    }
  };

  return (
    <AppContext.Provider value={{
      user, login, logout,
      users, addUser, updateUser, deleteUser,
      passwordResetRequests, addPasswordResetRequest, resolvePasswordResetRequest,
      candidates, addCandidate, updateCandidate, deleteCandidate,
      candidateStatuses, addCandidateStatus,
      accounts, addAccount, updateAccount, deleteAccount,
      transactions, addTransaction, updateTransaction, deleteTransaction, lockTransaction,
      activityLogs,
      getEntityName, getEntityBalance, exportData, importDatabase,
      isCloudEnabled, syncLocalToCloud, cloudError
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
