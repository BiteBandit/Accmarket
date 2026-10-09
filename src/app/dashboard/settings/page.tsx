"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileMenuDrawer,
  BottomNav,
} from "@/components/navigation";

interface UserProfile {
  id: string;
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

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialUsername, setInitialUsername] = useState("");
  const [hasUnread, setHasUnread] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [sellerPromptModal, setSellerPromptModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    let channel: any = null;
    let mounted = true;

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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          console.error("Failed to load profile:", profileError);
        }

        if (profileData && profileData.is_active === false) {
          await supabase.auth.signOut();
          router.push("/login?error=account_deactivated");
          return;
        }

        if (profileData && mounted) {
          const fetchedUsername = profileData.username || "";

          setInitialUsername(fetchedUsername);

          setProfile({
            ...profileData,
            email: profileData.email || userEmail,
            trust_score: profileData.trust_score ?? 10,
            is_active: profileData.is_active ?? true,
            email_notifications:
              profileData.email_notifications ?? true,
            push_notifications:
              profileData.push_notifications ?? true,
            telegram_notifications:
              profileData.telegram_notifications ?? false,
          });
        }

        const { count: unreadCount, error: unreadError } =
          await supabase
            .from("notifications")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (unreadError) {
          console.error(
            "Failed to load unread notifications:",
            unreadError
          );
        }

        if (mounted) {
          setHasUnread(
            unreadCount !== null && unreadCount > 0
          );
        }

        channel = supabase
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
              const updatedProfile =
                payload.new as UserProfile;

              if (updatedProfile.is_active === false) {
                await supabase.auth.signOut();
                router.push(
                  "/login?error=account_deactivated"
                );
              }

              if (mounted) {
                setProfile((previous) =>
                  previous
                    ? {
                        ...previous,
                        ...updatedProfile,
                        email:
                          updatedProfile.email ||
                          previous.email,
                      }
                    : previous
                );
              }
            }
          );

        channel.subscribe();
      } catch (error) {
        console.error(
          "Unexpected error loading settings:",
          error
        );

        if (mounted) {
          setErrorMsg(
            "Unable to load your account settings."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettingsData();

    return () => {
      mounted = false;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router, supabase]);

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please select a valid image file.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(
          "Profile pictures must be smaller than 5MB."
        );
        return;
      }

      setUploadingAvatar(true);
      setErrorMsg("");
      setSuccessMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const fileExt =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              avatar_url: publicUrl,
            }
          : null
      );

      setSuccessMsg(
        "Profile picture updated successfully."
      );
    } catch (error: any) {
      console.error("Avatar upload error:", error);

      setErrorMsg(
        error?.message ||
          "Failed to upload avatar image."
      );
    } finally {
      setUploadingAvatar(false);

      e.target.value = "";
    }
  };

  const handleUpdateProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!profile) return;

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    setUsernameError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const username =
        profile.username.trim();

      if (!username) {
        setUsernameError(
          "Username cannot be empty."
        );
        return;
      }

      if (username !== initialUsername) {
        const {
          data: existingUser,
          error: checkError,
        } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .neq("id", user.id)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingUser) {
          setUsernameError(
            "This username is already taken by another user."
          );
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          full_name:
            profile.full_name?.trim() || null,
          phone:
            profile.phone?.trim() || null,
          email_notifications:
            profile.email_notifications ?? true,
          push_notifications:
            profile.push_notifications ?? true,
          telegram_notifications:
            profile.telegram_notifications ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setInitialUsername(username);

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              username,
            }
          : null
      );

      setSuccessMsg(
        "Settings updated successfully."
      );
    } catch (error: any) {
      console.error(
        "Profile update error:",
        error
      );

      setErrorMsg(
        error?.message ||
          "Failed to update settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setSuccessMsg("");
      setErrorMsg("");

      if (!profile?.email) {
        setErrorMsg(
          "No email address is associated with this account."
        );
        return;
      }

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          profile.email,
          {
            redirectTo: `${window.location.origin}/dashboard/settings?reset=true`,
          }
        );

      if (error) {
        throw error;
      }

      setSuccessMsg(
        "Password reset link sent to your email."
      );
    } catch (error: any) {
      console.error(
        "Password reset error:",
        error
      );

      setErrorMsg(
        error?.message ||
          "Failed to send password reset email."
      );
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      router.push(
        "/login?error=account_deactivated"
      );
    } catch (error: any) {
      console.error(
        "Account deactivation error:",
        error
      );

      setErrorMsg(
        error?.message ||
          "Failed to deactivate account."
      );

      setDeactivateModal(false);
    }
  };

  const handleListAccountClick = () => {
    const role =
      profile?.role?.toLowerCase();

    if (
      role === "seller" ||
      role === "vendor" ||
      role === "admin"
    ) {
      router.push("/dashboard/sell");
    } else {
      setSellerPromptModal(true);
    }
  };

