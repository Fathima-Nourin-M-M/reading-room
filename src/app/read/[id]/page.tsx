"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import ReadingFormatChooser, {
  type ReadingFormatLink,
} from "@/components/ReadingFormatChooser";
import {
  extractGutendexReadingOptions,
  fetchGutendexBook,
  gutendexHasReadableContent,
  type GutendexBook,
} from "@/lib/gutendex";
import { transformVolume } from "@/lib/books/transform";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import type { GoogleBooksVolume } from "@/types/books";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ViewState =
  | { status: "loading" }
  | { status: "locked" }
  | { status: "pdf"; title: string; authors: string; pdfUrl: string; sourceLabel: string }
  | {
      status: "chooser";
      title: string;
      authors: string;
      sourceLabel: string;
      links: ReadingFormatLink[];
      hint?: string;
    };

function authorNamesGutendex(book: GutendexBook): string {
  return book.authors?.map((a) => a.name).join(", ") || "";
}

function buildGutendexChooserLinks(
  book: GutendexBook
): ReadingFormatLink[] {
  const options = extractGutendexReadingOptions(book);
  const links: ReadingFormatLink[] = [];

  if (options.htmlUrl) {
    links.push({
      label: "Read online",
      href: options.htmlUrl,
      description: "Open in your browser (Project Gutenberg)",
      external: true,
    });
  }

  if (options.epubUrl) {
    links.push({
      label: "Read EPUB",
      href: options.epubUrl,
      description: "Opens in a new tab",
      external: true,
    });
  }

  if (options.plainTextUrl) {
    links.push({
      label: "Plain text edition",
      href: options.plainTextUrl,
      external: true,
    });
  }

  if (options.kindleUrl) {
    links.push({
      label: "Kindle format",
      href: options.kindleUrl,
      external: true,
    });
  }

  if (options.pdfUrl) {
    links.push({
      label: "Read PDF in app",
      href: `/read/${book.id}?source=gutendex&format=pdf`,
      description: "In-browser PDF reader",
    });
  }

  return links;
}

