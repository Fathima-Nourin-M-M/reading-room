"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CommunityShelfPanel from "@/components/CommunityShelfPanel";
import RecentCommunityReviews from "@/components/RecentCommunityReviews";
import {
  librarySourceLabel,
  resolveLibraryReadHref,
} from "@/lib/libraryAccess";
import { formatInrPrice, parsePriceInr } from "@/lib/catalogPricing";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

interface LibraryBook {
  id: string;
  book_id: string;
  title: string;
  authors: string[];
  cover_image: string;
  source: string;
}

interface Purchase {
  id: string;
  product_id: string;
  title: string;
  cover_image: string;
  amount: string;
  product_type: string;
}

export default function LibraryPage() {
  const { user } = useUser();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [savedBooks, setSavedBooks] = useState<LibraryBook[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [readingProgress, setReadingProgress] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const storedWishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    );
    const storedMarketplace = JSON.parse(
      localStorage.getItem("marketplace") || "[]"
    );

    setWishlist(storedWishlist);
    setMarketplace(storedMarketplace);

    const progressMap: Record<string, number> = {};
    storedMarketplace.forEach((book: any) => {
      const progress = localStorage.getItem(
        `reading-progress-${book.id}`
      );
      if (progress) {
        progressMap[book.id] = Number(progress);
      }
    });
    setReadingProgress(progressMap);

    async function fetchSavedBooks() {
      if (!user) return;

      const { data, error } = await supabase
        .from("library")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setSavedBooks(data || []);

      const { data: purchaseData, error: purchaseError } =
        await supabase
          .from("purchases")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (!purchaseError) {
        setPurchases(purchaseData || []);
      }
    }

    fetchSavedBooks();
  }, [user]);

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl space-y-16">
        <header>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
            Personal literary space
          </p>
          <h1 className="font-serif text-4xl text-[#2b1c14] md:text-5xl">
            Your library
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#614737]">
            Public-domain saves, purchases, and reading progress — each with the
            right way to open.
          </p>
        </header>

        {!user && (
          <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/80 p-8">
            <p className="font-serif text-2xl text-[#2b1c14]">
              Sign in to sync your library
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]"
            >
              Sign in
            </Link>
          </div>
        )}

        <section>
          <h2 className="mb-6 font-serif text-3xl text-[#2b1c14]">
            Continue reading
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {marketplace
              .filter((book) => readingProgress[book.id] > 0)
              .map((book) => (
                <Link
                  href={
                    book.is_ebook && book.ebook_url
                      ? `/read/${book.id}?source=marketplace`
                      : `/marketplace/${book.id}`
                  }
                  key={book.id}
                  className="overflow-hidden rounded-3xl border border-[#dab995]/60 bg-[#fff8ef] shadow-sm"
                >
                  <img
                    src={
                      book.image ||
                      "https://placehold.co/300x450"
                    }
                    alt={book.title}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <div className="space-y-3 p-5">
                    <h3 className="font-serif text-xl text-[#2b1c14]">
                      {book.title}
                    </h3>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#e9d6c2]">
                      <div
                        className="h-full bg-[#5a3a2a]"
                        style={{
                          width: `${readingProgress[book.id]}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            {marketplace.filter((book) => readingProgress[book.id] > 0)
              .length === 0 && (
              <p className="text-sm text-[#614737] md:col-span-3">
                Start a marketplace ebook or open a saved title below.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-[#2b1c14]">
              Saved books
            </h2>
            <Link
              href="/discover"
              className="text-sm text-[#7d5134] underline-offset-2 hover:underline"
            >
              Discover more
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {savedBooks.map((book) => (
              <article
                key={book.id}
                className="overflow-hidden rounded-3xl border border-[#dab995]/60 bg-[#fff8ef] shadow-sm"
              >
                <img
                  src={
                    book.cover_image ||
                    "https://placehold.co/300x450"
                  }
                  alt={book.title}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="space-y-3 p-5">
                  <h3 className="font-serif text-lg text-[#2b1c14]">
                    {book.title}
                  </h3>
                  <p className="text-sm text-[#614737]">
                    {book.authors?.join(", ")}
                  </p>
                  <span className="inline-block rounded-full bg-[#3d281d] px-2.5 py-1 text-[10px] text-[#fdf4ea]">
                    {librarySourceLabel(book.source)}
                  </span>
                  <Link
                    href={resolveLibraryReadHref(book)}
                    className="mt-2 block w-full rounded-2xl bg-[#3d281d] py-2.5 text-center text-sm font-medium text-[#fdf4ea]"
                  >
                    Open
                  </Link>
                </div>
              </article>
            ))}
            {user && savedBooks.length === 0 && (
              <p className="text-sm text-[#614737] sm:col-span-2 lg:col-span-4">
                Save public-domain titles from{" "}
                <Link
                  href="/discover"
                  className="font-medium underline-offset-2 hover:underline"
                >
                  Discover
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-6 font-serif text-3xl text-[#2b1c14]">
            Purchased books
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {purchases.map((book) => (
              <article
                key={book.id}
                className="overflow-hidden rounded-3xl border border-[#dab995]/60 bg-[#fff8ef] shadow-sm"
              >
                <img
                  src={
                    book.cover_image ||
                    "https://placehold.co/300x450"
                  }
                  alt={book.title}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="space-y-3 p-5">
                  <h3 className="font-serif text-lg text-[#2b1c14]">
                    {book.title}
                  </h3>
                  <p className="text-sm capitalize text-[#614737]">
                    {book.product_type}
                  </p>
                  <p className="font-semibold text-[#8a5a3b]">
                    {formatInrPrice(parsePriceInr(book.amount))}
                  </p>
                  {book.product_type === "ebook" ? (
                    <Link
                      href={`/read/${book.product_id}`}
                      className="block w-full rounded-2xl bg-[#3d281d] py-2.5 text-center text-sm font-medium text-[#fdf4ea]"
                    >
                      Read
                    </Link>
                  ) : (
                    <Link
                      href="/orders"
                      className="block w-full rounded-2xl border border-[#3d281d] py-2.5 text-center text-sm font-medium text-[#3d281d]"
                    >
                      Track order
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <RecentCommunityReviews className="border-t border-[#d9b996]/45 pt-12" />

        <CommunityShelfPanel />

        <section>
          <h2 className="mb-6 font-serif text-3xl text-[#2b1c14]">
            Wishlist
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wishlist.map((book) => (
              <Link
                href={
                  book.source === "google"
                    ? `/books/${book.id}`
                    : book.source === "store"
                      ? `/store/${book.id}`
                      : `/marketplace/${book.id}`
                }
                key={book.id}
                className="overflow-hidden rounded-3xl border border-[#dab995]/60 bg-[#fff8ef] shadow-sm"
              >
                <img
                  src={
                    book.image ||
                    "https://placehold.co/300x450"
                  }
                  alt={book.title}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="font-serif text-lg text-[#2b1c14]">
                    {book.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
