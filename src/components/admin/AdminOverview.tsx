import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Tv,
  ArrowRight,
  Eye,
  Receipt,
  Download,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { transactionService } from '../../services/transactionService';
import { StatusBadge } from '../common/StatusBadge';
import { ReceiptModal } from '../common/ReceiptModal';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';
import { Transaction, AdminStats } from '../../types';

interface AdminOverviewProps {
  onNavigate: (path: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalCustomers: 0,
    todayTransactions: 0,
    todayTransactionValue: 0,
    todayRevenue: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    refundedTransactions: 0,
  });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);

  const loadLiveData = async () => {
    try {
      const [liveStats, liveTxs] = await Promise.all([
        adminService.getStats(),
        transactionService.fetchLiveTransactions(),
      ]);
      setStats(liveStats);
      setAllTransactions(liveTxs);
    } catch (err) {
      console.error('[AdminOverview] Error loading live DB data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLiveData();
  };

  const recentTransactions = allTransactions.slice(0, 6);

  // Calculate volume distribution from actual MongoDB transactions
  const dstvCount = allTransactions.filter((t) => t.service === 'DStv').length;
  const gotvCount = allTransactions.filter((t) => t.service === 'GOtv').length;
  const startimesCount = allTransactions.filter((t) => t.service === 'StarTimes').length;
  const totalServices = dstvCount + gotvCount + startimesCount;

  const dstvPct = totalServices > 0 ? Math.round((dstvCount / totalServices) * 100) : 0;
  const gotvPct = totalServices > 0 ? Math.round((gotvCount / totalServices) * 100) : 0;
  const startimesPct = totalServices > 0 ? Math.max(0, 100 - dstvPct - gotvPct) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Administrative Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-broadcaster switch monitoring, customer wallet ledgers, and transaction reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Sync with MongoDB database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/pending')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Pending Queue ({stats.pendingTransactions})</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Daily Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (8 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            {stats.totalCustomers.toLocaleString('en-NG')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active JDpay customer accounts</p>
        </div>

        {/* Today's Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            {stats.todayTransactions.toLocaleString('en-NG')}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-2">↑ 14.2% vs yesterday</p>
        </div>

        {/* Today's Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            ₦{stats.todayTransactionValue.toLocaleString('en-NG')}.00
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Gross subscription throughput</p>
        </div>

        {/* Today's Margin/Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Platform Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 tabular-nums">
            ₦{stats.todayRevenue.toLocaleString('en-NG')}.00
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Switch margin & commission</p>
        </div>
      </div>

      {/* Secondary Status Breakdown (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
              Successful
            </span>
            <span className="text-xl font-black text-emerald-600 tabular-nums">
              {stats.successfulTransactions.toLocaleString('en-NG')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
              Pending Switch
            </span>
            <span className="text-xl font-black text-amber-600 tabular-nums">
              {stats.pendingTransactions.toLocaleString('en-NG')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
              Failed Attempts
            </span>
            <span className="text-xl font-black text-rose-600 tabular-nums">
              {stats.failedTransactions.toLocaleString('en-NG')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
              Wallet Refunds
            </span>
            <span className="text-xl font-black text-blue-600 tabular-nums">
              {stats.refundedTransactions.toLocaleString('en-NG')}
            </span>
          </div>
        </div>
      </div>

      {/* Service Distribution Showcase */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Broadcaster Volume Share
            </h3>
            <p className="text-xs text-slate-500">Distribution of subscription renewals by provider.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums">100% Normalized</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <div style={{ width: `${dstvPct}%` }} className="bg-blue-600" title={`DStv: ${dstvPct}%`} />
          <div style={{ width: `${gotvPct}%` }} className="bg-emerald-500" title={`GOtv: ${gotvPct}%`} />
          <div style={{ width: `${startimesPct}%` }} className="bg-indigo-600" title={`StarTimes: ${startimesPct}%`} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">DStv ({dstvPct}%)</span>
              <p className="text-[11px] text-slate-500">MultiChoice Nigeria</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">GOtv ({gotvPct}%)</span>
              <p className="text-[11px] text-slate-500">MultiChoice Terrestrial</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">StarTimes ({startimesPct}%)</span>
              <p className="text-[11px] text-slate-500">StarTimes Media</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Platform Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Platform Transactions</h3>
            <p className="text-xs text-slate-500">Latest subscriber transactions across all decoders.</p>
          </div>
          <button
            onClick={() => onNavigate('/admin/transactions')}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Service</th>
                <th className="py-3 px-6">Customer / Smartcard</th>
                <th className="py-3 px-6 text-right">Amount</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Reference</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
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
                    <div className="font-semibold text-slate-900">{tx.customerName}</div>
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
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
