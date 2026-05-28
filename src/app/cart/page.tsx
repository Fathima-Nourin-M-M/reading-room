"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/ToastProvider";
import { formatInrPrice, parsePriceInr } from "@/lib/catalogPricing";
import {
  getCart,
  getCartSubtotal,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";
import { useUser } from "@/hooks/useUser";

export default function CartPage() {
  const { user } = useUser();
  const { pushToast } = useToast();
  const router = useRouter();
  const [cart, setCartState] = useState<CartItem[]>([]);

  const refreshCart = useCallback(() => {
    setCartState(getCart());
  }, []);

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);

  function changeQuantity(id: string, next: number) {
    const updated = updateCartQuantity(id, next);
    setCartState(updated);
  }

  function removeItem(id: string) {
    const updated = removeFromCart(id);
    setCartState(updated);
    pushToast("Removed from cart", "info");
  }

  const hasPhysical = cart.some((item) => item.type !== "ebook");
  const subtotal = getCartSubtotal(cart);
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  function handleCheckout() {
    if (!user) {
      pushToast("Sign in to continue to checkout", "info");
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  }

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-[#d9b996]/50 pb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
            Your selection
          </p>
          <h1 className="font-serif text-4xl text-[#2b1c14] md:text-5xl">Cart</h1>
          <p className="mt-3 max-w-xl text-sm text-[#614737]">
            {itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? "item" : "items"} ready for checkout`
              : "Your shelf is empty for now."}
          </p>
        </header>

        {cart.length === 0 ? (
          <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/80 p-10 text-center shadow-[0_12px_32px_rgba(74,43,22,0.08)]">
            <h2 className="font-serif text-2xl text-[#2b1c14]">Nothing here yet</h2>
            <p className="mt-2 text-sm text-[#614737]">
              Browse the store or marketplace to find your next read.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/store" className="rounded-full bg-[#3d281d] px-5 py-2.5 text-sm font-medium text-[#fdf4ea]">
                Visit store
              </Link>
              <Link href="/marketplace" className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-5 py-2.5 text-sm font-medium text-[#583a2a]">
                Marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <ul className="space-y-4">
              {cart.map((item) => {
                const unitPrice = parsePriceInr(item.price);
                const qty = item.quantity || 1;
                const lineTotal = unitPrice * qty;

                return (
                  <li
                    key={item.id}
                    className="flex gap-4 rounded-3xl border border-[#dab995]/60 bg-[#fff8ef] p-4 shadow-[0_10px_28px_rgba(74,43,22,0.07)] md:gap-5 md:p-5"
                  >
                    <img
                      src={item.image || "https://placehold.co/120x180"}
                      alt={item.title}
                      className="h-32 w-24 shrink-0 rounded-2xl object-cover md:h-36 md:w-28"
                    />

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9c6b49]">
                          {item.type === "ebook" ? "Digital · Instant" : "Physical · Ships to you"}
                        </p>
                        <h2 className="mt-1 font-serif text-xl leading-snug text-[#2b1c14] md:text-2xl">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-sm text-[#7a5a47]">{formatInrPrice(unitPrice)} each</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-[#d5b18c]/70 bg-[#fff3e4] px-1 py-1">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, qty - 1)}
                            disabled={qty <= 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#4e3427] transition hover:bg-[#f4e4d0] disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-[2ch] text-center text-sm font-medium text-[#2b1c14]">{qty}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, qty + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#4e3427] transition hover:bg-[#f4e4d0]"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold text-[#8a5a3b]">{formatInrPrice(lineTotal)}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-sm text-[#9c5c52] underline-offset-2 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit space-y-4 lg:sticky lg:top-28">
              <div className="rounded-3xl border border-[#dab995]/60 bg-gradient-to-br from-[#fff8ef] to-[#f2e0c8] p-6 shadow-[0_14px_36px_rgba(74,43,22,0.1)]">
                <h2 className="font-serif text-2xl text-[#2b1c14]">Order summary</h2>

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-[#614737]">
                    <dt>Subtotal</dt>
                    <dd>{formatInrPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-[#614737]">
                    <dt>Items</dt>
                    <dd>{itemCount}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-[#e5cdb0] pt-4">
                  <span className="text-[#4e3427]">Total</span>
                  <span className="font-serif text-3xl text-[#2b1c14]">{formatInrPrice(subtotal)}</span>
                </div>

                {hasPhysical && (
                  <p className="mt-4 rounded-2xl border border-[#d5b18c]/50 bg-[#fff3e4]/80 px-3 py-2 text-xs leading-relaxed text-[#614737]">
                    Shipping address collected at checkout.
                  </p>
                )}

                {!hasPhysical && cart.length > 0 && (
                  <p className="mt-4 rounded-2xl border border-[#c5d4c8]/60 bg-[#eef5f0]/80 px-3 py-2 text-xs text-[#3d5a45]">
                    Ebooks are added to your library instantly after purchase.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="mt-6 w-full rounded-2xl bg-[#3d281d] py-3.5 text-sm font-medium text-[#fdf4ea] shadow-sm transition hover:bg-[#553727]"
                >
                  Proceed to Checkout
                </button>

                {!user && (
                  <p className="mt-3 text-center text-xs text-[#7a5a47]">
                    <Link href="/login" className="font-medium text-[#5b3c2b] underline-offset-2 hover:underline">
                      Sign in
                    </Link>{" "}
                    to checkout
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-[#d8b893]/45 bg-[#fff7ee]/60 p-4 text-xs leading-relaxed text-[#614737]">
                <p className="font-medium text-[#4e3427]">After purchase</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Ebooks appear in your library right away</li>
                  <li>Physical orders track under Orders</li>
                  <li>Sellers see new orders on their dashboard</li>
                </ul>
                <Link href="/orders" className="mt-3 inline-block text-[#7d5134] underline-offset-2 hover:underline">
                  View orders →
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
