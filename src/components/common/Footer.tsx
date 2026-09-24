import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                JD
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                JD<span className="text-blue-400">pay</span>
              </span>
            </div>
            <p className="text-base font-medium text-slate-200">
              Pay Your Cable TV. Simple. Fast. Secure.
            </p>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Nigeria&apos;s fastest automated cable TV subscription switch. Renew your DStv, GOtv, and StarTimes decoders in seconds with zero service fees.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>99.98% Instant Switch Activation Reliability</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cable Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/cable/dstv')}
                  className="hover:text-white transition-colors text-left"
                >
                  Pay DStv
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/cable/gotv')}
                  className="hover:text-white transition-colors text-left"
                >
                  Pay GOtv
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/cable/startimes')}
                  className="hover:text-white transition-colors text-left"
                >
                  Pay StarTimes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/fund-wallet')}
                  className="hover:text-white transition-colors text-left"
                >
                  Fund Wallet
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/#about')}
                  className="hover:text-white transition-colors text-left"
                >
                  About JDpay
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/#how-it-works')}
                  className="hover:text-white transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/#contact')}
                  className="hover:text-white transition-colors text-left"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/support')}
                  className="hover:text-white transition-colors text-left"
                >
                  Help & FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Support Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support Desk</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+234 800 537 2900</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>support@jdpay.ng</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Victoria Island, Lagos, Nigeria</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                256-Bit SSL Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 JDpay. All rights reserved.</p>
          <p className="text-center md:text-right max-w-2xl text-slate-500 leading-normal">
            Disclaimer: JDpay is an independent Nigerian digital utility payment platform. DStv and GOtv are registered trademarks of MultiChoice Africa. StarTimes is a registered trademark of StarTimes Media. JDpay uses these names solely for service identification.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/#contact')} className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('/#contact')} className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
