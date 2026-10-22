import { Router } from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { listing, searchRegex } from '../utils/listing.js';

const router = Router();
router.use(protect, adminOnly); // every route in this file is admin-only

// GET /api/customers?q=&tier=&status=&page=
router.get('/', asyncHandler(async (req, res) => {
  const filter = { role: 'user' };
  if (req.query.tier) filter.tier = req.query.tier;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = searchRegex(req.query.q);
    filter.$or = [{ name: rx }, { email: rx }, { city: rx }];
  }

  const { items, ...meta } = await listing(User, filter, req);

  // attach each customer's order count and lifetime spend
  const stats = await Order.aggregate([
    { $match: { user: { $in: items.map((u) => u._id) } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ['$payment', 'Paid'] }, '$total', 0] } } } },
  ]);
  const byId = Object.fromEntries(stats.map((s) => [String(s._id), s]));

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [registered, flagged, newThisWeek] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'Flagged' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: weekAgo } }),
  ]);

  res.json({
    ...meta,
    items: items.map((u) => ({ ...u.toJSON(), orders: byId[u.id]?.orders || 0, spent: byId[u.id]?.spent || 0 })),
    summary: { registered, flagged, newThisWeek },
  });
}));

// PATCH /api/customers/:id  { status?, tier? }
router.patch('/:id', asyncHandler(async (req, res) => {
  const { status, tier } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'user' },
    { ...(status && { status }), ...(tier && { tier }) },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ message: 'Customer not found' });
  res.json(user);
}));

export default router;
