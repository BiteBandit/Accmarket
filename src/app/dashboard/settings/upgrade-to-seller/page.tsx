"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

// Import your shared navigation components
import {
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileMenuDrawer,
  BottomNav,
} from "@/components/navigation";

interface UserProfile {
  id: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  avatar_url?: string | null;
}

interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  escrow_balance: number;
}

type VerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "failed"
  | "rejected"
  | "expired";

function UpgradeSkeleton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleListAccountClick = () => {
    router.push("/dashboard/listings/new");
  };

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      {/* Real Desktop Sidebar */}
      <DesktopSidebar
        profile={null}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
        hasUnread={false}
      />

      {/* Real Mobile Header */}
      <MobileHeader setMobileMenuOpen={() => {}} />

      <div className="lg:ml-[260px]">
        {/* Real Desktop Header */}
        <header className="hidden h-[76px] items-center justify-between border-b border-[#e8eaf0] bg-white px-8 lg:flex">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Account
            </p>
            <h2 className="mt-1 text-[14px] font-bold text-[#111111]">
              Seller Verification
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#5f6673]">
              <BellIcon />
            </div>

            <div className="h-7 w-px bg-[#e5e7eb]" />

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
              <div className="space-y-1">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-2 w-12 animate-pulse rounded bg-gray-200" />
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        {/* Detailed Main Content Skeleton */}
        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8 animate-pulse">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-3 w-3 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>

          {/* Top Banner Skeleton */}
          <section className="relative mb-6 overflow-hidden rounded-[28px] bg-gray-200 px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 h-52">
            <div className="max-w-[780px] space-y-4">
              <div className="h-6 w-32 rounded-full bg-gray-300" />
              <div className="h-10 w-3/4 rounded-lg bg-gray-300" />
              <div className="h-5 w-2/3 rounded-lg bg-gray-300" />
            </div>
          </section>

          {/* Status Bar Skeleton */}
          <section className="mb-6 rounded-[28px] border border-[#e7e9ee] bg-white p-5 sm:p-6 lg:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-5 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-64 rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-9 w-28 rounded-full bg-gray-200" />
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-6">
              {/* Why Verify Section Skeleton */}
              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-5 sm:p-7 space-y-6">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-6 w-48 rounded bg-gray-200" />
                  <div className="h-4 w-full max-w-xl rounded bg-gray-200" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-28 rounded-2xl bg-gray-100" />
                  <div className="h-28 rounded-2xl bg-gray-100" />
                  <div className="h-28 rounded-2xl bg-gray-100" />
                  <div className="h-28 rounded-2xl bg-gray-100" />
                </div>
              </section>

              {/* Process Steps Skeleton */}
              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-5 sm:p-7 space-y-6">
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-6 w-44 rounded bg-gray-200" />
                </div>
                <div className="space-y-6">
                  <div className="h-16 rounded-xl bg-gray-100" />
                  <div className="h-16 rounded-xl bg-gray-100" />
                  <div className="h-16 rounded-xl bg-gray-100" />
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              {/* Action Card Skeleton */}
              <section className="overflow-hidden rounded-[28px] border border-[#e2e6ee] bg-white shadow-sm">
                <div className="bg-gray-200 px-6 py-7 sm:px-7 h-48" />
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="h-16 rounded-2xl bg-gray-100" />
                  <div className="h-[52px] rounded-2xl bg-gray-200" />
                  <div className="h-4 w-3/4 mx-auto rounded bg-gray-100" />
                </div>
              </section>

              {/* Security Points Skeleton */}
              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-200" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="h-4 rounded bg-gray-100" />
                  <div className="h-4 rounded bg-gray-100" />
                  <div className="h-4 rounded bg-gray-100" />
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {/* Real Bottom Mobile Navigation */}
      <BottomNav hasUnread={false} />
    </main>
  );
}

