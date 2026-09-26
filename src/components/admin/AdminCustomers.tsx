import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Shield,
  Wallet,
  Ban,
  CheckCircle2,
  AlertTriangle,
  X,
  History,
  Eye,
  Crown,
  RefreshCw,
  KeyRound,
  Edit,
  Lock,
  RotateCcw,
  Check,
  AlertCircle,
  EyeOff,
} from 'lucide-react';
import { User, UserStatus, isMegaSuperAdminUser, Transaction } from '../../types';
import { adminService } from '../../services/adminService';
import { walletService } from '../../services/walletService';
import { transactionService } from '../../services/transactionService';

interface AdminCustomersProps {
  adminUser: User;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ adminUser }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification / Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Wallet Modal
  const [walletModalCustomer, setWalletModalCustomer] = useState<User | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<number>(5000);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Customer Detail View Modal
  const [detailCustomer, setDetailCustomer] = useState<User | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<Transaction[]>([]);

  // Edit Customer & Password Modal
  const [editCustomer, setEditCustomer] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'customer',
    status: 'active',
    newPassword: '',
    pin: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Reset PIN Confirmation Dialog
  const [pinResetCustomer, setPinResetCustomer] = useState<User | null>(null);
  const [isResettingPin, setIsResettingPin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    adminService
      .getCustomers(search, statusFilter)
      .then((data) => {
        if (isMounted) {
          setCustomers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[AdminCustomers] Load error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, refreshKey]);

  useEffect(() => {
    if (detailCustomer) {
      transactionService
        .fetchLiveTransactions()
        .then((all) => {
          setDetailTransactions(all.filter((t) => t.userId === detailCustomer.id));
        })
        .catch(() => {
          setDetailTransactions(transactionService.getUserTransactions(detailCustomer.id));
        });
    }
  }, [detailCustomer]);

  const handleOpenEdit = (customer: User) => {
    setEditCustomer(customer);
    setEditForm({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      role: customer.role || 'customer',
      status: customer.status || 'active',
      newPassword: '',
      pin: customer.pin || '123456',
    });
    setEditError('');
    setShowEditPassword(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    setIsSavingEdit(true);
    setEditError('');

    try {
      const payload: any = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        status: editForm.status,
      };

      if (editForm.newPassword.trim()) {
        if (editForm.newPassword.trim().length < 6) {
          setEditError('Password must be at least 6 characters.');
          setIsSavingEdit(false);
          return;
        }
        payload.newPassword = editForm.newPassword.trim();
      }

      if (editForm.pin.trim()) {
        if (!/^\d{6}$/.test(editForm.pin.trim())) {
          setEditError('PIN must be exactly 6 numeric digits.');
          setIsSavingEdit(false);
          return;
        }
        payload.pin = editForm.pin.trim();
      }

      await adminService.updateCustomer(editCustomer.id, payload);
      setFeedback({
        type: 'success',
        text: `Account details for ${editForm.fullName} updated successfully.${payload.newPassword ? ' New password has been applied.' : ''}`,
      });
      setEditCustomer(null);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user details.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExecuteResetPin = async (customer: User) => {
    setIsResettingPin(true);
    try {
      const res = await adminService.resetCustomerPin(customer.id);
      setFeedback({
        type: 'success',
        text: `Success! Transaction PIN for ${customer.fullName} (${customer.email}) has been reset to default: 123456`,
      });
      setPinResetCustomer(null);
      setRefreshKey((k) => k + 1);
      if (detailCustomer && detailCustomer.id === customer.id) {
        setDetailCustomer({ ...detailCustomer, pin: '123456' });
      }
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to reset customer PIN to default.',
      });
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleToggleStatus = async (customer: User) => {
    const newStatus: UserStatus = customer.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to mark ${customer.fullName} as ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.toggleCustomerStatus(customer.id, newStatus, adminUser.id, adminUser.fullName);
      setFeedback({
        type: 'success',
        text: `Account status for ${customer.fullName} changed to ${newStatus.toUpperCase()}.`,
      });
      setRefreshKey((k) => k + 1);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update customer status',
      });
    }
  };

  const handleExecuteWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalCustomer) return;
    if (adjustAmount <= 0) {
      setAdjustError('Amount must be greater than zero.');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('A mandatory reason is required for any administrative wallet modification.');
      return;
    }

    setIsAdjusting(true);
    setAdjustError('');

    try {
      await adminService.adjustWallet(
        adminUser.id,
        adminUser.fullName,
        walletModalCustomer.id,
        adjustAmount,
        adjustType,
        adjustReason
      );

      setFeedback({
        type: 'success',
        text: `Wallet of ${walletModalCustomer.fullName} adjusted successfully by ₦${adjustAmount.toLocaleString('en-NG')} (${adjustType.toUpperCase()}).`,
      });
      setWalletModalCustomer(null);
      setAdjustReason('');
      setRefreshKey((k) => k + 1);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust wallet balance.');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage user accounts, reset transaction PINs to default (123456), edit credentials and passwords, and adjust balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            Total Customers: <span className="font-bold text-slate-900 dark:text-white">{customers.length}</span>
          </span>
        </div>
      </div>

      {/* Global Action Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3 transition-colors">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, phone or account ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts Only</option>
            <option value="suspended">Suspended Accounts Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
            <span>Querying MongoDB database customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No customers match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6 text-right">Wallet Balance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">PIN Status</th>
                  <th className="py-3 px-6">Registered</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{c.fullName}</span>
                        {isMegaSuperAdminUser(c) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                            Mega Super Admin
                          </span>
                        ) : c.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Admin
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.email}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {c.phone}
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                      ₦{c.walletBalance.toLocaleString('en-NG')}.00
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                        <KeyRound className="w-3 h-3" />
                        <span>{c.pin ? (c.pin === '123456' ? 'Default (123456)' : 'Custom') : '123456'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset PIN to default (123456) button */}
                        <button
                          type="button"
                          onClick={() => setPinResetCustomer(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                          title="Reset user's 6-digit transaction PIN to default (123456)"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset PIN</span>
                        </button>

                        {/* Edit details & password button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                          title="Edit Customer Details & Change Password"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Adjust wallet */}
                        <button
                          type="button"
                          onClick={() => {
                            setWalletModalCustomer(c);
                            setAdjustAmount(5000);
                            setAdjustReason('');
                            setAdjustError('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                          title="Credit or Debit Customer Wallet"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>

                        {/* View details */}
                        <button
                          type="button"
                          onClick={() => setDetailCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="View Customer Details & Ledger"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Toggle active / suspended */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            c.status === 'active'
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={c.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                        >
                          {c.status === 'active' ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM RESET PIN TO DEFAULT (123456) MODAL */}
      {pinResetCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Transaction PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setPinResetCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Are you sure you want to reset the 6-digit transaction & login PIN for:
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                <span className="font-bold text-slate-900 dark:text-white block font-sans text-sm">
                  {pinResetCustomer.fullName}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block">{pinResetCustomer.email}</span>
                <span className="text-slate-500 dark:text-slate-400 block">{pinResetCustomer.phone}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 space-y-1">
                <span className="font-bold block">Action Summary:</span>
                <p className="text-[11px] leading-relaxed">
                  The user's transaction PIN will immediately be reset to the system default: <strong className="font-mono text-base px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 rounded">123456</strong>.
                  An immutable audit log will be created, and the user will receive an in-app security notice.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPinResetCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResettingPin}
                onClick={() => handleExecuteResetPin(pinResetCustomer)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isResettingPin ? (
                  <>
                    <span className="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Resetting to 123456...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Confirm Reset to 123456</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER DETAILS & PASSWORD MODAL */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Customer Details & Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    ID: {editCustomer.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="customer">Customer (Standard)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Set New Password */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Manage User Password</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Leave blank to keep current</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Enter new password (optional)"
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Manage 6-Digit PIN */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>6-Digit Transaction PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, pin: '123456' })}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset to Default 123456
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={editForm.pin}
                  onChange={(e) => setEditForm({ ...editForm, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="123456"
                  className="w-full sm:w-48 px-3 py-2 font-mono tracking-widest text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Customer Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALLET ADJUSTMENT MODAL */}
      {walletModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Adjust Customer Wallet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {walletModalCustomer.fullName} ({walletModalCustomer.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWalletModalCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-800 flex items-center justify-between text-xs">
              <span className="text-purple-800 dark:text-purple-300 font-medium">Current Balance:</span>
              <span className="font-black text-purple-950 dark:text-white tabular-nums">
                ₦{walletModalCustomer.walletBalance.toLocaleString('en-NG')}.00
              </span>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleExecuteWalletAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      adjustType === 'credit'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Credit Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      adjustType === 'debit'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    - Debit Customer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (NGN) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Manual reconciliation for failed bank transfer ref WAL-10293 or promo credit"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletModalCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isAdjusting ? 'Processing...' : 'Execute Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL & LEDGER MODAL */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Profile & Ledger</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{detailCustomer.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailCustomer.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                <span className="text-slate-700 dark:text-slate-300 truncate block">{detailCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{detailCustomer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Balance</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₦{detailCustomer.walletBalance.toLocaleString('en-NG')}.00
                </span>
              </div>
            </div>

            {/* Quick Admin Actions Row */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Actions:</span>
              <button
                type="button"
                onClick={() => {
                  const target = detailCustomer;
                  setDetailCustomer(null);
                  setPinResetCustomer(target);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset PIN to Default (123456)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = detailCustomer;
                  setDetailCustomer(null);
                  handleOpenEdit(target);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Details & Password</span>
              </button>
            </div>

            {/* Wallet Ledger History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Wallet Ledger Transactions
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {walletService.getWalletTransactions(detailCustomer.id).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No ledger transactions recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4 text-right">Balance After</th>
                        <th className="py-2.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {walletService
                        .getWalletTransactions(detailCustomer.id)
                        .slice(0, 5)
                        .map((wtx) => (
                          <tr key={wtx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-4 tabular-nums text-slate-500 dark:text-slate-400">
                              {new Date(wtx.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`font-bold uppercase text-[10px] ${
                                  wtx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {wtx.type}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right font-bold tabular-nums">
                              {wtx.type === 'credit' ? '+' : '-'}₦{wtx.amount.toLocaleString('en-NG')}
                            </td>
                            <td className="py-2 px-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                              ₦{wtx.balanceAfter.toLocaleString('en-NG')}
                            </td>
                            <td className="py-2 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                              {wtx.description}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Cable Subscriptions for this customer */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
                Recent Cable Payments
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {detailTransactions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No cable payments recorded.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Ref</th>
                        <th className="py-2.5 px-4">Service</th>
                        <th className="py-2.5 px-4">Package</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {detailTransactions
                        .slice(0, 5)
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-2 px-4 font-mono text-[11px]">{tx.transactionReference}</td>
                            <td className="py-2 px-4 font-semibold text-blue-600 dark:text-blue-400">{tx.service}</td>
                            <td className="py-2 px-4">{tx.package}</td>
                            <td className="py-2 px-4 text-right font-bold tabular-nums">
                              ₦{tx.totalAmount.toLocaleString('en-NG')}
                            </td>
                            <td className="py-2 px-4 text-center font-bold text-[10px]">
                              {tx.status}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
