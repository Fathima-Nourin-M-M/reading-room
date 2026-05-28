"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Listing {
  id: string;

  title: string;

  authors: string[];

  image: string;

  isEbook: boolean;

  ebookFileName?: string;
  ebook_url?: string;
}

export default function ReaderPage() {

  const params = useParams();

  const [book, setBook] =
    useState<Listing | null>(null);

  const [progress, setProgress] =
    useState(0);

  useEffect(() => {

    const storedListings =
      JSON.parse(
        localStorage.getItem(
          "marketplace"
        ) || "[]"
      );

    const foundBook =
      storedListings.find(
        (item: Listing) =>
          item.id === params.id
      );

    setBook(foundBook || null);

    const storedProgress =
      localStorage.getItem(
        `reading-progress-${params.id}`
      );

    if (storedProgress) {
      setProgress(
        Number(storedProgress)
      );
    }

  }, [params.id]);

  if (!book) {
    return (
      <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <p className="text-lg">
          Ebook not found.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#2d1e15]">

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#f5f1e8]/80 border-b border-black/5">

        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#c2784e] font-bold">
              Reading Mode
            </p>

            <h1 className="font-serif text-2xl">
              {book.title}
            </h1>
          </div>

          <div className="text-sm text-slate-500">
            by {book.authors?.join(", ")}
          </div>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="max-w-5xl mx-auto px-6 py-4">

        <div className="flex items-center justify-between mb-3">

          <p className="text-sm font-medium text-slate-600">
            Reading Progress
          </p>

          <p className="text-sm text-slate-500">
            {progress}%
          </p>
        </div>

        <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden">

          <div
            className="h-full bg-[#3d2b1f]"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* READER */}
      <section className="max-w-3xl mx-auto px-8 py-20">

        <div className="space-y-8 leading-[2] text-[1.15rem] font-serif">

          <p>
            This is the beginning of your integrated
            ebook reading experience.
          </p>

          <p>
            Eventually this reader will support:
            annotations, highlights, AI summaries,
            reading analytics, semantic search,
            synced progress, and immersive literary
            exploration.
          </p>

          <p>
            For now, this acts as the foundational
            reading interface architecture for your
            platform.
          </p>

          <p>
            The platform is evolving from a literary
            marketplace into a complete literary
            operating system.
          </p>

          <p>
            Readers will eventually be able to move
            seamlessly between discovery, curation,
            recommendations, annotation, discussion,
            and reading itself.
          </p>

          <p>
            This is where the ecosystem becomes
            vertically integrated.
          </p>

          {/* ACTIONS */}
          <div className="pt-16 flex gap-4">

            <button
              onClick={() => {

                const updated =
                  Math.min(
                    progress + 10,
                    100
                  );

                setProgress(updated);

                localStorage.setItem(
                  `reading-progress-${params.id}`,
                  updated.toString()
                );
              }}
              className="px-6 py-3 bg-[#3d2b1f] text-white rounded-xl"
            >
              Save Progress
            </button>

            <button
              onClick={() => {

                setProgress(0);

                localStorage.removeItem(
                  `reading-progress-${params.id}`
                );
              }}
              className="px-6 py-3 border border-black/10 rounded-xl"
            >
              Reset
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}