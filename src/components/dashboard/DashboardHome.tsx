import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  ArrowRight,
  PlusCircle,
  Tv,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Transaction, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ReceiptModal } from '../common/ReceiptModal';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';
import { transactionService } from '../../services/transactionService';
import { api } from '../../services/api';

interface DashboardHomeProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ currentUser, onNavigate }) => {
  const [userTransactions, setUserTransactions] = useState<Transaction[]>(
    transactionService.getUserTransactions(currentUser.id)
  );
  const [liveBalance, setLiveBalance] = useState<number>(currentUser.walletBalance);
  const [loading, setLoading] = useState(true);

  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [txs, balRes] = await Promise.all([
        transactionService.fetchUserTransactions(currentUser.id),
        api.wallet.getBalance().catch(() => ({ balance: currentUser.walletBalance })),
      ]);
      setUserTransactions(txs);
      if (typeof balRes.balance === 'number') {
        setLiveBalance(balRes.balance);
      }
    } catch (err) {
      console.error('[DashboardHome] Error fetching user live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser.id]);

  // Real Statistics
  const totalTxCount = userTransactions.length;
  const successfulCount = userTransactions.filter((t) => t.status === 'SUCCESSFUL').length;
  const pendingCount = userTransactions.filter((t) => t.status === 'PENDING').length;

  const recentTxs = userTransactions.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Welcome back, {currentUser.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your wallet, renew cable TV decoders, and download digital receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard/fund-wallet')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Fund Wallet
          </button>
        </div>
      </div>

      {/* ================= WALLET CARD & STATS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wallet Showcase Card */}
        <div className="lg:col-span-6 bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between border border-slate-800">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                JDpay Digital Wallet
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active & Verified
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-400 block font-medium">Available Balance</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tabular-nums tracking-tight">
                ₦{liveBalance.toLocaleString('en-NG')}.00
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/dashboard/fund-wallet')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
              Fund Wallet
            </button>
            <button
              onClick={() => onNavigate('/dashboard/transactions')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              View Transactions
            </button>
          </div>
        </div>

        {/* 3 Metric Stat Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Transactions</span>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {totalTxCount}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Lifetime activity
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Successful Payments</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
                {successfulCount}
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-3 pt-3 border-t border-slate-100">
              ✓ 98.8% Success rate
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Pending Payments</span>
              <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
                {pendingCount}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
              Switch confirmations
            </p>
          </div>
        </div>
      </div>

      {/* ================= QUICK CABLE TV PAYMENT ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick Cable TV Payment</h2>
            <p className="text-xs text-slate-500">
              Select your service to begin Smartcard/IUC verification and renewal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Pay DStv Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
                DStv
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">DStv Subscription</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Compact, Compact Plus, Confam, Yanga & Premium bouquets.
                </p>
              </div>
            </div>

            <div className="pt-5">
              <button
                onClick={() => onNavigate('/dashboard/cable/dstv')}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>Pay DStv</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pay GOtv Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
                GOtv
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">GOtv Subscription</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Supa+, Supa, Max, Jolli, Jinja & Smallie packages.
                </p>
              </div>
            </div>

            <div className="pt-5">
              <button
                onClick={() => onNavigate('/dashboard/cable/gotv')}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>Pay GOtv</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pay StarTimes Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs text-center shadow-xs group-hover:scale-105 transition-transform">
                Star<br />Times
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">StarTimes Subscription</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Super, Classic, Basic, Special & Nova bouquets.
                </p>
              </div>
            </div>

            <div className="pt-5">
              <button
                onClick={() => onNavigate('/dashboard/cable/startimes')}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>Pay StarTimes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT TRANSACTIONS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Your latest cable subscription payments.</p>
          </div>
          <button
            onClick={() => onNavigate('/dashboard/transactions')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No transactions yet. Click &quot;Pay Cable TV&quot; to make your first subscription payment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Customer / Smartcard</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Transaction ID</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-blue-600" />
                        <span>{tx.service}</span>
                        <span className="text-slate-400 font-normal">({tx.package})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{tx.customerName}</div>
                      <div className="text-slate-400 font-mono text-[11px] tabular-nums">
                        {tx.smartcardNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                      ₦{tx.totalAmount.toLocaleString('en-NG')}.00
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {tx.transactionReference}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailTx(tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {tx.status === 'SUCCESSFUL' && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/60 transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptTx)}
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />

      <TransactionDetailsModal
        isOpen={Boolean(selectedDetailTx)}
        transaction={selectedDetailTx}
        onClose={() => setSelectedDetailTx(null)}
        onOpenReceipt={(tx) => setSelectedReceiptTx(tx)}
      />
    </div>
  );
};
