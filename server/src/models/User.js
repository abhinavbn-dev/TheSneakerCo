
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
}, { _id: true });

const transactionSchema = new mongoose.Schema({
  note: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password needs at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  phone: { type: String, trim: true, default: '' },
  profilePicture: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  tier: {
    type: String,
    enum: ['Tier 1', 'Tier 2', 'Tier 3'],
    default: 'Tier 3',
  },
  status: {
    type: String,
    enum: ['Active', 'Flagged', 'Blocked'],
    default: 'Active',
  },
  isEmailVerified: { type: Boolean, default: false },

  // Email verification OTP
  emailVerificationOTPHash: { type: String, select: false },
  emailVerificationOTPExpires: { type: Date, select: false },
  emailVerificationOTPSentAt: { type: Date, select: false },

  // OTP resend cooldown and hourly limit tracking
  emailVerificationOTPResendWindowStartedAt: {
    type: Date,
    select: false,
  },
  emailVerificationOTPResendCount: {
    type: Number,
    default: 0,
    select: false,
  },

  // Password reset
  passwordResetTokenHash: {
    type: String,
    select: false,
  },
  passwordResetTokenExpires: {
    type: Date,
    select: false,
  },

  addresses: { type: [addressSchema], default: [] },
  walletBalance: { type: Number, default: 0, min: 0 },
  transactions: { type: [transactionSchema], default: [] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.matchesPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
