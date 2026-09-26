import React, { useState } from 'react';
import { Menu, X, Shield, ArrowRight, Crown } from 'lucide-react';
import { User, isMegaSuperAdminUser, isAnyAdminUser } from '../../types';
import { ThemeToggle } from './ThemeToggle';
import jdpayLogoEmblem from '../../assets/images/jdpay_logo_emblem_1790194797870.jpg';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  currentUser,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Cable TV', path: '/#services' },
    { label: 'About', path: '/#about' },
    { label: 'Contact', path: '/#contact' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center">
          <button
            onClick={() => handleLinkClick('/')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer"
          >
            <img
              src={jdpayLogoEmblem}
              alt="JDpay Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-200 dark:border-slate-700 p-0.5 group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
              JD<span className="text-blue-600 dark:text-blue-400">pay</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (4-6 clean text links) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.path)}
                className={`transition-colors relative py-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary Actions & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300" title="Connected to MongoDB Atlas">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MongoDB Live</span>
          </div>

          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-3">
              {isMegaSuperAdminUser(currentUser) ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-400/50 text-[11px] font-extrabold text-amber-900 dark:text-amber-300 shadow-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Mega Super Admin</span>
                </div>
              ) : null}

              {isAnyAdminUser(currentUser) ? (
                <button
                  onClick={() => handleLinkClick('/admin')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer ${
                    isMegaSuperAdminUser(currentUser)
                      ? 'text-white bg-linear-to-r from-purple-700 via-indigo-600 to-blue-600 hover:opacity-95 ring-1 ring-purple-400/30'
                      : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {isMegaSuperAdminUser(currentUser) ? 'Super Admin Portal' : 'Admin Console'}
                </button>
              ) : null}

              <button
                onClick={() => handleLinkClick(isAnyAdminUser(currentUser) ? '/admin' : '/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleLinkClick('/login')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => handleLinkClick('/signup')}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                Create Account
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button & Theme Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          {currentUser && (
            <button
              onClick={() => handleLinkClick(isAnyAdminUser(currentUser) ? '/admin' : '/dashboard')}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              {isMegaSuperAdminUser(currentUser) ? 'Admin' : 'Dashboard'}
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg focus:outline-hidden"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2 py-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.path)}
                className="text-left px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {currentUser ? (
              <>
                <div className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.fullName}</span>
                </div>
                <button
                  onClick={() => handleLinkClick(currentUser.role === 'admin' ? '/admin' : '/dashboard')}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg text-center"
                >
                  Open Dashboard
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLinkClick('/login')}
                  className="w-full py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg text-center hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Login
                </button>
                <button
                  onClick={() => handleLinkClick('/signup')}
                  className="w-full py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg text-center hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
