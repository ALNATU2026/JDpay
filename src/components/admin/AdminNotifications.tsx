import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, Users, AlertTriangle } from 'lucide-react';
import { User } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminNotificationsProps {
  adminUser: User;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ adminUser }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState<'all' | 'pending' | 'failed'>('all');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const pastBroadcasts = [
    {
      id: 'bc_1',
      title: 'MultiChoice Switch Maintenance Notice',
      message: 'MultiChoice will perform scheduled routine switch maintenance between 2:00 AM and 3:00 AM WAT.',
      target: 'All Customers',
      date: '2026-09-21 21:00',
      sentBy: 'JDpay Operations',
    },
    {
      id: 'bc_2',
      title: 'StarTimes Super Bouquet Signal Booster Alert',
      message: 'All renewed StarTimes decoders will receive direct OTA signal refresh within 30 seconds.',
      target: 'Active Subscribers',
      date: '2026-09-18 10:30',
      sentBy: 'Admin Ops',
    },
  ];

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      await adminService.broadcastNotification(
        adminUser.id,
        adminUser.fullName,
        title.trim(),
        message.trim(),
        targetGroup
      );

      setSentSuccess(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSentSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Customer Broadcasts & Alerts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Transmit push announcements, provider maintenance advisories, and system notices directly to customer dashboards.
        </p>
      </div>

      {/* Broadcast Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-600" />
          Compose System Broadcast
        </h3>

        {sentSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Broadcast dispatched to all targeted customer dashboards!</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DStv Price Adjustment or Scheduled Maintenance"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Audience *</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 bg-white"
              >
                <option value="all">All Registered Customers</option>
                <option value="pending">Customers with Pending Transactions Only</option>
                <option value="failed">Customers with Failed Transactions</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message Body *</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter comprehensive announcement details..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Transmitting...' : 'Transmit Broadcast'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          Recent Broadcast Archive
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {pastBroadcasts.map((bc) => (
            <div key={bc.id} className="py-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">{bc.title}</h4>
                <span className="text-[11px] text-slate-400 tabular-nums">{bc.date}</span>
              </div>
              <p className="text-slate-600">{bc.message}</p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                <span>Audience: {bc.target}</span>
                <span>•</span>
                <span>Author: {bc.sentBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
