export interface LiteraryList {
  id: string;

  title: string;

  description: string;

  creator: string;

  tags: string[];

  books: {
    id: string;
    title: string;
    image?: string;
    authors?: string[];
  }[];

  createdAt: string;
}