import { CableServiceName, Transaction, TransactionStatus } from '../types';
import { storage } from './storage';
import { api } from './api';

export interface TransactionFilter {
  service?: CableServiceName | 'all';
  status?: TransactionStatus | 'all';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

export const transactionService = {
  // Live MongoDB Atlas Transaction Query
  fetchLiveTransactions: async (filters?: TransactionFilter): Promise<Transaction[]> => {
    try {
      const data = await api.transactions.getAll({
        service: filters?.service,
        status: filters?.status,
        search: filters?.searchQuery,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });

      const mapped: Transaction[] = data.map((t: any) => ({
        id: (t.id || t._id || '').toString(),
        transactionReference: t.transactionReference,
        userId: (t.userId || '').toString(),
        customerName: t.customerName || 'Customer',
        service: t.service,
        package: t.package,
        smartcardNumber: t.smartcardNumber,
        amount: Number(t.amount) || 0,
        serviceFee: Number(t.serviceFee) || 0,
        totalAmount: Number(t.totalAmount) || 0,
        status: t.status,
        paymentMethod: t.paymentMethod || 'wallet',
        providerReference: t.providerReference || '',
        providerResponse: t.providerResponse || '',
        failureReason: t.failureReason,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
      }));

      // Cache locally to keep synchronous fallbacks and components instant
      storage.saveTransactions(mapped);
      return mapped;
    } catch (err: any) {
      console.warn('[TransactionService] Failed to query live DB transactions:', err.message);
      return transactionService.getAll(filters);
    }
  },

  // Live User Transactions
  fetchUserTransactions: async (userId: string, filters?: TransactionFilter): Promise<Transaction[]> => {
    try {
      let data = await api.transactions.getMy();
      let mapped: Transaction[] = data.map((t: any) => ({
        id: (t.id || t._id || '').toString(),
        transactionReference: t.transactionReference,
        userId: (t.userId || userId).toString(),
        customerName: t.customerName || 'Customer',
        service: t.service,
        package: t.package,
        smartcardNumber: t.smartcardNumber,
        amount: Number(t.amount) || 0,
        serviceFee: Number(t.serviceFee) || 0,
        totalAmount: Number(t.totalAmount) || 0,
        status: t.status,
        paymentMethod: t.paymentMethod || 'wallet',
        providerReference: t.providerReference || '',
        providerResponse: t.providerResponse || '',
        failureReason: t.failureReason,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
      }));

      if (filters?.service && filters.service !== 'all') {
        mapped = mapped.filter((t) => t.service === filters.service);
      }
      if (filters?.status && filters.status !== 'all') {
        mapped = mapped.filter((t) => t.status === filters.status);
      }
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        mapped = mapped.filter(
          (t) =>
            t.transactionReference.toLowerCase().includes(q) ||
            t.smartcardNumber.includes(q) ||
            t.customerName.toLowerCase().includes(q) ||
            t.package.toLowerCase().includes(q)
        );
      }

      return mapped;
    } catch (err: any) {
      console.warn('[TransactionService] Failed to query live user DB transactions:', err.message);
      return transactionService.getUserTransactions(userId, filters);
    }
  },

  // Synchronous cache reader (for instant render while async loads)
  getAll: (filters?: TransactionFilter): Transaction[] => {
    let txs = storage.getTransactions();

    if (!filters) return txs;

    if (filters.service && filters.service !== 'all') {
      txs = txs.filter((t) => t.service === filters.service);
    }

    if (filters.status && filters.status !== 'all') {
      txs = txs.filter((t) => t.status === filters.status);
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      txs = txs.filter(
        (t) =>
          t.transactionReference.toLowerCase().includes(q) ||
          t.smartcardNumber.includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.package.toLowerCase().includes(q)
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      txs = txs.filter((t) => new Date(t.createdAt).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).setHours(23, 59, 59, 999);
      txs = txs.filter((t) => new Date(t.createdAt).getTime() <= end);
    }

    return txs;
  },

  getUserTransactions: (userId: string, filters?: TransactionFilter): Transaction[] => {
    const all = transactionService.getAll(filters);
    return all.filter((t) => t.userId === userId);
  },

  getById: (id: string): Transaction | undefined => {
    const all = storage.getTransactions();
    return all.find((t) => t.id === id || t.transactionReference === id);
  },

  exportCSV: (transactions: Transaction[]): void => {
    const headers = [
      'Transaction Reference',
      'Date & Time',
      'Service',
      'Package',
      'Customer Name',
      'Smartcard/IUC Number',
      'Amount (NGN)',
      'Service Fee (NGN)',
      'Total Amount (NGN)',
      'Status',
      'Provider Reference',
    ];

    const rows = transactions.map((t) => [
      `"${t.transactionReference}"`,
      `"${new Date(t.createdAt).toLocaleString('en-NG')}"`,
      `"${t.service}"`,
      `"${t.package}"`,
      `"${t.customerName}"`,
      `"${t.smartcardNumber}"`,
      t.amount,
      t.serviceFee,
      t.totalAmount,
      `"${t.status}"`,
      `"${t.providerReference}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `JDPAY_Transactions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
