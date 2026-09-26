import React, { useState } from 'react';
import { Lock, LogOut, ShieldAlert, User as UserIcon } from 'lucide-react';
import { User } from '../../types';
import { PinPad } from './PinPad';
import { authService } from '../../services/authService';

interface IdlePinLockModalProps {
  currentUser: User;
  onUnlock: () => void;
  onLogoutToEmail: () => void;
}

export const IdlePinLockModal: React.FC<IdlePinLockModalProps> = ({
  currentUser,
  onUnlock,
  onLogoutToEmail,
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      setErrorMessage('Please enter your 6-digit PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await authService.loginPin(currentUser.email || currentUser.phone, pin);
      onUnlock();
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect 6-digit PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
        {/* User Badge */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">
            {currentUser.fullName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {currentUser.email}
          </p>

          <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
            Session Locked Due to Inactivity
          </span>
        </div>

        {/* PinPad formatted per user instructions */}
        <PinPad
          title="Enter your pin to login or continue with email"
          pin={pin}
          onPinChange={(val) => {
            setPin(val);
            setErrorMessage('');
          }}
          onSubmit={handlePinSubmit}
          onBackToEmail={onLogoutToEmail}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
};
