import { Router } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect, adminOnly);

const sumPaid = (since) =>
  Order.aggregate([
    { $match: { payment: 'Paid', ...(since && { createdAt: { $gte: since } }) } },
    { $group: { _id: null, sum: { $sum: '$total' } } },
  ]).then((r) => r[0]?.sum || 0);

// GET /api/stats/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [monthRevenue, ordersToday, awaitingDispatch, customers, recentOrders, lowStock] = await Promise.all([
    sumPaid(startOfMonth),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ status: { $in: ['Pending', 'Processing'] } }),
    User.countDocuments({ role: 'user' }),
    Order.find().sort('-createdAt').limit(5).populate('user', 'name'),
    Product.find({ stock: { $lte: 10 } }).sort('stock').limit(5).select('name stock'),
  ]);

  res.json({ monthRevenue, ordersToday, awaitingDispatch, customers, recentOrders, lowStock });
}));

// GET /api/stats/analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 6, 1); // last 7 months

  const [monthly, top, totals] = await Promise.all([
    Order.aggregate([
      { $match: { payment: 'Paid', createdAt: { $gte: start } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { payment: 'Paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', units: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([{ $match: { payment: { $in: ['Paid', 'Refunded'] } } }, { $group: { _id: '$payment', sum: { $sum: '$total' } } }]),
  ]);

  // fill in months with no sales so the chart always has 7 bars
  const lookup = Object.fromEntries(monthly.map((r) => [`${r._id.y}-${r._id.m}`, r.revenue]));
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('en-IN', { month: 'short' }),
      revenue: lookup[`${d.getFullYear()}-${d.getMonth() + 1}`] || 0,
    });
  }

  const paid = totals.find((t) => t._id === 'Paid')?.sum || 0;
  const refunds = totals.find((t) => t._id === 'Refunded')?.sum || 0;
  res.json({
    gross: paid + refunds,
    refunds,
    net: paid,
    months,
    topProducts: top.map((t) => ({ name: t._id, units: t.units, revenue: t.revenue })),
  });
}));

export default router;
