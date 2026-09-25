import {
  AdminStats,
  AuditLog,
  CablePackage,
  CableServiceConfig,
  CableServiceName,
  Transaction,
  User,
  UserStatus,
} from '../types';
import { api } from './api';

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    try {
      const stats = await api.admin.getStats();
      return {
        totalCustomers: stats.totalCustomers ?? 0,
        todayTransactions: stats.todayTransactions ?? 0,
        todayTransactionValue: stats.todayTransactionValue ?? 0,
        todayRevenue: stats.todayRevenue ?? 0,
        successfulTransactions: stats.successfulTransactions ?? 0,
        pendingTransactions: stats.pendingTransactions ?? 0,
        failedTransactions: stats.failedTransactions ?? 0,
        refundedTransactions: stats.refundedTransactions ?? 0,
      };
    } catch (err: any) {
      console.warn('[AdminService] Live stats fetch error, returning zeroed live base:', err.message);
      return {
        totalCustomers: 0,
        todayTransactions: 0,
        todayTransactionValue: 0,
        todayRevenue: 0,
        successfulTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        refundedTransactions: 0,
      };
    }
  },

  getCustomers: async (searchQuery?: string, statusFilter?: UserStatus | 'all'): Promise<User[]> => {
    try {
      const list = await api.admin.getCustomers();
      let users: User[] = list.map((u: any) => ({
        ...u,
        id: (u.id || u._id || '').toString(),
        fullName: u.fullName || 'Unnamed User',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'customer',
        walletBalance: Number(u.walletBalance) || 0,
        status: (u.status as UserStatus) || 'active',
        virtualAccount: u.virtualAccount || {
          bankName: 'Wema Bank / Moniepoint MFB',
          accountNumber: '7740455450',
          accountName: `JDPAY - ${(u.fullName || '').toUpperCase()}`,
        },
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
      }));

      if (statusFilter && statusFilter !== 'all') {
        users = users.filter((u) => u.status === statusFilter);
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        users = users.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.phone.includes(q) ||
            u.id.toLowerCase().includes(q)
        );
      }

      return users;
    } catch (err: any) {
      console.warn('[AdminService] Failed to load customers from database:', err.message);
      return [];
    }
  },

  getCustomerById: async (userId: string): Promise<User | undefined> => {
    try {
      const users = await adminService.getCustomers();
      return users.find((u) => u.id === userId);
    } catch (err) {
      return undefined;
    }
  },

  toggleCustomerStatus: async (
    userId: string,
    newStatus: UserStatus,
    adminId?: string,
    adminName?: string
  ): Promise<User> => {
    const res = await api.admin.toggleCustomerStatus(userId, newStatus);
    const c = res.customer;
    return {
      ...c,
      id: (c.id || c._id || '').toString(),
    };
  },

  adjustWallet: async (
    adminId: string,
    adminName: string,
    customerId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string
  ): Promise<{ customer: User; auditLog: AuditLog | null }> => {
    if (amount <= 0) {
      throw new Error('Adjustment amount must be greater than zero.');
    }
    if (!reason.trim()) {
      throw new Error('Mandatory audit reason must be specified for any wallet modification.');
    }

    const res = await api.admin.adjustWallet(customerId, amount, type, reason);
    const c = res.customer;
    const mappedCustomer: User = {
      ...c,
      id: (c.id || c._id || '').toString(),
    };

    return { customer: mappedCustomer, auditLog: null };
  },

  resolvePendingTransaction: async (
    transactionId: string,
    targetStatus: 'SUCCESSFUL' | 'REFUNDED',
    adminId: string,
    adminName: string,
    note?: string
  ): Promise<Transaction> => {
    if (targetStatus === 'REFUNDED') {
      const res = await api.admin.refund(transactionId, note || 'Pending transaction refunded by switch auditor');
      return {
        ...res.transaction,
        id: (res.transaction.id || res.transaction._id || '').toString(),
      };
    } else {
      const res = await api.admin.resolvePending(transactionId);
      return {
        ...res.transaction,
        id: (res.transaction.id || res.transaction._id || '').toString(),
      };
    }
  },

  processRefund: async (
    transactionId: string,
    adminId: string,
    adminName: string,
    reason: string
  ): Promise<Transaction> => {
    const res = await api.admin.refund(transactionId, reason);
    return {
      ...res.transaction,
      id: (res.transaction.id || res.transaction._id || '').toString(),
    };
  },

  getPackages: async (serviceName?: CableServiceName): Promise<CablePackage[]> => {
    try {
      const pkgs = await api.admin.getPackages();
      let mapped: CablePackage[] = pkgs.map((p: any) => ({
        id: (p.id || p._id || '').toString(),
        service: p.service,
        packageName: p.packageName || p.name,
        variationCode: p.variationCode,
        price: Number(p.price) || 0,
        channelsCount: p.channelsCount || 50,
        description: p.description || '',
        status: p.status || 'active',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      }));

      if (serviceName && (serviceName as string) !== 'all') {
        mapped = mapped.filter((p) => p.service === serviceName);
      }
      return mapped;
    } catch (err: any) {
      console.warn('[AdminService] Error loading packages from DB:', err.message);
      return [];
    }
  },

  updatePackagePrice: async (
    packageId: string,
    newPrice: number,
    adminId?: string,
    adminName?: string
  ): Promise<CablePackage> => {
    const res = await api.admin.updatePackage(packageId, { price: newPrice });
    const p = res.package;
    return {
      id: (p.id || p._id || '').toString(),
      service: p.service,
      packageName: p.packageName || p.name,
      price: Number(p.price) || 0,
      channelsCount: p.channelsCount || 50,
      description: p.description || '',
      status: p.status || 'active',
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    };
  },

  getServices: async (): Promise<CableServiceConfig[]> => {
    try {
      const list = await api.admin.getServices();
      return list.map((s: any) => ({
        id: (s.id || s._id || '').toString(),
        name: s.name,
        fullName: s.fullName || s.name,
        slug: (s.name || '').toLowerCase(),
        description: s.description || '',
        icon: s.icon || 'Tv',
        numberLabel: s.name === 'GOtv' ? 'IUC Number' : 'Smartcard / UIC Number',
        numberPlaceholder: s.name === 'GOtv' ? 'e.g. 2012345678' : 'e.g. 1023456789',
        badgeText: 'Live Provider Switch',
        status: s.status || 'active',
        maintenanceMessage: s.maintenanceMessage,
      }));
    } catch (err: any) {
      console.warn('[AdminService] Error loading services from DB:', err.message);
      return [];
    }
  },

  toggleServiceStatus: async (
    serviceName: string,
    status: 'active' | 'suspended',
    adminId?: string,
    adminName?: string,
    maintenanceMessage?: string
  ): Promise<CableServiceConfig> => {
    const res = await api.admin.toggleService(serviceName, status, maintenanceMessage);
    const s = res.service;
    return {
      id: (s.id || s._id || '').toString(),
      name: s.name,
      fullName: s.fullName || s.name,
      slug: (s.name || '').toLowerCase(),
      description: s.description || '',
      icon: s.icon || 'Tv',
      numberLabel: s.name === 'GOtv' ? 'IUC Number' : 'Smartcard / UIC Number',
      numberPlaceholder: s.name === 'GOtv' ? 'e.g. 2012345678' : 'e.g. 1023456789',
      badgeText: 'Live Provider Switch',
      status: s.status || 'active',
      maintenanceMessage: s.maintenanceMessage,
    };
  },

  broadcastNotification: async (
    adminId: string,
    adminName: string,
    title: string,
    message: string,
    targetAudience: 'all' | 'pending' | 'failed' = 'all'
  ): Promise<void> => {
    await api.admin.broadcast(title, message);
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const logs = await api.admin.getAuditLogs();
      return logs.map((l: any) => ({
        id: (l.id || l._id || '').toString(),
        adminId: l.adminId || '',
        adminName: l.adminName || 'Admin',
        action: l.action || 'SYSTEM_EVENT',
        targetUserId: l.targetUserId,
        transactionId: l.transactionId,
        description: l.description || '',
        createdAt: l.createdAt || new Date().toISOString(),
      }));
    } catch (err: any) {
      console.warn('[AdminService] Error loading audit logs from DB:', err.message);
      return [];
    }
  },

  getVtpassStatus: async () => {
    return api.admin.getVtpassStatus();
  },

  syncVtpassPackages: async (service?: string) => {
    return api.admin.syncVtpassPackages(service);
  },

  requeryTransaction: async (transactionId: string) => {
    return api.admin.requeryTransaction(transactionId);
  },
};
