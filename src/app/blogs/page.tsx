"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url: string;
  video_url: string;
  author: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching blogs:", error);
        } else if (data) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [supabase]);

  const filteredPosts = posts.filter((post) => {
    const query = searchTerm.toLowerCase().trim();

    if (!query) return true;

    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author?.toLowerCase().includes(query)
    );
  });

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <main className="accmarket-grid flex min-h-screen flex-col bg-[#fdfdfc] text-[#111111]">
      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="sticky top-0 z-50 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0b1e5b] text-xs font-black text-white shadow-sm transition duration-300 group-hover:scale-105">
              A
            </span>

            <span className="text-[17px] font-black tracking-tight text-[#0b1e5b]">
              AccMarket
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <NavLink href="/" label="Home" />
            <NavLink href="/marketplace" label="Marketplace" />
            <NavLink href="/faq" label="FAQ" />

            <Link
              href="/blogs"
              className="text-sm font-bold text-[#0b1e5b]"
            >
              Blogs
            </Link>

            <NavLink href="/contact" label="Contact" />

            <div className="ml-1 h-5 w-px bg-[#e5e7eb]" />

            <Link
              href="/login"
              className="text-sm font-semibold text-[#6b7280] transition hover:text-[#0b1e5b]"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-[#0b1e5b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,30,91,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#162d78]"
            >
              Get Started
            </Link>
          </div>

          <Link
            href="/register"
            className="rounded-xl bg-[#0b1e5b] px-4 py-2.5 text-sm font-bold text-white md:hidden"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-[#e5e7eb]">
        <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-[#0b1e5b]/[0.055] blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-20 lg:pb-16">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#0b1e5b]/10 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0b1e5b] shadow-sm backdrop-blur">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1e5b] text-white">
              <BookIcon />
            </span>

            Insights & Updates
          </div>

          <h1 className="text-4xl font-black tracking-[-0.04em] text-[#111111] sm:text-5xl lg:text-6xl">
            Learn more.
            <span className="block text-[#0b1e5b]">
              Trade smarter.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#6b7280] sm:text-base">
            Guides, insights, security tips, marketplace updates, and
            useful information to help you navigate AccMarket.
          </p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#9ca3af]">
                <SearchIcon />
              </div>

              <input
                type="text"
                placeholder="Search articles, guides, security..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search articles"
                className="h-14 w-full rounded-2xl border border-[#e5e7eb] bg-white pl-12 pr-5 text-sm font-medium text-[#111111] shadow-[0_12px_35px_rgba(11,30,91,0.06)] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b]/30 focus:ring-4 focus:ring-[#0b1e5b]/[0.05]"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6b7280] transition hover:bg-[#e5e7eb] hover:text-[#111111]"
                  aria-label="Clear search"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            {!loading && (
              <div className="mt-3 text-left text-xs font-medium text-[#9ca3af]">
                {searchTerm
                  ? `${filteredPosts.length} ${
                      filteredPosts.length === 1
                        ? "article"
                        : "articles"
                    } found`
                  : `${posts.length} ${
                      posts.length === 1 ? "article" : "articles"
                    } available`}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          LOADING SKELETON
      ========================================================= */}
      {loading && <BlogSkeleton />}

      {/* =========================================================
          EMPTY STATE
      ========================================================= */}
      {!loading && posts.length === 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-[0_12px_40px_rgba(11,30,91,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1e5b]/[0.06] text-[#0b1e5b]">
              <BookIcon large />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#111111]">
              No articles yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b7280]">
              We haven't published any articles yet. Check back soon
              for guides, updates, and useful insights.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0b1e5b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#162d78]"
            >
              Back to Home
              <ArrowRightIcon />
            </Link>
          </div>
        </section>
      )}

      {/* =========================================================
          SEARCH EMPTY STATE
      ========================================================= */}
      {!loading &&
        posts.length > 0 &&
        searchTerm &&
        filteredPosts.length === 0 && (
          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-[#e5e7eb] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f4f6] text-[#6b7280]">
                <SearchIcon large />
              </div>

              <h2 className="mt-5 text-xl font-black text-[#111111]">
                No matching articles
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b7280]">
                We couldn't find an article matching{" "}
                <span className="font-bold text-[#111111]">
                  "{searchTerm}"
                </span>
                .
              </p>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-6 rounded-xl bg-[#0b1e5b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#162d78]"
              >
                Clear Search
              </button>
            </div>
          </section>
        )}

      {/* =========================================================
          FEATURED POST
      ========================================================= */}
      {!loading &&
        !searchTerm &&
        featuredPost && (
          <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0b1e5b]">
                  Featured
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#111111] sm:text-2xl">
                  Latest from AccMarket
                </h2>
              </div>

              <span className="hidden text-xs font-semibold text-[#9ca3af] sm:block">
                Fresh insights & updates
              </span>
            </div>

            <Link
              href={`/blogs/${featuredPost.id}`}
              className="group block"
            >
              <article className="relative overflow-hidden rounded-[30px] border border-[#e5e7eb] bg-white shadow-[0_15px_50px_rgba(11,30,91,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#0b1e5b]/20 hover:shadow-[0_20px_60px_rgba(11,30,91,0.08)]">
                <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                  {/* Featured Visual */}
                  <div className="relative min-h-[260px] overflow-hidden bg-[#0b1e5b] lg:min-h-[360px]">
                    {featuredPost.image_url ? (
                      <img
                        src={featuredPost.image_url}
                        alt={featuredPost.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1e5b] via-[#102a75] to-[#07133d]" />

                        <div className="absolute right-[-60px] top-[-60px] h-64 w-64 rounded-full border border-white/10" />
                        <div className="absolute bottom-[-100px] left-[-70px] h-72 w-72 rounded-full border border-white/10" />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-7xl font-black text-white/10">
                            A
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white backdrop-blur-md">
                      Featured Article
                    </div>
                  </div>

                  {/* Featured Content */}
                  <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#6b7280]">
                      <span className="rounded-full bg-[#0b1e5b]/[0.06] px-3 py-1 font-bold text-[#0b1e5b]">
                        {featuredPost.author || "AccMarket"}
                      </span>

                      <span>•</span>

                      <span>
                        {formatDate(featuredPost.created_at)}
                      </span>
                    </div>

                    <h2 className="mt-5 text-2xl font-black tracking-tight text-[#111111] transition group-hover:text-[#0b1e5b] sm:text-3xl">
                      {featuredPost.title}
                    </h2>

                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-[#6b7280]">
                      {featuredPost.content}
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-sm font-bold text-[#0b1e5b]">
                      Read Article
                      <span className="transition duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </section>
        )}

      {/* =========================================================
          ARTICLE GRID
      ========================================================= */}
      {!loading &&
        posts.length > 0 &&
        (!searchTerm || filteredPosts.length > 0) && (
          <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            {!searchTerm && remainingPosts.length > 0 && (
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0b1e5b]">
                    Explore
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#111111] sm:text-2xl">
                    More articles
                  </h2>
                </div>
              </div>
            )}

            {searchTerm && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0b1e5b]">
                  Search Results
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#111111]">
                  Articles matching "{searchTerm}"
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(searchTerm ? filteredPosts : remainingPosts).map(
                (post) => (
                  <BlogCard key={post.id} post={post} />
                )
              )}
            </div>
          </section>
        )}

      {/* =========================================================
          CTA
      ========================================================= */}
      {!loading && posts.length > 0 && (
        <section className="px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#0b1e5b] px-6 py-12 text-center sm:px-10 lg:px-16 lg:py-14">
            <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>

            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <BookIcon large />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Have questions?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Find quick answers in our FAQ or reach out to the
                AccMarket support team.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0b1e5b] transition hover:bg-[#f4f4f2]"
                >
                  Visit FAQ
                  <ArrowRightIcon />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

            {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="mt-auto bg-[#0b1e5b] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-xs font-black text-[#0b1e5b]">
                  A
                </span>

                <span className="text-lg font-black tracking-tight">
                  AccMarket
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
                A marketplace designed to make digital account
                transactions simpler and more structured.
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                Platform
              </p>

              <div className="mt-4 space-y-3 text-sm text-white/65">
                <FooterLink href="/" label="Home" />
                <FooterLink
                  href="/marketplace"
                  label="Marketplace"
                />
                <FooterLink href="/faq" label="FAQ" />
                <FooterLink
                  href="/blogs"
                  label="Blogs"
                  active
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                Legal & Support
              </p>

              <div className="mt-4 space-y-3 text-sm text-white/65">
                <FooterLink href="/contact" label="Contact" />
                <FooterLink href="/terms" label="Terms" />
                <FooterLink href="/privacy" label="Privacy" />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} AccMarket. All rights
              reserved.
            </p>

            <p>Insights & Updates</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   BLOG CARD
========================================================= */

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.id}`}
      className="group flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(11,30,91,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#0b1e5b]/20 hover:shadow-[0_18px_45px_rgba(11,30,91,0.07)]"
    >
      {/* Image */}
      <div className="relative h-48 shrink-0 overflow-hidden bg-[#0b1e5b]">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1e5b] via-[#102a75] to-[#07133d]" />

            <div className="absolute right-[-30px] top-[-50px] h-44 w-44 rounded-full border border-white/10" />

            <div className="absolute bottom-[-80px] left-[-50px] h-52 w-52 rounded-full border border-white/10" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-white/10">
                A
              </span>
            </div>
          </>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-[#0b1e5b] shadow-sm backdrop-blur">
          ARTICLE
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold text-[#6b7280]">
          <span className="max-w-[55%] truncate rounded-full bg-[#0b1e5b]/[0.06] px-3 py-1.5 font-bold text-[#0b1e5b]">
            {post.author || "AccMarket"}
          </span>

          <span>{formatDate(post.created_at, true)}</span>
        </div>

        <h3 className="mt-4 line-clamp-2 text-lg font-black tracking-tight text-[#111111] transition group-hover:text-[#0b1e5b]">
          {post.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-xs leading-6 text-[#6b7280]">
          {post.content}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-[#e5e7eb] pt-5">
          <span className="text-xs font-semibold text-[#6b7280]">
            Read guide
          </span>

          <span className="text-sm font-black text-[#0b1e5b] transition duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   BLOG SKELETON
========================================================= */

function BlogSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Featured skeleton */}
      <div className="overflow-hidden rounded-[30px] border border-[#e5e7eb] bg-white">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[260px] rounded-none lg:h-[360px]" />

          <div className="space-y-4 p-7 sm:p-9 lg:p-10">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>

            <Skeleton className="h-8 w-[90%] rounded-lg" />
            <Skeleton className="h-8 w-[65%] rounded-lg" />

            <div className="space-y-2 pt-2">
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-[92%] rounded-md" />
              <Skeleton className="h-3.5 w-[75%] rounded-md" />
            </div>

            <Skeleton className="mt-4 h-4 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="mt-12">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-7 w-40 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#e5e7eb] bg-white">
      <Skeleton className="h-48 rounded-none" />

      <div className="space-y-4 p-6">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-6 w-[90%] rounded-md" />
          <Skeleton className="h-6 w-[65%] rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-[92%] rounded-md" />
          <Skeleton className="h-3 w-[75%] rounded-md" />
        </div>

        <div className="border-t border-[#e5e7eb] pt-5">
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-[#e5e7eb] ${className}`}
    />
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  date: string,
  short = false
) {
  return new Date(date).toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    day: "numeric",
    year: short ? undefined : "numeric",
  });
}


/* =========================================================
   NAVIGATION
========================================================= */

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-[#6b7280] transition hover:text-[#0b1e5b]"
    >
      {label}
    </Link>
  );
}

function FooterLink({
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
      className={`block transition ${
        active
          ? "font-bold text-white"
          : "hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 21 : 17;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function BookIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 22 : 14;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}