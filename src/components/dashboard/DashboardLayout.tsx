import React, { useState } from 'react';
import {
  LayoutDashboard,
  Tv,
  Wallet,
  Clock,
  Receipt,
  Bell,
  User as UserIcon,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Shield,
  CreditCard,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { User } from '../../types';
import { notificationService } from '../../services/notificationService';
import { ThemeToggle } from '../common/ThemeToggle';

interface DashboardLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User;
  onLogout: () => void;
  onSwitchRole?: () => void;
  onLockSession?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPath,
  onNavigate,
  currentUser,
  onLogout,
  onSwitchRole,
  onLockSession,
  children,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const unreadCount = notificationService.getUnreadCount(currentUser.id);

  const sidebarNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Cable TV', path: '/dashboard/cable', icon: Tv },
    { label: 'Fund Wallet', path: '/dashboard/fund-wallet', icon: Wallet },
    { label: 'Transactions', path: '/dashboard/transactions', icon: Clock },
    { label: 'Receipts', path: '/dashboard/receipts', icon: Receipt },
    {
      label: 'Notifications',
      path: '/dashboard/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Profile', path: '/dashboard/profile', icon: UserIcon },
    { label: 'Support', path: '/dashboard/support', icon: HelpCircle },
  ];

  const handleNav = (path: string) => {
    setIsMobileNavOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 transition-colors">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800/80">
          <button
            onClick={() => handleNav('/dashboard')}
            className="flex items-center gap-2.5 focus:outline-hidden group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              JD
            </div>
            <span className="text-xl font-black tracking-tight text-white font-sans">
              JD<span className="text-blue-400">pay</span>
            </span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Portal
          </span>
        </div>

        {/* User Mini Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
            <p className="text-[11px] text-emerald-400 font-medium tabular-nums truncate">
              ₦{currentUser.walletBalance.toLocaleString('en-NG')}.00
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath === item.path ||
              (item.path === '/dashboard/cable' && currentPath.startsWith('/dashboard/cable'));

            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {onLockSession && (
            <button
              onClick={onLockSession}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/30 rounded-xl transition-colors cursor-pointer"
              title="Lock Session with 6-digit PIN"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Lock Session</span>
            </button>
          )}

          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/30 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Admin Console</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb indicator */}
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer Portal</span>
              <span className="text-xs text-slate-300 dark:text-slate-600 mx-2">/</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                {currentPath.replace('/dashboard/', '').replace('/dashboard', 'Overview')}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Lock Session quick button */}
            {onLockSession && (
              <button
                type="button"
                onClick={onLockSession}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Lock Session (Require PIN to continue)"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Wallet quick balance button */}
            <button
              onClick={() => handleNav('/dashboard/fund-wallet')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <span className="hidden sm:inline text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold tracking-wider leading-none">
                  Wallet Balance
                </span>
                <span className="text-xs font-extrabold tabular-nums">
                  ₦{currentUser.walletBalance.toLocaleString('en-NG')}.00
                </span>
              </div>
            </button>

            {/* Notification bell */}
            <button
              onClick={() => handleNav('/dashboard/notifications')}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => handleNav('/dashboard/profile')}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                {currentUser.fullName.split(' ')[0]}
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-slate-900 dark:bg-slate-950 text-slate-300 px-4 py-4 space-y-1 border-b border-slate-800 shadow-xl">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {onLockSession && (
                <button
                  onClick={onLockSession}
                  className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 py-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Lock
                </button>
              )}
              {onSwitchRole && (
                <button
                  onClick={onSwitchRole}
                  className="text-xs text-purple-300 font-semibold flex items-center gap-1.5 py-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin Console
                </button>
              )}
              <button
                onClick={onLogout}
                className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 py-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

