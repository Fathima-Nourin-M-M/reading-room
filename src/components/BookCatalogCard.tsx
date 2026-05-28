"use client";

import Link from "next/link";

import WishlistButton from "@/components/WishlistButton";
import {
  resolveCatalogPrice,
  resolveProductType,
} from "@/lib/catalogPricing";
import type { Book } from "@/types/books";

interface BookCatalogCardProps {
  book: Book;
}

export default function BookCatalogCard({
  book,
}: BookCatalogCardProps) {
  const productType = resolveProductType(book);
  const pricing = resolveCatalogPrice(
    book,
    productType
  );

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff8ef] shadow-[0_12px_34px_rgba(74,43,22,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(74,43,22,0.14)]">
      <Link href={`/books/${book.id}`} className="block">
        <img
          src={
            book.coverUrl ||
            "https://placehold.co/300x450"
          }
          alt={book.title}
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />

        <div className="space-y-3 p-5 pb-3">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                productType === "ebook"
                  ? "bg-[#3d5a45] text-[#e8f3eb]"
                  : "bg-[#4b3124] text-[#f7ead8]"
              }`}
            >
              {productType === "ebook" ? "Ebook" : "Physical"}
            </span>
            {book.categories.slice(0, 1).map((category) => (
              <span
                key={category}
                className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-2 py-1 text-xs text-[#8b5d3e]"
              >
                {category}
              </span>
            ))}
          </div>

          <div>
            <h2 className="font-serif text-xl leading-snug text-[#2d1e15]">
              {book.title}
            </h2>
            <p className="mt-1 text-sm text-[#6d5242]">
              {book.authors.join(", ") || "Unknown author"}
            </p>
          </div>

          {book.snippet && (
            <p className="line-clamp-2 text-sm text-[#745948]">
              {book.snippet}
            </p>
          )}

          <div className="flex items-baseline gap-2">
            <p className="text-lg font-semibold text-[#8a5a3b]">
              {pricing.priceLabel}
            </p>
            {pricing.priceIsEstimate && (
              <span className="text-[11px] text-[#9c7148]">
                est.
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <WishlistButton
          item={{
            id: book.id,
            title: book.title,
            authors: book.authors,
            image:
              book.coverUrl ||
              "https://placehold.co/300x450",
            price: pricing.priceLabel,
            source: "google",
            productType,
          }}
          className="w-full rounded-2xl border border-[#ba9168] bg-[#fff4e6] py-2.5 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]"
        />
      </div>
    </article>
  );
}
