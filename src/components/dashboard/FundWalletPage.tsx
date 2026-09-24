import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { User } from '../../types';
import { walletService } from '../../services/walletService';

interface FundWalletPageProps {
  currentUser: User;
  onRefreshUser: () => void;
  onNavigate: (path: string) => void;
}

export const FundWalletPage: React.FC<FundWalletPageProps> = ({
  currentUser,
  onRefreshUser,
  onNavigate,
}) => {
  const [amount, setAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successResult, setSuccessResult] = useState<{ newBalance: number; ref: string } | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const quickAmounts = [5000, 10000, 20000, 50000];

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMessage('Please enter an amount greater than ₦0.');
      return;
    }
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const res = await walletService.fundWallet(currentUser.id, amount, paymentMethod);
      setSuccessResult({ newBalance: res.newBalance, ref: res.transaction.reference });
      onRefreshUser();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete wallet funding.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyVirtualAccount = () => {
    const acc = currentUser.virtualAccount?.accountNumber || '8102938472';
    navigator.clipboard.writeText(acc);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Fund Your JDpay Wallet
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Top up your balance using Instant Debit Card, Dedicated Virtual Account, or USSD.
        </p>
      </div>

      {/* Current Balance Display */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Current Available Balance
            </span>
            <div className="text-xl font-black text-slate-900 tabular-nums">
              ₦{currentUser.walletBalance.toLocaleString('en-NG')}.00
            </div>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ Verified Wallet
        </span>
      </div>

      {/* Success View */}
      {successResult ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Wallet Funded Successfully!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your payment has been cleared and credited to your JDpay wallet instantly.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2 text-left max-w-sm mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Credited Amount:</span>
              <span className="font-bold text-slate-900 tabular-nums">
                +₦{amount.toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">New Balance:</span>
              <span className="font-extrabold text-emerald-600 tabular-nums">
                ₦{successResult.newBalance.toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200/60 font-mono text-[11px]">
              <span className="text-slate-500">Reference:</span>
              <span className="text-slate-700">{successResult.ref}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/dashboard/cable')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <span>Pay Cable TV Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                setAmount(10000);
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Add More Funds
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFund} className="space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Amount Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Enter Amount (NGN) *
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-400 text-base">
                ₦
              </div>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="10,000"
                className="w-full pl-9 pr-3.5 py-3 text-lg font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 tabular-nums"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 mr-1">Quick Select:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    amount === q
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ₦{q.toLocaleString('en-NG')}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Payment Method
            </h3>

            <div className="space-y-3">
              {/* Option 1: Card */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fundMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Debit Card (Mastercard / Visa / Verve)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Instant funding secured by Paystack & 3D Secure OTP
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Instant
                </span>
              </label>

              {/* Option 2: Virtual Account */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fundMethod"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Bank Transfer (Dedicated Virtual Account)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Transfer from any Nigerian banking app to your unique account
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Auto-credit
                </span>
              </label>

              {/* Option 3: USSD */}
              <label
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'ussd'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="fundMethod"
                    checked={paymentMethod === 'ussd'}
                    onChange={() => setPaymentMethod('ussd')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">USSD Banking Code</h4>
                    <p className="text-[11px] text-slate-500">
                      Dial *737# (GTBank), *901# (Access), *894# (FirstBank), etc.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Instant
                </span>
              </label>
            </div>

            {/* Virtual Account Details Helper if transfer selected */}
            {paymentMethod === 'transfer' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-900">
                    {currentUser.virtualAccount?.bankName || 'Wema Bank / Moniepoint MFB'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-bold text-slate-900">
                    {currentUser.virtualAccount?.accountName || `JDPAY - ${currentUser.fullName.toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Virtual Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {currentUser.virtualAccount?.accountNumber || '8102938472'}
                    </span>
                    <button
                      type="button"
                      onClick={copyVirtualAccount}
                      className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                      title="Copy Account Number"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fee & Summary Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700 pb-2 border-b border-slate-100">
              Funding Summary
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                ₦{amount.toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Transaction Fee</span>
              <span className="font-semibold text-emerald-600 tabular-nums">₦0.00 (Promo)</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-blue-600 tabular-nums">₦{amount.toLocaleString('en-NG')}.00</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || amount <= 0}
            className="w-full py-3.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>Continue to Payment (₦{amount.toLocaleString('en-NG')}.00)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
