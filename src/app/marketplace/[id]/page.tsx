"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ToastProvider";
import ReportModal from "@/components/ReportModal";
import StarRating, { RatingSummary } from "@/components/StarRating";
import WishlistButton from "@/components/WishlistButton";
import { addItemToCart, upsertSingleItemCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

interface Listing {
  id: string;
  title: string;
  authors: string[];
  image: string;
  categories: string[];
  condition: string;
  price: string;
  notes: string;
  seller_id?: string;
  seller_name: string;
  seller_bio: string;
  is_ebook: boolean;
  ebook_file_name?: string;
  ebook_url?: string;
  created_at: string;
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

export default function MarketplaceListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { pushToast } = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "listing" | "review"; id: string } | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from("listings").select("*").eq("id", params.id).single();
      if (error) { console.error(error); return; }
      setListing(data);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, profiles(username)")
        .eq("product_id", params.id)
        .order("created_at", { ascending: false });
      setReviews(reviewData || []);
    }
    fetchData();
  }, [params.id]);

  function addToCart() {
    if (!listing) return;
    const result = addItemToCart({
      id: listing.id, title: listing.title, image: listing.image,
      price: listing.price, type: listing.is_ebook ? "ebook" : "physical",
      seller_id: listing.seller_id || null, quantity: 1,
    });
    if (result.alreadyExists) { pushToast("Cart quantity updated", "info"); return; }
    pushToast("Added to cart", "success");
  }

  function buyNow() {
    if (!listing) return;
    upsertSingleItemCart({
      id: listing.id, title: listing.title, image: listing.image,
      price: listing.price, type: listing.is_ebook ? "ebook" : "physical",
      seller_id: listing.seller_id || null, quantity: 1,
    });
    router.push("/checkout");
  }

  async function messageSeller() {
    if (!user) { pushToast("Please sign in first", "info"); return; }
    if (!listing) return;
    try {
      setLoadingMessage(true);
      const { data: existing } = await supabase
        .from("conversations").select("*")
        .eq("buyer_id", user.id).eq("seller_id", listing.seller_id).eq("listing_id", listing.id)
        .single();
      if (existing) { router.push(`/messages/${existing.id}`); return; }
      const { data, error } = await supabase
        .from("conversations")
        .insert([{ buyer_id: user.id, seller_id: listing.seller_id, listing_id: listing.id }])
        .select().single();
      if (error) { pushToast("Could not open conversation", "error"); return; }
      router.push(`/messages/${data.id}`);
    } catch (err) { console.error(err); }
    finally { setLoadingMessage(false); }
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
    setReview(""); setRating(5);
    const { data: reviewData } = await supabase
      .from("reviews").select("*, profiles(username)")
      .eq("product_id", params.id).order("created_at", { ascending: false });
    setReviews(reviewData || []);
  }

  if (!listing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde] px-4">
        <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-center">
          <h1 className="font-serif text-3xl text-[#2d1e15]">Listing not found</h1>
          <button onClick={() => router.push("/marketplace")} className="mt-4 rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]">
            Back to marketplace
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          {/* Cover */}
          <div className="rounded-[1.75rem] border border-[#d7b590]/60 bg-[#fff7ee]/70 p-4 shadow-[0_20px_48px_rgba(74,43,22,0.11)]">
            <img
              src={listing.image || "https://placehold.co/600x900"}
              alt={listing.title}
              className="w-full rounded-[1.25rem] border border-[#e2c6a7] object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-7">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#986543]">
                Community Marketplace
              </p>
              <h1 className="font-serif text-4xl leading-tight text-[#2d1e15] md:text-5xl">
                {listing.title}
              </h1>
              <p className="mt-3 text-lg text-[#6b4d3a] md:text-xl">
                by {listing.authors?.join(", ")}
              </p>
              {reviews.length > 0 && (
                <div className="mt-3">
                  <RatingSummary average={avgRating} count={reviews.length} size="sm" />
                </div>
              )}
            </div>

            <div className="flex items-end justify-between rounded-3xl border border-[#d8b792]/55 bg-[#fff7ee]/70 p-5">
              <span className="text-4xl font-semibold text-[#8a5a3b] md:text-5xl">₹{listing.price}</span>
              <span className="rounded-full border border-[#d4b18d] bg-[#fff3e4] px-3 py-1 text-sm text-[#6b4d3a]">
                {listing.condition}
              </span>
            </div>

            <div className="rounded-3xl border border-[#d8b792]/55 bg-[#fff7ee]/80 p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9a6744]">Seller</p>
              <p className="mt-2 font-serif text-2xl text-[#2d1e15]">{listing.seller_name || "Anonymous Reader"}</p>
              {listing.seller_bio && <p className="mt-2 text-sm leading-relaxed text-[#624938]">{listing.seller_bio}</p>}
              {listing.notes && <p className="mt-4 text-sm leading-relaxed text-[#6f5241]">{listing.notes}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {listing.categories?.map((c) => (
                <span key={c} className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-3 py-1 text-xs text-[#8b5d3e] md:text-sm">{c}</span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={addToCart} className="rounded-2xl bg-[#3d2b1f] px-7 py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#523a2a]">
                Add to Cart
              </button>
              <button onClick={buyNow} className="rounded-2xl border border-[#3d281d] bg-[#fff8ef] px-7 py-3 text-sm font-medium text-[#3d281d] transition hover:bg-[#f7e6d0]">
                Buy Now
              </button>
              {listing.is_ebook && listing.ebook_url && (
                <Link href={`/read/${listing.id}?source=marketplace`} className="rounded-2xl border border-[#5a7d52] bg-[#eef5f0] px-7 py-3 text-sm font-medium text-[#3d5a45]">
                  Read ebook
                </Link>
              )}
              <WishlistButton
                item={{
                  id: listing.id, title: listing.title, authors: listing.authors ?? [],
                  image: listing.image || "https://placehold.co/300x450",
                  price: listing.price, condition: listing.condition, source: "marketplace",
                  productType: listing.is_ebook ? "ebook" : "physical",
                }}
              />
              <button onClick={messageSeller} disabled={loadingMessage} className="rounded-2xl border border-[#ba9168] bg-[#fff4e6] px-7 py-3 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]">
                {loadingMessage ? "Opening…" : "Message Seller"}
              </button>
              <button
                onClick={() => setReportTarget({ type: "listing", id: listing.id })}
                className="rounded-2xl border border-[#e8cfc9] bg-[#fdf5f3] px-5 py-3 text-sm text-[#9d4a3c] transition hover:bg-[#fae7e2]"
              >
                Report Listing
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-20">
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
            <div className="space-y-5">
              {reviews.length === 0 ? (
                <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-center">
                  <p className="font-serif text-xl text-[#4e3427]">No reviews yet</p>
                  <p className="mt-2 text-sm text-[#7a5a47]">Be the first to share your thoughts.</p>
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
              <p className="mt-1 text-sm text-[#7a5a47]">Share your reading experience.</p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#4e3427]">Your rating</p>
                  <div className="flex items-center gap-1 text-2xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110">
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
                  <button type="button" onClick={submitReview} disabled={submitting} className="w-full rounded-2xl bg-[#3d2b1f] py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#523a2a] disabled:opacity-60">
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                ) : (
                  <Link href="/login" className="block w-full rounded-2xl bg-[#3d2b1f] py-3 text-center text-sm font-medium text-[#fdf4ea]">
                    Sign in to review
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

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
