import React, { useState, useEffect } from 'react';
import { Wallet, Search, ArrowUpRight, ArrowDownRight, ShieldCheck, DollarSign, RefreshCw } from 'lucide-react';
import { User } from '../../types';
import { adminService } from '../../services/adminService';
import { AdminCustomers } from './AdminCustomers';

interface AdminWalletsProps {
  adminUser: User;
}

export const AdminWallets: React.FC<AdminWalletsProps> = ({ adminUser }) => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWallets = async () => {
    try {
      const list = await adminService.getCustomers();
      setCustomers(list);
    } catch (err) {
      console.error('[AdminWallets] Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const totalLiability = customers.reduce((sum, u) => sum + (Number(u.walletBalance) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Customer Wallets & Balances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor aggregated consumer wallet liabilities, virtual account deposits, and initiate auditable credits or debits.
          </p>
        </div>
        <button
          onClick={loadWallets}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Wallets</span>
        </button>
      </div>

      {/* Wallet Liability KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Consumer Wallet Float
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 tabular-nums">
            ₦{totalLiability.toLocaleString('en-NG')}.00
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Real-time float held in MongoDB</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Customer Balance
          </span>
          <div className="text-2xl font-black text-blue-600 mt-2 tabular-nums">
            ₦{customers.length > 0 ? Math.round(totalLiability / customers.length).toLocaleString('en-NG') : 0}.00
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {customers.length} registered customers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settlement Escrow
          </span>
          <div className="text-lg font-bold text-slate-900 mt-2">
            Moniepoint MFB / Wema Bank
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100% Fully Collateralized</p>
        </div>
      </div>

      {/* Re-use customer table with wallet adjustment capabilities */}
      <AdminCustomers adminUser={adminUser} />
    </div>
  );
};
