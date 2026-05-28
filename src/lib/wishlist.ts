export type WishlistSource =
  | "google"
  | "store"
  | "marketplace";

export interface WishlistItem {
  id: string;
  title: string;
  authors: string[];
  image: string;
  price?: string;
  condition?: string;
  source: WishlistSource;
  productType: "ebook" | "physical" | "unknown";
}

const STORAGE_KEY = "wishlist";

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function isInWishlist(id: string): boolean {
  return getWishlist().some((item) => item.id === id);
}

export function addToWishlist(item: WishlistItem): WishlistItem[] {
  const existing = getWishlist();

  if (existing.some((entry) => entry.id === item.id)) {
    return existing;
  }

  const updated = [...existing, item];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  return updated;
}

export function removeFromWishlist(id: string): WishlistItem[] {
  const updated = getWishlist().filter(
    (item) => item.id !== id
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  return updated;
}

export function getWishlistHref(item: WishlistItem): string {
  if (item.source === "google") {
    return `/books/${item.id}`;
  }

  if (item.source === "store") {
    return `/store/${item.id}`;
  }

  return `/marketplace/${item.id}`;
}
