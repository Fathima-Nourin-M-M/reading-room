// ─────────────────────────────────────────────────────────────────────────────
// src/components/BookSearch.tsx
// Example consumer component — demonstrates the full search UX:
//   - Title / ISBN / Author / Keyword toggle
//   - Debounced input
//   - Loading skeleton
//   - Error state with retry
//   - Pagination with next-page prefetch
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback, useRef } from "react";
import {
  useBookSearch,
  usePrefetchNextPage,
} from "@/lib/books/use-book-search";
import type { Book, SearchType } from "@/types/books";

// ── Small utilities ───────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = useCallback(
    (v: T) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDebounced(v), delay);
    },
    [delay]
  );

  // Sync on value change
  if (value !== debounced) update(value);

  return debounced;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BookCard({ book }: { book: Book }) {
  return (
    <article className="flex gap-4 rounded-lg border border-gray-200 p-4 shadow-sm transition hover:shadow-md">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
          className="h-32 w-24 flex-shrink-0 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-32 w-24 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
          No cover
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="truncate text-base font-semibold text-gray-900">
          {book.title}
          {book.subtitle && (
            <span className="ml-1 font-normal text-gray-500">
              : {book.subtitle}
            </span>
          )}
        </h3>

        {book.authors.length > 0 && (
          <p className="text-sm text-gray-600">
            {book.authors.join(", ")}
          </p>
        )}

        {book.publishedDate && (
          <p className="text-xs text-gray-400">{book.publishedDate}</p>
        )}

        {book.description && (
          <p className="mt-1 line-clamp-3 text-sm text-gray-700">
            {book.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {book.isbn13 && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
              ISBN {book.isbn13}
            </span>
          )}
          {book.averageRating && (
            <span className="text-xs text-yellow-600">
              ★ {book.averageRating.toFixed(1)}
              {book.ratingsCount ? ` (${book.ratingsCount.toLocaleString()})` : ""}
            </span>
          )}
          {book.previewLink && (
            <a
              href={book.previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Preview ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse gap-4 rounded-lg border border-gray-200 p-4">
      <div className="h-32 w-24 flex-shrink-0 rounded bg-gray-200" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "keyword", label: "Keyword" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "isbn", label: "ISBN" },
];

// ── Main Component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function BookSearch() {
  const [rawQuery, setRawQuery] = useState("");
  const [type, setType] = useState<SearchType>("keyword");
  const [page, setPage] = useState(0);

  // Debounce the query so we don't fire on every keystroke
  const query = useDebounce(rawQuery, 400);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useBookSearch({ query, type, page, pageSize: PAGE_SIZE });

  const prefetchNext = usePrefetchNextPage({
    query,
    type,
    page,
    pageSize: PAGE_SIZE,
  });

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawQuery(e.target.value);
    setPage(0); // reset pagination on new search
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* ── Search controls ── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {SEARCH_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setType(t.value); setPage(0); }}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                type === t.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={rawQuery}
          onChange={handleQueryChange}
          placeholder={
            type === "isbn"
              ? "Enter ISBN-10 or ISBN-13…"
              : `Search by ${type}…`
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* ── Results ── */}
      {query.length >= 2 && (
        <>
          {/* Status bar */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            {data ? (
              <span>
                {data.totalItems.toLocaleString()} result
                {data.totalItems !== 1 ? "s" : ""}
                {isFetching && !isLoading ? " · updating…" : ""}
              </span>
            ) : isLoading ? (
              <span>Searching…</span>
            ) : null}
          </div>

          {/* Error */}
          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Search failed</p>
              <p className="mt-1 text-red-500">{error?.message}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Book list */}
          {data && !isLoading && (
            <>
              {data.books.length === 0 ? (
                <p className="py-8 text-center text-gray-400">
                  No books found for &ldquo;{query}&rdquo;.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(page > 0 || data.hasMore) && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <span className="text-sm text-gray-500">Page {page + 1}</span>

                  <button
                    disabled={!data.hasMore}
                    onClick={() => setPage((p) => p + 1)}
                    onMouseEnter={prefetchNext}
                    className="rounded px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}