"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
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

/* =========================================================
   TYPES
========================================================= */

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  kyc_status?: string | null;
  avatar_url?: string | null;
  trust_score?: number | null;
  is_active?: boolean;
}

interface PlatformConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  accent: string;
 logo: string;
 initial: string;
}

type Notice = {
  type: "error" | "success" | "info";
  message: string;
};

/* =========================================================
   PLATFORM CONFIGURATION
========================================================= */

const PLATFORM_DETAILS: Record<string, PlatformConfig> = {
  facebook: {
    id: "facebook",
    name: "Facebook",
    category: "Social",
    description:
      "Create a clear listing with accurate account details, audience information, and transparent pricing.",
    accent: "#1877F2",
    initial: "f",
    logo: "/platforms/facebook.png",
  },

  instagram: {
    id: "instagram",
    name: "Instagram",
    category: "Social",
    description:
      "Present your Instagram account with clear audience information, engagement details, and pricing.",
    accent: "#E1306C",
    initial: "ig",
    logo: "/platforms/instagram.png",
  },

  tiktok: {
    id: "tiktok",
    name: "TikTok",
    category: "Social",
    description:
      "Showcase your creator account with accurate audience statistics, niche information, and pricing.",
    accent: "#111111",
    initial: "t",
    logo: "/platforms/tiktok.png",
  },

  x: {
    id: "x",
    name: "X",
    category: "Social",
    description:
      "Create an organized listing with transparent account details and pricing.",
    accent: "#111111",
    initial: "X",
    logo: "/platforms/twitter.png",
  },

  snapchat: {
    id: "snapchat",
    name: "Snapchat",
    category: "Social",
    description:
      "Provide accurate account details and relevant audience information for your listing.",
    accent: "#E6D900",
    initial: "S",
    logo: "/platforms/snapchat.png",
  },

  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    category: "Professional",
    description:
      "Provide clear information about your account and its professional features.",
    accent: "#0A66C2",
    initial: "in",
    logo: "/platforms/linkedin.png",
  },

  reddit: {
    id: "reddit",
    name: "Reddit",
    category: "Community",
    description:
      "Describe your account accurately, including account age, karma, and relevant community activity.",
    accent: "#FF4500",
    initial: "r",
    logo: "/platforms/reddit.png",
  },

  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    category: "Discovery",
    description:
      "Build a structured listing with accurate account and audience information.",
    accent: "#BD081C",
    initial: "P",
    logo: "/platforms/pinterest.png",
  },

  discord: {
    id: "discord",
    name: "Discord",
    category: "Community",
    description:
      "Describe your eligible Discord-related listing with clear details and transparent pricing.",
    accent: "#5865F2",
    initial: "D",
    logo: "/platforms/discord.png",
  },

  twitch: {
    id: "twitch",
    name: "Twitch",
    category: "Streaming",
    description:
      "Present your streaming channel with accurate follower, content, and monetization information.",
    accent: "#9146FF",
    initial: "T",
    logo: "/platforms/twitch.png",
  },
};


const LOGIN_FORMAT_OPTIONS = [
  "email + password",
  "username + password",
  "number + password",
  "2fa enabled",
  "others",
];


