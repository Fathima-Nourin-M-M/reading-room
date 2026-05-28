"use client";

import Link from "next/link";

import CommunityShelfPanel from "@/components/CommunityShelfPanel";
import RecentCommunityReviews from "@/components/RecentCommunityReviews";

interface BookPageCommunityProps {
  bookId: string;
  title: string;
  isPublicDomain?: boolean;
}

export default function BookPageCommunity({
  bookId,
  title,
  isPublicDomain,
}: BookPageCommunityProps) {
  return (
    <div className="mx-auto mt-20 max-w-7xl space-y-12 border-t border-[#d9b996]/45 pt-14">
      <section className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-6 md:p-8">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
          Reading access
        </p>
        <h2 className="font-serif text-2xl text-[#2b1c14]">
          Open this title
        </h2>
        <p className="mt-2 text-sm text-[#614737]">
          {isPublicDomain
            ? "This may be available as a public-domain edition or Google Books preview."
            : "Preview or purchase options are available through Google Books."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/read/${bookId}?source=google`}
            className="rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]"
          >
            Reading options
          </Link>
          <Link
            href="/discover"
            className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-5 py-2 text-sm font-medium text-[#583a2a]"
          >
            Public domain shelf
          </Link>
        </div>
      </section>

      <RecentCommunityReviews title="Community voices" />
      <CommunityShelfPanel />
    </div>
  );
}
