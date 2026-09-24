const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('jdpay_auth_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('jdpay_auth_token', token);
  } else {
    localStorage.removeItem('jdpay_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

export const api = {
  health: () => request<{ status: string; database: { state: string; host: string; dbName: string } }>('/health'),

  auth: {
    register: (payload: { fullName: string; email: string; phone: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (payload: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    me: () => request<{ user: any }>('/auth/me'),

    updateProfile: (payload: { fullName?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
      request<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  cable: {
    getServices: () => request<any[]>('/cable/services'),

    getPackages: (service?: string) =>
      request<any[]>(`/cable/packages${service ? `?service=${service}` : ''}`),

    verifyDecoder: (service: string, smartcardNumber: string, allowSimulated?: boolean) =>
      request<{
        customerName: string;
        smartcardNumber: string;
        currentPackage: string;
        accountStatus: string;
        dueDate: string;
        service: string;
        renewalAmount?: number;
        customerNumber?: string;
        verifiedVia?: string;
      }>('/cable/verify', {
        method: 'POST',
        body: JSON.stringify({ service, smartcardNumber, allowSimulated }),
      }),
  },

  wallet: {
    getBalance: async () => {
      const me = await request<{ user: any }>('/auth/me');
      return { balance: me.user?.walletBalance ?? 0 };
    },

    fund: (amount: number, paymentMethod: string) =>
      request<{ success: boolean; walletBalance: number; reference: string; walletTransaction: any }>('/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      }),

    getTransactions: () => request<any[]>('/wallet/transactions'),
  },

  transactions: {
    payCable: (payload: {
      service: string;
      package: string;
      smartcardNumber: string;
      customerName: string;
      amount: number;
      phone?: string;
      variationCode?: string;
      subscriptionType?: 'change' | 'renew';
    }) =>
      request<{ success: boolean; transaction: any; walletBalance: number }>('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMy: () => request<any[]>('/transactions/my'),

    getAll: (params: { service?: string; status?: string; search?: string; startDate?: string; endDate?: string } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.service && params.service !== 'all') searchParams.append('service', params.service);
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      const qs = searchParams.toString();
      return request<any[]>(`/transactions/all${qs ? `?${qs}` : ''}`);
    },
  },

  notifications: {
    getAll: () => request<any[]>('/notifications'),
    markRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),
  },

  admin: {
    getStats: () => request<any>('/admin/stats'),
    getCustomers: () => request<any[]>('/admin/customers'),
    toggleCustomerStatus: (customerId: string, status: 'active' | 'suspended') =>
      request<{ success: boolean; customer: any }>(`/admin/customers/${customerId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    adjustWallet: (customerId: string, amount: number, type: 'credit' | 'debit', reason: string) =>
      request<{ success: boolean; customer: any }>('/admin/adjust-wallet', {
        method: 'POST',
        body: JSON.stringify({ customerId, amount, type, reason }),
      }),
    refund: (transactionId: string, reason: string) =>
      request<{ success: boolean; transaction: any }>('/admin/refund', {
        method: 'POST',
        body: JSON.stringify({ transactionId, reason }),
      }),
    resolvePending: (transactionId: string) =>
      request<{ success: boolean; transaction: any }>('/admin/resolve-pending', {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      }),
    broadcast: (title: string, message: string) =>
      request<{ success: boolean }>('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message }),
      }),
    getPackages: () => request<any[]>('/admin/packages'),
    updatePackage: (
      packageId: string,
      data: { price?: number; status?: 'active' | 'inactive'; description?: string; packageName?: string }
    ) =>
      request<{ success: boolean; package: any }>(`/admin/packages/${packageId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getServices: () => request<any[]>('/admin/services'),
    toggleService: (serviceName: string, status: 'active' | 'suspended', maintenanceMessage?: string) =>
      request<{ success: boolean; service: any }>(`/admin/services/${serviceName}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ status, maintenanceMessage }),
      }),
    getAuditLogs: () => request<any[]>('/admin/audit-logs'),
    getVtpassStatus: () =>
      request<{
        email: string;
        baseUrl: string;
        environment: string;
        balance: number;
        status: string;
        lastChecked: string;
      }>('/admin/vtpass/status'),
    syncVtpassPackages: () =>
      request<{
        success: boolean;
        message: string;
        count: number;
        added: number;
        updated: number;
      }>('/admin/vtpass/sync', { method: 'POST' }),
    requeryTransaction: (id: string) =>
      request<{
        success: boolean;
        transaction: any;
        requeryResult: any;
        statusUpdated: boolean;
      }>(`/admin/transactions/${id}/requery`, { method: 'POST' }),
  },
};
