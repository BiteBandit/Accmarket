"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  username: string;
  email: string;
  role: string;
  kyc_status: string;
  trust_score?: number | string;
  is_active: boolean;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  email_notifications?: boolean;
  push_notifications?: boolean;
  telegram_chat_id?: string | null;
  telegram_notifications?: boolean;
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

export default function SettingsPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialUsername, setInitialUsername] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Slide-in drawer & modal states
  const [showPlatformDrawer, setShowPlatformDrawer] = useState(false);
  const [sellerPromptModal, setSellerPromptModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [mailsOpen, setMailsOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    let channel: any;

    async function loadSettingsData() {
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
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileData && profileData.is_active === false) {
          await supabase.auth.signOut();
          router.push("/login?error=account_deactivated");
          return;
        }

        if (profileData) {
          const fetchedUsername = profileData.username || "";
          setInitialUsername(fetchedUsername);
          setProfile({
            ...profileData,
            email: profileData.email || userEmail,
            trust_score: profileData.trust_score ?? 10,
            is_active: profileData.is_active ?? true,
            email_notifications: profileData.email_notifications ?? true,
            push_notifications: profileData.push_notifications ?? true,
            telegram_notifications: profileData.telegram_notifications ?? false,
          });
        }

        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false);

        if (unreadCount !== null && unreadCount > 0) {
          setHasUnread(true);
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

      } catch (err) {
        console.error("Unexpected error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettingsData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router, supabase]);

  // Handle Profile Picture Upload
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    // Correct folder structure: {user.id}/{filename}
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) throw updateError;

    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
    setSuccessMsg("Profile picture updated successfully!");
  } catch (err: any) {
    setErrorMsg(err.message || "Failed to upload avatar image.");
  } finally {
    setUploadingAvatar(false);
  }
};

  // Handle Username uniqueness check and save
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    setUsernameError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      // Check uniqueness if username changed
      if (profile.username !== initialUsername) {
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profile.username)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
          setUsernameError("This username is already taken by another user.");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          phone: profile.phone,
          email_notifications: profile.email_notifications,
          push_notifications: profile.push_notifications,
          telegram_notifications: profile.telegram_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setInitialUsername(profile.username);
      setSuccessMsg("Settings updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Reset Request
  const handlePasswordReset = async () => {
    try {
      if (!profile?.email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/dashboard/settings?reset=true`,
      });
      if (error) throw error;
      setSuccessMsg("Password reset link sent to your email!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send password reset email.");
    }
  };

  // Handle Account Deactivation
  const handleDeactivateAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      router.push("/login?error=account_deactivated");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deactivate account.");
      setDeactivateModal(false);
    }
  };

  const handleListAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const role = profile?.role?.toLowerCase();
    if (role === "seller" || role === "vendor" || role === "admin") {
      router.push("/sell");
    } else {
      setSellerPromptModal(true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fdfdfc] p-4 lg:pl-[250px] lg:p-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-8 w-48 rounded bg-gray-200" />
              <div className="h-4 w-72 rounded bg-gray-200" />
            </div>
            <div className="h-14 w-48 rounded-2xl bg-gray-200" />
          </div>

          {/* Hero Banner Skeleton */}
          <div className="h-48 w-full rounded-3xl bg-gray-200" />

          {/* Personal Information Form Skeleton */}
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-gray-200" />
                <div className="h-3 w-56 rounded bg-gray-200" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 pt-4">
              <div className="h-12 w-full rounded-xl bg-gray-200" />
              <div className="h-12 w-full rounded-xl bg-gray-200" />
              <div className="h-12 w-full rounded-xl bg-gray-200" />
              <div className="h-12 w-full rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }
  const displayName = profile?.username?.trim() || profile?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">

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
          MAIN SETTINGS CONTENT
      ========================== */}
      <div className="lg:pl-[250px]">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:py-10">

          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-[#6b7280] transition hover:text-[#0b1e5b]"
              >
                <ArrowLeftIcon />
                Back to dashboard
              </Link>

              <h1 className="text-2xl font-bold tracking-tight text-[#0b1e5b] sm:text-3xl">
                Settings
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b7280]">
                Manage your AccMarket profile, security, notifications and account preferences.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1e5b] text-sm font-bold text-white">
                  {userInitial}
                </div>
              )}

              <div className="min-w-0">
                <p className="max-w-[150px] truncate text-sm font-bold text-[#111111]">
                  {displayName}
                </p>
                <p className="mt-0.5 text-[11px] capitalize text-[#6b7280]">
                  {profile?.role || "buyer"} account
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {successMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
              <SuccessIcon />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800">
              <ErrorIcon />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>

            {/* =========================
                PROFILE HERO
            ========================== */}
                        <section className="overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-[0_8px_35px_rgba(15,23,42,0.045)]">
              <div className="relative overflow-hidden bg-[#0b1e5b] px-5 py-7 text-white sm:px-7">
                <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="h-[72px] w-[72px] rounded-2xl border-2 border-white/20 object-cover shadow-lg"
                        />
                      ) : (
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white text-xl font-black text-[#0b1e5b] shadow-lg">
                          {userInitial}
                        </div>
                      )}

                      <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#0b1e5b] bg-white text-[#0b1e5b] shadow-md transition hover:scale-105">
                        <CameraIcon />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </label>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-white/60">
                        Your profile
                      </p>
                      <h2 className="mt-1 text-xl font-bold">
                        {displayName}
                      </h2>
                      <p className="mt-1 max-w-[230px] truncate text-xs text-white/60">
                        {profile?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-3 py-2 sm:self-center">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold capitalize text-white">
                      {profile?.is_active ? "Account active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[#e5e7eb]">
                <ProfileMetric
                  label="Role"
                  value={capitalize(profile?.role || "buyer")}
                />
                <ProfileMetric
                  label="Trust"
                  value={`${profile?.trust_score ?? 10}%`}
                />
                <ProfileMetric
                  label="KYC"
                  value={capitalize(profile?.kyc_status || "unverified")}
                />
              </div>
            </section>

            {/* =========================
                UPGRADE TO SELLER BANNER (Only for buyers)
            ========================== */}
            {profile?.role?.toLowerCase() === "buyer" && (
              <section className="mt-6 overflow-hidden rounded-3xl border border-[#e5e7eb] bg-gradient-to-r from-[#0b1e5b] to-[#162d78] p-5 text-white shadow-lg sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold sm:text-base">Want to start selling accounts?</h3>
                    <p className="mt-1 text-xs text-white/70 max-w-lg leading-relaxed">
                      Upgrade to a verified vendor/seller account to list digital assets, build trust scores, and start earning securely on escrow.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/settings/upgrade-to-seller"
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#0b1e5b] shadow-md transition hover:bg-white/90"
                  >
                    Upgrade to Seller
                  </Link>
                </div>
              </section>
            )}


            {/* =========================
                PERSONAL INFORMATION
            ========================== */}
            <section className="mt-6 rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_28px_rgba(15,23,42,0.035)] sm:p-7">
              <SectionHeading
                icon={<UserIcon />}
                title="Personal information"
                description="Keep your account details accurate and up to date."
              />

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Username"
                  hint={usernameError}
                  error={!!usernameError}
                >
                  <input
                    type="text"
                    value={profile?.username || ""}
                    onChange={(e) => {
                      setProfile(profile ? { ...profile, username: e.target.value } : null);
                      setUsernameError("");
                    }}
                    required
                    className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3.5 text-xs text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/5"
                    placeholder="Your username"
                  />
                </Field>

                <Field label="Full name">
                  <input
                    type="text"
                    value={profile?.full_name || ""}
                    onChange={(e) =>
                      setProfile(profile ? { ...profile, full_name: e.target.value } : null)
                    }
                    className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3.5 text-xs text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/5"
                    placeholder="e.g. Kelvin Chukwunonso"
                  />
                </Field>

                <Field label="Email address" description="Your login email cannot be edited here.">
                  <div className="relative">
                    <MailIcon />
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ""}
                      className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f7f8fa] px-3.5 pl-10 text-xs text-[#9ca3af] outline-none cursor-not-allowed"
                    />
                  </div>
                </Field>

                <Field label="Phone number" description="Optional">
                  <input
                    type="text"
                    value={profile?.phone || ""}
                    onChange={(e) =>
                      setProfile(profile ? { ...profile, phone: e.target.value } : null)
                    }
                    className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3.5 text-xs text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/5"
                    placeholder="+234..."
                  />
                </Field>
              </div>
            </section>

            {/* =========================
                SECURITY
            ========================== */}
            <section className="mt-6 rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_28px_rgba(15,23,42,0.035)] sm:p-7">
              <SectionHeading
                icon={<ShieldIcon />}
                title="Security"
                description="Protect your account and keep your login credentials secure."
              />

              <div className="mt-6 divide-y divide-[#f1f3f5]">
                <SettingsRow
                  icon={<LockIcon />}
                  title="Password"
                  description="Request a secure password reset link by email."
                  action={
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="rounded-xl border border-[#dfe3ea] bg-white px-4 py-2.5 text-xs font-bold text-[#0b1e5b] transition hover:border-[#0b1e5b] hover:bg-[#f8f9fc]"
                    >
                      Reset
                    </button>
                  }
                />

                <SettingsRow
                  icon={<ShieldCheckIcon />}
                  title="Account verification"
                  description="Your verification and trust status."
                  action={
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold capitalize text-amber-600">
                      {profile?.kyc_status || "unverified"}
                    </span>
                  }
                />

                <SettingsRow
                  icon={<ActivityIcon />}
                  title="Account status"
                  description="Your AccMarket account is currently active."
                  action={
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600">
                      Active
                    </span>
                  }
                />
              </div>
            </section>

            {/* =========================
                NOTIFICATIONS
            ========================== */}
            <section className="mt-6 rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_28px_rgba(15,23,42,0.035)] sm:p-7">
              <SectionHeading
                icon={<BellIcon hasUnread={false} />}
                title="Notifications"
                description="Choose how you want AccMarket to keep you informed."
              />

              <div className="mt-6 divide-y divide-[#f1f3f5]">
                <ToggleRow
                  title="Push notifications"
                  description="Instant alerts for activity on your account."
                  checked={profile?.push_notifications ?? true}
                  onChange={(checked) =>
                    setProfile(profile ? { ...profile, push_notifications: checked } : null)
                  }
                />

                <ToggleRow
                  title="Email notifications"
                  description="Updates about purchases, sales and account activity."
                  checked={profile?.email_notifications ?? true}
                  onChange={(checked) =>
                    setProfile(profile ? { ...profile, email_notifications: checked } : null)
                  }
                />

                <ToggleRow
                  title="Telegram notifications"
                  description="Receive selected order and chat updates through Telegram."
                  checked={profile?.telegram_notifications ?? false}
                  onChange={(checked) =>
                    setProfile(profile ? { ...profile, telegram_notifications: checked } : null)
                  }
                />

                {/* Telegram Account Linking Row */}
                <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fa] text-[#0b1e5b]">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.943z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Telegram Account Linking</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#6b7280]">
                        {profile?.telegram_chat_id 
                          ? "Your Telegram is successfully connected." 
                          : "Connect your Telegram bot to receive instant alerts."}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {profile?.telegram_chat_id ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : (
                      <a
                        href={`https://t.me/Accnumbers_bot?start=${profile?.id || 'user'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1d8abf]"
                      >
                        Link Telegram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* =========================
                QUICK LINKS
            ========================== */}
            <section className="mt-6">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                  Account & support
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#111111]">
                  Quick settings
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SettingsLink
                  href="/dashboard/wallet"
                  icon={<WalletIcon />}
                  title="Wallet & payments"
                  description="Manage your wallet and transactions."
                />

                <SettingsLink
                  href="/dashboard/notifications"
                  icon={<BellIcon hasUnread={hasUnread} />}
                  title="Notifications center"
                  description="View your full notification history."
                />

                <SettingsLink
                  href="/dashboard/support"
                  icon={<SupportIcon />}
                  title="Help & support"
                  description="Get assistance from AccMarket support."
                />

                <SettingsLink
                  href="/terms"
                  icon={<DocumentIcon />}
                  title="Terms & policies"
                  description="Review platform terms and policies."
                />
              </div>
            </section>

            {/* Save */}
            <div className="sticky bottom-[68px] z-20 mt-7 flex items-center justify-between gap-4 rounded-2xl border border-[#dfe3ea] bg-white/95 p-3 shadow-[0_8px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:bottom-4">
              <p className="hidden pl-2 text-xs text-[#6b7280] sm:block">
                Save your profile and notification changes.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="ml-auto flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#162d78] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <SpinnerIcon />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>

          {/* =========================
              DANGER ZONE
          ========================== */}
          <section className="mt-8 overflow-hidden rounded-3xl border border-red-200 bg-white">
            <div className="border-b border-red-100 bg-red-50/60 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <WarningIcon />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-red-700">
                    Danger zone
                  </h2>
                  <p className="mt-0.5 text-xs text-red-600/70">
                    Actions here can affect your account access.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  Deactivate account
                </h3>
                <p className="mt-1 max-w-xl text-xs leading-5 text-[#6b7280]">
                  Temporarily deactivate your account and hide your public listings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeactivateModal(true)}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                Deactivate account
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* =========================
          DEACTIVATE CONFIRMATION MODAL
      ========================== */}
      {deactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <ShieldIcon />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#111111]">Deactivate Your Account?</h3>
            <p className="mt-2 text-xs text-[#6b7280] leading-relaxed">
              Are you sure you want to deactivate your AccMarket account? You will be logged out immediately, and your public profile and listings will be hidden until you sign back in.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeactivateModal(false)}
                className="flex-1 rounded-xl border border-[#e5e7eb] bg-white py-2.5 text-xs font-semibold text-[#111111]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white text-center hover:bg-red-700"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

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
              Your current account type is <span className="font-bold uppercase text-[#0b1e5b]">{profile?.role || "buyer"}</span>. To list and sell accounts securely on escrow, you need to upgrade your profile to a verified seller/vendor account.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSellerPromptModal(false)}
                className="flex-1 rounded-xl border border-[#e5e7eb] bg-white py-2.5 text-xs font-semibold text-[#111111]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSellerPromptModal(false);
                  router.push("/dashboard/settings");
                }}
                className="flex-1 rounded-xl bg-[#0b1e5b] py-2.5 text-xs font-semibold text-white text-center"
              >
                Go to Settings
              </button>
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
          <BottomNav href="/dashboard/notifications" icon={<BellIcon hasUnread={hasUnread} />} label="Notification" />
          <BottomNav href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" active />
        </div>
      </div>

    </main>
  );
}

