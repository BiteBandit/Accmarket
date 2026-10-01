"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  username: string;
  email: string;
  role: string;
  kyc_status: string;
  trust_score?: number;
  is_active: boolean;
  avatar_url?: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const MARKETPLACE_PLATFORMS = [
  { name: "FACEBOOK", slug: "facebook" },
  { name: "TIKTOK", slug: "tiktok" },
  { name: "INSTAGRAM", slug: "instagram" },
  { name: "TWITTER", slug: "twitter" },
  { name: "SNAPCHAT", slug: "snapchat" },
  { name: "LINKEDIN", slug: "linkedin" },
  { name: "REDDIT", slug: "reddit" },
  { name: "PINTEREST", slug: "pinterest" },
  { name: "DISCORD", slug: "discord" },
  { name: "TWITCH", slug: "twitch" },
  { 
    name: "MAILS",
    slug: "mails",
    hasDropdown: true,
    subItems: [
      { name: "Gmail", slug: "mails-gmail" },
      { name: "Outlook", slug: "mails-outlook" },
      { name: "Yahoo", slug: "mails-yahoo" },
      { name: "Hotmail", slug: "mails-hotmail" },
      { name: "ProtonMail", slug: "mails-protonmail" },
      { name: "Rambler", slug: "mails-rambler" },
      { name: "Yandex", slug: "mails-yandex" },
      { name: "Mail.ru", slug: "mails-mailru" },
      { name: "Mail.com", slug: "mails-mailcom" },
      { name: "AOL", slug: "mails-aol" },
      { name: "GMX", slug: "mails-gmx" },
      { name: "O2", slug: "mails-o2" },
      { name: "Atomic Mail", slug: "mails-atomicmail" },
      { name: "Onet", slug: "mails-onet" },
    ]
  },
];

