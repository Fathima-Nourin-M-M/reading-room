"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CommunityShelfPanel from "@/components/CommunityShelfPanel";
import RecentCommunityReviews from "@/components/RecentCommunityReviews";
import { useToast } from "@/components/ToastProvider";
import {
  extractGutendexReadingOptions,
  gutendexHasReadableContent,
} from "@/lib/gutendex";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

interface GutendexBook {

  id: number;

  title: string;

  authors: {
    name: string;
  }[];

  subjects: string[];

  formats: Record<
    string,
    string
  >;
}

export default function DiscoverPage() {

  const { user } = useUser();
  const { pushToast } = useToast();

  const [books, setBooks] =
    useState<GutendexBook[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  useEffect(() => {

    async function fetchBooks() {

      try {

        setLoading(true);

        const response =
          await fetch(
            "https://gutendex.com/books"
          );

        const data =
          await response.json();

        setBooks(
          data.results || []
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    }

    fetchBooks();

  }, []);

  const filteredBooks =
    books.filter((book) =>

      book.title
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}
        <div className="mb-12">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Global Literary Discovery
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15]">
            Discover Free Ebooks
          </h1>

          <p className="mt-5 text-xl text-slate-600 max-w-3xl leading-relaxed">
            Explore thousands of public-domain
            literary works from the Gutendex
            ecosystem.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mb-12">

          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full px-6 py-5 rounded-2xl border border-orange-100 bg-white shadow-sm text-lg outline-none"
          />
        </div>

        {/* LOADING */}
        {loading ? (

          <div className="text-lg text-slate-500">
            Loading books...
          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {filteredBooks.map(
              (book) => {

                const cover =
                  book.formats[
                    "image/jpeg"
                  ];

                const reading =
                  extractGutendexReadingOptions(book);
                const canRead =
                  gutendexHasReadableContent(reading);

                return (

                  <div
                    key={book.id}
                    className="bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden"
                  >

                    <img
                      src={
                        cover ||
                        "https://placehold.co/300x450"
                      }
                      alt={book.title}
                      className="w-full aspect-[3/4] object-cover"
                    />

                    <div className="p-5 space-y-4">

                      <div>

                        <h2 className="font-serif text-2xl text-[#2d1e15]">
                          {book.title}
                        </h2>

                        <p className="text-sm text-slate-600 mt-2">
                          {book.authors
                            ?.map(
                              (author) =>
                                author.name
                            )
                            .join(", ")}
                        </p>
                      </div>

                      {/* SUBJECTS */}
                      <div className="flex flex-wrap gap-2">

                        {book.subjects
                          ?.slice(0, 3)
                          .map(
                            (subject) => (

                              <span
                                key={subject}
                                className="px-2 py-1 bg-orange-100 text-[#a35e36] rounded-full text-xs"
                              >
                                {subject}
                              </span>
                            )
                          )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex flex-wrap gap-3 pt-3">
                        {canRead && (
                          <Link
                            href={`/read/${book.id}?source=gutendex`}
                            className="rounded-xl bg-[#3d281d] px-4 py-2 text-sm text-[#fdf4ea]"
                          >
                            Read
                          </Link>
                        )}

                        {reading.epubUrl && (
                          <a
                            href={reading.epubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-[#d5b18c] px-4 py-2 text-sm text-[#4e3427]"
                          >
                            EPUB
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) {
                              pushToast("Sign in to save to your library", "info");
                              return;
                            }

                            const { error } = await supabase
                              .from("library")
                              .insert([
                                {
                                  user_id: user.id,
                                  book_id: String(book.id),
                                  title: book.title,
                                  authors: book.authors?.map(
                                    (author) => author.name
                                  ),
                                  cover_image: cover,
                                  source: "gutendex",
                                },
                              ]);

                            if (error) {
                              console.error(error);
                              pushToast(
                                "Could not save — it may already be in your library",
                                "error"
                              );
                              return;
                            }

                            pushToast("Saved to your library", "success");
                          }}
                          className="rounded-xl bg-[#fff3e4] px-4 py-2 text-sm text-[#7d5134]"
                        >
                          Save to library
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        <div className="mt-20 space-y-12">
          <RecentCommunityReviews title="What readers are saying" />
          <CommunityShelfPanel />
        </div>
      </div>
    </main>
  );
}