/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="m14 18-6-6 6-6" />
          <path d="M8 12h12" />
        </svg>
      );

    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </svg>
      );

    case "link":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71" />
        </svg>
      );

    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );

    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      );

    case "alert":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      );

    case "check-circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m18 6-12 12M6 6l12 12" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1e5b]/[0.06] text-[11px] font-black text-[#0b1e5b]">
        {number}
      </div>

      <div>
        <h2 className="text-[14px] font-black tracking-[-0.025em] text-[#111827]">
          {title}
        </h2>

        <p className="mt-1 text-[10px] leading-5 text-[#818995]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.12em] text-[#606a78]">
        {label}
        {required && <span className="ml-1 text-[#b42318]">*</span>}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-[9px] leading-4 text-[#969eaa]">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-[#e1e5eb] bg-[#fafbfc] px-4 text-[11px] font-semibold text-[#1f2937] outline-none transition placeholder:font-medium placeholder:text-[#a4abb5] hover:border-[#cbd2dc] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/[0.045]";

const textareaClass =
  "w-full resize-y rounded-xl border border-[#e1e5eb] bg-[#fafbfc] p-4 text-[11px] font-semibold leading-6 text-[#1f2937] outline-none transition placeholder:font-medium placeholder:text-[#a4abb5] hover:border-[#cbd2dc] focus:border-[#0b1e5b] focus:bg-white focus:ring-4 focus:ring-[#0b1e5b]/[0.045]";

/* =========================================================
   MAIN PAGE
========================================================= */

export default function PlatformSellPage() {
  const router = useRouter();
  const params = useParams();

  const platformId =
    typeof params?.platform === "string"
      ? params.platform.toLowerCase()
      : "";

  const platform = PLATFORM_DETAILS[platformId] ?? null;

  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [accountUsername, setAccountUsername] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [accountAge, setAccountAge] = useState("");
  const [accountRegion, setAccountRegion] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

      // Dynamic credentials state
  const [credentialValues, setCredentialValues] = useState({
    email: "",
    email_password: "",
    username: "",
    phone: "",
    password: "",
    two_factor_code: "",
    others: "",
  });



  // Public Preview Image State
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPreviewUrl, setPreviewPreviewUrl] = useState("");

  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  /* =======================================================
     LOAD AUTHENTICATED USER
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadUserData() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!mounted) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        const [profileResult, notificationResult] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, username, email, role, kyc_status, avatar_url, trust_score, is_active"
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

        const dbProfile = profileResult.data;

        setProfile({
          id: user.id,
          username:
            dbProfile?.username ||
            user.email?.split("@")[0] ||
            "Seller",
          email: dbProfile?.email || user.email || "",
          role: dbProfile?.role || "buyer",
          kyc_status: dbProfile?.kyc_status ?? null,
          avatar_url:
            dbProfile?.avatar_url ||
            user.user_metadata?.avatar_url ||
            null,
          trust_score: dbProfile?.trust_score ?? null,
          is_active: dbProfile?.is_active ?? true,
        });

        setHasUnread((notificationResult.count || 0) > 0);
      } catch (error) {
        console.error("Failed to load listing page:", error);

        if (mounted) {
          setNotice({
            type: "error",
            message: "We couldn't load your account. Refresh the page and try again.",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUserData();

    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  /* =======================================================
     CLEAN UP IMAGE PREVIEWS
  ======================================================= */

  useEffect(() => {
    if (!screenshotFile) {
      setScreenshotPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(screenshotFile);
    setScreenshotPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [screenshotFile]);

  useEffect(() => {
    if (!previewFile) {
      setPreviewPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(previewFile);
    setPreviewPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewFile]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleListAccountClick = () => {
    router.push("/dashboard/sell");
  };

  const navProfile = {
    username: profile?.username || "User",
    email: profile?.email || "",
    avatar_url: profile?.avatar_url || null,
    role: profile?.role || "buyer",
  };

  /* =======================================================
     FORM HELPERS
  ======================================================= */

  const formatPrice = useCallback((value: string) => {
    if (!value) return "";

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return "";

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(numericValue);
  }, []);

  const handleFormatToggle = (format: string) => {
    setNotice(null);

    setSelectedFormats((current) => {
      if (current.includes(format)) {
        return current.filter((item) => item !== format);
      }

      if (current.length >= 3) {
        setNotice({
          type: "error",
          message: "You can select a maximum of three login formats.",
        });

        return current;
      }

      return [...current, format];
    });
  };

  const handlePreviewFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNotice(null);
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewFile(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPreviewFile(null);
      event.target.value = "";
      setNotice({ type: "error", message: "Choose a JPG, PNG, or WebP preview image." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPreviewFile(null);
      event.target.value = "";
      setNotice({ type: "error", message: "Preview image must be 5 MB or smaller." });
      return;
    }

    setPreviewFile(file);
  };

  const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNotice(null);

    const file = event.target.files?.[0];

    if (!file) {
      setScreenshotFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setScreenshotFile(null);
      event.target.value = "";

      setNotice({
        type: "error",
        message: "Choose a JPG, PNG, or WebP image.",
      });

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setScreenshotFile(null);
      event.target.value = "";

      setNotice({
        type: "error",
        message: "Your screenshot must be 5 MB or smaller.",
      });

      return;
    }

    setScreenshotFile(file);
  };

  const generateVerificationCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!platform) {
      setNotice({
        type: "error",
        message: "This platform is not supported.",
      });

      return;
    }

    if (
      !accountUsername.trim() ||
      !profileLink.trim() ||
      !accountAge.trim() ||
      !accountRegion.trim() ||
      selectedFormats.length === 0 ||
      !description.trim() ||
      !price.trim() ||
      !previewFile
    ) {
      setNotice({
        type: "error",
        message: "Complete all required fields and upload a preview image before continuing.",
      });

      return;
    }

    // Validate credential fields against selected formats
    if (selectedFormats.includes("email + password") && (!credentialValues.email || !credentialValues.email_password)) {
      setNotice({ type: "error", message: "Email and email password are required for the selected login format." });
      return;
    }
    if (selectedFormats.includes("username + password") && (!credentialValues.username || !credentialValues.password)) {
      setNotice({ type: "error", message: "Username and password are required for the selected login format." });
      return;
    }
    if (selectedFormats.includes("number + password") && (!credentialValues.phone || !credentialValues.password)) {
      setNotice({ type: "error", message: "Phone number and password are required for the selected login format." });
      return;
    }
    if (selectedFormats.includes("2fa enabled") && !credentialValues.two_factor_code.trim()) {
      setNotice({ type: "error", message: "2FA secret key or backup codes are required when 2FA is enabled." });
      return;
    }
    if (selectedFormats.includes("others") && !credentialValues.others.trim()) {
      setNotice({ type: "error", message: "Additional information or token is required when 'others' is selected." });
      return;
    }



    let parsedUrl: URL;

    try {
      parsedUrl = new URL(profileLink.trim());
    } catch {
      setNotice({
        type: "error",
        message: "Enter a valid profile URL.",
      });

      return;
    }

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.protocol !== "http:"
    ) {
      setNotice({
        type: "error",
        message: "Your profile link must use HTTP or HTTPS.",
      });

      return;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      numericPrice > 100_000_000
    ) {
      setNotice({
        type: "error",
        message: "Enter a valid price greater than ₦0.",
      });

      return;
    }

    if (description.trim().length < 20) {
      setNotice({
        type: "error",
        message: "Please provide a description of at least 20 characters.",
      });

      return;
    }

    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);

    const randomChars = Array.from(randomBytes)
      .map((byte) => (byte % 36).toString(36))
      .join("")
      .toUpperCase();

    setVerificationCode(`ACCMARKET-${randomChars}`);
    setScreenshotFile(null);
    setVerificationStep(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     SUBMIT LISTING (SECURE SERVER WORKFLOW)
  ======================================================= */

        const handleFinalPublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (submitting) return;

    if (!platform || !screenshotFile || !previewFile) {
      setNotice({ type: "error", message: "Please ensure both the preview image and verification screenshot are attached." });
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // Build FormData payload to send files and data directly to the server API route
      const formData = new FormData();
      formData.append("platform", platform.id);
      formData.append("account_username", accountUsername.trim());
      formData.append("profile_link", profileLink.trim());
      formData.append("account_age", accountAge.trim());
      formData.append("account_region", accountRegion.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("login_formats", JSON.stringify(selectedFormats));
      
                  formData.append("credentials", JSON.stringify({
        email: selectedFormats.includes("email + password") ? credentialValues.email : null,
        email_password: selectedFormats.includes("email + password") ? credentialValues.email_password : null,
        username: selectedFormats.includes("username + password") ? credentialValues.username : null,
        phone: selectedFormats.includes("number + password") ? credentialValues.phone : null,
        password: credentialValues.password || null,
        two_factor_enabled: selectedFormats.includes("2fa enabled"),
        two_factor_code: selectedFormats.includes("2fa enabled") ? credentialValues.two_factor_code : null,
        others: selectedFormats.includes("others") ? credentialValues.others : null,
      }));



      formData.append("preview_image", previewFile);
      formData.append("screenshot", screenshotFile);

      const response = await fetch("/api/listings/create", {
        method: "POST",
        body: formData,
      });

            const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit listing.");
      }

      setNotice({
        type: "success",
        message: "Listing submitted successfully! Redirecting to seller hub...",
      });

      setTimeout(() => {
        router.push("/dashboard/sell");
      }, 2000);
    } catch (error: any) {
      console.error("Submission failed:", error);
      setNotice({ type: "error", message: error.message || "Failed to submit listing." });
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
        <DesktopSidebar
          profile={navProfile}
          hasUnread={hasUnread}
          onSignOut={handleSignOut}
          onListAccountClick={handleListAccountClick}
        />

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

        <main className="min-h-screen lg:pl-[252px]">
          <DesktopHeader
            profile={navProfile}
            hasUnread={hasUnread}
            sectionLabel="SELLER HUB"
            pageTitle="Listing"
          />

          <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
            {/* Breadcrumb Skeleton */}
            <div className="mb-7 flex items-center justify-between">
              <div className="h-10 w-32 rounded-xl bg-[#e9ecf0] animate-pulse" />
              <div className="h-7 w-24 rounded-full bg-[#e9ecf0] animate-pulse" />
            </div>

            {/* Title & Intro Skeleton */}
            <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="space-y-3">
                <div className="h-3 w-40 rounded bg-[#e9ecf0] animate-pulse" />
                <div className="h-9 w-72 rounded-lg bg-[#e9ecf0] animate-pulse" />
                <div className="h-4 w-96 max-w-full rounded bg-[#e9ecf0] animate-pulse" />
              </div>
              <div className="h-12 w-40 rounded-2xl bg-[#e9ecf0] animate-pulse" />
            </div>

            {/* Platform Summary Skeleton */}
            <div className="mb-7 rounded-[22px] border border-[#e0e5ed] bg-white p-5 sm:p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-[54px] w-[54px] rounded-[17px] bg-[#e9ecf0]" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 rounded bg-[#e9ecf0]" />
                  <div className="h-5 w-36 rounded bg-[#e9ecf0]" />
                  <div className="h-3 w-48 rounded bg-[#e9ecf0]" />
                </div>
              </div>
            </div>

            {/* Form Main Layout Skeleton */}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
              <div className="space-y-6">
                {/* Section 01: Account Details */}
                <div className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 sm:p-7 animate-pulse">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#e9ecf0]" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-[#e9ecf0]" />
                      <div className="h-3 w-48 rounded bg-[#e9ecf0]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-24 rounded bg-[#e9ecf0]" />
                        <div className="h-12 w-full rounded-xl bg-[#f0f2f5]" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 02: Preview Image */}
                <div className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 sm:p-7 animate-pulse">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#e9ecf0]" />
                    <div className="space-y-2">
                      <div className="h-4 w-44 rounded bg-[#e9ecf0]" />
                      <div className="h-3 w-64 rounded bg-[#e9ecf0]" />
                    </div>
                  </div>
                  <div className="h-40 w-full rounded-2xl bg-[#f0f2f5]" />
                </div>

                {/* Section 03: Login Format Grid */}
                <div className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 sm:p-7 animate-pulse">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#e9ecf0]" />
                    <div className="space-y-2">
                      <div className="h-4 w-52 rounded bg-[#e9ecf0]" />
                      <div className="h-3 w-64 rounded bg-[#e9ecf0]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-[58px] rounded-xl bg-[#f0f2f5]" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="space-y-4 xl:sticky xl:top-6 animate-pulse">
                <div className="rounded-[22px] border border-[#e2e6ec] bg-white p-6 space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-[#e9ecf0]" />
                  <div className="h-4 w-48 rounded bg-[#e9ecf0]" />
                  <div className="h-3 w-full rounded bg-[#e9ecf0]" />
                  <div className="h-3 w-3/4 rounded bg-[#e9ecf0]" />
                </div>
                <div className="rounded-[20px] border border-[#e2e6ec] bg-white p-5 space-y-3">
                  <div className="h-4 w-32 rounded bg-[#e9ecf0]" />
                  <div className="h-3 w-full rounded bg-[#e9ecf0]" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }


  

  /* =======================================================
     INVALID PLATFORM
  ======================================================= */

  if (!platform) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfdfc] px-5">
        <div className="w-full max-w-[420px] rounded-[24px] border border-[#e5e8ed] bg-white p-8 text-center shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1e5b]/[0.06] text-[#0b1e5b]">
            <Icon name="alert" className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-xl font-black tracking-tight text-[#111827]">
            Platform not found
          </h1>

          <p className="mt-2 text-[11px] leading-6 text-[#737d8b]">
            The platform you selected is unavailable. Return to the Seller Hub
            and choose a supported platform.
          </p>

          <Link
            href="/dashboard/sell"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-5 text-[10px] font-black text-white transition hover:bg-[#091747]"
          >
            <Icon name="arrow-left" className="h-3.5 w-3.5" />
            Back to platforms
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      <DesktopSidebar
        profile={navProfile}
        hasUnread={hasUnread}
        onSignOut={handleSignOut}
        onListAccountClick={handleListAccountClick}
      />

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

      <main className="min-h-screen lg:pl-[252px]">
        <DesktopHeader
          profile={navProfile}
          hasUnread={hasUnread}
          sectionLabel="SELLER HUB"
          pageTitle={`${platform.name} Listing`}
        />

        <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {/* BREADCRUMB */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/sell"
              className="group inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ea] bg-white px-3.5 text-[10px] font-bold text-[#68717e] transition hover:border-[#cbd3de] hover:text-[#0b1e5b]"
            >
              <Icon
                name="arrow-left"
                className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5"
              />
              Back to platforms
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-[#e4e7ec] bg-white px-3 py-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: platform.accent }}
              />

              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6c7582]">
                {platform.category}
              </span>
            </div>
          </div>

          {/* PAGE INTRO */}
          <section className="mb-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0b1e5b]" />

                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8d96a3]">
                    AccMarket Seller Hub
                  </span>
                </div>

                <h1 className="text-[29px] font-black tracking-[-0.055em] text-[#111827] sm:text-[37px]">
                  {verificationStep
                    ? "Verify your listing"
                    : `List your ${platform.name} account`}
                </h1>

                <p className="mt-2 max-w-[590px] text-[11px] leading-6 text-[#7b8491]">
                  {verificationStep
                    ? "Complete the ownership-check step and submit your listing for review."
                    : platform.description}
                </p>
              </div>

              {/* STEP INDICATOR */}
              <div className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-[#e6e9ed] bg-white p-2 sm:self-auto">
                <div
                  className={[
                    "flex h-8 items-center gap-2 rounded-xl px-3 transition",
                    !verificationStep
                      ? "bg-[#0b1e5b] text-white"
                      : "text-[#737d89]",
                  ].join(" ")}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/15 text-[8px] font-black">
                    1
                  </span>

                  <span className="text-[9px] font-black">Details</span>
                </div>

                <div className="h-px w-4 bg-[#e1e5ea]" />

                <div
                  className={[
                    "flex h-8 items-center gap-2 rounded-xl px-3 transition",
                    verificationStep
                      ? "bg-[#0b1e5b] text-white"
                      : "text-[#929aa5]",
                  ].join(" ")}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[8px] font-black">
                    2
                  </span>

                  <span className="text-[9px] font-black">
                    Verification
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* PLATFORM SUMMARY */}
                    <section className="relative mb-7 overflow-hidden rounded-[22px] border border-[#e0e5ed] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.025)] sm:p-6">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1"
              style={{ backgroundColor: platform.accent }}
            />

            <div className="flex items-center gap-4">
              <div
                className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[17px] overflow-hidden p-2.5"
                style={{
                  backgroundColor: `${platform.accent}12`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={platform.logo}
                  alt={`${platform.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black uppercase tracking-[0.17em] text-[#9aa2ad]">
                  Selected platform
                </p>

                <h2 className="mt-1 text-[16px] font-black tracking-tight text-[#172033]">
                  {platform.name}
                </h2>

                <p className="mt-1 text-[10px] text-[#7e8794]">
                  Your listing will be submitted for verification.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl bg-[#f4f6f8] px-3 py-2 sm:flex">
                <Icon name="shield" className="h-3.5 w-3.5 text-[#0b1e5b]" />

                <span className="text-[9px] font-bold text-[#596372]">
                  Review required
                </span>
              </div>
            </div>
          </section>


          {/* NOTICE */}
          {notice && (
            <div
              role="alert"
              className={[
                "mb-6 flex items-start gap-3 rounded-2xl border p-4",
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : notice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-blue-200 bg-blue-50 text-blue-800",
              ].join(" ")}
            >
              <Icon
                name={notice.type === "success" ? "check-circle" : "alert"}
                className="mt-0.5 h-4 w-4 shrink-0"
              />

              <p className="flex-1 text-[10px] font-semibold leading-5">
                {notice.message}
              </p>

              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setNotice(null)}
                className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* STEP 1 — LISTING DETAILS */}
          {!verificationStep ? (
            <form
              onSubmit={generateVerificationCode}
              className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]"
            >
              <div className="min-w-0 space-y-6">
                <section className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.02)] sm:p-7">
                  <SectionHeading
                    number="01"
                    title="Account details"
                    description="Tell buyers which account you are listing."
                  />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                      label="Account username"
                      required
                      hint="Enter the username displayed on the account."
                    >
                      <input
                        type="text"
                        autoComplete="off"
                        maxLength={100}
                        value={accountUsername}
                        onChange={(event) =>
                          setAccountUsername(event.target.value)
                        }
                        placeholder="e.g. jondoesocial"
                        className={inputClass}
                        required
                      />
                    </Field>

                    <Field
                      label="Public profile link"
                      required
                      hint="Use the public profile URL, not a login link."
                    >
                      <div className="relative">
                        <Icon
                          name="link"
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca5b1]"
                        />

                        <input
                          type="url"
                          autoComplete="url"
                          maxLength={2048}
                          value={profileLink}
                          onChange={(event) =>
                            setProfileLink(event.target.value)
                          }
                          placeholder="https://..."
                          className={`${inputClass} pl-10`}
                          required
                        />
                      </div>
                    </Field>

                    <Field
                      label="Account age"
                      required
                      hint="Be accurate about when the account was created."
                    >
                      <input
                        type="text"
                        maxLength={100}
                        value={accountAge}
                        onChange={(event) =>
                          setAccountAge(event.target.value)
                        }
                        placeholder="e.g. Created in 2022"
                        className={inputClass}
                        required
                      />
                    </Field>

                    <Field
                      label="Account region"
                      required
                      hint="Specify the account's relevant country or region."
                    >
                      <input
                        type="text"
                        maxLength={100}
                        value={accountRegion}
                        onChange={(event) =>
                          setAccountRegion(event.target.value)
                        }
                        placeholder="e.g. United States"
                        className={inputClass}
                        required
                      />
                    </Field>
                  </div>
                </section>

                {/* PUBLIC PREVIEW IMAGE UPLOAD */}
                  <section className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.02)] sm:p-7">
                  <SectionHeading
                    number="02"
                    title="Public listing preview image"
                    description="Upload a clean preview image that buyers will see on the marketplace before purchasing."
                  />

                  <label
                    htmlFor="preview-image-upload"
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dce2ea] bg-[#fafbfc] p-6 text-center transition hover:border-[#9baecb] hover:bg-[#f7f9fc] sm:p-8"
                  >
                    {previewPreviewUrl ? (
                      <>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1e5b]/[0.07] text-[#0b1e5b]">
                          <Icon name="image" className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-black text-[#172033]">Preview image ready</p>
                        <p className="mt-1 text-[9px] text-[#828b98]">{previewFile?.name}</p>
                        <div className="mt-4 w-full max-w-[320px] overflow-hidden rounded-xl border border-[#e0e5ed] bg-white p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={previewPreviewUrl} alt="Preview" className="max-h-[220px] w-full rounded-lg object-contain" />
                        </div>
                        <span className="mt-3 text-[9px] font-black text-[#0b1e5b]">Choose different image</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1e5b]/[0.06] text-[#0b1e5b] transition group-hover:scale-105">
                          <Icon name="upload" className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-[11px] font-black text-[#273246]">Upload marketplace preview image *</p>
                        <p className="mt-1 text-[10px] text-[#87909d]">Tap or drag an image file here</p>
                        <span className="mt-3 rounded-lg border border-[#e1e5ea] bg-white px-3 py-2 text-[9px] font-bold text-[#667180]">
                          Browse files
                        </span>
                        <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#a0a8b2]">
                          JPG, PNG or WebP · Maximum 5 MB
                        </p>
                      </>
                    )}
                  </label>
                  <input
                    id="preview-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePreviewFileChange}
                    className="sr-only"
                    required
                  />
                </section>

                <section className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.02)] sm:p-7">
                  <SectionHeading
                    number="03"
                    title="Login information & credentials"
                    description="Select the login formats that apply and provide delivery credentials securely for escrow."
                  />

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {LOGIN_FORMAT_OPTIONS.map((format) => {
                      const selected = selectedFormats.includes(format);

                      return (
                        <button
                          key={format}
                          type="button"
                          onClick={() => handleFormatToggle(format)}
                          aria-pressed={selected}
                          className={[
                            "flex min-h-[58px] items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all",
                            selected
                              ? "border-[#0b1e5b] bg-[#0b1e5b]/[0.045] shadow-[0_0_0_1px_rgba(11,30,91,0.03)]"
                              : "border-[#e3e7ed] bg-[#fafbfc] hover:border-[#cbd3de] hover:bg-white",
                          ].join(" ")}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={[
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                selected
                                  ? "bg-[#0b1e5b] text-white"
                                  : "bg-[#eef1f5] text-[#778190]",
                              ].join(" ")}
                            >
                              <Icon
                                name={format === "2fa enabled" ? "shield" : "user"}
                                className="h-3.5 w-3.5"
                              />
                            </div>

                            <span className="text-[10px] font-bold text-[#374151]">
                              {format}
                            </span>
                          </div>

                          <span
                            className={[
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-[#0b1e5b] bg-[#0b1e5b] text-white"
                                : "border-[#d0d6df] bg-white",
                            ].join(" ")}
                          >
                            {selected && (
                              <Icon name="check" className="h-2.5 w-2.5" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                                    {/* DYNAMIC CREDENTIAL INPUT FIELDS */}
                  {selectedFormats.length > 0 && (
  <div className="mt-6 rounded-2xl border border-[#e2e6ec] bg-[#f8fafc] p-5 space-y-4">
    <p className="text-[10px] font-black uppercase tracking-wider text-[#0b1e5b]">
      Secure Delivery Vault Credentials (Encrypted on Server)
    </p>

    {selectedFormats.includes("email + password") && (
      <>
        <div>
          <label className="block text-[9px] font-bold uppercase text-[#555e69]">Account Email *</label>
          <input
            type="email"
            value={credentialValues.email}
            onChange={(e) => setCredentialValues({ ...credentialValues, email: e.target.value })}
            placeholder="account@domain.com"
            className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
            required
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold uppercase text-[#555e69]">Email Password *</label>
          <input
            type="password"
            value={credentialValues.email_password}
            onChange={(e) => setCredentialValues({ ...credentialValues, email_password: e.target.value })}
            placeholder="Password for the email address"
            className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
            required
          />
        </div>
      </>
    )}

    {selectedFormats.includes("username + password") && (
      <div>
        <label className="block text-[9px] font-bold uppercase text-[#555e69]">Account Username *</label>
        <input
          type="text"
          value={credentialValues.username}
          onChange={(e) => setCredentialValues({ ...credentialValues, username: e.target.value })}
          placeholder="Login username"
          className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
          required
        />
      </div>
    )}

    {selectedFormats.includes("number + password") && (
      <div>
        <label className="block text-[9px] font-bold uppercase text-[#555e69]">Phone Number *</label>
        <input
          type="text"
          value={credentialValues.phone}
          onChange={(e) => setCredentialValues({ ...credentialValues, phone: e.target.value })}
          placeholder="+1234567890"
          className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
          required
        />
      </div>
    )}

    {(selectedFormats.includes("email + password") || selectedFormats.includes("username + password") || selectedFormats.includes("number + password")) && (
      <div>
        <label className="block text-[9px] font-bold uppercase text-[#555e69]">Account Password *</label>
        <input
          type="password"
          value={credentialValues.password}
          onChange={(e) => setCredentialValues({ ...credentialValues, password: e.target.value })}
          placeholder="Secure password"
          className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
          required
        />
      </div>
    )}

    {selectedFormats.includes("2fa enabled") && (
      <div>
        <label className="block text-[9px] font-bold uppercase text-[#555e69]">2FA Secret / Backup Codes *</label>
        <input
          type="text"
          value={credentialValues.two_factor_code}
          onChange={(e) => setCredentialValues({ ...credentialValues, two_factor_code: e.target.value })}
          placeholder="Enter 2FA secret key or backup codes"
          className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
          required
        />
      </div>
    )}

    {selectedFormats.includes("others") && (
      <div>
        <label className="block text-[9px] font-bold uppercase text-[#555e69]">Additional Info / Token / Recovery Email *</label>
        <input
          type="text"
          value={credentialValues.others}
          onChange={(e) => setCredentialValues({ ...credentialValues, others: e.target.value })}
          placeholder="e.g. Session token, cookies, or recovery email"
          className="mt-1.5 h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] text-[#1f2937] outline-none focus:border-[#0b1e5b]"
          required
        />
      </div>
    )}
  </div>
)}



                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <Icon
                      name="lock"
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                    />

                    <p className="text-[9px] leading-5 text-amber-900">
                      <strong>Secured in Delivery Vault.</strong> Credentials are encrypted on the server using AES-256-GCM and remain inaccessible until a buyer completes escrow purchase.
                    </p>
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.02)] sm:p-7">
                  <SectionHeading
                    number="04"
                    title="Description and pricing"
                    description="Help buyers understand what your listing includes."
                  />

                  <div className="space-y-5">
                    <Field
                      label="Listing description"
                      required
                      hint="Include relevant account details, audience information, and limitations."
                    >
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={5}
                        maxLength={3000}
                        placeholder="Describe the account, its audience, activity history, content niche, and other relevant details..."
                        className={textareaClass}
                        required
                      />

                      <div className="mt-1.5 flex justify-end">
                        <span className="text-[9px] text-[#a0a7b2]">
                          {description.length}/3000
                        </span>
                      </div>
                    </Field>

                    <Field
                      label="Asking price"
                      required
                      hint="Enter the total asking price in Nigerian naira."
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-[#697384]">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="1"
                          max="100000000"
                          step="1"
                          inputMode="numeric"
                          value={price}
                          onChange={(event) => setPrice(event.target.value)}
                          placeholder="25000"
                          className={`${inputClass} pl-9 pr-4`}
                          required
                        />
                      </div>

                      {price && Number(price) > 0 && (
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-[#f5f7fa] px-3 py-2">
                          <span className="text-[9px] font-semibold text-[#7d8794]">
                            Your asking price
                          </span>

                          <span className="text-[11px] font-black text-[#0b1e5b]">
                            {formatPrice(price)}
                          </span>
                        </div>
                      )}
                    </Field>
                  </div>
                </section>

                <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/dashboard/sell"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-[#e1e5ea] bg-white px-5 text-[10px] font-bold text-[#6b7481] transition hover:border-[#cbd3de] hover:bg-[#f9fafb] hover:text-[#111827]"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-6 text-[10px] font-black text-white shadow-[0_9px_22px_rgba(11,30,91,0.15)] transition hover:-translate-y-0.5 hover:bg-[#091747] hover:shadow-[0_12px_26px_rgba(11,30,91,0.2)]"
                  >
                    Continue to verification
                    <Icon
                      name="arrow-right"
                      className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-6">
                <div className="overflow-hidden rounded-[22px] border border-[#e2e6ec] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.02)]">
                  <div className="bg-[#0b1e5b] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.09] text-white">
                      <Icon name="shield" className="h-5 w-5" />
                    </div>

                    <h3 className="mt-4 text-[14px] font-black tracking-tight text-white">
                      A better listing starts here.
                    </h3>

                    <p className="mt-2 text-[10px] leading-5 text-white/60">
                      Accurate details and transparent pricing help buyers
                      understand your offer.
                    </p>
                  </div>

                  <div className="space-y-4 p-5">
                    {[
                      {
                        title: "Be accurate",
                        text: "Provide truthful account information.",
                      },
                      {
                        title: "Be transparent",
                        text: "Clearly explain what is included.",
                      },
                      {
                        title: "Secure delivery vault",
                        text: "Credentials are encrypted on the server.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0f3f8] text-[#0b1e5b]">
                          <Icon name="check" className="h-3.5 w-3.5" />
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-[#283244]">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#858e9a]">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#e2e6ec] bg-white p-5">
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="h-4 w-4 text-[#0b1e5b]" />

                    <h3 className="text-[10px] font-black text-[#263143]">
                      What happens next?
                    </h3>
                  </div>

                  <p className="mt-2 text-[9px] leading-5 text-[#7c8694]">
                    You will submit ownership proof for review. Submission does not
                    automatically mean approval.
                  </p>
                </div>
              </aside>
            </form>
          ) : (
            <form
              onSubmit={handleFinalPublish}
              className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]"
            >
              <div className="min-w-0 space-y-6">
                <section className="overflow-hidden rounded-[24px] border border-[#e0e5ed] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.02)]">
                  <div className="bg-[#0b1e5b] px-6 py-7 text-center sm:px-8 sm:py-9">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.09] text-white">
                      <Icon name="shield" className="h-6 w-6" />
                    </div>

                    <p className="mt-5 text-[8px] font-black uppercase tracking-[0.23em] text-white/55">
                      Ownership verification challenge
                    </p>

                    <h2 className="mt-2 text-[22px] font-black tracking-[-0.04em] text-white sm:text-[28px]">
                      Confirm your account
                    </h2>

                    <p className="mx-auto mt-2 max-w-[420px] text-[10px] leading-5 text-white/60">
                      Follow the platform's permitted verification process
                      and capture evidence showing the challenge code.
                    </p>

                      <div className="mx-auto mt-6 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4">
                      <code className="break-all text-[16px] font-black tracking-[0.1em] text-white sm:text-[20px]">
                        {verificationCode}
                      </code>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              verificationCode
                            );

                            setNotice({
                              type: "success",
                              message: "Verification code copied.",
                            });
                          } catch {
                            setNotice({
                              type: "error",
                              message: "Couldn't copy automatically. Select and copy the code manually.",
                            });
                          }
                        }}
                        className="shrink-0 rounded-lg border border-white/15 bg-white/[0.08] px-3 py-2 text-[9px] font-black text-white transition hover:bg-white/[0.15]"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <Icon
                        name="alert"
                        className="mt-0.5 h-4 w-4 shrink-0 text-blue-800"
                      />

                      <p className="text-[10px] leading-5 text-blue-950">
                        <strong>Important:</strong> Only add this code where
                        the platform permits it. Do not change security
                        settings, disable two-factor authentication, or
                        expose private account information to complete
                        this step.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#e2e6ec] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.02)] sm:p-7">
                  <SectionHeading
                    number="02"
                    title="Upload verification evidence"
                    description="Choose a screenshot showing the relevant public profile and verification challenge."
                  />

                  <label
                    htmlFor="verification-screenshot"
                    className={[
                      "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-9",
                      screenshotPreview
                        ? "border-[#c8d4e8] bg-[#f8faff]"
                        : "border-[#dce2ea] bg-[#fafbfc] hover:border-[#9baecb] hover:bg-[#f7f9fc]",
                    ].join(" ")}
                  >
                    {screenshotPreview ? (
                      <>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1e5b]/[0.07] text-[#0b1e5b]">
                          <Icon name="image" className="h-5 w-5" />
                        </div>

                        <p className="text-[11px] font-black text-[#172033]">
                          Screenshot ready
                        </p>

                        <p className="mt-1 max-w-full break-all text-[9px] text-[#828b98]">
                          {screenshotFile?.name}
                        </p>

                        <div className="mt-5 w-full max-w-[420px] overflow-hidden rounded-xl border border-[#e0e5ed] bg-white p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={screenshotPreview}
                            alt="Selected verification screenshot preview"
                            className="max-h-[360px] w-full rounded-lg object-contain"
                          />
                        </div>

                        <span className="mt-4 text-[9px] font-black text-[#0b1e5b]">
                          Choose another image
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1e5b]/[0.06] text-[#0b1e5b] transition group-hover:scale-105">
                          <Icon name="upload" className="h-5 w-5" />
                        </div>

                        <p className="mt-4 text-[11px] font-black text-[#273246]">
                          Upload your screenshot
                        </p>

                        <p className="mt-1.5 text-[10px] leading-5 text-[#87909d]">
                          Tap to choose a file from your device.
                        </p>

                        <span className="mt-4 rounded-lg border border-[#e1e5ea] bg-white px-3 py-2 text-[9px] font-bold text-[#667180]">
                          Browse files
                        </span>

                        <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#a0a8b2]">
                          JPG, PNG or WebP · Maximum 5 MB
                        </p>
                      </>
                    )}
                  </label>

                  <input
                    id="verification-screenshot"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleScreenshotChange}
                    className="sr-only"
                  />

                  {screenshotFile && (
                    <button
                      type="button"
                      onClick={() => setScreenshotFile(null)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[9px] font-bold text-[#a12b2b] transition hover:bg-red-50"
                    >
                      <Icon name="close" className="h-3 w-3" />
                      Remove screenshot
                    </button>
                  )}

                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#e6e9ee] bg-[#fafbfc] p-4">
                    <Icon
                      name="lock"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#0b1e5b]"
                    />

                    <p className="text-[9px] leading-5 text-[#687383]">
                      Verification evidence is stored privately and reviewed securely.
                    </p>
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setNotice(null);
                      setVerificationStep(false);
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#e1e5ea] bg-white px-5 text-[10px] font-bold text-[#6b7481] transition hover:border-[#cbd3de] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon name="arrow-left" className="h-3.5 w-3.5" />
                    Back to edit details
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !screenshotFile}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b1e5b] px-6 text-[10px] font-black text-white shadow-[0_9px_22px_rgba(11,30,91,0.15)] transition hover:-translate-y-0.5 hover:bg-[#091747] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Submitting listing & vault...
                      </>
                    ) : (
                      <>
                        Submit for review & publish
                        <Icon
                          name="arrow-right"
                          className="h-3.5 w-3.5"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-6">
                <div className="rounded-[22px] border border-[#e2e6ec] bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.02)]">
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="h-4 w-4 text-[#0b1e5b]" />

                    <h3 className="text-[11px] font-black text-[#243044]">
                      Review process
                    </h3>
                  </div>

                  <div className="mt-5 space-y-4">
                    {[
                      {
                        title: "Submit your evidence",
                        text: "Upload the screenshot and submit the form.",
                        done: Boolean(screenshotFile),
                      },
                      {
                        title: "Ownership review",
                        text: "An authorized reviewer checks the evidence.",
                        done: false,
                      },
                      {
                        title: "Listing decision",
                        text: "Your listing can be approved or rejected after review.",
                        done: false,
                      },
                    ].map((item, index) => (
                      <div key={item.title} className="flex gap-3">
                        <div
                          className={[
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black",
                            item.done
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[#f0f2f5] text-[#798391]",
                          ].join(" ")}
                        >
                          {item.done ? (
                            <Icon name="check" className="h-3.5 w-3.5" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-[#374151]">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#89919d]">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2">
                    <Icon name="shield" className="h-4 w-4 text-amber-800" />

                    <h3 className="text-[10px] font-black text-amber-950">
                      Before submitting
                    </h3>
                  </div>

                  <p className="mt-2 text-[9px] leading-5 text-amber-900">
                    Credentials are securely stored in your delivery vault and only accessible to buyers upon successful escrow purchase.
                  </p>
                </div>
              </aside>
            </form>
          )}

          {/* FOOTER */}
          <footer className="mt-9 flex flex-col items-center justify-between gap-3 border-t border-[#e6e9ed] pt-5 sm:flex-row">
            <p className="text-center text-[9px] font-semibold text-[#9aa2ad] sm:text-left">
              AccMarket Seller Hub
              <span className="mx-2 text-[#d2d7de]">/</span>
              {platform.name} listing
            </p>

            <div className="flex items-center gap-2 text-[9px] font-bold text-[#8b94a0]">
              <Icon
                name="shield"
                className="h-3.5 w-3.5 text-[#0b1e5b]"
              />
              Secure server submission
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}