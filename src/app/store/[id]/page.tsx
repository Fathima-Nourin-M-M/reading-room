"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useToast } from "@/components/ToastProvider";
import WishlistButton from "@/components/WishlistButton";
import ReportModal from "@/components/ReportModal";
import StarRating, { RatingSummary } from "@/components/StarRating";
import { formatInrPrice, parsePriceInr } from "@/lib/catalogPricing";
import { addItemToCart, upsertSingleItemCart } from "@/lib/cart";
import { asStringArray } from "@/lib/productDisplay";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

interface Product {
  id: string;
  title: string;
  authors: string[];
  cover_image: string;
  description: string;
  categories: string[];
  tags: string[];
  product_type: string;
  price: string;
  inventory: number;
  ebook_url?: string;
  featured: boolean;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
  profiles?: { username?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

export default function StoreProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { pushToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "listing" | "review"; id: string } | null>(null);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error) { console.error(error); return; }
      setProduct(data);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, profiles(username)")
        .eq("product_id", params.id)
        .order("created_at", { ascending: false });
      setReviews(reviewData || []);
    }
    fetchProduct();
  }, [params.id]);

  function addToCart() {
    if (!product) return;
    const result = addItemToCart({
      id: product.id, title: product.title, image: product.cover_image,
      price: product.price, type: product.product_type, seller_id: null, quantity: 1,
    });
    if (result.alreadyExists) { pushToast("Cart quantity updated", "info"); return; }
    pushToast("Added to cart", "success");
  }

  function buyNow() {
    if (!product) return;
    upsertSingleItemCart({
      id: product.id, title: product.title, image: product.cover_image,
      price: product.price, type: product.product_type, seller_id: null, quantity: 1,
    });
    router.push("/checkout");
  }

  async function submitReview() {
    if (!user) { pushToast("Please sign in to leave a review", "info"); return; }
    if (!review.trim()) { pushToast("Please write something before submitting", "info"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert([{
      user_id: user.id, product_id: params.id, rating, review,
    }]);
    setSubmitting(false);
    if (error) { pushToast("Failed to submit review", "error"); return; }
    pushToast("Review submitted", "success");
    setReview("");
    setRating(5);
    // Refresh reviews
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*, profiles(username)")
      .eq("product_id", params.id)
      .order("created_at", { ascending: false });
    setReviews(reviewData || []);
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde] px-4">
        <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-center">
          <p className="font-serif text-3xl text-[#2b1c14]">Product not found.</p>
          <Link href="/store" className="mt-4 inline-flex rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]">
            Return to store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">

        {/* Product layout */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          {/* Cover */}
          <div className="rounded-[1.75rem] border border-[#d7b590]/60 bg-[#fff7ee]/70 p-4 shadow-[0_20px_48px_rgba(74,43,22,0.11)]">
            <img
              src={product.cover_image || "https://placehold.co/600x900"}
              alt={product.title}
              className="w-full rounded-[1.25rem] border border-[#e2c6a7] object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-7">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#3d2b1f] px-3 py-1 text-xs text-[#f7ead8]">
                  {product.product_type}
                </span>
                {product.featured && (
                  <span className="rounded-full border border-[#ddb887] bg-[#fff2de] px-3 py-1 text-xs text-[#8e5f3d]">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="font-serif text-4xl leading-tight text-[#2d1e15] md:text-5xl">
                {product.title}
              </h1>
              <p className="mt-3 text-lg text-[#6b4d3a] md:text-xl">
                by {product.authors?.join(", ")}
              </p>
              {reviews.length > 0 && (
                <div className="mt-3">
                  <RatingSummary average={avgRating} count={reviews.length} size="sm" />
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-end justify-between rounded-3xl border border-[#d8b792]/55 bg-[#fff7ee]/70 p-5">
              <span className="text-4xl font-semibold text-[#8a5a3b] md:text-5xl">
                {formatInrPrice(parsePriceInr(product.price))}
              </span>
              <span className="text-sm text-[#6f5241]">{product.inventory} in stock</span>
            </div>

            {/* Description */}
            <div className="rounded-3xl border border-[#d8b792]/55 bg-[#fff7ee]/80 p-6 shadow-[0_12px_30px_rgba(74,43,22,0.08)] md:p-8">
              <h2 className="mb-3 font-serif text-2xl text-[#2d1e15]">Description</h2>
              <p className="text-base leading-relaxed text-[#624938] md:text-lg">
                {product.description}
              </p>
            </div>

            {/* Categories & Tags */}
            <div className="flex flex-wrap gap-2">
              {product.categories?.map((c) => (
                <span key={c} className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-3 py-1 text-xs text-[#8b5d3e] md:text-sm">{c}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags?.map((t) => (
                <span key={t} className="rounded-full bg-[#4b3124] px-3 py-1 text-xs text-[#f7ead8] md:text-sm">{t}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-3">
              <button onClick={addToCart} className="rounded-2xl bg-[#3d2b1f] px-7 py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#523a2a]">
                Add to Cart
              </button>
              <button onClick={buyNow} className="rounded-2xl border border-[#3d281d] bg-[#fff8ef] px-7 py-3 text-sm font-medium text-[#3d281d] transition hover:bg-[#f7e6d0]">
                Buy Now
              </button>
              <WishlistButton
                item={{
                  id: product.id, title: product.title,
                  authors: asStringArray(product.authors),
                  image: product.cover_image || "https://placehold.co/300x450",
                  price: product.price, source: "store",
                  productType: product.product_type === "ebook" ? "ebook" : "physical",
                }}
              />
              {product.product_type === "ebook" && (
                <Link href={`/read/${product.id}`} className="rounded-2xl border border-[#ba9168] bg-[#fff4e6] px-7 py-3 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]">
                  Preview Ebook
                </Link>
              )}
              <button
                onClick={() => setReportTarget({ type: "listing", id: product.id })}
                className="rounded-2xl border border-[#e8cfc9] bg-[#fdf5f3] px-5 py-3 text-sm text-[#9d4a3c] transition hover:bg-[#fae7e2]"
              >
                Report
              </button>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <section className="mt-20 md:mt-24">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">Reader voices</p>
              <h2 className="mt-1 font-serif text-3xl text-[#2d1e15] md:text-4xl">Reviews</h2>
            </div>
            {reviews.length > 0 && (
              <div className="text-right">
                <RatingSummary average={avgRating} count={reviews.length} size="md" />
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Review list */}
            <div className="space-y-5">
              {reviews.length === 0 ? (
                <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-center">
                  <p className="font-serif text-xl text-[#4e3427]">No reviews yet</p>
                  <p className="mt-2 text-sm text-[#7a5a47]">Be the first to share your thoughts on this title.</p>
                </div>
              ) : (
                reviews.map((item) => (
                  <div key={item.id} className="group rounded-3xl border border-[#d8b792]/50 bg-[#fff9f2] p-6 transition hover:border-[#c9a07a]/70">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={item.rating} size="sm" />
                          <span className="text-sm font-medium text-[#8a5a3b]">{item.rating}/5</span>
                        </div>
                        <p className="mt-1 text-xs text-[#9c7148]">
                          {item.profiles?.username || "A reader"} · {formatDate(item.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => setReportTarget({ type: "review", id: item.id })}
                        className="shrink-0 rounded-xl px-2 py-1 text-xs text-[#c4a68a] opacity-0 transition hover:bg-[#f4e4d0] hover:text-[#9d4a3c] group-hover:opacity-100"
                        title="Report review"
                      >
                        Report
                      </button>
                    </div>
                    <p className="text-base leading-relaxed text-[#4e3427]">{item.review}</p>
                  </div>
                ))
              )}
            </div>

            {/* Write review */}
            <div className="h-fit rounded-3xl border border-[#d8b792]/55 bg-gradient-to-br from-[#fff8ef] to-[#f5e8d5] p-6 shadow-[0_12px_30px_rgba(74,43,22,0.08)]">
              <h3 className="font-serif text-xl text-[#2b1c14]">Leave a review</h3>
              <p className="mt-1 text-sm text-[#7a5a47]">Share your reading experience with the community.</p>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#4e3427]">Your rating</p>
                  <div className="flex items-center gap-1 text-2xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${star} star`}
                      >
                        <span className={star <= rating ? "text-[#c28b4a]" : "text-[#d9c4ae]"}>★</span>
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-[#8a5a3b]">{rating}/5</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4e3427]">Your thoughts</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="What did you think of this book?"
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#2b1c14] placeholder:text-[#b09a85] focus:border-[#a8794e] focus:outline-none"
                  />
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={submitting}
                    className="w-full rounded-2xl bg-[#3d2b1f] py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#523a2a] disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full rounded-2xl bg-[#3d2b1f] py-3 text-center text-sm font-medium text-[#fdf4ea] transition hover:bg-[#523a2a]"
                  >
                    Sign in to review
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* More to explore */}
        <section className="mt-16 rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-6 md:p-8">
          <h2 className="font-serif text-2xl text-[#2b1c14]">More to explore</h2>
          <p className="mt-2 text-sm text-[#614737]">Keep browsing the literary collection.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/discover" className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-4 py-2 text-sm text-[#583a2a]">Discover classics</Link>
            <Link href="/lists" className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-4 py-2 text-sm text-[#583a2a]">Literary lists</Link>
            <Link href="/marketplace" className="rounded-full bg-[#3d281d] px-4 py-2 text-sm font-medium text-[#fdf4ea]">Marketplace</Link>
          </div>
        </section>
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </main>
  );
}
