import React, { useEffect } from 'react';
import { Delete, ArrowRight, Lock, KeyRound } from 'lucide-react';

interface PinPadProps {
  title?: string;
  subtitle?: string;
  pin: string;
  onPinChange: (pin: string) => void;
  onSubmit: () => void;
  onBackToEmail?: () => void;
  isLoading?: boolean;
  errorMessage?: string;
  maxDigits?: number;
  identifier?: string;
}

export const PinPad: React.FC<PinPadProps> = ({
  title = 'Enter your pin to login or continue with email',
  subtitle,
  pin,
  onPinChange,
  onSubmit,
  onBackToEmail,
  isLoading = false,
  errorMessage = '',
  maxDigits = 6,
  identifier,
}) => {
  // Listen for physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input or textarea has focus
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (pin.length < maxDigits) {
          const next = pin + e.key;
          onPinChange(next);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (pin.length > 0) {
          onPinChange(pin.slice(0, -1));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === maxDigits && !isLoading) {
          onSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, maxDigits, isLoading, onPinChange, onSubmit]);

  const handleDigitClick = (digit: string) => {
    if (isLoading) return;
    if (pin.length < maxDigits) {
      const next = pin + digit;
      onPinChange(next);
    }
  };

  const handleDelete = () => {
    if (isLoading) return;
    if (pin.length > 0) {
      onPinChange(pin.slice(0, -1));
    }
  };

  const handleEnter = () => {
    if (isLoading) return;
    if (pin.length === maxDigits) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center select-none text-center">
      {/* Header Prompt */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug px-2">
          {title}
        </h3>
        {identifier && (
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 truncate max-w-xs">
            {identifier}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium animate-shake">
          {errorMessage}
        </div>
      )}

      {/* 6-Digit Visual Indicators */}
      <div className="flex items-center justify-center gap-3 my-4">
        {Array.from({ length: maxDigits }).map((_, idx) => {
          const isFilled = idx < pin.length;
          const isCurrent = idx === pin.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                isFilled
                  ? 'bg-blue-600 dark:bg-blue-500 scale-110 shadow-xs'
                  : isCurrent
                  ? 'border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-slate-800'
                  : 'border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60'
              }`}
            />
          );
        })}
      </div>

      {/* Numeric Keypad:
          1 2 3
          4 5 6
          7 8 9
          delet 0 enter
      */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3 my-3">
        {/* Row 1 */}
        {['1', '2', '3'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={isLoading}
            onClick={() => handleDigitClick(num)}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-xl font-bold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-50"
          >
            {num}
          </button>
        ))}

        {/* Row 2 */}
        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={isLoading}
            onClick={() => handleDigitClick(num)}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-xl font-bold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-50"
          >
            {num}
          </button>
        ))}

        {/* Row 3 */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={isLoading}
            onClick={() => handleDigitClick(num)}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-xl font-bold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-50"
          >
            {num}
          </button>
        ))}

        {/* Row 4: delet  0  enter */}
        <button
          type="button"
          disabled={isLoading || pin.length === 0}
          onClick={handleDelete}
          className="h-14 rounded-2xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-40"
          title="Delete last digit"
        >
          <span className="capitalize">delet</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleDigitClick('0')}
          className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-xl font-bold text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/60 dark:border-slate-700/60 disabled:opacity-50"
        >
          0
        </button>

        <button
          type="button"
          disabled={isLoading || pin.length < maxDigits}
          onClick={handleEnter}
          className={`h-14 rounded-2xl active:scale-95 text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
            pin.length === maxDigits
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-500/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200/60 dark:border-slate-700/60 opacity-50 cursor-not-allowed'
          }`}
          title="Submit PIN"
        >
          {isLoading ? (
            <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <span className="capitalize">enter</span>
          )}
        </button>
      </div>

      {/* Back to Email Login Link */}
      {onBackToEmail && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full text-center">
          <button
            type="button"
            onClick={onBackToEmail}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            back to email login
          </button>
        </div>
      )}
    </div>
  );
};
