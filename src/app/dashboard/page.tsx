"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  kyc_status?: string;
  avatar_url?: string | null;
  telegram_username?: string | null;
  telegram_notifications?: boolean;
  trust_score?: number;
  is_active?: boolean;
}

interface WalletData {
  escrow_balance: number;
  available_balance: number;
}

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [wallet, setWallet] = useState<WalletData>({
    escrow_balance: 0,
    available_balance: 0,
  });

  const [purchasesCount, setPurchasesCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);

  const [transactions, setTransactions] = useState<
    TransactionItem[]
  >([]);

  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellerPromptDrawer, setSellerPromptDrawer] = useState(false);
  // --- FIXED: Account health memoized calculations ---
  const totalBalance = wallet.available_balance + wallet.escrow_balance;

  const { kycVerified, hasIdentity, hasProfile, hasWallet, healthProgressPercent } = useMemo(() => {
    const verified = profile?.kyc_status?.toLowerCase() === "verified";
    const profileExists = Boolean(profile?.username);
    const walletActive = totalBalance > 0;

    const count = [verified, profileExists, walletActive].filter(Boolean).length;
    const percent = Math.round((count / 3) * 100);

    return {
      kycVerified: verified,
      hasIdentity: verified,
      hasProfile: profileExists,
      hasWallet: walletActive,
      healthProgressPercent: percent,
    };
  }, [profile, totalBalance]);
  // ------------------------------------------------

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    let mounted = true;
    const channels: ReturnType<
      typeof supabase.channel
    >[] = [];

    async function loadDashboardData() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const userId = user.id;
        const userEmail = user.email || "";

                /* -------------------------------------------------------------- */
        /* PROFILE                                                         */
        /* -------------------------------------------------------------- */

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select(
              "id, username, email, role, kyc_status, trust_score, is_active, avatar_url, telegram_notifications"
            )
            .eq("id", userId)
            .maybeSingle();

        if (profileError) {
          console.error(
            "Profile loading error:",
            profileError.message || profileError.code || JSON.stringify(profileError)
          );
        }

        if (
          profileData &&
          profileData.is_active === false
        ) {
          await supabase.auth.signOut();
          router.replace(
            "/login?error=account_deactivated"
          );
          return;
        }

        if (!mounted) return;

        if (profileData) {
          setProfile({
            ...profileData,
            id: profileData.id || userId,
            email:
              profileData.email ||
              userEmail ||
              "",
            trust_score:
              profileData.trust_score ?? 60,
            is_active:
              profileData.is_active ?? true,
          } as UserProfile);
        } else {
          setProfile({
            id: userId,
            username:
              userEmail.split("@")[0] || "User",
            email: userEmail,
            role: "buyer",
            kyc_status: "unverified",
            trust_score: 0,
            is_active: true,
          });
        }

        

        /* -------------------------------------------------------------- */
        /* WALLET                                                          */
        /* -------------------------------------------------------------- */

        const { data: walletData, error: walletError } =
          await supabase
            .from("wallets")
            .select(
              "escrow_balance, available_balance"
            )
            .eq("user_id", userId)
            .maybeSingle();

        if (walletError) {
          console.error(
            "Wallet loading error:",
            walletError
          );
        }

        if (walletData && mounted) {
          setWallet({
            escrow_balance:
              Number(walletData.escrow_balance) || 0,
            available_balance:
              Number(walletData.available_balance) || 0,
          });
        }

        /* -------------------------------------------------------------- */
        /* ORDERS                                                          */
        /* -------------------------------------------------------------- */

        const { count: purchases } = await supabase
          .from("orders")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("buyer_id", userId);

        const { count: sales } = await supabase
          .from("orders")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("seller_id", userId);

        if (mounted) {
          setPurchasesCount(purchases ?? 0);
          setSalesCount(sales ?? 0);
        }

        /* -------------------------------------------------------------- */
        /* RECENT TRANSACTIONS                                             */
        /* -------------------------------------------------------------- */

        const { data: txData, error: txError } =
          await supabase
            .from("transactions")
            .select(
              "id, type, amount, status, created_at, description"
            )
            .eq("user_id", userId)
            .order("created_at", {
              ascending: false,
            })
            .limit(5);

        if (txError) {
          console.error(
            "Transaction loading error:",
            txError
          );
        }

        if (mounted) {
          setTransactions(
            (txData || []).map((tx) => ({
              ...tx,
              amount: Number(tx.amount) || 0,
            }))
          );
        }

        /* -------------------------------------------------------------- */
        /* NOTIFICATIONS                                                   */
        /* -------------------------------------------------------------- */

        const { count: unreadCount } =
          await supabase
            .from("notifications")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (mounted) {
          setHasUnread((unreadCount || 0) > 0);
        }

        /* -------------------------------------------------------------- */
        /* PROFILE REALTIME                                                */
        /* -------------------------------------------------------------- */

        const profileChannel = supabase
          .channel(`dashboard-profile-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${userId}`,
            },
            async (payload) => {
              if (!mounted) return;

              const updated =
                payload.new as UserProfile;

              if (updated.is_active === false) {
                await supabase.auth.signOut();
                router.replace(
                  "/login?error=account_deactivated"
                );
                return;
              }

              setProfile((current) => ({
                ...(current || {}),
                ...updated,
              }));
            }
          )
          .subscribe();

        channels.push(profileChannel);

        /* -------------------------------------------------------------- */
        /* TRANSACTION REALTIME                                            */
        /* -------------------------------------------------------------- */

        const transactionChannel = supabase
          .channel(`dashboard-transactions-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "transactions",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (!mounted) return;

              if (payload.eventType === "INSERT") {
                const incoming =
                  payload.new as TransactionItem;

                setTransactions((current) => {
                  const exists = current.some(
                    (item) => item.id === incoming.id
                  );

                  if (exists) return current;

                  return [
                    {
                      ...incoming,
                      amount:
                        Number(incoming.amount) || 0,
                    },
                    ...current,
                  ].slice(0, 5);
                });
              }

              if (payload.eventType === "UPDATE") {
                const updated =
                  payload.new as TransactionItem;

                setTransactions((current) =>
                  current.map((item) =>
                    item.id === updated.id
                      ? {
                          ...updated,
                          amount:
                            Number(updated.amount) ||
                            0,
                        }
                      : item
                  )
                );
              }

              if (payload.eventType === "DELETE") {
                setTransactions((current) =>
                  current.filter(
                    (item) => item.id !== payload.old.id
                  )
                );
              }
            }
          )
          .subscribe();

        channels.push(transactionChannel);

        /* -------------------------------------------------------------- */
        /* NOTIFICATION REALTIME                                           */
        /* -------------------------------------------------------------- */

        const notificationChannel = supabase
          .channel(`dashboard-notifications-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (!mounted) return;

              if (payload.eventType === "INSERT") {
                setHasUnread(true);
              }

              if (payload.eventType === "UPDATE") {
                const notification =
                  payload.new as {
                    is_read?: boolean;
                  };

                if (notification.is_read === false) {
                  setHasUnread(true);
                }
              }
            }
          )
          .subscribe();

        channels.push(notificationChannel);
      } catch (error) {
        console.error(
          "Unexpected dashboard error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;

      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
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
    return;
  }

  setSellerPromptDrawer(true); 
};


  const navProfile = {
    username: profile?.username || "User",
    email: profile?.email || "",
    avatar_url: profile?.avatar_url || null,
    role: profile?.role || "buyer",
  };

  const displayName =
    profile?.username?.trim() ||
    profile?.email?.split("@")[0] ||
    "User";

  const role = profile?.role?.toLowerCase();

  const isSellerOrVendor =
    role === "seller" ||
    role === "vendor" ||
    role === "admin";

  const trustScore = Math.max(
    0,
    Math.min(100, profile?.trust_score ?? 60)
  );

  
    if (loading) {
    return (
      <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
        <DesktopSidebar
          profile={navProfile}
          hasUnread={hasUnread}
          onSignOut={handleSignOut}
          onListAccountClick={handleListAccountClick}
        />

        <MobileHeader
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="lg:pl-[260px]">
          <DesktopHeader
            profile={navProfile}
            hasUnread={hasUnread}
            sectionLabel="Overview"
            pageTitle="Dashboard"
          />

          <div className="mx-auto max-w-[1500px] px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8 animate-pulse">
            {/* PAGE HEADER SKELETON */}
            <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-gray-200" />
                <div className="h-9 w-72 rounded-xl bg-gray-200" />
                <div className="h-4 w-96 max-w-full rounded bg-gray-200" />
              </div>
              <div className="flex gap-2.5">
                <div className="h-10 w-32 rounded-xl bg-gray-200" />
                <div className="h-10 w-32 rounded-xl bg-gray-200" />
              </div>
            </section>

            {/* WALLET HERO SKELETON */}
            <section className="relative mt-7 overflow-hidden rounded-[24px] bg-gray-200 p-5 sm:p-7 lg:p-8 h-[240px]">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <div className="h-8 w-40 rounded-xl bg-gray-300" />
                  <div className="h-12 w-64 rounded-xl bg-gray-300" />
                  <div className="h-3 w-48 rounded bg-gray-300" />
                </div>
                <div className="flex gap-2.5">
                  <div className="h-10 w-36 rounded-xl bg-gray-300" />
                  <div className="h-10 w-32 rounded-xl bg-gray-300" />
                </div>
              </div>
              <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="h-16 rounded-2xl bg-gray-300/60" />
                <div className="h-16 rounded-2xl bg-gray-300/60" />
              </div>
            </section>

            {/* QUICK STATS SKELETON */}
            <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[118px] rounded-2xl border border-[#e5e7eb] bg-white p-4 space-y-3"
                >
                  <div className="flex justify-between">
                    <div className="h-8 w-8 rounded-xl bg-gray-200" />
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-6 w-28 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </section>

            {/* MAIN CONTENT GRID SKELETON */}
            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_0.85fr]">
              {/* RECENT ACTIVITY SKELETON */}
              <section className="overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#e8ebef]">
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-48 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-36 rounded bg-gray-200" />
                          <div className="h-2.5 w-24 rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <div className="h-3.5 w-20 rounded bg-gray-200 ml-auto" />
                        <div className="h-3 w-14 rounded-full bg-gray-200 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* RIGHT COLUMN SKELETON */}
              <div className="space-y-5">
                <section className="rounded-2xl bg-gray-900 p-6 h-[210px] space-y-4">
                  <div className="flex justify-between">
                    <div className="h-9 w-9 rounded-xl bg-white/10" />
                    <div className="h-6 w-20 rounded-full bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-white/10" />
                    <div className="h-3 w-full rounded bg-white/10" />
                  </div>
                </section>

                <section className="rounded-2xl border border-[#e3e7ec] bg-white p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-gray-200" />
                      <div className="h-4 w-44 rounded bg-gray-200" />
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-gray-200" />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100" />
                  <div className="space-y-3 pt-2">
                    <div className="h-4 rounded bg-gray-100" />
                    <div className="h-4 rounded bg-gray-100" />
                    <div className="h-4 rounded bg-gray-100" />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <BottomNav hasUnread={hasUnread} />
      </main>
    );
  }


  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      {/* NAVIGATION */}

      <DesktopSidebar
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      <MobileHeader
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      <BottomNav hasUnread={hasUnread} />

      {/* MAIN */}

      <div className="lg:pl-[260px]">
        {/* DESKTOP TOP HEADER */}
        <DesktopHeader 
  profile={profile} 
  hasUnread={hasUnread} 
  sectionLabel="Overview"
  pageTitle="Dashboard" 
