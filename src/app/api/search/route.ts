// ─────────────────────────────────────────────────────────────────────────────
// src/app/api/search/route.ts
// GET /api/search
//
// Query parameters:
//   q           string   required  — search query
//   type        string   optional  — "title" | "isbn" | "author" | "keyword"
//                                    defaults to "keyword"
//   page        number   optional  — 0-based page index (default 0)
//   pageSize    number   optional  — results per page, 1–40 (default 20)
//   lang        string   optional  — ISO 639-1 language code, e.g. "en"
//   freeEbooks  boolean  optional  — "true" to restrict to free Google eBooks
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { searchBooks, GoogleBooksError } from "@/lib/books";
import type { ApiError, BookSearchResult, SearchType } from "@/types/books";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_TYPES: SearchType[] = ["title", "isbn", "author", "keyword"];

function isValidSearchType(value: string): value is SearchType {
  return VALID_TYPES.includes(value as SearchType);
}

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max?: number
): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 0) return fallback;
  return max !== undefined ? Math.min(n, max) : n;
}

function errorResponse(
  message: string,
  status: number,
  details?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}), code: status },
    { status }
  );
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest
): Promise<NextResponse<BookSearchResult | ApiError>> {
  const { searchParams } = request.nextUrl;

  // ── Validate query ─────────────────────────────────────────────────────────
  const query = searchParams.get("q")?.trim();
  if (!query) {
    return errorResponse(
      "Missing required parameter: q",
      400,
      "Provide a search query via ?q=<your+query>"
    );
  }
  if (query.length < 2) {
    return errorResponse("Query too short", 400, "Minimum query length is 2 characters");
  }
  if (query.length > 200) {
    return errorResponse("Query too long", 400, "Maximum query length is 200 characters");
  }

  // ── Parse & validate type ──────────────────────────────────────────────────
  const rawType = searchParams.get("type") ?? "keyword";
  if (!isValidSearchType(rawType)) {
    return errorResponse(
      `Invalid type: "${rawType}"`,
      400,
      `Allowed values: ${VALID_TYPES.join(", ")}`
    );
  }

  // ── Parse optional parameters ──────────────────────────────────────────────
  const page = parsePositiveInt(searchParams.get("page"), 0);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 20, 40);
  const langRestrict = searchParams.get("lang") ?? undefined;
  const freeEbooks = searchParams.get("freeEbooks") === "true";

  // ── Fetch & transform ──────────────────────────────────────────────────────
  try {
    const result = await searchBooks({
      query,
      type: rawType,
      page,
      pageSize,
      langRestrict,
      freeEbooks,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // Cache at the CDN edge for 5 minutes; stale-while-revalidate for 10
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    if (err instanceof GoogleBooksError) {
      // Pass upstream status codes through (429 rate-limit, 403 quota, etc.)
      const status = err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 502;
      return errorResponse(
        "Upstream API error",
        status,
        process.env.NODE_ENV === "development" ? err.details : undefined
      );
    }

    // Unexpected error — log on the server, return a generic 500
    console.error("[/api/search] Unhandled error:", err);
    return errorResponse(
      "Internal server error",
      500,
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : undefined
    );
  }
}

// Tell Next.js this route is always dynamic (query params vary per request)
export const dynamic = "force-dynamic";