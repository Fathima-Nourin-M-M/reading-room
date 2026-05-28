import type { Book } from "@/types/books";

export type CatalogProductType = "ebook" | "physical";

export interface ResolvedPrice {
  priceInr: number;
  priceLabel: string;
  priceIsEstimate: boolean;
}

const USD_TO_INR = 83;

function hashId(id: string): number {
  let hash = 0;

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

export function fallbackPriceInr(
  id: string,
  productType: CatalogProductType
): number {
  const hash = hashId(id);

  if (productType === "ebook") {
    return 99 + (hash % 201);
  }

  return 399 + (hash % 601);
}

export function resolveProductType(book: Book): CatalogProductType {
  if (book.isEbook) {
    return "ebook";
  }

  if (book.saleability === "FREE") {
    return "ebook";
  }

  return "physical";
}

export function resolveCatalogPrice(
  book: Book,
  productType?: CatalogProductType
): ResolvedPrice {
  const type = productType ?? resolveProductType(book);
  const apiAmount =
    book.retailPrice?.amount ?? book.listPrice?.amount;

  if (apiAmount != null) {
    const currency =
      book.retailPrice?.currency ??
      book.listPrice?.currency ??
      "INR";

    let priceInr = Math.round(apiAmount);

    if (currency === "USD") {
      priceInr = Math.round(apiAmount * USD_TO_INR);
    }

    priceInr = Math.max(priceInr, type === "ebook" ? 99 : 399);

    return {
      priceInr,
      priceLabel: `₹${priceInr.toLocaleString("en-IN")}`,
      priceIsEstimate: false,
    };
  }

  const priceInr = fallbackPriceInr(book.id, type);

  return {
    priceInr,
    priceLabel: `₹${priceInr.toLocaleString("en-IN")}`,
    priceIsEstimate: true,
  };
}

export function parsePriceInr(
  value: string | number | undefined | null
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return 0;
}

export function formatInrPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
