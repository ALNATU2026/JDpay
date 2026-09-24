import React, { useState, useEffect } from 'react';
import {
  XCircle,
  RotateCcw,
  Search,
  Tv,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Transaction, User } from '../../types';
import { transactionService } from '../../services/transactionService';
import { adminService } from '../../services/adminService';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';

interface AdminFailedTransactionsProps {
  adminUser: User;
}

export const AdminFailedTransactions: React.FC<AdminFailedTransactionsProps> = ({ adminUser }) => {
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);
  const [failedList, setFailedList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFailed = async () => {
    try {
      setLoading(true);
      const data = await transactionService.fetchLiveTransactions({ status: 'FAILED' });
      setFailedList(data);
    } catch (err) {
      console.error('[AdminFailedTransactions] Error loading failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailed();
  }, [refreshKey]);

  const allFailed = failedList.filter(
    (t) =>
      t.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.smartcardNumber.includes(search)
  );

  const handleRefundFailed = async (tx: Transaction) => {
    const reason = window.prompt(
      `Issue wallet refund for failed transaction ${tx.transactionReference}:`,
      tx.failureReason || 'Failed switch request compensation'
    );
    if (!reason) return;

    try {
      await adminService.processRefund(tx.id, adminUser.id, adminUser.fullName, reason);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to refund transaction');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Failed Transactions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              {allFailed.length} Logged
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review rejected switch responses, invalid decoder queries, and initiate wallet compensation.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference or decoder..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {allFailed.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Failed Transactions</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Platform switch gateway is operating with 100% throughput success.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Service / Package</th>
                  <th className="py-3 px-6">Customer / Decoder</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6">Failure Reason / Switch Code</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allFailed.map((tx) => (
                  <tr key={tx.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-NG')}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {tx.transactionReference}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5 text-blue-600" />
                        <span>{tx.service}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{tx.package}</span>
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
                    <td className="py-3.5 px-6 max-w-xs">
                      <span className="text-rose-700 font-medium text-xs bg-rose-50 px-2 py-1 rounded border border-rose-200/60 block truncate">
                        {tx.failureReason || 'SWITCH_COMMUNICATION_FAULT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailTx(tx)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRefundFailed(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Refund Wallet</span>
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

      <TransactionDetailsModal
        isOpen={Boolean(selectedDetailTx)}
        transaction={selectedDetailTx}
        onClose={() => setSelectedDetailTx(null)}
      />
    </div>
  );
};
