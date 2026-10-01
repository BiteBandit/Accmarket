"use client";

import { useState } from "react";
import Link from "next/link";

const categories = [
  {
    name: "Instagram",
    description: "Explore verified Instagram accounts ready for transfer.",
    icon: "https://img.icons8.com/color/96/instagram-new.png",
  },
  {
    name: "TikTok",
    description: "Discover trending TikTok accounts with active followers.",
    icon: "https://img.icons8.com/color/96/tiktok--v1.png",
  },
  {
    name: "YouTube",
    description: "Buy and sell YouTube channels safely with escrow.",
    icon: "https://img.icons8.com/color/96/youtube-play.png",
  },
  {
    name: "Twitter (X)",
    description: "Verified Twitter accounts for branding and growth.",
    icon: "https://img.icons8.com/color/96/twitterx--v1.png",
  },
  {
    name: "Facebook",
    description: "Purchase Facebook pages with genuine engagement.",
    icon: "https://img.icons8.com/color/96/facebook-new.png",
  },
  {
    name: "Snapchat",
    description: "Secure aged and active Snapchat accounts for marketing.",
    icon: "https://img.icons8.com/color/96/snapchat.png",
  },
];

const blogPosts = [
  {
    title: "How to Safely Buy and Sell Accounts",
    description:
      "Learn the best practices for trading social media accounts securely with escrow services.",
    image: "https://picsum.photos/800/500?random=11",
  },
  {
    title: "Top 5 Platforms for Growing an Account",
    description:
      "Discover proven strategies and platforms to grow your accounts before listing them for sale.",
    image: "https://picsum.photos/800/500?random=12",
  },
  {
    title: "Why Use Escrow for Account Trading?",
    description:
      "Escrow protects both buyers and sellers. Here’s why it’s essential in account marketplaces.",
    image: "https://picsum.photos/800/500?random=13",
  },
];

const steps = [
  {
    number: "1",
    title: "List Your Account",
    description:
      "Sellers submit their accounts with proof of ownership and verified information.",
    icon: "https://img.icons8.com/fluency/96/add-list.png",
  },
  {
    number: "2",
    title: "Buyer Makes Payment",
    description:
      "Buyers deposit funds safely into our escrow wallet for transaction security.",
    icon: "https://img.icons8.com/fluency/96/money-transfer.png",
  },
  {
    number: "3",
    title: "Escrow Verification",
    description:
      "We verify ownership, confirm details, and hold funds until the account is transferred.",
    icon: "https://img.icons8.com/fluency/96/verified-account.png",
  },
  {
    number: "4",
    title: "Seller Gets Paid",
    description:
      "Once the buyer confirms delivery, escrow releases the funds to the seller instantly.",
    icon: "https://img.icons8.com/fluency/96/get-cash.png",
  },
];

const benefits = [
  {
    title: "Verified Accounts",
    description:
      "All listings are verified for authenticity before approval.",
    icon: "https://img.icons8.com/fluency/96/verified-badge.png",
  },
  {
    title: "Escrow Protection",
    description:
      "Funds are safely held until both parties confirm satisfaction.",
    icon: "https://img.icons8.com/fluency/96/security-checked.png",
  },
  {
    title: "24/7 Support",
    description:
      "Our dedicated team is always available to help resolve issues.",
    icon: "https://img.icons8.com/fluency/96/customer-support.png",
  },
];

const faqs = [
  {
    question: "How does the escrow system work?",
    answer:
      "When you buy an account, your payment is held securely in escrow. Once the seller transfers the account and you confirm, funds are released to the seller.",
  },
  {
    question: "How long does it take to receive an account?",
    answer:
      "Most transfers are completed within a few hours, depending on verification speed and seller responsiveness.",
  },
  {
    question: "Can I get a refund if something goes wrong?",
    answer:
      "Yes. If an issue occurs and is verified by our team, your escrowed payment is refunded securely back to your account.",
  },
  {
    question: "Is it safe to sell my account on AccMarket?",
    answer:
      "Sellers are verified, and payments are released only after buyers confirm successful transfers.",
  },
];

