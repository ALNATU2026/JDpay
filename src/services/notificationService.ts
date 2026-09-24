import { Notification } from '../types';
import { storage } from './storage';

export const notificationService = {
  getForUser: (userId: string): Notification[] => {
    const all = storage.getNotifications();
    return all.filter((n) => n.userId === userId || n.userId === 'all');
  },

  getUnreadCount: (userId: string): number => {
    const userNotifs = notificationService.getForUser(userId);
    return userNotifs.filter((n) => !n.read).length;
  },

  markAsRead: (notificationId: string): void => {
    const notifs = storage.getNotifications();
    const updated = notifs.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    storage.saveNotifications(updated);
  },

  markAllAsRead: (userId: string): void => {
    const notifs = storage.getNotifications();
    const updated = notifs.map((n) =>
      n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n
    );
    storage.saveNotifications(updated);
  },

  sendNotification: (
    userId: string,
    title: string,
    message: string,
    type: 'payment' | 'wallet' | 'system' | 'alert' = 'system'
  ): Notification => {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const notifs = storage.getNotifications();
    notifs.unshift(notif);
    storage.saveNotifications(notifs);
    return notif;
  },
};
