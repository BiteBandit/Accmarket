"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !message.trim()) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");

      setAlertState({
        show: true,
        type: "success",
        title: "Message sent",
        message:
          "Thanks for contacting AccMarket. We've received your message and will respond to you by email.",
      });
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err.message
          : "Failed to send your message. Please try again.";

      setStatus("error");

      setAlertState({
        show: true,
        type: "error",
        title: "Message not sent",
        message: error,
      });
    }
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
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 transition hover:text-[#0b1e5b]"
            >
              Home
            </Link>

            <Link
              href="/marketplace"
              className="text-sm font-medium text-slate-600 transition hover:text-[#0b1e5b]"
            >
              Marketplace
            </Link>

            <Link
              href="/faq"
              className="text-sm font-medium text-slate-600 transition hover:text-[#0b1e5b]"
            >
              FAQ
            </Link>

            <Link
              href="/blogs"
              className="text-sm font-medium text-slate-600 transition hover:text-[#0b1e5b]"
            >
              Blog
            </Link>

            <Link
              href="/contact"
              className="font-bold text-[#0b1e5b]"
            >
              Contact
            </Link>

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
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-120px] h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-[#0b1e5b]/[0.055] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:px-8 sm:py-24 lg:py-28">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 shadow-sm backdrop-blur">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1e5b] text-[9px] font-black text-white">
              ?
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0b1e5b]">
              Support Center
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
            Let&apos;s get your
            <span className="block text-[#0b1e5b]">
              issue sorted.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Have a question about your account, a transaction, an escrow
            process, or a marketplace listing? Send us a message and our
            support team will review it.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Support available
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              Email support
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              Secure communication
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTACT AREA
      ========================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
          {/* =====================================================
              CONTACT FORM
          ====================================================== */}

          <div>
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Send a request
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                How can we help?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Provide as much detail as possible so our team can understand
                and resolve your request efficiently.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(11,30,91,0.055)] sm:p-8 lg:p-10"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/10"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/10"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="mt-6">
                <label
                  htmlFor="subject"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/10"
                />
              </div>

              {/* Message */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="message"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Message
                  </label>

                  <span className="text-[10px] text-slate-400">
                    Be as detailed as possible
                  </span>
                </div>

                <textarea
                  id="message"
                  required
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what happened, what you need help with, and any relevant details..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/10"
                />
              </div>

              {/* Submit */}
              <div className="mt-7">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] text-sm font-bold text-white shadow-[0_10px_25px_rgba(11,30,91,0.18)] transition hover:-translate-y-0.5 hover:bg-[#162d78] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send message
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
                  Please do not include passwords, one-time passwords, private
                  keys, or other sensitive credentials in your message.
                </p>
              </div>
            </form>
          </div>

          {/* =====================================================
              SIDEBAR
          ====================================================== */}

          <aside className="lg:pt-[72px]">
            <div className="sticky top-28 space-y-5">
              {/* Contact card */}
              <div className="rounded-[26px] bg-[#0b1e5b] p-7 text-white shadow-[0_20px_50px_rgba(11,30,91,0.16)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
                  Email support
                </p>

                <h3 className="mt-2 break-all text-lg font-black">
                  support@accmarket.name.ng
                </h3>

                <p className="mt-3 text-xs leading-5 text-white/60">
                  Send us a detailed description of your issue and include
                  relevant non-sensitive information.
                </p>

                <a
                  href="mailto:support@accmarket.name.ng"
                  className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-white transition hover:gap-3"
                >
                  Email support
                  <span>→</span>
                </a>
              </div>

              {/* FAQ */}
              <div className="rounded-[26px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-[#0b1e5b]">
                  ?
                </div>

                <h3 className="mt-5 text-base font-black text-slate-900">
                  Need a quick answer?
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  You may find the answer you're looking for in our frequently
                  asked questions.
                </p>

                <Link
                  href="/faq"
                  className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#0b1e5b] transition hover:gap-3"
                >
                  Browse the FAQ
                  <span>→</span>
                </Link>
              </div>

              {/* Safety */}
              <div className="rounded-[26px] border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Security reminder
                </p>

                <div className="mt-4 flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    ✓
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    AccMarket support will never need your account password,
                    OTP, recovery code, or private authentication credentials.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* =========================================================
          BOTTOM CTA
      ========================================================== */}

      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#0b1e5b] px-7 py-12 text-center sm:px-12 lg:py-14">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            AccMarket Support
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Prefer to find the answer yourself?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
            Explore our FAQ and learn more about accounts, transactions,
            listings, and how AccMarket works.
          </p>

          <Link
            href="/faq"
            className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0b1e5b] transition hover:bg-slate-100"
          >
            Visit FAQ Center
          </Link>
        </div>
      </section>

      {/* =========================================================
          ALERT MODAL
      ========================================================== */}

{alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close notification"
            className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
            onClick={() =>
              setAlertState((prev) => ({
                ...prev,
                show: false,
              }))
            }
          />

          <div className="relative z-10 w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-2xl">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                alertState.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {alertState.type === "success" ? (
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
            </div>

            <h3 className="mt-5 text-lg font-black text-[#0b1e5b]">
              {alertState.title}
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {alertState.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setAlertState((prev) => ({
                  ...prev,
                  show: false,
                }))
              }
              className="mt-6 h-11 w-full rounded-xl bg-[#0b1e5b] text-xs font-bold text-white transition hover:bg-[#162d78]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

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
                A marketplace built to make digital account transactions more
                structured and transparent.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <Link href="/" className="transition hover:text-[#0b1e5b]">
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
                className="transition hover:text-[#0b1e5b]"
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
                className="font-bold text-[#0b1e5b]"
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
