import React, { useState } from 'react';
import { Bell, CheckCheck, Wallet, Tv, Info, AlertTriangle, Clock } from 'lucide-react';
import { User } from '../../types';
import { notificationService } from '../../services/notificationService';

interface NotificationsPageProps {
  currentUser: User;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState(notificationService.getForUser(currentUser.id));

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getForUser(currentUser.id));
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(currentUser.id);
    setNotifications(notificationService.getForUser(currentUser.id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Tv className="w-4 h-4 text-blue-600" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay informed about your wallet top-ups, subscription status updates, and system notices.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Notifications</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don&apos;t have any pending alerts. All your transactions are running normally.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                notif.read
                  ? 'bg-white border-slate-200 opacity-80'
                  : 'bg-blue-50/40 border-blue-200 shadow-2xs'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[10px] font-semibold text-blue-600 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
