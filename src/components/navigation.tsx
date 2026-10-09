"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

interface UserProfile {
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface AccMarketNavigationProps {
  profile: UserProfile | null;
  hasUnread: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSignOut: () => void;
  onListAccountClick: () => void;
}

export function DesktopSidebar({
  profile,
  hasUnread,
  onSignOut,
  onListAccountClick,
}: Omit<AccMarketNavigationProps, "mobileMenuOpen" | "setMobileMenuOpen">) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-[#e8eaf0] bg-white lg:flex lg:flex-col">
      <div className="flex h-[76px] items-center border-b border-[#edf0f4] px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl">
            <Image
              src="/images/logo.png"
              alt="AccMarket"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-[18px] font-extrabold tracking-[-0.04em] text-[#0b1e5b]">
            AccMarket
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <SidebarLink href="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
        <SidebarLink href="/dashboard/wallet" icon={<WalletIcon />} label="Wallet" />
        
        {/* Sell an Account placed directly under Wallet */}
        <button
          type="button"
          onClick={onListAccountClick}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#697180] transition hover:bg-[#f3f5fb] hover:text-[#0b1e5b]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition group-hover:bg-white">
            <PlusIcon />
          </span>
          <span className="flex-1">Sell an Account</span>
        </button>

        <SidebarLink href="/dashboard/transactions" icon={<TransactionIcon />} label="Transactions" />
        <SidebarLink href="/dashboard/marketplace" icon={<MarketplaceIcon />} label="Marketplace" />
        <SidebarLink href="/dashboard/chats" icon={<MessageIcon />} label="Messages" />
        <SidebarLink
          href="/dashboard/notifications"
          icon={<BellIcon />}
          label="Notifications"
          badge={hasUnread}
        />
        <SidebarLink href="/dashboard/api" icon={<ApiIcon />} label="API & Webhooks" />

        <div className="my-5 border-t border-[#edf0f4]" />

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
          Account
        </p>

        <SidebarLink href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" />
        <SidebarLink href="/dashboard/support" icon={<SupportIcon />} label="Support" />
      </nav>

      <div className="border-t border-[#edf0f4] p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#f8f9fc] p-3">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.username || profile?.email || "User"}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[#111111]">
              {profile?.username || "User"}
            </p>
            <p className="truncate text-[11px] text-[#8b93a1]">
              {profile?.email || ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#6b7280] transition hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileHeader({
  setMobileMenuOpen,
}: {
  setMobileMenuOpen: (open: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e8eaf0] bg-white/95 px-4 backdrop-blur lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="relative h-9 w-9 overflow-hidden rounded-xl">
          <Image
            src="/images/logo.png"
            alt="AccMarket"
            fill
            className="object-contain"
          />
        </div>
        <span className="text-[17px] font-extrabold tracking-[-0.04em] text-[#0b1e5b]">
          AccMarket
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#111111]"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>
    </header>
  );
}

export function MobileMenuDrawer({
  isOpen,
  setIsOpen,
  profile,
  hasUnread,
  onSignOut,
  onListAccountClick,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  profile: UserProfile | null;
  hasUnread: boolean;
  onSignOut: () => void;
  onListAccountClick: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-[#0b1e5b]/30 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[min(88%,360px)] flex-col bg-white shadow-2xl">
        <div className="flex h-[72px] items-center justify-between border-b border-[#edf0f4] px-5">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-xl">
              <Image
                src="/images/logo.png"
                alt="AccMarket"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[17px] font-extrabold tracking-[-0.04em] text-[#0b1e5b]">
              AccMarket
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f6f8] text-[#5f6673] transition hover:bg-[#eceef2]"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-b border-[#edf0f4] p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-[#f8f9fc] p-3.5">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.username || profile?.email || "User"}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[#111111]">
                {profile?.username || "User"}
              </p>
              <p className="truncate text-[11px] text-[#8b93a1]">
                {profile?.email || ""}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0a6b0]">
            Navigation
          </p>

          <div className="space-y-1">
            <MobileLink href="/dashboard" icon={<DashboardIcon />} label="Dashboard" close={() => setIsOpen(false)} />
            <MobileLink href="/dashboard/wallet" icon={<WalletIcon />} label="Wallet" close={() => setIsOpen(false)} />

            {/* Sell an Account placed right under Wallet on Mobile */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onListAccountClick();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold text-[#5f6673] transition hover:bg-[#f5f6fa] hover:text-[#0b1e5b]"
            >
              <span className="relative shrink-0"><PlusIcon /></span>
              <span className="flex-1 text-left">Sell an Account</span>
            </button>

            <MobileLink href="/dashboard/transactions" icon={<TransactionIcon />} label="Transactions" close={() => setIsOpen(false)} />
            <MobileLink href="/dashboard/marketplace" icon={<MarketplaceIcon />} label="Marketplace" close={() => setIsOpen(false)} />
            <MobileLink href="/dashboard/chats" icon={<MessageIcon />} label="Messages" close={() => setIsOpen(false)} />
            <MobileLink
              href="/dashboard/notifications"
              icon={<BellIcon />}
              label="Notifications"
              close={() => setIsOpen(false)}
              badge={hasUnread}
            />
            <MobileLink href="/dashboard/api" icon={<ApiIcon />} label="API & Webhooks" close={() => setIsOpen(false)} />
          </div>

          <div className="my-5 border-t border-[#edf0f4]" />

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0a6b0]">
            Account
          </p>

          <div className="space-y-1">
            <MobileLink href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" close={() => setIsOpen(false)} />
            <MobileLink href="/dashboard/support" icon={<SupportIcon />} label="Support" close={() => setIsOpen(false)} />
          </div>
        </nav>

        <div className="border-t border-[#edf0f4] p-4">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

export function DesktopHeader({
  profile,
  hasUnread,
  pageTitle = "Dashboard",
  sectionLabel = "Overview",
}: {
  profile: UserProfile | null;
  hasUnread: boolean;
  pageTitle?: string;
  sectionLabel?: string;
}) {
  return (
    <header className="hidden h-[76px] items-center justify-between border-b border-[#e8eaf0] bg-white px-8 lg:flex">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
          {sectionLabel}
        </p>
        <h2 className="mt-1 text-[14px] font-bold text-[#111111]">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#5f6673] transition hover:border-[#d8dce4] hover:bg-[#f8f9fc]"
          aria-label="Notifications"
        >
          <BellIcon />
          {hasUnread && (
            <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>

        <div className="h-7 w-px bg-[#e5e7eb]" />

        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.username || profile?.email || "User"}
            size="sm"
          />
          <div className="min-w-0">
            <p className="max-w-[140px] truncate text-[12px] font-bold text-[#111111]">
              {profile?.username || "User"}
            </p>
            <p className="text-[10px] text-[#9ca3af]">Buyer account</p>
          </div>
          <ChevronDownIcon />
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ hasUnread }: { hasUnread: boolean }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e5e7eb] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-5">
        <BottomNavItem href="/dashboard" icon={<DashboardIcon />} label="Home" />
        <BottomNavItem href="/dashboard/marketplace" icon={<MarketplaceIcon />} label="Market" />
        <BottomNavItem href="/dashboard/chats" icon={<MessageIcon />} label="Chats" />
        <BottomNavItem href="/dashboard/notifications" icon={<BellIcon />} label="Alerts" badge={hasUnread} />
        <BottomNavItem href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" />
      </div>
    </nav>
  );
}

/* Helper sub-components & icons */
function SidebarLink({ href, icon, label, badge }: { href: string; icon: ReactNode; label: string; badge?: boolean }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#697180] transition hover:bg-[#f3f5fb] hover:text-[#0b1e5b]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition group-hover:bg-white">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && <span className="h-2 w-2 rounded-full bg-red-500" />}
    </Link>
  );
}

function MobileLink({ href, icon, label, close, badge }: { href: string; icon: ReactNode; label: string; close: () => void; badge?: boolean }) {
  return (
    <Link
      href={href}
      onClick={close}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-semibold text-[#5f6673] transition hover:bg-[#f5f6fa] hover:text-[#0b1e5b]"
    >
      <span className="relative shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="h-2 w-2 rounded-full bg-red-500" />}
    </Link>
  );
}

function Avatar({ src, name, size = "md" }: { src?: string | null; name: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "h-9 w-9 text-[11px]" : "h-11 w-11 text-[13px]";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  if (src) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full bg-[#eef2ff] ${dimensions}`}>
        <Image src={src} alt={name} fill sizes={size === "sm" ? "36px" : "44px"} className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#0b1e5b] font-bold text-white ${dimensions}`}>
      {initials || "U"}
    </div>
  );
}

function BottomNavItem({ href, icon, label, badge }: { href: string; icon: ReactNode; label: string; badge?: boolean }) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-1 px-2 py-1.5 text-[#8b93a1] transition hover:text-[#0b1e5b]"
    >
      <span className="relative">{icon}</span>
      {badge && <span className="absolute right-[calc(50%-13px)] top-0 h-1.5 w-1.5 rounded-full bg-red-500" />}
      <span className="text-[9px] font-semibold">{label}</span>
    </Link>
  );
}

/* Icons */
function DashboardIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>); }
function WalletIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 8h15" /><path d="M16 13h5" /><circle cx="16" cy="13" r=".7" fill="currentColor" /></svg>); }
function TransactionIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h13" /><path d="m16 4 4 3-4 3" /><path d="M17 17H4" /><path d="m8 14-4 3 4 3" /></svg>); }
function MarketplaceIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M9 20v-6h6v6" /></svg>); }
function MessageIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.4 8.4 0 0 1-3-.55L4 20l1.6-4.1A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /></svg>); }
function BellIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>); }
function ApiIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 9-3 3 3 3" /><path d="m16 9 3 3-3 3" /><path d="m14 5-4 14" /></svg>); }
function SupportIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" /><path d="M8.5 9.5h.01" /><path d="M15.5 9.5h.01" /></svg>); }
function SettingsIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.55v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 8.1 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.55h.54A1.7 1.7 0 0 0 8.1 10a1.7 1.7 0 0 0-.34-1.88L7.7 8.06l1.8-1.8.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.55v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06A1.7 1.7 0 0 0 19.4 10c.23.62.83 1.03 1.49 1.03H21v2.55h-.1A1.7 1.7 0 0 0 19.4 15Z" /></svg>); }
function LogoutIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /></svg>); }
function MenuIcon() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>); }
function CloseIcon() { return (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>); }
function ChevronDownIcon() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>); }
function PlusIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>); }
