import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
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
  Phone,
  RefreshCw,
  KeyRound,
  Eye,
  ChevronDown,
  List,
  Layers,
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

type PaymentStep = 'verify' | 'select_plan' | 'summary' | 'confirm';

function matchPackage(
  packages: CablePackage[],
  currentPackageName?: string,
  renewalAmount?: number
): CablePackage | undefined {
  if (!packages || packages.length === 0) return undefined;

  if (currentPackageName) {
    const raw = currentPackageName.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const p of packages) {
      const pNorm = p.packageName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (pNorm === raw || pNorm.includes(raw) || raw.includes(pNorm)) {
        return p;
      }
    }

    const keywords = [
      { key: 'supaplus', name: 'supa plus' },
      { key: 'compactplus', name: 'compact plus' },
      { key: 'compact', name: 'compact' },
      { key: 'confam', name: 'confam' },
      { key: 'yanga', name: 'yanga' },
      { key: 'padi', name: 'padi' },
      { key: 'premium', name: 'premium' },
      { key: 'jolli', name: 'jolli' },
      { key: 'jinja', name: 'jinja' },
      { key: 'smallie', name: 'smallie' },
      { key: 'supa', name: 'supa' },
      { key: 'max', name: 'max' },
      { key: 'classic', name: 'classic' },
      { key: 'super', name: 'super' },
      { key: 'basic', name: 'basic' },
      { key: 'nova', name: 'nova' },
    ];

    for (const kw of keywords) {
      if (raw.includes(kw.key)) {
        const found = packages.find((p) => {
          const pNorm = p.packageName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (kw.key === 'compact' && pNorm.includes('compactplus')) return false;
          if (kw.key === 'supa' && pNorm.includes('supaplus')) return false;
          return pNorm.includes(kw.key);
        });
        if (found) return found;
      }
    }
  }

  if (renewalAmount && Number(renewalAmount) > 0) {
    const priceMatch = packages.find((p) => p.price === Number(renewalAmount));
    if (priceMatch) return priceMatch;
  }

  return undefined;
}

