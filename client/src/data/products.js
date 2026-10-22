// Fallback data used until /api/products exists.
export const products = [
  { id: "aj1-retro-high", name: "Air Jordan 1 Retro High", brand: "Jordan", price: 16995, gender: "men", tag: "Drop", colors: ["Chicago", "Black"], sizes: [7, 8, 9, 10, 11] },
  { id: "dunk-low-panda", name: "Dunk Low 'Panda'", brand: "Nike", price: 9995, gender: "men", tag: "Restock", colors: ["Black/White"], sizes: [6, 7, 8, 9, 10] },
  { id: "travis-aj1-low", name: "Travis Scott AJ1 Low", brand: "Jordan", price: 42500, gender: "men", tag: "Grail", colors: ["Mocha"], sizes: [8, 9, 10] },
  { id: "air-force-1-triple-white", name: "Air Force 1 '07 'Triple White'", brand: "Nike", price: 9695, gender: "women", tag: "Classic", colors: ["White", "Black"], sizes: [5, 6, 7, 8, 9, 10] },
  { id: "samba-og", name: "Samba OG 'White'", brand: "Adidas", price: 11999, gender: "women", tag: "Classic", colors: ["White/Green"], sizes: [5, 6, 7, 8] },
  { id: "nb-550", name: "New Balance 550", brand: "New Balance", price: 12999, gender: "women", tag: "New", colors: ["White/Grey"], sizes: [5, 6, 7, 8, 9] },
];

export const orders = [
  { id: "TSC-89421-BLK", date: "12 Sep 2026", status: "In transit", total: 19195, items: [{ id: "air-force-1-triple-white", size: 8, qty: 1 }, { id: "dunk-low-panda", size: 9, qty: 1 }] },
  { id: "TSC-77310-WHT", date: "28 Aug 2026", status: "Delivered", total: 16995, items: [{ id: "aj1-retro-high", size: 9, qty: 1 }] },
];

export const transactions = [
  { id: "t1", date: "12 Sep 2026", note: "Order TSC-89421-BLK", amount: -19195 },
  { id: "t2", date: "05 Sep 2026", note: "Wallet top-up (UPI)", amount: 25000 },
  { id: "t3", date: "28 Aug 2026", note: "Order TSC-77310-WHT", amount: -16995 },
  { id: "t4", date: "20 Aug 2026", note: "Refund: cancelled order", amount: 9995 },
];
