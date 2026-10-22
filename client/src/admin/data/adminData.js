export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

export const navItems = [
  { to: 'dashboard', label: 'Dashboard' },
  { to: 'orders', label: 'Orders' },
  { to: 'products', label: 'Products' },
  { to: 'categories', label: 'Categories' },
  { to: 'customers', label: 'Customers' },
  { to: 'coupons', label: 'Coupons' },
  { to: 'offers', label: 'Offers' },
  { to: 'analytics', label: 'Analytics' },
];

export const products = [
  { id: 'P-1001', name: 'Air Jordan 1 Retro High Chicago', sku: 'AJ1-CHI-85', category: 'Air Jordan & Classics', price: 16995, stock: 24, status: 'Active' },
  { id: 'P-1002', name: "Nike Air Force 1 '07 Triple White", sku: 'AF1-TW-07', category: 'Lifestyle & Classics', price: 8995, stock: 142, status: 'Active' },
  { id: 'P-1003', name: 'Travis Scott x Fragment Air Jordan 1 Low OG', sku: 'AJ1-TSF-LOW', category: 'Exclusive Collabs & Tier-S', price: 148000, stock: 2, status: 'Low stock' },
  { id: 'P-1004', name: 'Adidas Originals Superstar 82 White Core', sku: 'ADI-SS82-WC', category: 'Lifestyle & Classics', price: 9999, stock: 88, status: 'Active' },
  { id: 'P-1005', name: 'Onitsuka Tiger Mexico 66 Kill Bill Yellow', sku: 'OT-M66-KB', category: 'Onitsuka Heritage', price: 11999, stock: 31, status: 'Active' },
  { id: 'P-1006', name: 'Nike Dunk Low Retro Panda', sku: 'DNK-LOW-PND', category: 'Lifestyle & Classics', price: 11295, stock: 0, status: 'Out of stock' },
  { id: 'P-1007', name: 'Air Jordan 1 Retro Military Black', sku: 'AJ1-MB-22', category: 'Air Jordan & Classics', price: 20999, stock: 12, status: 'Active' },
  { id: 'P-1008', name: 'Adidas Yeezy Boost 350 V2', sku: 'YZY-350-V2', category: 'Exclusive Collabs & Tier-S', price: 24999, stock: 7, status: 'Low stock' },
];

export const categories = [
  { id: 'C-01', name: 'Air Jordan & Classics', desc: 'Retro Jordan silhouettes and OG colourways', products: 42, status: 'Live' },
  { id: 'C-02', name: 'Lifestyle & Classics', desc: 'Everyday court-to-street staples', products: 118, status: 'Live' },
  { id: 'C-03', name: 'Running & Performance', desc: 'Road and trail performance pairs', products: 64, status: 'Live' },
  { id: 'C-04', name: 'Onitsuka Heritage', desc: 'Mexico 66 and heritage runners', products: 27, status: 'Live' },
  { id: 'C-05', name: 'Exclusive Collabs & Tier-S', desc: 'Limited collaborations and Tier-S drops', products: 19, status: 'Live' },
  { id: 'C-06', name: 'Archival & Deadstock Vault', desc: 'Authenticated deadstock pairs', products: 33, status: 'Hidden' },
  { id: 'C-07', name: 'Apparel & Accessories', desc: 'Tees, hoodies, socks and care kits', products: 96, status: 'Live' },
  { id: 'C-08', name: 'Women Exclusive Editions', desc: "Women's sizing and exclusive editions", products: 21, status: 'Live' },
];

export const customers = [
  { id: 'U-2001', name: 'Abhinav Rao', email: 'abhinav.rao@mail.com', city: 'Bengaluru', tier: 'Tier 1', orders: 18, spent: 226300, status: 'Active' },
  { id: 'U-2002', name: 'Rohan Sharma', email: 'rohan.s@mail.com', city: 'Mumbai', tier: 'Tier 1', orders: 14, spent: 143000, status: 'Active' },
  { id: 'U-2003', name: 'Vikram Rao', email: 'vikram.rao@mail.com', city: 'Hyderabad', tier: 'Tier 2', orders: 9, spent: 98200, status: 'Flagged' },
  { id: 'U-2004', name: 'Neha Patel', email: 'neha.patel@mail.com', city: 'Ahmedabad', tier: 'Tier 2', orders: 7, spent: 64500, status: 'Active' },
  { id: 'U-2005', name: 'Pooja Nagda', email: 'pooja.n@mail.com', city: 'Pune', tier: 'Tier 1', orders: 12, spent: 82400, status: 'Active' },
  { id: 'U-2006', name: 'Ananya Iyer', email: 'ananya.iyer@mail.com', city: 'Chennai', tier: 'Tier 3', orders: 4, spent: 70400, status: 'Active' },
  { id: 'U-2007', name: 'Karan Verma', email: 'karan.v@mail.com', city: 'Delhi', tier: 'Tier 3', orders: 3, spent: 113000, status: 'Active' },
  { id: 'U-2008', name: 'Sneha Roy', email: 'sneha.roy@mail.com', city: 'Kolkata', tier: 'Tier 2', orders: 6, spent: 39200, status: 'Blocked' },
  { id: 'U-2009', name: 'Aditya Nair', email: 'aditya.nair@mail.com', city: 'Kochi', tier: 'Tier 3', orders: 2, spent: 19900, status: 'Active' },
];

