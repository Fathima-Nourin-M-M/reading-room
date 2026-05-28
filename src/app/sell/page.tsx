"use client";

import { inferTags } from "@/lib/tagInference";
import { useState } from "react";
import { BOOK_TAGS } from "@/lib/tags";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export default function SellPage() {

  const { user } = useUser();

  const [isbn, setIsbn] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [book, setBook] =
    useState<any>(null);

  const [condition, setCondition] =
    useState("Like New");

  const [price, setPrice] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [sellerName, setSellerName] =
    useState("");

  const [sellerBio, setSellerBio] =
    useState("");

  const [selectedTags, setSelectedTags] =
    useState<string[]>([]);

  const [customTag, setCustomTag] =
    useState("");

  const [isEbook, setIsEbook] =
    useState(false);

  const [ebookFile, setEbookFile] =
    useState<File | null>(null);

  async function handleFetchBook() {

    if (!isbn) return;

    try {

      setLoading(true);

      const response = await fetch(
        `/api/isbn/${isbn}`
      );

      const data =
        await response.json();

      const fetchedBook =
        data.items?.[0] || null;

      setBook(fetchedBook);

      if (fetchedBook) {

        const inferredTags =
          inferTags(
            `
            ${fetchedBook.volumeInfo.title}
            ${
              fetchedBook.volumeInfo
                .description || ""
            }
            ${
              fetchedBook.volumeInfo
                .categories?.join(" ") || ""
            }
            `
          );

        setSelectedTags(
          inferredTags
        );
      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-12">

          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Used Marketplace
          </p>

          <h1 className="text-5xl font-serif text-[#2d1e15]">
            Sell Your Book
          </h1>

          <p className="mt-4 text-slate-600 text-lg">
            Enter an ISBN and we’ll automatically
            generate your listing.
          </p>
        </div>

        {/* ISBN INPUT */}
        <div className="flex gap-4">

          <input
            type="text"
            placeholder="Enter ISBN..."
            value={isbn}
            onChange={(e) =>
              setIsbn(
                e.target.value
              )
            }
            className="flex-1 px-6 py-4 rounded-2xl border border-orange-100 bg-white shadow-sm outline-none"
          />

          <button
            onClick={handleFetchBook}
            className="px-8 py-4 bg-[#3d2b1f] text-white rounded-2xl hover:bg-[#523a2a] transition"
          >
            {loading
              ? "Fetching..."
              : "Fetch Book"}
          </button>
        </div>

        {/* BOOK PREVIEW */}
        {book && (

          <div className="mt-12 bg-white rounded-3xl shadow-xl border border-orange-100 p-8 grid md:grid-cols-3 gap-8">

            {/* COVER */}
            <div>

              <img
                src={
                  (
                    book.volumeInfo
                      .imageLinks
                      ?.extraLarge ||

                    book.volumeInfo
                      .imageLinks
                      ?.large ||

                    book.volumeInfo
                      .imageLinks
                      ?.thumbnail

                  )?.replace(
                    "http://",
                    "https://"
                  ) ||

                  "https://placehold.co/300x450"
                }
                alt={
                  book.volumeInfo.title
                }
                className="rounded-2xl shadow-lg"
              />
            </div>

            {/* FORM */}
            <div className="md:col-span-2 space-y-6">

              <div>

                <h2 className="text-3xl font-serif text-[#2d1e15]">
                  {book.volumeInfo.title}
                </h2>

                <p className="text-[#6b4d3a] mt-2">
                  by{" "}

                  {book.volumeInfo
                    .authors?.join(", ")}
                </p>
              </div>

              {/* CATEGORIES */}
              <div className="flex flex-wrap gap-2">

                {book.volumeInfo
                  .categories?.map(
                    (
                      category: string
                    ) => (

                      <span
                        key={category}
                        className="px-3 py-1 bg-orange-100 text-[#a35e36] rounded-full text-sm"
                      >
                        {category}
                      </span>
                    )
                  )}
              </div>

              {/* CONDITION */}
              <div>

                <label className="block mb-2 font-medium text-[#2d1e15]">
                  Condition
                </label>

                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-orange-100"
                >
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
              </div>

              {/* EBOOK TOGGLE */}
              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={isEbook}
                  onChange={(e) =>
                    setIsEbook(
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />

                <p className="text-[#2d1e15] font-medium">
                  This is an Ebook
                </p>
              </div>

              {/* EBOOK FILE */}
              {isEbook && (

                <div>

                  <label className="block mb-2 font-medium text-[#2d1e15]">
                    Upload Ebook File
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) =>
                      setEbookFile(
                        e.target
                          .files?.[0] ||
                          null
                      )
                    }
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 bg-white"
                  />
                </div>
              )}

              {/* PRICE */}
              <div>

                <label className="block mb-2 font-medium text-[#2d1e15]">
                  Selling Price
                </label>

                <input
                  type="number"
                  placeholder="₹"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-orange-100"
                />
              </div>

              {/* NOTES */}
              <div>

                <label className="block mb-2 font-medium text-[#2d1e15]">
                  Seller Notes
                </label>

                <textarea
                  placeholder="Describe wear, highlights, annotations, etc..."
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 min-h-[120px]"
                />
              </div>

              {/* SELLER NAME */}
              <div>

                <label className="block mb-2 font-medium text-[#2d1e15]">
                  Seller Name
                </label>

                <input
                  type="text"
                  placeholder="Your display name"
                  value={sellerName}
                  onChange={(e) =>
                    setSellerName(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-orange-100"
                />
              </div>

              {/* SELLER BIO */}
              <div>

                <label className="block mb-2 font-medium text-[#2d1e15]">
                  Seller Bio
                </label>

                <textarea
                  placeholder="Tell readers about yourself..."
                  value={sellerBio}
                  onChange={(e) =>
                    setSellerBio(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 min-h-[100px]"
                />
              </div>

              {/* TAGS */}
              <div>

                <label className="block mb-3 font-medium text-[#2d1e15]">
                  Discovery Tags
                </label>

                <div className="flex flex-wrap gap-3">

                  {BOOK_TAGS.map(
                    (tag) => {

                      const active =
                        selectedTags.includes(
                          tag
                        );

                      return (

                        <button
                          key={tag}
                          type="button"
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
                          className={`px-4 py-2 rounded-full border transition text-sm ${
                            active
                              ? "bg-[#3d2b1f] text-white border-[#3d2b1f]"
                              : "bg-white border-orange-100 text-[#6b4d3a]"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* CUSTOM TAG INPUT */}
                <div className="mt-4 flex gap-3">

                  <input
                    type="text"
                    placeholder="Create custom tag..."
                    value={customTag}
                    onChange={(e) =>
                      setCustomTag(
                        e.target.value
                      )
                    }
                    className="flex-1 px-4 py-3 rounded-xl border border-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() => {

                      if (
                        !customTag.trim()
                      ) {
                        return;
                      }

                      if (
                        selectedTags.includes(
                          customTag
                        )
                      ) {
                        return;
                      }

                      setSelectedTags([
                        ...selectedTags,
                        customTag,
                      ]);

                      setCustomTag("");
                    }}
                    className="px-6 py-3 bg-[#3d2b1f] text-white rounded-xl"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* PUBLISH */}
              <button
                onClick={async () => {

                  if (!user) {

                    alert(
                      "Please login first"
                    );

                    return;
                  }

                  if (!price) {

                    alert(
                      "Please enter a price"
                    );

                    return;
                  }

                  const { error } =
                    await supabase
                      .from("listings")
                      .insert([
                        {
                          title:
                            book.volumeInfo.title,

                          authors:
                            book.volumeInfo
                              .authors,

                          image:
                            (
                              book.volumeInfo
                                .imageLinks
                                ?.extraLarge ||

                              book.volumeInfo
                                .imageLinks
                                ?.large ||

                              book.volumeInfo
                                ?.imageLinks
                                ?.thumbnail

                            )?.replace(
                              "http://",
                              "https://"
                            ),

                          categories:
                            book.volumeInfo
                              .categories || [],

                          tags:
                            selectedTags,

                          is_ebook:
                            isEbook,

                          ebook_file_name:
                            ebookFile?.name || null,

                          condition,

                          price,

                          notes,

                          seller_name:
                            sellerName,

                          seller_bio:
                            sellerBio,

                          user_id:
                            user.id,
                        },
                      ]);

                  if (error) {

                    console.error(error);

                    alert(
                      "Failed to publish listing"
                    );

                    return;
                  }

                  alert(
                    "Listing published successfully!"
                  );
                }}
                className="mt-4 px-8 py-4 bg-[#c2784e] text-white rounded-2xl hover:opacity-90 transition"
              >
                Publish Listing
              </button>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}