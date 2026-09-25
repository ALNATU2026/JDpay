import React, { useState, useEffect } from 'react';
import {
  Percent,
  Download,
  Search,
  RefreshCw,
  PlusCircle,
  Tv,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  X,
} from 'lucide-react';
import {
  CableServiceName,
  CommissionRecord,
  CommissionSummary,
  Transaction,
  User,
} from '../../types';
import { adminService } from '../../services/adminService';
import { cableService } from '../../services/cableService';
import { StatusBadge } from '../common/StatusBadge';
import { ReceiptModal } from '../common/ReceiptModal';
import { TransactionDetailsModal } from '../common/TransactionDetailsModal';

interface AdminCommissionsProps {
  adminUser?: User | null;
}

export const AdminCommissions: React.FC<AdminCommissionsProps> = ({ adminUser }) => {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalCommissionEarned: 0,
    dstvCommission: 0,
    dstvVolume: 0,
    dstvCount: 0,
    gotvCommission: 0,
    gotvVolume: 0,
    gotvCount: 0,
    startimesCommission: 0,
    startimesVolume: 0,
    startimesCount: 0,
    totalTransactionsCount: 0,
    totalVolume: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<CableServiceName | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Transaction | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Direct Admin Payment Form State
  const [payService, setPayService] = useState<CableServiceName>('DStv');
  const [paySmartcard, setPaySmartcard] = useState('');
  const [payCustomerName, setPayCustomerName] = useState('');
  const [payPackageId, setPayPackageId] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);
  const [payErrorMsg, setPayErrorMsg] = useState<string | null>(null);

  const availablePackages = cableService.getPackages(payService);
  const selectedPackageObj = availablePackages.find((p) => p.id === payPackageId) || availablePackages[0];

  const payAmount = selectedPackageObj ? selectedPackageObj.price : 0;
  const payCommRate = payService === 'DStv' ? 0.018 : 0.02;
  const payCommPct = payService === 'DStv' ? 1.8 : 2.0;
  const payExpectedComm = Number(((payAmount * payCommPct) / 100).toFixed(2));

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCommissions({
        service: serviceFilter,
        status: statusFilter,
        search,
      });
      setCommissions(data.commissions);
      setSummary(data.summary);
    } catch (err: any) {
      console.error('[AdminCommissions] Error loading commissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, [serviceFilter, statusFilter, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCommissions();
  };

  const handleExport = () => {
    adminService.exportCommissionsCSV(commissions);
  };

  const handleVerifyDecoder = async () => {
    if (!paySmartcard.trim()) return;
    try {
      setIsVerifying(true);
      setVerificationFeedback(null);
      setPayErrorMsg(null);
      const res = await cableService.verifyCustomer(payService, paySmartcard, true);
      if (res && res.customerName) {
        setPayCustomerName(res.customerName);
        setVerificationFeedback(`Verified: ${res.customerName} (${res.accountStatus || 'Active'})`);
        if (res.phone) {
          setPayPhone(res.phone);
        }
      }
    } catch (err: any) {
      setVerificationFeedback(null);
      setPayErrorMsg(err.message || 'Verification failed. Please check the decoder number.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExecuteAdminPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySmartcard.trim() || !payCustomerName.trim() || !selectedPackageObj) {
      setPayErrorMsg('Please fill in all mandatory decoder and customer fields.');
      return;
    }

    try {
      setIsSubmittingPay(true);
      setPayErrorMsg(null);
      setPaySuccessMsg(null);

      const result = await adminService.payCableDirect({
        service: payService,
        package: selectedPackageObj.packageName,
        smartcardNumber: paySmartcard.trim(),
        customerName: payCustomerName.trim(),
        amount: selectedPackageObj.price,
        phone: payPhone.trim(),
        variationCode: selectedPackageObj.variationCode,
        subscriptionType: 'renew',
        notes: payNotes.trim() || `Admin Walk-in Payment with ${payCommPct}% commission`,
      });

      setPaySuccessMsg(
        `Payment successful! Recorded commission of ₦${result.commission.commissionAmount.toLocaleString('en-NG')} (${result.commission.commissionPercentage}% on ${result.commission.service}).`
      );

      // Reload ledger
      await loadCommissions();

      // Reset form after short delay
      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaySuccessMsg(null);
        setPaySmartcard('');
        setPayCustomerName('');
        setPayPhone('');
        setPayNotes('');
        setVerificationFeedback(null);
      }, 2000);
    } catch (err: any) {
      setPayErrorMsg(err.message || 'Payment execution failed.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              VTpass Commissions Ledger
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Live Rebates
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time tracking of <strong>1.8%</strong> on DStv and <strong>2.0%</strong> on GOtv & StarTimes from every VTpass payment.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsPayModalOpen(true);
              setPayErrorMsg(null);
              setPaySuccessMsg(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Make Direct Admin Payment</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Commission Rules Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DStv 1.8% Rule */}
        <div className="bg-linear-to-br from-blue-900 to-slate-950 text-white p-5 rounded-2xl border border-blue-800/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-15">
            <Percent className="w-24 h-24 text-blue-400" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
                MultiChoice DStv
              </span>
              <span className="text-xl font-black text-blue-400">1.8%</span>
            </div>
            <div className="text-lg font-bold text-white">DStv Commission</div>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Automated 1.8% rebate recorded on every DStv bouquet activation or renewal.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-blue-200">Total Earned:</span>
              <span className="font-bold text-white tabular-nums">₦{summary.dstvCommission.toLocaleString('en-NG')}.00</span>
            </div>
          </div>
        </div>

        {/* GOtv 2.0% Rule */}
        <div className="bg-linear-to-br from-emerald-950 to-slate-950 text-white p-5 rounded-2xl border border-emerald-800/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-15">
            <Percent className="w-24 h-24 text-emerald-400" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                MultiChoice GOtv
              </span>
              <span className="text-xl font-black text-emerald-400">2.0%</span>
            </div>
            <div className="text-lg font-bold text-white">GOtv Commission</div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Automated 2.0% rebate recorded on every GOtv Supa+, Max, Plus, or Jolli renewal.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-emerald-200">Total Earned:</span>
              <span className="font-bold text-white tabular-nums">₦{summary.gotvCommission.toLocaleString('en-NG')}.00</span>
            </div>
          </div>
        </div>

        {/* StarTimes 2.0% Rule */}
        <div className="bg-linear-to-br from-purple-950 to-slate-950 text-white p-5 rounded-2xl border border-purple-800/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-15">
            <Percent className="w-24 h-24 text-purple-400" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
                StarTimes Digital
              </span>
              <span className="text-xl font-black text-purple-400">2.0%</span>
            </div>
            <div className="text-lg font-bold text-white">StarTimes Commission</div>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Automated 2.0% rebate recorded on every StarTimes antenna or dish subscription.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-purple-200">Total Earned:</span>
              <span className="font-bold text-white tabular-nums">₦{summary.startimesCommission.toLocaleString('en-NG')}.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Commission</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">
            ₦{summary.totalCommissionEarned.toLocaleString('en-NG')}.00
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all broadcaster activations</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">DStv Earnings (1.8%)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              1.8%
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 tabular-nums">
            ₦{summary.dstvCommission.toLocaleString('en-NG')}.00
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.dstvCount} payments • ₦{summary.dstvVolume.toLocaleString('en-NG')} vol</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GOtv Earnings (2.0%)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              2.0%
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 tabular-nums">
            ₦{summary.gotvCommission.toLocaleString('en-NG')}.00
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.gotvCount} payments • ₦{summary.gotvVolume.toLocaleString('en-NG')} vol</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">StarTimes (2.0%)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              2.0%
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 tabular-nums">
            ₦{summary.startimesCommission.toLocaleString('en-NG')}.00
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.startimesCount} payments • ₦{summary.startimesVolume.toLocaleString('en-NG')} vol</div>
        </div>
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
            placeholder="Search by customer name, smartcard/IUC, or transaction reference..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 bg-white"
          >
            <option value="all">All Providers</option>
            <option value="DStv">DStv Only (1.8%)</option>
            <option value="GOtv">GOtv Only (2.0%)</option>
            <option value="StarTimes">StarTimes Only (2.0%)</option>
          </select>
        </div>

        <div className="w-full sm:w-36">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Commissions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {commissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No commission records found matching the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Transaction Ref</th>
                  <th className="py-3 px-6">Broadcaster / Bouquet</th>
                  <th className="py-3 px-6">Subscriber / Smartcard</th>
                  <th className="py-3 px-6 text-right">Payment Volume</th>
                  <th className="py-3 px-6 text-center">Comm. Rate</th>
                  <th className="py-3 px-6 text-right">Commission Earned</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Source</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {commissions.map((c) => {
                  const isDstv = c.service === 'DStv';
                  const rateBadgeColor = isDstv
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : c.service === 'GOtv'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <tr key={c.id || c.transactionReference} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {c.transactionReference}
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isDstv ? 'text-blue-600' : c.service === 'GOtv' ? 'text-emerald-600' : 'text-purple-600'
                          }`}
                        >
                          {c.service}
                        </span>
                        <span className="text-slate-500 ml-1.5 font-medium">{c.package}</span>
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{c.customerName}</div>
                        <div className="text-slate-400 font-mono text-[11px] tabular-nums">
                          {c.smartcardNumber}
                        </div>
                      </td>

                      <td className="py-3.5 px-6 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        ₦{c.amount.toLocaleString('en-NG')}.00
                      </td>

                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${rateBadgeColor}`}>
                          {c.commissionPercentage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right tabular-nums whitespace-nowrap">
                        <span className="font-black text-emerald-600 text-sm">
                          +₦{c.commissionAmount.toLocaleString('en-NG')}.00
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        <StatusBadge status={c.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Zap className="w-3 h-3 text-amber-500" />
                          VTpass
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const mockTx: Transaction = {
                              id: c.transactionId || c.id,
                              transactionReference: c.transactionReference,
                              userId: 'admin',
                              customerName: c.customerName,
                              service: c.service,
                              package: c.package,
                              smartcardNumber: c.smartcardNumber,
                              amount: c.amount,
                              serviceFee: 0,
                              totalAmount: c.amount,
                              status: c.status,
                              providerReference: c.providerReference || c.transactionReference,
                              commissionRate: c.commissionRate,
                              commissionPercentage: c.commissionPercentage,
                              commissionAmount: c.commissionAmount,
                              recordedBy: c.recordedBy,
                              createdAt: c.createdAt,
                              updatedAt: c.createdAt,
                            };
                            setSelectedDetail(mockTx);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= DIRECT ADMIN PAYMENT MODAL ================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-purple-600" />
                  Make Direct Admin Cable Payment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Process subscription directly via VTpass and automatically record the 1.8% or 2.0% commission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paySuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paySuccessMsg}</span>
              </div>
            )}

            {payErrorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{payErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAdminPayment} className="space-y-4">
              {/* Select Service */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cable TV Provider *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DStv', 'GOtv', 'StarTimes'] as const).map((srv) => {
                    const isSelected = payService === srv;
                    const commPct = srv === 'DStv' ? '1.8%' : '2.0%';
                    return (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => {
                          setPayService(srv);
                          setPayPackageId('');
                          setVerificationFeedback(null);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs">{srv}</div>
                        <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                          {commPct} Commission
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smartcard / IUC & Verification */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {payService === 'GOtv' ? 'IUC Number' : 'Smartcard Number'} *
                  </label>
                  <button
                    type="button"
                    onClick={handleVerifyDecoder}
                    disabled={isVerifying || !paySmartcard.trim()}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    <span>Verify Decoder</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={paySmartcard}
                    onChange={(e) => setPaySmartcard(e.target.value)}
                    placeholder={
                      payService === 'GOtv' ? 'e.g. 2012345678 (10 digits)' : 'e.g. 41234567890 (10-11 digits)'
                    }
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyDecoder}
                    disabled={isVerifying || !paySmartcard.trim()}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </div>
                {verificationFeedback && (
                  <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{verificationFeedback}</span>
                  </p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subscriber / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={payCustomerName}
                  onChange={(e) => setPayCustomerName(e.target.value)}
                  placeholder="e.g. Babatunde Adeyemi"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Bouquet Package Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Bouquet Package *
                </label>
                <select
                  value={payPackageId || (availablePackages[0]?.id ?? '')}
                  onChange={(e) => setPayPackageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 bg-white"
                >
                  {availablePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.packageName} — ₦{p.price.toLocaleString('en-NG')}.00
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Phone & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="080 1234 5678"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Admin Note
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Office customer walk-in"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>

              {/* Commission Preview Card */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Subscription Cost:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    ₦{payAmount.toLocaleString('en-NG')}.00
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1 text-purple-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    VTpass Commission ({payCommPct}%):
                  </span>
                  <span className="font-black text-emerald-600 text-sm tabular-nums">
                    +₦{payExpectedComm.toLocaleString('en-NG')}.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-purple-200/60 leading-relaxed">
                  Upon fulfillment, ₦{payExpectedComm.toLocaleString('en-NG')} will be registered immediately onto this Commission Ledger.
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPay ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fulfilling via VTpass...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Confirm & Pay ₦{payAmount.toLocaleString('en-NG')}.00</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipts & Detail Modals */}
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
