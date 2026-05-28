"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface ReviewRow {
  id: string;
  product_id: string;
  rating: number;
  review: string;
  created_at: string;
  products?: {
    title: string;
    cover_image: string;
  } | null;
}

interface RecentCommunityReviewsProps {
  productId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

export default function RecentCommunityReviews({
  productId,
  limit = 5,
  title = "Recent reader reviews",
  className = "",
}: RecentCommunityReviewsProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("reviews")
        .select(
          `
          id,
          product_id,
          rating,
          review,
          created_at,
          products ( title, cover_image )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setReviews(
          data.map((row) => ({
            ...row,
            products: Array.isArray(row.products)
              ? row.products[0] ?? null
              : row.products,
          })) as ReviewRow[]
        );
      }
      setLoaded(true);
    }

    load();
  }, [productId, limit]);

  if (!loaded) {
    return (
      <section className={className}>
        <p className="text-sm text-[#614737]">Loading community reviews…</p>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section
        className={`rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-6 ${className}`}
      >
        <h2 className="font-serif text-2xl text-[#2b1c14]">{title}</h2>
        <p className="mt-2 text-sm text-[#614737]">
          No reviews yet. Be among the first to share your thoughts on a store
          title.
        </p>
        <Link
          href="/feed"
          className="mt-4 inline-flex text-sm text-[#7d5134] underline-offset-2 hover:underline"
        >
          Visit reader feed →
        </Link>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
            Community
          </p>
          <h2 className="font-serif text-2xl text-[#2b1c14] md:text-3xl">
            {title}
          </h2>
        </div>
        <Link
          href="/feed"
          className="text-sm text-[#7d5134] underline-offset-2 hover:underline"
        >
          All activity
        </Link>
      </div>

      <div className="space-y-4">
        {reviews.map((item) => (
          <article
            key={item.id}
            className="flex gap-4 rounded-3xl border border-[#dab995]/55 bg-[#fff8ef] p-4 shadow-sm"
          >
            <img
              src={
                item.products?.cover_image ||
                "https://placehold.co/80x120"
              }
              alt=""
              className="h-24 w-16 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/store/${item.product_id}`}
                className="font-serif text-lg text-[#2b1c14] hover:underline"
              >
                {item.products?.title || "Store title"}
              </Link>
              <p className="mt-1 text-amber-700">
                {"★".repeat(item.rating)}
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#584131]">
                {item.review}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
