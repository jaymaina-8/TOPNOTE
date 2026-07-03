"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Preferences } from "@/components/admin/NotificationProvider";

// Re-export so existing imports from this file continue to work
export type { Preferences };

interface NotificationPreferencesProps {
  preferences: Preferences;
  onChangePreferences: (prefs: Preferences) => void;
  onClose: () => void;
}

export function NotificationPreferences({
  preferences,
  onChangePreferences,
  onClose,
}: NotificationPreferencesProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === "granted") {
      onChangePreferences({
        ...preferences,
        browserNotifications: true,
      });
    } else {
      onChangePreferences({
        ...preferences,
        browserNotifications: false,
      });
    }
  };

  const handleToggle = (key: keyof Preferences) => {
    if (key === "browserNotifications" && permissionStatus !== "granted") {
      requestBrowserPermission();
      return;
    }
    onChangePreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer focus:outline-none"
            aria-label="Back to notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4.5 w-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h3 className="text-sm font-black tracking-tight text-neutral-900">Notification Preferences</h3>
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Sound alerts */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="sound-alerts" className="text-xs font-bold text-neutral-900">
              Sound Alerts
            </label>
            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-0.5">
              Play a chime sound when a new notification arrives.
            </p>
          </div>
          <button
            id="sound-alerts"
            role="switch"
            aria-checked={preferences.soundAlerts}
            onClick={() => handleToggle("soundAlerts")}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1",
              preferences.soundAlerts ? "bg-neutral-950" : "bg-neutral-200"
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
        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-4">
          <div className="flex-1">
            <label htmlFor="desktop-alerts" className="text-xs font-bold text-neutral-900">
              Desktop Toast Alerts
            </label>
            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-0.5">
              Display rich viewport toast alerts for incoming orders.
            </p>
          </div>
          <button
            id="desktop-alerts"
            role="switch"
            aria-checked={preferences.desktopAlerts}
            onClick={() => handleToggle("desktopAlerts")}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1",
              preferences.desktopAlerts ? "bg-neutral-950" : "bg-neutral-200"
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
        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-4">
          <div className="flex-1">
            <label htmlFor="browser-notifications" className="text-xs font-bold text-neutral-900">
              Native Browser Notifications
            </label>
            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed mt-0.5">
              Show native OS notifications even when the dashboard tab is in the background.
            </p>
            {permissionStatus === "denied" && (
              <span className="inline-block mt-1 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                Blocked by browser settings
              </span>
            )}
            {permissionStatus === "granted" && (
              <span className="inline-block mt-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
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
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1",
              preferences.browserNotifications && permissionStatus === "granted" ? "bg-neutral-950" : "bg-neutral-200"
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
  );
}