const displayName =
    profile?.username?.trim() ||
    profile?.email?.split("@")[0] ||
    "User";

  const userInitial =
    displayName.charAt(0).toUpperCase();

  const capitalize = (str: string) =>
    str
      ? str.charAt(0).toUpperCase() +
        str.slice(1)
      : "";

  const navProfile = {
    username:
      profile?.username || "User",
    email: profile?.email || "",
    avatar_url:
      profile?.avatar_url || null,
  };

  if (loading) {
    return (
      <div className="accmarket-grid min-h-screen bg-[#fdfdfc]">
        <DesktopSidebar
          profile={navProfile}
          hasUnread={hasUnread}
          onSignOut={handleSignOut}
          onListAccountClick={handleListAccountClick}
        />

        <MobileHeader
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="min-h-screen p-4 lg:pl-[260px] lg:p-0">
          <DesktopHeader
            profile={navProfile}
            hasUnread={hasUnread}
            sectionLabel="Account"
            pageTitle="Settings"
          />

          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10 animate-pulse space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded-lg bg-[#e5e7eb]" />
                <div className="h-9 w-52 rounded-xl bg-[#e5e7eb]" />
                <div className="h-4 w-80 max-w-full rounded-lg bg-[#e5e7eb]" />
              </div>

              <div className="h-16 w-52 rounded-2xl bg-[#e5e7eb]" />
            </div>

            <div className="h-52 w-full rounded-[28px] bg-[#e5e7eb]" />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-80 rounded-[28px] bg-[#e5e7eb]" />
              <div className="h-80 rounded-[28px] bg-[#e5e7eb]" />
            </div>

            <div className="h-72 rounded-[28px] bg-[#e5e7eb]" />
          </div>
        </main>

        <BottomNav hasUnread={hasUnread} />
      </div>
    );
  }


  return (
    <div className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      {/* Mobile Header */}
      <MobileHeader
        setMobileMenuOpen={
          setMobileMenuOpen
        }
      />

      {/* Mobile Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      <div className="lg:pl-[260px]">
        {/* Desktop Header */}
        <DesktopHeader
          profile={navProfile}
          hasUnread={hasUnread}
          pageTitle="Settings"
          sectionLabel="Account"
        />

        <main className="pb-24 lg:pb-10">
          <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:py-10">
            {/* Page heading */}
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Link
                  href="/dashboard"
                  className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-[#6b7280] transition hover:text-[#0b1e5b]"
                >
                  <ArrowLeftIcon />
                  Back to dashboard
                </Link>

                <h1 className="text-2xl font-black tracking-tight text-[#0b1e5b] sm:text-3xl">
                  Settings
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b7280]">
                  Manage your AccMarket profile,
                  security, notifications and
                  account preferences.
                </p>
              </div>

              {/* User identity */}
              <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile avatar"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#f1f3f5]"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1e5b] text-sm font-bold text-white">
                    {userInitial}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="max-w-[160px] truncate text-sm font-bold text-[#111111]">
                    {displayName}
                  </p>

                  <p className="mt-0.5 text-[11px] capitalize text-[#6b7280]">
                    {profile?.role || "buyer"}{" "}
                    account
                  </p>
                </div>
              </div>
            </div>

            {/* Success */}
            {successMsg && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 shadow-sm">
                <SuccessIcon />

                <span className="font-medium">
                  {successMsg}
                </span>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800 shadow-sm">
                <ErrorIcon />

                <span className="font-medium">
                  {errorMsg}
                </span>
              </div>
            )}

            <form
              onSubmit={handleUpdateProfile}
            >
      {/* Profile card */}
<section className="overflow-hidden rounded-[30px] border border-[#e5e7eb] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
  <div className="relative overflow-hidden bg-[#0b1e5b] px-5 py-7 text-white sm:px-7 sm:py-8">
    <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="h-[72px] w-[72px] rounded-2xl border-2 border-white/20 object-cover shadow-xl"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white text-xl font-black text-[#0b1e5b] shadow-xl">
              {userInitial}
            </div>
          )}

          <label
            className={`absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#0b1e5b] bg-white text-[#0b1e5b] shadow-md transition ${
              uploadingAvatar
                ? "cursor-wait opacity-60"
                : "hover:scale-105"
            }`}
            aria-label="Change profile picture"
          >
            {uploadingAvatar ? (
              <SpinnerIcon />
            ) : (
              <CameraIcon />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploadingAvatar}
            />
          </label>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-white/60">
            Your profile
          </p>

          <h2 className="mt-1 truncate text-xl font-bold">
            {displayName}
          </h2>

          <p className="mt-1 max-w-[250px] truncate text-xs text-white/60">
            {profile?.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-3 py-2 sm:self-center">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]" />

        <span className="text-xs font-semibold text-white">
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

{/* Seller upgrade */}
{profile?.role?.toLowerCase() === "buyer" && (
  <section className="group relative mt-6 overflow-hidden rounded-[28px] border border-[#d9e1ef] bg-[#0b1e5b] shadow-[0_12px_40px_rgba(11,30,91,0.12)]">
    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.055] blur-2xl" />
    <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/[0.035] blur-3xl" />

    <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-inner">
          <ShieldCheckIcon />
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white sm:text-base">
              Unlock seller access
            </h3>

            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
              Verification required
            </span>
          </div>

          <p className="max-w-xl text-xs leading-5 text-white/65">
            Verify your account to list digital assets,
            access protected escrow transactions, and
            build buyer trust on AccMarket.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/75">
              <CheckIcon />
              Secure escrow
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/75">
              <CheckIcon />
              Seller profile
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/75">
              <CheckIcon />
              Account listings
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/settings/upgrade-to-seller"
        className="group/button inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-bold text-[#0b1e5b] shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f8fafc] hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)] active:translate-y-0 sm:w-auto"
      >
        Start verification

        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0b1e5b]/[0.07] transition-transform duration-200 group-hover/button:translate-x-0.5">
          <ChevronRightIcon />
        </span>
      </Link>
    </div>
  </section>
)}

