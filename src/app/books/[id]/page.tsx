import Link from "next/link";

import BookDetailActions from "@/components/BookDetailActions";
import BookPageCommunity from "@/components/BookPageCommunity";
import { transformVolume } from "@/lib/books/transform";
import type { GoogleBooksVolume } from "@/types/books";

interface BookPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getBook(id: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${process.env.GOOGLE_BOOKS_API_KEY}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<GoogleBooksVolume>;
  } catch (error) {
    console.error("Book fetch error:", error);
    return null;
  }
}

export default async function BookPage({
  params,
}: BookPageProps) {
  const { id } = await params;
  const volume = await getBook(id);

  if (!volume?.volumeInfo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde] px-4">
        <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-center">
          <h1 className="font-serif text-3xl text-[#2d1e15]">
            Book not found
          </h1>
          <p className="mt-2 text-sm text-[#6f5241]">
            We could not load this book right now.
          </p>
          <Link
            href="/store"
            className="mt-4 inline-flex rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]"
          >
            Back to store
          </Link>
        </div>
      </main>
    );
  }

  const book = transformVolume(volume);
  const info = volume.volumeInfo;
  const category =
  info.categories?.[0] || "fiction";

const recommendationsResponse =
  await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(category)}&maxResults=6&key=${process.env.GOOGLE_BOOKS_API_KEY}`,
    {
      cache: "no-store",
    }
  );

const recommendationsData =
  await recommendationsResponse.json();

const recommendations =
  recommendationsData.items || [];
  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-14">
        <div className="rounded-[1.75rem] border border-[#d7b590]/60 bg-[#fff7ee]/70 p-4 shadow-[0_20px_48px_rgba(74,43,22,0.11)]">
          <img
            src={
              book.coverUrl ||
              "https://placehold.co/600x900"
            }
            alt={book.title}
            className="w-full rounded-[1.25rem] border border-[#e2c6a7] object-cover"
          />
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#986543]">
              Literary Collection
            </p>

            <h1 className="font-serif text-4xl leading-tight text-[#2d1e15] md:text-5xl">
              {book.title}
            </h1>

            {book.authors.length > 0 && (
              <p className="mt-3 text-lg text-[#6b4d3a] md:text-xl">
                by {book.authors.join(", ")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#4b3124] px-3 py-1 text-xs text-[#f7ead8]">
              {book.isEbook ? "ebook" : "physical"}
            </span>
          </div>

          {/* RATINGS */}
          {info.averageRating && (
            <div className="flex items-center gap-3">
              <div className="text-amber-500 text-lg">
                ★ {info.averageRating}
              </div>

              <span className="text-sm text-slate-500">
                ({info.ratingsCount || 0} ratings)
              </span>
            </div>
          )}

          {/* CATEGORIES */}
          {info.categories && (
            <div className="flex flex-wrap gap-2">
              {info.categories.map((category: string) => (
                <span
                  key={category}
                  className="px-3 py-1 bg-orange-100 text-[#a35e36] rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* DESCRIPTION */}
          {info.description && (
            <div
              className="prose prose-stone max-w-none text-[#3d2b1f]"
              dangerouslySetInnerHTML={{
                __html: info.description,
              }}
            />
          )}

          <BookDetailActions
            book={{
              id: book.id,
              title: book.title,
              authors: book.authors,
              coverUrl: book.coverUrl,
              isEbook: book.isEbook,
              retailPrice: book.retailPrice,
              listPrice: book.listPrice,
            }}
          />

          {/* EXTRA INFO */}
          <div className="pt-8 border-t border-orange-100 grid grid-cols-2 gap-6 text-sm">
            {info.publisher && (
              <div>
                <p className="font-semibold text-[#2d1e15]">
                  Publisher
                </p>

                <p className="text-slate-600">
                  {info.publisher}
                </p>
              </div>
            )}

            {info.publishedDate && (
              <div>
                <p className="font-semibold text-[#2d1e15]">
                  Published
                </p>

                <p className="text-slate-600">
                  {info.publishedDate}
                </p>
              </div>
            )}

            {info.pageCount && (
              <div>
                <p className="font-semibold text-[#2d1e15]">
                  Pages
                </p>

                <p className="text-slate-600">
                  {info.pageCount}
                </p>
              </div>
            )}

            {info.language && (
              <div>
                <p className="font-semibold text-[#2d1e15]">
                  Language
                </p>

                <p className="text-slate-600 uppercase">
                  {info.language}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* RECOMMENDATIONS */}
<section className="mt-24">
  <div className="max-w-7xl mx-auto">

    <div className="mb-10">
      <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#c2784e] mb-3">
        Curated Discovery
      </p>

      <h2 className="text-4xl font-serif text-[#2d1e15]">
        Readers Also Explore
      </h2>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {recommendations.map((item: any) => (
        <Link
          key={item.id}
          href={`/books/${item.id}`}
          className="group"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-orange-100 hover:-translate-y-1 hover:shadow-xl transition">

            <img
              src={
                (
                  item.volumeInfo.imageLinks
                    ?.thumbnail ||
                  item.volumeInfo.imageLinks
                    ?.smallThumbnail
                )?.replace(
                  "http://",
                  "https://"
                ) ||
                "https://placehold.co/300x450"
              }
              alt={item.volumeInfo.title}
              className="w-full aspect-[3/4] object-cover"
            />

            <div className="p-4">
              <h3 className="font-serif text-[#2d1e15] line-clamp-2">
                {item.volumeInfo.title}
              </h3>

              <p className="text-sm text-slate-500 mt-2 line-clamp-1">
                {item.volumeInfo.authors?.join(
                  ", "
                )}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
</section>

      <BookPageCommunity
        bookId={book.id}
        title={book.title}
        isPublicDomain={
          volume.accessInfo?.publicDomain === true
        }
      />
    </main>
  );
}