"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Listing {
    
    id: string;

  title: string;

  authors: string[];

  image: string;

  categories: string[];

  condition: string;

  price: string;

  notes: string;

  seller_name: string;

  seller_bio: string;

  tags: string[];

  is_ebook: boolean;

  ebook_file_name?: string;
  ebook_url?: string;
  created_at: string;
}

export default function MarketplacePage() {

  const [listings, setListings] =
    useState<Listing[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [selectedCondition, setSelectedCondition] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("Newest");

  const [selectedTags, setSelectedTags] =
    useState<string[]>([]);

  const allTags = Array.from(
    new Set(
      listings.flatMap(
        (listing) =>
          listing.tags || []
      )
    )
  );

  useEffect(() => {

    async function fetchListings() {

      const { data, error } =
        await supabase
          .from("listings")
          .select("*")
          .order(
            "created_at",
            { ascending: false }
          );

      if (error) {

        console.error(error);
        setIsLoading(false);

        return;
      }

      setListings(data || []);
      setIsLoading(false);
    }

    fetchListings();

  }, []);

  const filteredListings =
    listings
      .filter((listing) => {
        const categoryMatch =
          selectedCategory === "All" ||
          listing.categories?.some((category) =>
            category
              .toLowerCase()
              .includes(selectedCategory.toLowerCase())
          );

        const conditionMatch =
          selectedCondition === "All" ||
          listing.condition === selectedCondition;

        const tagMatch =
          selectedTags.length === 0 ||
          selectedTags.every((tag) =>
            listing.tags?.includes(tag)
          );

        return (
          categoryMatch &&
          conditionMatch &&
          tagMatch
        );
      })
      .sort((a, b) => {
        if (sortBy === "Lowest Price") {
          return (
            Number(a.price) - Number(b.price)
          );
        }

        if (sortBy === "Highest Price") {
          return (
            Number(b.price) - Number(a.price)
          );
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-[#d8b792]/60 bg-gradient-to-br from-[#f8ead8] via-[#f3e1c9] to-[#e0c29f] p-8 shadow-[0_24px_60px_rgba(74,43,22,0.13)] md:p-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#986543]">
            Community Marketplace
          </p>
          <h1 className="font-serif text-4xl text-[#2d1e15] sm:text-5xl">
            Discover preloved literary treasures
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#614737] md:text-base">
            Wander through reader listings, curated tags, and hidden finds from the community.
          </p>
        </div>

        {/* FILTERS */}
        <div className="mb-10 rounded-3xl border border-[#d8b792]/55 bg-[#fff7ee]/80 p-5 md:p-6">
          <div className="flex flex-wrap gap-3">

          {/* CATEGORY */}
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="rounded-xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#533a2a]"
          >
            <option>All</option>

            <option>
              Fiction
            </option>

            <option>
              Science Fiction
            </option>

            <option>
              Fantasy
            </option>

            <option>
              Literary Criticism
            </option>
          </select>

          {/* CONDITION */}
          <select
            value={selectedCondition}
            onChange={(e) =>
              setSelectedCondition(
                e.target.value
              )
            }
            className="rounded-xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#533a2a]"
          >
            <option>All</option>

            <option>
              Like New
            </option>

            <option>
              Very Good
            </option>

            <option>
              Good
            </option>

            <option>
              Acceptable
            </option>
          </select>

          {/* SORT */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            className="rounded-xl border border-[#ddbea0] bg-[#fffdf9] px-4 py-3 text-sm text-[#533a2a]"
          >
            <option>
              Newest
            </option>

            <option>
              Lowest Price
            </option>

            <option>
              Highest Price
            </option>
          </select>

          {/* TAG FILTERS */}
          </div>
          <div className="mt-4 w-full">
            <p className="mb-2 text-sm font-medium text-[#2d1e15]">
              Discovery Tags
            </p>

            <div className="flex flex-wrap gap-2">

              {allTags.map((tag) => {

                const active =
                  selectedTags.includes(
                    tag
                  );

                return (

                  <button
                    key={tag}
                    onClick={() => {

                      if (active) {

                        setSelectedTags(
                          selectedTags.filter(
                            (t) =>
                              t !== tag
                          )
                        );

                      } else {

                        setSelectedTags([
                          ...selectedTags,
                          tag,
                        ]);
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs transition md:text-sm ${
                      active
                        ? "border-[#3d2b1f] bg-[#3d2b1f] text-[#f7ead8]"
                        : "border-[#d9b28b] bg-[#fff4e7] text-[#6b4d3a]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LISTINGS */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="animate-pulse overflow-hidden rounded-3xl border border-[#dfc3a2] bg-[#fff7ee]/85 p-4">
                <div className="aspect-[3/4] rounded-2xl bg-[#ead7c4]" />
                <div className="mt-4 h-4 w-3/4 rounded bg-[#ead7c4]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[#ead7c4]" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
            <p className="font-serif text-2xl text-[#2b1c14]">No listings yet.</p>
            <p className="mt-2 text-sm">Community listings will appear here once readers start selling.</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
            <p className="font-serif text-2xl text-[#2b1c14]">No matches for these filters.</p>
            <p className="mt-2 text-sm">Try clearing a few filters to explore more shelves.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredListings.map((listing) => (
                <Link
                  href={`/marketplace/${listing.id}`}
                  key={listing.id}
                  className="group block overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff8ef] shadow-[0_12px_34px_rgba(74,43,22,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(74,43,22,0.14)]"
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

                    {/* EBOOK BADGE */}
                    {listing.is_ebook && (

                      <div className="w-fit rounded-full border border-[#8ab39a] bg-[#e9f5eb] px-2 py-1 text-xs text-[#3b6e50]">
                        Ebook
                      </div>
                    )}

                    <h2 className="font-serif text-xl text-[#2d1e15]">
                      {listing.title}
                    </h2>

                    <p className="text-sm text-[#6d5242]">
                      {listing.authors?.join(", ")}
                    </p>

                    {/* PRICE + CONDITION */}
                    <div className="flex items-center justify-between">

                      <span className="font-semibold text-[#8a5a3b]">
                        ₹{listing.price}
                      </span>

                      <span className="rounded-full border border-[#d4b18d] bg-[#fff3e4] px-2 py-1 text-xs text-[#6b4d3a]">
                        {listing.condition}
                      </span>
                    </div>

                    {/* NOTES */}
                    <p className="line-clamp-2 text-sm text-[#745948]">
                      {listing.notes}
                    </p>

                    {/* SELLER */}
                    <div className="border-t border-[#ecd9c4] pt-2">
                      <p className="mb-1 text-[11px] uppercase tracking-[0.15em] text-[#a16d47]">
                        Seller
                      </p>

                      <p className="text-sm font-medium text-[#2d1e15]">
                        {listing.seller_name ||
                          "Anonymous Reader"}
                      </p>
                    </div>

                    {/* TAGS */}
                    <div className="flex flex-wrap gap-2">

                      {listing.tags?.map(
                        (tag) => (

                          <span key={tag} className="rounded-full bg-[#4b3124] px-2 py-1 text-xs text-[#f7ead8]">
                            {tag}
                          </span>
                        )
                      )}
                    </div>

                    {/* CATEGORIES */}
                    <div className="flex flex-wrap gap-2">

                      {listing.categories?.map(
                        (category) => (

                          <span key={category} className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-2 py-1 text-xs text-[#8b5d3e]">
                            {category}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}