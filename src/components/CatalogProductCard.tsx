"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ToastProvider";
import WishlistButton from "@/components/WishlistButton";
import { addItemToCart, upsertSingleItemCart } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/storeCatalog";

interface CatalogProductCardProps {
  product: CatalogProduct;
}

export default function CatalogProductCard({
  product,
}: CatalogProductCardProps) {
  const { pushToast } = useToast();
  const router = useRouter();

  function addToCart() {
    const item = {
      id: product.id,
      title: product.title,
      image: product.coverUrl,
      price: String(product.priceInr),
      type: product.productType,
      seller_id: null,
      quantity: 1,
    };

    const result = addItemToCart(item);
    if (result.alreadyExists) {
      pushToast("Cart quantity updated", "info");
      return;
    }
    pushToast("Added to cart", "success");
  }

  function buyNow() {
    upsertSingleItemCart({
      id: product.id,
      title: product.title,
      image: product.coverUrl,
      price: String(product.priceInr),
      type: product.productType,
      seller_id: null,
      quantity: 1,
    });
    pushToast("Ready for checkout", "success");
    router.push("/cart");
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#d8b48e]/60 bg-[#fff8ef] shadow-[0_12px_34px_rgba(74,43,22,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(74,43,22,0.14)]">
      <Link href={`/books/${product.id}`} className="block">
        <img
          src={product.coverUrl}
          alt={product.title}
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />

        <div className="space-y-3 p-5 pb-3">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                product.productType === "ebook"
                  ? "bg-[#3d5a45] text-[#e8f3eb]"
                  : "bg-[#4b3124] text-[#f7ead8]"
              }`}
            >
              {product.productType === "ebook" ? "Ebook" : "Physical"}
            </span>
            <span className="rounded-full border border-[#d9b28b] bg-[#fff2e2] px-2 py-1 text-xs text-[#8b5d3e]">
              {product.categories[0]}
            </span>
          </div>

          <div>
            <h2 className="font-serif text-xl leading-snug text-[#2d1e15]">
              {product.title}
            </h2>
            <p className="mt-1 text-sm text-[#6d5242]">
              {product.authors.join(", ")}
            </p>
          </div>

          <p className="line-clamp-2 text-sm text-[#745948]">
            {product.description}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-[#8a5a3b]">
              {product.priceLabel}
            </span>
            {product.priceIsEstimate && (
              <span className="text-[11px] text-[#9c7148]">
                est.
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-2 px-5 pb-5">
        <button
          type="button"
          onClick={addToCart}
          className="w-full rounded-2xl bg-[#3d281d] py-2.5 text-sm font-medium text-[#fdf4ea] transition hover:bg-[#553727]"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={buyNow}
          className="w-full rounded-2xl border border-[#3d281d] bg-[#fff8ef] py-2.5 text-sm font-medium text-[#3d281d] transition hover:bg-[#f7e6d0]"
        >
          Buy Now
        </button>
        <WishlistButton
          item={{
            id: product.id,
            title: product.title,
            authors: product.authors,
            image: product.coverUrl,
            price: product.priceLabel,
            source: "google",
            productType: product.productType,
          }}
          className="w-full rounded-2xl border border-[#ba9168] bg-[#fff4e6] py-2.5 text-sm font-medium text-[#5b3c2b] transition hover:bg-[#f7e6d0]"
        />
      </div>
    </article>
  );
}
