import { parsePriceInr } from "@/lib/catalogPricing";

export interface CartItem {
  id: string;
  title: string;
  image: string;
  /** Numeric INR amount as string for storage compatibility */
  price: string;
  type: string;
  seller_id?: string | null;
  quantity?: number;
}

const CART_STORAGE_KEY = "cart";

export const CART_UPDATED_EVENT = "cart-updated";

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    price: String(parsePriceInr(item.price)),
    quantity:
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 1,
  };
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.map((item) => normalizeCartItem(item));
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(items.map(normalizeCartItem))
  );
  notifyCartUpdated();
}

export function addItemToCart(item: CartItem): {
  updatedCart: CartItem[];
  alreadyExists: boolean;
} {
  const cart = getCart();
  const normalized = normalizeCartItem(item);
  const index = cart.findIndex(
    (entry) => entry.id === normalized.id
  );

  if (index >= 0) {
    const updated = [...cart];
    updated[index] = {
      ...updated[index],
      quantity:
        (updated[index].quantity || 1) + 1,
    };
    setCart(updated);
    return {
      updatedCart: updated,
      alreadyExists: true,
    };
  }

  const updated = [...cart, normalized];
  setCart(updated);
  return {
    updatedCart: updated,
    alreadyExists: false,
  };
}

export function upsertSingleItemCart(item: CartItem) {
  setCart([normalizeCartItem({ ...item, quantity: 1 })]);
}

export function updateCartQuantity(
  id: string,
  quantity: number
): CartItem[] {
  const cart = getCart().map((item) =>
    item.id === id
      ? { ...item, quantity: Math.max(1, quantity) }
      : item
  );
  setCart(cart);
  return cart;
}

export function removeFromCart(id: string): CartItem[] {
  const cart = getCart().filter((item) => item.id !== id);
  setCart(cart);
  return cart;
}

export function getCartSubtotal(cart: CartItem[]): number {
  return cart.reduce(
    (sum, item) =>
      sum + parsePriceInr(item.price) * (item.quantity || 1),
    0
  );
}
