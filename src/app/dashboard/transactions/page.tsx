"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  X as XIcon, 
  Shield as ShieldIcon, 
  ShieldCheck as ShieldCheckIcon,
  CheckCircle as CheckCircleIcon,
  ArrowRight as ArrowRightIcon,
  User as UserIcon, 
  List as ListIcon, 
  Wallet as WalletIcon, 
  ChevronRight as ChevronRightIcon 
} from "lucide-react";


import {
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileMenuDrawer,
  BottomNav,
} from "@/components/navigation";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: string | number;
  status: string;
  created_at: string;
  description?: string | null;
}

interface UserProfile {
  username: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

const ITEMS_PER_PAGE = 6;

export default function TransactionsPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [sellerPromptModal, setSellerPromptModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, email, role, avatar_url, is_active")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profileData?.is_active === false) {
          await supabase.auth.signOut();
          router.replace("/login?error=account_deactivated");
          return;
        }

        setProfile({
          username: profileData?.username || "User",
          email: profileData?.email || user.email || "",
          role: profileData?.role || "buyer",
          avatar_url: profileData?.avatar_url || null,
        });

        const { count } = await supabase
          .from("notifications")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (mounted) {
          setHasUnread((count || 0) > 0);
        }

        const { data: transactionData, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error("Failed to load transactions:", error);
        }

        if (mounted) {
          setTransactions(transactionData || []);
        }

