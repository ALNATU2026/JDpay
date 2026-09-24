import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Search,
  Tv,
  Clock,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Transaction, User } from '../../types';
import { transactionService } from '../../services/transactionService';
import { adminService } from '../../services/adminService';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';

interface AdminPendingTransactionsProps {
  adminUser: User;
}

export const AdminPendingTransactions: React.FC<AdminPendingTransactionsProps> = ({ adminUser }) => {
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [requeryingId, setRequeryingId] = useState<string | null>(null);

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await transactionService.fetchLiveTransactions({ status: 'PENDING' });
      setPendingTxs(data);
    } catch (err) {
      console.error('[AdminPendingTransactions] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [refreshKey]);

  // Filter only PENDING
  const allPending = pendingTxs.filter(
    (t) =>
      t.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.smartcardNumber.includes(search)
  );

  const handleRequeryVtpass = async (tx: Transaction) => {
    try {
      setRequeryingId(tx.id);
      const res = await adminService.requeryTransaction(tx.id);
      if (res.statusUpdated) {
        alert(`VTpass Switch query confirmed delivered! Transaction marked SUCCESSFUL.`);
      } else {
        alert(`VTpass Switch Status: ${res.requeryResult?.response_description || 'Transaction still processing on switch'}`);
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'VTpass requery failed');
    } finally {
      setRequeryingId(null);
    }
  };

  const handleResolveSuccessful = async (tx: Transaction) => {
    const confirm = window.confirm(
      `Confirm with Switch: Mark transaction ${tx.transactionReference} for ${tx.customerName} as SUCCESSFUL?`
    );
    if (!confirm) return;

    try {
      await adminService.resolvePendingTransaction(
        tx.id,
        'SUCCESSFUL',
        adminUser.id,
        adminUser.fullName,
        'Switch confirmation received via MultiChoice API query.'
      );
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve transaction');
    }
  };

  const handleDeclineAndRefund = async (tx: Transaction) => {
    const reason = window.prompt(
      `Decline & Refund: Enter refund reason for ${tx.transactionReference}:`,
      'Switch activation timeout - refunded to customer wallet.'
    );
    if (reason === null) return;

    try {
      await adminService.resolvePendingTransaction(
        tx.id,
        'REFUNDED',
        adminUser.id,
        adminUser.fullName,
        reason || 'Timeout refund'
      );
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
              Pending Transactions Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {allPending.length} in Queue
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Subscriptions awaiting final acknowledgement from MultiChoice or StarTimes switch gateways.
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
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Info notice */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Automated Re-query in Progress:</span> The background worker
          queries upstream broadcaster switches every 120 seconds. If a customer is waiting, you can
          manually query the switch and resolve to Successful or refund their wallet immediately.
        </div>
      </div>

      {/* Pending Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {allPending.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Queue is Clear!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no pending switch activations requiring manual administrative intervention.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Date & Age</th>
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Service / Bouquet</th>
                  <th className="py-3 px-6">Customer / Smartcard</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allPending.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                      <div>{new Date(tx.createdAt).toLocaleTimeString('en-NG')}</div>
                      <span className="text-[10px] text-amber-600 font-medium">Pending switch</span>
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
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 animate-spin" />
                        Pending
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
                          disabled={requeryingId === tx.id}
                          onClick={() => handleRequeryVtpass(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs disabled:opacity-50"
                          title="Requery Live VTpass Switch Status"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${requeryingId === tx.id ? 'animate-spin' : ''}`} />
                          <span>{requeryingId === tx.id ? 'Querying...' : 'Requery Switch'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveSuccessful(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                          title="Confirm Switch Status -> Mark Successful"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve OK</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineAndRefund(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                          title="Decline & Refund to Customer Wallet"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Refund</span>
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