{/* Personal information */}
<section className="mt-6 rounded-[28px] border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_28px_rgba(15,23,42,0.035)] sm:p-7">
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
          setProfile(
            profile
              ? {
                  ...profile,
                  username: e.target.value,
                }
              : null
          );

          setUsernameError("");
        }}
        required
        className={`h-11 w-full rounded-xl border ${
          usernameError
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/5"
            : "border-[#e5e7eb] focus:border-[#0b1e5b] focus:ring-[#0b1e5b]/5"
        } bg-[#f9fafb] px-3.5 text-xs text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:bg-white focus:ring-4`}
        placeholder="Your username"
      />
    </Field>

    <Field label="Full name">
      <input
        type="text"
        value={profile?.full_name || ""}
        onChange={(e) =>
          setProfile(
            profile
              ? {
                  ...profile,
                  full_name: e.target.value,
                }
              : null
          )
        }
        className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3.5 text-xs text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/5"
        placeholder="e.g. Kelvin Chukwunonso"
      />
    </Field>

    <Field
      label="Email address"
      description="Your login email cannot be edited here."
    >
      <div className="relative">
        <MailIcon />

        <input
          type="email"
          disabled
          value={profile?.email || ""}
          className="h-11 w-full cursor-not-allowed rounded-xl border border-[#e5e7eb] bg-[#f7f8fa] px-3.5 pl-10 text-xs text-[#9ca3af] outline-none"
        />
      </div>
    </Field>

    <Field
      label="Phone number"
      description="Optional"
    >
      <input
        type="text"
        value={profile?.phone || ""}
        onChange={(e) =>
          setProfile(
            profile
              ? {
                  ...profile,
                  phone: e.target.value,
                }
              : null
          )
        }
        className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3.5 text-xs text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/5"
        placeholder="+234..."
      />
    </Field>
  </div>
</section>

{/* Security */}
<section className="mt-6 rounded-[28px] border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_28px_rgba(15,23,42,0.035)] sm:p-7">
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
          className="rounded-xl border border-[#dfe3ea] bg-white px-4 py-2.5 text-xs font-bold text-[#0b1e5b] transition hover:border-[#0b1e5b] hover:bg-[#f8f9fc] active:scale-[0.98]"
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

