'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { ToastService } from '@/components/elements/notifications/ToastService';
import { connectSocket } from '@/utils/socketClient';

interface NotificationItem {
  _id: string;
  notificationType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsCentre = () => {
  const { data: session } = useSession() || {};
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const api = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session?.token}` };

  const load = useCallback(async () => {
    if (!session?.token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${api}/notification/all`, { headers });
      setItems(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      ToastService.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [api, session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!session?.user?.id || !session?.token) return;
    const socket = connectSocket(session.user.id, session.token);
    const onLive = (notification: NotificationItem) => {
      if (!notification?._id) return;
      setItems(prev =>
        prev.some(item => item._id === notification._id)
          ? prev
          : [notification, ...prev],
      );
      if (!notification.isRead) setUnreadCount(count => count + 1);
    };
    socket.on('new-notification', onLive);
    return () => {
      socket.off('new-notification', onLive);
    };
  }, [session?.user?.id, session?.token]);

  const markAllRead = async () => {
    try {
      await axios.patch(`${api}/notification/read-all`, {}, { headers });
      ToastService.success('All notifications marked as read.');
      load();
    } catch {
      ToastService.error('Could not mark notifications as read.');
    }
  };

  const removeOne = async (id: string) => {
    try {
      await axios.delete(`${api}/notification/${id}`, { headers });
      setItems(prev => prev.filter(n => n._id !== id));
    } catch {
      ToastService.error('Could not remove notification.');
    }
  };

  const timeAgo = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <ul className="space-y-2">
        {[1, 2, 3, 4].map(k => (
          <li key={k} className="h-[76px] animate-pulse rounded-2xl bg-[#F6F3F8]" />
        ))}
      </ul>
    );
  }

  return (
    <div className="notifications-centre space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[14px] text-mono-90">
          {unreadCount > 0 ? (
            <>
              <span className="ap-live-dot text-[#611192]" aria-hidden />
              <strong className="font-semibold text-mono-100">{unreadCount}</strong> unread
            </>
          ) : (
            <>
              <CheckCheck className="h-4 w-4 text-[#137A22]" aria-hidden /> All caught up
            </>
          )}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F4F1F6] px-4 text-[13px] font-medium text-[#611192] transition hover:bg-[#F2E8F8]"
          >
            <CheckCheck className="h-4 w-4" aria-hidden /> Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] bg-[#FAF8FB] px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-[#611192] shadow-[0_8px_20px_rgba(59,5,92,0.1)]">
            <Bell className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-4 text-[15px] font-medium text-mono-100">No notifications yet</p>
          <p className="mt-1 text-[13px] text-mono-70">Order updates, messages and offers will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(n => (
            <li
              key={n._id}
              className={`group flex items-start gap-3 rounded-2xl border p-4 transition max-[767px]:p-3.5 ${
                n.isRead ? 'border-[#ECE8EE] bg-white' : 'border-[#611192]/20 bg-[#FCF2FF]'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  n.isRead ? 'bg-[#F4F1F6] text-mono-70' : 'bg-[#611192] text-white'
                }`}
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[#611192]">
                    {n.notificationType?.replace(/_/g, ' ') || 'Update'}
                  </p>
                  <span className="shrink-0 text-[11px] text-mono-70">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-[14px] leading-6 text-mono-100">{n.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeOne(n._id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mono-70 opacity-60 transition hover:bg-white hover:text-[#B0002A] hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsCentre;
