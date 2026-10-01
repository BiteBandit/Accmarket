"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const sections = [
  { id: "collect", number: "01", label: "Information We Collect" },
  { id: "use", number: "02", label: "How We Use Your Information" },
  { id: "security", number: "03", label: "Data Security" },
  { id: "sharing", number: "04", label: "Sharing of Information" },
  { id: "contact", number: "05", label: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("collect");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      setProgress(
        documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0
      );

      const position = scrollTop + 180;

      for (const section of sections) {
        const element = document.getElementById(section.id);

        if (element) {
          const top = element.offsetTop;
          const bottom = top + element.offsetHeight;

          if (position >= top && position < bottom) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);

    if (!element) return;

    const offset = 120;
    const top =
      element.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1e5b] text-sm font-black text-white shadow-sm">
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
              className="text-sm font-medium text-slate-600 transition hover:text-[#0b1e5b]"
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

        {/* Reading progress */}
        <div className="h-[2px] bg-transparent">
          <div
            className="h-full bg-[#0b1e5b] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(11,30,91,0.08),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:px-8 sm:py-24 lg:py-28">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 shadow-sm backdrop-blur">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1e5b] text-[9px] font-black text-white">
              ✓
            </span>

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0b1e5b]">
              Legal & Privacy
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            Privacy Policy
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Your privacy matters to us. This policy explains how AccMarket
            collects, uses, protects, and handles information when you use
            our marketplace and services.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              Effective January 2026
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              3 min read
            </div>

            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              Privacy first
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[280px_minmax(0,720px)] lg:justify-center lg:gap-20">
          {/* =====================================================
              SIDEBAR
          ====================================================== */}

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Contents
              </div>

              <div className="relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />

                <div className="space-y-1">
                  {sections.map((section) => {
                    const active = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollTo(section.id)}
                        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                          active
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-black transition ${
                            active
                              ? "border-[#0b1e5b] bg-[#0b1e5b] text-white"
                              : "border-slate-300 bg-[#fdfdfc] text-slate-400 group-hover:border-slate-400"
                          }`}
                        >
                          {section.number}
                        </span>

                        <span
                          className={`text-xs font-semibold transition ${
                            active
                              ? "text-[#0b1e5b]"
                              : "text-slate-500 group-hover:text-slate-900"
                          }`}
                        >
                          {section.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Help card */}
              <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1e5b] text-sm font-bold text-white">
                  ?
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  Have a question?
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  Our support team can help with privacy or account-related
                  questions.
                </p>

                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#0b1e5b] transition hover:gap-3"
                >
                  Contact support
                  <span>→</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* =====================================================
              CONTENT
          ====================================================== */}

          <article className="min-w-0">
            {/* Intro */}
            <div className="mb-14 border-b border-slate-200 pb-12">
              <p className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                AccMarket is committed to protecting the information you
                provide while using our platform. We collect only information
                that helps us provide our services, maintain account security,
                process transactions, and improve your experience.
              </p>

              <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                By using AccMarket, you acknowledge that information may be
                processed as described in this Privacy Policy.
              </p>
            </div>

            {/* Section 01 */}
            <section
              id="collect"
              className="scroll-mt-32 border-b border-slate-200 pb-14"
            >
              <SectionHeading
                number="01"
                title="Information We Collect"
              />

              <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                When you create an account, list an asset, communicate with
                another user, or conduct a transaction through AccMarket
                (<code className="rounded-md bg-slate-100 px-1.5 py-1 text-xs font-bold text-[#0b1e5b]">
                  accmarket.name.ng
                </code>
                ), we may collect information necessary to operate the
                platform.
              </p>

              <InfoList
                items={[
                  "Personal identification details such as your name, email address, and phone number.",
                  "Account credentials and information associated with marketplace listings.",
                  "Transaction records, payment references, wallet activity, and related records.",
                  "Messages and communication history associated with transactions or support requests.",
                  "Technical information such as browser type, IP address, device information, and usage data.",
                ]}
              />
            </section>

            {/* Section 02 */}
            <section
              id="use"
              className="scroll-mt-32 border-b border-slate-200 py-14"
            >
              <SectionHeading
                number="02"
                title="How We Use Your Information"
              />

              <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                Information collected through the platform may be used to
                provide our services, protect users, and maintain a reliable
                marketplace.
              </p>

              <InfoList
                items={[
                  "Facilitating account listings, transactions, escrow processes, and verification.",
                  "Sending transaction updates, security notifications, and important service communications.",
                  "Detecting and preventing fraud, scams, abuse, and unauthorized access.",
                  "Providing customer support and resolving disputes.",
                  "Improving platform functionality, reliability, and user experience.",
                  "Meeting applicable legal, regulatory, and compliance requirements.",
                ]}
              />
            </section>

            {/* Section 03 */}
            <section
              id="security"
              className="scroll-mt-32 border-b border-slate-200 py-14"
            >
              <SectionHeading
                number="03"
                title="Data Security & Protection"
              />

              <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                We use reasonable technical and organizational safeguards to
                protect information against unauthorized access, alteration,
                disclosure, or destruction.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Secure infrastructure",
                    text: "We use modern infrastructure and server-side security controls.",
                  },
                  {
                    title: "Access controls",
                    text: "Access to sensitive information is restricted where appropriate.",
                  },
                  {
                    title: "Transaction protection",
                    text: "Transaction-related information is handled using security measures designed to reduce unauthorized activity.",
                  },
                  {
                    title: "Monitoring",
                    text: "We may monitor activity to identify suspicious or abusive behavior.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 04 */}
            <section
              id="sharing"
              className="scroll-mt-32 border-b border-slate-200 py-14"
            >
              <SectionHeading
                number="04"
                title="Sharing of Information"
              />

              <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                We do not sell, trade, or rent your personal information.
                Information may be shared when reasonably necessary to
                provide our services, facilitate a transaction, protect the
                platform, or comply with applicable law.
              </p>

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b] text-xs font-black text-white">
                    i
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0b1e5b]">
                      When information may be shared
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      This may include sharing information with service
                      providers that help us operate the platform, parties
                      involved in an escrow transaction where necessary, or
                      authorities where disclosure is required by law.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 05 */}
            <section
              id="contact"
              className="scroll-mt-32 pt-14"
            >
              <SectionHeading
                number="05"
                title="Contact Us"
              />

              <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                If you have questions, concerns, or requests regarding this
                Privacy Policy or the handling of your information, our team
                is available to assist you.
              </p>

              <Link
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0b1e5b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#162d78]"
              >
                Contact AccMarket
                <span>→</span>
              </Link>
            </section>
          </article>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}

      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#0b1e5b] px-7 py-12 text-center sm:px-12 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            AccMarket
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Your trust is important to us.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
            We are committed to building a marketplace where users can
            transact with greater transparency and confidence.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0b1e5b] transition hover:bg-slate-100"
          >
            Back to AccMarket
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

              <p className="mt-2 text-xs text-slate-400">
                A marketplace built for safer account transactions.
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

              <Link href="/faq" className="transition hover:text-[#0b1e5b]">
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
                href="/privacy"
                className="font-bold text-[#0b1e5b]"
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
   COMPONENTS
=============================================================== */

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b] text-[10px] font-black text-white">
        {number}
      </div>

      <div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Section {number}
        </p>

        <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
      </div>
    </div>
  );
}

function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="mt-7 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 rounded-xl border border-slate-100 bg-white/70 px-4 py-3.5"
        >
          <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0b1e5b] text-[8px] font-black text-white">
            ✓
          </span>

          <span className="text-sm leading-6 text-slate-600">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}