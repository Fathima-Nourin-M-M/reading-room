// ─────────────────────────────────────────────────────────────────────────────
// src/lib/books/search.ts
// Service layer: orchestrates fetch → transform → paginate
// ─────────────────────────────────────────────────────────────────────────────

import type { BookSearchParams, BookSearchResult } from "@/types/books";
import { fetchVolumes, GoogleBooksError } from "./google-books-client";
import { transformVolumes } from "./transform";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Search Google Books and return a clean, paginated result.
 *
 * @throws {GoogleBooksError} on API / network failures
 */
export async function searchBooks(
  params: BookSearchParams
): Promise<BookSearchResult> {
  const pageSize = Math.min(Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE), 40);
  const page = Math.max(0, params.page ?? 0);

  const raw = await fetchVolumes({ ...params, page, pageSize });

  const books = transformVolumes(raw.items ?? []);
  const totalItems = raw.totalItems ?? 0;

  return {
    books,
    totalItems,
    page,
    pageSize,
    hasMore: (page + 1) * pageSize < totalItems,
  };
}

export { GoogleBooksError };