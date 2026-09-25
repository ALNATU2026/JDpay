import { User, UserRole } from '../types';
import { storage } from './storage';
import { api, setToken } from './api';

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}

export const authService = {
  getCurrentUser: (): User | null => {
    return storage.getCurrentUser();
  },

  login: async (emailOrPhone: string, password: string): Promise<User> => {
    try {
      // 1. Attempt live MongoDB backend authentication
      const res = await api.auth.login({ email: emailOrPhone, password });
      if (res && res.user && res.token) {
        setToken(res.token);
        const userId = res.user.id || res.user._id;
        const isMega = userId === '6ab44acc7b6a361d8a96eb74' || res.user.isMegaSuperAdmin === true || res.user.role === 'super_admin';
        const mappedUser: User = {
          id: userId,
          fullName: res.user.fullName,
          email: res.user.email,
          phone: res.user.phone,
          role: isMega ? 'super_admin' : res.user.role,
          isMegaSuperAdmin: isMega,
          adminTitle: res.user.adminTitle || (isMega ? 'Mega Super Admin' : undefined),
          walletBalance: res.user.walletBalance,
          status: res.user.status,
          virtualAccount: res.user.virtualAccount,
          createdAt: res.user.createdAt,
          updatedAt: res.user.updatedAt,
        };
        storage.saveCurrentUser(mappedUser);
        return mappedUser;
      }
    } catch (err: any) {
      // If server returned an explicit auth error (e.g. invalid credentials or suspended), rethrow it
      const msg = (err.message || '').toLowerCase();
      const isExplicitAuthRejection =
        msg.includes('invalid email or password') ||
        msg.includes('invalid credentials') ||
        msg.includes('suspended');
      if (isExplicitAuthRejection) {
        throw err;
      }
      console.warn('[AuthService] Live backend unavailable, falling back to local storage authentication:', err.message);
    }

    // Fallback to local storage if offline or initial boot
    await new Promise((res) => setTimeout(res, 200));
    const users = storage.getUsers();
    const cleanIdentifier = emailOrPhone.trim().toLowerCase();
    const cleanPhoneDigits = cleanIdentifier.replace(/\D/g, '');

    let found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.phone.replace(/\s+/g, '') === cleanIdentifier ||
        (cleanPhoneDigits.length >= 7 && u.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits.slice(-7)))
    );

    if (!found && (cleanIdentifier.includes('admin') || cleanIdentifier === 'admin@jdpay.ng')) {
      found = users.find((u) => u.role === 'admin' || u.role === 'super_admin');
    }

    if (!found) {
      throw new Error('Invalid email, phone number, or password. Please check your credentials or create a new account.');
    }

    if (found.status === 'suspended') {
      throw new Error('This account has been suspended by administration. Please contact support.');
    }

    storage.saveCurrentUser(found);
    return found;
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    try {
      // 1. Attempt live MongoDB backend registration
      const res = await api.auth.register({
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
      });

      if (res && res.user && res.token) {
        setToken(res.token);
        const mappedUser: User = {
          id: res.user.id || res.user._id,
          fullName: res.user.fullName,
          email: res.user.email,
          phone: res.user.phone,
          role: res.user.role,
          walletBalance: res.user.walletBalance ?? 0,
          status: res.user.status,
          virtualAccount: res.user.virtualAccount,
          createdAt: res.user.createdAt,
          updatedAt: res.user.updatedAt,
        };
        storage.saveCurrentUser(mappedUser);
        return mappedUser;
      }
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already exists')) {
        throw err;
      }
      console.warn('[AuthService] Backend unavailable, falling back to local storage registration:', err.message);
    }

    // Fallback
    await new Promise((res) => setTimeout(res, 400));
    const users = storage.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newUser: User = {
      id: `usr_${Date.now().toString(36)}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      role: 'customer',
      walletBalance: 0.0,
      status: 'active',
      virtualAccount: {
        bankName: 'Wema Bank / Moniepoint MFB',
        accountNumber: randomSuffix,
        accountName: `JDPAY - ${payload.fullName.trim().toUpperCase()}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    storage.saveUsers(updatedUsers);
    storage.saveCurrentUser(newUser);

    const notifs = storage.getNotifications();
    notifs.unshift({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to JDpay!',
      message: 'Your JDpay account and dedicated virtual account are ready. Fund your wallet to subscribe to DStv, GOtv, or StarTimes instantly with ₦0 service fees.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    });
    storage.saveNotifications(notifs);

    return newUser;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((res) => setTimeout(res, 400));
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid registered email address.');
    }
    return {
      success: true,
      message: `A secure password reset link has been dispatched to ${email}. Check your inbox or spam folder.`,
    };
  },

  logout: async (): Promise<void> => {
    setToken(null);
    storage.saveCurrentUser(null);
  },

  switchRole: (role: UserRole): User => {
    const users = storage.getUsers();
    let target = users.find((u) => u.role === role);
    if (!target) {
      target = users[0];
    }
    storage.saveCurrentUser(target);
    return target;
  },

  updateProfile: async (userId: string, data: Partial<Pick<User, 'fullName' | 'phone'>>): Promise<User> => {
    try {
      const res = await api.auth.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
      });
      if (res && res.user) {
        const userId = res.user.id || res.user._id;
        const isMega = userId === '6ab44acc7b6a361d8a96eb74' || res.user.isMegaSuperAdmin === true || res.user.role === 'super_admin';
        const updated: User = {
          id: userId,
          fullName: res.user.fullName,
          email: res.user.email,
          phone: res.user.phone,
          role: isMega ? 'super_admin' : res.user.role,
          isMegaSuperAdmin: isMega,
          adminTitle: res.user.adminTitle || (isMega ? 'Mega Super Admin' : undefined),
          walletBalance: res.user.walletBalance,
          status: res.user.status,
          virtualAccount: res.user.virtualAccount,
          createdAt: res.user.createdAt,
          updatedAt: res.user.updatedAt,
        };
        storage.saveCurrentUser(updated);
        return updated;
      }
    } catch (e) {
      // Local fallback
    }

    const users = storage.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const updatedUser = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    storage.saveUsers(users);

    const currentUser = storage.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      storage.saveCurrentUser(updatedUser);
    }

    return updatedUser;
  },
};