const testimonials = [
  {
    name: "Kelvin",
    role: "Facebook Seller",
    text: "AccMarket made selling my Facebook page so easy! The escrow system made me feel safe throughout the process.",
    image: "https://l.top4top.io/p_3500xxxxxxx.jpg",
  },
  {
    name: "Chika Okeke",
    role: "TikTok Buyer",
    text: "I bought a TikTok account and everything went smoothly. The seller delivered and I got my account verified quickly.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Joshua Eze",
    role: "Instagram Trader",
    text: "The safest platform for account trading. No scams, no stress. Highly recommend for all creators and resellers!",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
];

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

const [alertState, setAlertState] = useState<{
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}>({
  show: false,
  type: 'success',
  title: '',
  message: '',
});


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!search.trim()) return;

    window.location.href = `/products?search=${encodeURIComponent(
      search.trim()
    )}`;
  };

  const handleNewsletter = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email.trim()) return;

  setStatus("loading");

  try {
    const res = await fetch("/api/inner-circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    setStatus("success");
    setEmail("");
    
    // Trigger your custom modal alert on success
    setAlertState({
      show: true,
      type: 'success',
      title: "Welcome to the Inner Circle!",
      message: "You're officially on the VIP list. Check your inbox soon for exclusive drops.",
    });

  } catch (err: any) {
    setStatus("error");
    
    // Trigger your custom modal alert on error
    setAlertState({
      show: true,
      type: 'error',
      title: "Subscription Failed",
      message: err.message || "Failed to subscribe. Please try again.",
    });
  }
};


  return (
    <main className="min-h-screen bg-[#fdfdfc] text-[#111111] flex flex-col accmarket-grid">

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#fdfdfc]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
  <div className="relative h-16 w-16 overflow-hidden">
    <img
      src="/images/logo.png"
      alt="AccMarket Logo"
      className="h-full w-full object-contain"
    />
  </div>
</Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/products"
              className="text-sm font-semibold text-gray-700 transition hover:text-[#0b1e5b]"
            >
              Products
            </Link>

            <Link
              href="/blogs"
              className="text-sm font-semibold text-gray-700 transition hover:text-[#0b1e5b]"
            >
              Blogs
            </Link>

            <Link
              href="/faq"
              className="text-sm font-semibold text-gray-700 transition hover:text-[#0b1e5b]"
            >
              FAQ
            </Link>

            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 transition hover:text-[#0b1e5b]"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-[#0b1e5b] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#071642]"
            >
              Create Account
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-xl md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? "×" : "☰"}
          </button>
        </div>

        {/* MOBILE NAV */}
        {mobileMenu && (
          <div className="border-t border-gray-200 bg-white px-4 py-5 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              <Link
                href="/products"
                className="rounded-lg px-4 py-3 font-semibold hover:bg-gray-50"
                onClick={() => setMobileMenu(false)}
              >
                Products
              </Link>

              <Link
                href="/blogs"
                className="rounded-lg px-4 py-3 font-semibold hover:bg-gray-50"
                onClick={() => setMobileMenu(false)}
              >
                Blogs
              </Link>

              <Link
                href="/faq"
                className="rounded-lg px-4 py-3 font-semibold hover:bg-gray-50"
                onClick={() => setMobileMenu(false)}
              >
                FAQ
              </Link>

              <Link
                href="/login"
                className="rounded-lg px-4 py-3 font-semibold hover:bg-gray-50"
                onClick={() => setMobileMenu(false)}
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="mt-2 rounded-xl bg-[#0b1e5b] px-4 py-3 text-center font-bold text-white"
                onClick={() => setMobileMenu(false)}
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-transparent">

        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-[#0b1e5b]/5 blur-3xl" />
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#0b1e5b]/10 bg-[#0b1e5b]/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#0b1e5b]">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Trusted Account Marketplace
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-[#0b1e5b] sm:text-5xl lg:text-6xl">
            Buy & Sell Verified Social Media Accounts Safely
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Trade Facebook, Instagram, TikTok, and more with escrow protection
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-[#0b1e5b]/5 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 px-4">
              <svg
                className="h-5 w-5 shrink-0 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Facebook, Instagram, TikTok accounts..."
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#0b1e5b] px-7 py-3 font-bold text-white transition hover:bg-[#071642]"
            >
              Search
            </button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-gray-500">
            <span>Facebook</span>
            <span>•</span>
            <span>Instagram</span>
            <span>•</span>
            <span>TikTok</span>
            <span>•</span>
            <span>YouTube</span>
            <span>•</span>
            <span>Twitter</span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-gray-100 bg-white/60 backdrop-blur-xs py-20">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#0b1e5b]">
              Marketplace
            </p>

            <h2 className="text-3xl font-black tracking-tight text-[#111111] sm:text-4xl">
              Browse by Category
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Choose a category below to explore scripts and templates tailored
              to your needs.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(
                  category.name
                )}`}
                className="group rounded-2xl border border-gray-200 bg-[#fdfdfc] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#0b1e5b]/20 hover:bg-white hover:shadow-xl hover:shadow-[#0b1e5b]/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <img
                    src={category.icon}
                    alt={category.name}
                    className="h-9 w-9 object-contain"
                  />
                </div>

                <h3 className="text-lg font-black text-[#111111]">
                  {category.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {category.description}
                </p>

                <div className="mt-5 text-sm font-bold text-[#0b1e5b]">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#0b1e5b]">
                Article
              </p>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Latest from Our Blog
              </h2>

              <p className="mt-4 max-w-2xl text-gray-600">
                Stay updated with guides, tips, and insights about account
                trading & online business.
              </p>
            </div>

            <Link
              href="/blogs"
              className="font-bold text-[#0b1e5b] hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {blogPosts.map((post) => (
              <article
                key={post.title}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={post.image}
                  alt=""
                  className="h-52 w-full object-cover"
                />

                <div className="p-6">
                  <h3 className="text-xl font-black">{post.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {post.description}
                  </p>

                  <Link
                    href="/blogs"
                    className="mt-5 inline-block text-sm font-bold text-[#0b1e5b]"
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#0b1e5b]/95 backdrop-blur-sm py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
              Process
            </p>

            <h2 className="text-3xl font-black sm:text-4xl">
              How It Works
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-blue-100">
              Our escrow system makes trading social media accounts 100% secure
              for both buyers and sellers.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/10">
                  <img
                    src={step.icon}
                    alt=""
                    className="h-10 w-10 object-contain"
                  />
                </div>

                <div className="mb-3 text-xs font-black uppercase tracking-widest text-blue-200">
                  Step {step.number}
                </div>

                <h3 className="text-lg font-black">{step.title}</h3>

                <p className="mt-3 text-sm leading-6 text-blue-100">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-12 text-center">
      <h2 className="text-3xl font-black sm:text-4xl">
        Why Choose AccMarket
      </h2>
    </div>

    <div className="grid gap-6 md:grid-cols-3">
      {benefits.map((benefit) => (
        <div
          key={benefit.title}
          className="rounded-2xl border border-gray-200/80 bg-white/90 shadow-xs p-8 text-center transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0b1e5b]/5">
            <img
              src={benefit.icon}
              alt=""
              className="h-9 w-9 object-contain"
            />
          </div>

          <h3 className="text-xl font-black">{benefit.title}</h3>

          <p className="mt-3 leading-7 text-gray-600">
            {benefit.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>


       {/* FAQ */}
      <section className="border-y border-gray-100 bg-white/60 backdrop-blur-xs py-20">

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black sm:text-4xl">
              Frequently Asked Questions
            </h2>

            <p className="mt-4 text-gray-600">
              Got questions? We’ve got answers.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                  >
                    <span className="font-bold">{faq.question}</span>

                    <span className="text-2xl font-light text-[#0b1e5b]">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-6 pb-6 pt-4 text-sm leading-7 text-gray-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#0b1e5b]">
              feedback
            </p>

            <h2 className="text-3xl font-black sm:text-4xl">
              What Our Users Say
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Hear from real buyers and sellers who trust AccMarket for secure
              account trading.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
              >
                <div className="mb-5 flex gap-1 text-yellow-400">
                  ★ ★ ★ ★ ★
                </div>

                <p className="text-sm leading-7 text-gray-600">
                  “{testimonial.text}”
                </p>

                <div className="mt-7 flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />

                  <div>
                    <p className="font-black">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* INNER CIRCLE */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#0b1e5b] px-6 py-14 text-center text-white sm:px-12">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
              Join the Inner Circle
            </p>

            <h2 className="text-3xl font-black sm:text-4xl">
              Get access before everyone else.
            </h2>

            <p className="mt-5 leading-7 text-blue-100">
              Get exclusive access to verified accounts, flash deals, and 24/7
              community support before they hit the marketplace.
            </p>

            <form
              onSubmit={handleNewsletter}
              className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === "loading"}
                className="flex-1 rounded-xl border-0 bg-white px-5 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-xl bg-white px-6 py-3.5 font-bold text-[#0b1e5b] transition hover:bg-gray-100 disabled:opacity-60 cursor-pointer shadow-xs"
              >
                {status === "loading" ? "Joining..." : "Join Now"}
              </button>
            </form>

            {/* Error Message Display */}
            {status === "error" && (
              <p className="mt-4 text-sm font-semibold text-red-300">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Professional Custom Modal Alert */}
        {alertState.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" 
              onClick={() => setAlertState(prev => ({ ...prev, show: false }))}
            ></div>
            <div className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                alertState.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {alertState.type === 'success' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-[#0b1e5b]">{alertState.title}</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">{alertState.message}</p>
              </div>
              <button
                onClick={() => setAlertState(prev => ({ ...prev, show: false }))}
                className="w-full py-2.5 rounded-xl bg-[#0b1e5b] text-white font-bold text-xs hover:bg-[#0b1e5b]/90 transition cursor-pointer shadow-xs"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </section>



      {/* FOOTER */}
<footer className="border-t border-white/10 bg-[#0b1e5b] text-white">
  <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <Link href="/" className="inline-block">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white p-2 flex items-center justify-center">
  <img
    src="/images/logo.png"
    alt="AccMarket Logo"
    className="h-full w-full object-contain"
  />
</div>

        </Link>

        <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
          AccMarket delivers high-quality, verified accounts for
          customers who value time, performance, and trust. Buyers are
          expected to use all accounts responsibly.
        </p>

        <p className="mt-4 text-xs leading-6 text-blue-200">
          AccMarket is not liable for any misuse or unlawful actions.
        </p>
      </div>

      <div>
        <h3 className="font-black text-white">Useful Links</h3>

        <div className="mt-5 flex flex-col gap-3 text-sm text-blue-100">
          <Link href="/products" className="hover:text-white">
            Products
          </Link>

          <Link href="/login" className="hover:text-white">
            Login
          </Link>

          <Link href="/register" className="hover:text-white">
            Register
          </Link>
        </div>
      </div>

      <div>
        <h3 className="font-black text-white">Resources</h3>

        <div className="mt-5 flex flex-col gap-3 text-sm text-blue-100">
          <Link href="/faq" className="hover:text-white">
            FAQ
          </Link>

          <Link href="/blogs" className="hover:text-white">
            Blogs
          </Link>

          <Link href="/terms" className="hover:text-white">
            Terms & Policy
          </Link>

          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
        </div>
      </div>

      <div>
        <h3 className="font-black text-white">Contact Us</h3>

        <div className="mt-5 space-y-3 text-sm text-blue-100">
          <p>Nigeria 🇳🇬</p>

          <a
            href="mailto:support@accmarket.name.ng"
            className="block hover:text-white"
          >
            support@accmarket.name.ng
          </a>

          <a
            href="https://t.me/AccMarketSupport"
            target="_blank"
            rel="noreferrer"
            className="block hover:text-white"
          >
            Telegram Support
          </a>

          <a
            href="tel:+2348169668409"
            className="block hover:text-white"
          >
            +2348169668409
          </a>
        </div>
      </div>
    </div>

    <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-blue-200 sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} AccMarket. All rights reserved.</p>

      <div className="flex flex-wrap gap-4">
        <Link href="/privacy" className="hover:text-white">
          Privacy
        </Link>

        <Link href="/refund-policy" className="hover:text-white">
          Refund Policy
        </Link>

        <a
          href="https://t.me/AccMarketSupport"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white"
        >
          Support
        </a>
      </div>
    </div>
  </div>
</footer>

      {/* BACK TO TOP */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#0b1e5b] text-lg font-bold text-white shadow-xl transition hover:-translate-y-1"
        aria-label="Back to top"
      >
        ↑
      </button>
    </main>
  );
}