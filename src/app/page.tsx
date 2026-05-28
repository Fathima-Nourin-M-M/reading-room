"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { editorialCollections } from "@/data/editorialCollections";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { addItemToCart } from "@/lib/cart";
import { useToast } from "@/components/ToastProvider";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    averageRating?: number;
    ratingsCount?: number;
    publishedDate?: string;
  };
  saleInfo?: {
    listPrice?: { amount: number; currencyCode: string };
    retailPrice?: { amount: number; currencyCode: string };
  };
}

interface ShelfBook {
  id: string;
  title: string;
  authors: string[];
  cover: string;
  rating?: number;
  categories?: string[];
  price: number;
}

interface CommunityReview {
  id: string;
  product_id: string;
  rating: number;
  review: string;
  created_at: string;
  products?: { title: string; cover_image: string } | null;
}

interface LiteraryList {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const USD_TO_INR = 83;
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

function gBookToShelf(b: GoogleBook): ShelfBook {
  const info = b.volumeInfo;
  const thumb =
    info.imageLinks?.thumbnail?.replace("http://", "https://") ||
    info.imageLinks?.smallThumbnail?.replace("http://", "https://") ||
    `https://placehold.co/300x450/f7ecde/3d281d?text=${encodeURIComponent(info.title.slice(0, 12))}`;
  const rawPrice =
    b.saleInfo?.retailPrice?.amount ?? b.saleInfo?.listPrice?.amount ?? null;
  let price = 0;
  if (rawPrice) {
    const currency = b.saleInfo?.retailPrice?.currencyCode ?? b.saleInfo?.listPrice?.currencyCode ?? "INR";
    price = currency === "USD" ? Math.round(rawPrice * USD_TO_INR) : Math.round(rawPrice);
  }
  if (price < 99) {
    // hash-based fallback
    let h = 0;
    for (let i = 0; i < b.id.length; i++) h = (h + b.id.charCodeAt(i)) | 0;
    price = 99 + (Math.abs(h) % 601);
  }
  return {
    id: b.id,
    title: info.title,
    authors: info.authors || ["Unknown"],
    cover: thumb,
    rating: info.averageRating,
    categories: info.categories,
    price,
  };
}

async function fetchShelf(query: string, maxResults = 10): Promise<ShelfBook[]> {
  try {
    const params = new URLSearchParams({ q: query, maxResults: String(maxResults), printType: "books", langRestrict: "en" });
    if (GOOGLE_KEY) params.set("key", GOOGLE_KEY);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(gBookToShelf).filter((b: ShelfBook) => b.cover.startsWith("https://books.google"));
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────
   StarRating
───────────────────────────────────────────── */
function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  return (
    <span className="text-amber-600 text-xs">
      {"★".repeat(full)}{"☆".repeat(5 - full)}
      <span className="ml-1 text-[#9c7148]">{rating.toFixed(1)}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────
   BookCard
───────────────────────────────────────────── */
function BookCard({ book, href }: { book: ShelfBook; href: string }) {
  const { pushToast } = useToast();

  function handleAddCart(e: React.MouseEvent) {
    e.preventDefault();
    addItemToCart({ id: book.id, title: book.title, image: book.cover, price: String(book.price), type: "ebook" });
    pushToast(`"${book.title}" added to cart`, "success");
  }

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#d5b18c]/50 bg-[#fffaf4] shadow-[0_8px_24px_rgba(74,43,22,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(74,43,22,0.14)]"
    >
      <div className="relative overflow-hidden">
        <img
          src={book.cover}
          alt={book.title}
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[#2b1c14]/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-3">
          <button
            onClick={handleAddCart}
            className="rounded-full bg-[#fdf4ea] px-4 py-1.5 text-xs font-medium text-[#3d281d] shadow transition hover:bg-white"
          >
            Add to Cart
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-serif text-sm leading-snug text-[#2b1c14]">{book.title}</h3>
        <p className="text-xs text-[#9c7148] line-clamp-1">{book.authors.join(", ")}</p>
        {book.rating && <StarRating rating={book.rating} />}
        <p className="mt-auto pt-1 text-sm font-semibold text-[#3d281d]">₹{book.price.toLocaleString("en-IN")}</p>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   HorizontalShelf
───────────────────────────────────────────── */
function HorizontalShelf({ label, title, books, href, loading }: {
  label: string; title: string; books: ShelfBook[]; href: string; loading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">{label}</p>
          <h2 className="font-serif text-2xl text-[#2b1c14] md:text-3xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll("left")} className="rounded-full border border-[#d4b58f] bg-[#fff8ef] px-3 py-1.5 text-xs text-[#4e3427] hover:bg-[#f4e4d0]">‹</button>
          <button onClick={() => scroll("right")} className="rounded-full border border-[#d4b58f] bg-[#fff8ef] px-3 py-1.5 text-xs text-[#4e3427] hover:bg-[#f4e4d0]">›</button>
          <Link href={href} className="text-sm text-[#7d5134] underline-offset-4 hover:underline">View all</Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-[#e8d7c4]" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {books.map((book) => (
            <div key={book.id} className="w-36 flex-none sm:w-40 md:w-44">
              <BookCard book={book} href={`/store/${book.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MoodTag
───────────────────────────────────────────── */
const MOOD_TAGS = [
  { label: "Dark Academia", query: "dark academia fiction", emoji: "🕯️" },
  { label: "Cozy Fantasy", query: "cozy fantasy", emoji: "🍵" },
  { label: "Rainy Day", query: "melancholy literary fiction", emoji: "🌧️" },
  { label: "Philosophy", query: "philosophy classics", emoji: "📐" },
  { label: "Literary Fiction", query: "literary fiction prize", emoji: "🏛️" },
  { label: "Mystery", query: "literary mystery", emoji: "🔍" },
  { label: "Romance", query: "romance literary fiction", emoji: "🌹" },
  { label: "Poetry", query: "poetry anthology modern", emoji: "✒️" },
  { label: "Science Fiction", query: "science fiction literary", emoji: "🌌" },
  { label: "Historical", query: "historical fiction literary", emoji: "📜" },
];

/* ─────────────────────────────────────────────
   Main HomePage
───────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useUser();
  const { pushToast } = useToast();

  /* Google Books shelves */
  const [featured, setFeatured] = useState<ShelfBook[]>([]);
  const [trending, setTrending] = useState<ShelfBook[]>([]);
  const [darkAcademia, setDarkAcademia] = useState<ShelfBook[]>([]);
  const [classics, setClassics] = useState<ShelfBook[]>([]);
  const [shelfsLoading, setShelfsLoading] = useState(true);

  /* Community data */
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [lists, setLists] = useState<LiteraryList[]>([]);

  /* Supabase store products */
  const [storeBooks, setStoreBooks] = useState<any[]>([]);

  /* Reading progress (local) */
  const [readingBooks, setReadingBooks] = useState<any[]>([]);

  /* Selected mood tag */
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodBooks, setMoodBooks] = useState<ShelfBook[]>([]);
  const [moodLoading, setMoodLoading] = useState(false);

  /* ── Fetch Google Books shelves ── */
  useEffect(() => {
    async function loadShelves() {
      setShelfsLoading(true);
      const [feat, trend, da, cls] = await Promise.all([
        fetchShelf("bestselling literary fiction 2024", 16),
        fetchShelf("trending books 2024 fiction", 16),
        fetchShelf("dark academia gothic fiction", 16),
        fetchShelf("classic literature must read", 16),
      ]);
      setFeatured(feat);
      setTrending(trend);
      setDarkAcademia(da);
      setClassics(cls);
      setShelfsLoading(false);
    }
    loadShelves();
  }, []);

  /* ── Fetch Supabase community reviews ── */
  useEffect(() => {
    async function loadReviews() {
      const { data } = await supabase
        .from("reviews")
        .select(`id, product_id, rating, review, created_at, products(title, cover_image)`)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) {
        setReviews(
          data.map((r: any) => ({
            ...r,
            products: Array.isArray(r.products) ? r.products[0] ?? null : r.products,
          }))
        );
      }
    }
    loadReviews();
  }, []);

  /* ── Fetch Supabase store products ── */
  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      setStoreBooks(data || []);
    }
    loadStore();
  }, []);

  /* ── Community lists (localStorage) ── */
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("literaryLists") || "[]");
      setLists(Array.isArray(stored) ? stored : []);
    } catch {
      setLists([]);
    }
  }, []);

  /* ── Reading progress (localStorage) ── */
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("marketplace") || "[]");
      const inProgress = stored.filter((b: any) => {
        const p = localStorage.getItem(`reading-progress-${b.id}`);
        return p && Number(p) > 0;
      });
      setReadingBooks(inProgress);
    } catch {
      setReadingBooks([]);
    }
  }, []);

  /* ── Mood tag click ── */
  async function handleMoodClick(tag: typeof MOOD_TAGS[0]) {
    if (selectedMood === tag.label) {
      setSelectedMood(null);
      setMoodBooks([]);
      return;
    }
    setSelectedMood(tag.label);
    setMoodLoading(true);
    const books = await fetchShelf(tag.query, 12);
    setMoodBooks(books);
    setMoodLoading(false);
  }

  const featuredLists = lists.slice(0, 3);
  const atmosphereCollections = editorialCollections.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#f7ecde]">

      {/* ── HERO ── */}
      <section className="border-b border-[#d9b996]/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 overflow-hidden rounded-[2.5rem] border border-[#d9b996]/60 bg-gradient-to-br from-[#f7e8d6] via-[#f2ddc4] to-[#ddbe9a] p-7 shadow-[0_30px_80px_rgba(74,43,22,0.18)] md:grid-cols-[1.2fr_0.8fr] md:p-14">
            <div className="relative z-10">
              <p className="mb-5 inline-flex rounded-full border border-[#d3ac81] bg-[#fff3e3]/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d5f3e]">
                Curated for Slow Evenings
              </p>
              <h1 className="max-w-3xl font-serif text-3xl leading-tight text-[#2b1c14] sm:text-4xl md:text-5xl lg:text-6xl">
                A quiet place<br className="hidden md:block" /> for good books.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#5d4334] md:text-base">
                Browse thoughtful collections, discover new titles, and read at your own pace — surrounded by a community of real readers.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/store" className="rounded-full bg-[#3d281d] px-6 py-3 text-sm font-medium text-[#fdf4ea] shadow-sm transition hover:bg-[#553727]">
                  Browse the Store
                </Link>
                <Link href="/marketplace" className="rounded-full border border-[#a87f5a]/50 bg-[#fff6ea]/70 px-6 py-3 text-sm font-medium text-[#4a2f22] transition hover:bg-[#f4e1ca]">
                  Explore Marketplace
                </Link>
                <Link href="/discover" className="rounded-full border border-[#a87f5a]/50 bg-[#fff6ea]/70 px-6 py-3 text-sm font-medium text-[#4a2f22] transition hover:bg-[#f4e1ca]">
                  Free Classics
                </Link>
              </div>
            </div>

            <div className="relative min-h-[260px] rounded-[1.5rem] border border-[#d7b590]/60 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.6),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(198,138,90,0.35),transparent_60%),linear-gradient(160deg,#9c613f_0%,#6c3f29_52%,#3f271d_100%)] p-8 text-[#f8e9d5] shadow-inner flex flex-col justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#f0d2b5]/85">Evening Shelf</p>
                <p className="mt-5 font-serif text-2xl leading-snug md:text-3xl">"Stay a little longer."</p>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#f3dbc0]">
                  Warm light, quiet shelves, and stories worth keeping close.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {["/lists", "/feed", "/sell"].map((href, i) => (
                  <Link key={href} href={href} className="rounded-full border border-[#f0d2b5]/40 bg-white/10 px-4 py-1.5 text-xs text-[#f3dbc0] backdrop-blur-sm hover:bg-white/20">
                    {["Community Lists", "Reader Feed", "Sell a Book"][i]}
                  </Link>
                ))}
              </div>
              <div className="absolute bottom-5 right-5 h-20 w-20 rounded-full bg-[#ffd39e]/35 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK NAV TILES ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { href: "/discover", label: "Discover", hint: "Free classics", emoji: "🏛️" },
              { href: "/store", label: "Store", hint: "Curated titles", emoji: "📗" },
              { href: "/marketplace", label: "Marketplace", hint: "From readers", emoji: "🏪" },
              { href: "/lists", label: "Lists", hint: "Community shelves", emoji: "📝" },
              { href: "/feed", label: "Reader Feed", hint: "Recent reviews", emoji: "💬" },
              { href: "/sell", label: "Sell a Book", hint: "List your copy", emoji: "🛍" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-1.5 rounded-2xl border border-[#dab995]/55 bg-[#fff7ee]/80 px-4 py-4 transition hover:-translate-y-0.5 hover:bg-[#fff3e4] hover:shadow-[0_12px_28px_rgba(74,43,22,0.08)]"
              >
                <span className="text-2xl">{item.emoji}</span>
                <p className="font-serif text-base text-[#2b1c14]">{item.label}</p>
                <p className="text-xs text-[#7a5a47]">{item.hint}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORE PRODUCTS (Supabase) ── */}
      {storeBooks.length > 0 && (
        <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">Reading Room Store</p>
                <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">New in the store</h2>
              </div>
              <Link href="/store" className="text-sm text-[#7d5134] underline-offset-4 hover:underline">All titles →</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {storeBooks.slice(0, 12).map((book: any) => (
                <Link
                  key={book.id}
                  href={`/store/${book.id}`}
                  className="group overflow-hidden rounded-2xl border border-[#d5b18c]/60 bg-[#fffaf4] shadow-[0_8px_24px_rgba(74,43,22,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(74,43,22,0.12)]"
                >
                  <img
                    src={book.cover_image || `https://placehold.co/300x450/f7ecde/3d281d?text=${encodeURIComponent((book.title || "").slice(0, 12))}`}
                    alt={book.title}
                    className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 font-serif text-sm leading-snug text-[#2b1c14]">{book.title}</p>
                    <p className="mt-1 text-xs text-[#9c7148]">₹{book.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED BOOKS (Google Books) ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <HorizontalShelf
            label="Featured Titles"
            title="Books worth staying up for"
            books={featured}
            href="/store"
            loading={shelfsLoading}
          />
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16 bg-[#f2e0cc]/40">
        <div className="mx-auto max-w-7xl">
          <HorizontalShelf
            label="Trending Now"
            title="What readers are reaching for"
            books={trending}
            href="/discover"
            loading={shelfsLoading}
          />
        </div>
      </section>

      {/* ── MOOD TAGS / GENRE EXPLORER ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">Reading Moods</p>
            <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">What's your mood tonight?</h2>
            <p className="mt-3 text-sm text-[#664c3c]">Tap a mood to discover books that match the feeling.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {MOOD_TAGS.map((tag) => (
              <button
                key={tag.label}
                onClick={() => handleMoodClick(tag)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
                  selectedMood === tag.label
                    ? "border-[#3d281d] bg-[#3d281d] text-[#fdf4ea]"
                    : "border-[#cda982]/60 bg-[#fff3e4]/85 text-[#7b5338] hover:border-[#3d281d]/40 hover:bg-[#f4e1ca]"
                }`}
              >
                <span>{tag.emoji}</span>
                {tag.label}
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="rounded-3xl border border-[#d9b996]/60 bg-[#fff7ee]/70 p-6 md:p-8">
              <p className="mb-5 font-serif text-xl text-[#2b1c14]">
                {selectedMood} picks
              </p>
              {moodLoading ? (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#e8d7c4]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {moodBooks.map((book) => (
                    <div key={book.id} className="w-full">
                      <BookCard book={book} href={`/store/${book.id}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── DARK ACADEMIA SHELF ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16 bg-gradient-to-br from-[#f0e5d8] to-[#e8d7c5]">
        <div className="mx-auto max-w-7xl">
          <HorizontalShelf
            label="Dark Academia"
            title="Gothic shelves & literary obsession"
            books={darkAcademia}
            href="/discover?mood=dark-academia"
            loading={shelfsLoading}
          />
        </div>
      </section>

      {/* ── EDITORIAL ATMOSPHERE ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">Editorial Atmosphere</p>
            <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">Reading moods for tonight</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {atmosphereCollections.map((collection) => (
              <article
                key={collection.id}
                className="rounded-3xl border border-[#d9b996]/60 bg-gradient-to-br from-[#fff5e8] to-[#f2dcc1] p-6 shadow-[0_15px_36px_rgba(74,43,22,0.09)]"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9b6842]">
                  {collection.tags.slice(0, 2).join(" · ")}
                </p>
                <h3 className="mt-3 font-serif text-2xl text-[#2b1c14]">{collection.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5f4637]">{collection.description}</p>
                <p className="mt-4 text-xs text-[#8f6346]">
                  {collection.books.slice(0, 2).join(" · ")}
                </p>
                <Link href="/discover" className="mt-5 inline-flex rounded-full border border-[#b1835d]/50 bg-[#fff3e4]/70 px-4 py-1.5 text-xs font-medium text-[#583a2a] hover:bg-[#f4e1ca]">
                  Explore shelf →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY REVIEWS ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16 bg-[#f2e0cc]/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">Community</p>
              <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">Readers are saying</h2>
            </div>
            <Link href="/feed" className="text-sm text-[#7d5134] underline-offset-4 hover:underline">All reviews →</Link>
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <article key={review.id} className="flex gap-4 rounded-3xl border border-[#dab995]/55 bg-[#fff8ef] p-5 shadow-sm">
                  <img
                    src={review.products?.cover_image || `https://placehold.co/80x120/f7ecde/3d281d?text=📚`}
                    alt=""
                    className="h-24 w-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={`/store/${review.product_id}`} className="font-serif text-base text-[#2b1c14] hover:underline line-clamp-1">
                      {review.products?.title || "Store title"}
                    </Link>
                    <p className="mt-1 text-sm text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#584131]">{review.review}</p>
                    <p className="mt-2 text-[10px] text-[#9c7148]">
                      {new Date(review.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8">
              <p className="font-serif text-2xl text-[#2b1c14]">The community is just warming up.</p>
              <p className="mt-2 text-sm text-[#5f4637]">
                Reviews from readers will appear here. Be among the first to share your thoughts.
              </p>
              <Link href="/store" className="mt-4 inline-flex rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]">
                Browse store & review →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CLASSICS SHELF ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <HorizontalShelf
            label="Timeless Classics"
            title="Literature that endures"
            books={classics}
            href="/discover"
            loading={shelfsLoading}
          />
        </div>
      </section>

      {/* ── COMMUNITY LISTS ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16 bg-[#f2e0cc]/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">Curated Literary Lists</p>
              <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">Shelves from the community</h2>
            </div>
            <Link href="/lists" className="text-sm text-[#7d5134] underline-offset-4 hover:underline">View all lists →</Link>
          </div>

          {featuredLists.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {featuredLists.map((list: LiteraryList, index: number) => (
                <Link
                  key={list.id || index}
                  href={list.id ? `/lists/${list.id}` : "/lists"}
                  className="rounded-3xl border border-[#dab995]/60 bg-[#fff7ee]/75 p-6 shadow-[0_15px_40px_rgba(74,43,22,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(74,43,22,0.12)]"
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#9c6b49]">{list.tags?.[0] || "Literary List"}</p>
                  <h3 className="mt-3 font-serif text-2xl leading-snug text-[#2b1c14]">{list.title || "Untitled List"}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#614737]">{list.description || "A curated list for your next reading session."}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { title: "Rainy Evening Reads", desc: "Books that match the sound of rain on windows.", tag: "Atmosphere" },
                { title: "Dark Academia Essentials", desc: "Gothic campuses, literary obsession, and candlelit libraries.", tag: "Dark Academia" },
                { title: "Philosophy for Beginners", desc: "Entry points into the great questions of existence.", tag: "Philosophy" },
              ].map((item, i) => (
                <Link key={i} href="/lists/create" className="rounded-3xl border border-dashed border-[#dab995]/60 bg-[#fff7ee]/50 p-6 transition hover:border-[#c09070] hover:bg-[#fff3e4]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#9c6b49]">{item.tag}</p>
                  <h3 className="mt-3 font-serif text-2xl leading-snug text-[#2b1c14]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#614737]">{item.desc}</p>
                  <p className="mt-4 text-xs text-[#9c7148]">Create this list →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SELL A BOOK CTA ── */}
      <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-[#d9b996]/60 bg-gradient-to-br from-[#3d281d] to-[#5a3a28] p-8 text-[#fdf4ea] md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#c2973f]">For Sellers</p>
                <h2 className="mt-3 font-serif text-3xl text-[#fdf4ea] md:text-4xl">
                  Have a book that deserves a new home?
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#e0c8ae]">
                  List your used books, rare finds, or digital titles on The Reading Room marketplace. Reach a community of passionate readers.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/sell" className="rounded-full bg-[#c2973f] px-6 py-3 text-sm font-medium text-[#2b1c14] transition hover:bg-[#d4a84a]">
                    List a Book →
                  </Link>
                  <Link href="/marketplace" className="rounded-full border border-[#f0d2b5]/30 bg-white/10 px-6 py-3 text-sm font-medium text-[#f3dbc0] transition hover:bg-white/20">
                    Browse Marketplace
                  </Link>
                </div>
              </div>
              <div className="hidden items-center md:flex">
                <div className="flex gap-2">
                  {["📗", "📘", "📕"].map((emoji, i) => (
                    <div key={i} className="flex h-20 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-3xl" style={{ transform: `rotate(${[-4, 0, 4][i]}deg)` }}>
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTINUE READING ── */}
      {readingBooks.length > 0 && (
        <section className="border-b border-[#d9b996]/40 px-4 py-14 md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6842]">Personal Reading</p>
                <h2 className="font-serif text-3xl text-[#2b1c14] md:text-4xl">Continue reading</h2>
              </div>
              <Link href="/library" className="text-sm text-[#7d5134] underline-offset-4 hover:underline">Open library →</Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {readingBooks.map((book: any) => {
                const progress = Number(localStorage.getItem(`reading-progress-${book.id}`) || 0);
                return (
                  <Link key={book.id} href={`/reader/${book.id}`} className="overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff7ee]/90 shadow-[0_15px_40px_rgba(74,43,22,0.09)]">
                    <img src={book.image || "https://placehold.co/300x450/f7ecde/3d281d?text=📚"} alt={book.title} className="aspect-[3/4] w-full object-cover" />
                    <div className="space-y-3 p-5">
                      <h3 className="font-serif text-xl text-[#2d1e15]">{book.title}</h3>
                      <div>
                        <div className="mb-2 flex justify-between text-xs text-[#7c5a46]">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e9d6c2]">
                          <div className="h-full bg-[#5a3a2a]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── LIBRARY / SIGN-IN CTA ── */}
      {!user && (
        <section className="px-4 py-14 md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 md:p-12 text-center">
              <p className="font-serif text-3xl text-[#2b1c14] md:text-4xl">Your next chapter is waiting.</p>
              <p className="mt-4 max-w-lg mx-auto text-sm text-[#5f4637]">
                Sign in to personalize your recommendations, track your reading progress, create lists, and join the community.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/signup" className="rounded-full bg-[#3d281d] px-7 py-3 text-sm font-medium text-[#fdf4ea]">Create an account</Link>
                <Link href="/login" className="rounded-full border border-[#b1835d] bg-[#fff3e4] px-7 py-3 text-sm font-medium text-[#583a2a]">Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
