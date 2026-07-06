"use client";

import { useNotifications } from "@/components/admin/NotificationProvider";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SettingsPageClientProps {
  userEmail?: string;
}

export function SettingsPageClient({ userEmail }: SettingsPageClientProps) {
  const { preferences, handlePreferencesChange } = useNotifications();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === "granted") {
      handlePreferencesChange({
        ...preferences,
        browserNotifications: true,
      });
    } else {
      handlePreferencesChange({
        ...preferences,
        browserNotifications: false,
      });
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    if (key === "browserNotifications" && permissionStatus !== "granted") {
      requestBrowserPermission();
      return;
    }
    handlePreferencesChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#ECECEC] pb-4">
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">Settings</h1>
        <p className="text-sm text-[#555555] mt-1">Configure your local dashboard preferences and view account details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Notification Settings */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#111111] mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notification Preferences
          </h2>
          <div className="space-y-6">
            {/* Sound alerts */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label htmlFor="sound-alerts" className="text-sm font-bold text-[#111111]">
                  Sound Alerts
                </label>
                <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">
                  Play a chime sound when a new order or notification arrives.
                </p>
              </div>
              <button
                id="sound-alerts"
                role="switch"
                aria-checked={preferences.soundAlerts}
                onClick={() => handleToggle("soundAlerts")}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E31B23]/25",
                  preferences.soundAlerts ? "bg-[#E31B23]" : "bg-neutral-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    preferences.soundAlerts ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Desktop Toast alerts */}
            <div className="flex items-center justify-between gap-4 border-t border-[#ECECEC] pt-4">
              <div className="flex-1">
                <label htmlFor="desktop-alerts" className="text-sm font-bold text-[#111111]">
                  Desktop Toast Alerts
                </label>
                <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">
                  Display rich viewport toast alerts for incoming orders.
                </p>
              </div>
              <button
                id="desktop-alerts"
                role="switch"
                aria-checked={preferences.desktopAlerts}
                onClick={() => handleToggle("desktopAlerts")}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E31B23]/25",
                  preferences.desktopAlerts ? "bg-[#E31B23]" : "bg-neutral-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    preferences.desktopAlerts ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Browser native notifications */}
            <div className="flex items-center justify-between gap-4 border-t border-[#ECECEC] pt-4">
              <div className="flex-1">
                <label htmlFor="browser-notifications" className="text-sm font-bold text-[#111111]">
                  Native Browser Notifications
                </label>
                <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">
                  Show native OS notifications even when the dashboard tab is in the background.
                </p>
                {permissionStatus === "denied" && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    Blocked by browser settings
                  </span>
                )}
                {permissionStatus === "granted" && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Permission granted
                  </span>
                )}
              </div>
              <button
                id="browser-notifications"
                role="switch"
                aria-checked={preferences.browserNotifications}
                disabled={permissionStatus === "denied"}
                onClick={() => handleToggle("browserNotifications")}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#E31B23]/25",
                  preferences.browserNotifications && permissionStatus === "granted" ? "bg-[#E31B23]" : "bg-neutral-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    preferences.browserNotifications && permissionStatus === "granted" ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Administrator Profile Details */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#111111] mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            System Profile
          </h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-[#ECECEC] pb-3">
              <span className="font-bold text-[#111111]">Email Address</span>
              <span className="text-[#555555]">{userEmail ?? "—"}</span>
            </div>
            <div className="flex justify-between border-b border-[#ECECEC] pb-3">
              <span className="font-bold text-[#111111]">Access Role</span>
              <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-[#E31B23]">
                Administrator
              </span>
            </div>
            <div className="flex justify-between border-b border-[#ECECEC] pb-3">
              <span className="font-bold text-[#111111]">Database Conn</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[#111111]">Platform version</span>
              <span className="text-[#888888] font-bold">v1.2.0 (Next.js 16)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
