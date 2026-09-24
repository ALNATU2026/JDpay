import { WalletTransaction } from '../types';
import { storage } from './storage';
import { api } from './api';

export const walletService = {
  getBalance: (userId: string): number => {
    const users = storage.getUsers();
    const user = users.find((u) => u.id === userId);
    return user ? user.walletBalance : 0;
  },

  fundWallet: async (
    userId: string,
    amount: number,
    method: 'card' | 'transfer' | 'ussd',
    gatewayReference?: string
  ): Promise<{ newBalance: number; transaction: WalletTransaction }> => {
    if (amount <= 0) {
      throw new Error('Funding amount must be greater than ₦0.');
    }

    const methodNames = {
      card: 'Instant Debit Card (Paystack/Flutterwave)',
      transfer: 'Bank Transfer (Dedicated Virtual Account)',
      ussd: 'USSD Quick Top-up (*737# / *901#)',
    };

    // 1. Attempt live MongoDB backend funding
    try {
      const res = await api.wallet.fund(amount, methodNames[method]);
      if (res && res.success) {
        const users = storage.getUsers();
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex].walletBalance = res.walletBalance;
          storage.saveUsers(users);
        }

        const currentUser = storage.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          currentUser.walletBalance = res.walletBalance;
          storage.saveCurrentUser(currentUser);
        }

        const mappedTx: WalletTransaction = {
          id: res.walletTransaction.id || res.walletTransaction._id || `wtx_${Date.now()}`,
          userId,
          type: 'credit',
          amount,
          balanceBefore: res.walletTransaction.balanceBefore,
          balanceAfter: res.walletTransaction.balanceAfter,
          reference: res.reference,
          description: res.walletTransaction.description,
          createdAt: res.walletTransaction.createdAt || new Date().toISOString(),
        };

        const allTx = storage.getWalletTransactions();
        allTx.unshift(mappedTx);
        storage.saveWalletTransactions(allTx);

        return { newBalance: res.walletBalance, transaction: mappedTx };
      }
    } catch (err: any) {
      console.warn('[WalletService] Backend fundWallet call failed or offline, falling back to local storage:', err.message);
    }

    // Fallback to local storage
    await new Promise((res) => setTimeout(res, 400));
    const users = storage.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User account not found.');
    }

    const user = users[userIndex];
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + amount;

    user.walletBalance = balanceAfter;
    user.updatedAt = new Date().toISOString();
    users[userIndex] = user;
    storage.saveUsers(users);

    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      storage.saveCurrentUser(user);
    }

    const ref = gatewayReference || `WAL-FUND-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const walletTx: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      userId,
      type: 'credit',
      amount,
      balanceBefore,
      balanceAfter,
      reference: ref,
      description: `Wallet funded via ${methodNames[method]}`,
      createdAt: new Date().toISOString(),
    };

    const allTx = storage.getWalletTransactions();
    allTx.unshift(walletTx);
    storage.saveWalletTransactions(allTx);

    const notifs = storage.getNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId,
      title: 'Wallet Funded',
      message: `Your JDpay wallet has been credited with ₦${amount.toLocaleString('en-NG')}.00. New balance: ₦${balanceAfter.toLocaleString('en-NG')}.00.`,
      type: 'wallet',
      read: false,
      createdAt: new Date().toISOString(),
    });
    storage.saveNotifications(notifs);

    return { newBalance: balanceAfter, transaction: walletTx };
  },

  debitWallet: (
    userId: string,
    amount: number,
    description: string,
    reference: string
  ): { newBalance: number; transaction: WalletTransaction } => {
    const users = storage.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const user = users[userIndex];
    if (user.walletBalance < amount) {
      throw new Error(`Insufficient wallet balance. You have ₦${user.walletBalance.toLocaleString('en-NG')}.00 but need ₦${amount.toLocaleString('en-NG')}.00.`);
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - amount;

    user.walletBalance = balanceAfter;
    user.updatedAt = new Date().toISOString();
    users[userIndex] = user;
    storage.saveUsers(users);

    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      storage.saveCurrentUser(user);
    }

    const walletTx: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      userId,
      type: 'debit',
      amount,
      balanceBefore,
      balanceAfter,
      reference,
      description,
      createdAt: new Date().toISOString(),
    };

    const allTx = storage.getWalletTransactions();
    allTx.unshift(walletTx);
    storage.saveWalletTransactions(allTx);

    return { newBalance: balanceAfter, transaction: walletTx };
  },

  getWalletTransactions: (userId: string): WalletTransaction[] => {
    const all = storage.getWalletTransactions();
    return all.filter((tx) => tx.userId === userId);
  },
};
