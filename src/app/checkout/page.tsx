"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ToastProvider";
import { getCart, setCart, getCartSubtotal, type CartItem } from "@/lib/cart";
import { parsePriceInr, formatInrPrice } from "@/lib/catalogPricing";

import { supabase } from "@/lib/supabase";

type Step = "address" | "review" | "placing" | "done";

interface Address {
  id?: string;
  full_name: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

const EMPTY_ADDRESS: Address = {
  full_name: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { pushToast } = useToast();

  const [cart, setCartState] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const refreshCart = useCallback(() => { setCartState(getCart()); }, []);

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSavedAddresses(data);
          setSelectedAddressId(data[0].id);
          setAddress(data[0]);
          setShowNewForm(false);
        } else {
          setShowNewForm(true);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, loading, router]);

  const hasPhysical = cart.some((i) => i.type !== "ebook");
  const ebookOnly = cart.length > 0 && !hasPhysical;
  const subtotal = getCartSubtotal(cart);
  const itemCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  function handleAddressSelect(addr: Address & { id?: string }) {
    setSelectedAddressId(addr.id || null);
    setAddress(addr);
    setShowNewForm(false);
  }

  function handleAddressChange(field: keyof Address, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddressContinue() {
    if (ebookOnly) {
      setStep("review");
      return;
    }
    if (showNewForm) {
      if (!address.full_name || !address.address_line || !address.city || !address.pincode) {
        pushToast("Please fill in all required address fields", "info");
        return;
      }
      setSavingAddress(true);
      try {
        const { data, error } = await supabase
          .from("addresses")
          .insert([{ ...address, user_id: user!.id }])
          .select()
          .single();
        if (error) throw error;
        setSavedAddresses((prev) => [data, ...prev]);
        setSelectedAddressId(data.id);
        setAddress(data);
        setShowNewForm(false);
      } catch (err) {
        console.error(err);
        pushToast("Could not save address", "error");
        return;
      } finally {
        setSavingAddress(false);
      }
    }
    setStep("review");
  }

  async function handlePlaceOrder() {
    if (!user) return;
    setPlacingOrder(true);
    setStep("placing");
    try {
      const orderIds: string[] = [];
      for (const item of cart) {
        const amount = parsePriceInr(item.price);
        const qty = item.quantity || 1;
        const lineTotal = amount * qty;
        const orderStatus = item.type === "ebook" ? "completed" : "processing";

        const { data: orderData, error: orderErr } = await supabase
          .from("orders")
          .insert([{
            user_id: user.id,
            seller_id: item.seller_id || null,
            product_id: item.id,
            title: item.title,
            cover_image: item.image,
            amount: String(lineTotal),
            product_type: item.type,
            order_status: orderStatus,
            shipping_address_id: hasPhysical ? selectedAddressId : null,
          }])
          .select("id")
          .single();
        if (orderErr) throw orderErr;
        orderIds.push(orderData.id);

        await supabase.from("purchases").insert([{
          user_id: user.id,
          product_id: item.id,
          title: item.title,
          cover_image: item.image,
          amount: String(lineTotal),
          product_type: item.type,
        }]);

        await supabase.from("notifications").insert([{
          user_id: user.id,
          type: "purchase",
          content: `You purchased "${item.title}"`,
        }]);

        if (item.type === "ebook") {
          await supabase.from("library").insert([{
            user_id: user.id,
            book_id: item.id,
            title: item.title,
            cover_image: item.image,
            source: "purchase",
          }]);
        }
      }

      setCart([]);
      setCartState([]);
      setOrderId(orderIds[0] || null);
      setStep("done");
    } catch (err) {
      console.error(err);
      pushToast("Order failed — please try again", "error");
      setStep("review");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde]">
        <p className="font-serif text-xl text-[#6b4d3a]">Loading…</p>
      </main>
    );
  }

  if (cart.length === 0 && step !== "done") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f7ecde] px-4">
        <p className="font-serif text-2xl text-[#2b1c14]">Your cart is empty</p>
        <Link href="/store" className="rounded-full bg-[#3d281d] px-6 py-2.5 text-sm font-medium text-[#fdf4ea]">
          Visit the Store
        </Link>
      </main>
    );
  }

  // Confirmation step
  if (step === "done") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7ecde] px-4 py-16">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f3eb] text-4xl">
            ✓
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6a9175]">
            Order Confirmed
          </p>
          <h1 className="font-serif text-4xl text-[#2b1c14] md:text-5xl">
            Thank you
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-[#614737]">
            {hasPhysical
              ? "Your order has been placed. Physical books will be shipped to your address."
              : "Your ebooks have been added to your library instantly."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/orders"
              className="rounded-full bg-[#3d281d] px-6 py-2.5 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
            >
              View Orders
            </Link>
            {!hasPhysical && (
              <Link
                href="/library"
                className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-6 py-2.5 text-sm font-medium text-[#583a2a] transition hover:bg-[#f7e6d0]"
              >
                Go to Library
              </Link>
            )}
            <Link
              href="/store"
              className="rounded-full border border-[#d8b792] bg-[#fff8ef] px-6 py-2.5 text-sm font-medium text-[#4e3427] transition hover:bg-[#f4e4d0]"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Placing order loading
  if (step === "placing") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7ecde] px-4">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#d8b792] border-t-[#3d281d]" />
          <p className="font-serif text-xl text-[#2b1c14]">Placing your order…</p>
          <p className="mt-2 text-sm text-[#614737]">Please wait a moment</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 border-b border-[#d9b996]/50 pb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
            {step === "address" ? "Step 1 of 2" : "Step 2 of 2"}
          </p>
          <h1 className="font-serif text-4xl text-[#2b1c14] md:text-5xl">
            {step === "address" ? (ebookOnly ? "Confirm Purchase" : "Shipping Address") : "Review Order"}
          </h1>
        </header>

        {/* Step indicator */}
        <div className="mb-10 flex items-center gap-3">
          {[
            { key: "address", label: ebookOnly ? "Confirm" : "Address" },
            { key: "review", label: "Review" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              {i > 0 && <div className={`h-px w-8 ${step === "review" ? "bg-[#8a5a3b]" : "bg-[#d8b792]"}`} />}
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    s.key === step
                      ? "bg-[#3d281d] text-[#fdf4ea]"
                      : step === "review" && s.key === "address"
                      ? "bg-[#6a9175] text-white"
                      : "border border-[#d8b792] bg-[#fff8ef] text-[#7a5a47]"
                  }`}
                >
                  {step === "review" && s.key === "address" ? "✓" : i + 1}
                </span>
                <span className={`text-sm ${s.key === step ? "font-medium text-[#2b1c14]" : "text-[#9c7148]"}`}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main panel */}
          <div>
            {/* ADDRESS STEP */}
            {step === "address" && (
              <div className="rounded-3xl border border-[#d8b792]/55 bg-[#fff8ef]/80 p-6 shadow-[0_12px_32px_rgba(74,43,22,0.08)] md:p-8">
                {ebookOnly ? (
                  <div className="rounded-2xl border border-[#c5d4c8]/60 bg-[#eef5f0]/80 p-5 text-sm text-[#3d5a45]">
                    <p className="font-medium">Digital delivery — no shipping required</p>
                    <p className="mt-1 text-[#5a7a6a]">
                      Your ebooks will be added to your library instantly after purchase.
                    </p>
                  </div>
                ) : (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <p className="mb-3 text-sm font-medium text-[#4e3427]">Saved addresses</p>
                        <div className="space-y-3">
                          {savedAddresses.map((addr: any) => (
                            <label
                              key={addr.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                                selectedAddressId === addr.id && !showNewForm
                                  ? "border-[#8a5a3b] bg-[#fdf0e2]"
                                  : "border-[#e0c8b0] bg-[#fff8ef] hover:border-[#c9a07a]"
                              }`}
                            >
                              <input
                                type="radio"
                                className="mt-0.5 accent-[#8a5a3b]"
                                checked={selectedAddressId === addr.id && !showNewForm}
                                onChange={() => handleAddressSelect(addr)}
                              />
                              <div className="text-sm text-[#4e3427]">
                                <p className="font-medium">{addr.full_name}</p>
                                <p className="mt-0.5 text-[#614737]">{addr.address_line}</p>
                                <p className="text-[#614737]">{addr.city}, {addr.state} {addr.pincode}</p>
                                {addr.phone && <p className="text-[#614737]">{addr.phone}</p>}
                              </div>
                            </label>
                          ))}
                          <button
                            type="button"
                            onClick={() => { setShowNewForm(true); setSelectedAddressId(null); }}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-2xl border p-4 text-left text-sm transition ${
                              showNewForm
                                ? "border-[#8a5a3b] bg-[#fdf0e2] text-[#4e3427]"
                                : "border-dashed border-[#c9a07a] bg-[#fff8ef] text-[#7a5a47] hover:border-[#8a5a3b]"
                            }`}
                          >
                            <span className="text-lg">+</span> Use a new address
                          </button>
                        </div>
                      </div>
                    )}

                    {(showNewForm || savedAddresses.length === 0) && (
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-[#4e3427]">
                          {savedAddresses.length > 0 ? "New address" : "Shipping address"}
                        </p>
                        <div>
                          <label className="mb-1.5 block text-sm text-[#614737]">Full name <span className="text-[#9d4a3c]">*</span></label>
                          <input
                            type="text"
                            value={address.full_name}
                            onChange={(e) => handleAddressChange("full_name", e.target.value)}
                            placeholder="Your full name"
                            className="w-full rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm text-[#614737]">Address line 1 <span className="text-[#9d4a3c]">*</span></label>
                          <input
                            type="text"
                            value={address.address_line}
                            onChange={(e) => handleAddressChange("address_line", e.target.value)}
                            placeholder="House / flat / street"
                            className="w-full rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-sm text-[#614737]">City <span className="text-[#9d4a3c]">*</span></label>
                            <input
                              type="text"
                              value={address.city}
                              onChange={(e) => handleAddressChange("city", e.target.value)}
                              placeholder="City"
                              className="w-full rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm text-[#614737]">State</label>
                            <input
                              type="text"
                              value={address.state}
                              onChange={(e) => handleAddressChange("state", e.target.value)}
                              placeholder="State"
                              className="w-full rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-sm text-[#614737]">Pincode <span className="text-[#9d4a3c]">*</span></label>
                            <input
                              type="text"
                              value={address.pincode}
                              onChange={(e) => handleAddressChange("pincode", e.target.value)}
                              placeholder="6-digit pincode"
                              className="w-full rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm text-[#614737]">Phone</label>
                            <input
                              type="tel"
                              value={address.phone}
                              onChange={(e) => handleAddressChange("phone", e.target.value)}
                              placeholder="Mobile number"
                              className="w-full rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={handleAddressContinue}
                  disabled={savingAddress}
                  className="mt-6 w-full rounded-2xl bg-[#3d281d] py-3.5 text-sm font-medium text-[#fdf4ea] shadow-sm transition hover:bg-[#553727] disabled:opacity-60"
                >
                  {savingAddress ? "Saving…" : "Continue to Review"}
                </button>
              </div>
            )}

            {/* REVIEW STEP */}
            {step === "review" && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#d8b792]/55 bg-[#fff8ef]/80 p-6 shadow-[0_12px_32px_rgba(74,43,22,0.08)] md:p-8">
                  <h2 className="mb-5 font-serif text-2xl text-[#2b1c14]">Your Items</h2>
                  <ul className="space-y-4">
                    {cart.map((item) => {
                      const unitPrice = parsePriceInr(item.price);
                      const qty = item.quantity || 1;
                      return (
                        <li key={item.id} className="flex gap-4 border-b border-[#ead8c2] pb-4 last:border-0 last:pb-0">
                          <img
                            src={item.image || "https://placehold.co/80x120"}
                            alt={item.title}
                            className="h-20 w-14 shrink-0 rounded-xl object-cover"
                          />
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9c6b49]">
                                {item.type === "ebook" ? "Digital" : "Physical"}
                              </p>
                              <p className="mt-0.5 font-serif text-lg leading-snug text-[#2b1c14]">{item.title}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-[#7a5a47]">Qty: {qty}</p>
                              <p className="font-semibold text-[#8a5a3b]">{formatInrPrice(unitPrice * qty)}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {hasPhysical && address.address_line && (
                  <div className="rounded-3xl border border-[#d8b792]/55 bg-[#fff8ef]/80 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b6842]">Shipping to</p>
                        <p className="mt-1 font-medium text-[#2b1c14]">{address.full_name}</p>
                        <p className="text-sm text-[#614737]">{address.address_line}</p>
                        <p className="text-sm text-[#614737]">{address.city}{address.state ? `, ${address.state}` : ""} {address.pincode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep("address")}
                        className="text-sm text-[#8a5a3b] underline-offset-2 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full rounded-2xl bg-[#3d281d] py-4 text-sm font-medium text-[#fdf4ea] shadow-sm transition hover:bg-[#553727] disabled:opacity-60"
                >
                  {placingOrder ? "Placing Order…" : "Place Order"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="w-full rounded-2xl border border-[#d8b792] bg-[#fff8ef] py-3 text-sm font-medium text-[#4e3427] transition hover:bg-[#f4e4d0]"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="h-fit lg:sticky lg:top-28">
            <div className="rounded-3xl border border-[#dab995]/60 bg-gradient-to-br from-[#fff8ef] to-[#f2e0c8] p-6 shadow-[0_14px_36px_rgba(74,43,22,0.1)]">
              <h2 className="font-serif text-2xl text-[#2b1c14]">Order Summary</h2>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between text-[#614737]">
                  <dt>Items</dt>
                  <dd>{itemCount}</dd>
                </div>
                <div className="flex justify-between text-[#614737]">
                  <dt>Subtotal</dt>
                  <dd>{formatInrPrice(subtotal)}</dd>
                </div>
                {hasPhysical && (
                  <div className="flex justify-between text-[#614737]">
                    <dt>Shipping</dt>
                    <dd className="text-[#6a9175]">Calculated at delivery</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-[#e5cdb0] pt-4">
                <span className="text-[#4e3427]">Total</span>
                <span className="font-serif text-3xl text-[#2b1c14]">{formatInrPrice(subtotal)}</span>
              </div>

              {ebookOnly && (
                <p className="mt-4 rounded-2xl border border-[#c5d4c8]/60 bg-[#eef5f0]/80 px-3 py-2 text-xs text-[#3d5a45]">
                  Ebooks delivered instantly to your library.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
