import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Shield,
  Wallet,
  Ban,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  X,
  History,
  Eye,
  Crown,
  RefreshCw,
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

  // Modals
  const [walletModalCustomer, setWalletModalCustomer] = useState<User | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<number>(5000);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Customer Detail View Modal
  const [detailCustomer, setDetailCustomer] = useState<User | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<Transaction[]>([]);

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

  const handleToggleStatus = async (customer: User) => {
    const newStatus: UserStatus = customer.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to mark ${customer.fullName} as ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.toggleCustomerStatus(customer.id, newStatus, adminUser.id, adminUser.fullName);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update customer status');
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

      setWalletModalCustomer(null);
      setAdjustReason('');
      setRefreshKey((k) => k + 1);
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Customer Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View registered user profiles, monitor wallet balances, execute adjustments with audit logs, and manage account statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Total Customers: <span className="font-bold text-slate-900">{customers.length}</span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, phone or account ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts Only</option>
            <option value="suspended">Suspended Accounts Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
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
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6 text-right">Wallet Balance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6">Registered</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{c.fullName}</span>
                        {isMegaSuperAdminUser(c) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                            Mega Super Admin
                          </span>
                        ) : c.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            Admin
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap">{c.email}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600 whitespace-nowrap">
                      {c.phone}
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                      ₦{c.walletBalance.toLocaleString('en-NG')}.00
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View details */}
                        <button
                          type="button"
                          onClick={() => setDetailCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Customer Details & Ledger"
                        >
                          <Eye className="w-4 h-4" />
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                          title="Credit or Debit Customer Wallet"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>

                        {/* Toggle active / suspended */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.status === 'active'
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
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

      {/* WALLET ADJUSTMENT MODAL (MANDATORY AUDIT REASON) */}
      {walletModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Customer Wallet</h3>
                <p className="text-xs text-slate-500">
                  {walletModalCustomer.fullName} ({walletModalCustomer.email})
                </p>
              </div>
              <button
                onClick={() => setWalletModalCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
              <span className="text-purple-800 font-medium">Current Balance:</span>
              <span className="font-black text-purple-950 tabular-nums">
                ₦{walletModalCustomer.walletBalance.toLocaleString('en-NG')}.00
              </span>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleExecuteWalletAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      adjustType === 'credit'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    + Credit Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      adjustType === 'debit'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    - Debit Customer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (NGN) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Manual reconciliation for failed bank transfer ref WAL-10293 or promo credit"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This reason will be logged in the immutable administrative audit trail and customer notification.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletModalCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Profile & Ledger</h3>
                <p className="text-xs text-slate-500 font-mono">{detailCustomer.id}</p>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name</span>
                <span className="font-bold text-slate-900">{detailCustomer.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                <span className="text-slate-700 truncate block">{detailCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                <span className="font-mono text-slate-700">{detailCustomer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Balance</span>
                <span className="font-black text-emerald-600 tabular-nums">
                  ₦{detailCustomer.walletBalance.toLocaleString('en-NG')}.00
                </span>
              </div>
            </div>

            {/* Wallet Ledger History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-600" />
                Wallet Ledger Transactions
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {walletService.getWalletTransactions(detailCustomer.id).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No ledger transactions recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4 text-right">Balance After</th>
                        <th className="py-2.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {walletService
                        .getWalletTransactions(detailCustomer.id)
                        .slice(0, 5)
                        .map((wtx) => (
                          <tr key={wtx.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-4 tabular-nums text-slate-500">
                              {new Date(wtx.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`font-bold uppercase text-[10px] ${
                                  wtx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {wtx.type}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right font-bold tabular-nums">
                              {wtx.type === 'credit' ? '+' : '-'}₦{wtx.amount.toLocaleString('en-NG')}
                            </td>
                            <td className="py-2 px-4 text-right tabular-nums text-slate-500">
                              ₦{wtx.balanceAfter.toLocaleString('en-NG')}
                            </td>
                            <td className="py-2 px-4 text-slate-600 truncate max-w-[200px]">
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                Recent Cable Payments
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {detailTransactions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No cable payments recorded.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Ref</th>
                        <th className="py-2.5 px-4">Service</th>
                        <th className="py-2.5 px-4">Package</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailTransactions
                        .slice(0, 5)
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-2 px-4 font-mono text-[11px]">{tx.transactionReference}</td>
                            <td className="py-2 px-4 font-semibold text-blue-600">{tx.service}</td>
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
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
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
