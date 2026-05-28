// ─────────────────────────────────────────────────────────────────────────────
// src/lib/books/transform.ts
// Maps raw Google Books API volumes → clean frontend Book objects
// ─────────────────────────────────────────────────────────────────────────────

import type { Book, GoogleBooksVolume } from "@/types/books";

/**
 * Google serves cover images over HTTP. Upgrade to HTTPS and optionally
 * request a larger zoom level for better quality.
 */
function normaliseCoverUrl(
  imageLinks: GoogleBooksVolume["volumeInfo"]["imageLinks"],
  zoom = 1
): string | null {
  const raw =
    imageLinks?.large ??
    imageLinks?.medium ??
    imageLinks?.small ??
    imageLinks?.thumbnail ??
    imageLinks?.smallThumbnail;

  if (!raw) return null;

  // Force HTTPS and strip the zoom param so we can set our own
  const url = raw.replace(/^http:\/\//, "https://").replace(/&zoom=\d+/, "");
  return `${url}&zoom=${zoom}`;
}

/**
 * Extract ISBN-10 and ISBN-13 from the industry identifiers array.
 */
function extractIsbns(
  identifiers: GoogleBooksVolume["volumeInfo"]["industryIdentifiers"]
): { isbn10: string | null; isbn13: string | null } {
  const isbn10 =
    identifiers?.find((id) => id.type === "ISBN_10")?.identifier ?? null;
  const isbn13 =
    identifiers?.find((id) => id.type === "ISBN_13")?.identifier ?? null;
  return { isbn10, isbn13 };
}

/**
 * Strip HTML tags from the description Google Books sometimes includes.
 */
function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").trim() || null;
}

/**
 * Transform a single Google Books volume into the clean `Book` shape.
 */
export function transformVolume(volume: GoogleBooksVolume): Book {
  const v = volume.volumeInfo;
  const sale = volume.saleInfo;
  const { isbn10, isbn13 } = extractIsbns(v.industryIdentifiers);

  return {
    id: volume.id,
    title: v.title ?? "Unknown Title",
    subtitle: v.subtitle ?? null,
    authors: v.authors ?? [],
    coverUrl: normaliseCoverUrl(v.imageLinks),
    description: stripHtml(v.description),
    snippet: volume.searchInfo?.textSnippet
      ? stripHtml(volume.searchInfo.textSnippet)
      : null,
    publisher: v.publisher ?? null,
    publishedDate: v.publishedDate ?? null,
    pageCount: v.pageCount ?? null,
    categories: v.categories ?? [],
    language: v.language ?? null,
    averageRating: v.averageRating ?? null,
    ratingsCount: v.ratingsCount ?? null,
    isbn10,
    isbn13,
    previewLink: v.previewLink ?? null,
    infoLink: v.infoLink ?? null,
    isEbook: sale?.isEbook ?? false,
    saleability: sale?.saleability ?? null,
    listPrice: sale?.listPrice
      ? { amount: sale.listPrice.amount, currency: sale.listPrice.currencyCode }
      : null,
    retailPrice: sale?.retailPrice
      ? {
          amount: sale.retailPrice.amount,
          currency: sale.retailPrice.currencyCode,
        }
      : null,
    buyLink: sale?.buyLink ?? null,
  };
}

/**
 * Transform an array of volumes, filtering out any that are missing a title.
 */
export function transformVolumes(volumes: GoogleBooksVolume[]): Book[] {
  return volumes
    .filter((v) => v.volumeInfo?.title)
    .map(transformVolume);
}