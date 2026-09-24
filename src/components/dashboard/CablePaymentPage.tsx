import React, { useState, useEffect } from 'react';
import {
  Tv,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Receipt,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Calendar,
  DollarSign,
  User,
  Hash,
} from 'lucide-react';
import {
  CablePackage,
  CableServiceName,
  Transaction,
  User as UserModel,
  VerificationResult,
} from '../../types';
import { cableService } from '../../services/cableService';
import { ReceiptModal } from '../common/ReceiptModal';

interface CablePaymentPageProps {
  currentUser: UserModel;
  initialService?: CableServiceName;
  onNavigate: (path: string) => void;
  onRefreshUser: () => void;
}

export const CablePaymentPage: React.FC<CablePaymentPageProps> = ({
  currentUser,
  initialService = 'DStv',
  onNavigate,
  onRefreshUser,
}) => {
  // Step State
  const [selectedService, setSelectedService] = useState<CableServiceName>(initialService);
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState('');

  // Selected package
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [availablePackages, setAvailablePackages] = useState<CablePackage[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [subscriptionType, setSubscriptionType] = useState<'change' | 'renew'>('change');

  // Confirmation modal & processing
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Sync service change
  useEffect(() => {
    setSelectedService(initialService);
    setSmartcardNumber('');
    setVerificationResult(null);
    setVerifyError('');
    setSelectedPackageId('');
    setCompletedTransaction(null);
    setPhoneNumber('');
    setSubscriptionType('change');
  }, [initialService]);

  // Load packages whenever service changes
  useEffect(() => {
    let isMounted = true;
    // Query MongoDB database packages
    cableService.fetchLivePackages(selectedService).then((pkgs) => {
      if (isMounted && pkgs.length > 0) {
        setAvailablePackages(pkgs);
        setSelectedPackageId(pkgs[0].id);
      }
    }).catch(() => {
      const pkgs = cableService.getPackages(selectedService);
      if (isMounted) {
        setAvailablePackages(pkgs);
        if (pkgs.length > 0) setSelectedPackageId(pkgs[0].id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedService]);

  const performVerification = async (numberToVerify: string, allowSimulated: boolean = false) => {
    setVerifyError('');
    setVerificationResult(null);
    setIsVerifying(true);

    try {
      const result = await cableService.verifyCustomer(selectedService, numberToVerify, allowSimulated);
      setVerificationResult(result);
      if (result.phone) setPhoneNumber(result.phone);
      if (result.renewalAmount) {
        setSubscriptionType('renew');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Please check the number.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await performVerification(smartcardNumber, false);
  };

  const selectedPkg = availablePackages.find((p) => p.id === selectedPackageId);
  const subscriptionFee = selectedPkg ? selectedPkg.price : 0;
  const serviceFee = 0;
  const totalAmount = subscriptionFee + serviceFee;
  const hasSufficientBalance = currentUser.walletBalance >= totalAmount;

  const handleConfirmPayment = async () => {
    if (!verificationResult || !selectedPkg) return;
    setIsPaying(true);
    setPaymentError('');

    try {
      const tx = await cableService.processCablePayment({
        userId: currentUser.id,
        customerName: verificationResult.customerName,
        service: selectedService,
        packageId: selectedPkg.id,
        smartcardNumber: verificationResult.smartcardNumber,
        phone: phoneNumber || verificationResult.phone || currentUser.phone || '08012345678',
        subscriptionType,
      });

      setCompletedTransaction(tx);
      setShowConfirmModal(false);
      onRefreshUser();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment execution failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleMakeAnother = () => {
    setCompletedTransaction(null);
    setVerificationResult(null);
    setVerifyError('');
    setPaymentError('');
  };

  // ================= PAYMENT SUCCESS RESULT SCREEN =================
  if (completedTransaction) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          {/* Checkmark Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your cable TV subscription has been renewed and activated immediately.
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-left space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {completedTransaction.transactionReference}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Service</span>
              <span className="font-semibold text-slate-900">{completedTransaction.service}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Package Bouquet</span>
              <span className="font-semibold text-slate-900">{completedTransaction.package}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Customer Name</span>
              <span className="font-semibold text-slate-900">{completedTransaction.customerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">
                {completedTransaction.service === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {completedTransaction.smartcardNumber}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-slate-900 tabular-nums">
                ₦{completedTransaction.totalAmount.toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Date & Time</span>
              <span className="text-slate-700 tabular-nums">
                {new Date(completedTransaction.createdAt).toLocaleString('en-NG')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-emerald-600">✓ SUCCESSFUL</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              View Receipt
            </button>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleMakeAnother}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Make Another Payment
            </button>
          </div>
        </div>

        <ReceiptModal
          isOpen={showReceiptModal}
          transaction={completedTransaction}
          onClose={() => setShowReceiptModal(false)}
        />
      </div>
    );
  }

  // ================= MAIN PAYMENT FLOW (STEPS 1 to 5) =================
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Cable TV Subscription Payment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify your Smartcard or IUC number, select bouquet, and renew instantly with your JDpay wallet.
        </p>
      </div>

      {/* STEP 1: SELECT SERVICE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Select Cable TV Service
            </h2>
          </div>
          <span className="text-xs text-slate-400">Step 1 of 5</span>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {(['DStv', 'GOtv', 'StarTimes'] as const).map((srv) => {
            const isSelected = selectedService === srv;
            return (
              <button
                key={srv}
                type="button"
                onClick={() => {
                  setSelectedService(srv);
                  if (srv === 'GOtv') setSmartcardNumber('2019483726');
                  else if (srv === 'StarTimes') setSmartcardNumber('0219876543');
                  else setSmartcardNumber('41289012345');
                  setVerificationResult(null);
                  setVerifyError('');
                }}
                className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    srv === 'DStv'
                      ? 'bg-blue-600 text-white'
                      : srv === 'GOtv'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {srv === 'StarTimes' ? 'ST' : srv}
                </div>
                <span className="text-xs font-bold text-slate-900">{srv}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: ENTER CUSTOMER NUMBER & VERIFY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Enter Customer / Decoder Number
            </h2>
          </div>
          <span className="text-xs text-slate-400">Step 2 of 5</span>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {selectedService === 'GOtv' ? 'IUC Number *' : 'Smartcard Number *'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={smartcardNumber}
                  onChange={(e) => {
                    setSmartcardNumber(e.target.value);
                    setVerificationResult(null);
                  }}
                  placeholder={
                    selectedService === 'GOtv'
                      ? 'Enter 10-digit GOtv IUC number'
                      : selectedService === 'StarTimes'
                      ? 'Enter 11-digit StarTimes smartcard number'
                      : 'Enter 10 or 11-digit DStv smartcard number'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 tabular-nums font-mono font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap"
              >
                {isVerifying ? (
                  <span className="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Verify Customer</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 mt-1.5">
              <span>The {selectedService === 'GOtv' ? 'IUC' : 'Smartcard'} number is located on the back or bottom barcode sticker of your decoder.</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Sandbox test card:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSmartcardNumber('1212121212');
                    performVerification('1212121212', false);
                  }}
                  className="font-mono text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded font-semibold transition"
                >
                  1212121212
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {verifyError && (
          <div className="p-3.5 bg-rose-50/90 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-semibold">{verifyError}</span>
                <p className="text-[11px] text-rose-600 mt-1">
                  For sandbox testing, use VTpass test number <strong className="font-mono">1212121212</strong> or proceed with simulated verification.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
              <button
                type="button"
                onClick={() => {
                  setSmartcardNumber('1212121212');
                  performVerification('1212121212', false);
                }}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg text-rose-800 font-bold text-[11px] transition shadow-2xs"
              >
                Use Test Card 1212121212
              </button>
              <button
                type="button"
                onClick={() => performVerification(smartcardNumber || '1212121212', true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
              >
                Proceed with Demo Subscriber
              </button>
            </div>
          </div>
        )}

        {/* Verification Success Box */}
        {verificationResult && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">Customer Verified</span>
                {verificationResult.verifiedVia && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    {verificationResult.verifiedVia}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                {verificationResult.accountStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer Name</span>
                <span className="font-bold text-slate-900">{verificationResult.customerName}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Smartcard/IUC</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {verificationResult.smartcardNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Current Package</span>
                <span className="font-semibold text-slate-900">{verificationResult.currentPackage}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Due / Expiry Date</span>
                <span className="font-medium text-slate-700 tabular-nums">
                  {verificationResult.dueDate}
                </span>
              </div>
            </div>

            {verificationResult.renewalAmount !== undefined && verificationResult.renewalAmount > 0 && (
              <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                  <span>Standard Renewal Rate:</span>
                  <span className="font-bold font-mono">₦{verificationResult.renewalAmount.toLocaleString('en-NG')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubscriptionType('renew')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                      subscriptionType === 'renew'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-emerald-800 border-emerald-300'
                    }`}
                  >
                    Renew Current Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubscriptionType('change')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                      subscriptionType === 'change'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Change Package
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP 3: SELECT PACKAGE (Active once verified) */}
      {verificationResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Select Subscription Package
              </h2>
            </div>
            <span className="text-xs text-slate-400">Step 3 of 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availablePackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 pr-6">{pkg.packageName}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {pkg.description || `${pkg.channelsCount || 50}+ channels included.`}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      ₦{pkg.price.toLocaleString('en-NG')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">/ month</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4 & 5: PAYMENT METHOD & PAYMENT SUMMARY */}
      {verificationResult && selectedPkg && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                4 & 5
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Payment Method & Summary
              </h2>
            </div>
            <span className="text-xs text-slate-400">Steps 4 & 5 of 5</span>
          </div>

          {/* Wallet check card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">JDpay Wallet Balance</p>
                <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                  ₦{currentUser.walletBalance.toLocaleString('en-NG')}.00
                </p>
              </div>
            </div>

            {!hasSufficientBalance ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-rose-600">
                  Insufficient wallet balance
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard/fund-wallet')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  Fund Wallet
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sufficient Balance</span>
              </div>
            )}
          </div>

          {/* Summary Breakdown */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-3 text-xs bg-slate-50/40">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200">
              Payment Summary
            </h4>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Service</span>
              <span className="font-semibold text-slate-900">{selectedService}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Package</span>
              <span className="font-semibold text-slate-900">{selectedPkg.packageName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-900">{verificationResult.customerName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">
                {selectedService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {verificationResult.smartcardNumber}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">SMS Notification Phone</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08012345678"
                className="text-right text-xs font-mono font-semibold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-hidden focus:border-blue-500 w-36"
              />
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Subscription Amount</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                ₦{subscriptionFee.toLocaleString('en-NG')}.00
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Service Fee</span>
              <span className="font-semibold text-emerald-600 tabular-nums">₦0.00</span>
            </div>

            <div className="flex justify-between pt-2 text-sm font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-blue-600 tabular-nums">
                ₦{totalAmount.toLocaleString('en-NG')}.00
              </span>
            </div>
          </div>

          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {paymentError}
            </div>
          )}

          {/* Pay Button */}
          <button
            type="button"
            disabled={!hasSufficientBalance}
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-3.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Pay Now (₦{totalAmount.toLocaleString('en-NG')}.00)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && selectedPkg && verificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Cable TV Payment</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                You are about to pay{' '}
                <span className="font-bold text-slate-900">₦{totalAmount.toLocaleString('en-NG')}</span> for{' '}
                <span className="font-bold text-slate-900">{selectedService} {selectedPkg.packageName}</span> on decoder{' '}
                <span className="font-mono font-semibold text-slate-900">{verificationResult.smartcardNumber}</span>.
                Do you want to continue?
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Name:</span>
                <span className="font-semibold text-slate-900">{verificationResult.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wallet Deduction:</span>
                <span className="font-bold text-slate-900 tabular-nums">₦{totalAmount.toLocaleString('en-NG')}.00</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isPaying}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPaying}
                onClick={handleConfirmPayment}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isPaying ? (
                  <span className="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Confirm Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
