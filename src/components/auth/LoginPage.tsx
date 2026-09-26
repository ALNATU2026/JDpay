import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, KeyRound, User as UserIcon } from 'lucide-react';
import { authService } from '../../services/authService';
import { User, isAnyAdminUser } from '../../types';
import { PinPad } from './PinPad';
import { ThemeToggle } from '../common/ThemeToggle';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'password' | 'pin';
  initialIdentifier?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
  initialMode = 'password',
  initialIdentifier = '',
}) => {
  const [mode, setMode] = useState<'password' | 'pin'>(() => {
    const savedLastUser = localStorage.getItem('jdpay_last_identifier');
    if (savedLastUser && initialMode !== 'password') {
      return 'pin';
    }
    return initialMode;
  });

  const [identifier, setIdentifier] = useState(() => {
    return initialIdentifier || localStorage.getItem('jdpay_last_identifier') || '';
  });
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showIdentifierInputInPinMode, setShowIdentifierInputInPinMode] = useState(() => !initialIdentifier && !localStorage.getItem('jdpay_last_identifier'));

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email address or phone number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await authService.login(identifier.trim(), password);
      if (rememberMe) {
        localStorage.setItem('jdpay_last_identifier', identifier.trim());
      }
      onLoginSuccess(user);
      if (isAnyAdminUser(user)) {
        onNavigate('/admin');
      } else {
        onNavigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email or phone number first.');
      setShowIdentifierInputInPinMode(true);
      return;
    }

    if (pin.length !== 6) {
      setErrorMessage('Please enter your complete 6-digit PIN.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await authService.loginPin(identifier.trim(), pin);
      if (rememberMe) {
        localStorage.setItem('jdpay_last_identifier', identifier.trim());
      }
      onLoginSuccess(user);
      if (isAnyAdminUser(user)) {
        onNavigate('/admin');
      } else {
        onNavigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect 6-digit PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
            JD
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Sign In to JDpay
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Instant Cable TV Subscriptions • ₦0 Service Fees
          </p>
        </div>

        {/* MODE 1: 6-DIGIT PIN LOGIN */}
        {mode === 'pin' ? (
          <div className="space-y-4">
            {/* Account identifier display or input */}
            {(!identifier || showIdentifierInputInPinMode) ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account Email or Phone Number:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or 08012345678"
                    className="w-full pl-9.5 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {identifier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIdentifierInputInPinMode(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Change
                </button>
              </div>
            )}

            {/* Custom Keypad matching prompt requirement */}
            <PinPad
              title="Enter your pin to login or continue with email"
              pin={pin}
              onPinChange={(val) => {
                setPin(val);
                setErrorMessage('');
              }}
              onSubmit={handlePinSubmit}
              onBackToEmail={() => {
                setMode('password');
                setErrorMessage('');
                setPin('');
              }}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          </div>
        ) : (
          /* MODE 2: EMAIL & PASSWORD LOGIN */
          <div className="space-y-4">
            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or 08012345678"
                    className="w-full pl-9.5 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Switch to PIN Login */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('pin');
                  setErrorMessage('');
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Sign in with 6-Digit PIN instead</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Create Free Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
