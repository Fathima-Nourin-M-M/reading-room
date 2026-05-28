"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { CART_UPDATED_EVENT } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { user, loading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function readCartCount() {
      try {
        const stored = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = Array.isArray(stored)
          ? stored.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0)
          : 0;
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    }
    readCartCount();
    window.addEventListener("storage", readCartCount);
    window.addEventListener("focus", readCartCount);
    window.addEventListener(CART_UPDATED_EVENT, readCartCount);
    return () => {
      window.removeEventListener("storage", readCartCount);
      window.removeEventListener("focus", readCartCount);
      window.removeEventListener(CART_UPDATED_EVENT, readCartCount);
    };
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) { setUsername(null); setIsAdmin(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("username, is_admin")
        .eq("id", user.id)
        .maybeSingle();
      setUsername(data?.username || user.email?.split("@")[0] || "Reader");
      setIsAdmin(data?.is_admin === true);
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const primaryLinks = [
    { href: "/discover", label: "Discover" },
    { href: "/store", label: "Store" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/search", label: "Search" },
  ];

  const accountMenuItems = [
    { href: "/library", label: "Library", icon: "📚" },
    { href: "/orders", label: "Orders", icon: "📦" },
    { href: "/wishlist", label: "Wishlist", icon: "🔖" },
    { href: "/cart", label: "Cart", icon: "🛒", badge: cartCount > 0 ? cartCount : null },
    { href: "/lists", label: "My Lists", icon: "📝" },
    { href: "/lists?saved=true", label: "Saved Lists", icon: "🗂" },
    { href: "/seller", label: "Seller Dashboard", icon: "📊" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Dashboard", icon: "🛡", badge: null }] : []),
    { href: "/notifications", label: "Notifications", icon: "🔔" },
  ];

  const initials = username ? username.slice(0, 2).toUpperCase() : "RR";

  return (
    <header className="sticky top-0 z-50 border-b border-[#d4b58f]/45 bg-[#f9efe2]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="The Reading Room"
              className="h-11 w-11 rounded-xl object-contain shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl leading-none text-[#2b1c14] md:text-2xl">
                The Reading Room
              </h1>
              <p className="mt-1 hidden text-[10px] uppercase tracking-[0.26em] text-[#9c7148] sm:block">
                Curated Literary Sanctuary
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-2 lg:flex">
            <nav className="flex items-center gap-1 rounded-full border border-[#dfc3a2] bg-[#fff8ef]/90 px-2 py-1">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm text-[#4e3427] transition hover:bg-[#f4e4d0] hover:text-[#2b1c14]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {!loading && (
              <>
                {user ? (
                  <div ref={accountRef} className="relative">
                    <button
                      onClick={() => setIsAccountOpen((v) => !v)}
                      className="flex items-center gap-2 rounded-full border border-[#dfc3a2] bg-[#fff8ef]/90 px-3 py-2 text-sm text-[#4e3427] transition hover:bg-[#f4e4d0]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3d281d] text-[11px] font-bold text-[#fdf4ea]">
                        {initials}
                      </span>
                      <span className="max-w-[120px] truncate text-sm font-medium text-[#2b1c14]">
                        {username}
                      </span>
                      {cartCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8a5a3b] text-[10px] font-bold text-white">
                          {cartCount}
                        </span>
                      )}
                      <svg
                        className={`h-3 w-3 text-[#7a5a47] transition-transform ${isAccountOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isAccountOpen && (
                      <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-[#dfc3a2] bg-[#fffaf4]/97 py-2 shadow-[0_20px_50px_rgba(74,43,22,0.18)] backdrop-blur-xl">
                        <div className="border-b border-[#ead8c2] px-4 pb-3 pt-2">
                          <p className="text-xs text-[#9c7148]">Signed in as</p>
                          <p className="truncate font-serif text-sm font-medium text-[#2b1c14]">
                            {user.email}
                          </p>
                        </div>
                        <nav className="py-1">
                          {accountMenuItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsAccountOpen(false)}
                              className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-[#4e3427] transition hover:bg-[#f4e4d0]"
                            >
                              <span className="flex items-center gap-3">
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                              </span>
                              {item.badge != null && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8a5a3b] text-[10px] font-bold text-white">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </nav>
                        <div className="border-t border-[#ead8c2] px-4 pt-2 pb-1">
                          <Link
                            href="/profile"
                            onClick={() => setIsAccountOpen(false)}
                            className="mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4e3427] transition hover:bg-[#f4e4d0]"
                          >
                            <span>⚙️</span> Profile Settings
                          </Link>
                          <button
                            onClick={async () => {
                              setIsAccountOpen(false);
                              await supabase.auth.signOut();
                              window.location.href = "/";
                            }}
                            className="w-full rounded-xl bg-[#3d281d] px-4 py-2 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-full px-4 py-2 text-sm text-[#4e3427] transition hover:bg-[#f4e4d0]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea] shadow-sm transition hover:bg-[#553727]"
                    >
                      Join
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="rounded-xl border border-[#dfc3a2] bg-[#fff8ef] px-3 py-2 text-sm font-medium text-[#4e3427] transition hover:bg-[#f4e4d0] lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-3 rounded-2xl border border-[#dfc3a2] bg-[#fff8ef]/97 p-3 shadow-sm lg:hidden">
            <nav className="grid grid-cols-2 gap-2 text-sm">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-[#4e3427] transition hover:bg-[#f4e4d0]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {user && (
              <>
                <div className="mt-3 border-t border-[#ead8c2] pt-3">
                  <p className="mb-2 px-3 text-[10px] uppercase tracking-widest text-[#9c7148]">
                    My Account
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {accountMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#4e3427] transition hover:bg-[#f4e4d0]"
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge != null && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#8a5a3b] text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#4e3427] transition hover:bg-[#f4e4d0]"
                    >
                      <span>⚙️</span> Profile
                    </Link>
                  </div>
                </div>
              </>
            )}

            <div className="mt-3 border-t border-[#ead8c2] pt-3">
              {user ? (
                <button
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="w-full rounded-xl bg-[#3d281d] px-4 py-2 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
                >
                  Sign Out
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 rounded-xl border border-[#dfc3a2] px-4 py-2 text-center text-sm text-[#4e3427] transition hover:bg-[#f4e4d0]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 rounded-xl bg-[#3d281d] px-4 py-2 text-center text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
