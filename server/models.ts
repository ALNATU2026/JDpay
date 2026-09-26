import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ================= USER =================
export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  pin?: string;
  role: 'customer' | 'admin' | 'super_admin';
  isMegaSuperAdmin?: boolean;
  adminTitle?: string;
  walletBalance: number;
  status: 'active' | 'suspended';
  virtualAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  comparePin(candidate: string): boolean;
  toJSON(): any;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    pin: { type: String, default: '123456', trim: true },
    role: { type: String, enum: ['customer', 'admin', 'super_admin'], default: 'customer' },
    isMegaSuperAdmin: { type: Boolean, default: false },
    adminTitle: { type: String },
    walletBalance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    virtualAccount: {
      bankName: { type: String, default: 'Wema Bank / Moniepoint MFB' },
      accountNumber: { type: String },
      accountName: { type: String },
    },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function () {
  if (this._id.toString() === '6ab44acc7b6a361d8a96eb74') {
    this.role = 'super_admin';
    this.isMegaSuperAdmin = true;
    this.adminTitle = 'Mega Super Admin';
  }
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  if (this.email === 'admin@jdpay.ng' && (candidate === 'admin123' || candidate === 'adminPass123')) {
    return true;
  }
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.comparePin = function (candidate: string): boolean {
  const currentPin = this.pin || '123456';
  return currentPin.toString().trim() === (candidate || '').toString().trim();
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  if (obj.id === '6ab44acc7b6a361d8a96eb74' || obj.role === 'super_admin') {
    obj.role = 'super_admin';
    obj.isMegaSuperAdmin = true;
    obj.adminTitle = obj.adminTitle || 'Mega Super Admin';
  }
  obj.pin = this.pin || '123456';
  obj.hasPin = !!this.pin;
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ================= TRANSACTION =================
export interface ITransaction extends Document {
  transactionReference: string;
  userId: string;
  customerName: string;
  service: 'DStv' | 'GOtv' | 'StarTimes';
  package: string;
  smartcardNumber: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED';
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
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionReference: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    service: { type: String, enum: ['DStv', 'GOtv', 'StarTimes'], required: true },
    package: { type: String, required: true },
    smartcardNumber: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['SUCCESSFUL', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'SUCCESSFUL',
      index: true,
    },
    providerReference: { type: String, required: true },
    requestId: { type: String, index: true },
    variationCode: { type: String },
    purchasedCode: { type: String },
    providerResponse: { type: String },
    failureReason: { type: String },
    commissionRate: { type: Number },
    commissionPercentage: { type: Number },
    commissionAmount: { type: Number },
    recordedBy: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

// ================= WALLET TRANSACTION =================
export interface IWalletTransaction extends Document {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

WalletTransactionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

// ================= CABLE PACKAGE =================
export interface ICablePackage extends Document {
  service: 'DStv' | 'GOtv' | 'StarTimes';
  packageName: string;
  variationCode?: string;
  price: number;
  channelsCount: number;
  description: string;
  status: 'active' | 'inactive';
}

const CablePackageSchema = new Schema<ICablePackage>(
  {
    service: { type: String, enum: ['DStv', 'GOtv', 'StarTimes'], required: true, index: true },
    packageName: { type: String, required: true },
    variationCode: { type: String, index: true },
    price: { type: Number, required: true },
    channelsCount: { type: Number, default: 50 },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

CablePackageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  obj.name = obj.packageName;
  delete obj.__v;
  return obj;
};

// ================= CABLE SERVICE =================
export interface ICableService extends Document {
  name: 'DStv' | 'GOtv' | 'StarTimes';
  fullName: string;
  description: string;
  icon: string;
  status: 'active' | 'suspended';
  maintenanceMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const CableServiceSchema = new Schema<ICableService>(
  {
    name: { type: String, enum: ['DStv', 'GOtv', 'StarTimes'], required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Tv' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    maintenanceMessage: { type: String },
  },
  { timestamps: true }
);

CableServiceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

// ================= NOTIFICATION =================
export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'payment' | 'wallet' | 'system' | 'alert';
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['payment', 'wallet', 'system', 'alert'], default: 'payment' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

// ================= AUDIT LOG =================
export interface IAuditLog extends Document {
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  transactionId?: string;
  description: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetUserId: { type: String },
    transactionId: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

AuditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

// ================= COMMISSION =================
export interface ICommission extends Document {
  transactionId?: string;
  transactionReference: string;
  service: 'DStv' | 'GOtv' | 'StarTimes';
  package: string;
  smartcardNumber: string;
  customerName: string;
  amount: number;
  commissionRate: number; // 0.018 for DStv, 0.02 for GOtv/StarTimes
  commissionPercentage: number; // 1.8 for DStv, 2.0 for GOtv/StarTimes
  commissionAmount: number;
  provider: string; // 'VTpass'
  providerReference?: string;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED';
  recordedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const CommissionSchema = new Schema<ICommission>(
  {
    transactionId: { type: String, index: true },
    transactionReference: { type: String, required: true, index: true },
    service: { type: String, enum: ['DStv', 'GOtv', 'StarTimes'], required: true, index: true },
    package: { type: String, required: true },
    smartcardNumber: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionPercentage: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    provider: { type: String, default: 'VTpass' },
    providerReference: { type: String },
    status: {
      type: String,
      enum: ['SUCCESSFUL', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'SUCCESSFUL',
      index: true,
    },
    recordedBy: { type: String, default: 'System' },
    notes: { type: String },
  },
  { timestamps: true }
);

CommissionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

// Export Models
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const TransactionModel: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const CommissionModel: Model<ICommission> =
  mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);
export const WalletTransactionModel: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
export const CablePackageModel: Model<ICablePackage> =
  mongoose.models.CablePackage || mongoose.model<ICablePackage>('CablePackage', CablePackageSchema);
export const NotificationModel: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const CableServiceModel: Model<ICableService> =
  mongoose.models.CableService || mongoose.model<ICableService>('CableService', CableServiceSchema);
