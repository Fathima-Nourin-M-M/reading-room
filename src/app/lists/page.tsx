"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SAMPLE_LISTS = [
  {
    id: "sample-1",
    title: "Rainy Evening Reads",
    description: "Books that match the sound of rain on windows. Atmospheric, reflective, and deeply human.",
    tags: ["Atmosphere", "Literary Fiction"],
    creator: "The Reading Room",
    books: [{ title: "Normal People" }, { title: "A Little Life" }, { title: "The Remains of the Day" }],
    isSample: true,
  },
  {
    id: "sample-2",
    title: "Dark Academia Essentials",
    description: "Gothic campuses, literary obsession, and candlelit libraries. The classics of the genre.",
    tags: ["Dark Academia", "Gothic"],
    creator: "The Reading Room",
    books: [{ title: "The Secret History" }, { title: "If We Were Villains" }, { title: "Babel" }],
    isSample: true,
  },
  {
    id: "sample-3",
    title: "Cozy Fantasy Shelf",
    description: "Warm taverns, gentle magic, and stories that feel like home. Fantasy without the violence.",
    tags: ["Cozy Fantasy", "Feel-Good"],
    creator: "The Reading Room",
    books: [{ title: "The House in the Cerulean Sea" }, { title: "Legends & Lattes" }, { title: "A Wizard's Guide to Defensive Baking" }],
    isSample: true,
  },
  {
    id: "sample-4",
    title: "Philosophy for Everyone",
    description: "Entry points into the great questions of existence. Clear, readable, essential.",
    tags: ["Philosophy", "Nonfiction"],
    creator: "The Reading Room",
    books: [{ title: "Meditations" }, { title: "Man's Search for Meaning" }, { title: "Sophie's World" }],
    isSample: true,
  },
];

export default function ListsPage() {
  const [lists, setLists] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("literaryLists") || "[]");
      setLists(Array.isArray(stored) ? stored : []);
    } catch {
      setLists([]);
    }
    setLoaded(true);
  }, []);

  const allLists = loaded ? [...lists, ...SAMPLE_LISTS] : SAMPLE_LISTS;

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-[#d8b792]/60 bg-gradient-to-br from-[#f8ead8] via-[#f3e1c9] to-[#e0c29f] p-8 shadow-[0_24px_60px_rgba(74,43,22,0.13)] md:p-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#986543]">Community Curation</p>
              <h1 className="font-serif text-4xl text-[#2d1e15] sm:text-5xl">Literary Lists</h1>
              <p className="mt-3 max-w-xl text-sm text-[#6d4e38]">
                Curated shelves from readers. Discover books through themed collections, or create your own to share with the community.
              </p>
            </div>
            <Link
              href="/lists/create"
              className="shrink-0 rounded-full bg-[#3d281d] px-6 py-3 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
            >
              + Create List
            </Link>
          </div>
        </div>

        {/* User lists */}
        {lists.length > 0 && (
          <div className="mb-12">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-[#9b6842]">Your Lists</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {lists.map((list: any) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="rounded-3xl border border-[#dab995]/60 bg-[#fff7ee]/90 p-6 shadow-[0_12px_32px_rgba(74,43,22,0.09)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(74,43,22,0.13)]"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {list.tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="rounded-full bg-[#3d281d] px-2 py-0.5 text-[10px] text-[#fdf4ea]">{tag}</span>
                    ))}
                  </div>
                  <h2 className="font-serif text-2xl text-[#2d1e15]">{list.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-[#614737]">{list.description}</p>
                  <div className="mt-4 space-y-1">
                    {list.books?.slice(0, 3).map((book: any) => (
                      <p key={book.id} className="text-xs text-[#8a6248]">· {book.title}</p>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-[#ead8c2] pt-3 flex items-center justify-between">
                    <span className="text-xs text-[#9c7148]">{list.books?.length || 0} books</span>
                    <span className="text-xs font-medium text-[#7d5134]">Open →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Editorial / sample lists */}
        <div>
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-[#9b6842]">
            {lists.length > 0 ? "Editorial Shelves" : "Discover Collections"}
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_LISTS.map((list) => (
              <article
                key={list.id}
                className="rounded-3xl border border-[#dab995]/60 bg-gradient-to-br from-[#fff5e8] to-[#f2dcc1] p-6 shadow-[0_12px_32px_rgba(74,43,22,0.09)]"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {list.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#c09070]/50 bg-[#fff3e4]/70 px-2 py-0.5 text-[10px] text-[#7b5338]">{tag}</span>
                  ))}
                </div>
                <h2 className="font-serif text-2xl text-[#2d1e15]">{list.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#614737]">{list.description}</p>
                <div className="mt-4 space-y-1">
                  {list.books.map((book) => (
                    <p key={book.title} className="text-xs text-[#8a6248]">· {book.title}</p>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <Link
                    href="/discover"
                    className="rounded-full border border-[#b1835d]/50 bg-[#fff3e4]/70 px-4 py-1.5 text-xs font-medium text-[#583a2a] hover:bg-[#f4e1ca]"
                  >
                    Explore shelf
                  </Link>
                  <Link
                    href="/lists/create"
                    className="rounded-full border border-[#b1835d]/50 bg-[#fff3e4]/70 px-4 py-1.5 text-xs font-medium text-[#583a2a] hover:bg-[#f4e1ca]"
                  >
                    Create similar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-[#d9b996]/60 bg-[#3d281d] p-8 text-[#fdf4ea]">
          <p className="font-serif text-2xl">Start curating your own shelf.</p>
          <p className="mt-2 text-sm text-[#e0c8ae]">Create a literary list and share it with the community. Your taste is worth sharing.</p>
          <Link href="/lists/create" className="mt-5 inline-flex rounded-full bg-[#c2973f] px-6 py-2.5 text-sm font-medium text-[#2b1c14] transition hover:bg-[#d4a84a]">
            Create a List →
          </Link>
        </div>
      </div>
    </main>
  );
}
