"use client";

import { useRouter } from "next/navigation";

import { useToast } from "@/components/ToastProvider";
import WishlistButton from "@/components/WishlistButton";
import { addItemToCart, upsertSingleItemCart } from "@/lib/cart";
import {
  resolveCatalogPrice,
  resolveProductType,
} from "@/lib/catalogPricing";

function resolveBookPricing(book: BookDetailActionsProps["book"]) {
  const bookForPricing = {
    id: book.id,
    title: book.title,
    subtitle: null,
    authors: book.authors,
    coverUrl: book.coverUrl,
    description: null,
    snippet: null,
    publisher: null,
    publishedDate: null,
    pageCount: null,
    categories: [],
    language: null,
    averageRating: null,
    ratingsCount: null,
    isbn10: null,
    isbn13: null,
    previewLink: null,
    infoLink: null,
    isEbook: book.isEbook,
    saleability: null,
    listPrice: book.listPrice ?? null,
    retailPrice: book.retailPrice ?? null,
    buyLink: null,
  } satisfies Book;

  return resolveCatalogPrice(
    bookForPricing,
    resolveProductType(bookForPricing)
  );
}
import type { Book } from "@/types/books";

interface BookDetailActionsProps {
  book: {
    id: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
    isEbook: boolean;
    retailPrice?: { amount: number; currency: string } | null;
    listPrice?: { amount: number; currency: string } | null;
  };
}

function getPriceInr(book: BookDetailActionsProps["book"]): string {
  return String(resolveBookPricing(book).priceInr);
}

export default function BookDetailActions({
  book,
}: BookDetailActionsProps) {
  const { pushToast } = useToast();
  const router = useRouter();

  function addToCart() {
    const result = addItemToCart({
      id: book.id,
      title: book.title,
      image:
        book.coverUrl ||
        "https://placehold.co/300x450",
      price: getPriceInr(book),
      type: book.isEbook ? "ebook" : "physical",
      seller_id: null,
      quantity: 1,
    });
    if (result.alreadyExists) {
      pushToast("Cart quantity updated", "info");
      return;
    }
    pushToast("Added to cart", "success");
  }

  function buyNow() {
    upsertSingleItemCart({
      id: book.id,
      title: book.title,
      image:
        book.coverUrl ||
        "https://placehold.co/300x450",
      price: getPriceInr(book),
      type: book.isEbook ? "ebook" : "physical",
      seller_id: null,
      quantity: 1,
    });
    pushToast("Ready for checkout", "success");
    router.push("/cart");
  }

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <span className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-3 py-2 text-sm font-medium text-[#8b5d3e]">
        {resolveBookPricing(book).priceLabel}
      </span>
      <button
        type="button"
        onClick={addToCart}
        className="rounded-2xl bg-[#3d281d] px-7 py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#523a2a]"
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={buyNow}
        className="rounded-2xl border border-[#3d281d] bg-[#fff8ef] px-7 py-3 text-sm font-medium text-[#3d281d] transition hover:bg-[#f7e6d0]"
      >
        Buy Now
      </button>

      <WishlistButton
        item={{
          id: book.id,
          title: book.title,
          authors: book.authors,
          image:
            book.coverUrl ||
            "https://placehold.co/300x450",
          price: resolveBookPricing(book).priceLabel,
          source: "google",
          productType: book.isEbook ? "ebook" : "physical",
        }}
      />
    </div>
  );
}
