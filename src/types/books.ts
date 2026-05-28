// ─────────────────────────────────────────────────────────────────────────────
// src/types/books.ts
// Clean frontend-facing types + raw Google Books API shapes
// ─────────────────────────────────────────────────────────────────────────────

// ── Raw Google Books API ─────────────────────────────────────────────────────

export interface GoogleBooksApiResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface GoogleBooksVolume {
  kind: string;
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: GoogleBooksVolumeInfo;
  saleInfo?: GoogleBooksSaleInfo;
  accessInfo?: GoogleBooksAccessInfo;
  searchInfo?: { textSnippet?: string };
}

export interface GoogleBooksVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{
    type: "ISBN_10" | "ISBN_13" | "ISSN" | "OTHER";
    identifier: string;
  }>;
  readingModes?: { text: boolean; image: boolean };
  pageCount?: number;
  printType?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBooksSaleInfo {
  country?: string;
  saleability?: "FOR_SALE" | "FREE" | "NOT_FOR_SALE" | "FOR_PREORDER";
  isEbook?: boolean;
  listPrice?: { amount: number; currencyCode: string };
  retailPrice?: { amount: number; currencyCode: string };
  buyLink?: string;
}

export interface GoogleBooksAccessInfo {
  country?: string;
  viewability?: string;
  embeddable?: boolean;
  publicDomain?: boolean;
  textToSpeechPermission?: string;
  epub?: { isAvailable: boolean; downloadLink?: string };
  pdf?: { isAvailable: boolean; downloadLink?: string };
  webReaderLink?: string;
  accessViewStatus?: string;
  quoteSharingAllowed?: boolean;
}

// ── Clean Frontend Model ──────────────────────────────────────────────────────

export interface Book {
  /** Google Books volume ID */
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  /** Best available cover image URL (HTTPS-upgraded) */
  coverUrl: string | null;
  description: string | null;
  /** Plain-text snippet from search results */
  snippet: string | null;
  publisher: string | null;
  /** ISO date string, e.g. "2023-04-15" or partial "2023" */
  publishedDate: string | null;
  pageCount: number | null;
  categories: string[];
  language: string | null;
  averageRating: number | null;
  ratingsCount: number | null;
  isbn10: string | null;
  isbn13: string | null;
  previewLink: string | null;
  infoLink: string | null;
  isEbook: boolean;
  saleability: GoogleBooksSaleInfo["saleability"] | null;
  listPrice: { amount: number; currency: string } | null;
  retailPrice: { amount: number; currency: string } | null;
  buyLink: string | null;
}

// ── Search API ────────────────────────────────────────────────────────────────

export type SearchType = "title" | "isbn" | "author" | "keyword";

export interface BookSearchParams {
  query: string;
  type?: SearchType;
  /** 0-based page index */
  page?: number;
  /** Max results per page (1–40) */
  pageSize?: number;
  /** ISO 639-1 language code filter, e.g. "en" */
  langRestrict?: string;
  /** Filter to only free Google eBooks */
  freeEbooks?: boolean;
}

export interface BookSearchResult {
  books: Book[];
  totalItems: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
  code?: number;
}