
export enum CandidateStatus {
  Training = 'Training',
  ReadyForInterview = 'Ready for Interview',
  Placed = 'Placed',
  Discontinued = 'Discontinued'
}

export enum AccountType {
  Bank = 'Bank',
  Cash = 'Cash',
  Debtor = 'Debtor', // Someone owes us
  Creditor = 'Creditor', // We owe someone
  Expense = 'Expense',
  Income = 'Income', // General Income not from candidates
  Equity = 'Equity' // Initial Capital etc
}

export enum TransactionType {
  Income = 'Income', // Money Coming In
  Expense = 'Expense', // Money Going Out
  Transfer = 'Transfer', // Internal Movement (Bank to Cash, etc)
  Refund = 'Refund' // Returning money to candidate/debtor
}

export interface User {
  id: string;
  name: string; // Full Name (e.g. "John Doe")
  username: string; // Login ID (e.g. "johndoe@sprtechforge.com")
  password?: string; // Stored locally/DB for admin visibility requirement
  isPasswordChanged?: boolean; // Forces password change on first login
  email?: string; // Optional backup email
  role: 'admin' | 'staff';
  modules: string[]; // ['candidates', 'finance', 'users']
  authProvider?: 'local' | 'google';
}

export interface PasswordResetRequest {
  id: string;
  username: string;
  requestDate: string;
  status: 'pending' | 'resolved';
}

export interface Candidate {
  id: string;
  name: string;
  batchId: string;
  email: string;
  phone: string;
  alternatePhone?: string; 
  address?: string; 
  referredBy?: string; 
  agreementText?: string; 
  agreedAmount: number;
  status: string; 
  
  // Placement Details
  placedCompany?: string;
  packageDetails?: string; 

  isActive: boolean; 
  joinedDate: string;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  subType?: string; 
  isSystem?: boolean; 
  openingBalance: number; 
  description?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  
  fromEntityId: string; 
  fromEntityType: 'Account' | 'Candidate';
  
  toEntityId: string;
  toEntityType: 'Account' | 'Candidate';

  description: string;
  isLocked: boolean;
  category?: string; 
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'RESTORE' | 'OTHER';
  entityType: string; // e.g. Candidate, Transaction
  entityId?: string;
  description: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  candidates: Candidate[];
  accounts: Account[];
  transactions: Transaction[];
  candidateStatuses: string[];
  passwordResetRequests: PasswordResetRequest[];
  activityLogs: ActivityLog[];
}
