export interface Book {
  id: string;

  title: string;

  authors: string[];

  description?: string;

  image?: string;

  isbn?: string;

  publishedDate?: string;

  publisher?: string;

  categories: string[];

  tags: string[];

  formats: (
    | "physical-new"
    | "physical-used"
    | "ebook"
  )[];

  averageRating?: number;

  ratingsCount?: number;

  language?: string;

  pageCount?: number;

  price?: number;

  marketplaceListings?: MarketplaceListing[];

  ebookAvailable?: boolean;
}

export interface MarketplaceListing {
  id: string;

  sellerName: string;

  sellerBio?: string;

  condition:
    | "Like New"
    | "Very Good"
    | "Good"
    | "Acceptable";

  price: number;

  notes?: string;

  createdAt: string;
}