export default function NotificationsPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Slide-in drawer & modal states
  const [showPlatformDrawer, setShowPlatformDrawer] = useState(false);
  const [sellerPromptModal, setSellerPromptModal] = useState(false);
  const [mailsOpen, setMailsOpen] = useState(false);

  // Selection / Long-press states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    let channel: any;
    let notifChannel: any;

    async function loadNotificationsData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const userId = user.id;
        const userEmail = user.email || "";

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, email, role, kyc_status, trust_score, is_active, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (profileData && profileData.is_active === false) {
          await supabase.auth.signOut();
          router.push("/login?error=account_deactivated");
          return;
        }

        if (profileData) {
          setProfile({
            ...profileData,
            email: profileData.email || userEmail,
            trust_score: profileData.trust_score ?? 60,
            is_active: profileData.is_active ?? true,
          });
        } else {
          setProfile({
            username: userEmail.split("@")[0] || "User",
            email: userEmail,
            role: "Member",
            kyc_status: "Unverified",
            trust_score: 60,
            is_active: true,
          });
        }

        const { data: notifData, error: notifError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (notifError) {
          console.error("Error fetching notifications:", notifError);
        } else {
          setNotifications(notifData || []);
          setHasUnread((notifData || []).some((n) => !n.is_read));
        }

        channel = supabase
          .channel(`profile-changes-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${userId}`,
            },
            async (payload) => {
              const updatedProfile = payload.new as UserProfile;
              if (updatedProfile.is_active === false) {
                await supabase.auth.signOut();
                router.push("/login?error=account_deactivated");
              }
            }
          );
        channel.subscribe();

        notifChannel = supabase
          .channel(`notifications:user_id=eq.${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification;
              setNotifications((prev) => [newNotification, ...prev]);
              setHasUnread(true);
            }
          );
        notifChannel.subscribe();

      } catch (err) {
        console.error("Unexpected error loading notifications page:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotificationsData();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (notifChannel) supabase.removeChannel(notifChannel);
    };
  }, [router, supabase]);

  const handleListAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const role = profile?.role?.toLowerCase();
    if (role === "seller" || role === "vendor" || role === "admin") {
      router.push("/sell");
    } else {
      setSellerPromptModal(true);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      setHasUnread(updated.some((n) => !n.is_read));
      return updated;
    });

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setHasUnread(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
    }
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      setHasUnread(filtered.some((n) => !n.is_read));
      return filtered;
    });

    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    const idsToDelete = [...selectedIds];
    setNotifications((prev) => {
      const filtered = prev.filter((n) => !idsToDelete.includes(n.id));
      setHasUnread(filtered.some((n) => !n.is_read));
      return filtered;
    });

    setSelectedIds([]);
    setIsSelectMode(false);

    await supabase
      .from("notifications")
      .delete()
      .in("id", idsToDelete);
  };

  const handleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectMode(true);
      toggleSelect(id);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const displayName = profile?.username?.trim() || profile?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111][span_0](start_span)[span_0](end_span)">

      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-[#e5e7eb] bg-white lg:block">
        <div className="flex h-20 items-center justify-center border-b border-[#e5e7eb] px-6">
          <Link href="/" className="relative flex items-center justify-center w-full h-12">
            <Image
              src="/images/logo.png"
              alt="AccMarket"
              fill
              priority
              className="object-contain object-left"
            />
          </Link>
        </div>

        <nav className="px-4 py-6 space-y-1">
          <SidebarLink href="/dashboard" label="Dashboard" icon={<DashboardIcon />} />
          <SidebarLink href="/dashboard/wallet" label="Wallet" icon={<WalletIcon />} />
          <SidebarLink href="/dashboard/transactions" label="Transactions" icon={<TransactionIcon />} />
          <button 
            onClick={handleListAccountClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#6b7280] transition hover:bg-[#f5f7fb] hover:text-[#0b1e5b]"
          >
            <ChartIcon />
            Sell account
          </button>
          <SidebarLink href="/dashboard/messages" label="My chats" icon={<MessageIcon />} />
          <SidebarLink href="/dashboard/notifications" label="Notification" icon={<BellIcon hasUnread={hasUnread} />} />
          <SidebarLink href="/dashboard/api" label="API & Webhooks" icon={<ApiIcon />} />
          <SidebarLink href="/dashboard/support" label="Support" icon={<SupportIcon />} />
          <SidebarLink href="/dashboard/settings" label="Settings" active icon={<SettingsIcon />} />

          <div className="my-4 border-t border-[#e5e7eb]" />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Log out
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-[#e5e7eb] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b1e5b] text-xs font-bold text-white">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#111111]">
                {displayName}
              </p>
              <p className="truncate text-[11px] uppercase tracking-wider text-[#0b1e5b] font-semibold">
                {profile?.role || "Buyer"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-[#9ca3af] transition hover:text-[#0b1e5b]"
            >
              <MoreIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-[#fdfdfc]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="relative h-10 w-[120px]">
          <Image
            src="/images/logo.png"
            alt="AccMarket"
            fill
            priority
            className="object-contain object-left"
          />
        </Link>
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
        >
          <MenuIcon />
        </button>
      </header>

      {/* =========================
          MOBILE MENU
      ========================== */}
      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-[#e5e7eb] bg-white p-4 shadow-lg lg:hidden">
          <div className="space-y-1">
            <MobileLink href="/dashboard" label="Dashboard" icon={<DashboardIcon />} />
            <MobileLink href="/dashboard/wallet" label="Wallet" icon={<WalletIcon />} />
            <MobileLink href="/dashboard/transactions" label="Transactions" icon={<TransactionIcon />} />
            <button
              onClick={handleListAccountClick}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#111111] hover:bg-[#f5f7fb] hover:text-[#0b1e5b] text-left"
            >
              <span className="text-[#6b7280]"><ChartIcon /></span>
              Sell account
            </button>
            <MobileLink href="/dashboard/messages" label="My chats" icon={<MessageIcon />} />
            <MobileLink href="/dashboard/notifications" label="Notification" icon={<BellIcon hasUnread={hasUnread} />} />
            <MobileLink href="/dashboard/api" label="API & Webhooks" icon={<ApiIcon />} />
            <MobileLink href="/dashboard/support" label="Support" icon={<SupportIcon />} />
            <MobileLink href="/dashboard/settings" label="Settings" icon={<SettingsIcon />} />
            <div className="pt-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                <LogoutIcon />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <div className="lg:pl-[250px]">
        <div className="mx-auto max-w-4xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">

          {/* Header Title Section */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111111] sm:text-3xl">
                Notifications {unreadCount > 0 && <span className="ml-2 px-2.5 py-0.5 text-xs rounded-full bg-[#0b1e5b] text-white font-bold">{unreadCount}</span>}
              </h1>
              <p className="mt-1 text-xs text-[#6b7280]">
                Stay updated with your account activity and real-time alerts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isSelectMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedIds([]);
                    }}
                    className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f5f7fb]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteSelected}
                    disabled={selectedIds.length === 0}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete Selected ({selectedIds.length})
                  </button>
                </>
              ) : (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-semibold text-[#0b1e5b] transition hover:bg-[#f5f7fb]"
                    >
                      Mark all as read
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}

              {/* Notifications List - Standalone Cards */}
          <div className="space-y-4">
            <p className="text-[11px] text-[#9ca3af] mb-2 px-1 italic">
              💡 Tip: Long-press any notification card to select and delete items.
            </p>

            {loading ? (
              // Skeleton Loader State
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-start gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-gray-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-1/3 rounded bg-gray-200" />
                        <div className="h-3 w-16 rounded bg-gray-100" />
                      </div>
                      <div className="h-3.5 w-4/5 rounded bg-gray-100" />
                      <div className="h-3 w-24 rounded bg-gray-100 pt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-12 text-center shadow-[0_4px_20px_rgba(15,23,42,0.04)] relative z-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-[#9ca3af] shadow-sm">
                  <BellIcon size={24} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#111111]">No notifications yet</h3>
                <p className="mt-1 text-xs text-[#6b7280] max-w-xs mx-auto">
                  We will notify you right here when important updates occur on your account.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onMouseDown={() => handleTouchStart(item.id)}
                    onMouseUp={handleTouchEnd}
                    onTouchStart={() => handleTouchStart(item.id)}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => {
                      if (isSelectMode) {
                        toggleSelect(item.id);
                      } else if (!item.is_read) {
                        markAsRead(item.id);
                      }
                    }}
                    className={`group relative p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-start gap-4 select-none bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] relative z-10 ${
                      isSelected
                        ? "bg-blue-50/60 border-blue-300 ring-1 ring-blue-300"
                        : item.is_read
                        ? "border-[#e5e7eb] hover:border-[#cbd5e1]"
                        : "border-[#cbd5e1] hover:border-[#94a3b8]"
                    }`}
                  >
                    {/* Checkbox in select mode */}
                    {isSelectMode && (
                      <div className="flex h-5 items-center pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#0b1e5b] focus:ring-[#0b1e5b]"
                        />
                      </div>
                    )}

                    {/* Icon indicator */}
                    {!isSelectMode && (
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                        item.is_read 
                          ? "bg-[#f9fafb] border-[#e5e7eb] text-[#9ca3af]" 
                          : "bg-[#0b1e5b]/5 border-[#0b1e5b]/20 text-[#0b1e5b]"
                      }`}>
                        <BellIcon size={16} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm tracking-tight ${item.is_read ? "font-medium text-[#374151]" : "font-bold text-[#0b1e5b]"}`}>
                          {item.title}
                        </h3>
                        {!item.is_read && !isSelectMode && (
                          <span className="h-2 w-2 rounded-full bg-[#0b1e5b] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#4b5563] leading-relaxed break-words">{item.message}</p>
                      <span className="block pt-1 text-[10px] text-[#9ca3af] font-medium">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {!isSelectMode && (
                      <button
                        onClick={(e) => deleteNotification(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition text-[#9ca3af] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete notification"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })
            )}

          </div>

        </div>
      </div>

      {/* =========================================
          COMPACT SLIDE-IN LEFT SIDEBAR DRAWER
      ========================================= */}
      {showPlatformDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowPlatformDrawer(false)} />

          <div className="absolute inset-y-0 left-0 flex max-w-full pr-10">
            <div className="w-screen max-w-xs transform bg-[#0b1e5b] p-5 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between text-white">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Platforms</h3>
                  <button 
                    onClick={() => setShowPlatformDrawer(false)}
                    className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-5 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
                  {MARKETPLACE_PLATFORMS.map((platform) => {
                    if (platform.hasDropdown) {
                      return (
                        <div key={platform.slug} className="space-y-1">
                          <button
                            onClick={() => setMailsOpen(!mailsOpen)}
                            className="flex w-full items-center justify-between text-xs font-bold tracking-wide text-white/90 transition hover:text-white py-1"
                          >
                            <span>{platform.name}</span>
                            <span className={`transform transition-transform text-[10px] ${mailsOpen ? "rotate-180" : ""}`}>▼</span>
                          </button>
                          {mailsOpen && (
                            <div className="pl-3 space-y-2 border-l border-white/20 my-2">
                              {platform.subItems?.map((sub) => (
                                <Link
                                  key={sub.slug}
                                  href={`/marketplace?platform=${sub.slug}`}
                                  onClick={() => setShowPlatformDrawer(false)}
                                  className="block text-xs font-medium text-white/70 transition hover:text-white hover:translate-x-1 py-0.5"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={platform.slug}
                        href={`/marketplace?platform=${platform.slug}`}
                        onClick={() => setShowPlatformDrawer(false)}
                        className="block text-xs font-bold tracking-wide text-white/90 transition hover:text-white hover:translate-x-1 py-1"
                      >
                        {platform.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <Link
                  href="/marketplace"
                  onClick={() => setShowPlatformDrawer(false)}
                  className="block w-full rounded-xl bg-white py-2.5 text-center text-xs font-bold text-[#0b1e5b] transition hover:bg-white/90"
                >
                  View All Listings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          SELLER UPGRADE PROMPT MODAL
      ========================== */}
      {sellerPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ShieldIcon />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#111111]">Vendor Access Required</h3>
            <p className="mt-2 text-xs text-[#6b7280] leading-relaxed">
              Your current account type is <span className="font-bold uppercase text-[#0b1e5b]">{profile?.role || "Member"}</span>. To list and sell accounts securely on escrow, you need to upgrade your profile to a verified seller/vendor account.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSellerPromptModal(false)}
                className="flex-1 rounded-xl border border-[#e5e7eb] bg-white py-2.5 text-xs font-semibold text-[#111111]"
              >
                Cancel
              </button>
              <Link
                href="/dashboard/settings"
                onClick={() => setSellerPromptModal(false)}
                className="flex-1 rounded-xl bg-[#0b1e5b] py-2.5 text-xs font-semibold text-white text-center"
              >
                Upgrade to Seller
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MOBILE BOTTOM NAV
      ========================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5e7eb] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          <BottomNav href="/dashboard" icon={<DashboardIcon />} label="Home" />
          
          <button
            onClick={() => setShowPlatformDrawer(true)}
            className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-[#9ca3af] transition hover:text-[#0b1e5b]"
          >
            <MarketplaceIcon />
            Market
          </button>

          <BottomNav href="/dashboard/messages" icon={<MessageIcon />} label="Chat" />
          <BottomNav href="/dashboard/notifications" icon={<BellIcon hasUnread={hasUnread} />} label="Notification" active />
          <BottomNav href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" />
        </div>
      </div>

    </main>
  );
}

/* =========================================
   COMPONENTS & SVG ICONS
========================================= */

function SidebarLink({ href, label, icon, active = false }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
        active ? "bg-[#0b1e5b] text-white shadow-sm" : "text-[#6b7280] hover:bg-[#f5f7fb] hover:text-[#0b1e5b]"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#111111] hover:bg-[#f5f7fb] hover:text-[#0b1e5b]">
      <span className="text-[#6b7280]">{icon}</span>
      {label}
    </Link>
  );
}

function BottomNav({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold ${active ? "text-[#0b1e5b]" : "text-[#9ca3af]"}`}>
      {icon}
      {label}
    </Link>
  );
}

function DashboardIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}
function WalletIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 12h5" /><circle cx="16" cy="12" r="1" /></svg>;
}
function ChartIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-4 3 2 5-6" /></svg>;
}
function MessageIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H8l-4 4V5z" /></svg>;
}
function BellIcon({ hasUnread = false, size = 18 }: { hasUnread?: boolean; size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg style={{ width: size, height: size }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </div>
  );
}
function ApiIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
}
function SupportIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>;
}
function SettingsIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 000-6l1.1-1.8-2-2-1.8 1.1a1.7 1.7 0 00-2.4-1.4L14 3h-4l-.3 1.9a1.7 1.7 0 00-2.4 1.4L5.5 5.2l-2 2L4.6 9a1.7 1.7 0 000 6l-1.1 1.8 2 2 1.8-1.1a1.7 1.7 0 002.4 1.4L10 21h4l.3-1.9a1.7 1.7 0 002.4-1.4l1.8 1.1 2-2L19.4 15z" /></svg>;
}
function LogoutIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}
function MarketplaceIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l2-5h14l2 5" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 9v10a2 2 0 002 2h12a2 2 0 002-2V9" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" /></svg>;
}
function ShieldIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 3v5c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10V6l8-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>;
}
function MoreIcon() {
  return <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}
function MenuIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
}
function TransactionIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" /></svg>;
}