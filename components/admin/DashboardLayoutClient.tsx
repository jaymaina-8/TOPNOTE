"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOGO_SRC } from "@/lib/site";
import { signOutAction } from "@/lib/auth/sign-out";
import { useNotifications } from "./NotificationProvider";
import { NotificationBell } from "./NotificationBell";
import { BellPreview } from "./notifications/BellPreview";
import { globalSearchAction, type SearchResultItem } from "@/lib/actions/admin/search";
import { createAdminNotificationAction } from "@/lib/actions/admin/notifications";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string;
}

const navLinks = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: "/dashboard/categories",
    label: "Categories",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/exams",
    label: "Exam Sessions",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    badgeKey: "unreadNotifications" as const,
  },
  {
    href: "/dashboard/testimonials",
    label: "Testimonials",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/inquiries",
    label: "Inquiries",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function DashboardLayoutClient({ children, userEmail }: DashboardLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard";
  const {
    unreadCount,
    notifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  // Navigation Drawer state (mobile only)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Command palette search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);

  // User Menu & Floating Action states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Notification center modal state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Quick actions dropdown & manual notification states
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isNewNotificationModalOpen, setIsNewNotificationModalOpen] = useState(false);
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);

  // Close notification panel on route changes
  useEffect(() => {
    setNotificationsOpen(false);
  }, [pathname]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const userInitials = userEmail
    ? userEmail.split("@")[0].substring(0, 2).toUpperCase()
    : "AD";

  // Watch keyboard for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle outside clicks to close user menu, floating action, and quick actions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsFabOpen(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setIsQuickActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("topnote_recent_searches");
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {}
      }
    }
  }, [isSearchOpen]);

  // Execute instant search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchSelectedIndex(-1);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await globalSearchAction(searchQuery);
      setSearchResults(results);
      setSearchSelectedIndex(results.length > 0 ? 0 : -1);
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Save search to recents
  const saveSearchTerm = (term: string) => {
    const next = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem("topnote_recent_searches", JSON.stringify(next));
  };

  // Close mobile drawer on route transition
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsFabOpen(false);
  }, [pathname]);

  const handleSearchResultClick = (item: SearchResultItem) => {
    saveSearchTerm(searchQuery);
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(item.href);
  };

  // Handle Command Palette arrow selection
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchSelectedIndex >= 0 && searchSelectedIndex < searchResults.length) {
        handleSearchResultClick(searchResults[searchSelectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  // Check if link is active
  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };


  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFA] font-sans antialiased text-[#555555]">
      {/* ── TOP STICKY NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#ECECEC] bg-white px-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] md:hidden focus:outline-none"
            aria-label="Open sidebar menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo link */}
          <Link href="/dashboard" className="flex items-center gap-2.5 focus:outline-none">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white ring-1 ring-black/5 shadow-sm">
              <Image src={LOGO_SRC} alt="TopNote Logo" width={64} height={64} className="h-6.5 w-6.5 object-contain" priority />
            </span>
            <span className="hidden sm:block">
              <span className="block text-xs font-black tracking-tight text-[#111111] leading-none uppercase">TOPNOTE</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#888888] mt-0.5 leading-none">Admin</span>
            </span>
          </Link>
        </div>

        {/* Global Search Bar Trigger button */}
        <button
          onClick={() => {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 150);
          }}
          className={cn(
            "mx-2 md:mx-4 flex items-center justify-between gap-3 rounded-lg border border-[#ECECEC] bg-[#FAFAFA] p-2 text-left text-xs text-[#888888] shadow-inner transition hover:border-[#DCDCDC] hover:bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-[#E31B23]/30",
            "w-9 h-9 justify-center md:h-auto md:w-auto md:max-w-[240px] md:flex-1 lg:max-w-sm lg:px-3 lg:py-1.5"
          )}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden md:inline lg:inline-block">Search products, orders, counties...</span>
            <span className="hidden md:inline-block lg:hidden">Search...</span>
          </div>
          <kbd className="hidden rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#888888] shadow-sm border border-[#ECECEC] lg:inline-block">Ctrl + K</kbd>
        </button>

        {/* Top bar right buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="hidden rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors sm:block"
          >
            Public Site
          </Link>

          {/* Quick Actions Dropdown */}
          <div className="relative" ref={quickActionsRef}>
            <button
              onClick={() => setIsQuickActionsOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECECEC] bg-white text-[#E31B23] shadow-sm hover:bg-[#FAFAFA] hover:text-[#C1141C] transition focus:outline-none"
              title="Quick Actions"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {isQuickActionsOpen && (
              <div className="absolute right-0 mt-1.5 z-50 w-52 rounded-xl border border-[#ECECEC] bg-white p-2.5 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#888888] px-2 mb-1.5">Quick Actions</p>
                
                <Link
                  href="/dashboard/products/new"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition"
                >
                  <span>📦</span> New Product
                </Link>

                <Link
                  href="/dashboard/categories"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition"
                >
                  <span>📁</span> New Category
                </Link>

                <Link
                  href="/dashboard/exams"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition"
                >
                  <span>⏱</span> New Exam Session
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition"
                >
                  <span>📄</span> New Order
                </Link>

                <Link
                  href="/dashboard/testimonials"
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition"
                >
                  <span>💬</span> New Testimonial
                </Link>

                <button
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    setIsNewNotificationModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition"
                >
                  <span>🔔</span> New Notification
                </button>
              </div>
            )}
          </div>

          <NotificationBell
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
          />

          {/* User Profile Avatar with Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[11px] font-black text-white hover:opacity-90 transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E31B23]/40"
              title={userEmail}
            >
              {userInitials}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-[#ECECEC] bg-white p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Header */}
                <div className="px-2.5 py-2 border-b border-[#F4F4F5] mb-1">
                  <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-[#111111] truncate mt-0.5">{userEmail ?? "administrator"}</p>
                </div>
                {/* Menu items */}
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
                >
                  <svg className="h-4 w-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
                >
                  <svg className="h-4 w-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Preferences</span>
                </Link>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    alert("Keyboard Shortcuts:\n• Ctrl + K: Search Console\n• Esc: Close menus / cancel dialogs");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] transition-colors"
                >
                  <svg className="h-4 w-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 11v2m8-8h-1m-15 0H3m14.243-4.243l-.707.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Keyboard Shortcuts</span>
                </button>
                <div className="h-px bg-[#F4F4F5] my-1" />
                <form action={signOutAction} onSubmit={() => setIsUserMenuOpen(false)}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── LOWER SECTION: SIDEBAR + MAIN AREA ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar: expands on lg, collapses on md to icon list, hidden on mobile */}
        <aside className="relative z-30 hidden h-full shrink-0 border-r border-[#ECECEC] bg-white transition-all duration-200 md:flex md:w-16 lg:w-60 flex-col">
          <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto custom-scrollbar">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              const isNotif = link.badgeKey === "unreadNotifications";
              const count = isNotif ? unreadCount : 0;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-150 focus:outline-none",
                    active
                      ? "bg-[#E31B23]/5 text-[#E31B23]"
                      : "text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111]"
                  )}
                >
                  {/* Left indicator border */}
                  {active && <span className="sidebar-active-indicator" />}

                  <span className={cn("shrink-0", active ? "text-[#E31B23]" : "text-[#888888]")}>{link.icon}</span>
                  <span className="hidden lg:inline whitespace-nowrap">{link.label}</span>

                  {/* Notification count badge */}
                  {count > 0 && (
                    <span className="absolute right-3 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#E31B23] px-1 text-[10px] font-black text-white shadow-sm ring-1 ring-white">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main scrollable viewport with mobile-bottom nav padding */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 md:pb-6">
          <div className="mx-auto max-w-[1400px] pb-12">{children}</div>
        </main>
      </div>

      {/* ── MOBILE SIDEBAR DRAWER OVERLAY ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop click closer */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300"
          />

          {/* Drawer menu panel */}
          <div className="relative flex w-64 max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="flex h-14 items-center justify-between border-b border-[#ECECEC] px-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white ring-1 ring-black/5 shadow-sm">
                  <Image src={LOGO_SRC} alt="TopNote Logo" width={48} height={48} className="h-6 w-6 object-contain" />
                </span>
                <span className="text-xs font-black tracking-tight text-[#111111] uppercase">TopNote Publishers</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888888] hover:bg-[#FAFAFA] hover:text-[#111111] focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-3 overflow-y-auto custom-scrollbar">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                const isNotif = link.badgeKey === "unreadNotifications";
                const count = isNotif ? unreadCount : 0;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all focus:outline-none",
                      active
                        ? "bg-[#E31B23]/5 text-[#E31B23]"
                        : "text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111]"
                    )}
                  >
                    {active && <span className="sidebar-active-indicator" />}
                    <span className={shrinkIconColor(active)}>{link.icon}</span>
                    <span>{link.label}</span>

                    {count > 0 && (
                      <span className="absolute right-3 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#E31B23] px-1 text-[10px] font-black text-white shadow-sm ring-1 ring-white">
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[#ECECEC] p-3">
              <Link
                href="/"
                className="flex w-full items-center justify-center rounded-lg border border-[#ECECEC] bg-[#FAFAFA] py-2 text-xs font-bold text-[#555555] hover:text-[#111111]"
              >
                Go to Public Site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-[#ECECEC] flex items-center justify-around px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold gap-1 transition-all",
            isLinkActive("/dashboard") && pathname === "/dashboard" ? "text-[#E31B23]" : "text-[#888888] hover:text-[#111111]"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span>Overview</span>
        </Link>
        <Link
          href="/dashboard/orders"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold gap-1 transition-all",
            isLinkActive("/dashboard/orders") ? "text-[#E31B23]" : "text-[#888888] hover:text-[#111111]"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Orders</span>
        </Link>
        <Link
          href="/dashboard/analytics"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold gap-1 transition-all",
            isLinkActive("/dashboard/analytics") ? "text-[#E31B23]" : "text-[#888888] hover:text-[#111111]"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Analytics</span>
        </Link>
        <Link
          href="/dashboard/notifications"
          className={cn(
            "relative flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold gap-1 transition-all",
            isLinkActive("/dashboard/notifications") ? "text-[#E31B23]" : "text-[#888888] hover:text-[#111111]"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E31B23] px-1 text-[8px] font-black text-white shadow-sm ring-1 ring-white">
              {unreadCount}
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold gap-1 text-[#888888] hover:text-[#111111] focus:outline-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>More</span>
        </button>
      </div>

      {/* ── MOBILE FLOATING QUICK ACTION BUTTON ── */}
      <div className="md:hidden fixed bottom-20 right-4 z-40" ref={fabRef}>
        {isFabOpen && (
          <div className="flex flex-col items-end gap-2 mb-3 animate-in slide-in-from-bottom-5 duration-200">
            <Link
              href="/dashboard/products/new"
              className="flex items-center gap-2 bg-white text-xs font-bold text-[#111111] px-3.5 py-2 rounded-xl shadow-md border border-[#ECECEC]"
            >
              <span>New Product</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#E31B23]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </Link>
            <Link
              href="/dashboard/exams"
              className="flex items-center gap-2 bg-white text-xs font-bold text-[#111111] px-3.5 py-2 rounded-xl shadow-md border border-[#ECECEC]"
            >
              <span>New Exam Session</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#E31B23]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </Link>
            <Link
              href="/dashboard/categories"
              className="flex items-center gap-2 bg-white text-xs font-bold text-[#111111] px-3.5 py-2 rounded-xl shadow-md border border-[#ECECEC]"
            >
              <span>New Category</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#E31B23]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 bg-white text-xs font-bold text-[#111111] px-3.5 py-2 rounded-xl shadow-md border border-[#ECECEC]"
            >
              <span>View Orders</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#E31B23]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
            </Link>
          </div>
        )}
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-[#E31B23] text-white shadow-lg focus:outline-none transition-transform duration-300",
            isFabOpen && "rotate-45"
          )}
          aria-label="Toggle quick actions"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* ── GLOBAL SEARCH DIALOG (CMD+K / CTRL+K COMMAND PALETTE) ── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 sm:pt-28">
          {/* Backdrop click closer */}
          <div
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            className="fixed inset-0 bg-[#111111]/40 backdrop-blur-[2px] transition-opacity duration-200"
          />

          {/* Search box container */}
          <div className="relative w-full h-full max-h-none rounded-none border-none bg-white flex flex-col sm:max-w-lg sm:h-auto sm:max-h-[480px] sm:rounded-xl sm:border sm:border-[#ECECEC] sm:shadow-2xl sm:ring-1 sm:ring-black/5 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Input fields header */}
            <div className="flex h-12 items-center border-b border-[#ECECEC] px-3">
              <svg className="h-5 w-5 text-[#888888] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search orders, products, categories, sessions..."
                className="flex-1 bg-transparent px-3 text-sm text-[#111111] placeholder-[#888888] focus:outline-none"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="rounded-lg border border-[#ECECEC] px-1.5 py-0.5 text-[10px] font-semibold text-[#888888] shadow-sm hover:bg-[#FAFAFA]"
              >
                ESC
              </button>
            </div>

            {/* Results items area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {searchQuery.trim().length < 2 ? (
                /* Recent & Popular searches block */
                <div className="space-y-4">
                  {recentSearches.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#888888] mb-2 px-1">Recent Searches</p>
                      <div className="space-y-1">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => setSearchQuery(term)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111]"
                          >
                            <svg className="h-3.5 w-3.5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#888888] mb-2 px-1">Popular Keywords</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {["Grade 6", "Grade 7 Assessment", "Kenya High School", "Delivered", "Pending PDFs"].map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => {
                            setSearchQuery(keyword);
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                          }}
                          className="rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-[#ECECEC] px-2.5 py-1 text-[11px] font-bold text-neutral-700 transition"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                /* Empty state results */
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-[#888888]">
                  <svg className="h-8 w-8 text-[#ECECEC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-2 font-bold">No results found for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-[10px] mt-0.5 font-medium">Check spelling or search order numbers, school names, product titles.</p>
                </div>
              ) : (
                /* Grouped matching results */
                <div className="space-y-3">
                  {/* Results grouped by category */}
                  {(["order", "product", "category", "session", "notification", "school"] as const).map((catType) => {
                    const matched = searchResults.filter((r) => r.type === catType);
                    if (matched.length === 0) return null;

                    const catLabels = {
                      order: "Exam Orders",
                      product: "Catalog Products",
                      category: "Categories",
                      session: "Exam Sessions",
                      notification: "Notifications",
                      school: "Schools",
                    };

                    return (
                      <div key={catType} className="p-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#888888] px-2 mb-1.5">
                          {catLabels[catType]}
                        </p>
                        <div className="space-y-0.5">
                          {matched.map((item) => {
                            const index = searchResults.findIndex((r) => r.id === item.id);
                            const isSelected = index === searchSelectedIndex;

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSearchResultClick(item)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all",
                                  isSelected
                                    ? "bg-[#E31B23]/5 text-[#E31B23]"
                                    : "text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111]"
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate leading-snug">{item.title}</p>
                                  {item.subtitle && (
                                    <p className="text-[10px] text-[#888888] mt-0.5 leading-none font-semibold truncate">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                                <svg className="h-4 w-4 opacity-50 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Keyboard shortcut legend foot */}
            <div className="flex h-10 items-center justify-between border-t border-[#ECECEC] bg-[#FAFAFA] px-4 text-[10px] font-bold text-[#888888]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="rounded bg-white border border-[#ECECEC] px-1 text-[9px] shadow-sm">↓↑</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="rounded bg-white border border-[#ECECEC] px-1 text-[9px] shadow-sm">Enter</kbd> Open</span>
              </div>
              <div>TopNote Admin Console</div>
            </div>
          </div>
        </div>
      )}
      {/* ── CREATE NOTIFICATION MODAL ── */}
      {isNewNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setIsNewNotificationModalOpen(false)}
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200"
          />

          {/* Form Modal Box */}
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-sm font-black text-neutral-900">Broadcast Notification</h3>
              <button
                onClick={() => setIsNewNotificationModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as HTMLFormElement;
                const title = (target.elements.namedItem("notif_title") as HTMLInputElement).value;
                const message = (target.elements.namedItem("notif_message") as HTMLTextAreaElement).value;
                const type = (target.elements.namedItem("notif_type") as HTMLSelectElement).value as "system" | "warning";

                if (!title || !message) {
                  alert("Title and message are required!");
                  return;
                }

                setIsCreatingNotification(true);
                const res = await createAdminNotificationAction({ title, message, type });
                setIsCreatingNotification(false);

                if (res.success) {
                  setIsNewNotificationModalOpen(false);
                  target.reset();
                } else {
                  alert(res.error || "Failed to create notification");
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Alert Type</label>
                <select
                  name="notif_type"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-200"
                >
                  <option value="system">System Info (Blue)</option>
                  <option value="warning">Warning / Alert (Orange)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Title</label>
                <input
                  type="text"
                  name="notif_title"
                  required
                  placeholder="E.g., Scheduled Maintenance"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Message</label>
                <textarea
                  name="notif_message"
                  required
                  rows={3}
                  placeholder="Details of the broadcast alert..."
                  className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewNotificationModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingNotification}
                  className="rounded-lg bg-[#E31B23] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#C1141C] disabled:opacity-40"
                >
                  {isCreatingNotification ? "Sending..." : "Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Notification Drawer (mounted at root viewport level to prevent backdrop blur containment) */}
      <BellPreview
        notificationsOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        onMarkAllAsRead={markAllAsRead}
        forceMobileTablet={true}
      />
    </div>
  );
}

function shrinkIconColor(active: boolean) {
  return cn("shrink-0", active ? "text-[#E31B23]" : "text-[#888888]");
}