export const CablePaymentPage: React.FC<CablePaymentPageProps> = ({
  currentUser,
  initialService = 'DStv',
  onNavigate,
  onRefreshUser,
}) => {
  // Step Navigation State
  const [currentStep, setCurrentStep] = useState<PaymentStep>('verify');

  // Partition 1 State: Service & Verification
  const [selectedService, setSelectedService] = useState<CableServiceName>(initialService);
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState('');

  // Partition 2 State: Renewal vs Change Package
  const [subscriptionType, setSubscriptionType] = useState<'renew' | 'change'>('renew');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [availablePackages, setAvailablePackages] = useState<CablePackage[]>([]);
  const [packageSearch, setPackageSearch] = useState('');
  const [billingCycleFilter, setBillingCycleFilter] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [priceListViewMode, setPriceListViewMode] = useState<'dropdown' | 'list'>('dropdown');

  // Partition 3 State: Payment Summary & Phone
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Partition 4 State: Confirmation & Processing
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentPin, setPaymentPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Partition 5 State: Completed Transaction
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Sync initial service changes
  useEffect(() => {
    setSelectedService(initialService);
    setSmartcardNumber('');
    setVerificationResult(null);
    setVerifyError('');
    setSelectedPackageId('');
    setCompletedTransaction(null);
    setPhoneNumber('');
    setPaymentPin('');
    setSubscriptionType('renew');
    setBillingCycleFilter('all');
    setCurrentStep('verify');
  }, [initialService]);

  // Load packages whenever service changes
  useEffect(() => {
    let isMounted = true;
    cableService.fetchLivePackages(selectedService).then((pkgs) => {
      if (isMounted && pkgs.length > 0) {
        setAvailablePackages(pkgs);
        if (!selectedPackageId) {
          setSelectedPackageId(pkgs[0].id);
        }
      }
    }).catch(() => {
      const pkgs = cableService.getPackages(selectedService);
      if (isMounted) {
        setAvailablePackages(pkgs);
        if (pkgs.length > 0 && !selectedPackageId) {
          setSelectedPackageId(pkgs[0].id);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedService]);

  // Perform smartcard verification
  const performVerification = async (numberToVerify: string, allowSimulated: boolean = false) => {
    setVerifyError('');
    setVerificationResult(null);
    setIsVerifying(true);

    try {
      const result = await cableService.verifyCustomer(selectedService, numberToVerify, allowSimulated);
      setVerificationResult(result);
      if (result.phone) setPhoneNumber(result.phone);

      // Default to renewal if customer has existing package, or match with available package
      setSubscriptionType('renew');

      // Attempt to auto-select matching package
      const matchPkg = matchPackage(
        availablePackages,
        result.currentPackage,
        result.renewalAmount
      );
      if (matchPkg) {
        setSelectedPackageId(matchPkg.id);
      } else if (availablePackages.length > 0) {
        setSelectedPackageId(availablePackages[0].id);
      }

      // Transition to Partition 2: Customer Verified & Plan Selection
      setCurrentStep('select_plan');
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Please check the decoder number.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performVerification(smartcardNumber, false);
  };

  // Selected package resolution
  const selectedPkg = availablePackages.find((p) => p.id === selectedPackageId) || availablePackages[0];

  // Resolve renewal bouquet package & price
  // Matches detected bouquet with official VTpass package to enforce official package price
  const renewalPkg = useMemo(() => {
    if (selectedPackageId) {
      const explicit = availablePackages.find((p) => p.id === selectedPackageId);
      if (explicit) return explicit;
    }
    const matched = matchPackage(
      availablePackages,
      verificationResult?.currentPackage,
      verificationResult?.renewalAmount
    );
    if (matched) return matched;
    return selectedPkg;
  }, [availablePackages, selectedPackageId, verificationResult, selectedPkg]);

  // Target bouquet package for current order
  const effectivePackage = subscriptionType === 'renew' ? renewalPkg : selectedPkg;

  // Amount resolution: ALWAYS the official package price so web app and VTpass deductions match 100%
  const subscriptionFee = effectivePackage ? effectivePackage.price : 0;
  const serviceFee = 0; // JDpay provides ₦0.00 service fee
  const totalAmount = subscriptionFee + serviceFee;
  const hasSufficientBalance = currentUser.walletBalance >= totalAmount;

  // Active package for summary/confirmation
  const effectivePackageName = effectivePackage ? effectivePackage.packageName : `${selectedService} Bouquet`;
  const effectiveVariationCode = effectivePackage ? effectivePackage.variationCode : undefined;

  // Execute payment
  const handleConfirmPayment = async () => {
    const targetPkg = effectivePackage;
    if (!verificationResult || !targetPkg) return;

    const cleanPin = paymentPin.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setPaymentError('Please enter your 6-digit Transaction PIN to authorize this cable subscription payment.');
      return;
    }

    setIsPaying(true);
    setPaymentError('');

    try {
      const tx = await cableService.processCablePayment({
        userId: currentUser.id,
        customerName: verificationResult.customerName,
        service: selectedService,
        packageId: targetPkg.id,
        packageName: targetPkg.packageName,
        variationCode: targetPkg.variationCode,
        amount: targetPkg.price,
        smartcardNumber: verificationResult.smartcardNumber,
        phone: phoneNumber || verificationResult.phone || currentUser.phone || '08012345678',
        subscriptionType,
        pin: cleanPin,
      });

      setCompletedTransaction(tx);
      setPaymentPin('');
      onRefreshUser();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment execution failed on switch.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleMakeAnother = () => {
    setCompletedTransaction(null);
    setVerificationResult(null);
    setVerifyError('');
    setPaymentError('');
    setSmartcardNumber('');
    setCurrentStep('verify');
  };

  // ================= PARTITION 5: PAYMENT SUCCESS SCREEN =================
  if (completedTransaction) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your cable TV subscription has been renewed and activated immediately.
            </p>
          </div>

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
              <span className="text-slate-500">Bouquet Package</span>
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

  // Stepper Header
  const stepsConfig: { id: PaymentStep; title: string; number: number }[] = [
    { id: 'verify', title: 'Enter Decoder', number: 1 },
    { id: 'select_plan', title: 'Plan & Pricing', number: 2 },
    { id: 'summary', title: 'Payment Summary', number: 3 },
    { id: 'confirm', title: 'Confirm Payment', number: 4 },
  ];

  const currentStepIndex = stepsConfig.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-3xl mx-auto px-2 sm:px-4">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Cable TV Payment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Renew your DStv, GOtv or StarTimes subscription with zero transaction fees.
        </p>
      </div>

      {/* Modern Multi-Partition Step Progress Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          {stepsConfig.map((s, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.number}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-bold ${
                      isCurrent
                        ? 'text-slate-900'
                        : isDone
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < stepsConfig.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PARTITION 1: ENTER THE IUC / SMARTCARD TO VERIFY CUSTOMER (PAGE 1)        */}
      {/* ========================================================================= */}
      {currentStep === 'verify' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              1. Enter Customer Decoder Number
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your cable provider and enter your Smartcard or IUC number to verify your account.
            </p>
          </div>

          {/* Broadcaster Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Choose Cable Broadcaster
            </label>
            <div className="grid grid-cols-3 gap-3">
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

          {/* Smartcard Form */}
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedService === 'GOtv' ? 'GOtv IUC Number *' : `${selectedService} Smartcard Number *`}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={smartcardNumber}
                  onChange={(e) => {
                    setSmartcardNumber(e.target.value);
                    setVerifyError('');
                  }}
                  placeholder={
                    selectedService === 'GOtv'
                      ? 'Enter 10-digit GOtv IUC number'
                      : selectedService === 'StarTimes'
                      ? 'Enter 11-digit StarTimes smartcard number'
                      : 'Enter 10 or 11-digit DStv smartcard number'
                  }
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 tabular-nums font-mono font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 mt-2">
                <span>The decoder number is on the barcode sticker underneath your decoder.</span>
              </div>
            </div>

            {/* Error Message */}
            {verifyError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-1">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">{verifyError}</span>
                    <p className="text-[11px] text-rose-600 mt-0.5">
                      Please confirm the decoder number is correct and that your decoder is turned on.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying || !smartcardNumber.trim()}
                className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Verifying Decoder Number...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify Customer & Continue</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PARTITION 2: CUSTOMER VERIFIED ON ANOTHER PAGE (PAGE 2)                    */}
      {/* Selective Renewal vs Change Package                                      */}
      {/* ========================================================================= */}
      {currentStep === 'select_plan' && verificationResult && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Customer Verified Card (Without VTpass badge as requested) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Customer Verified
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {verificationResult.accountStatus || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Customer Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{verificationResult.customerName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">
                  {selectedService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5 block">
                  {verificationResult.smartcardNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Current Package</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {verificationResult.currentPackage || `${selectedService} Standard`}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Due / Expiry Date</span>
                <span className="font-medium text-slate-700 tabular-nums mt-0.5 block">
                  {verificationResult.dueDate || 'Active Cycle'}
                </span>
              </div>
            </div>
          </div>

          {/* Selective Choice: Renewal or Change Package */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Subscription Option & Plan Selection
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your subscription option and bouquet package from the compact list or dropdown.
              </p>
            </div>

            {/* Subscription Option: Dropdown List View */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Subscription Option
                </label>
                <span className="text-[11px] font-semibold text-blue-600">
                  {subscriptionType === 'renew' ? 'Bouquet Renewal' : 'Change / Upgrade'}
                </span>
              </div>
              <div className="relative">
                <select
                  value={subscriptionType}
                  onChange={(e) => {
                    const val = e.target.value as 'renew' | 'change';
                    setSubscriptionType(val);
                    if (val === 'renew' && renewalPkg) {
                      setSelectedPackageId(renewalPkg.id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="renew">
                    Renewal — Recharge Current Package ({renewalPkg?.packageName || verificationResult.currentPackage || `${selectedService} Bouquet`})
                  </option>
                  <option value="change">
                    Change Package — Switch Bouquet or Subscription Tier
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* When Renewal is selected: display compact bouquet & renewal dropdown */}
            {subscriptionType === 'renew' && (
              <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                      Bouquet for Renewal
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                      {renewalPkg?.packageName || verificationResult.currentPackage || `${selectedService} Bouquet`}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 block">Renewal Amount</span>
                    <div className="text-base sm:text-lg font-black text-blue-700 tabular-nums">
                      ₦{(renewalPkg?.price || 0).toLocaleString('en-NG')}.00
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium shrink-0">Confirm bouquet or switch:</span>
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={renewalPkg?.id || selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full sm:w-auto text-xs font-semibold bg-white border border-blue-300 rounded-lg py-1.5 pl-2.5 pr-8 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      {availablePackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.packageName} — ₦{pkg.price.toLocaleString('en-NG')}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* When Change Package is selected: Compact Dropdown List or List View */}
            {subscriptionType === 'change' && (
              <div className="space-y-3 pt-3 border-t border-slate-200/80 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Subscription Price & Package List
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Select your target bouquet from the space-saving dropdown or list view.
                    </p>
                  </div>

                  {/* Switch between Dropdown and List View */}
                  <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setPriceListViewMode('dropdown')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                        priceListViewMode === 'dropdown'
                          ? 'bg-white shadow-2xs text-purple-700 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>Dropdown List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceListViewMode('list')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                        priceListViewMode === 'list'
                          ? 'bg-white shadow-2xs text-purple-700 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3 h-3" />
                      <span>List View</span>
                    </button>
                  </div>
                </div>

                {priceListViewMode === 'dropdown' ? (
                  /* 1. Dropdown Selection View (Space-Saving) */
                  <div className="space-y-3">
                    <div className="relative">
                      <select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-semibold rounded-xl border border-purple-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 appearance-none cursor-pointer"
                      >
                        {availablePackages.map((pkg) => {
                          const isWeekly = pkg.packageName.toLowerCase().includes('week');
                          return (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.packageName} — ₦{pkg.price.toLocaleString('en-NG')} {isWeekly ? '(/ week)' : '(/ month)'}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Compact selected package banner */}
                    {selectedPkg && (
                      <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                            Selected Bouquet:
                          </span>
                          <p className="font-bold text-slate-900 truncate">{selectedPkg.packageName}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {selectedPkg.description || `${selectedPkg.channelsCount || 50}+ HD channels included.`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block">Subscription Price</span>
                          <p className="text-sm sm:text-base font-black text-purple-900 tabular-nums">
                            ₦{selectedPkg.price.toLocaleString('en-NG')}.00
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. Compact List View (Space-Saving) */
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={packageSearch}
                        onChange={(e) => setPackageSearch(e.target.value)}
                        placeholder="Search bouquets or channels..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {availablePackages
                        .filter((pkg) => {
                          if (!packageSearch.trim()) return true;
                          const q = packageSearch.toLowerCase();
                          return (
                            pkg.packageName.toLowerCase().includes(q) ||
                            (pkg.description && pkg.description.toLowerCase().includes(q))
                          );
                        })
                        .map((pkg) => {
                          const isSelected = selectedPackageId === pkg.id;
                          const isWeekly = pkg.packageName.toLowerCase().includes('week');
                          return (
                            <div
                              key={pkg.id}
                              onClick={() => setSelectedPackageId(pkg.id)}
                              className={`px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs transition cursor-pointer ${
                                isSelected ? 'bg-purple-50/80 font-bold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-purple-600 bg-purple-600 text-white'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <div className="truncate">
                                  <span className="text-slate-900">{pkg.packageName}</span>
                                  {isWeekly && (
                                    <span className="ml-2 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                      Weekly
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-slate-900 tabular-nums">
                                  ₦{pkg.price.toLocaleString('en-NG')}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1">
                                  {isWeekly ? '/wk' : '/mo'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons for Partition 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setCurrentStep('verify')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Decoder</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('summary')}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                <span>Proceed to Payment Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PARTITION 3: PAYMENT SUMMARY ON A DIFFERENT PAGE (PAGE 3)                 */}
      {/* ========================================================================= */}
      {currentStep === 'summary' && verificationResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-xs space-y-5 sm:space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                3. Payment Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review subscription fees and transaction breakdown before final payment.
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {subscriptionType === 'renew' ? 'Renewal Order' : 'Package Change'}
            </span>
          </div>

          {/* Breakdown Table */}
          <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 text-xs sm:text-[13px]">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Service Provider</span>
              <span className="font-bold text-slate-900">{selectedService}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Subscription Bouquet</span>
              <span className="font-bold text-slate-900 text-right">{effectivePackageName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Customer Name</span>
              <span className="font-semibold text-slate-900 text-right">{verificationResult.customerName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">
                {selectedService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {verificationResult.smartcardNumber}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Subscription Price</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                ₦{subscriptionFee.toLocaleString('en-NG')}.00
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Convenience Service Fee</span>
              <span className="font-semibold text-emerald-600 tabular-nums">₦0.00 (Zero Fee)</span>
            </div>

            <div className="flex items-center justify-between pt-2 text-sm sm:text-base font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-blue-600 tabular-nums">
                ₦{totalAmount.toLocaleString('en-NG')}.00
              </span>
            </div>
          </div>

          {/* Wallet Balance Status Card */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
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
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs font-semibold text-rose-600">
                  Insufficient balance
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard/fund-wallet')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Fund Wallet
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sufficient Balance</span>
              </div>
            )}
          </div>

          {/* Navigation Buttons for Partition 3 */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setCurrentStep('select_plan')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Plan Selection</span>
            </button>

            <button
              type="button"
              disabled={!hasSufficientBalance}
              onClick={() => setCurrentStep('confirm')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Proceed to Confirmation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PARTITION 4: CONFIRMATION PAGE ON ANOTHER PAGE (PAGE 4)                   */}
      {/* ========================================================================= */}
      {currentStep === 'confirm' && verificationResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-md space-y-5 sm:space-y-6 animate-in fade-in duration-150">
          <div className="text-center space-y-1.5 pb-3 sm:pb-4 border-b border-slate-100">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Confirm Cable TV Payment
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please review your details below. Authorizing this payment will deduct funds directly from your JDpay wallet.
            </p>
          </div>

          {/* Prominent Amount Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-center space-y-1">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total Deduction Amount
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              ₦{totalAmount.toLocaleString('en-NG')}.00
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold inline-block">
              {subscriptionType === 'renew' ? 'Bouquet Renewal' : 'Bouquet Upgrade/Change'}
            </span>
          </div>

          {/* Details Table: Responsive for Phone, Tablet, Laptop */}
          <div className="bg-slate-50 rounded-xl p-3.5 sm:p-5 border border-slate-200/80 space-y-2.5 sm:space-y-3 text-xs sm:text-[13px]">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Broadcaster</span>
              <span className="font-bold text-slate-900">{selectedService}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Subscriber Name</span>
              <span className="font-semibold text-slate-900 text-right">{verificationResult.customerName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">
                {selectedService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {verificationResult.smartcardNumber}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Bouquet Plan</span>
              <span className="font-bold text-blue-700 text-right">{effectivePackageName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Wallet Balance Before</span>
              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                ₦{currentUser.walletBalance.toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Remaining Balance After</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                ₦{Math.max(0, currentUser.walletBalance - totalAmount).toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Signal Delivery</span>
              <span className="font-bold text-emerald-600">Immediate Signal Refresh</span>
            </div>
          </div>

          {/* Notice info */}
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Please make sure your decoder is turned on to receive broadcast activation signal within 2 minutes of payment.
          </p>

          {/* 6-Digit Transaction PIN Verification */}
          <div className="p-3.5 sm:p-4.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Enter 6-Digit Payment PIN *
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {showPin ? 'Hide PIN' : 'Show PIN'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Enter your registered 6-digit transaction PIN (default: 123456) to confirm payment authorization.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="relative w-full sm:w-64 max-w-xs">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={paymentPin}
                  onChange={(e) => {
                    setPaymentPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setPaymentError('');
                  }}
                  placeholder="••••••"
                  className="w-full px-4 py-2.5 text-center text-sm font-mono tracking-[0.5em] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-bold"
                />
              </div>
              <span className={`text-xs font-semibold ${paymentPin.length === 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {paymentPin.length === 6 ? '✓ 6 digits entered' : `${paymentPin.length}/6 digits`}
              </span>
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Action Buttons for Partition 4 */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isPaying}
              onClick={() => setCurrentStep('summary')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Summary</span>
            </button>

            <button
              type="button"
              disabled={isPaying || !hasSufficientBalance}
              onClick={handleConfirmPayment}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isPaying ? (
                <>
                  <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Pay ₦{totalAmount.toLocaleString('en-NG')}.00</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
