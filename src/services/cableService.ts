import {
  CablePackage,
  CableServiceConfig,
  CableServiceName,
  Transaction,
  VerificationResult,
} from '../types';
import { storage } from './storage';
import { walletService } from './walletService';
import { api } from './api';

export interface PayCablePayload {
  userId: string;
  customerName: string;
  service: CableServiceName;
  packageId: string;
  smartcardNumber: string;
  phone?: string;
  subscriptionType?: 'change' | 'renew';
}

export const cableService = {
  getServices: (): CableServiceConfig[] => {
    return storage.getServices();
  },

  fetchLivePackages: async (serviceName?: CableServiceName): Promise<CablePackage[]> => {
    try {
      const pkgs = await api.admin.getPackages();
      const mapped: CablePackage[] = pkgs.map((p: any) => ({
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

      // Cache locally so synchronous access is also accurate
      storage.savePackages(mapped);

      if (!serviceName || (serviceName as string) === 'all') {
        return mapped.filter((p) => p.status === 'active');
      }
      return mapped.filter((p) => p.service === serviceName && p.status === 'active');
    } catch (err: any) {
      console.warn('[CableService] fetchLivePackages fallback:', err.message);
      return cableService.getPackages(serviceName);
    }
  },

  getPackages: (serviceName?: CableServiceName): CablePackage[] => {
    const packages = storage.getPackages();
    if (!serviceName) return packages.filter((p) => p.status === 'active');
    return packages.filter((p) => p.service === serviceName && p.status === 'active');
  },

  getPackageById: (packageId: string): CablePackage | undefined => {
    const packages = storage.getPackages();
    return packages.find((p) => p.id === packageId);
  },

  verifyCustomer: async (
    serviceName: CableServiceName,
    smartcardNumber: string,
    allowSimulated: boolean = false
  ): Promise<VerificationResult> => {
    const cleanNumber = smartcardNumber.replace(/\s+/g, '');
    if (!cleanNumber || cleanNumber.length < 8 || !/^\d+$/.test(cleanNumber)) {
      throw new Error(
        `Invalid ${serviceName === 'GOtv' ? 'IUC' : 'Smartcard'} number. Please enter a valid 8 to 11 digit number.`
      );
    }

    // 1. Attempt live decoder verification via VTpass / MongoDB backend
    try {
      const liveResult = await api.cable.verifyDecoder(serviceName, cleanNumber, allowSimulated);
      if (liveResult && liveResult.customerName) {
        return {
          customerName: liveResult.customerName,
          smartcardNumber: liveResult.smartcardNumber,
          currentPackage: liveResult.currentPackage,
          accountStatus: (liveResult.accountStatus as any) || 'Active',
          dueDate: liveResult.dueDate,
          service: serviceName,
          phone: liveResult.customerNumber || `080${cleanNumber.slice(-8)}`,
          renewalAmount: liveResult.renewalAmount,
          customerNumber: liveResult.customerNumber,
          verifiedVia: liveResult.verifiedVia,
        };
      }
    } catch (err: any) {
      throw err;
    }

    // Fallback simulation
    await new Promise((res) => setTimeout(res, 400));
    if (cleanNumber.endsWith('000')) {
      throw new Error(
        `Customer record not found on MultiChoice/StarTimes switch for number ${cleanNumber}. Please check the number.`
      );
    }

    const mockNames = [
      'Ifeanyi Okonkwo',
      'Bolanle Adeyemi',
      'Emeka Chukwuemeka',
      'Fatima Aliyu',
      'Tunde Balogun',
      'Ngozi Ibeh',
      'Babajide Sanwo-Olu',
      'Halima Dangote',
    ];

    const hash = cleanNumber.split('').reduce((acc, char) => acc + parseInt(char, 10), 0);
    const selectedName = mockNames[hash % mockNames.length];
    const servicePackages = cableService.getPackages(serviceName);
    const defaultPackage = servicePackages[hash % servicePackages.length]?.packageName || `${serviceName} Basic`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (hash % 14));

    return {
      customerName: selectedName,
      smartcardNumber: cleanNumber,
      currentPackage: defaultPackage,
      accountStatus: 'Active',
      dueDate: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      service: serviceName,
      phone: `080${cleanNumber.slice(-8)}`,
    };
  },

  generateTransactionReference: (): string => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100000 + Math.random() * 900000);
    return `JDPAY-${dateStr}-${randNum}`;
  },

  processCablePayment: async (payload: PayCablePayload): Promise<Transaction> => {
    const selectedPkg = cableService.getPackageById(payload.packageId);
    if (!selectedPkg) {
      throw new Error('Selected package does not exist or has been discontinued.');
    }

    // 1. Attempt live VTpass backend transaction & switch fulfillment
    try {
      const res = await api.transactions.payCable({
        service: payload.service,
        package: selectedPkg.packageName,
        smartcardNumber: payload.smartcardNumber,
        customerName: payload.customerName,
        amount: selectedPkg.price,
        phone: payload.phone,
        variationCode: selectedPkg.variationCode,
        subscriptionType: payload.subscriptionType || 'change',
      });

      if (res && res.success && res.transaction) {
        // Sync wallet balance locally
        const users = storage.getUsers();
        const userIndex = users.findIndex((u) => u.id === payload.userId);
        if (userIndex !== -1) {
          users[userIndex].walletBalance = res.walletBalance;
          storage.saveUsers(users);
        }

        const currentUser = storage.getCurrentUser();
        if (currentUser && currentUser.id === payload.userId) {
          currentUser.walletBalance = res.walletBalance;
          storage.saveCurrentUser(currentUser);
        }

        const mappedTx: Transaction = {
          id: res.transaction.id || res.transaction._id || `tx_${Date.now()}`,
          transactionReference: res.transaction.transactionReference,
          userId: payload.userId,
          customerName: res.transaction.customerName,
          service: res.transaction.service,
          package: res.transaction.package,
          smartcardNumber: res.transaction.smartcardNumber,
          amount: res.transaction.amount,
          serviceFee: res.transaction.serviceFee || 0,
          totalAmount: res.transaction.totalAmount,
          status: res.transaction.status,
          providerReference: res.transaction.providerReference,
          requestId: res.transaction.requestId,
          variationCode: res.transaction.variationCode,
          purchasedCode: res.transaction.purchasedCode,
          providerResponse: res.transaction.providerResponse || 'Signal refreshed. Active on decoder.',
          createdAt: res.transaction.createdAt || new Date().toISOString(),
          updatedAt: res.transaction.updatedAt || new Date().toISOString(),
        };

        const existingTxs = storage.getTransactions();
        existingTxs.unshift(mappedTx);
        storage.saveTransactions(existingTxs);

        return mappedTx;
      }
    } catch (err: any) {
      throw err;
    }

    throw new Error('Payment processing returned no response from switch.');
  },
};