{/* Notifications */}
<section className="mt-6 rounded-[28px] border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_28px_rgba(15,23,42,0.035)] sm:p-7">
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
        setProfile(
          profile
            ? {
                ...profile,
                push_notifications: checked,
              }
            : null
        )
      }
    />

    <ToggleRow
      title="Email notifications"
      description="Updates about purchases, sales and account activity."
      checked={profile?.email_notifications ?? true}
      onChange={(checked) =>
        setProfile(
          profile
            ? {
                ...profile,
                email_notifications: checked,
              }
            : null
        )
      }
    />

    <ToggleRow
      title="Telegram notifications"
      description="Receive selected order and chat updates through Telegram."
      checked={profile?.telegram_notifications ?? false}
      onChange={(checked) =>
        setProfile(
          profile
            ? {
                ...profile,
                telegram_notifications: checked,
              }
            : null
        )
      }
    />

    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fa] text-[#0b1e5b]">
          <TelegramIcon />
        </div>

        <div>
          <p className="text-xs font-bold text-[#111111]">
            Telegram account linking
          </p>

          <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#6b7280]">
            {profile?.telegram_chat_id
              ? "Your Telegram account is successfully connected."
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
            href={`https://t.me/Accnumbers_bot?start=${
              profile?.id || "user"
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1d8abf] active:scale-[0.98]"
          >
            <TelegramIcon />
            Link Telegram
          </a>
        )}
      </div>
    </div>
  </div>
</section>

{/* Quick settings */}
<section className="mt-8">
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

{/* Save bar */}
<div className="sticky bottom-16 z-20 mt-7 flex items-center justify-between gap-4 rounded-2xl border border-[#dfe3ea] bg-white/95 p-3 shadow-[0_8px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:bottom-4">
  <p className="hidden pl-2 text-xs text-[#6b7280] sm:block">
    Save your profile and notification changes.
  </p>

  <button
    type="submit"
    disabled={saving}
    className="ml-auto flex min-w-[155px] items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#162d78] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

{/* Danger zone */}
<section className="mt-8 overflow-hidden rounded-[28px] border border-red-200 bg-white">
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
      className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
    >
      Deactivate account
    </button>
  </div>
</section>
</div>
</main>
</div>

{/* Mobile Bottom Navigation */}
<BottomNav hasUnread={hasUnread} />

{/* Deactivate Account Modal */}
{deactivateModal && (
  <div
    className="fixed inset-0 z-[70] flex items-end justify-center bg-[#020617]/55 p-0 backdrop-blur-[6px] sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="deactivate-title"
    onClick={() => setDeactivateModal(false)}
  >
    <div
      className="relative w-full max-w-[480px] overflow-hidden rounded-t-[30px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:rounded-[30px]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />

      <button
        type="button"
        onClick={() => setDeactivateModal(false)}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#9ca3af] shadow-sm transition hover:bg-[#f8fafc] hover:text-[#111111]"
        aria-label="Close dialog"
      >
        <XIcon />
      </button>

      <div className="relative p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-600 ring-8 ring-red-50/50">
          <WarningIcon />
        </div>

        <h3
          id="deactivate-title"
          className="mt-5 text-xl font-black tracking-tight text-[#111111]"
        >
          Deactivate your account?
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#6b7280]">
          Your account will be marked inactive and you will be logged out
          immediately. Your public profile and listings will be hidden until
          your account is reactivated.
        </p>

        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-left">
          <div className="flex items-start gap-3">
            <WarningIcon />

            <div>
              <p className="text-xs font-bold text-red-700">
                Before you continue
              </p>

              <p className="mt-1 text-[11px] leading-5 text-red-600/80">
                Make sure you have completed any pending transactions before
                deactivating your account.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeactivateModal(false)}
            className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3.5 text-xs font-bold text-[#374151] transition hover:bg-[#f8fafc] active:scale-[0.98]"
          >
            Keep account
          </button>

          <button
            type="button"
            onClick={handleDeactivateAccount}
            className="rounded-2xl bg-red-600 px-4 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
          >
            Deactivate
          </button>
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)] bg-white sm:hidden" />
    </div>
  </div>
)}

{/* Seller Access Bottom Sheet / Desktop Dialog */}
{sellerPromptModal && (
  <div
    className="fixed inset-0 z-[70] flex items-end justify-center bg-[#020617]/55 p-0 backdrop-blur-[6px] sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="seller-access-title"
    onClick={() => setSellerPromptModal(false)}
  >
    <div
      className="relative w-full max-w-[520px] overflow-hidden rounded-t-[30px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:rounded-[30px]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[#0b1e5b]" />

      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#0b1e5b]/[0.035] blur-2xl" />

      <div className="pointer-events-none absolute -left-24 top-40 h-48 w-48 rounded-full bg-[#0b1e5b]/[0.025] blur-2xl" />

      <button
        type="button"
        onClick={() => setSellerPromptModal(false)}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#9ca3af] shadow-sm transition-all duration-200 hover:border-[#d1d5db] hover:bg-[#f8fafc] hover:text-[#111111] active:scale-95"
        aria-label="Close seller access dialog"
      >
        <XIcon />
      </button>

      <div className="relative px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
        <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-[#d7e1ef] bg-[#f1f5fb] text-[#0b1e5b] shadow-[0_8px_25px_rgba(11,30,91,0.08)]">
          <ShieldCheckIcon />
        </div>

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
            . Complete seller verification to start listing accounts and using
            AccMarket escrow.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b1e5b] shadow-sm ring-1 ring-[#e5e7eb]">
              <ShieldCheckIcon />
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
              <CheckCircleIcon />

              <span className="text-[9px] font-bold text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
            What you unlock
          </p>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <BenefitCard
              icon={<ShieldCheckIcon />}
              title="Secure escrow"
              description="Trade through protected escrow."
            />

            <BenefitCard
              icon={<ArrowRightIcon />}
              title="List accounts"
              description="Create listings for buyers."
            />

            <BenefitCard
              icon={<CheckCircleIcon />}
              title="Seller profile"
              description="Build buyer trust."
            />
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard/settings/upgrade-to-seller"
            onClick={() => setSellerPromptModal(false)}
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0b1e5b] px-5 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(11,30,91,0.18)] transition-all duration-200 hover:bg-[#09184a] hover:shadow-[0_14px_30px_rgba(11,30,91,0.24)] active:scale-[0.99]"
          >
            Start seller verification

            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRightIcon />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSellerPromptModal(false)}
            className="mt-2.5 w-full rounded-2xl px-5 py-3 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f8fafc] hover:text-[#111111]"
          >
            Maybe later
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center">
          <ShieldCheckIcon />

          <span className="text-[9px] font-medium text-[#9ca3af]">
            Verification helps keep the AccMarket marketplace trusted.
          </span>
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)] bg-white sm:hidden" />
    </div>
  </div>
)}


    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper Components & Icons                                                  */
/* -------------------------------------------------------------------------- */

function ProfileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-4 text-center transition-colors hover:bg-[#fafbfc] sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </p>

      <p className="mt-1.5 truncate text-sm font-bold text-[#111111] sm:text-base">
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
    <div className="flex items-center gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[#111111] sm:text-base">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-[#6b7280]">
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
  error,
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
      <label className="block text-xs font-bold text-[#111111]">
        {label}
      </label>

      {description && (
        <p className="mt-0.5 text-[11px] text-[#6b7280]">
          {description}
        </p>
      )}

      <div className="mt-2">
        {children}
      </div>

      {hint && (
        <p
          className={`mt-1 text-[11px] font-medium ${
            error ? "text-red-600" : "text-[#6b7280]"
          }`}
        >
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
          <p className="text-xs font-bold text-[#111111]">
            {title}
          </p>

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
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#111111]">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#6b7280]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${title}`}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-all duration-200 ${
          checked ? "bg-[#0b1e5b]" : "bg-[#d9dde5]"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-[#9ca3af] transition-colors group-hover:text-[#0b1e5b]"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-emerald-600"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-red-600"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      polyline points="9 12 11 14 15 10"
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-emerald-600"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9ca3af]"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function BellIcon({ hasUnread }: { hasUnread?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-red-600"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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
      className="group flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0b1e5b]/20 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] active:translate-y-0"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[#111111]">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[#6b7280]">
          {description}
        </p>
      </div>

      <ChevronRightIcon />
    </Link>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 transition hover:border-[#d6dce6] hover:shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f1f5fb] text-[#0b1e5b]">
        {icon}
      </div>

      <p className="mt-2.5 text-[11px] font-bold text-[#111111]">
        {title}
      </p>

      <p className="mt-1 text-[9px] leading-relaxed text-[#9ca3af]">
        {description}
      </p>
    </div>
  );
}