import React, { useState } from 'react';
import {
  Tv,
  ArrowRight,
  ShieldCheck,
  Zap,
  Receipt,
  Clock,
  CheckCircle2,
  Headphones,
  FileText,
  CreditCard,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  LogIn,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { CablePackage, User } from '../../types';
import { cableService } from '../../services/cableService';

// Generated image asset
import heroImage from '../../assets/images/hero_cable_lifestyle_1790193564568.jpg';
import tvScreenImage from '../../assets/images/cable_tv_screen_1790193589235.jpg';
import heroBgImage from '../../assets/images/hero_bg_cable_lounge_1790194777894.jpg';
import jdpayLogoEmblem from '../../assets/images/jdpay_logo_emblem_1790194797870.jpg';
import heroContentBg from '../../assets/images/hero_content_bg_1790418938323.jpg';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  currentUser: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'DStv' | 'GOtv' | 'StarTimes'>('DStv');
  const [quickSmartcard, setQuickSmartcard] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const packages: CablePackage[] = cableService.getPackages(activeTab).slice(0, 4);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceRoute = activeTab.toLowerCase();
    if (currentUser) {
      onNavigate(`/dashboard/cable/${serviceRoute}`);
    } else {
      onNavigate(`/login?redirect=/dashboard/cable/${serviceRoute}`);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    }, 5000);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      {/* ===================== TOP NAVIGATION BAR WITH SHORTCUTS ===================== */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left: Brand Logo & Emblem */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={jdpayLogoEmblem}
                alt="JDpay Official Brand Logo"
                className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow-sm group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-sans">
                  JD<span className="text-blue-400">pay</span>
                </span>
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Official
                </span>
              </div>
            </div>

            {/* Center: Menu Items List (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                Cable Services
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                Bouquet Pricing
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                Why JDpay
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                Contact Desk
              </button>
            </nav>

            {/* Right: Direct Shortcuts for Login & Sign Up */}
            <div className="hidden sm:flex items-center gap-2.5">
              {!currentUser ? (
                <>
                  {/* Shortcut: Login Button */}
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all shadow-2xs hover:border-slate-500 cursor-pointer"
                    title="Direct shortcut to Login"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Log In</span>
                  </button>

                  {/* Shortcut: Sign Up Button */}
                  <button
                    type="button"
                    onClick={() => onNavigate('/signup')}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    title="Direct shortcut to Sign Up"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up Free</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      currentUser.role === 'admin' || currentUser.role === 'super_admin'
                        ? onNavigate('/admin')
                        : onNavigate('/dashboard')
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>
                      {currentUser.role === 'admin' || currentUser.role === 'super_admin'
                        ? 'Admin Portal'
                        : 'My Dashboard'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            {/* Prominent Shortcut Menu List for Login and Sign Up */}
            <div className="p-3 rounded-2xl bg-linear-to-r from-blue-950/60 to-purple-950/60 border border-blue-900/50 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300 px-1">
                Account Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('/login');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('/signup');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              {currentUser && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate(
                        currentUser.role === 'admin' || currentUser.role === 'super_admin'
                          ? '/admin'
                          : '/dashboard'
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Go to Dashboard ({currentUser.fullName})</span>
                  </button>
                </div>
              )}
            </div>

            {/* General Landing Menu Items */}
            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                📺 Cable TV Services
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                ⚡ How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                💰 Bouquet Pricing & Plans
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                🛡️ Why JDpay
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                📞 Contact Support
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
        {/* Cinematic Background Picture with Ambient Gradient Overlays */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroBgImage}
            alt="JDpay Entertainment Background"
            className="w-full h-full object-cover object-center filter brightness-[0.32] contrast-[1.15] scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Multi-stage fintech dark blue atmospheric gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-blue-950/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Col with Dedicated Background Image */}
            <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-6 sm:p-8 md:p-10">
              {/* Dedicated Background Image with Cinematic Gradient Overlays */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={heroContentBg}
                  alt="JDpay Cable TV Entertainment Background"
                  className="w-full h-full object-cover object-center filter brightness-[0.34] contrast-[1.15] scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Multi-layered atmospheric glass gradients ensuring 100% text clarity & WCAG AA contrast */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/88 to-blue-950/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/90" />
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-10 -left-10 w-56 h-56 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Elevated Content */}
              <div className="relative z-10 space-y-6">
                {/* JDPay Brand Logo Header */}
                <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                  <img
                    src={jdpayLogoEmblem}
                    alt="JDpay Official Brand Logo"
                    className="w-9 h-9 rounded-xl object-contain bg-white p-1 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black tracking-tight text-white font-sans">
                        JD<span className="text-blue-400">pay</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        Official
                      </span>
                    </div>
                    <span className="hidden sm:inline text-white/30">•</span>
                    <span className="text-[11px] text-blue-200 font-medium">
                      "Pay Your Cable TV. Simple. Fast. Secure."
                    </span>
                  </div>
                </div>

                {/* Trust Tag */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Zero Transaction Fees on All Cable Subscriptions</span>
                  </div>
                </div>

                {/* Primary Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                  Pay Your Cable TV Subscription in Seconds
                </h1>

                {/* Supporting Copy */}
                <p className="text-base sm:text-lg text-slate-200 max-w-2xl font-normal leading-relaxed">
                  Renew your DStv, GOtv or StarTimes subscription quickly and securely from one convenient platform.
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <button
                    onClick={() => onNavigate(currentUser ? '/dashboard/cable' : '/signup')}
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Tv className="w-4 h-4" />
                    Pay Cable TV
                  </button>

                  {!currentUser && (
                    <button
                      onClick={() => onNavigate('/signup')}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 backdrop-blur-md transition-colors shadow-xs whitespace-nowrap cursor-pointer"
                    >
                      Create Free Account
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!currentUser && (
                  <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                    <span className="text-slate-400">Quick shortcuts:</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Log In
                    </button>
                    <span className="text-white/30">•</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('/signup')}
                      className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Sign Up
                    </button>
                  </div>
                )}

                {/* Trust Indicators */}
                <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-4 text-left">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-white tabular-nums">Instant</div>
                    <div className="text-xs text-slate-300 mt-0.5">Switch Activation</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">₦0.00</div>
                    <div className="text-xs text-slate-300 mt-0.5">Convenience Fee</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-blue-400 tabular-nums">24/7</div>
                    <div className="text-xs text-slate-300 mt-0.5">Automated Gateway</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Col */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white">
                <img
                  src={heroImage}
                  alt="Modern entertainment living room with JDpay cable payment"
                  className="w-full h-72 sm:h-80 object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Floating Interactive Card Overlay */}
                <div className="p-5 bg-white border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-700">Quick Cable Top-up</span>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">Automated Switch</span>
                  </div>

                  {/* Service Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                    {(['DStv', 'GOtv', 'StarTimes'] as const).map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => setActiveTab(service)}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                          activeTab === service
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleQuickPay} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {activeTab === 'GOtv' ? 'IUC Number' : 'Smartcard Number'}
                      </label>
                      <input
                        type="text"
                        value={quickSmartcard}
                        onChange={(e) => setQuickSmartcard(e.target.value)}
                        placeholder={`Enter ${activeTab} number`}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Proceed to {activeTab} Packages</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CABLE TV SERVICES SECTION ===================== */}
      <section id="services" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Supported Providers</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Cable TV Services
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Choose your cable provider below for instant subscription renewal or package upgrades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* DStv Card */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-300 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    DStv
                  </div>
                  <span className="text-xs font-semibold text-slate-500">MultiChoice DStv</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">DStv</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Renew your DStv subscription quickly and securely.
                  </p>
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Popular: Compact Bouquet</span>
                    <span className="font-bold text-slate-900 tabular-nums">₦19,000/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Channels</span>
                    <span className="font-semibold text-slate-900">130+ HD Channels</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verification</span>
                    <span className="text-emerald-600 font-medium">Instant Smartcard Check</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onNavigate('/dashboard/cable/dstv')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Pay DStv</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* GOtv Card */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-300 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    GOtv
                  </div>
                  <span className="text-xs font-semibold text-slate-500">MultiChoice GOtv</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">GOtv</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Keep your GOtv subscription active with a simple payment process.
                  </p>
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Popular: GOtv Supa+</span>
                    <span className="font-bold text-slate-900 tabular-nums">₦16,800/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Channels</span>
                    <span className="font-semibold text-slate-900">75+ Digital Channels</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verification</span>
                    <span className="text-emerald-600 font-medium">Instant IUC Check</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onNavigate('/dashboard/cable/gotv')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Pay GOtv</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* StarTimes Card */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-300 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm text-center shadow-xs">
                    Star<br />Times
                  </div>
                  <span className="text-xs font-semibold text-slate-500">StarTimes Media</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">StarTimes</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Renew your StarTimes package conveniently from your JDpay wallet.
                  </p>
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Popular: Super (Dish)</span>
                    <span className="font-bold text-slate-900 tabular-nums">₦9,800/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Channels</span>
                    <span className="font-semibold text-slate-900">95+ Channels</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verification</span>
                    <span className="text-emerald-600 font-medium">Instant Smartcard Check</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onNavigate('/dashboard/cable/startimes')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Pay StarTimes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple Process</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              How It Works
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Follow four easy steps to complete your cable subscription payment in under one minute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative space-y-3">
              <div className="text-4xl font-black text-blue-600/20 tabular-nums">01</div>
              <h4 className="text-lg font-bold text-slate-900">Create an Account</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Register your JDpay account in a few simple steps.
              </p>
            </div>

            {/* Step 02 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative space-y-3">
              <div className="text-4xl font-black text-blue-600/20 tabular-nums">02</div>
              <h4 className="text-lg font-bold text-slate-900">Fund Your Wallet</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Add money to your JDpay wallet using an available payment method.
              </p>
            </div>

            {/* Step 03 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative space-y-3">
              <div className="text-4xl font-black text-blue-600/20 tabular-nums">03</div>
              <h4 className="text-lg font-bold text-slate-900">Choose Your Cable TV</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Select DStv, GOtv or StarTimes and enter your Smartcard/IUC number.
              </p>
            </div>

            {/* Step 04 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative space-y-3">
              <div className="text-4xl font-black text-blue-600/20 tabular-nums">04</div>
              <h4 className="text-lg font-bold text-slate-900">Pay & Get Confirmation</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Select your package, confirm the payment and receive your transaction receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== WHY JDPAY ===================== */}
      <section id="about" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Core Advantages</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Why JDpay
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Built specifically for Nigerians seeking dependable, uninterrupted family entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fast Payments */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Fast Payments</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Pay your cable TV subscription quickly.
              </p>
            </div>

            {/* Secure */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Secure</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Protect customer information and transactions.
              </p>
            </div>

            {/* Simple */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Simple</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                A straightforward payment experience without unnecessary steps.
              </p>
            </div>

            {/* Transaction History */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Transaction History</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Keep track of all your cable TV payments.
              </p>
            </div>

            {/* Digital Receipts */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Digital Receipts</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Access your payment receipts whenever you need them.
              </p>
            </div>

            {/* Customer Support */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Customer Support</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Get assistance when you need help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SUPPORTED SERVICES (SHOWCASE) ===================== */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
            Broadcaster Switch Integration
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            One platform. Three cable TV services.
          </h3>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Whether you watch live Premier League football on DStv, family telenovelas on GOtv, or local news on StarTimes, JDpay processes your subscription instantly.
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xl font-bold text-slate-300">
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>DStv</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>GOtv</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>StarTimes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CONTACT SECTION ===================== */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Get In Touch</h2>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                  Customer Support
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Have questions about decoder error codes (E16/E30), delayed activations, or wallet top-ups? Reach our team anytime.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">WhatsApp Support</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Chat directly with a Nigerian support agent.</p>
                    <a
                      href="https://wa.me/2348005372900"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-600 hover:underline mt-1 inline-block"
                    >
                      +234 800 537 2900 (Chat Now) →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Email Support</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Typical response time: under 15 minutes.</p>
                    <a
                      href="mailto:support@jdpay.ng"
                      className="text-xs font-semibold text-blue-600 hover:underline mt-1 inline-block"
                    >
                      support@jdpay.ng
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Direct Phone Desk</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Available 7:00 AM – 11:00 PM West Africa Time.</p>
                    <span className="text-xs font-mono font-semibold text-slate-900 mt-1 inline-block">
                      +234 1 888 4020
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h4 className="text-xl font-bold text-slate-900 mb-2">Send Us a Message</h4>
              <p className="text-xs text-slate-500 mb-6">
                Fill out the form below and our technical desk will address your inquiry promptly.
              </p>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h5 className="text-sm font-bold text-emerald-900">Message Received</h5>
                  <p className="text-xs text-emerald-700">
                    Thank you, {contactForm.name || 'valued customer'}. Our support desk has logged your ticket and will respond via email shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="e.g. Babatunde Williams"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="babatunde@example.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="080 1234 5678"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message / Smartcard Inquiry *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your inquiry or include your Smartcard/IUC number..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
