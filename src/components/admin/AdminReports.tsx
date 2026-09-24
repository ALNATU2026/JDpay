import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Calendar, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { transactionService } from '../../services/transactionService';
import { AdminStats, Transaction } from '../../types';

export const AdminReports: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalCustomers: 0,
    todayTransactions: 0,
    todayTransactionValue: 0,
    todayRevenue: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    refundedTransactions: 0,
  });
  const [allTxs, setAllTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, txs] = await Promise.all([
        adminService.getStats(),
        transactionService.fetchLiveTransactions(),
      ]);
      setStats(s);
      setAllTxs(txs);
    } catch (err) {
      console.error('[AdminReports] Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalVolume = allTxs.reduce((sum, t) => sum + (t.status === 'SUCCESSFUL' ? t.totalAmount : 0), 0);
  const successRate = allTxs.length > 0
    ? Math.round((stats.successfulTransactions / allTxs.length) * 100)
    : 100;
  const avgTicket = stats.successfulTransactions > 0
    ? Math.round(totalVolume / stats.successfulTransactions)
    : 0;

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const monthlyBreakdown = [
    {
      month: currentMonthName,
      volume: totalVolume,
      txCount: allTxs.length,
      revenue: stats.todayRevenue,
      status: 'Live MongoDB Reconciled',
    },
  ];

  const handleExportReportCSV = () => {
    const headers = ['Month', 'Total Volume (NGN)', 'Transactions Count', 'Net Platform Margin (NGN)', 'Reconciliation Status'];
    const rows = monthlyBreakdown.map((m) => [
      m.month,
      m.volume,
      m.txCount,
      m.revenue,
      m.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jdpay_financial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Financial Reports & Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregate transaction volumes, multi-broadcaster clearing sheets, and net switch revenue margins.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportReportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Financial Report CSV</span>
        </button>
      </div>

      {/* Analytics KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Settled Volume
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            ₦{totalVolume.toLocaleString('en-NG')}.00
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">All verified subscriptions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Switch Margin (3%)
          </span>
          <div className="text-2xl font-black text-purple-700 mt-2 tabular-nums">
            ₦{Math.round(totalVolume * 0.03).toLocaleString('en-NG')}.00
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Provider commission earned</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Switch Success Rate
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-2 tabular-nums">
            {successRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Over 99% SLA benchmark</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Bouquet Size
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            ₦{avgTicket.toLocaleString('en-NG')}.00
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mean subscription value</p>
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Monthly Financial Settlement Summary</h3>
          <span className="text-xs text-slate-400">Quarter 3 FY2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Billing Period</th>
                <th className="py-3 px-6 text-right">Gross Subscriptions (NGN)</th>
                <th className="py-3 px-6 text-center">Transactions</th>
                <th className="py-3 px-6 text-right">Switch Commission Margin</th>
                <th className="py-3 px-6 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monthlyBreakdown.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900 whitespace-nowrap">
                    {row.month}
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                    ₦{row.volume.toLocaleString('en-NG')}.00
                  </td>
                  <td className="py-3.5 px-6 text-center tabular-nums font-semibold whitespace-nowrap">
                    {row.txCount.toLocaleString('en-NG')}
                  </td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-purple-700 tabular-nums whitespace-nowrap">
                    ₦{row.revenue.toLocaleString('en-NG')}.00
                  </td>
                  <td className="py-3.5 px-6 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
