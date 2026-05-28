export type LibrarySource =
  | "gutendex"
  | "purchase"
  | "google"
  | "store"
  | "marketplace"
  | string;

export interface LibraryItemRef {
  book_id: string;
  source: LibrarySource;
}

export function resolveLibraryReadHref(
  item: LibraryItemRef
): string {
  const source = String(item.source || "").toLowerCase();
  const id = encodeURIComponent(item.book_id);

  if (source === "gutendex") {
    return `/read/${id}?source=gutendex`;
  }

  if (source === "google") {
    return `/read/${id}?source=google`;
  }

  if (source === "marketplace") {
    return `/read/${id}?source=marketplace`;
  }

  return `/read/${id}`;
}

export function librarySourceLabel(source: string): string {
  const map: Record<string, string> = {
    gutendex: "Public domain",
    purchase: "Purchased",
    google: "Google Books",
    store: "Store",
    marketplace: "Marketplace",
  };

  return map[source.toLowerCase()] || source;
}
