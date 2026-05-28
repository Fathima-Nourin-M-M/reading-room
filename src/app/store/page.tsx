"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import CatalogProductCard from "@/components/CatalogProductCard";
import RecentCommunityReviews from "@/components/RecentCommunityReviews";
import { useToast } from "@/components/ToastProvider";
import WishlistButton from "@/components/WishlistButton";
import { addItemToCart, upsertSingleItemCart } from "@/lib/cart";
import {
  asStringArray,
  formatAuthors,
} from "@/lib/productDisplay";
import {
  fetchStoreCatalog,
  filterCatalogByFormat,
  splitCatalogByFormat,
  type CatalogProduct,
} from "@/lib/storeCatalog";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  title: string;
  authors: string[];
  cover_image: string;
  description: string;
  categories: string[];
  tags: string[];
  product_type: string;
  price: string;
  inventory: number;
  ebook_url?: string;
  featured: boolean;
}

type FormatFilter = "all" | "ebook" | "physical";

export default function StorePage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [products, setProducts] =
    useState<Product[]>([]);
  const [catalogProducts, setCatalogProducts] =
    useState<CatalogProduct[]>([]);
  const [visibleCatalogCount, setVisibleCatalogCount] =
    useState(24);
  const [isLoading, setIsLoading] =
    useState(true);
  const [catalogError, setCatalogError] =
    useState<string | null>(null);
  const [productsError, setProductsError] =
    useState<string | null>(null);
  const [formatFilter, setFormatFilter] =
    useState<FormatFilter>("all");

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setCatalogError(null);
    setProductsError(null);

    const [productsResult, catalogResult] =
      await Promise.allSettled([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        fetchStoreCatalog(),
      ]);

    if (productsResult.status === "fulfilled") {
      const { data, error } = productsResult.value;

      if (error) {
        const fallback =
          await supabase.from("products").select("*");

        if (fallback.error) {
          console.error(fallback.error);
          setProducts([]);
          setProductsError(
            "Official store inventory could not be loaded."
          );
        } else {
          setProducts((fallback.data as Product[]) ?? []);
        }
      } else {
        setProducts((data as Product[]) ?? []);
      }
    } else {
      console.error(productsResult.reason);
      setProducts([]);
      setProductsError(
        "Official store inventory could not be loaded."
      );
    }

    if (catalogResult.status === "fulfilled") {
      setCatalogProducts(catalogResult.value);
    } else {
      console.error(catalogResult.reason);
      setCatalogProducts([]);
      setCatalogError(
        "Book catalog could not be loaded from Google Books."
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filteredProducts = useMemo(() => {
    if (formatFilter === "all") {
      return products;
    }

    return products.filter(
      (product) => product.product_type === formatFilter
    );
  }, [formatFilter, products]);

  const filteredCatalogProducts = useMemo(
    () =>
      filterCatalogByFormat(
        catalogProducts,
        formatFilter
      ),
    [catalogProducts, formatFilter]
  );

  const visibleCatalogProducts = useMemo(
    () =>
      filteredCatalogProducts.slice(
        0,
        visibleCatalogCount
      ),
    [
      filteredCatalogProducts,
      visibleCatalogCount,
    ]
  );

  const catalogByType = useMemo(
    () =>
      splitCatalogByFormat(
        visibleCatalogProducts
      ),
    [visibleCatalogProducts]
  );

  function addToCart(
    e: React.MouseEvent,
    product: Product
  ) {
    e.preventDefault();
    e.stopPropagation();

    const result = addItemToCart({
      id: product.id,
      title: product.title,
      image: product.cover_image,
      price: product.price,
      type: product.product_type,
      seller_id: null,
      quantity: 1,
    });
    if (result.alreadyExists) {
      pushToast("Cart quantity updated", "info");
      return;
    }
    pushToast("Added to cart", "success");
  }

  function buyNow(
    e: React.MouseEvent,
    product: Product
  ) {
    e.preventDefault();
    e.stopPropagation();
    upsertSingleItemCart({
      id: product.id,
      title: product.title,
      image: product.cover_image,
      price: product.price,
      type: product.product_type,
      seller_id: null,
      quantity: 1,
    });
    pushToast("Ready for checkout", "success");
    router.push("/cart");
  }

  const hasVisibleInventory =
    filteredProducts.length > 0 ||
    filteredCatalogProducts.length > 0;

  return (
    <main className="min-h-screen bg-[#f7ecde] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-[#d8b792]/60 bg-gradient-to-br from-[#f8ead8] via-[#f3e1c9] to-[#e0c29f] p-8 shadow-[0_24px_60px_rgba(74,43,22,0.13)] md:p-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#986543]">
            Official Store
          </p>
          <h1 className="font-serif text-4xl text-[#2b1c14] sm:text-5xl">
            Curated editions for your shelf
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#614737] md:text-base">
            Browse official releases and discover literary titles from the connected book catalog.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {(["all", "ebook", "physical"] as FormatFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setFormatFilter(filter);
                setVisibleCatalogCount(24);
              }}
              className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                formatFilter === filter
                  ? "border-[#3d281d] bg-[#3d281d] text-[#f7ead8]"
                  : "border-[#d9b28b] bg-[#fff4e7] text-[#6b4d3a]"
              }`}
            >
              {filter === "all" ? "All formats" : filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse overflow-hidden rounded-3xl border border-[#dfc3a2] bg-[#fff7ee]/85 p-4"
              >
                <div className="aspect-[3/4] rounded-2xl bg-[#ead7c4]" />
                <div className="mt-4 h-4 w-3/4 rounded bg-[#ead7c4]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-[#ead7c4]" />
                <div className="mt-4 h-9 rounded-xl bg-[#ead7c4]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-14">
            {(productsError || catalogError) && (
              <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-6 text-sm text-[#5f4637]">
                {productsError && <p>{productsError}</p>}
                {catalogError && <p className="mt-1">{catalogError}</p>}
                <button
                  type="button"
                  onClick={loadInventory}
                  className="mt-4 rounded-full bg-[#3d281d] px-5 py-2 text-sm font-medium text-[#fdf4ea]"
                >
                  Try again
                </button>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <section>
                <div className="mb-6">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
                    Official Editions
                  </p>
                  <h2 className="font-serif text-3xl text-[#2b1c14]">
                    Platform inventory
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const tags = asStringArray(product.tags);

                    return (
                      <article
                        key={product.id}
                        className="group overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff8ef] shadow-[0_12px_34px_rgba(74,43,22,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(74,43,22,0.14)]"
                      >
                        <Link href={`/store/${product.id}`} className="block">
                          <img
                            src={
                              product.cover_image ||
                              "https://placehold.co/300x450"
                            }
                            alt={product.title}
                            className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          />

                          <div className="space-y-3 p-5 pb-3">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#4b3124] px-2 py-1 text-xs text-[#f7ead8]">
                                {product.product_type}
                              </span>
                              {product.featured && (
                                <span className="rounded-full border border-[#ddb887] bg-[#fff2de] px-2 py-1 text-xs text-[#8e5f3d]">
                                  Featured
                                </span>
                              )}
                            </div>

                            <div>
                              <h2 className="font-serif text-2xl leading-snug text-[#2d1e15]">
                                {product.title}
                              </h2>
                              <p className="mt-1 text-sm text-[#6d5242]">
                                {formatAuthors(product.authors)}
                              </p>
                            </div>

                            <p className="line-clamp-2 text-sm text-[#745948]">
                              {product.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-[#8a5a3b]">
                                ₹{product.price}
                              </span>
                              <span className="text-xs text-[#7b5b47]">
                                {product.inventory ?? 0} left
                              </span>
                            </div>

                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-2 py-1 text-xs text-[#8b5d3e]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="space-y-2 px-5 pb-5">
                          <button
                            type="button"
                            onClick={(e) => addToCart(e, product)}
                            className="w-full rounded-2xl bg-[#3d281d] py-2.5 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
                          >
                            Add to Cart
                          </button>
                          <button
                            type="button"
                            onClick={(e) => buyNow(e, product)}
                            className="w-full rounded-2xl border border-[#3d281d] bg-[#fff8ef] py-2.5 text-sm font-medium text-[#3d281d] transition hover:bg-[#f7e6d0]"
                          >
                            Buy Now
                          </button>
                          <WishlistButton
                            item={{
                              id: product.id,
                              title: product.title,
                              authors: asStringArray(product.authors),
                              image:
                                product.cover_image ||
                                "https://placehold.co/300x450",
                              price: product.price,
                              source: "store",
                              productType:
                                product.product_type === "ebook"
                                  ? "ebook"
                                  : "physical",
                            }}
                            className="w-full rounded-2xl border border-[#ba9168] bg-[#fff4e6] py-2.5 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]"
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {filteredCatalogProducts.length > 0 && (
              <section className="space-y-8">
                <div className="mb-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b6842]">
                    Expanded Catalog
                  </p>
                  <h2 className="font-serif text-3xl text-[#2b1c14]">
                    A fuller bookstore shelf
                  </h2>
                  <p className="mt-2 text-sm text-[#6d5242]">
                    {filteredCatalogProducts.length} titles loaded from multi-genre Google Books discovery.
                  </p>
                </div>

                {formatFilter === "all" ? (
                  <>
                    {catalogByType.physical.length > 0 && (
                      <div>
                        <h3 className="mb-4 font-serif text-2xl text-[#2b1c14]">
                          Physical Books
                        </h3>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                          {catalogByType.physical.map((product) => (
                            <CatalogProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      </div>
                    )}

                    {catalogByType.ebooks.length > 0 && (
                      <div>
                        <h3 className="mb-4 font-serif text-2xl text-[#2b1c14]">
                          Ebooks
                        </h3>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                          {catalogByType.ebooks.map((product) => (
                            <CatalogProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleCatalogProducts.map((product) => (
                      <CatalogProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {visibleCatalogCount < filteredCatalogProducts.length && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCatalogCount(
                        (current) => current + 24
                      )
                    }
                    className="rounded-full border border-[#ba9168] bg-[#fff4e6] px-5 py-2 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]"
                  >
                    Load more books
                  </button>
                )}
              </section>
            )}

            {!hasVisibleInventory && (
              <div className="rounded-3xl border border-[#d8b893]/55 bg-[#fff7ee]/70 p-8 text-[#5f4637]">
                <p className="font-serif text-2xl text-[#2b1c14]">
                  No books match this format.
                </p>
                <p className="mt-2 text-sm">
                  Try another format filter or refresh the catalog.
                </p>
              </div>
            )}
          </div>
        )}
        <div className="mt-16 border-t border-[#d9b996]/45 pt-12">
          <RecentCommunityReviews title="Recent reader reviews" />
        </div>
      </div>
    </main>
  );
}
