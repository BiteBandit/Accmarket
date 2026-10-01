"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
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

export default function DashboardPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData>({ escrow_balance: 0, available_balance: 0 });
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Slide-in drawer & modal states
  const [showPlatformDrawer, setShowPlatformDrawer] = useState(false);
  const [sellerPromptModal, setSellerPromptModal] = useState(false);
  const [mailsOpen, setMailsOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    let channel: any;

        async function loadDashboardData() {
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

        // Included 'id' in the select query so profileData.id is valid
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, email, role, kyc_status, trust_score, is_active")
          .eq("id", userId)
          .maybeSingle();

        // Check if user is deactivated
        if (profileData && profileData.is_active === false) {
          await supabase.auth.signOut();
          router.push("/login?error=account_deactivated");
          return;
        }

        if (profileData) {
          setProfile({
            id: profileData.id || user.id,
            ...profileData,
            email: profileData.email || userEmail,
            trust_score: profileData.trust_score ?? 60,
            is_active: profileData.is_active ?? true,
          } as unknown as UserProfile);
        } else {
          setProfile({
            id: user.id,
            username: userEmail.split("@")[0] || "User",
            email: userEmail,
            role: "Buyer",
            kyc_status: "Unverified",
            trust_score: 0,
            is_active: true,
          } as unknown as UserProfile);
        }

        const { data: walletData } = await supabase
          .from("wallets")
          .select("escrow_balance, available_balance")
          .eq("user_id", userId)
          .maybeSingle();

        if (walletData) {
          setWallet({
            escrow_balance: Number(walletData.escrow_balance) || 0,
            available_balance: Number(walletData.available_balance) || 0,
          });
        }

        const { count: pCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("buyer_id", userId);

        if (pCount !== null) setPurchasesCount(pCount);

        const { count: sCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", userId);

        if (sCount !== null) setSalesCount(sCount);

        const { data: txData } = await supabase
          .from("transactions")
          .select("id, type, amount, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (txData) {
          const formattedTransactions = txData.map((tx) => ({
            ...tx,
            amount: Number(tx.amount) || 0,
          }));
          setTransactions(formattedTransactions);
        }

        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false);

        if (unreadCount !== null && unreadCount > 0) {
          setHasUnread(true);
        }

        // Setup Realtime listener for profile changes (specifically is_active status)
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
          )
          .subscribe();

      } catch (err) {
        console.error("Unexpected error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }


    loadDashboardData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfdfc] text-sm font-medium text-[#6b7280]">
        Loading dashboard...
      </div>
    );
  }

  const displayName = profile?.username?.trim() || profile?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  const isSellerOrVendor = 
    profile?.role?.toLowerCase() === "seller" || 
    profile?.role?.toLowerCase() === "vendor" || 
    profile?.role?.toLowerCase() === "admin";

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
          MAIN CONTENT
      ========================== */}
      <div className="lg:pl-[250px]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">

          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-[#6b7280]">
                Welcome back, <span className="text-[#111111] font-semibold">{displayName}</span> 👋
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#111111] sm:text-3xl">
                Dashboard
              </h1>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPlatformDrawer(true)}
                className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition hover:border-[#0b1e5b]"
              >
                Browse Market
              </button>
              <button
                onClick={handleListAccountClick}
                className="rounded-xl bg-[#0b1e5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#162d78]"
              >
                List Account to Sell
              </button>
            </div>
          </div>

          {/* =========================
              STATS GRID
          ========================== */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#6b7280]">Escrow Balance</p>
                  <h2 className="mt-2 text-2xl font-black text-[#111111]">
                    ₦{wallet.escrow_balance.toLocaleString()}
                  </h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                  <WalletIcon />
                </div>
              </div>
              <Link href="/dashboard/wallet" className="mt-5 block text-xs font-bold text-[#0b1e5b] hover:underline">
                View escrow details →
              </Link>
            </DashboardCard>

            <DashboardCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#6b7280]">Available Balance</p>
                  <h2 className="mt-2 text-2xl font-black text-emerald-600">
                    ₦{wallet.available_balance.toLocaleString()}
                  </h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <WalletIcon />
                </div>
              </div>
              <Link href="/dashboard/wallet" className="mt-5 block text-xs font-bold text-[#0b1e5b] hover:underline">
                Withdraw funds →
              </Link>
            </DashboardCard>

            <DashboardCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#6b7280]">Total Purchases</p>
                  <h2 className="mt-2 text-2xl font-black text-[#111111]">{purchasesCount}</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                  <ShoppingIcon />
                </div>
              </div>
              <p className="mt-5 text-xs text-[#9ca3af]">Accounts bought as buyer</p>
            </DashboardCard>

            {isSellerOrVendor && (
              <DashboardCard>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#6b7280]">Total Sales</p>
                    <h2 className="mt-2 text-2xl font-black text-[#111111]">{salesCount}</h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                    <ChartIcon />
                  </div>
                </div>
                <p className="mt-5 text-xs text-[#9ca3af]">Listings sold as vendor</p>
              </DashboardCard>
            )}

            {isSellerOrVendor && (
              <DashboardCard>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#6b7280]">Trust Score</p>
                    <h2 className="mt-2 text-2xl font-black text-[#0b1e5b]">
                      {profile?.trust_score ?? 60}<span className="text-sm font-bold text-[#9ca3af]">/100</span>
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                    <ShieldIcon />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600">
                    {((profile?.trust_score ?? 60) >= 80) ? "● Excellent Standing" : "● Standard Standing"}
                  </span>
                  <Link href="/dashboard/settings" className="font-bold text-[#0b1e5b] hover:underline">
                    Details →
                  </Link>
                </div>
              </DashboardCard>
            )}
          </div>

          {/* =========================
              QUICK ACTIONS
          ========================== */}
               <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#111111]">Quick Actions</h2>
              <p className="mt-1 text-xs text-[#9ca3af]">Shortcuts for buyers and sellers</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
              <button
                onClick={() => setShowPlatformDrawer(true)}
                className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0b1e5b]/30 hover:shadow-md text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                  <ShoppingIcon />
                </div>
                <span className="text-xs font-bold text-[#111111] leading-tight">
                  Browse Marketplace
                </span>
              </button>

              <button
                onClick={handleListAccountClick}
                className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0b1e5b]/30 hover:shadow-md text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                  <ChartIcon />
                </div>
                <span className="text-xs font-bold text-[#111111] leading-tight">
                  List an Account
                </span>
              </button>

              <QuickAction href="/dashboard/messages" icon={<MessageIcon />} title="Active Chats" />
              <QuickAction href="/dashboard/wallet" icon={<WalletIcon />} title="Escrow & Funds" />
              <QuickAction href="/dashboard/api" icon={<ApiIcon />} title="API & Access" />
            </div>
          </section>

          {/* =========================
              MAIN GRID: TRANSACTIONS & STATUS
          ========================== */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5">
                <div>
                  <h2 className="text-base font-bold text-[#111111]">Recent Activity & Orders</h2>
                  <p className="mt-1 text-xs text-[#9ca3af]">Track your active purchases and sales escrow status</p>
                </div>
                <Link href="/dashboard/transactions" className="text-xs font-bold text-[#0b1e5b] hover:underline">
                  View all
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f4f6] text-[#9ca3af]">
                    <TransactionIcon />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#111111]">No active orders found</h3>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[#9ca3af]">
                    When you buy or sell accounts on escrow, the transaction records appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#e5e7eb]">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-xs font-bold capitalize text-[#111111]">{tx.type}</p>
                        <p className="text-[11px] text-[#9ca3af]">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#111111]">₦{tx.amount.toLocaleString()}</p>
                        <span className="text-[10px] font-semibold uppercase text-emerald-600">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl bg-[#0b1e5b] p-6 text-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Escrow Protected
                  </span>
                  <h2 className="mt-4 text-xl font-bold tracking-tight">Safe Trading Guaranteed</h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/70">
                    Funds are safely locked in escrow until account details are verified and delivered.
                  </p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/80">
                  <span>Support Status</span>
                  <span className="font-semibold text-emerald-400">● 24/7 Active</span>
                </div>
              </section>

              <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.025)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#111111]">Profile & KYC Status</h2>
                    <p className="mt-1 text-xs text-[#9ca3af]">
                      {profile?.kyc_status === "verified" ? "Vendor Verified" : "Identity verification required"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                    profile?.kyc_status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}>
                    {profile?.kyc_status || "Unverified"}
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div className="h-full rounded-full bg-[#0b1e5b] transition-all" style={{ width: profile?.kyc_status === "verified" ? "100%" : "50%" }} />
                </div>

                <Link href="/dashboard/settings" className="mt-4 block text-xs font-bold text-[#0b1e5b] hover:underline">
                  Manage account settings →
                </Link>
              </section>
            </div>
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
          <BottomNav href="/dashboard" icon={<DashboardIcon />} label="Home" active />
          
          <button
            onClick={() => setShowPlatformDrawer(true)}
            className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-[#9ca3af] transition hover:text-[#0b1e5b]"
          >
            <MarketplaceIcon />
            Market
          </button>

          <BottomNav href="/dashboard/messages" icon={<MessageIcon />} label="Chat" />
          <BottomNav href="/dashboard/notifications" icon={<BellIcon hasUnread={hasUnread} />} label="Notification" />
          <BottomNav href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" />
        </div>
      </div>

    </main>
  );
}

/* =========================================
   COMPONENTS & SVG ICONS
========================================= */

function DashboardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.025)] transition hover:border-[#0b1e5b]/20">
      {children}
    </div>
  );
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

function QuickAction({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0b1e5b]/30 hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
        {icon}
      </div>
      <span className="text-xs font-bold text-[#111111] leading-tight">{title}</span>
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
function TransactionIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" /></svg>;
}
function ShoppingIcon() {
  return <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 11.5a2 2 0 002 1.5h8.8a2 2 0 001.9-1.4L22 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>;
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