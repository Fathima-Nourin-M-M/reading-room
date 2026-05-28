"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRecommendations } from "@/lib/recommendations";
export default function LiteraryListPage() {

  const params = useParams();

  const [list, setList] =
    useState<any>(null);
  const [recommendedLists, setRecommendedLists] =
  useState<any[]>([]);
  useEffect(() => {

    const storedLists =
      JSON.parse(
        localStorage.getItem(
          "literaryLists"
        ) || "[]"
      );

    const foundList =
      storedLists.find(
        (item: any) =>
          item.id === params.id
      );

    setList(foundList);
    if (foundList) {

  const recommendations =
    getRecommendations(
      foundList,
      storedLists
    );

  setRecommendedLists(
    recommendations
  );
}
  }, [params.id]);

  if (!list) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdf9f3]">
        <p className="text-slate-500 text-lg">
          Literary list not found.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdf9f3] px-8 py-16">

      <div className="max-w-6xl mx-auto space-y-14">

        {/* HERO */}
        <section className="bg-white rounded-[2rem] border border-orange-100 shadow-xl p-10">

          <p className="uppercase tracking-[0.25em] text-xs font-bold text-[#c2784e] mb-4">
            Community Literary Collection
          </p>

          <h1 className="text-6xl font-serif text-[#2d1e15] leading-tight">
            {list.title}
          </h1>

          <p className="mt-8 text-xl text-slate-600 leading-relaxed max-w-4xl">
            {list.description}
          </p>

          {/* CURATOR */}
          <div className="mt-10 pt-8 border-t border-orange-100">

            <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
              Curated By
            </p>

            <p className="text-2xl font-serif text-[#2d1e15]">
              {list.creator || "Anonymous"}
            </p>
          </div>

          {/* TAGS */}
          <div className="flex flex-wrap gap-3 mt-10">

            {list.tags?.map((tag: string) => (
              <span
                key={tag}
                className="px-4 py-2 bg-[#3d2b1f] text-white rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* BOOKS */}
        <section>

          <div className="mb-10">
            <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
              Collection
            </p>

            <h2 className="text-4xl font-serif text-[#2d1e15]">
              Featured Books
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {list.books?.map((book: any) => (

              <div
                key={book.id}
                className="bg-white rounded-3xl border border-orange-100 shadow-lg p-6 flex items-start gap-5"
              >

                <div className="w-20 h-28 rounded-xl bg-[#f3ebe2] flex items-center justify-center text-xs text-slate-500">
                  Book
                </div>

                <div className="flex-1">

                  <h3 className="text-2xl font-serif text-[#2d1e15]">
                    {book.title}
                  </h3>

                  <p className="mt-3 text-slate-600 leading-relaxed">
                    Part of this curated literary collection.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* RECOMMENDED COLLECTIONS */}
<section>

  <div className="mb-10">
    <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
      Discovery Engine
    </p>

    <h2 className="text-4xl font-serif text-[#2d1e15]">
      Similar Literary Collections
    </h2>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

    {recommendedLists.map((item) => (

      <div
        key={item.id}
        className="bg-white rounded-3xl border border-orange-100 shadow-lg p-6"
      >

        <h3 className="text-2xl font-serif text-[#2d1e15]">
          {item.title}
        </h3>

        <p className="mt-3 text-slate-600 line-clamp-3">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-5">

          {item.tags?.map(
            (tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-[#3d2b1f] text-white rounded-full text-xs"
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>
    ))}
  </div>
</section>
      </div>
    </main>
  );
}