export const orders = [
  { id: 'SC-50231', customer: 'Rohan Sharma', item: 'Air Jordan 1 Retro High Chicago', total: 16995, payment: 'Paid', status: 'Processing', date: '08 Oct 2026' },
  { id: 'SC-50230', customer: 'Vikram Rao', item: 'Nike Dunk Low Retro Panda', total: 11295, payment: 'Pending', status: 'Pending', date: '08 Oct 2026' },
  { id: 'SC-50229', customer: 'Neha Patel', item: 'Adidas Originals Superstar 82', total: 9999, payment: 'Paid', status: 'Shipped', date: '07 Oct 2026' },
  { id: 'SC-50228', customer: 'Pooja Nagda', item: 'Onitsuka Tiger Mexico 66', total: 11999, payment: 'Paid', status: 'Delivered', date: '07 Oct 2026' },
  { id: 'SC-50227', customer: 'Ananya Iyer', item: 'Adidas Yeezy Boost 350 V2', total: 24999, payment: 'Failed', status: 'Cancelled', date: '06 Oct 2026' },
  { id: 'SC-50226', customer: 'Karan Verma', item: 'Travis Scott x Fragment AJ1 Low', total: 148000, payment: 'Paid', status: 'Shipped', date: '06 Oct 2026' },
  { id: 'SC-50225', customer: 'Sneha Roy', item: "Nike Air Force 1 '07 Triple White", total: 8995, payment: 'Paid', status: 'Delivered', date: '05 Oct 2026' },
  { id: 'SC-50224', customer: 'Aditya Nair', item: 'Air Jordan 1 Retro Military Black', total: 20999, payment: 'Paid', status: 'Processing', date: '05 Oct 2026' },
];

export const coupons = [
  { id: 'SUMMER-SALE-2024', code: 'SUMMER-SALE-2024', type: '15% off', used: 612, limit: 1000, expires: '31 Dec 2026', status: 'Active' },
  { id: 'VIP-MEMBER-EXCLUSIVE', code: 'VIP-MEMBER-EXCLUSIVE', type: '₹2,000 off', used: 88, limit: 150, expires: '31 Mar 2027', status: 'Active' },
  { id: 'RUNNING-PERFORMANCE', code: 'RUNNING-PERFORMANCE', type: '10% off', used: 240, limit: 500, expires: '15 Nov 2026', status: 'Active' },
  { id: 'FIRST-ORDER-VAULT', code: 'FIRST-ORDER-VAULT', type: '₹500 off', used: 980, limit: 1000, expires: '30 Sep 2026', status: 'Expired' },
  { id: 'BLR-FLAGSHIP', code: 'BLR-FLAGSHIP', type: 'Free shipping', used: 45, limit: 300, expires: '01 Jan 2027', status: 'Draft' },
];

export const offers = [
  { id: 'O-01', name: 'Midnight Drop: Jordan Retro Flash', detail: 'Flash pricing on selected Jordan retros', revenue: 1240000, ends: '12 Oct 2026', status: 'Live' },
  { id: 'O-02', name: 'Solo Motos: Buy 1 Get 1 50% Off', detail: 'Applies to Lifestyle & Classics', revenue: 860000, ends: '20 Oct 2026', status: 'Live' },
  { id: 'O-03', name: 'Deadstock Tier Booster', detail: 'Tier 1 members get early vault access', revenue: 540000, ends: '31 Oct 2026', status: 'Scheduled' },
  { id: 'O-04', name: 'Collab Access Workshop', detail: 'Invite-only collab raffle entries', revenue: 320000, ends: '05 Nov 2026', status: 'Scheduled' },
  { id: 'O-05', name: 'Early Winter Streetwear Bundle', detail: 'Hoodie + socks + care kit bundle', revenue: 410000, ends: '30 Nov 2026', status: 'Draft' },
  { id: 'O-06', name: 'Bangalore Flagship Anniversary Special', detail: 'In-store and online anniversary pricing', revenue: 110000, ends: '15 Dec 2026', status: 'Draft' },
];

export const monthlySales = [
  { m: 'Apr', v: 9.2 }, { m: 'May', v: 11.4 }, { m: 'Jun', v: 10.1 }, { m: 'Jul', v: 13.8 },
  { m: 'Aug', v: 12.6 }, { m: 'Sep', v: 15.9 }, { m: 'Oct', v: 18.4 },
];

export const topProducts = [
  { name: 'Air Jordan 1 Retro High Chicago', units: 312, revenue: 5302440 },
  { name: 'Nike Dunk Low Retro Panda', units: 288, revenue: 3252960 },
  { name: 'Adidas Originals Superstar 82', units: 241, revenue: 2409759 },
  { name: 'Onitsuka Tiger Mexico 66', units: 196, revenue: 2351804 },
];

export const dispatchHubs = [
  { name: 'Bengaluru Hub', load: 78 },
  { name: 'Mumbai Hub', load: 54 },
  { name: 'Delhi Hub', load: 33 },
];
