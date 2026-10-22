
import { Router } from 'express';

import Order, {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { listing, searchRegex } from '../utils/listing.js';

const router = Router();

function isRazorpayOrder(order) {
  return (
    order.paymentMethod === 'Razorpay' ||
    Boolean(order.razorpayOrderId)
  );
}

async function restoreStockOnce(orderId) {
  // Atomically claim the reservation before restoring inventory.
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: { $ne: 'Cancelled' },
      stockReserved: true,
    },
    {
      $set: {
        status: 'Cancelled',
        stockReserved: false,
      },
    },
    { new: true }
  );

  if (!order) return null;

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.qty } }
    );
  }

  return order;
}

// POST /api/orders
// Place an order, normally Cash on Delivery.
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const {
      items,
      address: suppliedAddress,
      shippingAddress,
      couponCode,
      paymentMethod,
    } = req.body;

    const method = String(paymentMethod || 'cod').toLowerCase();

    if (!['cod', 'cash on delivery'].includes(method)) {
      return res.status(400).json({
        message:
          'Use the payment checkout for online payments. Wallet payments are not available here.',
      });
    }

    const rawAddress = suppliedAddress || shippingAddress || {};
    const address = {
      fullName: String(rawAddress.fullName || rawAddress.name || '').trim(),
      phone: String(rawAddress.phone || '').trim(),
      line1: String(rawAddress.line1 || '').trim(),
      city: String(rawAddress.city || '').trim(),
      state: String(rawAddress.state || '').trim(),
      pincode: String(rawAddress.pincode || '').trim(),
    };

    if (!Object.values(address).every(Boolean)) {
      return res.status(400).json({
        message: 'Complete the delivery address before placing an order',
      });
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ message: 'Your cart is empty or invalid' });
    }

    const requested = [];

    for (const item of items) {
      const productId = item.productId || item.product || item.id;
      const qty = Number(item.qty);
      const size = String(item.size ?? '').trim();

      if (!productId || !Number.isSafeInteger(qty) || qty < 1 || !size) {
        return res.status(400).json({
          message: 'A cart item has invalid product, size, or quantity',
        });
      }

      requested.push({ productId, qty, size });
    }

    const products = await Product.find({
      _id: { $in: requested.map((item) => item.productId) },
    });

    const byId = new Map(
      products.map((product) => [String(product._id), product])
    );

    const lines = [];
    let subtotal = 0;

    for (const item of requested) {
      const product = byId.get(String(item.productId));

      if (!product || product.published === false) {
        return res.status(400).json({
          message: 'A product in your cart is no longer available',
        });
      }

      if (product.stock < item.qty) {
        return res.status(409).json({
          message: `Only ${product.stock} left of ${product.name}`,
        });
      }

      if (
        product.sizes?.length &&
        !product.sizes.some((size) => String(size) === item.size)
      ) {
        return res.status(400).json({
          message: `Size ${item.size} is unavailable for ${product.name}`,
        });
      }

      const numericSize = Number(item.size);

      lines.push({
        product: product._id,
        name: product.name,
        size: Number.isFinite(numericSize) ? numericSize : item.size,
        qty: item.qty,
        price: product.price,
      });

      subtotal += product.price * item.qty;
    }

    let discount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: String(couponCode).trim().toUpperCase(),
      });

      const problem = coupon
        ? coupon.problem(subtotal)
        : 'Coupon not found';

      if (problem) {
        return res.status(400).json({ message: problem });
      }

      discount = coupon.discountFor(subtotal);
    }

    const reserved = [];

    try {
      for (const line of lines) {
        const result = await Product.updateOne(
          {
            _id: line.product,
            published: true,
            stock: { $gte: line.qty },
          },
          { $inc: { stock: -line.qty } }
        );

        if (result.modifiedCount !== 1) {
          const error = new Error(
            `${line.name} just sold out. Please review your bag.`
          );
          error.status = 409;
          throw error;
        }

        reserved.push(line);
      }

      const orderNo = `SC-${50000 + (await Order.countDocuments()) + 1}`;

      const order = await Order.create({
        orderNo,
        user: req.user._id,
        items: lines,
        subtotal,
        discount,
        total: Math.max(0, subtotal - discount),
        couponCode: coupon?.code,
        paymentMethod: 'COD',
        payment: 'Pending',
        status: 'Pending',
        stockReserved: true,
        address,
      });

      if (coupon) {
        await Coupon.updateOne(
          { _id: coupon._id },
          { $inc: { used: 1 } }
        );
      }

      return res.status(201).json(order);
    } catch (error) {
      for (const line of reserved) {
        await Product.updateOne(
          { _id: line.product },
          { $inc: { stock: line.qty } }
        );
      }

      throw error;
    }
  })
);