        const channel = supabase
          .channel(`transactions-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "transactions",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return;

              if (payload.eventType === "INSERT") {
                setTransactions((current) => {
                  const incoming = payload.new as Transaction;

                  if (current.some((item) => item.id === incoming.id)) {
                    return current;
                  }

                  return [incoming, ...current];
                });
              }

              if (payload.eventType === "UPDATE") {
                setTransactions((current) =>
                  current
                    .map((item) =>
                      item.id === payload.new.id
                        ? (payload.new as Transaction)
                        : item
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                );
              }

              if (payload.eventType === "DELETE") {
                setTransactions((current) =>
                  current.filter((item) => item.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Transactions page error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const cleanupPromise = loadPage();

    return () => {
      mounted = false;

      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
    };
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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

    setSellerPromptModal(true);
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const description =
        transaction.description?.toLowerCase() || "";

      const type = transaction.type?.toLowerCase() || "";
      const status = transaction.status?.toLowerCase() || "";
      const id = transaction.id?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        description.includes(query) ||
        type.includes(query) ||
        status.includes(query) ||
        id.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter.toLowerCase();

      const matchesType =
        typeFilter === "all" ||
        type === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [
    transactions,
    searchQuery,
    statusFilter,
    typeFilter,
  ]);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const stats = useMemo(() => {
    const completed = transactions.filter(
      (transaction) =>
        transaction.status.toLowerCase() === "completed"
    );

    const pending = transactions.filter(
      (transaction) =>
        transaction.status.toLowerCase() === "pending"
    );

    const completedVolume = completed.reduce(
      (total, transaction) =>
        total + safeAmount(transaction.amount),
      0
    );

    return {
      total: transactions.length,
      completed: completed.length,
      pending: pending.length,
      volume: completedVolume,
    };
  }, [transactions]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const navProfile = {
    username: profile?.username || "User",
    email: profile?.email || "",
    avatar_url: profile?.avatar_url || null,
  };

        if (loading) {
    return (
      <div className="accmarket-grid min-h-screen bg-[#fdfdfc]">
        <div className="hidden lg:block">
          <DesktopSidebar
            profile={navProfile}
            onSignOut={handleSignOut}
            onListAccountClick={handleListAccountClick}
          />
        </div>

        <div className="lg:pl-[260px]">
          <div className="hidden lg:block">
            <DesktopHeader
              profile={navProfile}
              hasUnread={hasUnread}
              sectionLabel="Account"
              pageTitle="Transactions" 
            />
          </div>

          <div className="lg:hidden">
            <MobileHeader
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </div>

          <main className="px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-10 lg:pt-24">
            <div className="mx-auto max-w-[1320px]">
              
              {/* PAGE HEADER SKELETON */}
              <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="h-3 w-32 animate-pulse rounded bg-[#e9edf3]" />
                  <div className="mt-2.5 h-8 w-56 animate-pulse rounded-xl bg-[#e3e7ec]" />
                  <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-[#edf0f4]" />
                </div>
              </section>

              {/* STAT STRIP SKELETON */}
              <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#e4e8ed] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-9 w-9 animate-pulse rounded-xl bg-[#f0f3f8]" />
                      <div className="h-3 w-16 animate-pulse rounded bg-[#f0f3f8]" />
                    </div>
                    <div className="mt-4 h-3 w-24 animate-pulse rounded bg-[#edf0f4]" />
                    <div className="mt-2 h-6 w-32 animate-pulse rounded-lg bg-[#e3e7ec]" />
                  </div>
                ))}
              </section>

              {/* TRANSACTIONS PANEL SKELETON */}
              <section className="mt-5 overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
                
                {/* TOOLBAR SKELETON */}
                <div className="border-b border-[#e8ebef] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="h-10 w-full xl:max-w-[390px] animate-pulse rounded-xl bg-[#fafbfc] border border-[#e0e4e9]" />
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <div className="h-10 w-full sm:w-[140px] animate-pulse rounded-xl bg-white border border-[#e0e4e9]" />
                      <div className="h-10 w-full sm:w-[140px] animate-pulse rounded-xl bg-white border border-[#e0e4e9]" />
                    </div>
                  </div>
                </div>

                {/* DESKTOP TABLE HEADER SKELETON */}
                <div className="hidden grid-cols-[minmax(260px,2.2fr)_1.1fr_1fr_1fr_1.2fr] items-center border-b border-[#e8ebef] bg-[#fafbfc] px-6 py-3 lg:grid">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#e3e7ec]" />
                  <div className="h-3 w-12 animate-pulse rounded bg-[#e3e7ec]" />
                  <div className="h-3 w-16 animate-pulse rounded bg-[#e3e7ec]" />
                  <div className="h-3 w-14 animate-pulse rounded bg-[#e3e7ec]" />
                  <div className="h-3 w-12 animate-pulse rounded bg-[#e3e7ec]" />
                </div>

                {/* ROWS SKELETON (Desktop & Mobile structural match) */}
                <div>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid min-h-[78px] grid-cols-1 lg:grid-cols-[minmax(260px,2.2fr)_1.1fr_1fr_1fr_1.2fr] items-center border-b border-[#edf0f3] px-4 lg:px-6 py-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-[#f1f4f8]" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 w-48 animate-pulse rounded bg-[#e3e7ec]" />
                          <div className="h-2.5 w-28 animate-pulse rounded bg-[#edf0f4]" />
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        <div className="h-3 w-20 animate-pulse rounded bg-[#edf0f4]" />
                      </div>
                      <div className="hidden lg:block">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-[#e3e7ec]" />
                      </div>
                      <div className="hidden lg:block">
                        <div className="h-5 w-20 animate-pulse rounded-full bg-[#f1f3f5]" />
                      </div>
                      <div className="hidden lg:block space-y-1.5">
                        <div className="h-3 w-24 animate-pulse rounded bg-[#edf0f4]" />
                        <div className="h-2.5 w-14 animate-pulse rounded bg-[#f0f1f3]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* PAGINATION FOOTER SKELETON */}
                <div className="flex items-center justify-between border-t border-[#e8ebef] bg-[#fafbfc] px-4 py-3 sm:px-6">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#edf0f4]" />
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-16 animate-pulse rounded-lg bg-[#d5dce7]" />
                    <div className="h-8 w-16 animate-pulse rounded-lg bg-[#d5dce7]" />
                  </div>
                </div>

              </section>

            </div>
          </main>
        </div>

        <BottomNav hasUnread={hasUnread} />
      </div>
    );
  }


  return (
      <div className="accmarket-grid min-h-screen bg-[#fdfdfc]">
      <div className="hidden lg:block">
        <DesktopSidebar
          profile={navProfile}
          onSignOut={handleSignOut}
          onListAccount={handleListAccountClick}
        />
      </div>

      <div className="lg:pl-[260px]">
        <div className="hidden lg:block">
          <DesktopHeader
            profile={navProfile}
            hasUnread={hasUnread}
            sectionLabel="Account"
  pageTitle="Transactions" 
          />
        </div>

        <div className="lg:hidden">
          <MobileHeader
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </div>

        <main className="px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-10 lg:pt-24">
          <div className="mx-auto max-w-[1320px]">
            {/* PAGE HEADER */}

            <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a93a1]">
                  <ReceiptIcon className="h-3.5 w-3.5" />
                  Account activity
                </div>

                <h1 className="mt-2 text-[26px] font-black tracking-[-0.035em] text-[#111827] sm:text-[30px]">
                  Transactions
                </h1>

                <p className="mt-1.5 max-w-[580px] text-xs leading-5 text-[#6b7280]">
                  View your wallet activity, escrow payments,
                  verification fees and other account transactions.
                </p>
              </div>
            </section>

            {/* STAT STRIP - Mixed white and dark blue cards */}

            <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Total transactions"
                value={stats.total.toLocaleString()}
                icon={<ReceiptIcon />}
                theme="dark"
              />

              <StatCard
                label="Completed"
                value={stats.completed.toLocaleString()}
                icon={<CheckIcon />}
                tone="success"
                theme="dark"
              />

              <StatCard
                label="Completed volume"
                value={`₦${formatMoney(stats.volume)}`}
                icon={<WalletIcon />}
                wide
                theme="light"
              />
            </section>

            {/* TRANSACTIONS PANEL */}

            <section className="mt-5 overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
              {/* TOOLBAR */}

              <div className="border-b border-[#e8ebef] p-3 sm:p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  {/* SEARCH */}

                  <div className="relative w-full xl:max-w-[390px]">
                    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa2ae]" />

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search transactions..."
                      className="h-10 w-full rounded-xl border border-[#e0e4e9] bg-[#fafbfc] pl-10 pr-10 text-xs font-medium text-[#111827] outline-none transition placeholder:text-[#a2a9b3] focus:border-[#0b1e5b]/30 focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/[0.04]"
                    />

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-[#9aa2ae] transition hover:bg-[#eef1f5] hover:text-[#111827]"
                        aria-label="Clear search"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* FILTERS */}

                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <FilterSelect
                      value={typeFilter}
                      onChange={setTypeFilter}
                      options={[
                        { value: "all", label: "All types" },
                        {
                          value: "deposit",
                          label: "Deposits",
                        },
                        {
                          value: "withdrawal",
                          label: "Withdrawals",
                        },
                        {
                          value: "escrow_payment",
                          label: "Escrow",
                        },
                        {
                          value: "verification_fee",
                          label: "Verification",
                        },
                      ]}
                    />

                    <FilterSelect
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: "all", label: "All status" },
                        {
                          value: "completed",
                          label: "Completed",
                        },
                        {
                          value: "pending",
                          label: "Pending",
                        },
                        {
                          value: "failed",
                          label: "Failed",
                        },
                      ]}
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 flex items-center justify-between border-t border-[#f0f2f4] pt-3">
                    <p className="text-[10px] font-medium text-[#8a93a1]">
                      Showing{" "}
                      <span className="font-bold text-[#374151]">
                        {filteredTransactions.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-[#374151]">
                        {transactions.length}
                      </span>{" "}
                      transactions
                    </p>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[10px] font-bold text-[#0b1e5b] transition hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {/* TABLE HEADER */}

              {paginatedTransactions.length > 0 && (
                <div className="hidden grid-cols-[minmax(260px,2.2fr)_1.1fr_1fr_1fr_1.2fr] items-center border-b border-[#e8ebef] bg-[#fafbfc] px-6 py-3 lg:grid">
                  <p className="table-heading">
                    Transaction
                  </p>
                  <p className="table-heading">Type</p>
                  <p className="table-heading">Amount</p>
                  <p className="table-heading">Status</p>
                  <p className="table-heading">Date</p>
                </div>
              )}

              {/* EMPTY STATE */}

              {paginatedTransactions.length === 0 ? (
                <EmptyState
                  hasFilters={hasActiveFilters}
                  onClear={clearFilters}
                />
              ) : (
                <>
                  {/* DESKTOP LEDGER */}

                  <div className="hidden lg:block">
                    {paginatedTransactions.map((transaction) => (
                      <DesktopTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </div>

                  {/* MOBILE LEDGER */}

                  <div className="lg:hidden">
                    {paginatedTransactions.map((transaction) => (
                      <MobileTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* PAGINATION CONTROLS */}
                  {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#e8ebef] bg-[#fafbfc] px-4 py-3 sm:px-6">
                  <div className="text-[10px] font-medium text-[#6b7280]">
                    Page <span className="font-bold text-[#111827]">{currentPage}</span> of{" "}
                    <span className="font-bold text-[#111827]">{totalPages}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d5dce7] bg-white px-3 text-[11px] font-semibold text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d5dce7] bg-white px-3 text-[11px] font-semibold text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* FOOTER */}

            <div className="mt-4 flex flex-col gap-2 px-1 text-[10px] text-[#9aa2ae] sm:flex-row sm:items-center sm:justify-between">
              <p>
                {filteredTransactions.length > 0
                  ? `Showing item ${(currentPage - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredTransactions.length
                    )} of ${filteredTransactions.length} transactions`
                  : "No transactions to display"}
              </p>

              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live transaction updates
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE MENU */}

      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

      <BottomNav hasUnread={hasUnread} />

      {/* SELLER ACCESS MODAL */}
      {sellerPromptModal && (
        <SellerAccessModal
          profile={profile}
          onClose={() => setSellerPromptModal(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                   */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
  tone = "default",
  wide = false,
  theme = "light",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning";
  wide?: boolean;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  const iconClass = isDark
    ? "bg-white/10 text-white"
    : tone === "success"
    ? "bg-[#ecfdf3] text-[#15803d]"
    : tone === "warning"
    ? "bg-[#fff8e7] text-[#b45309]"
    : "bg-[#f0f3f8] text-[#0b1e5b]";

  return (
    <div
      className={`group rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition hover:-translate-y-[1px] ${
        isDark
          ? "border-[#0b1e5b] bg-[#0b1e5b] text-white hover:border-[#14286d]"
          : "border-[#e4e8ed] bg-white text-[#111827] hover:border-[#d8dde5]"
      } ${wide ? "col-span-2 lg:col-span-1" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span
          className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
            isDark ? "text-white/60" : "text-[#a0a7b2]"
          }`}
        >
          AccMarket
        </span>
      </div>

      <p
        className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.08em] ${
          isDark ? "text-white/70" : "text-[#8b94a0]"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 truncate text-[20px] font-black tracking-[-0.025em] ${
          isDark ? "text-white" : "text-[#111827]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER                                                                      */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-[140px] sm:flex-none">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-[#e0e4e9] bg-white pl-3 pr-9 text-[11px] font-bold text-[#374151] outline-none transition hover:border-[#d3d8df] focus:border-[#0b1e5b]/30 focus:ring-4 focus:ring-[#0b1e5b]/[0.04]"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8d96a3]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DESKTOP TRANSACTION ROW                                                     */
/* -------------------------------------------------------------------------- */

function DesktopTransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const incoming = isIncomingTransaction(transaction.type);

  return (
    <div className="group grid min-h-[78px] grid-cols-[minmax(260px,2.2fr)_1.1fr_1fr_1fr_1.2fr] items-center border-b border-[#edf0f3] px-6 transition-colors last:border-b-0 hover:bg-[#fafbfc]">
      {/* Transaction */}

      <div className="flex min-w-0 items-center gap-3.5 pr-5">
        <TransactionTypeIcon type={transaction.type} />

        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-[#1f2937]">
            {transaction.description ||
              formatType(transaction.type)}
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#9ba3ae]">
              {shortId(transaction.id)}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#d4d9df]" />

            <span className="text-[9px] text-[#a0a7b2]">
              Transaction
            </span>
          </div>
        </div>
      </div>

      {/* Type */}

      <div>
        <span className="text-[11px] font-semibold text-[#5d6673]">
          {formatType(transaction.type)}
        </span>
      </div>

      {/* Amount */}

      <div>
        <p
          className={`text-[12px] font-black ${
            incoming
              ? "text-[#16803c]"
              : "text-[#1f2937]"
          }`}
        >
          {incoming ? "+" : "-"}₦
          {formatMoney(safeAmount(transaction.amount))}
        </p>
      </div>

      {/* Status */}

      <div>
        <StatusBadge status={transaction.status} />
      </div>

      {/* Date */}

      <div>
        <p className="text-[10px] font-semibold text-[#596270]">
          {formatDate(transaction.created_at, "date")}
        </p>

        <p className="mt-1 text-[9px] text-[#a0a7b2]">
          {formatDate(transaction.created_at, "time")}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MOBILE TRANSACTION ROW (Unified Clean Card Style)                           */
/* -------------------------------------------------------------------------- */

function MobileTransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const incoming = isIncomingTransaction(transaction.type);

  return (
    <div className="border-b border-[#edf0f3] bg-white p-4 transition-all hover:bg-[#fafbfc] last:border-b-0 sm:p-5">
      <div className="flex items-start gap-3">
        <TransactionTypeIcon
          type={transaction.type}
          large
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-[#1f2937]">
                {transaction.description ||
                  formatType(transaction.type)}
              </p>

              <p className="mt-1 text-[9px] font-medium text-[#9ca3af]">
                {formatType(transaction.type)}
              </p>
            </div>

            <p
              className={`whitespace-nowrap text-[12px] font-black ${
                incoming
                  ? "text-[#16803c]"
                  : "text-[#1f2937]"
              }`}
            >
              {incoming ? "+" : "-"}₦
              {formatMoney(
                safeAmount(transaction.amount)
              )}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <StatusBadge status={transaction.status} />

            <div className="text-right">
              <p className="text-[9px] font-semibold text-[#69727f]">
                {formatDate(
                  transaction.created_at,
                  "date"
                )}
              </p>

              <p className="mt-0.5 text-[9px] text-[#a0a7b2]">
                {formatDate(
                  transaction.created_at,
                  "time"
                )}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-[8px] text-[#b0b6bf]">
              {transaction.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRANSACTION ICON                                                             */
/* -------------------------------------------------------------------------- */

function TransactionTypeIcon({
  type,
  large = false,
}: {
  type: string;
  large?: boolean;
}) {
  const normalized = type.toLowerCase();

  const isDeposit = normalized === "deposit";
  const isWithdrawal = normalized === "withdrawal";
  const isEscrow = normalized === "escrow_payment";
  const isVerification =
    normalized === "verification_fee";

  let wrapper =
    "bg-[#f1f4f8] text-[#0b1e5b]";

  if (isDeposit) {
    wrapper = "bg-[#ecfdf3] text-[#15803d]";
  } else if (isWithdrawal) {
    wrapper = "bg-[#fff1f2] text-[#dc2626]";
  } else if (isEscrow) {
    wrapper = "bg-[#eef2ff] text-[#4338ca]";
  } else if (isVerification) {
    wrapper = "bg-[#fff8e7] text-[#b45309]";
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${wrapper} ${
        large ? "h-10 w-10" : "h-9 w-9"
      }`}
    >
      {isDeposit ? (
        <ArrowDownIcon />
      ) : isWithdrawal ? (
        <ArrowUpIcon />
      ) : isEscrow ? (
        <ShieldIcon />
      ) : isVerification ? (
        <DocumentIcon />
      ) : (
        <ReceiptIcon />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS                                                                       */
/* -------------------------------------------------------------------------- */

function StatusBadge({
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

  const className = completed
    ? "bg-[#ecfdf3] text-[#15803d]"
    : pending
    ? "bg-[#fff8e7] text-[#b45309]"
    : failed
    ? "bg-[#fff1f2] text-[#dc2626]"
    : "bg-[#f1f3f5] text-[#596270]";

  const dot = completed
    ? "bg-[#22c55e]"
    : pending
    ? "bg-[#f59e0b]"
    : failed
    ? "bg-[#ef4444]"
    : "bg-[#9ca3af]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot}`}
      />

      {status || "Unknown"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                  */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[370px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e3e7ec] bg-[#f8fafc] text-[#0b1e5b]">
        <ReceiptIcon className="h-6 w-6" />

        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#e8edf5]">
          <SearchIcon className="h-2.5 w-2.5 text-[#64748b]" />
        </span>
      </div>

      <h2 className="mt-5 text-[15px] font-black tracking-tight text-[#1f2937]">
        {hasFilters
          ? "No matching transactions"
          : "No transactions yet"}
      </h2>

      <p className="mt-2 max-w-[370px] text-[11px] leading-5 text-[#8b94a0]">
        {hasFilters
          ? "Try changing your search or filters to find the transaction you're looking for."
          : "Your AccMarket wallet and escrow activity will appear here once you make a transaction."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-9 items-center justify-center rounded-xl bg-[#0b1e5b] px-4 text-[10px] font-bold text-white transition hover:bg-[#09184a]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/* SELLER MODAL                                                                 */
/* -------------------------------------------------------------------------- */

function SellerAccessModal({
  profile,
  onClose,
}: {
  profile: UserProfile | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#020617]/55 p-0 backdrop-blur-[6px] sm:items-center sm:p-4"
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
            <Link
              href="/dashboard/settings/upgrade-to-seller"
              onClick={onClose}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0b1e5b] px-5 py-3.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(11,30,91,0.18)] transition-all duration-200 hover:bg-[#09184a] hover:shadow-[0_14px_30px_rgba(11,30,91,0.24)] active:scale-[0.99]"
            >
              Start seller verification

              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </span>
            </Link>

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

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

function safeAmount(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatType(type: string): string {
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

function isIncomingTransaction(type: string): boolean {
  const normalized = type.toLowerCase();

  return [
    "deposit",
    "refund",
    "sale",
    "escrow_release",
    "credit",
  ].includes(normalized);
}

function shortId(id: string): string {
  if (id.length <= 14) return id;

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function formatDate(
  value: string,
  mode: "date" | "time"
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  if (mode === "time") {
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* ICONS                                                                       */
/* -------------------------------------------------------------------------- */

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
      <circle cx="15.5" cy="11.5" r=".7" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ClockIcon({
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SearchIcon({
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
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

function ChevronDownIcon({
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

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

function ArrowLeftIcon({
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}