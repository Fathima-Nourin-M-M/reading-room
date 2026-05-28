// ─────────────────────────────────────────────────────────────────────────────
// src/lib/books/use-book-search.ts
// Frontend data-fetching layer aligned with the architecture diagram:
//   Browser → React Query cache → /api/search → Google Books API
//
// Usage:
//   import { useBookSearch, usePrefetchBookSearch } from "@/lib/books/use-book-search";
//
// Requires: @tanstack/react-query (already referenced in the arch diagram)
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import {
  useQuery,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { ApiError, BookSearchParams, BookSearchResult } from "@/types/books";

// ── Low-level fetch function ──────────────────────────────────────────────────

export interface FetchBooksOptions
  extends Omit<BookSearchParams, "freeEbooks"> {
  freeEbooks?: boolean;
}

/**
 * Fetch books from the internal /api/search route.
 * Throws on non-2xx so React Query marks the query as errored.
 */
export async function fetchBooks(
  params: FetchBooksOptions
): Promise<BookSearchResult> {
  const searchParams = new URLSearchParams({ q: params.query });

  if (params.type) searchParams.set("type", params.type);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.pageSize != null) searchParams.set("pageSize", String(params.pageSize));
  if (params.langRestrict) searchParams.set("lang", params.langRestrict);
  if (params.freeEbooks) searchParams.set("freeEbooks", "true");

  const response = await fetch(`/api/search?${searchParams.toString()}`, {
    // Leverage the browser's HTTP cache for identical requests
    cache: "default",
  });

  if (!response.ok) {
    const body: ApiError = await response.json().catch(() => ({
      error: "Unknown error",
      code: response.status,
    }));
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<BookSearchResult>;
}

// ── Query key factory ─────────────────────────────────────────────────────────

export const bookKeys = {
  all: ["books"] as const,
  searches: () => [...bookKeys.all, "search"] as const,
  search: (params: FetchBooksOptions) =>
    [...bookKeys.searches(), params] as const,
};

// ── React Query hook ──────────────────────────────────────────────────────────

export interface UseBookSearchOptions extends FetchBooksOptions {
  /** Set to false to disable the query (e.g. while the user is still typing) */
  enabled?: boolean;
}

/**
 * Hook to search books with loading / error / success states.
 *
 * Features:
 * - Keeps previous data visible while fetching the next page (no flash)
 * - Deduplicates in-flight requests via React Query
 * - Results cached for 5 minutes (staleTime)
 *
 * @example
 * const { data, isLoading, isError, error } = useBookSearch({
 *   query: "dune",
 *   type: "title",
 *   page: 0,
 *   pageSize: 20,
 * });
 */
export function useBookSearch(
  options: UseBookSearchOptions
): UseQueryResult<BookSearchResult, Error> {
  const { enabled = true, ...params } = options;

  return useQuery<BookSearchResult, Error>({
    queryKey: bookKeys.search(params),
    queryFn: () => fetchBooks(params),
    enabled: enabled && params.query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 min — matches server Cache-Control
    gcTime: 10 * 60 * 1000,   // 10 min — keep unused data a bit longer
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error.message.startsWith("HTTP 4")) return false;
      return failureCount < 2;
    },
  });
}

// ── Prefetch helper (for RSC / server components) ─────────────────────────────

/**
 * Prefetch a book search into the React Query cache from a Server Component.
 * Pass the returned dehydrated state to `<HydrationBoundary>`.
 *
 * @example — in a Server Component (page.tsx):
 * const queryClient = new QueryClient();
 * await prefetchBookSearch(queryClient, { query: "tolkien", type: "author" });
 * const dehydrated = dehydrate(queryClient);
 * // then: <HydrationBoundary state={dehydrated}> … </HydrationBoundary>
 */
export async function prefetchBookSearch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryClient: any,
  params: FetchBooksOptions
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: bookKeys.search(params),
    queryFn: () => fetchBooks(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Imperative helper ─────────────────────────────────────────────────────────

/**
 * Prefetch the next page into the cache so pagination feels instant.
 * Call this when the user hovers a "Next page" button.
 *
 * @example
 * const prefetch = usePrefetchNextPage({ query, type, page, pageSize });
 * <button onMouseEnter={prefetch}>Next →</button>
 */
export function usePrefetchNextPage(
  params: FetchBooksOptions
): () => void {
  const queryClient = useQueryClient();
  return () => {
    const nextParams = { ...params, page: (params.page ?? 0) + 1 };
    queryClient.prefetchQuery({
      queryKey: bookKeys.search(nextParams),
      queryFn: () => fetchBooks(nextParams),
      staleTime: 5 * 60 * 1000,
    });
  };
}