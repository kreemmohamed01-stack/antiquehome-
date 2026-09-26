"use client";

// Simple localStorage-backed cart shared across the storefront via a
// custom event so any mounted component can react to changes without a
// full context provider (keeps parity with the old vanilla-JS drawer).

export type CartLine = {
  id: string; // product slug
  name: string;
  price: number;
  image: string;
  variant?: string;
  qty: number;
};

const KEY = "ah_cart_v1";
export const CART_EVENT = "ah:cart-changed";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* ignore quota / privacy errors */
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addToCart(item: Omit<CartLine, "qty">, qty = 1) {
  const lines = readCart();
  const existing = lines.find((l) => l.id === item.id && l.variant === item.variant);
  if (existing) existing.qty += qty;
  else lines.push({ ...item, qty });
  writeCart(lines);
}

export function setQty(id: string, qty: number) {
  const lines = readCart();
  const line = lines.find((l) => l.id === id);
  if (!line) return;
  line.qty = Math.max(1, Math.min(9, qty));
  writeCart(lines);
}

export function removeFromCart(id: string) {
  writeCart(readCart().filter((l) => l.id !== id));
}

export function clearCart() {
  writeCart([]);
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
  return { subtotal, totalQty };
}
