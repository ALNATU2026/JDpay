import React, { useState, useEffect } from 'react';
import { Tv, Search, Download, Eye, Receipt, RefreshCw } from 'lucide-react';
import { CableServiceName, Transaction } from '../../types';
import { transactionService } from '../../services/transactionService';
import { StatusBadge } from '../common/StatusBadge';
import { ReceiptModal } from '../common/ReceiptModal';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';

export const AdminCablePayments: React.FC = () => {
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<CableServiceName | 'all'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Transaction | null>(null);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const filter = {
    service: serviceFilter,
    searchQuery: search,
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await transactionService.fetchLiveTransactions(filter);
      setPayments(data);
    } catch (err) {
      console.error('[AdminCablePayments] Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [serviceFilter, search]);

  const handleExport = () => {
    transactionService.exportCSV(payments);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Cable TV Subscriptions Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time feed of all DStv, GOtv, and StarTimes decoder activations and renewals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Payments CSV</span>
        </button>
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
            placeholder="Search by customer, decoder smartcard/IUC, or reference..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 bg-white"
          >
            <option value="all">All Cable Providers</option>
            <option value="DStv">DStv Only</option>
            <option value="GOtv">GOtv Only</option>
            <option value="StarTimes">StarTimes Only</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {payments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No payments found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Provider & Bouquet</th>
                  <th className="py-3 px-6">Subscriber / Smartcard</th>
                  <th className="py-3 px-6 text-right">Amount (NGN)</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {tx.transactionReference}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="font-bold text-blue-600">{tx.service}</span>
                      <span className="text-slate-500 ml-1.5 font-medium">{tx.package}</span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{tx.customerName}</div>
                      <div className="text-slate-400 font-mono text-[11px] tabular-nums">
                        {tx.smartcardNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                      ₦{tx.totalAmount.toLocaleString('en-NG')}.00
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {tx.status === 'SUCCESSFUL' && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(tx)}
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
        )}
      </div>

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      <TransactionDetailsModal
        isOpen={Boolean(selectedDetail)}
        transaction={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onOpenReceipt={(tx) => setSelectedReceipt(tx)}
      />
    </div>
  );
};
