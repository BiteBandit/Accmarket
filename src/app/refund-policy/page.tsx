import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="accmarket-grid flex min-h-screen flex-col justify-between bg-[#fdfdfc] text-[#111111]">
      <div>
        {/* Navbar */}
        <nav className="sticky top-0 z-50 border-b border-[#e5e7eb]/80 bg-[#fdfdfc]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-black tracking-tight text-[#0b1e5b]"
            >
              <span className="text-xl">AccMarket</span>
            </Link>

            <div className="hidden items-center gap-7 text-sm font-medium md:flex">
              <Link href="/" className="text-[#6b7280] transition hover:text-[#0b1e5b]">
                Home
              </Link>
              <Link href="/marketplace" className="text-[#6b7280] transition hover:text-[#0b1e5b]">
                Marketplace
              </Link>
              <Link href="/faq" className="text-[#6b7280] transition hover:text-[#0b1e5b]">
                FAQ
              </Link>
              <Link href="/blogs" className="text-[#6b7280] transition hover:text-[#0b1e5b]">
                Blog
              </Link>
              <Link href="/contact" className="text-[#6b7280] transition hover:text-[#0b1e5b]">
                Contact
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#0b1e5b] px-5 py-2.5 text-white transition hover:bg-[#162d78]"
              >
                Get Started
              </Link>
            </div>

            <Link
              href="/register"
              className="rounded-xl bg-[#0b1e5b] px-4 py-2 text-sm font-semibold text-white md:hidden"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Header */}
        <section className="border-b border-[#e5e7eb]">
          <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center sm:px-6 lg:pt-20">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#0b1e5b]/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0b1e5b] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#0b1e5b]" />
              Secure Escrow Protection
            </div>

            <h1 className="text-4xl font-black tracking-tight text-[#111111] sm:text-5xl">
              Refund & Dispute Policy
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#6b7280]">
              Because AccMarket deals in non-tangible digital assets and social media accounts, our refund policy is built around our secure escrow protection model.
            </p>
            <p className="mt-2 text-xs font-medium text-[#6b7280]">
              Last updated: January 2026
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="space-y-10 rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_40px_rgba(11,30,91,0.04)] sm:p-10 lg:p-12">
            
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#111111]">1. The Escrow Protection Guarantee</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                When you buy an account on AccMarket, your payment is held securely in escrow by the platform—not released directly to the seller instantly. Funds are only paid out to the seller after you (the buyer) have received full access, verified the credentials, and confirmed the safe handover of the digital asset.
              </p>
            </div>

            <hr className="border-[#e5e7eb]" />

            <div>
              <h2 className="text-xl font-black tracking-tight text-[#111111]">2. Eligibility for Refunds</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                Refunds or transaction cancellations are evaluated on a case-by-case basis during the active escrow inspection window. You are eligible for a full refund if:
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm leading-7 text-[#6b7280] space-y-1">
                <li>The seller fails to deliver the account credentials within the agreed timeframe.</li>
                <li>The delivered account significantly differs from the description provided in the marketplace listing (e.g., mismatched metrics, banned status, or missing recovery details).</li>
                <li>An active dispute is lodged during the inspection period and reviewed/verified by AccMarket support staff.</li>
              </ul>
            </div>

            <hr className="border-[#e5e7eb]" />

            <div>
              <h2 className="text-xl font-black tracking-tight text-[#111111]">3. Non-Refundable Scenarios</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                Due to the sensitive, irrevocable nature of digital assets and social media accounts, refunds will **not** be granted under the following circumstances:
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm leading-7 text-[#6b7280] space-y-1">
                <li>Once the buyer has confirmed receipt, completed the handover, and the escrow funds have been released to the seller.</li>
                <li>If the account gets restricted, locked, or banned due to the buyer&apos;s actions, policy violations, or suspicious login behavior post-purchase.</li>
                <li>Change of mind after the account credentials have been successfully transferred and verified.</li>
              </ul>
            </div>

            <hr className="border-[#e5e7eb]" />

            <div>
              <h2 className="text-xl font-black tracking-tight text-[#111111]">4. Filing a Dispute</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                If you encounter an issue during an account purchase, you must report it immediately through your dashboard or contact our support team before the escrow timer expires. Our team will step in to act as a neutral arbiter to investigate the handover logs and resolve the case fairly.
              </p>
            </div>

            <hr className="border-[#e5e7eb]" />

            <div>
              <h2 className="text-xl font-black tracking-tight text-[#111111]">5. Contact Support</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                For questions regarding ongoing escrow transactions or dispute claims, please contact us via our{" "}
                <Link href="/contact" className="font-bold text-[#0b1e5b] hover:underline">
                  Contact Page
                </Link>.
              </p>
            </div>

          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#0b1e5b] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
            <div>
              <Link href="/" className="text-xl font-black tracking-tight">
                AccMarket
              </Link>
              <p className="mt-2 text-sm text-white/60">
                A marketplace built for safer account transactions.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm text-white/70">
              <Link href="/" className="transition hover:text-white">Home</Link>
              <Link href="/marketplace" className="transition hover:text-white">Marketplace</Link>
              <Link href="/faq" className="transition hover:text-white">FAQ</Link>
              <Link href="/blogs" className="transition hover:text-white">Blog</Link>
              <Link href="/contact" className="transition hover:text-white">Contact</Link>
              <Link href="/refund-policy" className="text-white font-medium">Refund Policy</Link>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} AccMarket. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
