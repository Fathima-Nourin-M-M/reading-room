// ─────────────────────────────────────────────────────────────────────────────
// src/lib/books/google-books-client.ts
// Thin, typed wrapper around the Google Books Volumes API.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BookSearchParams,
  GoogleBooksApiResponse,
  SearchType,
} from "@/types/books";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 40;

// ── Query Builder ─────────────────────────────────────────────────────────────

/**
 * Convert our generic search params into the Google Books `q` query string.
 *
 * Google Books search operators:
 *   intitle:   — search in title
 *   inauthor:  — search in author
 *   isbn:      — search by ISBN
 *   (none)     — full-text keyword search
 */
function buildQuery(query: string, type: SearchType): string {
  const q = query.trim();
  switch (type) {
    case "isbn":
      // Strip common separators (hyphens, spaces) from ISBNs
      return `isbn:${q.replace(/[-\s]/g, "")}`;
    case "title":
      return `intitle:${q}`;
    case "author":
      return `inauthor:${q}`;
    case "keyword":
    default:
      return q;
  }
}

// ── URL Builder ───────────────────────────────────────────────────────────────

export function buildSearchUrl(params: BookSearchParams): string {
  const {
    query,
    type = "keyword",
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    langRestrict,
    freeEbooks,
  } = params;

  const clampedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const startIndex = page * clampedPageSize;

  const searchParams = new URLSearchParams({
    q: buildQuery(query, type),
    startIndex: startIndex.toString(),
    maxResults: clampedPageSize.toString(),
    printType: "books",
  });

  if (langRestrict) searchParams.set("langRestrict", langRestrict);
  if (freeEbooks) searchParams.set("filter", "free-ebooks");

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) searchParams.set("key", apiKey);

  return `${BASE_URL}?${searchParams.toString()}`;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export class GoogleBooksError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: string
  ) {
    super(message);
    this.name = "GoogleBooksError";
  }
}

/**
 * Fetch volumes from the Google Books API.
 * Throws `GoogleBooksError` on non-2xx responses or network failures.
 */
export async function fetchVolumes(
  params: BookSearchParams
): Promise<GoogleBooksApiResponse> {
  const url = buildSearchUrl(params);

  let response: Response;
  try {
    response = await fetch(url, {
      // Next.js fetch extensions: revalidate every 5 minutes server-side
      next: { revalidate: 300 },
    });
  } catch (cause) {
    throw new GoogleBooksError(
      "Network error reaching Google Books API",
      503,
      cause instanceof Error ? cause.message : String(cause)
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new GoogleBooksError(
      `Google Books API returned ${response.status}`,
      response.status,
      body.slice(0, 400) // avoid leaking huge error bodies
    );
  }

  const data: GoogleBooksApiResponse = await response.json();
  return data;
}