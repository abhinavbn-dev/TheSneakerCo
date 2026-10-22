// Fills the database with an admin account and sample data.
// Run with: npm run seed   (this CLEARS existing data in the database)
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Coupon from './models/Coupon.js';
import Offer from './models/Offer.js';

const day = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * day);
const inDays = (n) => new Date(Date.now() + n * day);

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User, Category, Product, Order, Coupon, Offer].map((m) => m.deleteMany({})));

// Admin login: admin@sneakerco.com / Admin@123
await User.create({ name: 'Store Admin', email: 'admin@sneakerco.com', password: 'Admin@123', role: 'admin' });

const customers = await User.create([
  { name: 'Rohan Sharma', email: 'rohan.s@mail.com', password: 'Customer@123', city: 'Mumbai', tier: 'Tier 1' },
  { name: 'Vikram Rao', email: 'vikram.rao@mail.com', password: 'Customer@123', city: 'Hyderabad', tier: 'Tier 2', status: 'Flagged' },
  { name: 'Neha Patel', email: 'neha.patel@mail.com', password: 'Customer@123', city: 'Ahmedabad', tier: 'Tier 2' },
  { name: 'Pooja Nagda', email: 'pooja.n@mail.com', password: 'Customer@123', city: 'Pune', tier: 'Tier 1' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@mail.com', password: 'Customer@123', city: 'Chennai', tier: 'Tier 3' },
  { name: 'Karan Verma', email: 'karan.v@mail.com', password: 'Customer@123', city: 'Delhi', tier: 'Tier 3' },
  { name: 'Sneha Roy', email: 'sneha.roy@mail.com', password: 'Customer@123', city: 'Kolkata', tier: 'Tier 2', status: 'Blocked' },
  { name: 'Aditya Nair', email: 'aditya.nair@mail.com', password: 'Customer@123', city: 'Kochi', tier: 'Tier 3' },
]);

const cats = await Category.create([
  { name: 'Air Jordan & Classics', desc: 'Retro Jordan silhouettes and OG colourways' },
  { name: 'Lifestyle & Classics', desc: 'Everyday court-to-street staples' },
  { name: 'Running & Performance', desc: 'Road and trail performance pairs' },
  { name: 'Onitsuka Heritage', desc: 'Mexico 66 and heritage runners' },
  { name: 'Exclusive Collabs & Tier-S', desc: 'Limited collaborations and Tier-S drops' },
  { name: 'Archival & Deadstock Vault', desc: 'Authenticated deadstock pairs', status: 'Hidden' },
  { name: 'Apparel & Accessories', desc: 'Tees, hoodies, socks and care kits' },
  { name: "Women Exclusive Editions", desc: "Women's sizing and exclusive editions" },
]);
const cat = (name) => cats.find((c) => c.name === name)._id;
const sizes = [7, 8, 9, 10, 11];

const products = await Product.create([
  { name: 'Air Jordan 1 Retro High Chicago', sku: 'AJ1-CHI-85', brand: 'Nike', category: cat('Air Jordan & Classics'), price: 16995, stock: 24, sizes },
  { name: "Nike Air Force 1 '07 Triple White", sku: 'AF1-TW-07', brand: 'Nike', category: cat('Lifestyle & Classics'), price: 8995, stock: 142, sizes },
  { name: 'Travis Scott x Fragment Air Jordan 1 Low OG', sku: 'AJ1-TSF-LOW', brand: 'Nike', category: cat('Exclusive Collabs & Tier-S'), price: 148000, stock: 2, sizes },
  { name: 'Adidas Originals Superstar 82 White Core', sku: 'ADI-SS82-WC', brand: 'Adidas', category: cat('Lifestyle & Classics'), price: 9999, stock: 88, sizes },
  { name: 'Onitsuka Tiger Mexico 66 Kill Bill Yellow', sku: 'OT-M66-KB', brand: 'Onitsuka Tiger', category: cat('Onitsuka Heritage'), price: 11999, stock: 31, sizes },
  { name: 'Nike Dunk Low Retro Panda', sku: 'DNK-LOW-PND', brand: 'Nike', category: cat('Lifestyle & Classics'), price: 11295, stock: 0, sizes },
  { name: 'Air Jordan 1 Retro Military Black', sku: 'AJ1-MB-22', brand: 'Nike', category: cat('Air Jordan & Classics'), price: 20999, stock: 12, sizes },
  { name: 'Adidas Yeezy Boost 350 V2', sku: 'YZY-350-V2', brand: 'Adidas', category: cat('Exclusive Collabs & Tier-S'), price: 24999, stock: 7, sizes },
]);

// 30 sample orders spread over ~6 months so the analytics chart has data
const statuses = ['Delivered', 'Delivered', 'Shipped', 'Processing', 'Pending', 'Delivered', 'Cancelled'];
const orders = [];
for (let i = 0; i < 30; i++) {
  const user = customers[i % customers.length];
  const product = products[(i * 3) % products.length];
  const status = statuses[i % statuses.length];
  const payment = status === 'Cancelled' ? 'Refunded' : status === 'Pending' ? 'Pending' : 'Paid';
  orders.push({
    orderNo: `SC-${50001 + i}`,
    user: user._id,
    items: [{ product: product._id, name: product.name, size: sizes[i % sizes.length], qty: 1, price: product.price }],
    subtotal: product.price,
    total: product.price,
    payment,
    status,
    address: { fullName: user.name, city: user.city, state: 'India' },
    createdAt: daysAgo(i * 6),
    updatedAt: daysAgo(i * 6),
  });
}
await Order.insertMany(orders);

await Coupon.create([
  { code: 'SUMMER-SALE-2024', type: 'percent', value: 15, limit: 1000, used: 612, expiresAt: inDays(80), isActive: true },
  { code: 'VIP-MEMBER-EXCLUSIVE', type: 'flat', value: 2000, limit: 150, used: 88, minOrder: 10000, expiresAt: inDays(170), isActive: true },
  { code: 'RUNNING-PERFORMANCE', type: 'percent', value: 10, limit: 500, used: 240, expiresAt: inDays(20), isActive: true },
  { code: 'FIRST-ORDER-VAULT', type: 'flat', value: 500, limit: 1000, used: 980, expiresAt: daysAgo(8), isActive: true },
  { code: 'BLR-FLAGSHIP', type: 'flat', value: 300, limit: 300, used: 45, expiresAt: inDays(90), isActive: false },
]);

await Offer.create([
  { name: 'Midnight Drop: Jordan Retro Flash', detail: 'Flash pricing on selected Jordan retros', revenue: 1240000, endsAt: inDays(4), status: 'Live' },
  { name: 'Solo Motos: Buy 1 Get 1 50% Off', detail: 'Applies to Lifestyle & Classics', revenue: 860000, endsAt: inDays(12), status: 'Live' },
  { name: 'Deadstock Tier Booster', detail: 'Tier 1 members get early vault access', revenue: 540000, endsAt: inDays(23), status: 'Scheduled' },
  { name: 'Collab Access Workshop', detail: 'Invite-only collab raffle entries', revenue: 320000, endsAt: inDays(28), status: 'Scheduled' },
  { name: 'Early Winter Streetwear Bundle', detail: 'Hoodie + socks + care kit bundle', revenue: 410000, endsAt: inDays(53), status: 'Draft' },
  { name: 'Bangalore Flagship Anniversary Special', detail: 'In-store and online anniversary pricing', revenue: 110000, endsAt: inDays(68), status: 'Draft' },
]);

console.log('Seeded. Admin login: admin@sneakerco.com / Admin@123');
await mongoose.disconnect();
