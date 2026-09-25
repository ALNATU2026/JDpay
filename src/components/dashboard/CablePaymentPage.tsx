import React, { useState, useEffect } from 'react';
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

  // Partition 3 State: Payment Summary & Phone
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Partition 4 State: Confirmation & Processing
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

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
      const matchPkg = availablePackages.find(
        (p) =>
          (result.currentPackage && p.packageName.toLowerCase().includes(result.currentPackage.toLowerCase())) ||
          (result.renewalAmount && p.price === result.renewalAmount)
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
  const renewalPkg =
    availablePackages.find(
      (p) =>
        (verificationResult?.currentPackage &&
          p.packageName.toLowerCase().includes(verificationResult.currentPackage.toLowerCase())) ||
        (verificationResult?.renewalAmount && p.price === verificationResult.renewalAmount)
    ) || selectedPkg;

  // Amount resolution based on subscriptionType
  const subscriptionFee =
    subscriptionType === 'renew'
      ? verificationResult?.renewalAmount || renewalPkg?.price || 0
      : selectedPkg
      ? selectedPkg.price
      : 0;

  const serviceFee = 0; // JDpay provides ₦0.00 service fee
  const totalAmount = subscriptionFee + serviceFee;
  const hasSufficientBalance = currentUser.walletBalance >= totalAmount;

  // Active package for summary/confirmation
  const effectivePackageName =
    subscriptionType === 'renew'
      ? verificationResult?.currentPackage || renewalPkg?.packageName || `${selectedService} Renewal Bouquet`
      : selectedPkg?.packageName || `${selectedService} Standard Bouquet`;

  const effectiveVariationCode =
    subscriptionType === 'renew' ? renewalPkg?.variationCode : selectedPkg?.variationCode;

  // Execute payment
  const handleConfirmPayment = async () => {
    if (!verificationResult || !selectedPkg) return;
    setIsPaying(true);
    setPaymentError('');

    try {
      const tx = await cableService.processCablePayment({
        userId: currentUser.id,
        customerName: verificationResult.customerName,
        service: selectedService,
        packageId: subscriptionType === 'renew' && renewalPkg ? renewalPkg.id : selectedPkg.id,
        smartcardNumber: verificationResult.smartcardNumber,
        phone: phoneNumber || verificationResult.phone || currentUser.phone || '08012345678',
        subscriptionType,
      });

      setCompletedTransaction(tx);
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
    <div className="space-y-6 max-w-3xl mx-auto">
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
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Sandbox test card:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSmartcardNumber('1212121212');
                      performVerification('1212121212', false);
                    }}
                    className="font-mono text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                  >
                    1212121212
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {verifyError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">{verifyError}</span>
                    <p className="text-[11px] text-rose-600 mt-1">
                      For testing, click below to use test decoder card <strong className="font-mono">1212121212</strong> or proceed with simulated decoder.
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Select Subscription Option
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose whether you want to renew your current bouquet or change to a different bouquet.
              </p>
            </div>

            {/* Toggle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Renewal */}
              <button
                type="button"
                onClick={() => setSubscriptionType('renew')}
                className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  subscriptionType === 'renew'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {subscriptionType === 'renew' && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Option A</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Renewal</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Keep and recharge your current active package ({verificationResult.currentPackage || `${selectedService} Compact`}).
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-medium block">Renewal Amount</span>
                  <div className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                    ₦{(verificationResult.renewalAmount || renewalPkg?.price || 0).toLocaleString('en-NG')}.00
                  </div>
                </div>
              </button>

              {/* Option B: Change Package */}
              <button
                type="button"
                onClick={() => setSubscriptionType('change')}
                className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  subscriptionType === 'change'
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {subscriptionType === 'change' && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Option B</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Change Package</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a different bouquet or switch between monthly and weekly plans.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-medium block">Packages Available</span>
                  <div className="text-sm font-bold text-purple-700 mt-1 flex items-center gap-1">
                    <span>Browse & select from {availablePackages.length} packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            </div>

            {/* When Renewal is selected: display ready amount */}
            {subscriptionType === 'renew' && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
                      Ready for Renewal
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {verificationResult.currentPackage || renewalPkg?.packageName || `${selectedService} Bouquet`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Amount</span>
                    <div className="text-lg font-black text-blue-700 tabular-nums">
                      ₦{(verificationResult.renewalAmount || renewalPkg?.price || 0).toLocaleString('en-NG')}.00
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* When Change Package is selected: Price list pops up / displays for selection */}
            {subscriptionType === 'change' && (
              <div className="space-y-4 pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Select New Package
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Click any bouquet below to select it.
                    </p>
                  </div>

                  {/* Duration tabs */}
                  {availablePackages.some((p) => p.packageName.toLowerCase().includes('week')) && (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setBillingCycleFilter('all')}
                        className={`px-3 py-1 rounded-lg transition ${
                          billingCycleFilter === 'all'
                            ? 'bg-white text-blue-600 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({availablePackages.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycleFilter('monthly')}
                        className={`px-3 py-1 rounded-lg transition ${
                          billingCycleFilter === 'monthly'
                            ? 'bg-white text-blue-600 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycleFilter('weekly')}
                        className={`px-3 py-1 rounded-lg transition ${
                          billingCycleFilter === 'weekly'
                            ? 'bg-white text-blue-600 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Weekly
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={packageSearch}
                    onChange={(e) => setPackageSearch(e.target.value)}
                    placeholder="Search bouquets or channels..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* Package Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                  {availablePackages
                    .filter((pkg) => {
                      if (billingCycleFilter === 'monthly') {
                        if (pkg.packageName.toLowerCase().includes('week')) return false;
                      }
                      if (billingCycleFilter === 'weekly') {
                        if (!pkg.packageName.toLowerCase().includes('week')) return false;
                      }
                      if (packageSearch.trim()) {
                        const q = packageSearch.toLowerCase();
                        return (
                          pkg.packageName.toLowerCase().includes(q) ||
                          (pkg.description && pkg.description.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    })
                    .map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      const isWeekly = pkg.packageName.toLowerCase().includes('week');
                      const isQuarterly = pkg.packageName.toLowerCase().includes('quarter');
                      const isYearly = pkg.packageName.toLowerCase().includes('year');
                      const cycleText = isWeekly
                        ? '/ week'
                        : isQuarterly
                        ? '/ quarter'
                        : isYearly
                        ? '/ year'
                        : '/ month';

                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap pr-5">
                              <h5 className="text-xs font-bold text-slate-900">{pkg.packageName}</h5>
                              {isWeekly && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                  Weekly
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {pkg.description || `${pkg.channelsCount || 50}+ HD channels included.`}
                            </p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                              ₦{pkg.price.toLocaleString('en-NG')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{cycleText}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Selected Package Banner */}
                {selectedPkg && (
                  <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase">Selected Bouquet:</span>
                      <p className="font-bold text-slate-900">{selectedPkg.packageName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">Price</span>
                      <p className="font-extrabold text-purple-900 tabular-nums">
                        ₦{selectedPkg.price.toLocaleString('en-NG')}.00
                      </p>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                3. Payment Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify subscription fees and enter SMS confirmation phone number.
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {subscriptionType === 'renew' ? 'Renewal Order' : 'Package Change'}
            </span>
          </div>

          {/* Breakdown Table */}
          <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-5 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Service Provider</span>
              <span className="font-bold text-slate-900">{selectedService}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Subscription Bouquet</span>
              <span className="font-bold text-slate-900">{effectivePackageName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Customer Name</span>
              <span className="font-semibold text-slate-900">{verificationResult.customerName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">
                {selectedService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {verificationResult.smartcardNumber}
              </span>
            </div>

            {/* Editable SMS Notification Phone */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">SMS Notification Phone</span>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  className="text-right text-xs font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36"
                />
              </div>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Subscription Price</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                ₦{subscriptionFee.toLocaleString('en-NG')}.00
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500">Convenience Service Fee</span>
              <span className="font-semibold text-emerald-600 tabular-nums">₦0.00 (Zero Fee)</span>
            </div>

            <div className="flex justify-between pt-2 text-base font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-blue-600 tabular-nums">
                ₦{totalAmount.toLocaleString('en-NG')}.00
              </span>
            </div>
          </div>

          {/* Wallet Balance Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
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

          {/* Navigation Buttons for Partition 3 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setCurrentStep('select_plan')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Plan Selection</span>
            </button>

            <button
              type="button"
              disabled={!hasSufficientBalance}
              onClick={() => setCurrentStep('confirm')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in duration-150">
          <div className="text-center space-y-2 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Confirm Cable TV Payment
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please review the details below. Authorizing this payment will deduct funds directly from your JDpay wallet.
            </p>
          </div>

          {/* Prominent Amount Banner */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-center space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total Deduction Amount
            </span>
            <div className="text-3xl font-black text-white tabular-nums tracking-tight">
              ₦{totalAmount.toLocaleString('en-NG')}.00
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold inline-block">
              {subscriptionType === 'renew' ? 'Bouquet Renewal' : 'Bouquet Upgrade/Change'}
            </span>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Broadcaster</span>
              <span className="font-bold text-slate-900">{selectedService}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Subscriber Name</span>
              <span className="font-semibold text-slate-900">{verificationResult.customerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">
                {selectedService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {verificationResult.smartcardNumber}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Bouquet Plan</span>
              <span className="font-bold text-blue-700">{effectivePackageName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Wallet Balance Before</span>
              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                ₦{currentUser.walletBalance.toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Remaining Balance After</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                ₦{Math.max(0, currentUser.walletBalance - totalAmount).toLocaleString('en-NG')}.00
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Signal Delivery</span>
              <span className="font-bold text-emerald-600">Immediate Signal Refresh</span>
            </div>
          </div>

          {/* Notice info */}
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Please make sure your decoder is turned on to receive broadcast activation signal within 2 minutes of payment.
          </p>

          {/* Payment Error */}
          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Action Buttons for Partition 4 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
