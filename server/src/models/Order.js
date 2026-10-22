
import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const PAYMENT_STATUSES = [
  'Pending',
  'Paid',
  'Failed',
  'Refunded',
];

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        size: mongoose.Schema.Types.Mixed,
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },

    couponCode: String,

    paymentMethod: {
      type: String,
      default: 'COD',
    },

    payment: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'Pending',
    },

    // Razorpay payment references
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      default: undefined,
    },
    razorpaySignature: {
      type: String,
      default: undefined,
    },
    paymentVerifiedAt: {
      type: Date,
      default: undefined,
    },

    // Tracks whether stock was reserved for this order.
    // Older orders without this field remain compatible.
    stockReserved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
    },

    address: {
      fullName: String,
      phone: String,
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export default mongoose.model('Order', orderSchema);
