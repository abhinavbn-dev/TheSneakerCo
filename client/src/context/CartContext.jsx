import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { products as fallbackProducts } from '../data/products.js';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => load('sneaker_cart', []));
  const [wishlist, setWishlist] = useState(() => load('sneaker_wishlist', []));
  useEffect(() => localStorage.setItem('sneaker_cart', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('sneaker_wishlist', JSON.stringify(wishlist)), [wishlist]);

  const addItem = (id, size, qty = 1, product = null) => setItems((previous) => {
    const hit = previous.find((item) => String(item.id) === String(id) && String(item.size) === String(size));
    if (hit) return previous.map((item) => (item === hit ? { ...item, qty: item.qty + qty, product: product || item.product } : item));
    return [...previous, { id: String(id), size: String(size), qty, ...(product ? { product } : {}) }];
  });
  const setQty = (id, size, qty) => setItems((previous) => previous.map((item) => String(item.id) === String(id) && String(item.size) === String(size) ? { ...item, qty: Math.max(1, Number(qty) || 1) } : item));
  const removeItem = (id, size) => setItems((previous) => previous.filter((item) => !(String(item.id) === String(id) && String(item.size) === String(size))));
  const clearCart = () => setItems([]);
  const toggleWish = (id) => setWishlist((previous) => previous.includes(String(id)) ? previous.filter((value) => value !== String(id)) : [...previous, String(id)]);
  const lines = useMemo(() => items.map((item) => ({
    ...item,
    product: item.product || fallbackProducts.find((product) => String(product.id) === String(item.id)),
  })).filter((line) => line.product), [items]);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price || 0) * line.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return <CartContext.Provider value={{ items, lines, subtotal, count, wishlist, addItem, setQty, removeItem, clearCart, toggleWish }}>{children}</CartContext.Provider>;
}