/* =========================================
   COMPONENTS & SVG ICONS
========================================= */

function ProfileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-4 text-center sm:px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold capitalize text-[#111111]">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-[#111111] sm:text-base">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#6b7280]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  description,
  hint,
  error = false,
  children,
}: {
  label: string;
  description?: string;
  hint?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label className="text-xs font-bold text-[#111111]">
          {label}
        </label>
        {description && (
          <span className="text-[10px] text-[#9ca3af]">
            {description}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className={`mt-1.5 text-[11px] ${error ? "text-red-600" : "text-[#6b7280]"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fa] text-[#0b1e5b]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#111111]">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#6b7280]">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-xs font-bold text-[#111111]">{title}</p>
        <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#6b7280]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${
          checked ? "bg-[#0b1e5b]" : "bg-[#d9dde5]"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0b1e5b]/20 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[#111111]">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-[#6b7280]">
          {description}
        </p>
      </div>
      <ChevronRightIcon />
    </Link>
  );
}


function ArrowLeftIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7l-7-7 7-7" /></svg>;
}
function SuccessIcon() {
  return <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>;
}
function ErrorIcon() {
  return <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9 9l6 6m0-6l-6 6" /></svg>;
}
function CameraIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" /><circle cx="12" cy="13.5" r="3.2" /></svg>;
}
function UserIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path strokeLinecap="round" d="M5 20c.8-3.5 3.1-5.2 7-5.2s6.2 1.7 7 5.2" /></svg>;
}
function LockIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 10V7a4 4 0 018 0v3" /></svg>;
}
function ShieldCheckIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.4-2.8 7.8-7 9-4.2-1.2-7-4.6-7-9V6l7-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>;
}
function ActivityIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 13h4l2-7 4 12 2-5h4" /></svg>;
}
function MailIcon() {
  return <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 6 8-6" /></svg>;
}
function CheckIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" /></svg>;
}
function SpinnerIcon() {
  return <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" className="opacity-25" /><path strokeLinecap="round" d="M21 12a9 9 0 00-9-9" /></svg>;
}
function WarningIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.3 4.4l-7.6 13A2 2 0 004.4 20h15.2a2 2 0 001.7-2.6l-7.6-13a2 2 0 00-3.4 0z" /><path strokeLinecap="round" d="M12 9v4m0 3h.01" /></svg>;
}
function ChevronRightIcon() {
  return <svg className="h-4 w-4 shrink-0 text-[#9ca3af] transition group-hover:text-[#0b1e5b]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" /></svg>;
}

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

function DocumentIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
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
function BellIcon({ hasUnread = false }: { hasUnread?: boolean }) {
  return (
    <div className="relative">
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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