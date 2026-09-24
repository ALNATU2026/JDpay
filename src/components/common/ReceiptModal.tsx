import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Tv } from 'lucide-react';
import { Transaction } from '../../types';
import { StatusBadge } from './StatusBadge';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/html printable representation or file download
    const printableContent = `
      =========================================
      JDPAY - OFFICIAL PAYMENT RECEIPT
      =========================================
      Transaction Ref: ${transaction.transactionReference}
      Status: ${transaction.status}
      Date: ${new Date(transaction.createdAt).toLocaleString('en-NG')}
      
      Service: ${transaction.service}
      Package: ${transaction.package}
      Smartcard/IUC: ${transaction.smartcardNumber}
      Customer Name: ${transaction.customerName}
      
      Subscription Amount: NGN ${transaction.amount.toLocaleString('en-NG')}
      Service Fee: NGN 0.00
      Total Paid: NGN ${transaction.totalAmount.toLocaleString('en-NG')}
      
      Provider Reference: ${transaction.providerReference}
      =========================================
      JDpay - Pay Your Cable TV. Simple. Fast. Secure.
    `;
    const blob = new Blob([printableContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JDPay-Receipt-${transaction.transactionReference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(transaction.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        {/* Modal Controls (no-print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Payment Receipt</span>
            <StatusBadge status={transaction.status} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 md:p-8 bg-white" id="printable-receipt">
          {/* Brand Header */}
          <div className="flex items-start justify-between pb-6 border-b border-dashed border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                  JD
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  JD<span className="text-blue-600">pay</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Pay Your Cable TV. Simple. Fast. Secure.</p>
              <p className="text-xs text-slate-400">www.jdpay.ng · support@jdpay.ng</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                E-RECEIPT
              </span>
              <p className="text-xs text-slate-500 mt-1.5 tabular-nums">{formattedDate}</p>
              <p className="text-xs text-slate-400 tabular-nums">{formattedTime}</p>
            </div>
          </div>

          {/* Success Banner */}
          <div className="py-4 my-4 bg-emerald-50/70 border border-emerald-100 rounded-xl px-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-900">Subscription Activated</p>
              <p className="text-xs text-emerald-700">MultiChoice / StarTimes switch payment processed.</p>
            </div>
          </div>

          {/* Amount Showcase */}
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Amount Paid</p>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1">
              ₦{transaction.totalAmount.toLocaleString('en-NG')}.00
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">✓ Zero Service Fee Promotion</p>
          </div>

          {/* Details Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Transaction Reference</span>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {transaction.transactionReference}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Customer Name</span>
              <span className="font-medium text-slate-900">{transaction.customerName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Cable Service</span>
              <span className="font-semibold text-blue-600 flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                {transaction.service}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Bouquet / Package</span>
              <span className="font-medium text-slate-900">{transaction.package}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Smartcard / IUC Number</span>
              <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                {transaction.smartcardNumber}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Subscription Amount</span>
              <span className="font-medium text-slate-900 tabular-nums">
                ₦{transaction.amount.toLocaleString('en-NG')}.00
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Platform Convenience Fee</span>
              <span className="font-medium text-emerald-600 tabular-nums">₦0.00</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Provider Reference</span>
              <span className="font-mono text-xs text-slate-600 tabular-nums">
                {transaction.providerReference}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Payment Channel</span>
              <span className="font-medium text-slate-900">JDpay Wallet</span>
            </div>
          </div>

          {/* Security & Verification Notice */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographically verified payment token</span>
            </div>
            <span>Support: +234 800 53729</span>
          </div>
        </div>

        {/* Action Buttons (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            Download TXT / PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
