"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

import {
  DesktopSidebar,
  DesktopHeader,
  MobileHeader,
  MobileMenuDrawer,
  BottomNav,
} from "@/components/navigation";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  kyc_status?: string | null;
  avatar_url?: string | null;
  telegram_notifications?: boolean;
  trust_score?: number | null;
  is_active?: boolean;
}

interface Platform {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  badge: string;
  logoUrl: string;
  logoBg: string;
  accent: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "facebook",
    name: "Facebook",
    shortName: "Facebook",
    category: "Social",
    description:
      "Create a clear Facebook listing with the account details buyers need to evaluate your offer.",
    badge: "Popular",
    logoUrl:
      "/platforms/facebook.png",
    logoBg: "bg-[#eef4ff]",
    accent: "#1877F2",
  },
  {
    id: "instagram",
    name: "Instagram",
    shortName: "Instagram",
    category: "Social",
    description:
      "Present Instagram accounts with structured details, transparent pricing and useful account information.",
    badge: "Trending",
    logoUrl:
      "/platforms/instagram.png",
    logoBg: "bg-[#fff3f7]",
    accent: "#E1306C",
  },
  {
    id: "tiktok",
    name: "TikTok",
    shortName: "TikTok",
    category: "Social",
    description:
      "Build a professional TikTok listing with relevant account information and straightforward pricing.",
    badge: "Hot",
    logoUrl:
      "/platforms/tiktok.png",
    logoBg: "bg-[#f5f5f5]",
    accent: "#111111",
  },
  {
    id: "x",
    name: "X",
    shortName: "X",
    category: "Social",
    description:
      "Create an organized X account listing with clear information for prospective buyers.",
    badge: "Popular",
    logoUrl:
      "/platforms/twitter.png",
    logoBg: "bg-[#f4f4f4]",
    accent: "#111111",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    shortName: "Snapchat",
    category: "Social",
    description:
      "List Snapchat accounts with relevant account information and a clean buyer-facing presentation.",
    badge: "Social",
    logoUrl:
      "/platforms/snapchat.png",
    logoBg: "bg-[#fffbea]",
    accent: "#FFFCC0",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    shortName: "LinkedIn",
    category: "Professional",
    description:
      "Create structured LinkedIn listings with useful professional account information.",
    badge: "Business",
    logoUrl:
      "/platforms/linkedin.png",
    logoBg: "bg-[#eef7ff]",
    accent: "#0A66C2",
  },
  {
    id: "reddit",
    name: "Reddit",
    shortName: "Reddit",
    category: "Community",
    description:
      "Create detailed Reddit listings with transparent account information and pricing.",
    badge: "Community",
    logoUrl:
      "/platforms/reddit.png",
    logoBg: "bg-[#fff4ef]",
    accent: "#FF4500",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    shortName: "Pinterest",
    category: "Discovery",
    description:
      "Build clean Pinterest listings around useful account information and audience details.",
    badge: "Discovery",
    logoUrl:
      "/platforms/pinterest.png",
    logoBg: "bg-[#fff2f4]",
    accent: "#BD081C",
  },
  {
    id: "discord",
    name: "Discord",
    shortName: "Discord",
    category: "Community",
    description:
      "Present Discord accounts with clear information and an easy-to-understand listing.",
    badge: "Community",
    logoUrl:
      "/platforms/discord.png",
    logoBg: "bg-[#f0f2ff]",
    accent: "#5865F2",
  },
  {
    id: "twitch",
    name: "Twitch",
    shortName: "Twitch",
    category: "Streaming",
    description:
      "Create Twitch listings with relevant account details and transparent marketplace information.",
    badge: "Streaming",
    logoUrl:
      "/platforms/twitch.png",
    logoBg: "bg-[#f5f0ff]",
    accent: "#9146FF",
  },
];

const CATEGORIES = [
  "All",
  "Social",
  "Community",
  "Professional",
  "Discovery",
  "Streaming",
];

