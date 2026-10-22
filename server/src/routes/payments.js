
import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';

const router = Router();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (
    !keyId?.startsWith('rzp_test_') ||
    !keySecret ||
    keySecret === 'your_test_key_secret'
  ) {
    const error = new Error(
      'Razorpay Test Mode credentials are missing or invalid'
    );
    error.status = 503;
    throw error;
  }

  return {
    keyId,
    keySecret,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
}

function normalizeAddress(raw = {}) {
  return {
    fullName: String(raw.fullName || raw.name || '').trim(),
    phone: String(raw.phone || '').trim(),
    line1: String(raw.line1 || '').trim(),
    city: String(raw.city || '').trim(),
    state: String(raw.state || '').trim(),
    pincode: String(raw.pincode || '').trim(),
  };
}

function validAddress(address) {
  return Object.values(address).every(Boolean);
}

function getProductId(item) {
  return item.productId || item.product || item.id;
}

// POST /api/payments/create-order
// Creates a Razorpay Test Mode order and reserves stock.
router.post(
  '/create-order',
  protect,
  asyncHandler(async (req, res) => {
    const { items, couponCode } = req.body;
    const address = normalizeAddress(
      req.body.address || req.body.shippingAddress
    );

    if (!validAddress(address)) {
      return res.status(400).json({
        message: 'Complete the delivery address before paying',
      });
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({
        message: 'Your cart is empty or contains too many items',
      });
    }

    const requestedLines = [];

    for (const item of items) {
      const productId = getProductId(item);
      const qty = Number(item.qty);
      const size = String(item.size ?? '').trim();

      if (
        !productId ||
        !Number.isSafeInteger(qty) ||
        qty < 1 ||
        !size
      ) {
        return res.status(400).json({
          message: 'A cart item has invalid product, size, or quantity',
        });
      }

      requestedLines.push({ productId, qty, size });
    }

    const products = await Product.find({
      _id: { $in: requestedLines.map((item) => item.productId) },
    });

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const lines = [];
    let subtotal = 0;

    for (const requested of requestedLines) {
      const product = productMap.get(String(requested.productId));

      if (!product || product.published === false) {
        return res.status(400).json({
          message: 'A product in your cart is no longer available',
        });
      }

      if (product.stock < requested.qty) {
        return res.status(409).json({
          message: `Only ${product.stock} left of ${product.name}`,
        });
      }

      if (
        product.sizes?.length &&
        !product.sizes.some(
          (availableSize) => String(availableSize) === requested.size
        )
      ) {
        return res.status(400).json({
          message: `Size ${requested.size} is unavailable for ${product.name}`,
        });
      }

      const numericSize = Number(requested.size);

      lines.push({
        product: product._id,
        name: product.name,
        size: Number.isFinite(numericSize)
          ? numericSize
          : requested.size,
        qty: requested.qty,
        price: product.price,
      });

      subtotal += product.price * requested.qty;
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

    const total = Math.max(0, subtotal - discount);
    const amountInPaise = Math.round(total * 100);

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return res.status(400).json({
        message: 'The order total must be greater than zero',
      });
    }

    const { client, keyId } = getRazorpay();

    // Create the Razorpay order before reserving local stock.
    let razorpayOrder;

    try {
      razorpayOrder = await client.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `SC${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`,
        notes: {
          customerId: String(req.user._id),
        },
      });
    } catch (error) {
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        const configurationError = new Error(
          'Razorpay rejected the configured credentials. Set one matching test-mode RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET pair in server/.env, then restart the server.'
        );
        configurationError.status = 503;
        throw configurationError;
      }

      throw error;
    }

    const reserved = [];

    try {
      // Reserve each line atomically.
      for (const line of lines) {
        const result = await Product.updateOne(
          {
            _id: line.product,
            published: true,
            stock: { $gte: line.qty },
          },
          {
            $inc: { stock: -line.qty },
          }
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

      const localOrder = await Order.create({
        orderNo,
        user: req.user._id,
        items: lines,
        subtotal,
        discount,
        total,
        couponCode: coupon?.code,
        paymentMethod: 'Razorpay',
        payment: 'Pending',
        status: 'Pending',
        razorpayOrderId: razorpayOrder.id,
        stockReserved: true,
        address,
      });

      return res.status(201).json({
        keyId,
        orderId: localOrder._id,
        orderNo: localOrder.orderNo,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'THE SNEAKER CO.',
        description: `Order ${localOrder.orderNo}`,
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
      });
    } catch (error) {
      // Restore only stock this request successfully reserved.
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

// POST /api/payments/verify
// The server verifies the signature and confirms the payment is captured.
router.post(
  '/verify',
  protect,
  asyncHandler(async (req, res) => {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (
      typeof razorpayOrderId !== 'string' ||
      typeof razorpayPaymentId !== 'string' ||
      typeof razorpaySignature !== 'string'
    ) {
      return res.status(400).json({
        message: 'Missing Razorpay payment verification details',
      });
    }

    const order = await Order.findOne({
      razorpayOrderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: 'Payment order not found',
      });
    }

    if (order.payment === 'Paid') {
      if (order.razorpayPaymentId === razorpayPaymentId) {
        return res.json({
          success: true,
          orderId: order._id,
          orderNo: order.orderNo,
          message: 'Payment already verified',
        });
      }

      return res.status(409).json({
        message: 'This order has already been paid',
      });
    }

    if (
      order.payment !== 'Pending' ||
      order.status === 'Cancelled' ||
      order.stockReserved !== true
    ) {
      return res.status(409).json({
        message: 'This order is no longer awaiting payment',
      });
    }

    const { client, keySecret } = getRazorpay();

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest();

    if (!/^[a-f0-9]{64}$/i.test(razorpaySignature)) {
      return res.status(400).json({
        message: 'Payment signature verification failed',
      });
    }

    const suppliedSignature = Buffer.from(razorpaySignature, 'hex');

    if (
      suppliedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, suppliedSignature)
    ) {
      return res.status(400).json({
        message: 'Payment signature verification failed',
      });
    }

    let payment = await client.payments.fetch(razorpayPaymentId);
    const expectedAmount = Math.round(order.total * 100);

    if (
      payment.order_id !== razorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== 'INR'
    ) {
      return res.status(400).json({
        message: 'The payment details do not match this order',
      });
    }

    if (payment.status === 'authorized') {
      try {
        payment = await client.payments.capture(
          razorpayPaymentId,
          expectedAmount,
          'INR'
        );
      } catch (captureError) {
        // Re-fetch in case capture succeeded remotely but its response was lost.
        try {
          payment = await client.payments.fetch(razorpayPaymentId);
        } catch (reconciliationError) {
          const error = new Error(
            'Unable to confirm payment capture. Please check My Orders before retrying.',
            { cause: reconciliationError }
          );
          error.status = 502;
          throw error;
        }

        if (payment.status !== 'captured') {
          const error = new Error(
            'Payment was authorized but could not be captured. Please contact support before retrying.',
            { cause: captureError }
          );
          error.status = 502;
          throw error;
        }
      }
    }

    if (
      payment.status !== 'captured' ||
      payment.order_id !== razorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== 'INR'
    ) {
      return res.status(400).json({
        message: 'The payment could not be confirmed as captured',
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: req.user._id,
        payment: 'Pending',
        status: { $ne: 'Cancelled' },
        stockReserved: true,
      },
      {
        $set: {
          payment: 'Paid',
          razorpayPaymentId,
          razorpaySignature,
          paymentVerifiedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      const latest = await Order.findById(order._id);

      if (
        latest?.payment === 'Paid' &&
        latest.razorpayPaymentId === razorpayPaymentId
      ) {
        return res.json({
          success: true,
          orderId: latest._id,
          orderNo: latest.orderNo,
          message: 'Payment already verified',
        });
      }

      return res.status(409).json({
        message: 'Order changed while payment was being verified',
      });
    }

    if (updatedOrder.couponCode) {
      await Coupon.updateOne(
        { code: updatedOrder.couponCode },
        { $inc: { used: 1 } }
      );
    }

    return res.json({
      success: true,
      orderId: updatedOrder._id,
      orderNo: updatedOrder.orderNo,
      message: 'Payment verified successfully',
    });
  })
);

export default router;
