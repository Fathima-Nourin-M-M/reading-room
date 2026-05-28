"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

interface FeedReview {
  id: string;
  product_id: string;
  rating: number;
  review: string;
  created_at: string;
  profiles?: { username: string } | null;
  products?: { title: string; cover_image: string } | null;
}

export default function FeedPage() {
  const { user } = useUser();
  const [reviews, setReviews] = useState<FeedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "following">("all");

  useEffect(() => {
    async function fetchFeed() {
      setLoading(true);
      const followingIds: string[] = [];

      if (user) {
        const { data: follows } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id);
        followingIds.push(...(follows?.map((f: any) => f.following_id) || []));
      }

      let query = supabase
        .from("reviews")
        .select(`id, product_id, rating, review, created_at, profiles(username), products(title, cover_image)`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (filter === "following" && followingIds.length > 0) {
        query = query.in("user_id", followingIds);
      }

      const { data, error } = await query;
      if (!error && data) {
        setReviews(
          data.map((r: any) => ({
            ...r,
            profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles,
            products: Array.isArray(r.products) ? r.products[0] ?? null : r.products,
          }))
        );
      }
      setLoading(false);
    }
    fetchFeed();
  }, [user, filter]);

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-[#d8b792]/60 bg-gradient-to-br from-[#f8ead8] via-[#f3e1c9] to-[#e0c29f] p-8 shadow-[0_24px_60px_rgba(74,43,22,0.13)] md:p-12">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#986543]">Literary Network</p>
          <h1 className="font-serif text-4xl text-[#2d1e15] sm:text-5xl">Reader Feed</h1>
          <p className="mt-3 text-sm text-[#6d4e38]">
            Reviews and reading activity from the community.
          </p>
        </div>

        {/* Filter */}
        {user && (
          <div className="mb-8 flex gap-2">
            {(["all", "following"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-5 py-2 text-sm transition ${
                  filter === f
                    ? "border-[#3d281d] bg-[#3d281d] text-[#fdf4ea]"
                    : "border-[#d4b58f] bg-[#fff8ef] text-[#4e3427] hover:bg-[#f4e4d0]"
                }`}
              >
                {f === "all" ? "All Reviews" : "Following"}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-5 rounded-3xl border border-[#dab995]/55 bg-[#fff8ef] p-6 animate-pulse">
                <div className="h-32 w-24 shrink-0 rounded-xl bg-[#e8d7c4]" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-[#e8d7c4]" />
                  <div className="h-6 w-2/3 rounded bg-[#e8d7c4]" />
                  <div className="h-4 w-1/4 rounded bg-[#e8d7c4]" />
                  <div className="h-16 w-full rounded bg-[#e8d7c4]" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-10 text-center">
            <p className="font-serif text-3xl text-[#2b1c14]">The feed is quiet for now</p>
            <p className="mt-3 text-sm text-[#614737]">
              {filter === "following"
                ? "The readers you follow haven't left reviews yet. Try the all reviews feed."
                : "Be among the first to leave a review on a store title."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {filter === "following" && (
                <button onClick={() => setFilter("all")} className="rounded-full border border-[#d4b58f] bg-[#fff8ef] px-5 py-2 text-sm text-[#4e3427] hover:bg-[#f4e4d0]">
                  View all reviews
                </button>
              )}
              <Link href="/store" className="rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]">
                Browse store & review →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((item) => (
              <article key={item.id} className="flex gap-5 rounded-3xl border border-[#dab995]/55 bg-[#fff8ef] p-5 shadow-sm transition hover:shadow-md md:p-7">
                <img
                  src={item.products?.cover_image || "https://placehold.co/120x180/f7ecde/3d281d?text=📚"}
                  alt={item.products?.title || ""}
                  className="h-36 w-24 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  {item.profiles?.username && (
                    <Link href={`/u/${item.profiles.username}`} className="text-sm font-medium text-[#c2784e] hover:underline">
                      @{item.profiles.username}
                    </Link>
                  )}
                  <Link href={`/store/${item.product_id}`} className="block font-serif text-2xl text-[#2d1e15] hover:underline leading-snug">
                    {item.products?.title || "Store title"}
                  </Link>
                  <p className="text-amber-600">
                    {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                    <span className="ml-2 text-xs text-[#9c7148]">{item.rating}/5</span>
                  </p>
                  <p className="text-sm leading-relaxed text-[#584131] line-clamp-4">{item.review}</p>
                  <p className="text-xs text-[#9c7148]">
                    {new Date(item.created_at).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