export default function SellHubPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  
  useEffect(() => {
    let mounted = true;

    const loadSellerData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setLoading(false);
          return;
        }

        const [profileResult, notificationResult] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              `
                id,
                username,
                email,
                role,
                kyc_status,
                avatar_url,
                telegram_notifications,
                trust_score,
                is_active
              `
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("notifications")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id)
            .eq("is_read", false),
        ]);

        if (!mounted) return;

        // Directly use the avatar_url from the profiles table or user metadata without bucket transformation
        const rawAvatar = profileResult.data?.avatar_url || user.user_metadata?.avatar_url || null;

        if (profileResult.data) {
          setProfile({
            ...profileResult.data,
            email: profileResult.data.email || user.email || "",
            avatar_url: rawAvatar,
          });
        } else {
          setProfile({
            id: user.id,
            username: user.email?.split("@")[0] || "Seller",
            email: user.email || "",
            role: "seller",
            avatar_url: rawAvatar,
          });
        }

        setHasUnread((notificationResult.count || 0) > 0);
      } catch (error) {
        console.error("Failed to load seller hub:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSellerData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const filteredPlatforms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PLATFORMS.filter((platform) => {
      const matchesCategory =
        category === "All" || platform.category === category;

      const matchesSearch =
        !query ||
        platform.name.toLowerCase().includes(query) ||
        platform.category.toLowerCase().includes(query) ||
        platform.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleListAccountClick = () => {
    window.location.href = "/sell";
  };

  const navProfile = {
    username: profile?.username || "User",
    email: profile?.email || "",
    avatar_url: profile?.avatar_url || null,
    role: profile?.role || "buyer",
  };


  return (
  <div className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
    {/* DESKTOP NAVIGATION */}
    <DesktopSidebar
      profile={navProfile}
      hasUnread={hasUnread}
      onSignOut={handleSignOut}
      onListAccountClick={handleListAccountClick}
    />

    {/* MOBILE NAVIGATION */}
    <MobileHeader setMobileMenuOpen={setMobileMenuOpen} />

    <MobileMenuDrawer
      isOpen={mobileMenuOpen}
      setIsOpen={setMobileMenuOpen}
      profile={navProfile}
      hasUnread={hasUnread}
      onSignOut={handleSignOut}
      onListAccountClick={handleListAccountClick}
    />

    <BottomNav hasUnread={hasUnread} />

    {/* MAIN */}
    <main className="lg:pl-[252px]">
      <DesktopHeader
        profile={navProfile}
        hasUnread={hasUnread}
        sectionLabel="SELL"
        pageTitle="Seller Hub"
      />

        <div className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7">
          {/* PAGE INTRO */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0b1e5b]" />

                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8b939e]">
                  Seller marketplace
                </span>
              </div>

              <h1 className="text-[25px] font-black tracking-[-0.045em] text-[#111827] sm:text-[31px]">
                Create a listing
              </h1>

              <p className="mt-1.5 max-w-[650px] text-[10.5px] leading-5 text-[#747d89] sm:text-[11px]">
                Choose the platform your account belongs to and start building
                your marketplace listing.
              </p>
            </div>

            <Link
              href="/dashboard/transactions"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[#e1e5ea] bg-white px-4 text-[9px] font-black text-[#555e69] shadow-[0_4px_16px_rgba(15,23,42,0.025)] transition hover:border-[#cfd5dc] hover:text-[#0b1e5b] sm:flex"
            >
              <ActivityIcon className="h-3.5 w-3.5" />
              My activity
            </Link>
          </div>

          {/* HERO */}
          <section className="relative mb-7 overflow-hidden rounded-[28px] bg-[#0b1e5b] shadow-[0_24px_60px_rgba(11,30,91,0.14)]">
            {/* PREMIUM HERO DECOR */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-36 -top-44 h-[720px] w-[210px] rotate-[35deg] bg-white/[0.065] blur-3xl" />
              <div className="absolute right-[18%] -bottom-52 h-[560px] w-[145px] rotate-[35deg] bg-white/[0.045] blur-3xl" />
              <div className="absolute -right-20 top-[-80px] h-[430px] w-[430px] rounded-full bg-white/[0.025] blur-3xl" />
              <div className="absolute -right-36 -top-40 h-[470px] w-[470px] rounded-full border border-white/[0.075]" />
              <div className="absolute -right-10 -top-24 h-[320px] w-[320px] rounded-full border border-white/[0.065]" />
              <div className="absolute right-[55px] top-[5px] h-[185px] w-[185px] rounded-full border border-white/[0.045]" />
              <div className="absolute -bottom-48 left-[43%] h-[410px] w-[410px] rounded-full border border-white/[0.05]" />
              <div className="absolute right-[27%] top-[32%] h-20 w-20 rounded-full bg-white/[0.025] blur-2xl" />
            </div>

            <div className="relative grid lg:grid-cols-[1.15fr_.85fr]">
              {/* HERO COPY */}
              <div className="px-6 py-8 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0b1e5b]">
                    <SparkIcon className="h-3 w-3" />
                  </span>

                  <span className="text-[8px] font-black uppercase tracking-[0.16em] text-white/80">
                    Seller Central
                  </span>
                </div>

                <h2 className="max-w-[690px] text-[32px] font-black leading-[1.03] tracking-[-0.055em] text-white sm:text-[44px]">
                  List it.
                  <span className="block text-white/55">
                    Get discovered.
                  </span>
                </h2>

                <p className="mt-5 max-w-[590px] text-[11px] leading-6 text-white/60 sm:text-[12px]">
                  Choose a platform below to create a structured listing for
                  your account. Keep your information accurate, your pricing
                  clear and your listing easy for buyers to understand.
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                    <CheckIcon className="h-3 w-3 text-white/80" />
                    <span className="text-[8px] font-bold text-white/65">
                      Structured listings
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                    <ShieldCheckIcon className="h-3 w-3 text-white/80" />
                    <span className="text-[8px] font-bold text-white/65">
                      Marketplace flow
                    </span>
                  </div>
                </div>
              </div>

              {/* HERO SIDE */}
              <div className="relative border-t border-white/[0.08] bg-white/[0.025] px-6 py-7 lg:border-l lg:border-t-0 lg:px-9 lg:py-10">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                    Your seller workspace
                  </span>

                  <span className="flex items-center gap-1.5 text-[8px] font-bold text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#a9bae0]" />
                    Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  <HeroMetric
                    icon={<GridIcon className="h-4 w-4" />}
                    label="Available platforms"
                    value={String(PLATFORMS.length)}
                    description="Choose where your account belongs"
                  />

                  <HeroMetric
                    icon={<SearchIcon className="h-4 w-4" />}
                    label="Listing discovery"
                    value="Ready"
                    description="Help buyers find the right listing"
                  />

                  <HeroMetric
                    icon={<ShieldCheckIcon className="h-4 w-4" />}
                    label="Seller tools"
                    value="Active"
                    description="Create and manage your listings"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/[0.1] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white">
                      <UserIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-black text-white">
                        {profile?.username || "Seller account"}
                      </p>

                      <p className="mt-1 truncate text-[7px] text-white/35">
                        Select a platform below to continue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SEARCH + FILTER */}
          <section className="mb-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* SEARCH */}
              <div className="relative w-full lg:max-w-[430px]">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa2ad]" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search platforms..."
                  aria-label="Search platforms"
                  className="h-12 w-full rounded-2xl border border-[#e0e4e9] bg-white pl-11 pr-11 text-[11px] font-semibold text-[#1f2937] outline-none shadow-[0_5px_18px_rgba(15,23,42,0.025)] placeholder:text-[#a4abb4] transition focus:border-[#b8c2d0] focus:ring-4 focus:ring-[#0b1e5b]/[0.04]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#929aa5] transition hover:bg-[#f2f4f6] hover:text-[#111827]"
                    aria-label="Clear search"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* CATEGORY FILTERS */}
              <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((item) => {
                  const active = category === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={[
                        "shrink-0 rounded-xl px-4 py-2.5 text-[9px] font-black transition-all",
                        active
                          ? "bg-[#0b1e5b] text-white shadow-[0_7px_18px_rgba(11,30,91,0.14)]"
                          : "border border-[#e3e6ea] bg-white text-[#717985] hover:border-[#ccd2da] hover:text-[#0b1e5b]",
                      ].join(" ")}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* PLATFORM HEADING */}
          <section className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a0a7b0]">
                Choose your platform
              </p>

              <div className="mt-1.5 flex items-center gap-2">
                <h2 className="text-[18px] font-black tracking-[-0.035em] text-[#172033]">
                  Where do you want to sell?
                </h2>

                <span className="rounded-full bg-[#edf0f4] px-2 py-1 text-[8px] font-black text-[#747d89]">
                  {filteredPlatforms.length}
                </span>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b1b8c2]" />

              <span className="text-[8px] font-semibold text-[#9299a3]">
                Select a platform to continue
              </span>
            </div>
          </section>

          {/* PLATFORM GRID */}
             {loading ? (
            <PlatformSkeletonGrid />
          ) : filteredPlatforms.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPlatforms.map((platform, index) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  index={index}
                  imageError={Boolean(imageErrors[platform.id])}
                  onImageError={() =>
                    setImageErrors((current) => ({
                      ...current,
                      [platform.id]: true,
                    }))
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyPlatforms
              search={search}
              onReset={() => {
                setSearch("");
                setCategory("All");
              }}
            />
          )}

          {/* SELLER STANDARDS */}
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a0a7b0]">
                Seller standards
              </p>

              <h2 className="mt-1.5 text-[18px] font-black tracking-[-0.035em] text-[#172033]">
                Build listings buyers can trust
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TrustFeature
                icon={<BadgeCheckIcon className="h-4 w-4" />}
                title="Accurate information"
                description="Keep account details accurate and up to date so buyers know exactly what they are purchasing."
              />

              <TrustFeature
                icon={<ShieldCheckIcon className="h-4 w-4" />}
                title="Transparent listings"
                description="Use clear descriptions, pricing and account information to create better listings."
              />

              <TrustFeature
                icon={<HeadsetIcon className="h-4 w-4" />}
                title="Stay responsive"
                description="Respond quickly to buyer messages and keep communication clear throughout the transaction."
              />
            </div>
          </section>

          {/* FOOTER */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#e6e9ed] pt-5 sm:flex-row">
            <p className="text-center text-[8px] font-semibold text-[#a0a7b0] sm:text-left">
              AccMarket Seller Hub
              <span className="mx-2 text-[#d1d5db]">/</span>
              Choose a platform to create your listing.
            </p>

            <div className="flex items-center gap-2 text-[8px] font-bold text-[#9aa2ad]">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-[#0b1e5b]" />
              Seller marketplace
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PLATFORM CARD                                                              */
/* -------------------------------------------------------------------------- */

function PlatformCard({
  platform,
  index,
  imageError,
  onImageError,
}: {
  platform: Platform;
  index: number;
  imageError: boolean;
  onImageError: () => void;
}) {
  return (
    <Link
      href={`/dashboard/sell/${platform.id}`}
      className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-[24px] border border-[#e0e4e9] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ccd3dc] hover:shadow-[0_22px_45px_rgba(15,23,42,0.08)] sm:p-6"
      style={{
        animationDelay: `${index * 45}ms`,
      }}
    >
      <div
        className="absolute left-0 right-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundColor: platform.accent }}
      />


      <div
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.06]"
        style={{ backgroundColor: platform.accent }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-black/[0.035] p-3 shadow-sm transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-md",
            platform.logoBg,
          ].join(" ")}
        >
          {imageError ? (
            <span
              className="text-[18px] font-black"
              style={{ color: platform.accent }}
            >
              {platform.shortName.charAt(0)}
            </span>
          ) : (
            <img
              src={platform.logoUrl}
              alt={`${platform.shortName} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={onImageError}
            />
          )}
        </div>

        <span className="rounded-full border border-[#e7eaee] bg-[#fafbfc] px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#7d8691]">
          {platform.badge}
        </span>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: platform.accent }}
          />

          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#a0a7b0]">
            {platform.category}
          </span>
        </div>

        <h3 className="text-[16px] font-black tracking-[-0.03em] text-[#172033] transition-colors group-hover:text-[#0b1e5b]">
          {platform.name}
        </h3>

        <p className="mt-2 text-[10px] leading-[1.7] text-[#747d89]">
          {platform.description}
        </p>
      </div>

      <div className="relative mt-auto pt-6">
        <div className="flex items-center justify-between border-t border-[#eff1f3] pt-4">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#a5acb5]">
              Seller action
            </p>

            <p className="mt-1 text-[9px] font-black text-[#172033]">
              Create listing
            </p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f5f8] text-[#0b1e5b] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#0b1e5b] group-hover:text-white">
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* HERO METRIC                                                                */
/* -------------------------------------------------------------------------- */

function HeroMetric({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white/80">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[8px] font-bold text-white/45">
            {label}
          </p>

          <span className="text-[9px] font-black text-white">
            {value}
          </span>
        </div>

        <p className="mt-1 truncate text-[7px] text-white/25">
          {description}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRUST FEATURE                                                              */
/* -------------------------------------------------------------------------- */

function TrustFeature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex gap-3 rounded-[20px] border border-[#e2e6eb] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/[0.06] text-[#0b1e5b] transition group-hover:bg-[#0b1e5b] group-hover:text-white">
        {icon}
      </div>

      <div>
        <h3 className="text-[10px] font-black text-[#1f2937]">
          {title}
        </h3>

        <p className="mt-1 text-[8.5px] leading-4 text-[#7b8490]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING                                                                    */
/* -------------------------------------------------------------------------- */

function PlatformSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[280px] animate-pulse rounded-[24px] border border-[#e5e8ec] bg-white p-5 sm:p-6"
        >
          <div className="flex justify-between">
            <div className="h-14 w-14 rounded-[18px] bg-[#eef0f3]" />
            <div className="h-6 w-16 rounded-full bg-[#f0f2f4]" />
          </div>

          <div className="mt-6 h-2 w-20 rounded-full bg-[#eef0f2]" />

          <div className="mt-3 h-5 w-32 rounded-lg bg-[#eceff2]" />

          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded-full bg-[#f0f2f4]" />
            <div className="h-2 w-[90%] rounded-full bg-[#f0f2f4]" />
            <div className="h-2 w-[65%] rounded-full bg-[#f0f2f4]" />
          </div>

          <div className="mt-10 border-t border-[#f0f2f4] pt-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-2 w-16 rounded-full bg-[#f0f2f4]" />
                <div className="h-2 w-24 rounded-full bg-[#eceff2]" />
              </div>

              <div className="h-9 w-9 rounded-xl bg-[#eef0f3]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyPlatforms({
  search,
  onReset,
}: {
  search: string;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d9dee4] bg-white px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f3f6] text-[#69727e]">
        <SearchIcon className="h-5 w-5" />
      </div>

      <h3 className="mt-5 text-[14px] font-black text-[#172033]">
        No platforms found
      </h3>

      <p className="mt-2 max-w-[360px] text-[10px] leading-5 text-[#7d8691]">
        Nothing matched{" "}
        {search ? `"${search}"` : "your current filters"}. Try another
        search or reset your filters.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 h-10 rounded-xl bg-[#0b1e5b] px-5 text-[9px] font-black text-white transition hover:bg-[#102b78]"
      >
        Reset filters
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ICONS                                                                      */
/* -------------------------------------------------------------------------- */

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function ActivityIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 12h4l2-7 4 14 2-7h4" />
    </svg>
  );
}

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 3 20 6v5c0 5-3.2 8.7-8 10-4.8-1.3-8-5-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}

function GridIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.7 3-5.5 7-5.5s6.2 1.8 7 5.5" />
    </svg>
  );
}

function HeadsetIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2v1Z" />
      <path d="M20 14a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2v1Z" />
      <path d="M17 18c-.7 1.2-1.8 2-3.5 2H12" />
    </svg>
  );
}

function BadgeCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m12 3 2 1.5 2.5-.2 1.2 2.2 2.2 1.2-.2 2.5 1.5 2-1.5 2 .2 2.5-2.2 1.2-1.2 2.2-2.5-.2-2 1.5-2 1.5-2-1.5-2.5.2-1.2-2.2-2.2-1.2.2-2.5-1.5-2 1.5-2-.2-2.5 2.2-1.2 1.2-2.2 2.5.2 2-1.5Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}
