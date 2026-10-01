"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const categories = [
  "All",
  "Buying",
  "Selling",
  "Payments",
  "Escrow",
  "Security",
  "General",
];

const popularSearches = [
  "Withdrawal",
  "Escrow",
  "Selling",
  "Security",
  "Payments",
];

const categoryIcons: Record<string, React.ReactNode> = {
  All: <GridIcon />,
  Buying: <CartIcon />,
  Selling: <TagIcon />,
  Payments: <WalletIcon />,
  Escrow: <ShieldIcon />,
  Security: <LockIcon />,
  General: <QuestionIcon />,
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey =
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Supabase environment variables are missing.");
          return;
        }

        const supabase = createClient(
          supabaseUrl,
          supabaseAnonKey
        );

        const { data, error } = await supabase
          .from("faqs")
          .select("*");

        if (error) {
          console.error("Error fetching FAQs:", error.message);
          return;
        }

        if (data) {
          setFaqs(data);
        }
      } catch (error) {
        console.error("Unexpected FAQ error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFaqs();
  }, []);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const categoryMatch =
        activeCategory === "All" ||
        faq.category === activeCategory;

      const searchMatch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [activeCategory, search, faqs]);

  const counts = useMemo(() => {
    return categories.reduce<Record<string, number>>(
      (acc, category) => {
        acc[category] =
          category === "All"
            ? faqs.length
            : faqs.filter(
                (faq) => faq.category === category
              ).length;

        return acc;
      },
      {}
    );
  }, [faqs]);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setOpenIndex(null);
  };

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
  

      {/* =========================================================
          NAVBAR
      ========================================================== */}

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fdfdfc]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">

          <Link
            href="/"
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1e5b] text-sm font-black text-white shadow-sm transition group-hover:scale-105">
              A
            </div>

            <span className="text-xl font-black tracking-tight text-[#0b1e5b]">
              AccMarket
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <NavLink href="/" label="Home" />

            <NavLink
              href="/marketplace"
              label="Marketplace"
            />

            <NavLink
              href="/faq"
              label="FAQ"
              active
            />

            <NavLink
              href="/blogs"
              label="Blog"
            />

            <NavLink
              href="/contact"
              label="Contact"
            />

            <Link
              href="/register"
              className="rounded-xl bg-[#0b1e5b] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#162d78]"
            >
              Get Started
            </Link>
          </div>

          <Link
            href="/register"
            className="rounded-xl bg-[#0b1e5b] px-4 py-2 text-sm font-bold text-white md:hidden"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200/70">

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-140px] h-[440px] w-[850px] -translate-x-1/2 rounded-full bg-[#0b1e5b]/[0.055] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-24 lg:py-28">

          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 shadow-sm backdrop-blur">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1e5b] text-white">
              <QuestionIcon />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0b1e5b]">
              Help Center
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
            How can we
            <span className="block text-[#0b1e5b]">
              help you?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Find answers about buying, selling, payments, escrow,
            account security, and using the AccMarket platform.
          </p>

          {/* Search */}
          <div className="mx-auto mt-9 max-w-2xl">

            <div className="group flex h-[62px] items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_20px_50px_rgba(11,30,91,0.08)] transition focus-within:border-[#0b1e5b]/50 focus-within:ring-4 focus-within:ring-[#0b1e5b]/10">

              <SearchIcon className="h-5 w-5 shrink-0 text-[#0b1e5b]" />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOpenIndex(null);
                }}
                placeholder="Search questions, topics, or keywords..."
                className="h-full w-full bg-transparent px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setOpenIndex(null);
                  }}
                  className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Popular */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">

              <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Popular
              </span>

              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearch(term);
                    setOpenIndex(null);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-[#0b1e5b]/30 hover:bg-[#0b1e5b]/5 hover:text-[#0b1e5b]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ WORKSPACE
      ========================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-16">

          {/* =====================================================
              DESKTOP SIDEBAR
          ====================================================== */}

          <aside className="hidden lg:block">

            <div className="sticky top-28">

              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Browse topics
              </p>

              <div className="space-y-1">

                {categories.map((category) => {
                  const active =
                    activeCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setOpenIndex(null);
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                        active
                          ? "bg-[#0b1e5b] text-white shadow-[0_8px_24px_rgba(11,30,91,0.15)]"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >

                      <span className="flex items-center gap-3">

                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-white text-[#0b1e5b] ring-1 ring-slate-200"
                          }`}
                        >
                          {categoryIcons[category]}
                        </span>

                        <span className="text-xs font-bold">
                          {category}
                        </span>

                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {counts[category] ?? 0}
                      </span>

                    </button>
                  );
                })}

              </div>

              {/* Support card */}
              <div className="relative mt-10 overflow-hidden rounded-2xl bg-[#0b1e5b] p-6 text-white">

                <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/[0.06]" />

                <div className="relative">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <MessageIcon />
                  </div>

                  <h3 className="mt-5 text-sm font-black">
                    Can't find an answer?
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-white/60">
                    Contact our support team if you need help with
                    something specific.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11px] font-bold text-[#0b1e5b] transition hover:bg-slate-100"
                  >
                    Contact support
                    <span>→</span>
                  </Link>

                </div>
              </div>

            </div>
          </aside>

          {/* =====================================================
              MAIN CONTENT
          ====================================================== */}

          <div className="min-w-0">

            {/* Mobile categories */}
            <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-2 lg:hidden">

              {categories.map((category) => {
                const active =
                  activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category);
                      setOpenIndex(null);
                    }}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold ${
                      active
                        ? "bg-[#0b1e5b] text-white"
                        : "border border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {category}

                    <span
                      className={
                        active
                          ? "text-white/60"
                          : "text-slate-400"
                      }
                    >
                      {counts[category] ?? 0}
                    </span>
                  </button>
                );
              })}

            </div>

            {/* Results header */}
            <div className="mb-7 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0b1e5b]">
                  {activeCategory === "All"
                    ? "Knowledge base"
                    : activeCategory}
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Frequently asked questions
                </h2>
              </div>

              <div className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500">
                {filteredFaqs.length}{" "}
                {filteredFaqs.length === 1
                  ? "answer"
                  : "answers"}
              </div>

            </div>

            {/* =================================================
                LOADING
            ================================================== */}

            {loading ? (
              <div className="space-y-3">

                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="animate-pulse space-y-3">

                      <div className="h-5 w-20 rounded bg-slate-100" />

                      <div className="h-5 w-3/4 rounded bg-slate-100" />

                      <div className="h-3 w-1/3 rounded bg-slate-100" />

                    </div>
                  </div>
                ))}

              </div>

            ) : filteredFaqs.length > 0 ? (

              /* =================================================
                 FAQ LIST
              ================================================== */

              <div className="space-y-3">

                {filteredFaqs.map((faq, index) => {

                  const isOpen =
                    openIndex === index;

                  return (
                    <article
                      key={
                        faq.id ||
                        `${faq.category}-${faq.question}`
                      }
                      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                        isOpen
                          ? "border-[#0b1e5b]/25 shadow-[0_12px_40px_rgba(11,30,91,0.07)]"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >

                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenIndex(
                            isOpen ? null : index
                          )
                        }
                        className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-7 sm:py-6"
                      >

                        <div className="min-w-0">

                          <span className="mb-2 inline-flex rounded-md bg-[#0b1e5b]/5 px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#0b1e5b]">
                            {faq.category}
                          </span>

                          <h3
                            className={`text-sm font-bold leading-6 sm:text-base ${
                              isOpen
                                ? "text-[#0b1e5b]"
                                : "text-slate-900"
                            }`}
                          >
                            {faq.question}
                          </h3>

                        </div>

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            isOpen
                              ? "rotate-180 bg-[#0b1e5b] text-white"
                              : "bg-slate-100 text-[#0b1e5b]"
                          }`}
                        >
                          <ChevronIcon />
                        </span>

                      </button>

                      {/* Answer */}
                      <div
                        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >

                        <div className="min-h-0 overflow-hidden">

                          <div className="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-7">

                            <p className="max-w-3xl text-sm leading-7 text-slate-500">
                              {faq.answer}
                            </p>

                          </div>

                        </div>

                      </div>

                    </article>
                  );
                })}

              </div>

            ) : (

              /* =================================================
                 EMPTY STATE
              ================================================== */

                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1e5b]/5 text-[#0b1e5b]">
                  <SearchIcon />
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-950">
                  No answers found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  We couldn't find anything matching your search.
                  Try a different keyword or browse another category.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 rounded-xl bg-[#0b1e5b] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#162d78]"
                >
                  Clear search
                </button>

              </div>
            )}

          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}

      <section className="px-5 pb-16 sm:px-8 lg:px-12">

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#0b1e5b] px-7 py-12 text-center sm:px-12 lg:py-14">

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            AccMarket Support
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Still have a question?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
            If you couldn't find what you were looking for, send
            our support team a message and we'll help you out.
          </p>

          <Link
            href="/contact"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0b1e5b] transition hover:bg-slate-100"
          >
            Contact support
            <span>→</span>
          </Link>

        </div>

      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">

          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <Link
                href="/"
                className="text-xl font-black tracking-tight text-[#0b1e5b]"
              >
                AccMarket
              </Link>

              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                A marketplace built to make digital account
                transactions more structured and transparent.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">

              <Link
                href="/"
                className="transition hover:text-[#0b1e5b]"
              >
                Home
              </Link>

              <Link
                href="/marketplace"
                className="transition hover:text-[#0b1e5b]"
              >
                Marketplace
              </Link>

              <Link
                href="/faq"
                className="font-bold text-[#0b1e5b]"
              >
                FAQ
              </Link>

              <Link
                href="/blogs"
                className="transition hover:text-[#0b1e5b]"
              >
                Blog
              </Link>

              <Link
                href="/contact"
                className="transition hover:text-[#0b1e5b]"
              >
                Contact
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-[#0b1e5b]"
              >
                Terms
              </Link>

              <Link
                href="/privacy"
                className="transition hover:text-[#0b1e5b]"
              >
                Privacy
              </Link>

            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {new Date().getFullYear()} AccMarket. All rights reserved.
            </p>

            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>

          </div>

        </div>

      </footer>
    </main>
  );
}

