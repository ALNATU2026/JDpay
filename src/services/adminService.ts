import {
  AdminStats,
  AuditLog,
  CablePackage,
  CableServiceConfig,
  CableServiceName,
  CommissionRecord,
  CommissionSummary,
  Transaction,
  User,
  UserStatus,
} from '../types';
import { api } from './api';
import { storage } from './storage';

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

  resetCustomerPin: async (customerId: string): Promise<{ success: boolean; defaultPin: string; message: string; customer: User }> => {
    const res = await api.admin.resetCustomerPin(customerId);
    const c = res.customer;
    const mapped: User = {
      ...c,
      id: (c.id || c._id || '').toString(),
    };
    return {
      success: res.success,
      defaultPin: res.defaultPin,
      message: res.message,
      customer: mapped,
    };
  },

  updateCustomer: async (
    customerId: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      role?: string;
      status?: string;
      newPassword?: string;
      pin?: string;
    }
  ): Promise<{ success: boolean; message: string; customer: User }> => {
    const res = await api.admin.updateCustomer(customerId, data);
    const c = res.customer;
    const mapped: User = {
      ...c,
      id: (c.id || c._id || '').toString(),
    };
    return {
      success: res.success,
      message: res.message,
      customer: mapped,
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

  // Commission Calculations & Service
  calculateCommission: (service: CableServiceName, amount: number) => {
    const percentage = service === 'DStv' ? 1.8 : 2.0;
    const rate = percentage / 100;
    const commissionAmount = Number(((amount * percentage) / 100).toFixed(2));
    return {
      rate,
      percentage,
      commissionAmount,
    };
  },

  getCommissions: async (params: {
    service?: CableServiceName | 'all';
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ commissions: CommissionRecord[]; summary: CommissionSummary }> => {
    try {
      const res = await api.admin.getCommissions({
        service: params.service,
        status: params.status,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
      });

      if (res && res.success && res.commissions) {
        const mapped: CommissionRecord[] = res.commissions.map((c: any) => ({
          id: (c.id || c._id || '').toString(),
          transactionId: c.transactionId,
          transactionReference: c.transactionReference,
          service: c.service,
          package: c.package,
          smartcardNumber: c.smartcardNumber,
          customerName: c.customerName,
          amount: Number(c.amount) || 0,
          commissionRate: Number(c.commissionRate) || (c.service === 'DStv' ? 0.018 : 0.02),
          commissionPercentage: Number(c.commissionPercentage) || (c.service === 'DStv' ? 1.8 : 2.0),
          commissionAmount: Number(c.commissionAmount) || 0,
          provider: c.provider || 'VTpass Live Gateway',
          providerReference: c.providerReference,
          status: c.status || 'SUCCESSFUL',
          recordedBy: c.recordedBy || 'Admin Direct',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt,
        }));

        storage.saveCommissions(mapped);
        return {
          commissions: mapped,
          summary: res.summary,
        };
      }
    } catch (err: any) {
      console.warn('[AdminService] Falling back to local commission storage:', err.message);
    }

    // Local storage fallback
    let comms = storage.getCommissions();
    if (params.service && params.service !== 'all') {
      comms = comms.filter((c) => c.service === params.service);
    }
    if (params.status && params.status !== 'all') {
      comms = comms.filter((c) => c.status === params.status);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      comms = comms.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.smartcardNumber.includes(q) ||
          c.transactionReference.toLowerCase().includes(q) ||
          c.package.toLowerCase().includes(q)
      );
    }
    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      comms = comms.filter((c) => new Date(c.createdAt).getTime() >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate).setHours(23, 59, 59, 999);
      comms = comms.filter((c) => new Date(c.createdAt).getTime() <= end);
    }

    const allComms = storage.getCommissions();
    const summary: CommissionSummary = {
      totalCommissionEarned: 0,
      dstvCommission: 0,
      dstvVolume: 0,
      dstvCount: 0,
      gotvCommission: 0,
      gotvVolume: 0,
      gotvCount: 0,
      startimesCommission: 0,
      startimesVolume: 0,
      startimesCount: 0,
      totalTransactionsCount: allComms.length,
      totalVolume: 0,
    };

    for (const c of allComms) {
      if (c.status === 'SUCCESSFUL' || c.status === 'PENDING') {
        summary.totalCommissionEarned += c.commissionAmount || 0;
        summary.totalVolume += c.amount || 0;

        if (c.service === 'DStv') {
          summary.dstvCommission += c.commissionAmount || 0;
          summary.dstvVolume += c.amount || 0;
          summary.dstvCount += 1;
        } else if (c.service === 'GOtv') {
          summary.gotvCommission += c.commissionAmount || 0;
          summary.gotvVolume += c.amount || 0;
          summary.gotvCount += 1;
        } else if (c.service === 'StarTimes') {
          summary.startimesCommission += c.commissionAmount || 0;
          summary.startimesVolume += c.amount || 0;
          summary.startimesCount += 1;
        }
      }
    }

    summary.totalCommissionEarned = Number(summary.totalCommissionEarned.toFixed(2));
    summary.dstvCommission = Number(summary.dstvCommission.toFixed(2));
    summary.gotvCommission = Number(summary.gotvCommission.toFixed(2));
    summary.startimesCommission = Number(summary.startimesCommission.toFixed(2));

    return {
      commissions: comms,
      summary,
    };
  },

  payCableDirect: async (payload: {
    service: CableServiceName;
    package: string;
    smartcardNumber: string;
    customerName: string;
    amount: number;
    phone?: string;
    variationCode?: string;
    subscriptionType?: 'change' | 'renew';
    notes?: string;
  }): Promise<{ transaction: Transaction; commission: CommissionRecord }> => {
    const res = await api.admin.payCableDirect({
      ...payload,
      subscriptionType: payload.subscriptionType || 'change',
    });

    if (res && res.success && res.transaction) {
      const tx = res.transaction;
      const comm = res.commission;

      // Update local storage caches
      const txs = storage.getTransactions();
      txs.unshift(tx);
      storage.saveTransactions(txs);

      const comms = storage.getCommissions();
      comms.unshift(comm);
      storage.saveCommissions(comms);

      return {
        transaction: tx,
        commission: comm,
      };
    }

    throw new Error('Direct admin payment returned failure or no response from switch.');
  },

  exportCommissionsCSV: (commissions: CommissionRecord[]): void => {
    const headers = [
      'Transaction Reference',
      'Date & Time',
      'Provider (Service)',
      'Bouquet Package',
      'Customer Name',
      'Smartcard / IUC',
      'Payment Volume (NGN)',
      'Commission Rate (%)',
      'Commission Earned (NGN)',
      'Source Switch',
      'Provider Reference',
      'Recorded By',
      'Status',
    ];

    const rows = commissions.map((c) => [
      `"${c.transactionReference}"`,
      `"${new Date(c.createdAt).toLocaleString('en-NG')}"`,
      `"${c.service}"`,
      `"${c.package}"`,
      `"${c.customerName}"`,
      `"${c.smartcardNumber}"`,
      c.amount,
      `"${c.commissionPercentage}%"`,
      c.commissionAmount,
      `"${c.provider}"`,
      `"${c.providerReference || ''}"`,
      `"${c.recordedBy || 'Admin Direct'}"`,
      `"${c.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `JDPAY_VTpass_Commissions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