export default function UpgradeToSellerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Modal drawer state
  const [sellerPromptDrawer, setSellerPromptDrawer] = useState(false);

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const [verificationFee, setVerificationFee] = useState(3000);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("not_started");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const clearMessages = () => {
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleListAccountClick = () => {
    if (
      profile?.role === "seller" ||
      profile?.role === "vendor" ||
      profile?.role === "admin"
    ) {
      router.push("/dashboard/listings/new");
      return;
    }

    // Trigger the modal drawer instead of blocking directly
    setSellerPromptDrawer(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, email, role, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error("Unable to load your profile.");
      }

      if (
        profileData?.role === "seller" ||
        profileData?.role === "vendor" ||
        profileData?.role === "admin"
      ) {
        router.replace("/dashboard/settings");
        return;
      }

      setProfile(profileData);

      const { data: walletData } = await supabase
        .from("wallets")
        .select("id, user_id, available_balance, escrow_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setWallet(walletData);

      const { data: feeSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "seller_verification_fee")
        .maybeSingle();

      if (feeSetting?.value !== undefined && feeSetting?.value !== null) {
        const parsedFee = Number(feeSetting.value);

        if (Number.isFinite(parsedFee) && parsedFee >= 0) {
          setVerificationFee(parsedFee);
        }
      }

      const { data: verification } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (verification?.status) {
        const status = String(
          verification.status
        ).toLowerCase() as VerificationStatus;

        if (
          [
            "pending",
            "approved",
            "failed",
            "rejected",
            "expired",
          ].includes(status)
        ) {
          setVerificationStatus(status);
        }
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setHasUnread((count ?? 0) > 0);
    } catch (error) {
      console.error("Load seller verification data:", error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading the page."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await loadData();
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

    const handleRequestVerification = async () => {
    clearMessages();

    if (!profile) {
      setErrorMsg("Your profile could not be loaded. Please refresh the page.");
      return;
    }

    if (requesting) return;

    if (verificationStatus === "approved") {
      setSuccessMsg("Your seller account is already verified.");
      setTimeout(() => router.push("/dashboard/settings"), 900);
      return;
    }

    // Helper function with a 30s timeout controller to prevent hanging forever
    const callVerifyApi = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch("/api/didit/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to process verification service."
          );
        }

        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("The verification request timed out. Please try again.");
        }
        throw error;
      }
    };

    if (verificationStatus === "pending") {
      setRequesting(true);

      try {
        const data = await callVerifyApi();

        if (data?.url) {
          window.location.href = data.url;
          return;
        }

        throw new Error("Verification link was not returned.");
      } catch (error) {
        setErrorMsg(
          error instanceof Error
            ? error.message
            : "Unable to continue verification."
        );
      } finally {
        setRequesting(false);
      }

      return;
    }

    if (
      verificationStatus === "failed" ||
      verificationStatus === "rejected" ||
      verificationStatus === "expired"
    ) {
      setRequesting(true);

      try {
        const { error: resetError } = await supabase
          .from("user_verifications")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.id);

        if (resetError) {
          throw resetError;
        }

        const data = await callVerifyApi();

        if (data?.url) {
          window.location.href = data.url;
          return;
        }

        throw new Error("Verification link was not returned.");
      } catch (error) {
        setErrorMsg(
          error instanceof Error
            ? error.message
            : "Unable to restart verification."
        );
      } finally {
        setRequesting(false);
      }

      return;
    }

    if (!wallet) {
      setErrorMsg(
        "Your wallet could not be found. Please fund your wallet and try again."
      );
      return;
    }

    if (Number(wallet.available_balance) < verificationFee) {
      setErrorMsg(
        `You need ₦${verificationFee.toLocaleString()} available balance to start seller verification.`
      );
      return;
    }

    setRequesting(true);

    try {
      const { error: rpcError } = await supabase.rpc(
        "start_seller_verification",
        {
          p_fee: verificationFee,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      const newBalance = Number(wallet.available_balance) - Number(verificationFee);

      setWallet({
        ...wallet,
        available_balance: newBalance,
      });

      setVerificationStatus("pending");

      const data = await callVerifyApi();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setSuccessMsg(
        "Your verification request has been created. Please continue with identity verification."
      );
    } catch (error: any) {
      console.error("Seller verification diagnostics:", error);
      setErrorMsg(
        error?.message || 
        (typeof error === "string" ? error : "Something went wrong while starting verification.")
      );
    } finally {
      setRequesting(false);
    }
  };

  const getStatus = () => {
    switch (verificationStatus) {
      case "approved":
        return {
          label: "Verified",
          description: "Your identity has been successfully verified.",
          className: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: <CheckCircleIcon />,
        };

      case "pending":
        return {
          label: "Verification pending",
          description:
            "Your verification is in progress. Continue if you haven't completed it.",
          className: "bg-amber-50 text-amber-700 border-amber-100",
          icon: <ClockIcon />,
        };

      case "failed":
      case "rejected":
        return {
          label: "Verification unsuccessful",
          description:
            "Your previous verification attempt was unsuccessful. You can try again.",
          className: "bg-red-50 text-red-700 border-red-100",
          icon: <AlertCircleIcon />,
        };

      case "expired":
        return {
          label: "Verification expired",
          description:
            "Your previous verification session expired. Start a new attempt.",
          className: "bg-orange-50 text-orange-700 border-orange-100",
          icon: <ClockIcon />,
        };

      default:
        return {
          label: "Not verified",
          description:
            "Complete identity verification to unlock seller functionality.",
          className: "bg-blue-50 text-[#0b1e5b] border-blue-100",
          icon: <ShieldIcon />,
        };
    }
  };

  const getButtonText = () => {
    if (requesting) return "Processing...";
    if (verificationStatus === "approved") return "Already Verified";
    if (verificationStatus === "pending") return "Continue Verification";
    if (
      verificationStatus === "failed" ||
      verificationStatus === "rejected" ||
      verificationStatus === "expired"
    ) {
      return "Retry Verification";
    }
    return "Start Verification";
  };

  if (loading) {
    return <UpgradeSkeleton />;
  }

  const status = getStatus();

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      {/* Shared Desktop Sidebar */}
      <DesktopSidebar
  profile={profile}
  onSignOut={handleSignOut}
  onListAccountClick={handleListAccountClick}
  hasUnread={hasUnread}
/>


      {/* Shared Mobile Header */}
      <MobileHeader setMobileMenuOpen={setMobileMenuOpen} />


      {/* Shared Mobile Menu Drawer */}
      <MobileMenuDrawer
  isOpen={mobileMenuOpen}
  setIsOpen={setMobileMenuOpen}
  profile={profile}
  hasUnread={hasUnread}
  onSignOut={handleSignOut}
  onListAccountClick={handleListAccountClick}
/>
      

      <div className="lg:ml-[260px]">
        {/* Desktop Top Header */}
        <header className="hidden h-[76px] items-center justify-between border-b border-[#e8eaf0] bg-white px-8 lg:flex">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Account
            </p>

            <h2 className="mt-1 text-[14px] font-bold text-[#111111]">
              Seller Verification
            </h2>
          </div>

            <div className="flex items-center gap-4">
            <Link
              href="/dashboard/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#5f6673] transition hover:border-[#d8dce4] hover:bg-[#f8f9fc]"
              aria-label="Notifications"
            >
              <BellIcon />

              {hasUnread && (
                <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>

            <div className="h-7 w-px bg-[#e5e7eb]" />

            <div className="flex items-center gap-3">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.username || profile?.email || "User"}
                size="sm"
              />

              <div className="min-w-0">
                <p className="max-w-[140px] truncate text-[12px] font-bold text-[#111111]">
                  {profile?.username || "User"}
                </p>

                <p className="text-[10px] text-[#9ca3af]">
                  Buyer account
                </p>
              </div>

              <ChevronDownIcon />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mb-6 flex items-center gap-2 text-[12px] font-medium">
            <Link
              href="/dashboard"
              className="text-[#9ca3af] transition hover:text-[#0b1e5b]"
            >
              Dashboard
            </Link>

            <ChevronIcon />

            <span className="font-semibold text-[#0b1e5b]">
              Seller Verification
            </span>
          </div>

          <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[#0b1e5b] px-5 py-7 text-white shadow-[0_18px_50px_rgba(11,30,91,0.12)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -right-20 -top-32 h-[340px] w-[340px] rounded-full bg-white/[0.055] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-40 right-[25%] h-[300px] w-[300px] rounded-full bg-white/[0.035] blur-3xl" />
            <div className="pointer-events-none absolute right-12 top-12 hidden h-20 w-20 rounded-full border border-white/[0.08] lg:block" />

            <div className="relative max-w-[780px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-white/80">
                <ShieldIcon size={15} />
                Seller Program
              </div>

              <h1 className="text-[29px] font-black leading-[1.08] tracking-[-0.045em] sm:text-[37px] lg:text-[44px]">
                Become a verified
                <br className="hidden sm:block" />
                AccMarket seller.
              </h1>

              <p className="mt-4 max-w-[680px] text-[13px] leading-6 text-white/65 sm:text-[15px]">
                Verify your identity to unlock seller functionality and start
                listing accounts securely on AccMarket.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[10px] font-semibold text-white/75">
                  <CheckIcon />
                  Identity verification
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[10px] font-semibold text-white/75">
                  <LockIcon />
                  Secure process
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[10px] font-semibold text-white/75">
                  <BadgeIcon />
                  Seller access
                </div>
              </div>
            </div>
          </section>

          {successMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
              <div className="mt-0.5 shrink-0">
                <CheckCircleIcon />
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-bold">Success</p>

                <p className="mt-0.5 text-[12px] leading-5">
                  {successMsg}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
              <div className="mt-0.5 shrink-0">
                <AlertCircleIcon />
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-bold">
                  Verification could not continue
                </p>

                <p className="mt-0.5 text-[12px] leading-5">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}

          <section className="mb-6 rounded-[28px] border border-[#e7e9ee] bg-white p-5 shadow-[0_8px_30px_rgba(17,24,39,0.035)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#0b1e5b]">
                  <ShieldIcon size={26} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                    Current status
                  </p>

                  <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.025em] text-[#111111]">
                    {status.label}
                  </h2>

                  <p className="mt-1 max-w-[680px] text-[12px] leading-5 text-[#7b8492]">
                    {status.description}
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-bold ${status.className}`}
              >
                {status.icon}
                {status.label}
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-5 shadow-[0_8px_30px_rgba(17,24,39,0.035)] sm:p-7">
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                    Why verify?
                  </p>

                  <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.035em] text-[#111111]">
                    Build trust with buyers
                  </h2>

                  <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-[#7b8492]">
                    Seller verification helps establish that your account is
                    operated by a real person and allows AccMarket to provide
                    seller-specific functionality.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <BenefitCard
                    icon={<BadgeIcon />}
                    title="Verified seller profile"
                    description="Show buyers that your identity has been successfully verified."
                  />

                  <BenefitCard
                    icon={<StoreIcon />}
                    title="Seller functionality"
                    description="Access the tools needed to list and manage accounts."
                  />

                  <BenefitCard
                    icon={<UsersIcon />}
                    title="Buyer confidence"
                    description="Give buyers an additional trust signal when dealing with your listings."
                  />

                  <BenefitCard
                    icon={<ShieldIcon />}
                    title="Safer marketplace"
                    description="Help keep the AccMarket marketplace secure for buyers and sellers."
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-5 shadow-[0_8px_30px_rgba(17,24,39,0.035)] sm:p-7">
                <div className="mb-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                    Simple process
                  </p>

                  <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.035em] text-[#111111]">
                    How verification works
                  </h2>
                </div>

                <div>
                  <ProcessStep
                    number="01"
                    title="Start verification"
                    description="Click the verification button and begin your seller verification request."
                    icon={<ArrowRightIcon />}
                    active={verificationStatus === "not_started"}
                  />

                  <ProcessStep
                    number="02"
                    title="Verify your identity"
                    description="Complete the secure identity verification process using the verification provider."
                    icon={<IdCardIcon />}
                    active={verificationStatus === "pending"}
                  />

                  <ProcessStep
                    number="03"
                    title="Start selling"
                    description="After your identity is approved, seller functionality becomes available on your account."
                    icon={<StoreIcon />}
                    active={verificationStatus === "approved"}
                    last
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-5 shadow-[0_8px_30px_rgba(17,24,39,0.035)] sm:p-7">
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                    Before you begin
                  </p>

                  <h2 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.03em] text-[#111111]">
                    What you&apos;ll need
                  </h2>
                </div>

                <div className="space-y-3">
                  <Requirement
                    title="A valid identity document"
                    description="Use an accepted government-issued identity document for verification."
                  />

                  <Requirement
                    title="Matching personal information"
                    description="Make sure your account details match the information on your identity document."
                  />

                  <Requirement
                    title="A device with a camera"
                    description="Your device may need camera access to complete identity verification."
                  />

                  <Requirement
                    title="A few minutes"
                    description="For the smoothest experience, complete your verification in one session."
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="overflow-hidden rounded-[28px] border border-[#e2e6ee] bg-white shadow-[0_12px_40px_rgba(11,30,91,0.07)]">
                <div className="relative overflow-hidden bg-[#0b1e5b] px-6 py-7 text-white sm:px-7">
                  <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/[0.06]" />

                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <ShieldIcon size={24} />
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                      Seller verification
                    </p>

                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.035em]">
                      {verificationStatus === "approved"
                        ? "You're verified"
                        : "Ready to get verified?"}
                    </h2>

                    <p className="mt-2 text-[13px] leading-5 text-white/60">
                      {verificationStatus === "approved"
                        ? "Your identity verification has been completed successfully."
                        : "Complete identity verification to unlock seller functionality."}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  {verificationStatus !== "approved" && (
                    <div className="mb-5 rounded-2xl border border-[#edf0f4] bg-[#f8f9fc] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold text-[#8b93a1]">
                            Verification fee
                          </p>

                          <p className="mt-1 text-[27px] font-black tracking-[-0.045em] text-[#111111]">
                            ₦{verificationFee.toLocaleString()}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#6b7280] shadow-sm">
                          One-time
                        </span>
                      </div>
                    </div>
                  )}

                  {verificationStatus === "approved" ? (
                    <Link
                      href="/dashboard/settings"
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1e5b] px-5 text-[13px] font-bold text-white transition hover:bg-[#081744]"
                    >
                      Go to Account
                      <ArrowRightIcon />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestVerification}
                      disabled={requesting}
                      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1e5b] px-5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(11,30,91,0.18)] transition hover:bg-[#081744] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requesting && <Spinner />}

                      {getButtonText()}

                      {!requesting && <ArrowRightIcon />}
                    </button>
                  )}

                  <div className="mt-4 flex items-start gap-2.5 text-[10px] leading-4 text-[#8b93a1]">
                    <div className="mt-0.5 shrink-0 text-[#6b7280]">
                      <LockIcon />
                    </div>

                    <p>
                      Your identity information is handled securely during
                      the verification process.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#e7e9ee] bg-white p-6 shadow-[0_8px_30px_rgba(17,24,39,0.035)]">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <LockIcon />
                  </div>

                  <div>
                    <h3 className="text-[14px] font-extrabold text-[#111111]">
                      Secure verification
                    </h3>

                    <p className="mt-0.5 text-[11px] text-[#8b93a1]">
                      Your information is protected
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <SecurityPoint text="Secure identity verification flow" />
                  <SecurityPoint text="Encrypted data transmission" />
                  <SecurityPoint text="Verification handled by a trusted provider" />
                </div>
              </section>

              <section className="rounded-[28px] bg-[#eef2fa] p-6">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b1e5b]">
                    <SupportIcon />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[14px] font-extrabold text-[#111111]">
                      Need help?
                    </h3>

                    <p className="mt-1 text-[12px] leading-5 text-[#6b7280]">
                      Having trouble with seller verification? Our support
                      team can help.
                    </p>

                    <Link
                      href="/dashboard/support"
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0b1e5b] transition hover:gap-2.5"
                    >
                      Contact support
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {/* Shared Bottom Mobile Navigation */}
      <BottomNav hasUnread={hasUnread} />

      {/* Seller Upgrade Modal Component */}
      {sellerPromptDrawer && (
        <SellerUpgradeModal
          profile={profile}
          onClose={() => setSellerPromptDrawer(false)}
          onStartVerification={() => {
            setSellerPromptDrawer(false);
            router.push("/dashboard/settings/upgrade-to-seller");
          }}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Seller Upgrade Modal Drawer                                                */
/* -------------------------------------------------------------------------- */

function SellerUpgradeModal({
  profile,
  onClose,
  onStartVerification,
}: {
  profile: UserProfile | null;
  onClose: () => void;
  onStartVerification: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#020617]/55 p-0 backdrop-blur-[6px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-access-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded-t-[30px] border border-white/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[30px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0b1e5b]" />

        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0b1e5b]/[0.035]" />
        <div className="pointer-events-none absolute -left-24 top-32 h-44 w-44 rounded-full bg-[#0b1e5b]/[0.025]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#9ca3af] shadow-sm transition-all duration-200 hover:border-[#d1d5db] hover:bg-[#f8fafc] hover:text-[#111111] active:scale-95"
          aria-label="Close seller access dialog"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
          <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-[#d7e1ef] bg-[#f1f5fb] text-[#0b1e5b] shadow-[0_8px_25px_rgba(11,30,91,0.08)]">
            <ShieldCheckIcon className="h-8 w-8" />
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
              . Complete seller verification to start listing accounts
              and using AccMarket escrow.
            </p>
          </div>

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

          <div className="mt-6">
            <button
              type="button"
              onClick={onStartVerification}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0b1e5b] px-5 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(11,30,91,0.18)] transition-all duration-200 hover:bg-[#09184a] hover:shadow-[0_14px_30px_rgba(11,30,91,0.24)] active:scale-[0.99]"
            >
              Start seller verification

              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-2.5 w-full rounded-2xl px-5 py-3 text-xs font-semibold text-[#6b7280] transition hover:bg-[#f8fafc] hover:text-[#111111]"
            >
              Maybe later
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-center">
            <ShieldCheckIcon className="h-3 w-3 text-[#9ca3af]" />
            <span className="text-[9px] font-medium text-[#9ca3af]">
              Verification helps keep the AccMarket marketplace trusted.
            </span>
          </div>
        </div>

        <div className="h-[env(safe-area-inset-bottom)] bg-white sm:hidden" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* UI Components & Sub-Elements                                               */
/* -------------------------------------------------------------------------- */

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const dimensions =
    size === "sm" ? "h-9 w-9 text-[11px]" : "h-11 w-11 text-[13px]";

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-[#eef2ff] ${dimensions}`}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={size === "sm" ? "36px" : "44px"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#0b1e5b] font-bold text-white ${dimensions}`}
    >
      {initials || "U"}
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf0f4] bg-[#fbfcfd] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#dce2ed] hover:bg-white hover:shadow-[0_8px_25px_rgba(17,24,39,0.04)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#0b1e5b]">
        {icon}
      </div>

      <h3 className="text-[13px] font-bold text-[#111111]">{title}</h3>

      <p className="mt-1.5 text-[11px] leading-5 text-[#7b8492]">
        {description}
      </p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
  icon,
  active,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div className="absolute left-[19px] top-[43px] h-[calc(100%-12px)] w-px bg-[#e7e9ee]" />
      )}

      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black transition ${
          active
            ? "border-[#0b1e5b] bg-[#0b1e5b] text-white shadow-[0_6px_16px_rgba(11,30,91,0.16)]"
            : "border-[#e4e7ed] bg-white text-[#8b93a1]"
        }`}
      >
        {number}
      </div>

      <div className={`${last ? "pb-0" : "pb-7"} min-w-0`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-bold text-[#111111]">{title}</h3>

          <span
            className={`${
              active ? "text-[#0b1e5b]" : "text-[#a1a7b1]"
            }`}
          >
            {icon}
          </span>
        </div>

        <p className="mt-1.5 max-w-[650px] text-[12px] leading-5 text-[#7b8492]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Requirement({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#f8f9fc] p-4 transition hover:bg-[#f4f6fa]">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckIcon />
      </div>

      <div className="min-w-0">
        <h3 className="text-[12px] font-bold text-[#111111]">{title}</h3>

        <p className="mt-1 text-[11px] leading-5 text-[#7b8492]">
          {description}
        </p>
      </div>
    </div>
  );
}

function SecurityPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckIcon />
      </div>

      <span className="text-[11px] font-medium text-[#66707f]">{text}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M8.5 9.5h.01" />
      <path d="M15.5 9.5h.01" />
    </svg>
  );
}



function ChevronDownIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ShieldIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}





function CheckCircleIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}


function BadgeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="10" r="6" />
      <path d="M8.5 15.2 7 21l5-2 5 2-1.5-5.8" />
      <path d="m9.5 10 1.7 1.7 3.3-3.4" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10v10h16V10" />
      <path d="M3 10 5 4h14l2 6" />
      <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M9 20v-5h6v5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M13 10h5" />
      <path d="M13 14h5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity=".3"
        strokeWidth="3"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ className = "h-3 w-3", size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 13}
      height={size || 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon({ className = "h-3 w-3", size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 12}
      height={size || 12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
