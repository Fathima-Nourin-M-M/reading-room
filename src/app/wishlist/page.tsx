"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getWishlist,
  getWishlistHref,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";
import { addItemToCart } from "@/lib/cart";
import { useToast } from "@/components/ToastProvider";

export default function WishlistPage() {
  const { pushToast } = useToast();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setWishlist(getWishlist());
  }, []);

  function removeItem(id: string) {
    const updated = removeFromWishlist(id);
    setWishlist(updated);
    pushToast("Removed from wishlist", "info");
  }

  function addToCart(item: WishlistItem) {
    const { alreadyExists } = addItemToCart({
      id: item.id,
      title: item.title,
      image: item.image,
      price: item.price ?? "0",
      type: item.productType === "ebook" ? "ebook" : "physical",
      seller_id: item.source === "marketplace" ? item.id : null,
    });

    if (alreadyExists) {
      pushToast("Already in your cart", "info");
    } else {
      pushToast(`"${item.title}" added to cart`, "success");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-[#d8b792]/60 bg-gradient-to-br from-[#f8ead8] via-[#f3e1c9] to-[#e0c29f] p-8 shadow-[0_24px_60px_rgba(74,43,22,0.13)] md:p-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#986543]">Personal Library</p>
          <h1 className="font-serif text-4xl text-[#2d1e15] sm:text-5xl">Your Wishlist</h1>
          {wishlist.length > 0 && (
            <p className="mt-2 text-sm text-[#6d4e38]">{wishlist.length} {wishlist.length === 1 ? "book" : "books"} saved</p>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
            <p className="font-serif text-2xl text-[#2b1c14]">Your wishlist is empty.</p>
            <p className="mt-2 text-sm">Save books you want to read later from the store or marketplace.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/store" className="rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]">
                Browse the store
              </Link>
              <Link href="/marketplace" className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-5 py-2 text-sm font-medium text-[#583a2a]">
                Explore marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff8ef] shadow-[0_12px_34px_rgba(74,43,22,0.1)]"
              >
                <Link href={getWishlistHref(item)} className="block transition hover:opacity-95">
                  <img
                    src={item.image || "https://placehold.co/300x450/f7ecde/3d281d?text=📚"}
                    alt={item.title}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </Link>

                <div className="space-y-3 p-5">
                  <div>
                    <span className="rounded-full bg-[#4b3124] px-2 py-1 text-xs text-[#f7ead8]">{item.productType}</span>
                    <h2 className="mt-3 font-serif text-xl text-[#2d1e15]">{item.title}</h2>
                    <p className="mt-1 text-sm text-[#6d5242]">{item.authors?.join(", ")}</p>
                  </div>

                  {item.price && (
                    <p className="font-semibold text-[#8a5a3b]">{item.price}</p>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="w-full rounded-2xl bg-[#3d281d] py-2.5 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-full rounded-2xl border border-[#efc1b8] bg-[#fae7e2] py-2.5 text-sm font-medium text-[#9d4a3c] transition hover:bg-[#f5d3cd]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
