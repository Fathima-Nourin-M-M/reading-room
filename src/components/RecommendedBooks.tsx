"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  formatInrPrice,
  parsePriceInr,
} from "@/lib/catalogPricing";
import { supabase } from "@/lib/supabase";

import { useUser } from "@/hooks/useUser";

interface Product {

  id: string;

  title: string;

  cover_image: string;

  tags: string[];

  categories: string[];

  price: string;

  product_type: string;
}

interface RankedProduct
  extends Product {

  score: number;
}

export default function RecommendedBooks() {

  const { user } =
    useUser();

  const [books, setBooks] =
    useState<Product[]>([]);
  const [isLoaded, setIsLoaded] =
    useState(false);

  useEffect(() => {

    async function fetchRecommendations() {

      if (!user) {
        setIsLoaded(true);
        return;
      }

      /*
        USER PURCHASES
      */
      const {
        data: purchases,
      } =
        await supabase
          .from("purchases")
          .select("*")
          .eq(
            "user_id",
            user.id
          );

      const purchasedIds =
        purchases?.map(
          (p) =>
            p.product_id
        ) || [];

      /*
        FETCH PRODUCTS
      */
      const {
        data: products,
        error,
      } =
        await supabase
          .from("products")
          .select("*");

      if (error) {

        console.error(error);
        setIsLoaded(true);

        return;
      }

      /*
        REMOVE PURCHASED PRODUCTS
      */
      const recommendations =
        products?.filter(
          (product) =>
            !purchasedIds.includes(
              product.id
            )
        ) || [];

      /*
        GET PURCHASED PRODUCTS
      */
      const purchasedProducts =
        products?.filter(
          (product) =>
            purchasedIds.includes(
              product.id
            )
        ) || [];

      /*
        EXTRACT PREFERRED TAGS
      */
      const preferredTags =
        purchasedProducts.flatMap(
          (product) =>
            product.tags || []
        );

      /*
        EXTRACT PREFERRED CATEGORIES
      */
      const preferredCategories =
        purchasedProducts.flatMap(
          (product) =>
            product.categories || []
        );

      /*
        RANK PRODUCTS
      */
      const ranked:
        RankedProduct[] =

        recommendations.map(
          (product) => {

            let score = 0;

            /*
              TAG MATCHES
            */
            product.tags?.forEach(
              (tag: string) => {

                if (
                  preferredTags.includes(
                    tag
                  )
                ) {

                  score += 3;
                }
              }
            );

            /*
              CATEGORY MATCHES
            */
            product.categories?.forEach(
              (category: string) => {

                if (
                  preferredCategories.includes(
                    category
                  )
                ) {

                  score += 2;
                }
              }
            );

            return {
              ...product,
              score,
            };
          }
        )

        .sort(
          (a, b) =>
            b.score - a.score
        )

        .slice(0, 8);

      /*
        FALLBACK RANDOM
      */
      if (
        ranked.length === 0
      ) {

        const shuffled =
          recommendations.sort(
            () =>
              0.5 -
              Math.random()
          );

        setBooks(
          shuffled.slice(
            0,
            8
          )
        );
        setIsLoaded(true);

        return;
      }

      setBooks(ranked);
      setIsLoaded(true);
    }

    fetchRecommendations();

  }, [user]);

  return (
    <section>
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
          Personalized Recommendations
        </p>
        <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">
          Picks for your shelf
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[#664c3c] md:text-base">
          {user
            ? "Suggestions based on your reading and purchases."
            : "Curated picks from the store — sign in to personalize this shelf."}
        </p>
      </div>

      {books.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <Link
              href={`/store/${book.id}`}
              key={book.id}
              className="overflow-hidden rounded-3xl border border-[#d5b18c]/60 bg-[#fff8ef] shadow-[0_12px_32px_rgba(74,43,22,0.09)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(74,43,22,0.12)]"
            >
              <img
                src={
                  book.cover_image ||
                  "https://placehold.co/300x450"
                }
                alt={book.title}
                className="w-full aspect-[3/4] object-cover"
              />

              <div className="p-5 pt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {book.tags
                    ?.slice(0, 3)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full border border-[#d9b28b] bg-[#fff2e2] text-[#8b5d3e] text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <h3 className="font-serif text-xl text-[#2d1e15] leading-snug">
                  {book.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b5d3e] font-semibold text-base">
                    ₹{book.price}
                  </span>
                  <span className="text-xs text-[#7a5a47] capitalize">
                    {book.product_type}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : isLoaded ? (
        <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
          <p className="font-serif text-2xl text-[#2b1c14]">
            We are learning your taste.
          </p>
          <p className="mt-2 text-sm">
            Explore the store and these recommendations will become more personal.
          </p>
          <Link
            href="/store"
            className="mt-4 inline-flex rounded-full border border-[#b1835d] bg-[#fff3e4] px-5 py-2 text-sm font-medium text-[#583a2a]"
          >
            Visit store
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
          <p className="text-sm">Loading recommendations...</p>
        </div>
      )}
    </section>
  );
}