
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['percent', 'flat'],
      default: 'percent',
      required: true,
    },

    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount must be at least 1'],
      validate: {
        validator(value) {
          return this.type !== 'percent' || value <= 100;
        },
        message: 'Percentage discount cannot exceed 100%',
      },
    },

    maxDiscount: {
      type: Number,
      default: 3000,
      min: [1, 'Maximum discount must be at least ₹1'],
    },

    limit: {
      type: Number,
      default: 500,
      min: [1, 'Usage limit must be at least 1'],
    },

    used: {
      type: Number,
      default: 0,
      min: 0,
    },

    minOrder: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order cannot be negative'],
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

couponSchema.virtual('status').get(function () {
  if (this.expiresAt && this.expiresAt < new Date()) {
    return 'Expired';
  }

  if (this.used >= this.limit) {
    return 'Limit reached';
  }

  return this.isActive ? 'Active' : 'Draft';
});

couponSchema.methods.problem = function (subtotal) {
  const amount = Number(subtotal);

  if (!Number.isFinite(amount) || amount < 0) {
    return 'Invalid bill amount';
  }

  if (this.expiresAt && this.expiresAt < new Date()) {
    return 'This coupon has expired';
  }

  if (!this.isActive) {
    return 'This coupon is not active';
  }

  if (this.used >= this.limit) {
    return 'This coupon has reached its usage limit';
  }

  if (this.type === 'percent' && amount < 10000) {
    return 'This offer is valid only on bills of ₹10,000 or more';
  }

  if (amount < (Number(this.minOrder) || 0)) {
    return `Spend at least ₹${this.minOrder} to use this coupon`;
  }

  return null;
};

couponSchema.methods.discountFor = function (subtotal) {
  const amount = Math.max(0, Number(subtotal) || 0);

  const rawDiscount =
    this.type === 'percent'
      ? Math.round((amount * this.value) / 100)
      : this.value;

  // Percentage coupons cannot discount more than ₹3,000.
  const cappedDiscount =
    this.type === 'percent'
      ? Math.min(rawDiscount, Number(this.maxDiscount) || 3000, 3000)
      : rawDiscount;

  // A discount cannot exceed the bill amount.
  return Math.min(amount, cappedDiscount);
};

export default mongoose.model('Coupon', couponSchema);
