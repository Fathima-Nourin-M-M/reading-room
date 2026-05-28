export interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string }[];
  subjects: string[];
  formats: Record<string, string>;
}

export interface GutendexReadingOptions {
  pdfUrl?: string;
  epubUrl?: string;
  htmlUrl?: string;
  plainTextUrl?: string;
  kindleUrl?: string;
  coverUrl?: string;
}

export function extractGutendexReadingOptions(
  book: GutendexBook
): GutendexReadingOptions {
  const formats = book.formats || {};

  return {
    pdfUrl: formats["application/pdf"],
    epubUrl: formats["application/epub+zip"],
    htmlUrl: formats["text/html"],
    plainTextUrl: formats["text/plain; charset=utf-8"] ?? formats["text/plain"],
    kindleUrl: formats["application/x-mobipocket-ebook"],
    coverUrl: formats["image/jpeg"],
  };
}

export function gutendexHasReadableContent(
  options: GutendexReadingOptions
): boolean {
  return Boolean(
    options.pdfUrl ||
      options.epubUrl ||
      options.htmlUrl ||
      options.plainTextUrl ||
      options.kindleUrl
  );
}

export async function fetchGutendexBook(
  id: string
): Promise<GutendexBook | null> {
  try {
    const response = await fetch(
      `https://gutendex.com/books/${encodeURIComponent(id)}`
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as GutendexBook;
  } catch {
    return null;
  }
}
