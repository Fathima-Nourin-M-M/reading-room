"use client";

import { useState } from "react";
import { BOOK_TAGS } from "@/lib/tags";

export default function CreateListPage() {

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [creator, setCreator] =
    useState("");

  const [selectedTags, setSelectedTags] =
    useState<string[]>([]);

  const [bookTitle, setBookTitle] =
    useState("");

  const [books, setBooks] =
    useState<any[]>([]);

  function addBook() {

    if (!bookTitle.trim()) {
      return;
    }

    setBooks([
      ...books,
      {
        id: crypto.randomUUID(),
        title: bookTitle,
      },
    ]);

    setBookTitle("");
  }

  function publishList() {

    if (!title || books.length === 0) {
      alert(
        "Add a title and at least one book."
      );

      return;
    }

    const newList = {
      id: crypto.randomUUID(),

      title,

      description,

      creator,

      tags: selectedTags,

      books,

      createdAt:
        new Date().toISOString(),
    };

    const existingLists =
      JSON.parse(
        localStorage.getItem(
          "literaryLists"
        ) || "[]"
      );

    existingLists.push(newList);

    localStorage.setItem(
      "literaryLists",
      JSON.stringify(existingLists)
    );

    alert("List published!");
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-orange-100 p-10 space-y-8">

        <div>
          <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
            Community Curation
          </p>

          <h1 className="text-5xl font-serif text-[#2d1e15]">
            Create Literary List
          </h1>
        </div>

        {/* TITLE */}
        <div>
          <label className="block mb-2 font-medium text-[#2d1e15]">
            List Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Books That Feel Like Winter"
            className="w-full px-4 py-3 rounded-xl border border-orange-100"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block mb-2 font-medium text-[#2d1e15]">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Describe the mood/theme of this collection..."
            className="w-full px-4 py-3 rounded-xl border border-orange-100 min-h-[120px]"
          />
        </div>

        {/* CREATOR */}
        <div>
          <label className="block mb-2 font-medium text-[#2d1e15]">
            Curator Name
          </label>

          <input
            type="text"
            value={creator}
            onChange={(e) =>
              setCreator(e.target.value)
            }
            placeholder="Your literary identity"
            className="w-full px-4 py-3 rounded-xl border border-orange-100"
          />
        </div>

        {/* TAGS */}
        <div>
          <label className="block mb-3 font-medium text-[#2d1e15]">
            Discovery Tags
          </label>

          <div className="flex flex-wrap gap-3">
            {BOOK_TAGS.map((tag) => {

              const active =
                selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {

                    if (active) {
                      setSelectedTags(
                        selectedTags.filter(
                          (t) => t !== tag
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
            })}
          </div>
        </div>

        {/* ADD BOOK */}
        <div>
          <label className="block mb-2 font-medium text-[#2d1e15]">
            Add Books
          </label>

          <div className="flex gap-3">
            <input
              type="text"
              value={bookTitle}
              onChange={(e) =>
                setBookTitle(e.target.value)
              }
              placeholder="Enter book title..."
              className="flex-1 px-4 py-3 rounded-xl border border-orange-100"
            />

            <button
              type="button"
              onClick={addBook}
              className="px-6 py-3 bg-[#3d2b1f] text-white rounded-xl"
            >
              Add
            </button>
          </div>
        </div>

        {/* BOOKS */}
        <div className="space-y-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="px-4 py-3 rounded-xl bg-[#f8f3ed] border border-orange-100"
            >
              {book.title}
            </div>
          ))}
        </div>

        {/* PUBLISH */}
        <button
          onClick={publishList}
          className="w-full py-4 bg-[#c2784e] text-white rounded-2xl text-lg hover:opacity-90 transition"
        >
          Publish Literary List
        </button>
      </div>
    </main>
  );
}