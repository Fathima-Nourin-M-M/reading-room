import { fetchBooks } from "@/lib/books/use-book-search";
import {
  resolveCatalogPrice,
  resolveProductType,
  type CatalogProductType,
} from "@/lib/catalogPricing";
import type { Book } from "@/types/books";

export interface CatalogProduct {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string;
  description: string;
  categories: string[];
  productType: CatalogProductType;
  priceInr: number;
  priceLabel: string;
  priceIsEstimate: boolean;
  snippet: string | null;
  shelf: string;
}

export const STORE_SHELF_QUERIES = [
  { query: "literary fiction", shelf: "Literature" },
  { query: "fiction bestsellers", shelf: "Fiction" },
  { query: "classic literature", shelf: "Classics" },
  { query: "philosophy books", shelf: "Philosophy" },
  { query: "fantasy novels", shelf: "Fantasy" },
  { query: "dark academia novels", shelf: "Dark Academia" },
  { query: "mystery thriller books", shelf: "Mystery" },
  { query: "romance fiction", shelf: "Romance" },
  { query: "science fiction novels", shelf: "Science Fiction" },
  { query: "poetry anthology", shelf: "Poetry" },
] as const;

const PAGES_PER_SHELF = [0, 1];
const BOOKS_PER_REQUEST = 24;

export function bookToCatalogProduct(
  book: Book,
  shelf = "Catalog"
): CatalogProduct {
  const productType = resolveProductType(book);
  const pricing = resolveCatalogPrice(book, productType);

  return {
    id: book.id,
    title: book.title,
    authors: book.authors.length > 0 ? book.authors : ["Unknown author"],
    coverUrl:
      book.coverUrl || "https://placehold.co/300x450",
    description:
      book.description ||
      book.snippet ||
      "A curated literary title from The Reading Room catalog.",
    categories:
      book.categories.length > 0
        ? book.categories
        : [shelf],
    productType,
    priceInr: pricing.priceInr,
    priceLabel: pricing.priceLabel,
    priceIsEstimate: pricing.priceIsEstimate,
    snippet: book.snippet,
    shelf,
  };
}

export async function fetchStoreCatalog(): Promise<CatalogProduct[]> {
  const requests = STORE_SHELF_QUERIES.flatMap((shelf) =>
    PAGES_PER_SHELF.map((page) =>
      fetchBooks({
        query: shelf.query,
        type: "keyword",
        page,
        pageSize: BOOKS_PER_REQUEST,
      }).then((result) => ({
        shelf: shelf.shelf,
        books: result.books,
      }))
    )
  );

  const results = await Promise.allSettled(requests);
  const seen = new Set<string>();
  const products: CatalogProduct[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const book of result.value.books) {
      if (seen.has(book.id)) {
        continue;
      }

      seen.add(book.id);
      products.push(
        bookToCatalogProduct(book, result.value.shelf)
      );
    }
  }

  return products.sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function filterCatalogByFormat(
  products: CatalogProduct[],
  format: "all" | CatalogProductType
): CatalogProduct[] {
  if (format === "all") {
    return products;
  }

  return products.filter(
    (product) => product.productType === format
  );
}

export function splitCatalogByFormat(products: CatalogProduct[]) {
  return {
    ebooks: products.filter(
      (product) => product.productType === "ebook"
    ),
    physical: products.filter(
      (product) => product.productType === "physical"
    ),
  };
}