export default function DynamicReadPage() {
  const params = useParams();
  const { user } = useUser();

  const bookId = String(params.id ?? "");

  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setView({ status: "loading" });

      const query =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const sourceHint = query.get("source");
      const formatHint = query.get("format");

      const tryGutendex = async (): Promise<boolean> => {
        const gutendex = await fetchGutendexBook(bookId);
        if (!gutendex || cancelled) {
          return false;
        }

        const options = extractGutendexReadingOptions(gutendex);
        const authors = authorNamesGutendex(gutendex);
        const wantPdf =
          formatHint === "pdf" ||
          (!formatHint && Boolean(options.pdfUrl));

        if (wantPdf && options.pdfUrl) {
          setView({
            status: "pdf",
            title: gutendex.title,
            authors,
            pdfUrl: options.pdfUrl,
            sourceLabel: "Public domain",
          });
          return true;
        }

        const links = buildGutendexChooserLinks(gutendex);

        if (links.length > 0) {
          setView({
            status: "chooser",
            title: gutendex.title,
            authors,
            sourceLabel: "Public domain · Gutendex",
            links,
            hint: options.pdfUrl
              ? "This classic is available in several formats."
              : "No in-app PDF for this title, but you can still read it online or as EPUB.",
          });
          return true;
        }

        if (!gutendexHasReadableContent(options)) {
          setView({
            status: "chooser",
            title: gutendex.title,
            authors,
            sourceLabel: "Public domain",
            links: [
              {
                label: "Search Project Gutenberg",
                href: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(gutendex.title)}`,
                external: true,
              },
            ],
            hint: "We could not find a direct file link. Try Project Gutenberg search.",
          });
          return true;
        }

        return false;
      };

      const tryGoogle = async (): Promise<boolean> => {
        const response = await fetch(`/api/books/${encodeURIComponent(bookId)}`);
        if (!response.ok) {
          return false;
        }

        const volume = (await response.json()) as GoogleBooksVolume;
        const book = transformVolume(volume);
        const access = volume.accessInfo;
        const links: ReadingFormatLink[] = [];

        if (access?.webReaderLink) {
          links.push({
            label: "Read in Google Books",
            href: access.webReaderLink,
            description: "Web reader",
            external: true,
          });
        }

        if (access?.pdf?.isAvailable && access.pdf.downloadLink) {
          links.push({
            label: "Download PDF sample",
            href: access.pdf.downloadLink,
            external: true,
          });
        }

        if (access?.epub?.isAvailable && access.epub.downloadLink) {
          links.push({
            label: "Download EPUB sample",
            href: access.epub.downloadLink,
            external: true,
          });
        }

        if (book.previewLink) {
          links.push({
            label: "Preview on Google Books",
            href: book.previewLink,
            external: true,
          });
        }

        if (book.infoLink) {
          links.push({
            label: "View book details",
            href: book.infoLink,
            external: true,
          });
        }

        if (book.buyLink) {
          links.push({
            label: "Purchase options",
            href: book.buyLink,
            external: true,
          });
        }

        links.push({
          label: "Open in store search",
          href: `/search?q=${encodeURIComponent(book.title)}`,
        });

        setView({
          status: "chooser",
          title: book.title,
          authors: book.authors.join(", "),
          sourceLabel: access?.publicDomain
            ? "Public domain · Google Books"
            : "Google Books",
          links,
          hint: "Google Books metadata — use preview or purchase links below.",
        });
        return true;
      };

      const tryMarketplaceListing = async (): Promise<boolean> => {
        const { data: listing } = await supabase
          .from("listings")
          .select("*")
          .eq("id", bookId)
          .maybeSingle();

        if (!listing) {
          return false;
        }

        if (listing.is_ebook && listing.ebook_url) {
          setView({
            status: "pdf",
            title: listing.title,
            authors: (listing.authors || []).join(", "),
            pdfUrl: listing.ebook_url,
            sourceLabel: "Marketplace ebook",
          });
          return true;
        }

        setView({
          status: "chooser",
          title: listing.title,
          authors: (listing.authors || []).join(", "),
          sourceLabel: "Marketplace",
          links: [
            {
              label: "View listing",
              href: `/marketplace/${listing.id}`,
            },
          ],
          hint: "This marketplace item does not include a downloadable ebook file.",
        });
        return true;
      };

      const tryPurchasedProduct = async (): Promise<boolean> => {
        if (!user) {
          return false;
        }

        const { data: libraryRow } = await supabase
          .from("library")
          .select("*")
          .eq("user_id", user.id)
          .eq("book_id", bookId)
          .maybeSingle();

        const { data: purchase } = await supabase
          .from("purchases")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_id", bookId)
          .maybeSingle();

        if (!libraryRow && !purchase) {
          return false;
        }

        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("id", bookId)
          .maybeSingle();

        if (product?.ebook_url) {
          setView({
            status: "pdf",
            title: product.title,
            authors: (product.authors || []).join(", "),
            pdfUrl: product.ebook_url,
            sourceLabel: "Purchased ebook",
          });
          return true;
        }

        if (product) {
          setView({
            status: "chooser",
            title: product.title,
            authors: (product.authors || []).join(", "),
            sourceLabel: "Your library",
            links: [
              {
                label: "View in store",
                href: `/store/${product.id}`,
              },
              {
                label: "Check orders",
                href: "/orders",
              },
            ],
            hint:
              product.product_type === "physical"
                ? "This is a physical title — tracking is available under Orders."
                : "No ebook file is attached to this product yet.",
          });
          return true;
        }

        setView({
          status: "chooser",
          title: libraryRow?.title || purchase?.title || "Your book",
          authors: libraryRow?.authors?.join(", ") || "",
          sourceLabel: "Your library",
          links: [{ label: "Back to library", href: "/library" }],
          hint: "We could not locate a readable file for this saved item.",
        });
        return true;
      };

      try {
        if (sourceHint === "gutendex" || (!sourceHint && /^\d+$/.test(bookId))) {
          if (await tryGutendex()) {
            return;
          }
        }

        if (sourceHint === "google") {
          if (await tryGoogle()) {
            return;
          }
        }

        if (sourceHint === "marketplace") {
          if (await tryMarketplaceListing()) {
            return;
          }
        }

        if (await tryGutendex()) {
          return;
        }

        if (await tryPurchasedProduct()) {
          return;
        }

        if (await tryMarketplaceListing()) {
          return;
        }

        if (await tryGoogle()) {
          return;
        }

        if (!cancelled) {
          setView({ status: "locked" });
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setView({ status: "locked" });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookId, user]);

  const pdfView = useMemo(() => {
    if (view.status !== "pdf") {
      return null;
    }

    return (
      <main className="min-h-screen bg-[#1a1a1a] text-white">
        <div className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                {view.sourceLabel}
              </p>
              <h1 className="font-serif text-2xl">{view.title}</h1>
              {view.authors && (
                <p className="mt-1 text-sm text-slate-400">{view.authors}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/library"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm"
              >
                Library
              </Link>
              <button
                type="button"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
                className="rounded-xl bg-white/10 px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm">
                Page {pageNumber}
                {numPages ? ` / ${numPages}` : ""}
              </p>
              <button
                type="button"
                disabled={pageNumber >= (numPages || 1)}
                onClick={() => setPageNumber((p) => p + 1)}
                className="rounded-xl bg-white/10 px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center overflow-auto px-4 py-10">
          <Document
            file={view.pdfUrl}
            onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
            loading={<p className="text-lg">Loading PDF…</p>}
            error={
              <ReadingFormatChooser
                title={view.title}
                authors={view.authors}
                sourceLabel={view.sourceLabel}
                hint="The PDF could not be loaded in-browser. Try another format."
                links={[
                  {
                    label: "Back to library",
                    href: "/library",
                  },
                  {
                    label: "Discover public domain",
                    href: "/discover",
                  },
                ]}
              />
            }
          >
            <Page
              pageNumber={pageNumber}
              width={900}
              renderTextLayer
              renderAnnotationLayer
            />
          </Document>
        </div>
      </main>
    );
  }, [view, pageNumber, numPages]);

  if (view.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde]">
        <p className="font-serif text-xl text-[#2b1c14]">Opening your book…</p>
      </main>
    );
  }

  if (view.status === "locked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde] px-4">
        <div className="max-w-lg text-center">
          <ReadingFormatChooser
            title="This title needs access"
            sourceLabel="Reading Room"
            hint="Sign in after purchasing, or open a public-domain title from Discover."
            links={[
              { label: "Discover free books", href: "/discover" },
              { label: "Visit store", href: "/store" },
              { label: "Your library", href: "/library" },
              { label: "Sign in", href: "/login" },
            ]}
          />
        </div>
      </main>
    );
  }

  if (view.status === "chooser") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7ecde] px-4 py-12">
        <ReadingFormatChooser
          title={view.title}
          authors={view.authors}
          sourceLabel={view.sourceLabel}
          links={view.links}
          hint={view.hint}
        />
      </main>
    );
  }

  return pdfView;
}
