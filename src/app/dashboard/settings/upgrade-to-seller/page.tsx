"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  escrow_balance: number;
}

function UpgradeSkeleton() {
  return (
    <div className="min-h-screen bg-[#fdfdfc] p-6 animate-pulse">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded-[28px]"></div>
        <div className="h-32 bg-gray-200 rounded-[28px]"></div>
      </div>
    </div>
  );
}

export default function UpgradeToSellerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const [verificationFee, setVerificationFee] = useState<number>(3000);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleListAccountClick = () => {
    if (
      profile &&
      ["seller", "vendor", "admin"].includes(profile.role?.toLowerCase())
    ) {
      router.push("/dashboard/listings/new");
      return;
    }

    setErrorMsg(
      "You must complete your seller verification first before listing accounts."
    );
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        /* =====================================================
           1. PROFILE
        ===================================================== */

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profileData) {
          const role = profileData.role?.toLowerCase();

          if (["seller", "vendor", "admin"].includes(role)) {
            router.push("/dashboard/settings");
            return;
          }

          setProfile({
            ...profileData,
            email: profileData.email || user.email || "",
          });
        }

        /* =====================================================
           2. WALLET
        ===================================================== */

        const { data: walletData } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (walletData) {
          setWallet(walletData);
        }

        /* =====================================================
           3. VERIFICATION FEE
        ===================================================== */

        const { data: settingData } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "seller_verification_fee")
          .maybeSingle();

        if (!mounted) return;

        if (settingData) {
          const fee = Number(settingData.value);

          if (Number.isFinite(fee) && fee >= 0) {
            setVerificationFee(fee);
          }
        }

        /* =====================================================
           4. EXISTING VERIFICATION
        ===================================================== */

        const {
          data: existingVerification,
          error: checkError,
        } = await supabase
          .from("user_verifications")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (checkError) {
          console.error(
            "Error checking verification status:",
            checkError
          );
        }

        if (!mounted) return;

        if (existingVerification) {
          setVerificationStatus(
            existingVerification.status?.toLowerCase() || null
          );
        }

        /* =====================================================
           5. UNREAD NOTIFICATIONS
        ===================================================== */

        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!mounted) return;

        setHasUnread(Boolean(unreadCount && unreadCount > 0));
      } catch (err) {
        console.error("Error loading verification data:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================================================
     REQUEST VERIFICATION
  ========================================================= */

  const handleRequestVerification = async () => {
    if (!profile) {
      setErrorMsg("User profile information not found.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    /* Already verified */

    if (["success", "approved"].includes(verificationStatus || "")) {
      setSuccessMsg(
        "You are already verified as a seller! Redirecting..."
      );

      setTimeout(() => {
        router.push("/dashboard/settings");
      }, 1500);

      return;
    }

    /* Existing pending verification */

    if (verificationStatus === "pending") {
      setRequesting(true);

      setSuccessMsg(
        "Continuing existing verification process..."
      );

      setTimeout(() => {
        window.location.href = "/api/didit/verify";
      }, 1000);

      return;
    }

    /* Retry failed/rejected/expired verification */

    if (
      ["failed", "rejected", "expired"].includes(
        verificationStatus || ""
      )
    ) {
      setRequesting(true);

      try {
        const { error: updateError } = await supabase
          .from("user_verifications")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.id);

        if (updateError) {
          throw updateError;
        }

        setVerificationStatus("pending");

        setSuccessMsg(
          "Retrying verification... Redirecting to Didit..."
        );

        setTimeout(() => {
          window.location.href = "/api/didit/verify";
        }, 1200);
      } catch (err: any) {
        console.error(err);

        setErrorMsg(
          err?.message || "Failed to retry verification."
        );

        setRequesting(false);
      }

      return;
    }

    /* Brand new verification */

    if (!wallet) {
      setErrorMsg("Wallet information not found.");
      return;
    }

    setRequesting(true);

    try {
      const currentAvailableBalance = Number(
        wallet.available_balance || 0
      );

      if (currentAvailableBalance < verificationFee) {
        throw new Error(
          `Insufficient available balance. You need ₦${verificationFee.toLocaleString()} to complete seller verification.`
        );
      }

      const newAvailableBalance =
        currentAvailableBalance - verificationFee;

      /* Deduct wallet */

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({
          available_balance: newAvailableBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (walletUpdateError) {
        throw walletUpdateError;
      }

      /* Transaction */

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: profile.id,
          amount: verificationFee,
          type: "verification_fee",
          status: "completed",
          description: "Seller verification fee payment",
        });

      if (transactionError) {
        console.error(
          "Transaction insert error:",
          transactionError
        );
      }

      /* Notification */

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: profile.id,
          title: "Verification Fee Deducted",
          message: `₦${verificationFee.toLocaleString()} was successfully deducted from your wallet available balance for seller verification.`,
          is_read: false,
        });

      if (notificationError) {
        console.error(
          "Notification insert error:",
          notificationError
        );
      }

      /* Verification record */

      const { error: verificationError } = await supabase
        .from("user_verifications")
        .insert({
          user_id: profile.id,
          fee_paid: verificationFee,
          status: "pending",
        });

      if (verificationError) {
        throw verificationError;
      }

      setWallet({
        ...wallet,
        available_balance: newAvailableBalance,
      });

      setVerificationStatus("pending");

      setSuccessMsg(
        "Verification fee processed successfully! Redirecting to Didit verification..."
      );

      setTimeout(() => {
        window.location.href = "/api/didit/verify";
      }, 1500);
    } catch (err: any) {
      console.error(err);

      setErrorMsg(
        err?.message || "Failed to process verification request."
      );

      setRequesting(false);
    }
  };

  /* =========================================================
     BUTTON TEXT
  ========================================================= */

  const getButtonText = () => {
    if (requesting) return "Processing Request...";

    if (
      ["success", "approved"].includes(
        verificationStatus || ""
      )
    ) {
      return "Already Verified";
    }

    if (verificationStatus === "pending") {
      return "Continue Verification";
    }

    if (
      ["failed", "rejected", "expired"].includes(
        verificationStatus || ""
      )
    ) {
      return "Retry Verification";
    }

    return "Request Verification";
  };

  const getStatusLabel = () => {
    switch (verificationStatus) {
      case "pending":
        return "Verification pending";

      case "success":
      case "approved":
        return "Seller verified";

      case "failed":
        return "Verification failed";

      case "rejected":
        return "Verification rejected";

      case "expired":
        return "Verification expired";

      default:
        return "Not verified";
    }
  };

  const getStatusStyle = () => {
    switch (verificationStatus) {
      case "success":
      case "approved":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "failed":
      case "rejected":
      case "expired":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-[#dbe2f0] bg-[#f5f7fb] text-[#6b7280]";
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <UpgradeSkeleton />;
  }

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] border-r border-[#e5e7eb] bg-white lg:flex lg:flex-col">
        {/* Logo */}

        <div className="flex h-[76px] items-center border-b border-[#e5e7eb] px-6">
          <Link
            href="/"
            className="relative h-10 w-[135px]"
          >
            <Image
              src="/images/logo.png"
              alt="AccMarket"
              fill
              priority
              className="object-contain object-left"
            />
          </Link>
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
            Workspace
          </p>

          <nav className="space-y-1">
            <SidebarLink
              href="/dashboard"
              icon={<DashboardIcon />}
              label="Dashboard"
            />

            <SidebarLink
              href="/dashboard/wallet"
              icon={<WalletIcon />}
              label="Wallet"
            />

            <SidebarLink
              href="/dashboard/transactions"
              icon={<TransactionIcon />}
              label="Transactions"
            />

            <button
              onClick={handleListAccountClick}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#4b5563] transition hover:bg-[#f5f7fb] hover:text-[#0b1e5b]"
            >
              <span className="text-[#6b7280] transition group-hover:text-[#0b1e5b]">
                <ChartIcon />
              </span>

              Sell account
            </button>

            <SidebarLink
              href="/dashboard/messages"
              icon={<MessageIcon />}
              label="My chats"
            />

            <SidebarLink
              href="/dashboard/notifications"
              icon={
                <BellIcon hasUnread={hasUnread} />
              }
              label="Notifications"
              badge={hasUnread}
            />

            <SidebarLink
              href="/dashboard/api"
              icon={<ApiIcon />}
              label="API & Webhooks"
            />

            <SidebarLink
              href="/dashboard/support"
              icon={<SupportIcon />}
              label="Support"
            />
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
            Account
          </p>

          <nav className="space-y-1">
            <SidebarLink
              href="/dashboard/settings"
              icon={<SettingsIcon />}
              label="Settings"
              active
            />
          </nav>
        </div>

        {/* User section */}

        <div className="border-t border-[#e5e7eb] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#f7f8fb] p-3">
            <Avatar
              username={profile?.username}
              avatarUrl={profile?.avatar_url}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#111111]">
                {profile?.username || "Account"}
              </p>

              <p className="truncate text-[11px] text-[#6b7280]">
                {profile?.email || ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-[#fdfdfc]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href="/"
          className="relative h-10 w-[120px]"
        >
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
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
        >
          {mobileMenu ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenu && (
        <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-[#e5e7eb] bg-white p-4 shadow-xl lg:hidden">
          <div className="space-y-1">
            <MobileLink
              href="/dashboard"
              label="Dashboard"
              icon={<DashboardIcon />}
            />

            <MobileLink
              href="/dashboard/wallet"
              label="Wallet"
              icon={<WalletIcon />}
            />

            <MobileLink
              href="/dashboard/transactions"
              label="Transactions"
              icon={<TransactionIcon />}
            />

            <button
              onClick={handleListAccountClick}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-[#111111] transition hover:bg-[#f5f7fb] hover:text-[#0b1e5b]"
            >
              <span className="text-[#6b7280]">
                <ChartIcon />
              </span>

              Sell account
            </button>

            <MobileLink
              href="/dashboard/messages"
              label="My chats"
              icon={<MessageIcon />}
            />

            <MobileLink
              href="/dashboard/notifications"
              label="Notifications"
              icon={
                <BellIcon hasUnread={hasUnread} />
              }
            />

            <MobileLink
              href="/dashboard/api"
              label="API & Webhooks"
              icon={<ApiIcon />}
            />

            <MobileLink
              href="/dashboard/support"
              label="Support"
              icon={<SupportIcon />}
            />

            <MobileLink
              href="/dashboard/settings"
              label="Settings"
              icon={<SettingsIcon />}
            />

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

      {/* =====================================================
          DESKTOP TOP BAR
      ===================================================== */}
          <header className="sticky top-0 z-40 hidden h-[76px] items-center justify-between border-b border-[#e5e7eb] bg-[#fdfdfc]/95 px-6 backdrop-blur-xl lg:flex xl:px-8">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Seller Center
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-[#111111]">
              Seller Verification
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search / help */}
          <Link
            href="/dashboard/support"
            className="flex h-10 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3.5 text-xs font-semibold text-[#6b7280] shadow-sm transition hover:border-[#d6dbe4] hover:text-[#0b1e5b]"
          >
            <SupportIcon />
            <span className="hidden xl:inline">Need help?</span>
          </Link>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#6b7280] shadow-sm transition hover:border-[#d6dbe4] hover:bg-[#f8f9fb] hover:text-[#0b1e5b]"
          >
            <BellIcon hasUnread={hasUnread} />
          </Link>

          {/* Messages */}
          <Link
            href="/dashboard/messages"
            aria-label="Messages"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#6b7280] shadow-sm transition hover:border-[#d6dbe4] hover:bg-[#f8f9fb] hover:text-[#0b1e5b]"
          >
            <MessageIcon />
          </Link>

          <div className="mx-1 h-8 w-px bg-[#e5e7eb]" />

          {/* User profile */}
          <Link
            href="/dashboard/settings"
            className="group flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-white"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-[#0b1e5b] shadow-sm">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || "User"}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <div className="hidden min-w-0 xl:block">
              <p className="max-w-[140px] truncate text-sm font-bold text-[#111111]">
                {profile?.username || "Account"}
              </p>
              <p className="mt-0.5 text-[11px] font-medium capitalize text-[#9ca3af]">
                {profile?.role || "Buyer"}
              </p>
            </div>

            <ChevronDownIcon />
          </Link>
        </div>
      </header>

      {/* =====================================================
          DESKTOP MAIN CONTENT
      ===================================================== */}
      <div className="lg:ml-[260px]">
        <div className="mx-auto max-w-[1440px] px-5 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-12 lg:pt-8">

          {/* Breadcrumb */}
          <div className="mb-6 hidden items-center gap-2 text-xs font-medium lg:flex">
            <Link
              href="/dashboard"
              className="text-[#9ca3af] transition hover:text-[#0b1e5b]"
            >
              Dashboard
            </Link>

            <span className="text-[#d1d5db]">/</span>

            <Link
              href="/dashboard/settings"
              className="text-[#9ca3af] transition hover:text-[#0b1e5b]"
            >
              Settings
            </Link>

            <span className="text-[#d1d5db]">/</span>

            <span className="font-semibold text-[#0b1e5b]">
              Seller Verification
            </span>
          </div>

          {/* =================================================
              PAGE HEADER
          ================================================= */}
          <div className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce3f2] bg-[#eef2fb] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0b1e5b]">
                <ShieldIcon />
                Seller onboarding
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#0b1e5b] sm:text-4xl">
                Become a verified seller
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7280] sm:text-[15px]">
                Complete your identity verification to unlock seller tools,
                publish listings, and build trust with buyers on AccMarket.
              </p>
            </div>

            {/* Verification status */}
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  ["success", "approved"].includes(
                    verificationStatus || ""
                  )
                    ? "bg-emerald-50 text-emerald-600"
                    : verificationStatus === "pending"
                    ? "bg-amber-50 text-amber-600"
                    : ["failed", "rejected", "expired"].includes(
                        verificationStatus || ""
                      )
                    ? "bg-red-50 text-red-600"
                    : "bg-[#eef2fb] text-[#0b1e5b]"
                }`}
              >
                <ShieldIcon />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
                  Current status
                </p>

                <p className="mt-1 text-sm font-bold capitalize text-[#111111]">
                  {verificationStatus
                    ? verificationStatus === "approved"
                      ? "Verified"
                      : verificationStatus
                    : "Not started"}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              ALERTS
          ================================================= */}
          {successMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
              <SuccessIcon />

              <div>
                <p className="font-bold">Verification update</p>
                <p className="mt-0.5 font-medium leading-5">
                  {successMsg}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 shadow-sm">
              <ErrorIcon />

              <div>
                <p className="font-bold">Something went wrong</p>
                <p className="mt-0.5 font-medium leading-5">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              MAIN DASHBOARD GRID
          ================================================= */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">

            {/* =================================================
                LEFT COLUMN
            ================================================= */}
            <div className="space-y-6">

              {/* Hero */}
              <section className="relative overflow-hidden rounded-[28px] bg-[#0b1e5b] p-7 text-white shadow-xl sm:p-9">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#5570d0]/20 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                    <div>
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                        <ShieldIcon />
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                        AccMarket Seller Program
                      </p>

                      <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                        Build trust. Sell with confidence.
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                        Verification helps protect the marketplace and gives
                        buyers more confidence when purchasing from your store.
                      </p>
                    </div>

                    <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 sm:flex">
                      <CheckIcon />
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <BenefitCard
                      icon={<ChartIcon />}
                      title="Seller tools"
                      text="Create and manage marketplace listings."
                    />

                    <BenefitCard
                      icon={<WalletIcon />}
                      title="Secure payouts"
                      text="Use AccMarket escrow protection."
                    />

                    <BenefitCard
                      icon={<ShieldIcon />}
                      title="Trust badge"
                      text="Show buyers that you're verified."
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  VERIFICATION PROCESS
              ================================================= */}
              <section className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
                      Verification process
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-[#111111]">
                      Three simple steps
                    </h2>

                    <p className="mt-1 text-sm text-[#6b7280]">
                      Everything you need to become a verified seller.
                    </p>
                  </div>

                  <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-[#eef2fb] text-[#0b1e5b] sm:flex">
                    <CheckIcon />
                  </div>
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  <ProcessStep
                    number="01"
                    title="Pay verification fee"
                    text={`Pay ₦${verificationFee.toLocaleString()} from your available wallet balance.`}
                  />

                  <ProcessStep
                    number="02"
                    title="Verify your identity"
                    text="Complete the secure identity verification process."
                  />

                  <ProcessStep
                    number="03"
                    title="Start selling"
                    text="Access seller tools and publish your first listing."
                  />
                </div>
              </section>

              {/* =================================================
                  SELLER TERMS
              ================================================= */}
              <section className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f7fb] text-[#0b1e5b]">
                    <DocumentIcon />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[#111111]">
                      Seller terms & conditions
                    </h2>

                    <p className="mt-1 text-sm text-[#6b7280]">
                      Please review these requirements before starting.
                    </p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-[#eef0f3]">
                  <TermItem>
                    Verification requires a{" "}
                    <strong className="text-[#111111]">
                      ₦{verificationFee.toLocaleString()}
                    </strong>{" "}
                    verification fee.
                  </TermItem>

                  <TermItem>
                    A small monthly maintenance fee may apply automatically.
                  </TermItem>

                  <TermItem>
                    Sellers must maintain accurate product information and
                    comply with AccMarket community rules.
                  </TermItem>

                  <TermItem>
                    Fraudulent activity may result in permanent suspension
                    of your seller account.
                  </TermItem>

                  <div className="flex items-start gap-3 py-4">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef2fb] text-[#0b1e5b]">
                      <ArrowRightIcon />
                    </div>

                    <p className="text-sm leading-6 text-[#6b7280]">
                      Read the complete{" "}
                      <Link
                        href="/terms"
                        className="font-bold text-[#0b1e5b] underline underline-offset-2 transition hover:text-[#162d78]"
                      >
                        seller terms and policies
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================================
                RIGHT COLUMN
            ================================================= */}
            <aside className="space-y-6">

              {/* Verification Card */}
              <section className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
                      Get started
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-[#111111]">
                      Seller verification
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef2fb] text-[#0b1e5b]">
                    <ShieldIcon />
                  </div>
                </div>

                {/* Fee */}
                <div className="mt-6 rounded-2xl bg-[#f7f8fb] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-[#6b7280]">
                      Verification fee
                    </span>

                    <span className="text-xl font-bold tracking-tight text-[#0b1e5b]">
                      ₦{verificationFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[#6b7280]">
                    <WalletIcon />
                    Charged from available wallet balance
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleRequestVerification}
                  disabled={
                    requesting ||
                    ["success", "approved"].includes(
                      verificationStatus || ""
                    )
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1e5b] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#0b1e5b]/15 transition hover:bg-[#162d78] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {requesting ? (
                    <>
                      <Spinner />
                      Processing Request...
                    </>
                  ) : (
                    <>
                      {getButtonText()}
                      <ArrowRightIcon />
                    </>
                  )}
                </button>

                {/* Security note */}
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3.5">
                  <div className="mt-0.5 text-[#0b1e5b]">
                    <LockIcon />
                  </div>

                  <p className="text-[11px] leading-5 text-[#6b7280]">
                    Your payment is processed from your AccMarket wallet.
                    Identity verification is completed through our secure
                    verification provider.
                  </p>
                </div>
              </section>

      {/* Wallet */}
              <section className="overflow-hidden rounded-[28px] bg-[#111111] p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                      Available balance
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      ₦
                      {Number(
                        wallet?.available_balance || 0
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <WalletIcon />
                  </div>
                </div>

                <div className="mt-4 h-px bg-white/10" />

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/45">
                    Escrow balance
                  </span>

                  <span className="font-bold text-white">
                    ₦
                    {Number(
                      wallet?.escrow_balance || 0
                    ).toLocaleString()}
                  </span>
                </div>

                <Link
                  href="/dashboard/wallet"
                  className="mt-5 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  <span>Manage wallet</span>
                  <ArrowRightIcon />
                </Link>
              </section>

              {/* Security */}
              <section className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <LockIcon />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111111]">
                      Secure verification
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                      Your identity verification is handled through a secure
                      verification flow. AccMarket does not store your
                      identity documents directly.
                    </p>
                  </div>
                </div>
              </section>

              {/* Support */}
              <section className="rounded-[28px] border border-[#dce3f2] bg-[#f5f7fb] p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b] text-white">
                    <SupportIcon />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111111]">
                      Need help?
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                      Having trouble with verification or your wallet?
                    </p>

                    <Link
                      href="/dashboard/support"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0b1e5b] transition hover:text-[#162d78]"
                    >
                      Contact support
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5e7eb] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          <BottomNav
            href="/dashboard"
            icon={<DashboardIcon />}
            label="Home"
          />

          <BottomNav
            href="/marketplace"
            icon={<MarketplaceIcon />}
            label="Market"
          />

          <BottomNav
            href="/dashboard/messages"
            icon={<MessageIcon />}
            label="Chat"
          />

          <BottomNav
            href="/dashboard/notifications"
            icon={<BellIcon hasUnread={hasUnread} />}
            label="Notification"
          />

          <BottomNav
            href="/dashboard/settings"
            icon={<SettingsIcon />}
            label="Settings"
            active
          />
        </div>
      </div>

    </main>
  );
}

/* =========================================================
   HELPER COMPONENTS & ICONS
========================================================= */

function BenefitCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/5 backdrop-blur-sm transition hover:bg-white/[0.13]">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
        {icon}
      </div>

      <p className="text-xs font-bold text-white">
        {title}
      </p>

      <p className="mt-1 text-[11px] leading-5 text-white/60">
        {text}
      </p>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#0b1e5b] text-white shadow-md shadow-[#0b1e5b]/10"
          : "text-[#4b5563] hover:bg-[#f5f7fb] hover:text-[#0b1e5b]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`transition ${
            active ? "text-white" : "text-[#6b7280] group-hover:text-[#0b1e5b]"
          }`}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {badge && <span className="h-2 w-2 rounded-full bg-red-500" />}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#f5f7fb]"
    >
      <span className="text-[#6b7280]">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function BottomNav({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center py-1.5 transition ${
        active ? "text-[#0b1e5b]" : "text-[#9ca3af] hover:text-[#111111]"
      }`}
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="mt-1 text-[10px] font-bold">{label}</span>
    </Link>
  );
}

function ProcessStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#eef0f3] bg-[#fafafa] p-5 transition hover:border-[#dce3f2] hover:bg-[#f8f9fc]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-wider text-[#0b1e5b]">
          {number}
        </span>

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#9ca3af] shadow-sm transition group-hover:text-[#0b1e5b]">
          <ArrowRightIcon />
        </div>
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#111111]">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-[#6b7280]">
        {text}
      </p>
    </div>
  );
}

function TermItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef2fb] text-[#0b1e5b]">
        <CheckSmallIcon />
      </div>

      <p className="text-sm leading-6 text-[#6b7280]">
        {children}
      </p>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2m-18 0v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7m-6 6h2m-2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
    </svg>
  );
}

function TransactionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BellIcon({ hasUnread }: { hasUnread?: boolean }) {
  return (
    <div className="relative">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
      </svg>
      {hasUnread && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />}
    </div>
  );
}

function ApiIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636l3.536 9.192l-3.536 3.536M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MarketplaceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#9ca3af]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6 9 6 6 6-6"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-2.8 8.2-7 10-4.2-1.8-7-5.5-7-10V6l7-3z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 12 2 2 4-4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12 4 4L19 6"
      />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12 4 4L19 6"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l3 3v15H6V3z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3v4h4M9 12h6M9 16h6"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />

      <path
        strokeLinecap="round"
        d="M8 10V7a4 4 0 0 1 8 0v3"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14m-6-6 6 6-6 6"
      />
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
        strokeOpacity="0.3"
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

function Avatar({ username, avatarUrl }: { username?: string; avatarUrl?: string | null }) {
  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-[#0b1e5b] shadow-sm">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={username || "User"} fill sizes="40px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
          {username?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
    </div>
  );
}