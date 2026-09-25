import dotenv from 'dotenv';
dotenv.config({ override: true });
if (process.env.VTPASS_PASSWORD === 'Jalloh98@' || !process.env.VTPASS_PASSWORD) {
  process.env.VTPASS_PASSWORD = 'Jalloh99@';
}
if (!process.env.VTPASS_EMAIL) {
  process.env.VTPASS_EMAIL = 'sadjad578@gmail.com';
}

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase, getDatabaseStatus } from './server/db.js';
import { seedDatabaseIfEmpty } from './server/seed.js';
import {
  UserModel,
  TransactionModel,
  WalletTransactionModel,
  CablePackageModel,
  NotificationModel,
  AuditLogModel,
  CableServiceModel,
} from './server/models.js';
import {
  verifySmartcardWithVtpass,
  purchaseDstvSubscription,
  purchaseCableSubscription,
  requeryVtpassTransaction,
  getVtpassAccountBalance,
} from './server/vtpass.js';
import {
  syncAllPackagesFromVtpass,
  syncDstvPackagesFromVtpass,
  syncStartimesPackagesFromVtpass,
  syncGotvPackagesFromVtpass,
} from './server/vtpassSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jdpay_production_secure_jwt_secret_key_2026_super_safe';

app.use(express.json());

// CORS & Preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let dbInitPromise: Promise<void> | null = null;
export async function ensureDbReady() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await connectToDatabase();
        await seedDatabaseIfEmpty();
        syncAllPackagesFromVtpass().catch((e) =>
          console.warn('[VTpass Startup] Full bouquet sync warning:', e.message)
        );
      } catch (err: any) {
        console.warn('[MongoDB Middleware] Database init warning:', err.message);
        dbInitPromise = null;
      }
    })();
  }
  return dbInitPromise;
}

// Request middleware to ensure DB is connected (vital for Vercel serverless cold-starts)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    await ensureDbReady();
  }
  next();
});

// Initialize Database & VTpass Switch Synchronization (Full Live Broadcasters Sync)
connectToDatabase()
  .then(async () => {
    await seedDatabaseIfEmpty();
    // Synchronize official DStv, StarTimes, and GOtv packages and live prices directly from VTpass
    syncAllPackagesFromVtpass().catch((e) =>
      console.warn('[VTpass Startup] Full bouquet sync warning:', e.message)
    );
  })
  .catch((err) => {
    console.error('[MongoDB] Warning: Initial connection failed, will retry on request:', err.message);
  });

// ================= AUTH MIDDLEWARE =================
interface AuthRequest extends Request {
  user?: any;
}

export const MEGA_SUPER_ADMIN_ID = '6ab44acc7b6a361d8a96eb74';

export const isAuthorizedAdmin = (user: any): boolean => {
  if (!user) return false;
  const idStr = (user._id || user.id || '').toString();
  return (
    idStr === MEGA_SUPER_ADMIN_ID ||
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    user.isMegaSuperAdmin === true
  );
};

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication session' });
  }
};

// ================= API ROUTES =================

// 1. Health & Database Status
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// 2. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Generate simulated virtual account
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newUser = new UserModel({
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password,
      role: 'customer',
      walletBalance: 0,
      status: 'active',
      virtualAccount: {
        bankName: 'Wema Bank / Moniepoint MFB',
        accountNumber: randomSuffix,
        accountName: `JDPAY - ${fullName.toUpperCase()}`,
      },
    });

    await newUser.save();

    // Welcome Notification
    await new NotificationModel({
      userId: newUser._id.toString(),
      title: 'Welcome to JDpay!',
      message: 'Your live JDpay account and dedicated virtual account are ready. Enjoy zero fee cable TV subscriptions.',
      type: 'system',
      read: false,
    }).save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      user: newUser.toJSON(),
      token,
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// 3. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanIdentifier = email.toLowerCase().trim();
    const cleanPhone = email.trim().replace(/\s+/g, '');
    const user = await UserModel.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: cleanPhone },
      ],
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account is suspended. Please contact customer support.' });
    }

    const isSuper = user._id.toString() === MEGA_SUPER_ADMIN_ID || user.role === 'super_admin';
    const effectiveRole = isSuper ? 'super_admin' : user.role;

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: effectiveRole,
        isMegaSuperAdmin: isSuper,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    const userObj = user.toJSON();
    if (isSuper) {
      userObj.role = 'super_admin';
      userObj.isMegaSuperAdmin = true;
      userObj.adminTitle = 'Mega Super Admin';
    }

    res.json({
      user: userObj,
      token,
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// 4. Auth: Get Current Profile
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ user: req.user.toJSON() });
});

