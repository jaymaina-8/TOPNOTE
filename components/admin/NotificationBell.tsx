"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    message: string;
    orderId?: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize browser-only clients and audio context
  useEffect(() => {
    // We can use the browser's SpeechSynthesis or a synthetic beep using AudioContext to WOW the user!
    // Let's create an elegant synth chime sound using the browser's AudioContext.
    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        // Chime: note 1 (E5), then note 2 (A5)
        const playNote = (freq: number, delay: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          
          gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + duration);
        };
        
        playNote(659.25, 0, 0.3); // E5
        playNote(880.00, 0.1, 0.5); // A5
      } catch (e) {
        console.warn("Chime failed to play due to audio policy constraints:", e);
      }
    };

    const supabase = createClient();
    if (!supabase) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications:", error.message);
        return;
      }

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to Realtime notifications channel
    const channel = supabase
      .channel("db-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            if (!newNotif.is_read) {
              setUnreadCount((c) => c + 1);
            }

            // Play chime sound and trigger slide-in toast
            playChime();
            
            const meta = newNotif.metadata as Record<string, any>;
            setToast({
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              orderId: meta?.order_id,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedNotif = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
            );
            // Re-evaluate count
            setNotifications((prev) => {
              const updatedList = prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n));
              setUnreadCount(updatedList.filter((n) => !n.is_read).length);
              return updatedList;
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setNotifications((prev) => {
              const updatedList = prev.filter((n) => n.id !== deletedId);
              setUnreadCount(updatedList.filter((n) => !n.is_read).length);
              return updatedList;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Could not mark notification as read:", error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    const supabase = createClient();
    if (!supabase) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Could not mark all notifications as read:", error.message);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createClient();
    if (!supabase) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Could not delete notification:", error.message);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setIsOpen(false);
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    // Redirect to orders page
    router.push("/dashboard/orders");
    router.refresh();
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-lg p-2 text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "bg-neutral-100 text-neutral-950"
        )}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5.5 w-5.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50 rounded-t-xl">
            <h3 className="text-sm font-bold text-neutral-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline bg-transparent border-none cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "group relative flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-neutral-50 transition-colors",
                    !n.is_read && "bg-sky-50/30 hover:bg-sky-50/50"
                  )}
                >
                  {/* Unread indicator */}
                  {!n.is_read && (
                    <span className="absolute top-5 left-1.5 h-2 w-2 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div className="mt-0.5 rounded-lg bg-sky-50 p-1.5 text-sky-600 ring-1 ring-sky-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4.5 w-4.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
                      />
                    </svg>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-bold text-neutral-900 line-clamp-1">{n.title}</p>
                    <p className="mt-1 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="mt-1.5 block text-[10px] font-semibold text-neutral-400">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="absolute right-3 top-4 flex flex-col gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                        title="Mark as read"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-red-600"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2 2 0 0 1-2.244 2.077H8.084a2 2 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-100 px-4 py-2.5 text-center bg-neutral-50 rounded-b-xl">
            <Link
              href="/dashboard/orders"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900"
            >
              View all orders
            </Link>
          </div>
        </div>
      )}

      {/* Slide-in Viewport Toast */}
      {toast && (
        <div
          onClick={() => {
            setToast(null);
            router.push("/dashboard/orders");
            router.refresh();
          }}
          className={cn(
            "fixed bottom-5 right-5 z-[9999] flex w-80 max-w-sm cursor-pointer items-start gap-3 rounded-xl border border-neutral-200/80 bg-white p-4.5 shadow-2xl transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98]",
            "animate-in fade-in slide-in-from-bottom-8 duration-300"
          )}
        >
          {/* Unread indicator / Pulse dot */}
          <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>

          <div className="rounded-lg bg-red-50 p-2 text-red-600 ring-1 ring-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-xs font-black tracking-tight text-neutral-900 uppercase">
              {toast.title}
            </h4>
            <p className="mt-1 text-xs text-neutral-600 leading-normal font-medium">
              {toast.message}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
              View Order
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-3 w-3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setToast(null);
            }}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Dismiss toast"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
