export type UserRole = 'customer' | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'suspended';

export const MEGA_SUPER_ADMIN_ID = '6ab44acc7b6a361d8a96eb74';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isMegaSuperAdmin?: boolean;
  adminTitle?: string;
  walletBalance: number;
  status: UserStatus;
  virtualAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  pin?: string;
  hasPin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const isMegaSuperAdminUser = (user?: { id?: string; role?: string; isMegaSuperAdmin?: boolean } | null): boolean => {
  if (!user) return false;
  return user.id === MEGA_SUPER_ADMIN_ID || user.role === 'super_admin' || user.isMegaSuperAdmin === true;
};

export const isAnyAdminUser = (user?: { id?: string; role?: string; isMegaSuperAdmin?: boolean } | null): boolean => {
  if (!user) return false;
  return isMegaSuperAdminUser(user) || user.role === 'admin';
};

export type CableServiceName = 'DStv' | 'GOtv' | 'StarTimes';

export type TransactionStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface Transaction {
  id: string;
  transactionReference: string;
  userId: string;
  customerName: string;
  service: CableServiceName;
  package: string;
  smartcardNumber: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  status: TransactionStatus;
  providerReference: string;
  requestId?: string;
  variationCode?: string;
  purchasedCode?: string;
  providerResponse?: string;
  failureReason?: string;
  commissionRate?: number;
  commissionPercentage?: number;
  commissionAmount?: number;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRecord {
  id: string;
  transactionId?: string;
  transactionReference: string;
  service: CableServiceName;
  package: string;
  smartcardNumber: string;
  customerName: string;
  amount: number;
  commissionRate: number; // 0.018 for DStv, 0.02 for GOtv/StarTimes
  commissionPercentage: number; // 1.8 for DStv, 2.0 for GOtv/StarTimes
  commissionAmount: number;
  provider: string; // 'VTpass Live Gateway'
  providerReference?: string;
  status: TransactionStatus;
  recordedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommissionSummary {
  totalCommissionEarned: number;
  dstvCommission: number;
  dstvVolume: number;
  dstvCount: number;
  gotvCommission: number;
  gotvVolume: number;
  gotvCount: number;
  startimesCommission: number;
  startimesVolume: number;
  startimesCount: number;
  totalTransactionsCount: number;
  totalVolume: number;
}

export const getCommissionRate = (service: CableServiceName): { rate: number; percentage: number } => {
  if (service === 'DStv') {
    return { rate: 0.018, percentage: 1.8 };
  }
  return { rate: 0.02, percentage: 2.0 };
};

export type WalletTxType = 'credit' | 'debit';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

export interface CablePackage {
  id: string;
  service: CableServiceName;
  packageName: string;
  variationCode?: string;
  price: number;
  channelsCount?: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CableServiceConfig {
  id: string;
  name: CableServiceName;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  description: string;
  numberLabel: string;
  numberPlaceholder: string;
  badgeText: string;
  fullName?: string;
  icon?: string;
  maintenanceMessage?: string;
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific user ID
  title: string;
  message: string;
  type: 'payment' | 'wallet' | 'system' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  transactionId?: string;
  description: string;
  createdAt: string;
}

export interface VerificationResult {
  customerName: string;
  smartcardNumber: string;
  currentPackage: string;
  accountStatus: 'Active' | 'Suspended' | 'Expired';
  dueDate: string;
  service: CableServiceName;
  phone?: string;
  renewalAmount?: number;
  customerNumber?: string;
  verifiedVia?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

export interface AdminStats {
  totalCustomers: number;
  todayTransactions: number;
  todayTransactionValue: number;
  todayRevenue: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
}