/* ===============================================================
   NAV LINK
=============================================================== */

function NavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition ${
        active
          ? "font-bold text-[#0b1e5b]"
          : "text-slate-600 hover:text-[#0b1e5b]"
      }`}
    >
      {label}
    </Link>
  );
}

/* ===============================================================
   ICONS
=============================================================== */

function GridIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.8a2 2 0 001.9-1.4L21 8H7"
      />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13l-7 7-9-9V4h7l9 9z"
      />
      <circle cx="8" cy="8" r="1.2" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8h16"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 14h2"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-3 8.1-7 10-4-1.9-7-5.5-7-10V6l7-3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-4 w-4"
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
        strokeLinejoin="round"
        d="M8 10V7a4 4 0 018 0v3"
      />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M9.8 9a2.4 2.4 0 114.4 1.3c-.8 1-2.2 1.2-2.2 2.7"
      />
      <path
        strokeLinecap="round"
        d="M12 16.5h.01"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11.5a7.5 7.5 0 01-8 7.5 8.7 8.7 0 01-3.2-.6L4 20l1.3-3.8A7.3 7.3 0 014 11.5 7.5 7.5 0 0112 4a7.5 7.5 0 018 7.5z"
      />
    </svg>
  );
}

function SearchIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path
        strokeLinecap="round"
        d="M16.5 16.5L21 21"
      />
    </svg>
  );
}

function ChevronIcon() {
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
        d="M6 9l6 6 6-6"
      />
    </svg>
  );
}