import React from 'react';
import { X, Tv, Receipt, Hash, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { Transaction } from '../../types';
import { StatusBadge } from './StatusBadge';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt?: (tx: Transaction) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onOpenReceipt,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transaction Details</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{transaction.transactionReference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Header Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Subscription Bouquet</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-slate-900">{transaction.package}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {transaction.service}
                </span>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={transaction.status} />
              <p className="text-lg font-extrabold text-slate-900 mt-1 tabular-nums">
                ₦{transaction.totalAmount.toLocaleString('en-NG')}.00
              </p>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-slate-400" />
                Customer / Smartcard
              </span>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{transaction.customerName}</p>
                <p className="text-xs font-mono text-slate-500 tabular-nums">{transaction.smartcardNumber}</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-slate-400" />
                Cable Service
              </span>
              <span className="font-medium text-slate-900">{transaction.service}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                Subscription Amount
              </span>
              <span className="font-medium text-slate-900 tabular-nums">
                ₦{transaction.amount.toLocaleString('en-NG')}.00
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Service / Convenience Fee</span>
              <span className="font-medium text-emerald-600 tabular-nums">₦0.00</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Date & Time
              </span>
              <span className="text-slate-900 tabular-nums text-xs font-medium">
                {new Date(transaction.createdAt).toLocaleString('en-NG')}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Provider Reference
              </span>
              <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {transaction.providerReference}
              </span>
            </div>

            {transaction.providerResponse && (
              <div className="py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Switch Response</span>
                <p className="font-mono text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                  {transaction.providerResponse}
                </p>
              </div>
            )}

            {transaction.failureReason && (
              <div className="py-2 bg-rose-50 border border-rose-100 rounded-lg p-3">
                <span className="text-xs font-semibold text-rose-800 block">Failure Log</span>
                <p className="text-xs text-rose-700 mt-0.5">{transaction.failureReason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            Close
          </button>
          {transaction.status === 'SUCCESSFUL' && onOpenReceipt && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReceipt(transaction);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              View Digital Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
