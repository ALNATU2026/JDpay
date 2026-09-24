import React, { useState, useEffect } from 'react';
import { Receipt, Search, Printer, Download, Tv, Eye, RefreshCw } from 'lucide-react';
import { Transaction, User } from '../../types';
import { transactionService } from '../../services/transactionService';
import { ReceiptModal } from '../common/ReceiptModal';

interface ReceiptsPageProps {
  currentUser: User;
}

export const ReceiptsPage: React.FC<ReceiptsPageProps> = ({ currentUser }) => {
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [userTxs, setUserTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    transactionService
      .fetchUserTransactions(currentUser.id, { status: 'SUCCESSFUL' })
      .then((data) => {
        if (isMounted) {
          setUserTxs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[ReceiptsPage] Error loading receipts:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  // Filter only SUCCESSFUL transactions that have generated receipts
  let successfulTxs = userTxs.filter((t) => t.status === 'SUCCESSFUL');

  if (search.trim()) {
    const q = search.toLowerCase();
    successfulTxs = successfulTxs.filter(
      (t) =>
        t.transactionReference.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.smartcardNumber.includes(q) ||
        t.package.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Payment Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access, print, and download official cryptographic receipts for all your processed cable subscriptions.
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
            placeholder="Search by ref or decoder..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Grid of Receipts */}
      {successfulTxs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Receipts Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Receipts are generated automatically when a cable TV payment succeeds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {successfulTxs.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{tx.service}</h4>
                      <p className="text-[11px] text-slate-500">{tx.package}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    PAID
                  </span>
                </div>

                <div className="py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                      {tx.transactionReference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-medium text-slate-900">{tx.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decoder:</span>
                    <span className="font-mono text-slate-600 tabular-nums">{tx.smartcardNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="text-slate-600 tabular-nums">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Amount Paid:</span>
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      ₦{tx.totalAmount.toLocaleString('en-NG')}.00
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(tx)}
                  className="w-full py-2 px-3 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View / Print Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