// GET /api/orders/mine
router.get(
  '/mine',
  protect,
  asyncHandler(async (req, res) => {
    res.json(
      await Order.find({ user: req.user._id }).sort('-createdAt')
    );
  })
);

// GET /api/orders — admin list
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.orderNo = searchRegex(req.query.q);

    const data = await listing(Order, filter, req, {
      populate: { path: 'user', select: 'name email' },
    });

    const [total, pending, processing, shipped, revenue] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'Pending' }),
        Order.countDocuments({ status: 'Processing' }),
        Order.countDocuments({ status: 'Shipped' }),
        Order.aggregate([
          { $match: { payment: 'Paid' } },
          { $group: { _id: null, sum: { $sum: '$total' } } },
        ]),
      ]);

    res.json({
      ...data,
      summary: {
        total,
        pending,
        processing,
        shipped,
        revenue: revenue[0]?.sum || 0,
      },
    });
  })
);

// POST /api/orders/:id/cancel
router.post(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      String(order.user) !== String(req.user._id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not your order' });
    }

    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({
        message: 'This order can no longer be cancelled online',
      });
    }

    if (isRazorpayOrder(order)) {
      return res.status(409).json({
        message:
          'Online payment orders require payment-status reconciliation before cancellation.',
      });
    }

    if (order.payment === 'Paid' || order.payment === 'Refunded') {
      return res.status(409).json({
        message: 'This paid order requires the appropriate refund process.',
      });
    }

    const cancelled = await restoreStockOnce(order._id);

    if (!cancelled) {
      return res.status(409).json({
        message: 'The order has already changed. Refresh and try again.',
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled',
      order: cancelled,
    });
  })
);

// GET /api/orders/:id — owner or admin
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const userId = order.user?._id || order.user;
    const isOwner = String(userId) === String(req.user._id);

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your order' });
    }

    res.json(order);
  })
);

// PATCH /api/orders/:id/status — admin
router.patch(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, payment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Unknown order status' });
    }

    if (payment && !PAYMENT_STATUSES.includes(payment)) {
      return res.status(400).json({ message: 'Unknown payment status' });
    }

    if (payment && isRazorpayOrder(order)) {
      return res.status(400).json({
        message:
          'Razorpay payment status can only be changed by verified payment processing.',
      });
    }

    if (order.status === 'Cancelled' && status && status !== 'Cancelled') {
      return res.status(400).json({
        message: 'Cancelled orders cannot be reopened',
      });
    }

    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      if (isRazorpayOrder(order)) {
        return res.status(409).json({
          message:
            'Online payment orders require payment-status reconciliation before cancellation.',
        });
      }

      if (order.payment === 'Paid' || order.payment === 'Refunded') {
        return res.status(409).json({
          message: 'This paid order requires the appropriate refund process.',
        });
      }

      const cancelled = await restoreStockOnce(order._id);

      if (!cancelled) {
        return res.status(409).json({
          message: 'The order has already changed. Refresh and try again.',
        });
      }

      if (payment) cancelled.payment = payment;
      await cancelled.save();
      return res.json(cancelled);
    }

    if (status) order.status = status;
    if (payment) order.payment = payment;

    await order.save();
    res.json(order);
  })
);

export default router;
