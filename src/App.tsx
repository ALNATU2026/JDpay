import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { User, CableServiceName, isAnyAdminUser } from './types';
import { authService } from './services/authService';

// Landing & Common
import { LandingPage } from './components/landing/LandingPage';

// Auth Pages
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

// Customer Dashboard
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { CablePaymentPage } from './components/dashboard/CablePaymentPage';
import { FundWalletPage } from './components/dashboard/FundWalletPage';
import { TransactionsPage } from './components/dashboard/TransactionsPage';
import { ReceiptsPage } from './components/dashboard/ReceiptsPage';
import { NotificationsPage } from './components/dashboard/NotificationsPage';
import { ProfilePage } from './components/dashboard/ProfilePage';
import { SupportPage } from './components/dashboard/SupportPage';

// Admin Dashboard
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminTransactions } from './components/admin/AdminTransactions';
import { AdminCablePayments } from './components/admin/AdminCablePayments';
import { AdminCommissions } from './components/admin/AdminCommissions';
import { AdminWallets } from './components/admin/AdminWallets';
import { AdminPendingTransactions } from './components/admin/AdminPendingTransactions';
import { AdminFailedTransactions } from './components/admin/AdminFailedTransactions';
import { AdminRefunds } from './components/admin/AdminRefunds';
import { AdminServices } from './components/admin/AdminServices';
import { AdminPackages } from './components/admin/AdminPackages';
import { AdminNotifications } from './components/admin/AdminNotifications';
import { AdminReports } from './components/admin/AdminReports';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname === '/' || !window.location.pathname ? '/' : window.location.pathname
  );
  const [selectedCableService, setSelectedCableService] = useState<CableServiceName>('DStv');

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, options?: { service?: CableServiceName }) => {
    if (options?.service) {
      setSelectedCableService(options.service);
    }
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefreshUser = () => {
    setCurrentUser(authService.getCurrentUser());
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (isAnyAdminUser(user)) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/');
  };

  // ================= ROUTING LOGIC =================

  // 1. PUBLIC LANDING PAGE
  if (currentPath === '/') {
    return (
      <LandingPage
        onNavigate={navigate}
        currentUser={currentUser}
      />
    );
  }

  // 2. AUTHENTICATION PAGES
  if (currentPath === '/login') {
    return (
      <LoginPage
        onNavigate={navigate}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentPath === '/signup') {
    return (
      <SignupPage
        onNavigate={navigate}
        onSignupSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentPath === '/forgot-password') {
    return <ForgotPasswordPage onNavigate={navigate} />;
  }

  // 3. ADMIN DASHBOARD ROUTES
  if (currentPath.startsWith('/admin')) {
    // If not logged in, route to login
    if (!currentUser) {
      return (
        <LoginPage
          onNavigate={navigate}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    // Role-based protection: only admins can access /admin
    if (!isAnyAdminUser(currentUser)) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Administrator Access Required</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your logged-in account ({currentUser.email}) has standard customer access and cannot view administrative portals.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer"
              >
                Go to My Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <AdminLayout
        currentPath={currentPath}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExitAdmin={() => navigate('/dashboard')}
      >
        {currentPath === '/admin' && <AdminOverview onNavigate={navigate} />}
        {currentPath === '/admin/customers' && <AdminCustomers adminUser={currentUser} />}
        {currentPath === '/admin/transactions' && <AdminTransactions />}
        {currentPath === '/admin/cable-payments' && <AdminCablePayments />}
        {currentPath === '/admin/commissions' && <AdminCommissions adminUser={currentUser} />}
        {currentPath === '/admin/wallets' && <AdminWallets adminUser={currentUser} />}
        {currentPath === '/admin/pending' && <AdminPendingTransactions adminUser={currentUser} />}
        {currentPath === '/admin/failed' && <AdminFailedTransactions adminUser={currentUser} />}
        {currentPath === '/admin/refunds' && <AdminRefunds adminUser={currentUser} />}
        {currentPath === '/admin/services' && <AdminServices adminUser={currentUser} />}
        {currentPath === '/admin/packages' && <AdminPackages adminUser={currentUser} />}
        {currentPath === '/admin/notifications' && <AdminNotifications adminUser={currentUser} />}
        {currentPath === '/admin/reports' && <AdminReports />}
        {currentPath === '/admin/audit-logs' && <AdminAuditLogs />}
      </AdminLayout>
    );
  }

  // 4. CUSTOMER DASHBOARD ROUTES
  if (currentPath.startsWith('/dashboard')) {
    // If not logged in, route to login
    if (!currentUser) {
      return (
        <LoginPage
          onNavigate={navigate}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    return (
      <DashboardLayout
        currentPath={currentPath}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        {currentPath === '/dashboard' && (
          <DashboardHome
            currentUser={currentUser}
            onNavigate={navigate}
          />
        )}

        {currentPath === '/dashboard/cable' && (
          <CablePaymentPage
            currentUser={currentUser}
            initialService={selectedCableService}
            onNavigate={navigate}
            onRefreshUser={handleRefreshUser}
          />
        )}

        {currentPath === '/dashboard/fund-wallet' && (
          <FundWalletPage
            currentUser={currentUser}
            onRefreshUser={handleRefreshUser}
            onNavigate={navigate}
          />
        )}

        {currentPath === '/dashboard/transactions' && (
          <TransactionsPage currentUser={currentUser} />
        )}

        {currentPath === '/dashboard/receipts' && (
          <ReceiptsPage currentUser={currentUser} />
        )}

        {currentPath === '/dashboard/notifications' && (
          <NotificationsPage currentUser={currentUser} />
        )}

        {currentPath === '/dashboard/profile' && (
          <ProfilePage
            currentUser={currentUser}
            onRefreshUser={handleRefreshUser}
          />
        )}

        {currentPath === '/dashboard/support' && (
          <SupportPage currentUser={currentUser} />
        )}
      </DashboardLayout>
    );
  }

  // Fallback -> redirect to home
  return (
    <LandingPage
      onNavigate={navigate}
      currentUser={currentUser}
    />
  );
}
