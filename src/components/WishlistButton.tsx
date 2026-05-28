"use client";

import { useEffect, useState } from "react";

import {
  addToWishlist,
  isInWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";
import { useToast } from "@/components/ToastProvider";

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
}

export default function WishlistButton({
  item,
  className = "",
}: WishlistButtonProps) {
  const [saved, setSaved] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    setSaved(isInWishlist(item.id));
  }, [item.id]);

  function toggleWishlist() {
    if (saved) {
      removeFromWishlist(item.id);
      setSaved(false);
      pushToast("Removed from wishlist", "info");
      return;
    }

    addToWishlist(item);
    setSaved(true);
    pushToast("Added to wishlist", "success");
  }

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      className={
        className ||
        "rounded-2xl border border-[#ba9168] bg-[#fff4e6] px-4 py-2.5 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]"
      }
    >
      {saved ? "Saved" : "Add to Wishlist"}
    </button>
  );
}
