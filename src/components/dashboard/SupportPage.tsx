import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User } from '../../types';

interface SupportPageProps {
  currentUser: User;
}

export const SupportPage: React.FC<SupportPageProps> = ({ currentUser }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How fast does my cable TV subscription activate after payment?',
      a: 'JDpay connects directly to MultiChoice and StarTimes billing switches. Most decoder renewals reactivate within 15 to 90 seconds. If your decoder remains blocked, ensure your decoder is plugged in, powered ON, and left on channel 100 for 5 minutes.',
    },
    {
      q: 'How do I clear DStv/GOtv Error Codes (E16 or E30)?',
      a: 'Error 16 indicates your subscription was expired when the decoder booted. Once renewed on JDpay, leave the decoder powered ON. You can also send "RESET [Smartcard/IUC]" via our WhatsApp support desk to trigger a signal booster switch.',
    },
    {
      q: 'Are there any extra convenience or service fees on JDpay?',
      a: 'No. JDpay offers ₦0.00 service fees on all DStv, GOtv, and StarTimes subscription renewals. The price you see is the exact official bouquet price.',
    },
    {
      q: 'What happens if my wallet debit occurs but the broadcaster switch times out?',
      a: 'Our automated reconciliation engine checks pending switch transactions every 2 minutes. If the broadcaster rejects the renewal or times out, our system automatically refunds 100% of your funds back to your JDpay wallet.',
    },
    {
      q: 'Can I print an official receipt for corporate expense reimbursement?',
      a: 'Yes! Every successful transaction generates a printable digital receipt with cryptographic timestamps and provider references. You can access them anytime in the "Receipts" section.',
    },
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketSubject('');
      setTicketMessage('');
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Customer Support & Help Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Get fast answers to decoder questions, report switch delays, or message our dedicated Nigerian support desk.
        </p>
      </div>

      {/* Support Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="https://wa.me/2348005372900"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">WhatsApp Support</h4>
          <p className="text-xs text-slate-500 mt-1">Instant chat with a live representative</p>
          <span className="text-xs font-semibold text-emerald-600 inline-block mt-3">
            +234 800 537 2900 →
          </span>
        </a>

        <a
          href="mailto:support@jdpay.ng"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Email Support</h4>
          <p className="text-xs text-slate-500 mt-1">Typical response in under 15 minutes</p>
          <span className="text-xs font-semibold text-blue-600 inline-block mt-3">
            support@jdpay.ng →
          </span>
        </a>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Phone className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Direct Phone Desk</h4>
          <p className="text-xs text-slate-500 mt-1">7:00 AM – 11:00 PM West Africa Time</p>
          <span className="text-xs font-mono font-bold text-slate-900 inline-block mt-3">
            +234 1 888 4020
          </span>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          Frequently Asked Questions
        </h3>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.q} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 hover:text-blue-600 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-900">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Support Ticket */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Submit an Inquiry Ticket
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log an issue with your transaction reference or Smartcard number.
          </p>
        </div>

        {ticketSubmitted ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h5 className="text-xs font-bold text-emerald-900">Ticket Dispatched</h5>
            <p className="text-xs text-emerald-700">
              Ticket #JD-{Math.floor(100000 + Math.random() * 900000)} has been logged. An engineer will follow up at {currentUser.email}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject / Issue Type *
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Signal reactivation delay on GOtv IUC 2019483726"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message Details *
              </label>
              <textarea
                rows={4}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Provide transaction reference or decoder details..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Ticket</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
