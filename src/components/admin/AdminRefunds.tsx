import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, PlusCircle, CheckCircle2, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { Transaction, User } from '../../types';
import { transactionService } from '../../services/transactionService';
import { adminService } from '../../services/adminService';

interface AdminRefundsProps {
  adminUser: User;
}

export const AdminRefunds: React.FC<AdminRefundsProps> = ({ adminUser }) => {
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refundedList, setRefundedList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Refund modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [targetRef, setTargetRef] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadRefunded = async () => {
    try {
      setLoading(true);
      const data = await transactionService.fetchLiveTransactions({ status: 'REFUNDED' });
      setRefundedList(data);
    } catch (err) {
      console.error('[AdminRefunds] Error loading refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunded();
  }, [refreshKey]);

  const refundedTxs = refundedList.filter(
    (t) =>
      t.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.smartcardNumber.includes(search)
  );

  const handleExecuteManualRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let targetTx = transactionService.getById(targetRef.trim());
    if (!targetTx) {
      // try fetching all live transactions to look up ref
      const allLive = await transactionService.fetchLiveTransactions();
      targetTx = allLive.find(
        (t) => t.transactionReference === targetRef.trim() || t.id === targetRef.trim()
      );
    }

    if (!targetTx) {
      setErrorMsg(`Transaction reference "${targetRef}" was not found.`);
      return;
    }

    if (targetTx.status === 'REFUNDED') {
      setErrorMsg('This transaction has already been refunded to the customer.');
      return;
    }

    try {
      await adminService.processRefund(targetTx.id, adminUser.id, adminUser.fullName, manualReason);
      setSuccessMsg(`Successfully refunded ₦${targetTx.totalAmount.toLocaleString('en-NG')} for ${targetTx.transactionReference}.`);
      setTargetRef('');
      setManualReason('');
      setRefreshKey((k) => k + 1);
      setTimeout(() => {
        setShowManualModal(false);
        setSuccessMsg('');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute refund.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Wallet Refunds
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete record of automated and manual customer wallet refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManualModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Refund Tool</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search refunded transaction by reference, customer name or decoder number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {refundedTxs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Refunds Recorded</h4>
            <p className="text-xs text-slate-400">No transactions have been refunded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Refund Date</th>
                  <th className="py-3 px-6">Transaction ID</th>
                  <th className="py-3 px-6">Customer / Smartcard</th>
                  <th className="py-3 px-6">Cable Service</th>
                  <th className="py-3 px-6 text-right">Amount Refunded</th>
                  <th className="py-3 px-6">Reason / Provider Note</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {refundedTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(tx.updatedAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {tx.transactionReference}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{tx.customerName}</div>
                      <div className="text-slate-400 font-mono text-[11px] tabular-nums">
                        {tx.smartcardNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-blue-600 whitespace-nowrap">
                      {tx.service} ({tx.package})
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-blue-700 tabular-nums whitespace-nowrap">
                      ₦{tx.totalAmount.toLocaleString('en-NG')}.00
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate text-slate-600">
                      {tx.failureReason || 'Customer wallet refund executed'}
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <RotateCcw className="w-3 h-3" />
                        Refunded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Refund Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Execute Manual Refund</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleExecuteManualRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Reference *
                </label>
                <input
                  type="text"
                  required
                  value={targetRef}
                  onChange={(e) => setTargetRef(e.target.value)}
                  placeholder="e.g. JDPAY-20260923-123456"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Refund Reason (Audit Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Customer requested refund due to duplicate bouquet payment"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
                >
                  Process Full Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
