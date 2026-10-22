import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import User from '../src/models/User.js';

const rl = readline.createInterface({ input: stdin, output: stdout });
try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing from server/.env');
  const name = (await rl.question('Admin name: ')).trim();
  const email = (await rl.question('Admin email: ')).trim().toLowerCase();
  const password = await rl.question('Admin password (minimum 8 characters): ');
  const confirm = await rl.question('Confirm admin password: ');
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a name and a valid email address.');
  if (password.length < 8 || password !== confirm) throw new Error('Passwords must match and contain at least 8 characters.');
  await mongoose.connect(process.env.MONGO_URI);
  let user = await User.findOne({ email }).select('+password');
  if (user) {
    const answer = await rl.question('This email already exists. Type PROMOTE to reset its password and make it admin: ');
    if (answer.trim() !== 'PROMOTE') {
      console.log('Cancelled.');
    } else {
      user.name = name;
      user.password = password;
      user.role = 'admin';
      user.isEmailVerified = true;
      user.status = 'Active';
      user.emailVerificationOTPHash = undefined;
      user.emailVerificationOTPExpires = undefined;
      await user.save();
      console.log('Existing user promoted to admin.');
    }
  } else {
    await User.create({ name, email, password, role: 'admin', isEmailVerified: true, status: 'Active' });
    console.log('Admin account created successfully.');
  }
} catch (error) {
  console.error('Admin setup failed:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  if (mongoose.connection.readyState) await mongoose.disconnect();
}
