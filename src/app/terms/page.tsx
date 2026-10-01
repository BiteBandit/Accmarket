import Link from "next/link";

const sections = [
  { id: "acceptance", number: "01", title: "Acceptance of Terms" },
  { id: "about", number: "02", title: "About AccMarket" },
  { id: "accounts", number: "03", title: "User Accounts" },
  { id: "transactions", number: "04", title: "Marketplace Transactions" },
  { id: "escrow", number: "05", title: "Escrow Transactions" },
  { id: "prohibited", number: "06", title: "Prohibited Activities" },
  { id: "payments", number: "07", title: "Payments & Wallets" },
  { id: "disputes", number: "08", title: "Disputes" },
  { id: "termination", number: "09", title: "Suspension & Termination" },
  { id: "availability", number: "10", title: "Platform Availability" },
  { id: "liability", number: "11", title: "Limitation of Liability" },
  { id: "changes", number: "12", title: "Changes to These Terms" },
  { id: "contact", number: "13", title: "Contact Us" },
];

export default function TermsPage() {
  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="sticky top-0 z-50 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0b1e5b] text-xs font-black text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
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
              <ShieldIcon />
            </span>
            Legal & Guidelines
          </div>

          <h1 className="text-4xl font-black tracking-[-0.04em] text-[#111111] sm:text-5xl lg:text-6xl">
            Terms of
            <span className="block text-[#0b1e5b]">
              Service
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#6b7280] sm:text-base">
            These terms explain the rules and responsibilities that
            apply when using AccMarket, including marketplace
            transactions, escrow, payments, accounts, and disputes.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-semibold text-[#6b7280] shadow-sm">
              <CalendarIcon />
              Last updated September 2026
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs font-semibold text-[#6b7280] shadow-sm">
              <FileIcon />
              13 sections
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTENT
      ========================================================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Desktop Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_12px_40px_rgba(11,30,91,0.04)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6b7280]">
                On this page
              </p>

              <div className="mt-4 space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#0b1e5b]/[0.04]"
                  >
                    <span className="pt-0.5 text-[10px] font-black text-[#0b1e5b]/40 transition group-hover:text-[#0b1e5b]">
                      {section.number}
                    </span>

                    <span className="text-xs font-semibold leading-5 text-[#6b7280] transition group-hover:text-[#0b1e5b]">
                      {section.title}
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-6 border-t border-[#e5e7eb] pt-5">
                <p className="text-xs font-bold text-[#111111]">
                  Need clarification?
                </p>

                <p className="mt-1.5 text-xs leading-5 text-[#6b7280]">
                  Our support team can help with questions about the
                  platform or your transactions.
                </p>

                <Link
                  href="/contact"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#162d78]"
                >
                  Contact Support
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Document */}
          <article className="min-w-0">
            <div className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white shadow-[0_18px_60px_rgba(11,30,91,0.055)]">
              {/* Document Header */}
              <div className="border-b border-[#e5e7eb] bg-[#0b1e5b] px-6 py-7 text-white sm:px-9">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <ScaleIcon />
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      AccMarket Terms of Service
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Please review these terms before using the
                      AccMarket platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#e5e7eb]">
                {/* 01 */}
                <LegalSection
                  id="acceptance"
                  number="01"
                  title="Acceptance of Terms"
                >
                  <p>
                    By accessing, registering for, or using AccMarket,
                    you acknowledge that you have read, understood,
                    and agreed to these Terms of Service. If you do not
                    agree with these terms, you should not use the
                    platform.
                  </p>
                </LegalSection>

                {/* 02 */}
                <LegalSection
                  id="about"
                  number="02"
                  title="About AccMarket"
                >
                  <p>
                    AccMarket provides an online marketplace that
                    facilitates transactions between buyers and sellers
                    of digital accounts and related digital assets.
                    AccMarket may provide escrow and
                    transaction-support services designed to reduce
                    transaction risk between participating users.
                  </p>
                </LegalSection>

                {/* 03 */}
                <LegalSection
                  id="accounts"
                  number="03"
                  title="User Accounts"
                >
                  <p>
                    You are responsible for providing accurate and
                    up-to-date information when creating an account.
                  </p>

                  <p>
                    You are responsible for maintaining the security of
                    your login credentials and for all activity carried
                    out through your account.
                  </p>

                  <p>
                    You must not share, sell, transfer, or otherwise
                    misuse your AccMarket account unless expressly
                    permitted by AccMarket.
                  </p>

                  <p>
                    AccMarket may suspend or restrict accounts that
                    violate these Terms, applicable laws, or marketplace
                    rules.
                  </p>
                </LegalSection>

                {/* 04 */}
                <LegalSection
                  id="transactions"
                  number="04"
                  title="Marketplace Transactions"
                >
                  <p>
                    Buyers and sellers are responsible for reviewing
                    listing information before completing a
                    transaction. Sellers must provide accurate
                    information about the digital assets they list,
                    including ownership, access conditions, and any
                    relevant restrictions.
                  </p>

                  <p>
                    Buyers should verify that a listing meets their
                    requirements before proceeding with a purchase.
                  </p>
                </LegalSection>

                {/* 05 */}
                <LegalSection
                  id="escrow"
                  number="05"
                  title="Escrow Transactions"
                >
                  <p>
                    Where escrow is available, funds may be held during
                    the transaction until the applicable release
                    conditions are satisfied.
                  </p>

                  <p>
                    Users agree to provide truthful information and
                    cooperate with reasonable transaction or dispute
                    reviews.
                  </p>

                  <Notice>
                    Escrow does not guarantee that every transaction
                    will be free from fraud, disputes, or loss.
                  </Notice>
                </LegalSection>

                {/* 06 */}
                <LegalSection
                  id="prohibited"
                  number="06"
                  title="Prohibited Activities"
                >
                  <p>
                    Users must not use AccMarket to facilitate illegal,
                    fraudulent, deceptive, abusive, or unauthorized
                    activities.
                  </p>

                  <BulletList
                    items={[
                      "Fraud, scams, impersonation, or deception.",
                      "Selling or purchasing assets without the legal right or authorization to transfer them.",
                      "Attempting to bypass marketplace security, verification, or transaction controls.",
                      "Using the platform to distribute malware or other harmful software.",
                      "Attempting to gain unauthorized access to another user's account or AccMarket systems.",
                    ]}
                  />
                </LegalSection>

                {/* 07 */}
                <LegalSection
                  id="payments"
                  number="07"
                  title="Payments & Wallet Balances"
                >
                  <p>
                    Users are responsible for ensuring that payment
                    information submitted through supported payment
                    methods is accurate and authorized.
                  </p>

                  <p>
                    Wallet balances, deposits, transaction fees,
                    refunds, and withdrawals may be subject to
                    additional platform rules and applicable
                    payment-provider requirements.
                  </p>
                </LegalSection>

                {/* 08 */}
                <LegalSection
                  id="disputes"
                  number="08"
                  title="Disputes"
                >
                  <p>
                    If a dispute occurs, users should provide relevant
                    evidence and cooperate with the dispute-resolution
                    process.
                  </p>

                  <p>
                    AccMarket may review transaction records,
                    messages, listing information, payment information,
                    and other relevant evidence when determining how a
                    platform dispute should be handled.
                  </p>
                </LegalSection>

                {/* 09 */}
                <LegalSection
                  id="termination"
                  number="09"
                  title="Account Suspension or Termination"
                >
                  <p>
                    AccMarket may temporarily restrict, suspend, or
                    terminate access to an account where there is a
                    suspected violation of these Terms, suspicious
                    activity, security concerns, fraud, abuse, or
                    other circumstances that may threaten users or the
                    platform.
                  </p>
                </LegalSection>

                {/* 10 */}
                <LegalSection
                  id="availability"
                  number="10"
                  title="Platform Availability"
                >
                  <p>
                    We aim to keep AccMarket available and reliable,
                    but we do not guarantee uninterrupted or error-free
                    operation.
                  </p>

                  <p>
                    Maintenance, technical issues, security events,
                    network failures, or third-party service
                    interruptions may temporarily affect availability.
                  </p>
                </LegalSection>

                {/* 11 */}
                <LegalSection
                  id="liability"
                  number="11"
                  title="Limitation of Liability"
                >
                  <p>
                    To the extent permitted by applicable law, AccMarket
                    will not be responsible for losses resulting from a
                    user's misuse of the platform, unauthorized access
                    to an account caused by the user's failure to
                    protect their credentials, inaccurate information
                    supplied by another user, or events outside the
                    reasonable control of AccMarket.
                  </p>
                </LegalSection>

                {/* 12 */}
                <LegalSection
                  id="changes"
                  number="12"
                  title="Changes to These Terms"
                >
                  <p>
                    AccMarket may update these Terms of Service from
                    time to time.
                  </p>

                  <p>
                    When material changes are made, the updated version
                    will be published on this page with a revised update
                    date.
                  </p>

                  <p>
                    Continued use of the platform after an update may
                    constitute acceptance of the revised terms where
                    permitted by applicable law.
                  </p>
                </LegalSection>

                {/* 13 */}
                <LegalSection
                  id="contact"
                  number="13"
                  title="Contact Us"
                >
                  <p>
                    If you have questions about these Terms of Service
                    or need assistance with a transaction, please
                    contact our support team.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0b1e5b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#162d78]"
                  >
                    Contact Support
                    <ArrowRightIcon />
                  </Link>
                </LegalSection>
              </div>

              {/* Legal Notice */}
              <div className="border-t border-[#e5e7eb] bg-[#fafafa] p-6 sm:p-8">
                <div className="flex items-start gap-4 rounded-2xl border border-[#0b1e5b]/10 bg-[#0b1e5b]/[0.035] p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b] text-white">
                    <InfoIcon />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#0b1e5b]">
                      Important legal notice
                    </p>

                    <p className="mt-1.5 text-xs leading-6 text-[#6b7280]">
                      These Terms are intended to describe the general
                      rules governing use of AccMarket. They should be
                      reviewed and adapted to the laws, regulations,
                      business structure, payment arrangements, and
                      services applicable to your operation before being
                      treated as a final legal agreement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================= */}
      <section className="px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#0b1e5b] px-6 py-12 text-center sm:px-10 lg:px-16 lg:py-16">
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
              <QuestionIcon />
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Still have questions?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
              If something in these terms is unclear, visit our FAQ or
              contact the AccMarket support team.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0b1e5b] transition hover:bg-[#f4f4f2]"
              >
                Contact Support
                <ArrowRightIcon />
              </Link>

              <Link
                href="/faq"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Visit FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="bg-[#0b1e5b] text-white">
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
                <FooterLink href="/blogs" label="Blogs" />
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                Legal & Support
              </p>

              <div className="mt-4 space-y-3 text-sm text-white/65">
                <FooterLink href="/contact" label="Contact" />
                <FooterLink href="/terms" label="Terms" active />
                <FooterLink href="/privacy" label="Privacy" />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} AccMarket. All rights
              reserved.
            </p>

            <p>
              Terms updated September 2026
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   COMPONENTS
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

function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 px-6 py-9 sm:px-9 sm:py-10 lg:px-10"
    >
      <div className="flex gap-4 sm:gap-5">
        <div className="hidden shrink-0 pt-1 sm:block">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1e5b]/[0.06] text-[10px] font-black text-[#0b1e5b]">
            {number}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-widest text-[#0b1e5b]/40 sm:hidden">
              {number}
            </span>

            <h2 className="text-lg font-black tracking-tight text-[#0b1e5b] sm:text-xl">
              {title}
            </h2>
          </div>

          <div className="mt-4 space-y-4 text-sm leading-7 text-[#6b7280]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-[#0b1e5b]/10 bg-[#0b1e5b]/[0.035] px-4 py-3.5 text-xs leading-6 text-[#0b1e5b]">
      <span className="font-black">Important:</span>{" "}
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b1e5b]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ShieldIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M16 2v4M8 2v4M3 9h18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3v18M5 6h14M5 6l-3 6h6L5 6ZM19 6l-3 6h6l-3-6ZM8 21h8" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-.9.9-1.8 1.2-1.8 2.6" />
      <path d="M12 16.7h.01" />
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