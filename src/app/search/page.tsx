"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import BookCatalogCard from "@/components/BookCatalogCard";
import { useBookSearch } from "@/lib/books/use-book-search";
import { supabase } from "@/lib/supabase";

interface Listing {
  id: string;
  title: string;
  authors: string[];
  image: string;
  tags: string[];
  description: string;
  categories: string[];
  price: string;
  type?: string;
  is_ebook?: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allListings, setAllListings] =
    useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] =
    useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [selectedType, setSelectedType] =
    useState("all");
  const [sortBy, setSortBy] =
    useState("relevance");

  const searchQuery =
    query.trim() || "literary fiction";

  const {
    data: bookResults,
    isLoading: booksLoading,
    isError: booksError,
    refetch: refetchBooks,
  } = useBookSearch({
    query: searchQuery,
    type: "keyword",
    pageSize: 20,
  });

  useEffect(() => {
    async function fetchListings() {
      try {
        const { data, error } =
          await supabase.from("listings").select("*");

        if (error) {
          console.error(error);
          return;
        }

        setAllListings(data || []);
      } finally {
        setListingsLoading(false);
      }
    }

    fetchListings();
  }, []);

  const filteredBooks = useMemo(() => {
    const books = bookResults?.books ?? [];

    if (selectedType === "all") {
      return books;
    }

    return books.filter((book) =>
      selectedType === "ebook"
        ? book.isEbook
        : !book.isEbook
    );
  }, [bookResults?.books, selectedType]);

  const marketplaceResults = useMemo(() => {
    let ranked = allListings;

    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(" ");

      ranked = allListings
        .map((listing) => {
          let score = 0;

          const title =
            listing.title?.toLowerCase() || "";
          const tags =
            listing.tags?.join(" ").toLowerCase() || "";
          const categories =
            listing.categories?.join(" ").toLowerCase() || "";
          const description =
            listing.description?.toLowerCase() || "";

          searchTerms.forEach((term) => {
            if (title.includes(term)) score += 10;
            if (tags.includes(term)) score += 7;
            if (categories.includes(term)) score += 5;
            if (description.includes(term)) score += 3;
          });

          return { listing, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.listing);
    }

    ranked = ranked.filter((listing) => {
      if (
        selectedCategory !== "all" &&
        !listing.categories?.includes(selectedCategory)
      ) {
        return false;
      }

      if (selectedType !== "all") {
        const listingType =
          listing.type ||
          (listing.is_ebook ? "ebook" : "physical");

        if (listingType !== selectedType) {
          return false;
        }
      }

      return true;
    });

    if (sortBy === "low") {
      ranked = [...ranked].sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
    }

    if (sortBy === "high") {
      ranked = [...ranked].sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
    }

    return ranked;
  }, [
    allListings,
    query,
    selectedCategory,
    selectedType,
    sortBy,
  ]);

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-[#d8b792]/60 bg-gradient-to-br from-[#f8ead8] via-[#f3e1c9] to-[#e0c29f] p-8 shadow-[0_24px_60px_rgba(74,43,22,0.13)] md:p-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#986543]">
            Literary Search
          </p>
          <h1 className="font-serif text-4xl text-[#2d1e15] sm:text-5xl">
            Find your next hidden gem
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#614737] md:text-base">
            Search the Google Books catalog and community marketplace by mood, theme, and format.
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "dark academia mystery"'
            className="w-full rounded-3xl border border-[#ddbea0] bg-[#fffdf9] px-6 py-5 text-lg text-[#2b1c14] shadow-sm outline-none placeholder:text-[#9c7b64]"
          />
        </div>

        <div className="mb-10 rounded-3xl border border-[#d8b792]/55 bg-[#fff7ee]/80 p-5 md:p-6">
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }
              className="rounded-xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#533a2a]"
            >
              <option value="all">All Categories</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Philosophy">Philosophy</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value)
              }
              className="rounded-xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#533a2a]"
            >
              <option value="all">All Formats</option>
              <option value="ebook">Ebook</option>
              <option value="physical">Physical</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#533a2a]"
            >
              <option value="relevance">Relevance</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <section className="mb-14">
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
              Book Catalog
            </p>
            <h2 className="font-serif text-3xl text-[#2b1c14]">
              {query.trim()
                ? `Results for "${query.trim()}"`
                : "Featured literary browse"}
            </h2>
          </div>

          {booksLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse overflow-hidden rounded-3xl border border-[#dfc3a2] bg-[#fff7ee]/85 p-4"
                >
                  <div className="aspect-[3/4] rounded-2xl bg-[#ead7c4]" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-[#ead7c4]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-[#ead7c4]" />
                </div>
              ))}
            </div>
          ) : booksError ? (
            <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
              <p className="font-serif text-2xl text-[#2b1c14]">
                Book search unavailable.
              </p>
              <button
                type="button"
                onClick={() => refetchBooks()}
                className="mt-4 rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]"
              >
                Try again
              </button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
              <p className="font-serif text-2xl text-[#2b1c14]">
                No catalog matches found.
              </p>
              <p className="mt-2 text-sm">
                Try a broader phrase or switch format filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredBooks.map((book) => (
                <BookCatalogCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
              Community Marketplace
            </p>
            <h2 className="font-serif text-3xl text-[#2b1c14]">
              Reader listings
            </h2>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse overflow-hidden rounded-3xl border border-[#dfc3a2] bg-[#fff7ee]/85 p-4"
                >
                  <div className="aspect-[3/4] rounded-2xl bg-[#ead7c4]" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-[#ead7c4]" />
                </div>
              ))}
            </div>
          ) : marketplaceResults.length === 0 ? (
            <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
              <p className="font-serif text-2xl text-[#2b1c14]">
                No marketplace matches found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {marketplaceResults.map((listing) => (
                <Link
                  href={`/marketplace/${listing.id}`}
                  key={listing.id}
                  className="group overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff8ef] shadow-[0_12px_34px_rgba(74,43,22,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(74,43,22,0.14)]"
                >
                  <img
                    src={
                      listing.image ||
                      "https://placehold.co/300x450"
                    }
                    alt={listing.title}
                    className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="space-y-3 p-5">
                    <div>
                      <h2 className="font-serif text-2xl leading-snug text-[#2d1e15]">
                        {listing.title}
                      </h2>
                      <p className="mt-1 text-sm text-[#6d5242]">
                        {listing.authors?.join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags?.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-2 py-1 text-xs text-[#8b5d3e]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-[#8a5a3b]">
                        ₹{listing.price}
                      </span>
                      <span className="rounded-full border border-[#d4b18d] bg-[#fff3e4] px-2 py-1 text-xs text-[#6b4d3a]">
                        {listing.is_ebook ? "ebook" : "physical"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
