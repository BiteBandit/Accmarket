import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <main className="accmarket-grid flex min-h-screen flex-col bg-[#fdfdfc] text-[#111111]">
      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="sticky top-0 z-50 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0b1e5b] text-xs font-black text-white shadow-sm transition group-hover:scale-105">
              A
            </span>

            <span className="text-lg font-black tracking-tight text-[#0b1e5b]">
              AccMarket
            </span>
          </Link>

          {/* Desktop Navigation */}
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

            <Link
              href="/register"
              className="rounded-xl bg-[#0b1e5b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_25px_rgba(11,30,91,0.15)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#162d78]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile CTA */}
          <Link
            href="/register"
            className="rounded-xl bg-[#0b1e5b] px-4 py-2 text-sm font-bold text-white md:hidden"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* =========================================================
          ARTICLE
      ========================================================= */}
      <div className="flex-1">
        <article className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">

          {/* Back */}
          <Link
            href="/blogs"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-black text-[#0b1e5b]"
          >
            <span className="transition duration-300 group-hover:-translate-x-1">
              ←
            </span>

            Back to all articles
          </Link>

          {/* =====================================================
              ARTICLE HEADER
          ===================================================== */}
          <header className="mx-auto max-w-4xl">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6b7280]">
              <span className="rounded-full bg-[#0b1e5b]/[0.07] px-3 py-1.5 font-black uppercase tracking-[0.12em] text-[#0b1e5b]">
                {post.author || "AccMarket"}
              </span>

              <span className="text-[#d1d5db]">•</span>

              <span>{formattedDate}</span>

              <span className="text-[#d1d5db]">•</span>

              <span>Article</span>
            </div>

            {/* Title */}
            <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.035em] text-[#111111] sm:text-4xl lg:text-6xl">
              {post.title}
            </h1>

            {/* Intro */}
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6b7280] sm:text-base sm:leading-8">
              Insights, guides and useful information from AccMarket.
            </p>
          </header>

          {/* =====================================================
              HERO MEDIA
          ===================================================== */}
          {(post.video_url || post.image_url) && (
            <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[30px] border border-[#e5e7eb] bg-white shadow-[0_20px_60px_rgba(11,30,91,0.07)] sm:mt-12">
              {post.video_url ? (
                <div className="relative bg-black">
                  <video
                    controls
                    preload="metadata"
                    className="max-h-[600px] w-full object-contain"
                  >
                    <source
                      src={post.video_url}
                      type="video/mp4"
                    />

                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="relative overflow-hidden bg-[#0b1e5b]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="max-h-[600px] w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              ARTICLE BODY
          ===================================================== */}
          <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
            <div className="rounded-[30px] border border-[#e5e7eb] bg-white p-6 shadow-[0_15px_50px_rgba(11,30,91,0.04)] sm:p-9 lg:p-12">

              {/* Article label */}
              <div className="mb-8 flex items-center gap-3 border-b border-[#e5e7eb] pb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1e5b] text-white">
                  <BookIcon />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6b7280]">
                    AccMarket Blog
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-[#111111]">
                    Published {formattedDate}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="whitespace-pre-line text-sm leading-8 text-[#4b5563] sm:text-[15px] sm:leading-8">
                {post.content}
              </div>
            </div>
          </div>

          {/* =====================================================
              BOTTOM CTA
          ===================================================== */}
          <section className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[30px] bg-[#0b1e5b] text-white shadow-[0_20px_60px_rgba(11,30,91,0.12)]">
            <div className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">

              {/* Decorative circles */}
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full border border-white/10" />

              <div className="relative">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
                  AccMarket
                </span>

                <h2 className="mt-4 max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">
                  Ready to explore the marketplace?
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                  Browse available listings or create your account to get started with AccMarket.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#0b1e5b] transition duration-300 hover:-translate-y-0.5"
                  >
                    Explore Marketplace
                    <ArrowRightIcon />
                  </Link>

                  <Link
                    href="/blogs"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Read More Articles
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="mt-10 bg-[#0b1e5b] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">

            {/* Brand */}
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

            {/* Platform */}
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

            {/* Support */}
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

          {/* Bottom */}
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} AccMarket. All rights reserved.
            </p>

            <p>
              Insights & Updates
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
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

/* =========================================================
   FOOTER LINK
========================================================= */

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

function BookIcon() {
  return (
    <svg
      width="17"
      height="17"
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