/>


        <div className="mx-auto max-w-[1500px] px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {/* PAGE HEADER */}

          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#89919d]">
                <DashboardIcon className="h-3.5 w-3.5" />
                Account overview
              </div>

              <h1 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-[#111827] sm:text-[34px]">
                Welcome back, {displayName}
              </h1>

              <p className="mt-1.5 max-w-[620px] text-xs leading-5 text-[#737c88]">
                Manage your balance, purchases, sales and
                protected escrow activity from one place.
              </p>
            </div>

            <div className="flex w-full gap-2.5 sm:w-auto">
              <Link
                href="/dashboard/marketplace"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dfe3e8] bg-white px-4 text-[10px] font-bold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:border-[#cbd2dc] hover:bg-[#fafbfc] sm:flex-none"
              >
                <StoreIcon />
                Marketplace
              </Link>

              <button
                type="button"
                onClick={handleListAccountClick}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-4 text-[10px] font-bold text-white shadow-[0_6px_18px_rgba(11,30,91,0.14)] transition hover:bg-[#09184a] sm:flex-none"
              >
                <PlusIcon />
                List account
              </button>
            </div>
          </section>

          {/* WALLET HERO */}

          <section className="relative mt-7 overflow-hidden rounded-[24px] bg-[#0b1e5b] shadow-[0_16px_45px_rgba(11,30,91,0.13)]">
            <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/[0.045] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-white/[0.025] blur-3xl" />

            <div className="relative p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
                      <WalletIcon />
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                      Total wallet balance
                    </span>
                  </div>

                  <p className="mt-5 text-[34px] font-black tracking-[-0.045em] text-white sm:text-[42px]">
                    ₦{formatMoney(totalBalance)}
                  </p>

                  <p className="mt-1.5 text-[10px] text-white/50">
                    Available balance + funds currently held
                    in escrow
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <Link
                    href="/dashboard/wallet"
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[10px] font-bold text-[#0b1e5b] transition hover:bg-[#f4f6f9]"
                  >
                    <WalletIcon />
                    Manage wallet
                  </Link>

                  <Link
                    href="/dashboard/transactions"
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[10px] font-bold text-white transition hover:bg-white/10"
                  >
                    <ReceiptIcon />
                    Transactions
                  </Link>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <WalletMiniCard
                  label="Available balance"
                  value={wallet.available_balance}
                  icon={<UnlockIcon />}
                />

                <WalletMiniCard
                  label="In escrow"
                  value={wallet.escrow_balance}
                  icon={<ShieldIcon />}
                />
              </div>
            </div>
          </section>

          {/* QUICK STATS */}

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuickStat
              label="Purchases"
              value={purchasesCount.toLocaleString()}
              description="Accounts bought"
              icon={<ShoppingBagIcon />}
            />

            <QuickStat
              label="Sales"
              value={salesCount.toLocaleString()}
              description={
                isSellerOrVendor
                  ? "Accounts sold"
                  : "Seller activity"
              }
              icon={<StoreIcon />}
            />

            <QuickStat
              label="Trust score"
              value={`${trustScore}/100`}
              description={
                trustScore >= 80
                  ? "Excellent standing"
                  : trustScore >= 60
                  ? "Standard standing"
                  : "Build your score"
              }
              icon={<ShieldIcon />}
              tone={
                trustScore >= 80
                  ? "success"
                  : "default"
              }
            />

            <QuickStat
              label="KYC status"
              value={
                kycVerified ? "Verified" : "Pending"
              }
              description={
                kycVerified
                  ? "Identity confirmed"
                  : "Verification required"
              }
              icon={<BadgeCheckIcon />}
              tone={
                kycVerified
                  ? "success"
                  : "warning"
              }
            />
          </section>

          {/* MAIN CONTENT GRID */}

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_0.85fr]">
            {/* RECENT ACTIVITY */}

            <section className="overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white shadow-[0_3px_18px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between border-b border-[#e8ebef] px-5 py-4.5 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[13px] font-black text-[#1f2937]">
                      Recent activity
                    </h2>

                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f1f4f8] px-1.5 text-[8px] font-bold text-[#68717e]">
                      {transactions.length}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-[#9aa2ae]">
                    Your latest wallet and escrow transactions
                  </p>
                </div>

                <Link
                  href="/dashboard/transactions"
                  className="flex items-center gap-1 text-[10px] font-bold text-[#0b1e5b] hover:underline"
                >
                  View all
                  <ChevronRightIcon className="h-3 w-3" />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f5f8] text-[#0b1e5b]">
                    <ReceiptIcon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 text-[13px] font-black text-[#1f2937]">
                    No activity yet
                  </h3>

                  <p className="mt-1.5 max-w-[300px] text-[10px] leading-5 text-[#9aa2ae]">
                    Your deposits, purchases, sales,
                    verification fees and escrow activity will
                    appear here.
                  </p>

                  <Link
                    href="/dashboard/marketplace"
                    className="mt-5 flex h-9 items-center gap-2 rounded-xl bg-[#0b1e5b] px-4 text-[10px] font-bold text-white transition hover:bg-[#09184a]"
                  >
                    Browse marketplace
                    <ChevronRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div>
                  {transactions.map(
                    (transaction, index) => (
                      <DashboardTransaction
                        key={transaction.id}
                        transaction={transaction}
                        last={
                          index ===
                          transactions.length - 1
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            {/* RIGHT COLUMN */}

            <div className="space-y-5">
              {/* ESCROW CARD */}

              <section className="relative overflow-hidden rounded-2xl bg-[#111827] p-5 text-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] sm:p-6">
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#0b1e5b] blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white">
                      <ShieldIcon />
                    </div>

                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[8px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Protected
                    </span>
                  </div>

                  <h2 className="mt-5 text-[17px] font-black tracking-tight">
                    Trade with confidence
                  </h2>

                  <p className="mt-2 text-[10px] leading-5 text-white/55">
                    AccMarket escrow keeps buyer funds protected
                    until the transaction requirements are met.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <ProtectionStep
                      number="01"
                      label="Pay"
                    />
                    <ProtectionStep
                      number="02"
                      label="Verify"
                    />
                    <ProtectionStep
                      number="03"
                      label="Release"
                    />
                  </div>
                </div>
              </section>

              {/* ACCOUNT HEALTH */}

              <section className="rounded-2xl border border-[#e3e7ec] bg-white p-5 shadow-[0_3px_18px_rgba(15,23,42,0.025)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#929aa5]">
                      Account health
                    </p>

                    <h2 className="mt-1.5 text-[15px] font-black text-[#1f2937]">
                      {healthProgressPercent === 100
                        ? "Account fully optimized"
                        : "Complete your verification"}
                    </h2>
                  </div>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      healthProgressPercent === 100
                        ? "bg-[#ecfdf3] text-[#15803d]"
                        : "bg-[#fff8e7] text-[#b45309]"
                    }`}
                  >
                    <BadgeCheckIcon />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-[#8b94a0]">
                      Verification progress
                    </span>

                    <span className="text-[9px] font-bold text-[#374151]">
                      {healthProgressPercent}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f3]">
                    <div
                      className="h-full rounded-full bg-[#0b1e5b] transition-all duration-500"
                      style={{
                        width: `${healthProgressPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <HealthRow
                    label="Identity verification"
                    complete={hasIdentity}
                  />

                  <HealthRow
                    label="Account profile"
                    complete={hasProfile}
                  />

                  <HealthRow
                    label="Wallet available"
                    complete={hasWallet}
                  />
                </div>

                <Link
                  href="/dashboard/settings"
                  className="mt-5 flex h-9 items-center justify-center gap-2 rounded-xl border border-[#dfe3e8] text-[10px] font-bold text-[#374151] transition hover:border-[#cbd2dc] hover:bg-[#fafbfc]"
                >
                  Manage account
                  <ChevronRightIcon className="h-3 w-3" />
                </Link>
              </section>
            </div>
          </div>

          {/* SELLER CTA */}

          {!isSellerOrVendor && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef2f8] text-[#0b1e5b]">
                    <StoreIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8f97a3]">
                      Grow on AccMarket
                    </p>

                    <h2 className="mt-1 text-[15px] font-black text-[#1f2937]">
                      Start selling accounts
                    </h2>

                    <p className="mt-1 text-[10px] leading-5 text-[#8a93a0]">
                      Become a verified seller and list accounts
                      for buyers through protected escrow.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleListAccountClick}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-5 text-[10px] font-bold text-white transition hover:bg-[#09184a]"
                >
                  Become a seller
                  <ChevronRightIcon className="h-3 w-3" />
                </button>
              </div>
            </section>
          )}

          {/* FOOTER */}

          <div className="mt-5 flex flex-col items-start justify-between gap-2 px-1 text-[9px] text-[#a0a7b2] sm:flex-row sm:items-center">
            <p>
              AccMarket dashboard · Your marketplace activity
              at a glance
            </p>

            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              Live account updates
            </div>
          </div>
        </div>
      </div>

            {/* SELLER MODAL */}
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


/* ========================================================================= */
/* WALLET MINI CARD                                                           */
/* ========================================================================= */

function WalletMiniCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white/80">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-white/45">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[13px] font-black text-white">
          ₦{formatMoney(value)}
        </p>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* QUICK STAT                                                                 */
/* ========================================================================= */

function QuickStat({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const iconClass =
    tone === "success"
      ? "bg-[#ecfdf3] text-[#15803d]"
      : tone === "warning"
      ? "bg-[#fff8e7] text-[#b45309]"
      : "bg-[#f1f4f8] text-[#0b1e5b]";

  return (
    <div className="group rounded-2xl border border-[#e3e7ec] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition hover:-translate-y-[1px] hover:border-[#d8dde5] hover:shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#d8dde4] transition group-hover:bg-[#0b1e5b]" />
      </div>

      <p className="mt-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#929aa5]">
        {label}
      </p>

      <p className="mt-1 truncate text-[17px] font-black tracking-[-0.025em] text-[#1f2937]">
        {value}
      </p>

      <p className="mt-0.5 truncate text-[9px] text-[#a0a7b2]">
        {description}
      </p>
    </div>
  );
}

/* ========================================================================= */
/* TRANSACTION                                                                 */
/* ========================================================================= */

function DashboardTransaction({
  transaction,
  last,
}: {
  transaction: TransactionItem;
  last: boolean;
}) {
  const incoming = isIncoming(transaction.type);

  return (
    <div
      className={`group flex items-center gap-3.5 px-5 py-4 transition hover:bg-[#fafbfc] sm:px-6 ${
        last ? "" : "border-b border-[#edf0f3]"
      }`}
    >
      <TransactionIcon type={transaction.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[11px] font-bold text-[#1f2937]">
            {transaction.description ||
              formatTransactionType(
                transaction.type
              )}
          </p>

          <span className="hidden h-1 w-1 shrink-0 rounded-full bg-[#d2d7de] sm:block" />

          <span className="hidden shrink-0 text-[8px] text-[#a0a7b2] sm:block">
            {formatTransactionType(transaction.type)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[8px] text-[#a5adb7]">
            {shortId(transaction.id)}
          </span>

          <span className="h-1 w-1 rounded-full bg-[#d6dbe1]" />

          <span className="text-[8px] text-[#a5adb7]">
            {formatDate(transaction.created_at)}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-[11px] font-black ${
            incoming
              ? "text-[#15803d]"
              : "text-[#1f2937]"
          }`}
        >
          {incoming ? "+" : "-"}₦
          {formatMoney(transaction.amount)}
        </p>

        <div className="mt-1.5">
          <TransactionStatus
            status={transaction.status}
          />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* PROTECTION STEPS                                                           */
/* ========================================================================= */

function ProtectionStep({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5">
      <p className="text-[8px] font-bold text-white/35">
        {number}
      </p>

      <p className="mt-1 text-[9px] font-bold text-white/80">
        {label}
      </p>
    </div>
  );
}

/* ========================================================================= */
/* HEALTH ROW                                                                 */
/* ========================================================================= */

function HealthRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            complete
              ? "bg-[#ecfdf3] text-[#15803d]"
              : "bg-[#f4f5f7] text-[#9aa2ae]"
          }`}
        >
          <CheckIcon className="h-2.5 w-2.5" />
        </span>

        <span className="text-[9px] font-semibold text-[#68717e]">
          {label}
        </span>
      </div>

      <span
        className={`text-[8px] font-bold ${
          complete
            ? "text-[#15803d]"
            : "text-[#a0a7b2]"
        }`}
      >
        {complete ? "Complete" : "Pending"}
      </span>
    </div>
  );
}

/* ========================================================================= */
/* SELLER MODAL (BOTTOM SHEET / DIALOG)                                       */
/* ========================================================================= */

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
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0b1e5b]" />

        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0b1e5b]/[0.035]" />
        <div className="pointer-events-none absolute -left-24 top-32 h-44 w-44 rounded-full bg-[#0b1e5b]/[0.025]" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
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
  );
}


/* ========================================================================= */
/* ICON COMPONENTS                                                            */
/* ========================================================================= */

function DashboardIcon({
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
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function WalletIcon({
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
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M4 8h13.5A2.5 2.5 0 0 1 20 10.5V14h-5a2.5 2.5 0 0 1 0-5h5" />
      <circle
        cx="15.5"
        cy="11.5"
        r=".7"
        fill="currentColor"
      />
    </svg>
  );
}

function ReceiptIcon({
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
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h3" />
    </svg>
  );
}

function StoreIcon({
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
    >
      <path d="M4 10v10h16V10" />
      <path d="M3 10 5 4h14l2 6" />
      <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M9 20v-5h6v5" />
    </svg>
  );
}

function ShoppingBagIcon({
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
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function ShieldIcon({
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
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BadgeCheckIcon({
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
    >
      <path d="m12 3 2 2 3-.2.9 2.9 2.6 1.5-1.1 2.8 1.1 2.8-2.6 1.5-.9 2.9-3-.2-2 2-2-2-3 .2-.9-2.9-2.6-1.5 1.1-2.8-1.1-2.8 2.6-1.5.9-2.9 3 .2 2-2Z" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </svg>
  );
}

function UnlockIcon({
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
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 7.7-1.5" />
      <circle cx="12" cy="15.5" r="1" />
    </svg>
  );
}

function PlusIcon({
  className = "h-3.5 w-3.5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ChevronRightIcon({
  className = "h-3.5 w-3.5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon({
  className = "h-3.5 w-3.5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function XIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function UserIcon({
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
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
    </svg>
  );
}

function ListIcon({
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
    >
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

/* ========================================================================= */
/* TRANSACTION ICON                                                           */
/* ========================================================================= */

function TransactionIcon({
  type,
}: {
  type: string;
}) {
  const normalized = type.toLowerCase();

  let classes =
    "bg-[#f1f4f8] text-[#0b1e5b]";

  if (normalized === "deposit") {
    classes =
      "bg-[#ecfdf3] text-[#15803d]";
  } else if (normalized === "withdrawal") {
    classes =
      "bg-[#fff1f2] text-[#dc2626]";
  } else if (
    normalized === "escrow_payment"
  ) {
    classes =
      "bg-[#eef2ff] text-[#4338ca]";
  } else if (
    normalized === "verification_fee"
  ) {
    classes =
      "bg-[#fff8e7] text-[#b45309]";
  }

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${classes}`}
    >
      {normalized === "deposit" ? (
        <ArrowDownIcon />
      ) : normalized === "withdrawal" ? (
        <ArrowUpIcon />
      ) : normalized === "escrow_payment" ? (
        <ShieldIcon />
      ) : normalized === "verification_fee" ? (
        <DocumentIcon />
      ) : (
        <ReceiptIcon />
      )}
    </div>
  );
}

/* ========================================================================= */
/* TRANSACTION STATUS                                                         */
/* ========================================================================= */

function TransactionStatus({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const completed = normalized === "completed";
  const pending = normalized === "pending";
  const failed =
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "canceled";

  const classes = completed
    ? "bg-[#ecfdf3] text-[#15803d]"
    : pending
    ? "bg-[#fff8e7] text-[#b45309]"
    : failed
    ? "bg-[#fff1f2] text-[#dc2626]"
    : "bg-[#f1f3f5] text-[#66707d]";

  const dot = completed
    ? "bg-[#22c55e]"
    : pending
    ? "bg-[#f59e0b]"
    : failed
    ? "bg-[#ef4444]"
    : "bg-[#9ca3af]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-bold capitalize ${classes}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot}`}
      />
      {status || "Unknown"}
    </span>
  );
}

/* ========================================================================= */
/* ARROWS                                                                     */
/* ========================================================================= */

function ArrowDownIcon({
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
    >
      <path d="M12 4v15" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}

function ArrowUpIcon({
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
    >
      <path d="M12 20V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function DocumentIcon({
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
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}



/* ========================================================================= */
/* HELPERS                                                                    */
/* ========================================================================= */

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortId(id: string): string {
  if (!id || id.length <= 14) {
    return id || "Unknown";
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function isIncoming(type: string): boolean {
  return [
    "deposit",
    "refund",
    "sale",
    "escrow_release",
    "credit",
  ].includes(type.toLowerCase());
}

function formatTransactionType(
  type: string
): string {
  switch (type.toLowerCase()) {
    case "deposit":
      return "Wallet Deposit";

    case "withdrawal":
      return "Withdrawal";

    case "escrow_payment":
      return "Escrow Payment";

    case "verification_fee":
      return "Verification Fee";

    case "refund":
      return "Refund";

    case "purchase":
      return "Purchase";

    case "sale":
      return "Sale";

    case "escrow_release":
      return "Escrow Release";

    default:
      return type
        .split("_")
        .filter(Boolean)
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ");
  }
}