// 5. Auth: Update Profile
app.put('/api/auth/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fullName, phone, currentPassword, newPassword } = req.body;
    const user = req.user;

    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ user: user.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// 5b. Cable: Services Status
app.get('/api/cable/services', async (req, res) => {
  try {
    let services = await CableServiceModel.find();
    if (services.length === 0) {
      await seedDatabaseIfEmpty();
      services = await CableServiceModel.find();
    }
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load services' });
  }
});

// 6. Cable: Packages
app.get('/api/cable/packages', async (req, res) => {
  try {
    const { service } = req.query;
    const query: any = { status: 'active' };
    if (service && service !== 'all') {
      query.service = service;
    }
    const packages = await CablePackageModel.find(query).sort({ price: 1 });
    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load packages' });
  }
});

// 7. Cable: Live Decoder Verification via VTpass REST API
app.post('/api/cable/verify', async (req, res) => {
  const { service, smartcardNumber, allowSimulated } = req.body;
  if (!service || !smartcardNumber) {
    return res.status(400).json({ error: 'Service and decoder smartcard/IUC number are required' });
  }

  const cleanNum = smartcardNumber.replace(/\s+/g, '');
  if (cleanNum.length < 8 || cleanNum.length > 14 || !/^\d+$/.test(cleanNum)) {
    return res.status(400).json({
      error: `Invalid ${service === 'GOtv' ? 'IUC' : 'Smartcard'} number. Must be 8 to 12 digits.`,
    });
  }

  const defaultBouquet =
    service === 'StarTimes'
      ? 'StarTimes Basic (Dish)'
      : service === 'GOtv'
      ? 'GOtv Max'
      : 'DStv Compact';
  const defaultRenewal =
    service === 'StarTimes' ? 5100 : service === 'GOtv' ? 8500 : 19000;

  // If explicit simulation requested (demo/testing mode)
  if (allowSimulated === true || req.query.allowSimulated === 'true') {
    return res.json({
      customerName: 'DEMO TEST SUBSCRIBER',
      smartcardNumber: cleanNum,
      currentPackage: defaultBouquet,
      accountStatus: 'Active',
      dueDate: '30 Oct 2026',
      renewalAmount: defaultRenewal,
      customerNumber: `080${cleanNum.slice(-8)}`,
      service,
      verifiedVia: 'VTpass Sandbox / Demo Mode',
    });
  }

  try {
    const vtpassData = await verifySmartcardWithVtpass(cleanNum, service.toLowerCase());
    return res.json({
      customerName: vtpassData.customerName,
      smartcardNumber: cleanNum,
      currentPackage: vtpassData.currentBouquet || defaultBouquet,
      accountStatus: vtpassData.status || 'Active',
      dueDate: vtpassData.dueDate
        ? new Date(vtpassData.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Active Billing Cycle',
      renewalAmount: vtpassData.renewalAmount || defaultRenewal,
      customerNumber: vtpassData.customerNumber || `080${cleanNum.slice(-8)}`,
      service,
      verifiedVia: 'Verified',
    });
  } catch (err: any) {
    console.warn(`[Cable Verify] Live query failed for ${service} ${cleanNum}:`, err.message);

    // Support testing sandbox cards (e.g. 1212121212, 0213456789) if live switch rejects them
    const isTestNumber = [
      '1212121212',
      '1111111111',
      '1010101010',
      '1234567890',
      '1023456789',
      '2012345678',
      '41234567890',
      '7024567890',
      '0213456789',
      '0219876543',
      '0181234567',
    ].includes(cleanNum);

    if (isTestNumber) {
      return res.json({
        customerName: 'SANDBOX TEST DECODER',
        smartcardNumber: cleanNum,
        currentPackage: defaultBouquet,
        accountStatus: 'Active',
        dueDate: '30 Oct 2026',
        renewalAmount: defaultRenewal,
        customerNumber: `080${cleanNum.slice(-8)}`,
        service,
        verifiedVia: 'Simulated Sandbox Verification',
      });
    }

    return res.status(400).json({
      error: err.message || 'Decoder verification failed. Please check the smartcard number and try again.',
      canUseSimulated: true,
    });
  }
});

// 8. Wallet: Fund Wallet
app.post('/api/wallet/fund', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      return res.status(400).json({ error: 'Minimum funding amount is ₦100' });
    }

    const user = req.user;
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + numAmount;

    user.walletBalance = balanceAfter;
    await user.save();

    const ref = `WAL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const walletTx = new WalletTransactionModel({
      userId: user._id.toString(),
      type: 'credit',
      amount: numAmount,
      balanceBefore,
      balanceAfter,
      reference: ref,
      description: `Wallet top-up via ${paymentMethod || 'Debit Card'}`,
    });
    await walletTx.save();

    // Notification
    await new NotificationModel({
      userId: user._id.toString(),
      title: 'Wallet Funded Successfully',
      message: `₦${numAmount.toLocaleString('en-NG')} was credited to your JDpay wallet. Reference: ${ref}.`,
      type: 'wallet',
      read: false,
    }).save();

    res.json({
      success: true,
      walletBalance: user.walletBalance,
      reference: ref,
      walletTransaction: walletTx.toJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Wallet funding failed' });
  }
});

// 9. Wallet: User Transactions
app.get('/api/wallet/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const txs = await WalletTransactionModel.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 });
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch wallet transactions' });
  }
});

// 10. Transactions: Create / Pay Cable TV via VTpass Switch
app.post('/api/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      service,
      package: packageName,
      smartcardNumber,
      customerName,
      amount,
      phone,
      variationCode,
      subscriptionType,
    } = req.body;
    const user = req.user;

    if (!service || !packageName || !smartcardNumber || !customerName) {
      return res.status(400).json({ error: 'Missing subscription details' });
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ error: 'Invalid subscription amount' });
    }

    const serviceFee = 0; // JDpay provides ₦0.00 service fee
    const totalAmount = payAmount + serviceFee;

    // Check Balance
    if (user.walletBalance < totalAmount) {
      return res.status(400).json({
        error: `Insufficient wallet balance. Required: ₦${totalAmount.toLocaleString('en-NG')}, Available: ₦${user.walletBalance.toLocaleString('en-NG')}. Please fund your wallet.`,
      });
    }

    // Debit Wallet initially
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - totalAmount;
    user.walletBalance = balanceAfter;
    await user.save();

    const txRef = `JDPAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Resolve variationCode if not passed in payload
    let finalVarCode = variationCode;
    if (!finalVarCode) {
      const pkgDoc = await CablePackageModel.findOne({
        service,
        $or: [{ packageName }, { name: packageName }],
      });
      if (pkgDoc && pkgDoc.variationCode) {
        finalVarCode = pkgDoc.variationCode;
      }
    }

    console.log(`[VTpass Transaction] Processing ${service} subscription for ${customerName} (${smartcardNumber})`, {
      variationCode: finalVarCode,
      amount: payAmount,
      subscriptionType,
    });

    let vtpassResult: any;
    try {
      vtpassResult = await purchaseDstvSubscription({
        billersCode: smartcardNumber,
        serviceID: service.toLowerCase() as any,
        variationCode: finalVarCode,
        amount: payAmount,
        phone: phone || user.phone || '08012345678',
        subscriptionType: subscriptionType === 'renew' ? 'renew' : 'change',
        quantity: 1,
      });
    } catch (err: any) {
      console.error('[VTpass Call Failed]:', err.message);
      vtpassResult = {
        success: false,
        status: 'FAILED',
        failureReason: err.message || 'VTpass network timeout',
      };
    }

    // Check if VTpass declined/failed
    if (vtpassResult.status === 'FAILED') {
      // Revert wallet deduction immediately
      user.walletBalance = balanceBefore;
      await user.save();

      const failedTx = new TransactionModel({
        transactionReference: txRef,
        userId: user._id.toString(),
        customerName: customerName.trim(),
        service,
        package: packageName,
        smartcardNumber: smartcardNumber.trim(),
        amount: payAmount,
        serviceFee,
        totalAmount,
        status: 'FAILED',
        providerReference: vtpassResult.transactionId || 'FAILED',
        requestId: vtpassResult.requestId,
        variationCode: finalVarCode,
        failureReason: vtpassResult.failureReason || 'Broadcaster switch declined activation',
        providerResponse: JSON.stringify(vtpassResult.rawResponse || {}),
      });
      await failedTx.save();

      await new NotificationModel({
        userId: user._id.toString(),
        title: `${service} Subscription Declined`,
        message: `Your payment of ₦${payAmount.toLocaleString('en-NG')} failed: ${failedTx.failureReason}. Your wallet was NOT debited.`,
        type: 'system',
        read: false,
      }).save();

      return res.status(400).json({
        error: vtpassResult.failureReason || 'Subscription failed on the broadcast switch.',
        status: 'FAILED',
        transaction: failedTx.toJSON(),
      });
    }

    // Success or Pending
    const transaction = new TransactionModel({
      transactionReference: txRef,
      userId: user._id.toString(),
      customerName: customerName.trim(),
      service,
      package: packageName,
      smartcardNumber: smartcardNumber.trim(),
      amount: payAmount,
      serviceFee,
      totalAmount,
      status: vtpassResult.status,
      providerReference: vtpassResult.transactionId || txRef,
      requestId: vtpassResult.requestId,
      variationCode: finalVarCode,
      purchasedCode: vtpassResult.purchasedCode,
      providerResponse: vtpassResult.providerResponse || 'Signal refreshed. Active on decoder.',
    });
    await transaction.save();

    // Wallet Debit Record
    await new WalletTransactionModel({
      userId: user._id.toString(),
      type: 'debit',
      amount: totalAmount,
      balanceBefore,
      balanceAfter,
      reference: txRef,
      description: `${service} Subscription: ${packageName} (${smartcardNumber})`,
    }).save();

    // Notification
    const notifTitle =
      vtpassResult.status === 'SUCCESSFUL'
        ? `${service} Subscription Activated`
        : `${service} Subscription Queued`;
    const notifMsg =
      vtpassResult.status === 'SUCCESSFUL'
        ? `₦${totalAmount.toLocaleString('en-NG')} payment successful for ${packageName} on decoder ${smartcardNumber}.`
        : `₦${totalAmount.toLocaleString('en-NG')} payment queued at MultiChoice broadcast switch for ${packageName}.`;

    await new NotificationModel({
      userId: user._id.toString(),
      title: notifTitle,
      message: notifMsg,
      type: 'payment',
      read: false,
    }).save();

    res.status(201).json({
      success: true,
      transaction: transaction.toJSON(),
      walletBalance: user.walletBalance,
    });
  } catch (error: any) {
    console.error('[Create Transaction Error]', error);
    res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
});

