
import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  role: u.role,
  city: u.city || '',
  profilePicture: u.profilePicture || '',
});

function createMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function getClientUrl() {
  const value =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173';

  return value.replace(/\/+$/, '');
}

// Register with email verification.
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone, city } = req.body || {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: 'Name, email and password are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must contain at least 8 characters',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Enter a valid email address',
    });
  }

  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({
      message: 'An account with this email already exists',
    });
  }

  const mailer = createMailer();

  if (!mailer) {
    return res.status(503).json({
      message: 'Email verification is not configured. Add SMTP settings to server/.env.',
    });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: typeof phone === 'string' ? phone.trim() : '',
    city: typeof city === 'string' ? city.trim() : '',
    role: 'user',
    isEmailVerified: false,
    emailVerificationOTPHash: await bcrypt.hash(otp, 10),
    emailVerificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
  });

  await user.save();

  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: normalizedEmail,
      subject: 'Verify your Sneaker Co. account',
      text: `Your Sneaker Co. verification code is ${otp}. It expires in 10 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>Welcome to The Sneaker Co.</h2><p>Your email verification code is:</p><h1 style="letter-spacing:6px">${otp}</h1><p>This code expires in 10 minutes.</p></div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    return res.status(201).json({
      success: true,
      message: 'Registration started. Check your email for the verification code.',
      ...(process.env.NODE_ENV !== 'production' && previewUrl
        ? { previewUrl }
        : {}),
    });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    console.error('Registration email failed:', error.message);

    return res.status(502).json({
      message: 'Could not send verification email. Check your SMTP settings.',
    });
  }
}));

// Google sign-in: verify the Google credential on the server.
router.post('/google', asyncHandler(async (req, res) => {
  const { credential } = req.body || {};

  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({
      message: 'Google sign-in credential is required',
    });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      message: 'Google sign-in is not configured on the server.',
    });
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({
      message: 'Google sign-in could not be verified. Please try again.',
    });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({
      message: 'Google must provide a verified email address.',
    });
  }

  const email = payload.email.trim().toLowerCase();

  let user = await User.findOne({ email });

  if (user) {
    if (user.status === 'Blocked') {
      return res.status(403).json({
        message: 'This account is blocked.',
      });
    }

    if (user.role !== 'user') {
      return res.status(403).json({
        message: 'Please use the admin sign-in page for this account.',
      });
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationOTPHash = undefined;
      user.emailVerificationOTPExpires = undefined;
    }

    if (!user.profilePicture && payload.picture) {
      user.profilePicture = payload.picture;
    }

    await user.save();
  } else {
    const randomPassword = crypto.randomBytes(32).toString('hex');

    user = new User({
      name: payload.name?.trim() || email.split('@')[0],
      email,
      password: randomPassword,
      profilePicture: payload.picture || '',
      role: 'user',
      isEmailVerified: true,
      status: 'Active',
    });

    await user.save();
  }

  return res.json({
    success: true,
    token: signToken(user.id),
    user: publicUser(user),
  });
}));

// Verify registration email OTP.
router.post('/verify', asyncHandler(async (req, res) => {
  const { email, otp, code } = req.body || {};
  const suppliedCode = String(otp ?? code ?? '').trim();

  if (
    typeof email !== 'string' ||
    !email.trim() ||
    !/^\d{6}$/.test(suppliedCode)
  ) {
    return res.status(400).json({
      message: 'Enter your email and six-digit OTP',
    });
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select('+emailVerificationOTPHash +emailVerificationOTPExpires');

  if (!user) {
    return res.status(404).json({ message: 'Account not found' });
  }

  if (user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: 'Email is already verified',
    });
  }

  if (
    !user.emailVerificationOTPHash ||
    !user.emailVerificationOTPExpires ||
    user.emailVerificationOTPExpires.getTime() < Date.now()
  ) {
    return res.status(400).json({
      message: 'OTP expired. Please register again or request a new code.',
    });
  }

  if (!(await bcrypt.compare(suppliedCode, user.emailVerificationOTPHash))) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.isEmailVerified = true;
  user.emailVerificationOTPHash = undefined;
  user.emailVerificationOTPExpires = undefined;
  await user.save();

  return res.json({
    success: true,
    message: 'Email verified successfully.',
    token: signToken(user.id),
    user: publicUser(user),
  });
}));

// Request a password-reset link.
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body || {};

  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      message: 'Enter your email address',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Enter a valid email address',
    });
  }

  const genericMessage =
    'If an account exists for that email, a password-reset link will be sent.';

  const user = await User.findOne({ email: normalizedEmail });

  // Use the same response for unknown accounts to reduce account discovery.
  if (!user) {
    return res.json({ success: true, message: genericMessage });
  }

  const mailer = createMailer();

  if (!mailer) {
    console.error('Password reset requested, but SMTP is not configured.');

    return res.status(503).json({
      message: 'Password reset email is temporarily unavailable. Please try again later.',
    });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetUrl = new URL('/reset-password', `${getClientUrl()}/`);
  resetUrl.searchParams.set('token', rawToken);

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: normalizedEmail,
      subject: 'Reset your Sneaker Co. password',
      text: [
        'We received a request to reset your Sneaker Co. password.',
        '',
        `Open this link to choose a new password: ${resetUrl.toString()}`,
        '',
        'This link expires in 15 minutes.',
        'If you did not request a password reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#171717">
          <h2>The Sneaker Co.</h2>
          <h3>Reset your password</h3>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetUrl.toString()}"
               style="display:inline-block;background:#111;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    // Invalidate the token if the email could not be sent.
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    console.error('Password reset email failed:', error.message);

    return res.status(502).json({
      message: 'Could not send the password-reset email. Please try again later.',
    });
  }

  return res.json({
    success: true,
    message: genericMessage,
  });
}));

// Validate a reset link and save the new password.
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({
      message: 'This password-reset link is invalid or expired. Request a new link.',
    });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      message: 'Password must contain at least 8 characters',
    });
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetTokenExpires');

  if (!user) {
    return res.status(400).json({
      message: 'This password-reset link is invalid or expired. Request a new link.',
    });
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save();

  return res.json({
    success: true,
    message: 'Password reset successfully. You can now sign in with your new password.',
  });
}));

function signIn({ adminOnly }) {
  return asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Enter your email and password',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+password');

    if (!user || !(await user.matchesPassword(password))) {
      return res.status(401).json({
        message: 'Email or password is incorrect',
      });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        message: 'This account is blocked',
      });
    }

    if (adminOnly && user.role !== 'admin') {
      return res.status(403).json({
        message: 'This account does not have admin access',
      });
    }

    if (
      !adminOnly &&
      user.role !== 'admin' &&
      !user.isEmailVerified
    ) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
      });
    }

    return res.json({
      success: true,
      token: signToken(user.id),
      user: publicUser(user),
    });
  });
}

router.post('/login', signIn({ adminOnly: false }));
router.post('/admin-login', signIn({ adminOnly: true }));

router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
