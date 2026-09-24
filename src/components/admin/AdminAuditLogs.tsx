import React, { useState, useEffect } from 'react';
import { FileText, Search, Shield, Clock, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuditLog } from '../../types';

export const AdminAuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('[AdminAuditLogs] Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  let filteredLogs = logs;

  if (actionFilter !== 'all') {
    filteredLogs = filteredLogs.filter((l) => l.action === actionFilter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (l) =>
        l.adminName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.targetUserId && l.targetUserId.toLowerCase().includes(q)) ||
        (l.transactionId && l.transactionId.toLowerCase().includes(q)) ||
        l.action.toLowerCase().includes(q)
    );
  }

  const getBadgeStyle = (action: string) => {
    if (action.includes('WALLET')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('REFUND')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('STATUS')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('PACKAGE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Administrative Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Immutable event log tracking all staff actions, wallet credits, refunds, bouquet adjustments, and system broadcasts.
        </p>
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
            placeholder="Search audit trail by administrator, target ID or details..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 bg-white"
          >
            <option value="all">All Action Types</option>
            <option value="WALLET_ADJUSTMENT">Wallet Adjustments</option>
            <option value="REFUND_ISSUED">Refunds</option>
            <option value="PENDING_RESOLVED">Pending Switch Resolutions</option>
            <option value="CUSTOMER_STATUS_CHANGED">Account Status Changes</option>
            <option value="PACKAGE_PRICE_UPDATED">Package Price Updates</option>
            <option value="SERVICE_STATUS_CHANGED">Service Toggles</option>
            <option value="BROADCAST_SENT">Broadcast Transmissions</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No audit logs found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Timestamp (WAT)</th>
                  <th className="py-3 px-6">Administrator</th>
                  <th className="py-3 px-6">Action Category</th>
                  <th className="py-3 px-6 font-mono">Target Entity</th>
                  <th className="py-3 px-6">Audit Description & Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>{log.adminName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600 tabular-nums whitespace-nowrap text-[11px]">
                      {log.targetUserId || log.transactionId || 'SYSTEM'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
