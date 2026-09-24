import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  Eye,
  Receipt,
  Tv,
  Calendar,
  Clock,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { CableServiceName, Transaction, TransactionStatus, User } from '../../types';
import { transactionService, TransactionFilter } from '../../services/transactionService';
import { StatusBadge } from '../common/StatusBadge';
import { ReceiptModal } from '../common/ReceiptModal';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';

interface TransactionsPageProps {
  currentUser: User;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<CableServiceName | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);

  const filter: TransactionFilter = {
    service: selectedService,
    status: selectedStatus,
    searchQuery,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.fetchUserTransactions(currentUser.id, filter);
      setTransactions(data);
    } catch (err) {
      console.error('[TransactionsPage] Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentUser.id, selectedService, selectedStatus, startDate, endDate, searchQuery]);

  const handleExportCSV = () => {
    transactionService.exportCSV(transactions);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedService('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review all your cable subscription renewals, check provider confirmation statuses, and download receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={transactions.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV ({transactions.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, number, customer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Service Filter */}
          <div>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              <option value="all">All Services (DStv, GOtv, StarTimes)</option>
              <option value="DStv">DStv Only</option>
              <option value="GOtv">GOtv Only</option>
              <option value="StarTimes">StarTimes Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              title="Start Date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              title="End Date"
            />
          </div>
        </div>

        {(searchQuery || selectedService !== 'all' || selectedStatus !== 'all' || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <span className="font-bold text-slate-800">{transactions.length}</span> filtered results
            </span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No payment transactions match your current search query or filter selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Transaction ID</th>
                  <th className="py-3 px-6">Date & Time</th>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Package</th>
                  <th className="py-3 px-6">Customer / Smartcard</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {tx.transactionReference}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString('en-NG')}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5" />
                        {tx.service}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900 whitespace-nowrap">
                      {tx.package}
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
