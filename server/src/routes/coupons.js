
import { Router } from 'express';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/coupons/available
// Customer-facing list of coupons that are active and usable.
router.get(
  '/available',
  protect,
  asyncHandler(async (req, res) => {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    })
      .select('code type value limit used minOrder expiresAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const items = coupons
      .filter((coupon) => Number(coupon.used || 0) < Number(coupon.limit ?? 500))
      .map((coupon) => ({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder || 0,
        expiresAt: coupon.expiresAt || null,
      }));

    res.json({ items });
  })
);

// POST /api/coupons/validate
// Customers must still validate a code before using its discount.
router.post(
  '/validate',
  protect,
  asyncHandler(async (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const subtotal = Number(req.body?.subtotal);

    if (!code) {
      return res.status(400).json({ message: 'Enter a coupon code' });
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ message: 'Invalid order subtotal' });
    }

    const coupon = await Coupon.findOne({ code });

    const problem = coupon
      ? coupon.problem(subtotal)
      : 'Coupon not found';

    if (problem) {
      return res.status(400).json({ message: problem });
    }

    res.json({
      code: coupon.code,
      discount: coupon.discountFor(subtotal),
    });
  })
);

// Everything below this point is admin-only.
router.use(protect, adminOnly);

// GET /api/coupons — admin list and summary
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const coupons = await Coupon.find().sort('-createdAt');

    const redemptions = coupons.reduce(
      (total, coupon) => total + coupon.used,
      0
    );

    const now = new Date();
    const next30Days = new Date(Date.now() + 30 * 86400000);

    const expiringSoon = coupons.filter(
      (coupon) =>
        coupon.expiresAt &&
        coupon.expiresAt > now &&
        coupon.expiresAt < next30Days
    ).length;

    res.json({
      items: coupons,
      summary: {
        active: coupons.filter((coupon) => coupon.status === 'Active').length,
        redemptions,
        expiringSoon,
      },
    });
  })
);

// POST /api/coupons — create an admin coupon
router.post(
  '/',
  asyncHandler(async (req, res) => {
    res.status(201).json(await Coupon.create(req.body));
  })
);

// PUT /api/coupons/:id — update an admin coupon
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json(coupon);
  })
);

// DELETE /api/coupons/:id — delete an admin coupon
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted' });
  })
);

export default router;
