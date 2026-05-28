"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LiteraryList {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

interface CommunityShelfPanelProps {
  limit?: number;
  className?: string;
}

export default function CommunityShelfPanel({
  limit = 3,
  className = "",
}: CommunityShelfPanelProps) {
  const [lists, setLists] = useState<LiteraryList[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("literaryLists") || "[]"
      );
      setLists(Array.isArray(stored) ? stored.slice(0, limit) : []);
    } catch {
      setLists([]);
    }
  }, [limit]);

  return (
    <section
      className={`rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-6 md:p-8 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
            Community shelves
          </p>
          <h2 className="font-serif text-2xl text-[#2b1c14]">
            Literary lists from readers
          </h2>
        </div>
        <Link
          href="/lists"
          className="text-sm text-[#7d5134] underline-offset-2 hover:underline"
        >
          Browse lists
        </Link>
      </div>

      {lists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {lists.map((list, index) => (
            <Link
              key={list.id || index}
              href={list.id ? `/lists/${list.id}` : "/lists"}
              className="rounded-2xl border border-[#dab995]/50 bg-[#fff8ef] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#9c6b49]">
                {list.tags?.[0] || "Curated"}
              </p>
              <h3 className="mt-2 font-serif text-lg text-[#2b1c14]">
                {list.title || "Untitled list"}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs text-[#614737]">
                {list.description || "A reader-curated shelf."}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#614737]">
          No lists in your browser yet.{" "}
          <Link
            href="/lists/create"
            className="font-medium text-[#7d5134] underline-offset-2 hover:underline"
          >
            Create one
          </Link>{" "}
          or explore{" "}
          <Link
            href="/lists"
            className="font-medium text-[#7d5134] underline-offset-2 hover:underline"
          >
            community lists
          </Link>
          .
        </p>
      )}
    </section>
  );
}
