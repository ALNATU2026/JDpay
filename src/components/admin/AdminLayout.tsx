import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Tv,
  Wallet,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sliders,
  Package,
  Bell,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ArrowLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { User, isMegaSuperAdminUser } from '../../types';

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User;
  onLogout: () => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  onNavigate,
  currentUser,
  onLogout,
  onExitAdmin,
  children,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const adminNavItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'All Transactions', path: '/admin/transactions', icon: Clock },
    { label: 'Cable Payments', path: '/admin/cable-payments', icon: Tv },
    { label: 'Wallet Adjustments', path: '/admin/wallets', icon: Wallet },
    { label: 'Pending Transactions', path: '/admin/pending', icon: AlertCircle },
    { label: 'Failed Transactions', path: '/admin/failed', icon: XCircle },
    { label: 'Refunds', path: '/admin/refunds', icon: RotateCcw },
    { label: 'Cable Services', path: '/admin/services', icon: Sliders },
    { label: 'Bouquet Packages', path: '/admin/packages', icon: Package },
    { label: 'Broadcasts', path: '/admin/notifications', icon: Bell },
    { label: 'Reports & Revenue', path: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  const handleNav = (path: string) => {
    setIsMobileNavOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900">
      {/* ================= DESKTOP ADMIN SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        {/* Admin Brand Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800/80">
          <button
            onClick={() => handleNav('/admin')}
            className="flex items-center gap-2.5 focus:outline-hidden group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              JD
            </div>
            <span className="text-xl font-black tracking-tight text-white font-sans">
              JD<span className="text-purple-400">admin</span>
            </span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/50">
            SECURE
          </span>
        </div>

        {/* Admin User Mini Card */}
        <div
          className={`p-3.5 mx-3 my-3 rounded-xl flex items-center gap-3 border ${
            isMegaSuperAdminUser(currentUser)
              ? 'bg-linear-to-r from-purple-950/80 to-amber-950/40 border-amber-500/40 ring-1 ring-amber-500/20'
              : 'bg-purple-950/40 border-purple-900/40'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
              isMegaSuperAdminUser(currentUser)
                ? 'bg-linear-to-br from-amber-400 to-amber-600 text-slate-950'
                : 'bg-purple-600 text-white'
            }`}
          >
            {isMegaSuperAdminUser(currentUser) ? <Crown className="w-4 h-4 fill-slate-950" /> : <Shield className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
            </div>
            <p
              className={`text-[10px] font-mono truncate font-semibold ${
                isMegaSuperAdminUser(currentUser) ? 'text-amber-400' : 'text-purple-300'
              }`}
            >
              {isMegaSuperAdminUser(currentUser) ? 'Mega Super Admin' : 'Administrator'}
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-950/40 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Customer Mode</span>
            </div>
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Bar */}
        <header className="h-18 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                System Administration
              </span>
              <span className="hidden sm:inline text-xs font-bold text-slate-800 ml-2 capitalize">
                {currentPath.replace('/admin/', '').replace('/admin', 'Dashboard Overview')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live MongoDB Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800" title="Connected to MongoDB Atlas: jdpay-cluster.ieezqvb.mongodb.net / jdpay">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Atlas Live</span>
            </div>

            <button
              onClick={onExitAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch to Customer App</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  isMegaSuperAdminUser(currentUser)
                    ? 'bg-linear-to-br from-amber-400 to-amber-600 text-slate-950'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {isMegaSuperAdminUser(currentUser) ? <Crown className="w-3.5 h-3.5 fill-slate-950" /> : 'A'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.fullName}
                </span>
                {isMegaSuperAdminUser(currentUser) && (
                  <span className="text-[10px] font-bold text-amber-600">
                    Mega Super Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Admin Nav Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-slate-950 text-slate-300 px-4 py-4 space-y-1 border-b border-slate-800 shadow-xl max-h-[80vh] overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-800 space-y-1">
              <button
                onClick={onExitAdmin}
                className="w-full text-left py-2 text-xs text-blue-400 font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Customer App
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left py-2 text-xs text-rose-400 font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Admin Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
