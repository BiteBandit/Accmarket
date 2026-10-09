"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileMenuDrawer,
  BottomNav,
} from "@/components/navigation";

interface UserProfile {
  username?: string | null;
  email?: string | null;
  role: string;
  kyc_status: string;
  trust_score?: number;
  is_active: boolean;
  avatar_url?: string | null;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ShieldCheckIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l7 4v5c0 4.5-2.9 7.7-7 9-4.1-1.3-7-4.5-7-9V7l7-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertCircleIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function CheckCircleIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.3 2.3 4.7-5" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function ArrowRightIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function NotificationsPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [sellerPromptDrawer, setSellerPromptDrawer] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const hasUnread = unreadCount > 0;

  const navProfile = {
    username: profile?.username || "User",
    email: profile?.email || "",
    avatar_url: profile?.avatar_url || null,
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSignOut = async () => {
    clearLongPressTimer();
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    let profileChannel: any = null;
    let notificationChannel: any = null;
    let mounted = true;

    const loadNotificationsData = async () => {
      setLoading(true);
      setErrorMsg("");

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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "username, email, role, kyc_status, trust_score, is_active, avatar_url"
          )
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        if (profileData?.is_active === false) {
          await supabase.auth.signOut();
          router.push("/login?error=account_deactivated");
          return;
        }

        if (!mounted) return;

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
            avatar_url: null,
          });
        }

        const { data: notifData, error: notifError } = await supabase
          .from("notifications")
          .select(
            "id, user_id, title, message, is_read, created_at"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (notifError) {
          console.error("Error fetching notifications:", notifError);

          if (mounted) {
            setErrorMsg(
              "We couldn't load your notifications. Please try again."
            );
          }
        } else if (mounted) {
          setNotifications((notifData as Notification[]) || []);
        }

        profileChannel = supabase
          .channel(`profile-changes-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${userId}`,
            },
            async (payload) => {
              const updatedProfile = payload.new as UserProfile;

              if (updatedProfile.is_active === false) {
                await supabase.auth.signOut();
                router.push("/login?error=account_deactivated");
                return;
              }

              if (mounted) {
                setProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...updatedProfile,
                      }
                    : prev
                );
              }
            }
          )
          .subscribe();

        notificationChannel = supabase
          .channel(`notifications-${userId}`)
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

              if (!mounted) return;

              setNotifications((prev) => {
                if (prev.some((item) => item.id === newNotification.id)) {
                  return prev;
                }

                return [newNotification, ...prev];
              });
            }
          )
          .subscribe();
      } catch (error) {
        console.error(
          "Unexpected error loading notifications page:",
          error
        );

        if (mounted) {
          setErrorMsg(
            "Something went wrong while loading your notifications."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotificationsData();

    return () => {
      mounted = false;

      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }

      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [router, supabase]);

  const handleListAccountClick = () => {
    const role = profile?.role?.toLowerCase();

    if (
      role === "seller" ||
      role === "vendor" ||
      role === "admin"
    ) {
      router.push("/dashboard/sell");
    } else {
      setSellerPromptDrawer(true);
    }
  };

  const markAsRead = async (id: string) => {
    const previousNotifications = notifications;

    setErrorMsg("");

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);

      setNotifications(previousNotifications);
      setErrorMsg("Couldn't update this notification.");
    }
  };

  const markAllAsRead = async () => {
    if (actionLoading || unreadCount === 0) return;

    const previousNotifications = notifications;

    setActionLoading(true);
    setErrorMsg("");

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setNotifications(previousNotifications);
      setErrorMsg("Couldn't mark all notifications as read.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNotification = async (
    id: string,
    event?: MouseEvent<HTMLButtonElement>
  ) => {
    event?.stopPropagation();

    const previousNotifications = notifications;
    setErrorMsg("");

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting notification:", error);
      setNotifications(previousNotifications);
      setErrorMsg("Couldn't delete this notification.");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0 || actionLoading) return;

    const idsToDelete = [...selectedIds];
    const previousNotifications = notifications;

    setActionLoading(true);
    setErrorMsg("");

    setNotifications((prev) =>
      prev.filter((notification) => !idsToDelete.includes(notification.id))
    );

    setSelectedIds([]);
    setIsSelectMode(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", idsToDelete)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error deleting selected notifications:", error);
      setNotifications(previousNotifications);
      setErrorMsg("Couldn't delete the selected notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePointerDown = (
    id: string,
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    clearLongPressTimer();
    longPressTriggered.current = false;

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;

      setIsSelectMode(true);
      setSelectedIds((prev) =>
        prev.includes(id) ? prev : [...prev, id]
      );

      if (
        typeof navigator !== "undefined" &&
        "vibrate" in navigator
      ) {
        navigator.vibrate(35);
      }
    }, 600);
  };

  const handlePointerUp = () => {
    clearLongPressTimer();
  };

  const handlePointerCancel = () => {
    clearLongPressTimer();
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (isSelectMode) {
      setSelectedIds((prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id]
      );
      return;
    }

    if (!isRead) {
      markAsRead(id);
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      <DesktopSidebar
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      <MobileHeader setMobileMenuOpen={setMobileMenuOpen} />

      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      <div className="lg:pl-[260px]">
        <DesktopHeader
          profile={navProfile}
          hasUnread={hasUnread}
          pageTitle="Notifications"
          sectionLabel="Account"
        />

        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
          {/* Page heading */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0b1e5b]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7280]">
                  Account Center
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-[#111111] sm:text-3xl">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#0b1e5b] px-2.5 py-1 text-[10px] font-bold text-white">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#6b7280]">
                Stay updated with important activity, account changes,
                security alerts, and marketplace notifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSelectMode ? (
                <>
                  <button
                    type="button"
                    onClick={exitSelectMode}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#6b7280] shadow-sm transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={
                      selectedIds.length === 0 || actionLoading
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete Selected
                    <span className="rounded-md bg-white/15 px-1.5 py-0.5">
                      {selectedIds.length}
                    </span>
                  </button>
                </>
              ) : (
                unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-xs font-semibold text-[#0b1e5b] shadow-sm transition hover:border-[#d5dce7] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Mark all as read
                  </button>
                )
              )}
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircleIcon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-red-700">
                  Something went wrong
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-red-600">
                  {errorMsg}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setErrorMsg("")}
                className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-100 hover:text-red-700"
                aria-label="Dismiss error"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Select mode banner */}
                 {isSelectMode && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#dbe4f0] bg-[#f4f7fb] px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b] text-white">
                <CheckCircleIcon className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-bold text-[#111111]">
                  Selection mode
                </p>
                <p className="text-[11px] text-[#6b7280]">
                  Select the notifications you want to remove.
                </p>
              </div>
            </div>
          )}

          {/* Notification section */}
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#374151]">
                  Recent activity
                </h2>
              </div>

              {notifications.length > 0 && (
                <span className="text-[10px] font-medium text-[#9ca3af]">
                  {notifications.length}{" "}
                  {notifications.length === 1
                    ? "notification"
                    : "notifications"}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-start gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-[#eef1f5]" />

                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="h-3.5 w-32 rounded bg-[#e8ebef]" />
                          <div className="h-3 w-16 rounded bg-[#f0f2f5]" />
                        </div>

                        <div className="h-3 w-4/5 rounded bg-[#f0f2f5]" />
                        <div className="h-3 w-24 rounded bg-[#f0f2f5]" />
                      </div>
                    </div>
                  ))}
                </>
              ) : notifications.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center shadow-[0_4px_20px_rgba(15,23,42,0.04)] sm:p-14">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[#0b1e5b]" />

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] text-[#0b1e5b] shadow-sm">
                    <BellIcon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-5 text-sm font-bold text-[#111111]">
                    You're all caught up
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#6b7280]">
                    There are no notifications to show right now.
                    Important account and marketplace updates will
                    appear here.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Notifications are up to date
                  </div>
                </div>
              ) : (
                notifications.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onPointerDown={(event) =>
                        handlePointerDown(item.id, event)
                      }
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerCancel}
                      onPointerLeave={handlePointerCancel}
                      onClick={() =>
                        handleNotificationClick(
                          item.id,
                          item.is_read
                        )
                      }
                      className={`group relative flex cursor-pointer select-none items-start gap-4 rounded-2xl border bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition sm:p-5 ${
                        isSelected
                          ? "border-[#9db3d7] bg-[#f4f7fb] ring-1 ring-[#b7c8e2]"
                          : item.is_read
                          ? "border-[#e5e7eb] hover:border-[#d1d9e5] hover:shadow-[0_6px_24px_rgba(15,23,42,0.06)]"
                          : "border-[#d4dce8] hover:border-[#aebed3] hover:shadow-[0_6px_24px_rgba(15,23,42,0.07)]"
                      }`}
                    >
                      {isSelectMode && (
                        <div className="flex h-5 shrink-0 items-center pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter(
                                      (selectedId) =>
                                        selectedId !== item.id
                                    )
                                  : [...prev, item.id]
                              )
                            }
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="h-4 w-4 rounded border-[#cbd5e1] text-[#0b1e5b] focus:ring-[#0b1e5b]"
                            aria-label={`Select ${item.title}`}
                          />
                        </div>
                      )}

                      {!isSelectMode && (
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            item.is_read
                              ? "border-[#e5e7eb] bg-[#f8fafc] text-[#9ca3af]"
                              : "border-[#dbe4f0] bg-[#eef3fb] text-[#0b1e5b]"
                          }`}
                        >
                          <BellIcon className="h-[18px] w-[18px]" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`text-sm tracking-tight ${
                                  item.is_read
                                    ? "font-semibold text-[#374151]"
                                    : "font-bold text-[#0b1e5b]"
                                }`}
                              >
                                {item.title}
                              </h3>

                              {!item.is_read && (
                                <span className="rounded-full bg-[#eef3fb] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#0b1e5b]">
                                  New
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="shrink-0 text-[10px] font-medium text-[#9ca3af]">
                            {formatDate(item.created_at)}
                          </span>
                        </div>

                        <p className="mt-2 break-words text-xs leading-relaxed text-[#4b5563]">
                          {item.message}
                        </p>
                      </div>

                      {!isSelectMode && (
                        <button
                          type="button"
                          onClick={(event) =>
                            deleteNotification(item.id, event)
                          }
                          className="shrink-0 rounded-lg p-2 text-[#9ca3af] transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {!loading &&
              notifications.length > 0 &&
              !isSelectMode && (
                <div className="mt-6 flex items-center gap-2 px-1 text-[10px] text-[#9ca3af]">
                  <span className="h-1 w-1 rounded-full bg-[#0b1e5b]" />
                  Long-press a notification to select multiple items.
                </div>
              )}
          </section>
        </div>
      </div>

      {/* Seller access bottom sheet drawer */}
      {sellerPromptDrawer && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#020617]/55 p-0 backdrop-blur-[6px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-access-title"
          onClick={() => setSellerPromptDrawer(false)}
        >
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-t-[30px] border border-white/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[30px]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-1 bg-[#0b1e5b]" />

            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0b1e5b]/[0.035]" />
            <div className="pointer-events-none absolute -left-24 top-32 h-44 w-44 rounded-full bg-[#0b1e5b]/[0.025]" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setSellerPromptDrawer(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#9ca3af] shadow-sm transition-all duration-200 hover:border-[#d1d5db] hover:bg-[#f8fafc] hover:text-[#111111] active:scale-95"
              aria-label="Close seller access dialog"
            >
              <XIcon className="h-4 w-4" />
            </button>

            <div className="relative px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
              {/* Verification icon */}
              <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-[#d7e1ef] bg-[#f1f5fb] text-[#0b1e5b] shadow-[0_8px_25px_rgba(11,30,91,0.08)]">
                <ShieldCheckIcon className="h-8 w-8" />
              </div>

              {/* Heading */}
              <div className="mt-5 text-center">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0b1e5b]" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                    Seller verification
                  </span>
                </div>

                <h3
                  id="seller-access-title"
                  className="text-[22px] font-black tracking-tight text-[#111111] sm:text-2xl"
                >
                  Unlock seller access
                </h3>

                <p className="mx-auto mt-2 max-w-[390px] text-xs leading-[1.7] text-[#6b7280]">
                  Your current account is registered as{" "}
                  <span className="font-bold uppercase text-[#0b1e5b]">
                    {profile?.role || "Member"}
                  </span>
                  . Complete seller verification to start listing accounts
                  and using AccMarket escrow.
                </p>
              </div>

              {/* Account status */}
              <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b1e5b] shadow-sm ring-1 ring-[#e5e7eb]">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">
                      Current account
                    </p>

                    <p className="mt-0.5 truncate text-xs font-bold capitalize text-[#111111]">
                      {profile?.role || "Member"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-[#d9f0e3] bg-[#f0fdf4] px-2.5 py-1">
                    <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-5">
                <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
                  What you unlock
                </p>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f1f5fb] text-[#0b1e5b]">
                      <ShieldCheckIcon className="h-4 w-4" />
                    </div>

                    <p className="mt-2.5 text-[11px] font-bold text-[#111111]">
                      Secure escrow
                    </p>

                    <p className="mt-1 text-[9px] leading-relaxed text-[#9ca3af]">
                      Trade through protected escrow.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f1f5fb] text-[#0b1e5b]">
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>

                    <p className="mt-2.5 text-[11px] font-bold text-[#111111]">
                      List accounts
                    </p>

                    <p className="mt-1 text-[9px] leading-relaxed text-[#9ca3af]">
                      Create listings for buyers.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f1f5fb] text-[#0b1e5b]">
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>

                    <p className="mt-2.5 text-[11px] font-bold text-[#111111]">
                      Seller profile
                    </p>

                    <p className="mt-1 text-[9px] leading-relaxed text-[#9ca3af]">
                      Build buyer trust.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA area */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSellerPromptDrawer(false);
                    router.push("/dashboard/settings/upgrade-to-seller");
                  }}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0b1e5b] px-5 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(11,30,91,0.18)] transition-all duration-200 hover:bg-[#09184a] hover:shadow-[0_14px_30px_rgba(11,30,91,0.24)] active:scale-[0.99]"
                >
                  Start seller verification

                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerPromptDrawer(false)}
                  className="mt-2.5 w-full rounded-2xl px-5 py-3 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f8fafc] hover:text-[#111111]"
                >
                  Maybe later
                </button>
              </div>

              {/* Security note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-center">
                <ShieldCheckIcon className="h-3 w-3 text-[#9ca3af]" />
                <span className="text-[9px] font-medium text-[#9ca3af]">
                  Verification helps keep the AccMarket marketplace trusted.
                </span>
              </div>
            </div>

            {/* Mobile bottom safe-area spacing */}
            <div className="h-[env(safe-area-inset-bottom)] bg-white sm:hidden" />
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      <BottomNav hasUnread={hasUnread} />
    </main>
  );
}