// 11. Transactions: User's History
app.get('/api/transactions/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const txs = await TransactionModel.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 });
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// 12. Transactions: Admin All / Filter
app.get('/api/transactions/all', async (req, res) => {
  try {
    const { service, status, search, userId, startDate, endDate } = req.query;
    const query: any = {};

    if (service && service !== 'all') query.service = service;
    if (status && status !== 'all') query.status = status;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { transactionReference: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { smartcardNumber: { $regex: q, $options: 'i' } },
        { package: { $regex: q, $options: 'i' } },
      ];
    }

    const txs = await TransactionModel.find(query).sort({ createdAt: -1 });
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// 13. Notifications: User's
app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notifs = await NotificationModel.find({
      $or: [{ userId: req.user._id.toString() }, { userId: 'all' }],
    }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await NotificationModel.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

app.post('/api/notifications/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await NotificationModel.updateMany(
      { $or: [{ userId: req.user._id.toString() }, { userId: 'all' }] },
      { read: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark all as read' });
  }
});

// ================= ADMIN ROUTES =================

// 14. Admin: KPI Stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalCustomers = await UserModel.countDocuments({ role: 'customer' });
    const allTxs = await TransactionModel.find();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayTxCount = 0;
    let todayVolume = 0;
    let successfulCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    for (const tx of allTxs) {
      if (tx.createdAt >= today) {
        todayTxCount++;
        todayVolume += tx.totalAmount;
      }
      if (tx.status === 'SUCCESSFUL') successfulCount++;
      else if (tx.status === 'PENDING') pendingCount++;
      else if (tx.status === 'FAILED') failedCount++;
      else if (tx.status === 'REFUNDED') refundedCount++;
    }

    res.json({
      totalCustomers,
      todayTransactions: todayTxCount,
      todayTransactionValue: todayVolume,
      todayRevenue: Math.round(todayVolume * 0.03), // 3% margin
      successfulTransactions: successfulCount,
      pendingTransactions: pendingCount,
      failedTransactions: failedCount,
      refundedTransactions: refundedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate stats' });
  }
});

// 15. Admin: Users & Customers List
app.get('/api/admin/customers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    const customers = await UserModel.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
});

// 16. Admin: Adjust Customer Wallet
app.post('/api/admin/adjust-wallet', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customerId, amount, type, reason } = req.body;
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Mandatory audit reason must be provided' });
    }

    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const balanceBefore = customer.walletBalance;
    if (type === 'debit' && balanceBefore < numAmount) {
      return res.status(400).json({ error: 'Cannot debit more than available wallet balance' });
    }

    const balanceAfter = type === 'credit' ? balanceBefore + numAmount : balanceBefore - numAmount;
    customer.walletBalance = balanceAfter;
    await customer.save();

    const ref = `WAL-ADMIN-${type.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    await new WalletTransactionModel({
      userId: customer._id.toString(),
      type,
      amount: numAmount,
      balanceBefore,
      balanceAfter,
      reference: ref,
      description: `Admin manual adjustment: ${reason}`,
    }).save();

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'WALLET_ADJUSTMENT',
      targetUserId: customer._id.toString(),
      description: `${type.toUpperCase()} ₦${numAmount.toLocaleString('en-NG')} on account ${customer.email}. Reason: ${reason}`,
    }).save();

    res.json({
      success: true,
      customer: customer.toJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Wallet adjustment failed' });
  }
});

// 17. Admin: Process Refund
app.post('/api/admin/refund', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { transactionId, reason } = req.body;
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const tx = await TransactionModel.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (tx.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Transaction has already been refunded' });
    }

    tx.status = 'REFUNDED';
    tx.failureReason = reason || 'Admin executed refund';
    await tx.save();

    // Refund customer balance
    const customer = await UserModel.findById(tx.userId);
    if (customer) {
      const balBefore = customer.walletBalance;
      customer.walletBalance += tx.totalAmount;
      await customer.save();

      await new WalletTransactionModel({
        userId: customer._id.toString(),
        type: 'credit',
        amount: tx.totalAmount,
        balanceBefore: balBefore,
        balanceAfter: customer.walletBalance,
        reference: `REFUND-${tx.transactionReference}`,
        description: `Refund for ${tx.service} subscription: ${reason || 'Manual reversal'}`,
      }).save();

      await new NotificationModel({
        userId: customer._id.toString(),
        title: 'Refund Credited to Wallet',
        message: `₦${tx.totalAmount.toLocaleString('en-NG')} was refunded to your wallet for ${tx.transactionReference}.`,
        type: 'wallet',
        read: false,
      }).save();
    }

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'REFUND_ISSUED',
      transactionId: tx._id.toString(),
      targetUserId: tx.userId,
      description: `Refund of ₦${tx.totalAmount.toLocaleString('en-NG')} issued for ${tx.transactionReference}. Reason: ${reason}`,
    }).save();

    res.json({ success: true, transaction: tx.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Refund failed' });
  }
});

// 18. Admin: Resolve Pending Switch
app.post('/api/admin/resolve-pending', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { transactionId } = req.body;
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const tx = await TransactionModel.findById(transactionId);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tx.status = 'SUCCESSFUL';
    tx.providerResponse = 'Manual switch activation verified by administrator.';
    await tx.save();

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'PENDING_RESOLVED',
      transactionId: tx._id.toString(),
      targetUserId: tx.userId,
      description: `Resolved pending transaction ${tx.transactionReference} to SUCCESSFUL.`,
    }).save();

    res.json({ success: true, transaction: tx.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resolve transaction' });
  }
});

// 19. Admin: Packages (Full Management)
app.get('/api/admin/packages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    const packages = await CablePackageModel.find().sort({ service: 1, price: 1 });
    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch packages' });
  }
});

// Admin: Update Package Price & Config
app.put('/api/admin/packages/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    const { price, status, description, packageName } = req.body;
    const pkg = await CablePackageModel.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const oldPrice = pkg.price;
    if (price !== undefined) pkg.price = Number(price);
    if (status !== undefined) pkg.status = status;
    if (description !== undefined) pkg.description = description;
    if (packageName !== undefined) pkg.packageName = packageName;

    await pkg.save();

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'PACKAGE_PRICE_UPDATE',
      description: `Updated ${pkg.service} - ${pkg.packageName} price from ₦${oldPrice.toLocaleString('en-NG')} to ₦${pkg.price.toLocaleString('en-NG')}`,
    }).save();

    res.json({ success: true, package: pkg.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update package' });
  }
});

// 20. Admin: Services List
app.get('/api/admin/services', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    let services = await CableServiceModel.find();
    if (services.length === 0) {
      await seedDatabaseIfEmpty();
      services = await CableServiceModel.find();
    }
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch services' });
  }
});

// Admin: Toggle Service Status
app.post('/api/admin/services/:name/toggle', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    const { status, maintenanceMessage } = req.body;
    const serviceName = req.params.name;

    const srv = (await CableServiceModel.findOne({ name: serviceName as any })) as any;
    if (!srv) {
      return res.status(404).json({ error: 'Cable service not found' });
    }

    srv.status = status;
    if (maintenanceMessage !== undefined) srv.maintenanceMessage = maintenanceMessage;
    await srv.save();

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: status === 'active' ? 'SERVICE_ACTIVATED' : 'SERVICE_SUSPENDED',
      description: `${serviceName} switch marked as ${status.toUpperCase()}${maintenanceMessage ? `: "${maintenanceMessage}"` : ''}`,
    }).save();

    res.json({ success: true, service: srv.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle service' });
  }
});

// 21. Admin: Toggle Customer Status
app.post('/api/admin/customers/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    const { status } = req.body;
    const customer = await UserModel.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.status = status;
    await customer.save();

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: status === 'active' ? 'CUSTOMER_ACTIVATED' : 'CUSTOMER_SUSPENDED',
      targetUserId: customer._id.toString(),
      description: `Customer account ${customer.email} marked as ${status.toUpperCase()}.`,
    }).save();

    res.json({ success: true, customer: customer.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update customer status' });
  }
});

// 22. Admin: Audit Logs
app.get('/api/admin/audit-logs', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }
    const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
});

// 20. Admin: Broadcast Announcement
app.post('/api/admin/broadcast', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, message } = req.body;
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    await new NotificationModel({
      userId: 'all',
      title,
      message,
      type: 'system',
      read: false,
    }).save();

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'BROADCAST_SENT',
      description: `Broadcast sent to all users: "${title}"`,
    }).save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send broadcast' });
  }
});

// 23. Admin: VTpass Switch Health & Live Balance
app.get('/api/admin/vtpass/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const { balance, raw } = await getVtpassAccountBalance().catch(() => ({ balance: 0, raw: null }));

    res.json({
      email: process.env.VTPASS_EMAIL || 'sadjad578@gmail.com',
      baseUrl: process.env.VTPASS_BASE_URL || 'https://vtpass.com/api',
      environment: process.env.VTPASS_ENV || 'live',
      balance,
      status: 'Connected & Operational',
      lastChecked: new Date().toISOString(),
      raw,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to query VTpass switch status' });
  }
});

// 24. Admin: Synchronize Cable Bouquets from VTpass (DStv, StarTimes, GOtv)
app.post('/api/admin/vtpass/sync', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const { service } = req.query;
    let syncResult: any;

    if (service === 'dstv') {
      const dstvRes = await syncDstvPackagesFromVtpass();
      syncResult = { dstv: dstvRes, message: `Synchronized ${dstvRes.count} DStv bouquets.` };
    } else if (service === 'startimes') {
      const stRes = await syncStartimesPackagesFromVtpass();
      syncResult = { startimes: stRes, message: `Synchronized ${stRes.count} StarTimes bouquets.` };
    } else if (service === 'gotv') {
      const gotvRes = await syncGotvPackagesFromVtpass();
      syncResult = { gotv: gotvRes, message: `Synchronized ${gotvRes.count} GOtv bouquets.` };
    } else {
      syncResult = await syncAllPackagesFromVtpass();
    }

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'VTPASS_BOUQUET_SYNC',
      description: `Synchronized official live bouquets from VTpass. Purged old sandbox: ${syncResult.purgedOld || 0}. DStv: ${syncResult.dstv?.count || 0}, StarTimes: ${syncResult.startimes?.count || 0}, GOtv: ${syncResult.gotv?.count || 0}.`,
    }).save();

    res.json({
      success: true,
      message: 'Successfully synchronized live bouquets and removed all sandbox prices from VTpass.',
      ...syncResult,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to synchronize bouquets from VTpass' });
  }
});

// 25. Admin: Requery VTpass Transaction Status
app.post('/api/admin/transactions/:id/requery', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ error: 'Administrative privileges required' });
    }

    const tx = await TransactionModel.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const reqId = tx.requestId || tx.transactionReference;
    const requeryData = await requeryVtpassTransaction(reqId);
    console.log(`[VTpass Requery] Result for ${reqId}:`, JSON.stringify(requeryData));

    let updated = false;
    if (requeryData && requeryData.code === '000') {
      const txStatus = requeryData.content?.transactions?.status?.toLowerCase();
      if (txStatus === 'delivered' || requeryData.response_description === 'TRANSACTION SUCCESSFUL') {
        tx.status = 'SUCCESSFUL';
        tx.providerResponse = `VTpass Requery: ${requeryData.response_description || 'Delivered'}`;
        await tx.save();
        updated = true;
      }
    }

    await new AuditLogModel({
      adminId: req.user._id.toString(),
      adminName: req.user.fullName,
      action: 'TRANSACTION_REQUERIED',
      transactionId: tx.transactionReference,
      description: `VTpass requery executed for ${tx.transactionReference}. Response code: ${requeryData?.code}. Status updated: ${updated}`,
    }).save();

    res.json({
      success: true,
      transaction: tx.toJSON(),
      requeryResult: requeryData,
      statusUpdated: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'VTpass requery failed' });
  }
});

// ================= FRONTEND VITE INTEGRATION =================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JDpay Server] Running full-stack on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server in non-Vercel environments (Vercel invokes via serverless function)
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
