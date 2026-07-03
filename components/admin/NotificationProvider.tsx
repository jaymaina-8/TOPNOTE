"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  deleteAllReadNotificationsAction,
} from "@/lib/actions/admin/notifications";

/* ─────────────────────────────────────────────
   Types (exported so consuming components share them)
───────────────────────────────────────────── */

export type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  read_at?: string | null;
  updated_at?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
};

export interface Preferences {
  desktopAlerts: boolean;
  soundAlerts: boolean;
  browserNotifications: boolean;
}

export interface ToastPayload {
  id: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

interface NotificationContextValue {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  isShaking: boolean;
  latestInsertedId: string | null;
  toastQueue: ToastPayload[];
  preferences: Preferences;
  handlePreferencesChange: (prefs: Preferences) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (ids: string[]) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: (ids: string[]) => Promise<void>;
  dismissToast: () => void;
}

/* ─────────────────────────────────────────────
   Context
───────────────────────────────────────────── */

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside <NotificationProvider>");
  }
  return ctx;
}

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */

const PREFS_KEY = "topnote_notification_preferences";
const ASKED_KEY = "topnote_asked_browser_notifications";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [latestInsertedId, setLatestInsertedId] = useState<string | null>(null);
  const [toastQueue, setToastQueue] = useState<ToastPayload[]>([]);

  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Preferences;
        } catch {}
      }
    }
    return { desktopAlerts: true, soundAlerts: true, browserNotifications: false };
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  /* ── Preferences ── */
  const handlePreferencesChange = useCallback((prefs: Preferences) => {
    setPreferences(prefs);
    if (typeof window !== "undefined") {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }
  }, []);

  /* ── Request browser notification permission once ── */
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "default"
    ) return;
    const asked = localStorage.getItem(ASKED_KEY);
    if (asked) return;
    Notification.requestPermission().then((permission) => {
      localStorage.setItem(ASKED_KEY, "true");
      if (permission === "granted") {
        handlePreferencesChange({ ...preferences, browserNotifications: true });
      }
    });
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Chime ── */
  const playChime = useCallback(() => {
    if (!preferences.soundAlerts) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playNote = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };
      playNote(659.25, 0, 0.25);
      playNote(880.0, 0.08, 0.4);
    } catch {}
  }, [preferences.soundAlerts]);

  /* ── Native browser notification ── */
  const showNativeNotification = useCallback(
    (title: string, body: string, orderId?: string) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted" ||
        !preferences.browserNotifications
      ) return;
      try {
        const n = new Notification(title, { body, icon: "/icon.png" });
        n.onclick = () => {
          window.focus();
          if (orderId) router.push("/dashboard/orders");
        };
      } catch {}
    },
    [preferences.browserNotifications, router]
  );

  /* ── Incoming realtime notification handler ── */
  const isOnNotificationsPage = pathname === "/dashboard/notifications";

  const handleIncomingNotification = useCallback(
    (newNotif: Notification) => {
      // 1. Deduplicate + prepend
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });

      // 2. Bell shake
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 650);

      // 3. Audio
      playChime();

      // 4. Toast + native notification (only for exam orders)
      if (newNotif.type === "exam_order") {
        const meta = (newNotif.metadata ?? {}) as Record<string, unknown>;

        // Queue toast only when NOT on the notifications page
        if (!isOnNotificationsPage && preferences.desktopAlerts) {
          setToastQueue((prev) => [
            ...prev,
            {
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              metadata: newNotif.metadata as Record<string, unknown> | null,
            },
          ]);
        }

        // Highlight in the timeline list (visible on notifications page)
        setLatestInsertedId(newNotif.id);
        setTimeout(() => {
          setLatestInsertedId((cur) => (cur === newNotif.id ? null : cur));
        }, 2500);

        showNativeNotification(
          newNotif.title,
          newNotif.message,
          meta.order_id as string | undefined
        );
      }
    },
    [isOnNotificationsPage, preferences.desktopAlerts, playChime, showNativeNotification]
  );

  /* ── Fetch + realtime subscription ── */
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) setNotifications(data);
      setIsLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel("db-notifications-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            handleIncomingNotification(payload.new as Notification);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id as string;
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleIncomingNotification]);

  /* ── Action handlers ── */
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const res = await markNotificationAsReadAction(id);
    if (!res.success) router.refresh();
  }, [router]);

  const markAllAsRead = useCallback(async (ids: string[]) => {
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
    );
    const res = await markAllNotificationsAsReadAction(ids);
    if (!res.success) router.refresh();
  }, [router]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const res = await deleteNotificationAction(id);
    if (!res.success) router.refresh();
  }, [router]);

  const deleteAllRead = useCallback(async (ids: string[]) => {
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    const res = await deleteAllReadNotificationsAction(ids);
    if (!res.success) router.refresh();
  }, [router]);

  /* ── Dismiss first toast in queue ── */
  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isLoading,
        unreadCount,
        isShaking,
        latestInsertedId,
        toastQueue,
        preferences,
        handlePreferencesChange,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllRead,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
