const bcrypt = require('bcrypt');
const { signUser } = require('../utils/jwt');
const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');

exports.sendOTP = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const otpCode = Math.floor(100000 + Math.random() * 900000);
  const hashedPassword = await bcrypt.hash(password, 10);

  await OTP.findOneAndUpdate(
    { email },
    {
      email,
      code: otpCode.toString(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      name,
      password: hashedPassword,
      role: role || 'user'
    },
    { upsert: true, new: true }
  );

  await sendEmail(email, 'Your OTP Code', `Your OTP is ${otpCode}. It expires in 5 minutes.`);
  return res.status(200).json({ message: 'OTP sent to your email' });
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const record = await OTP.findOne({ email, code: otp.toString() });
  if (!record) return res.status(400).json({ error: 'Invalid OTP' });
  if (record.expiresAt < Date.now()) return res.status(400).json({ error: 'OTP expired' });

  const user = new User({
    name: record.name,
    email: record.email,
    password: record.password,
    role: record.role
  });

  await user.save();
  await OTP.deleteOne({ _id: record._id });

  const token = signUser(user);
  return res.status(201).json({
    message: 'User registered and logged in',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 👇 NOTICE: .select('+password') to include hidden password field
    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) return res.status(400).json({ error: 'Invalid credentials' });

    // Check if password field exists
    if (!existingUser.password) {
      return res.status(400).json({ error: 'Password not set for this user. Please register again.' });
    }

    const valid = await bcrypt.compare(password, existingUser.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    existingUser.lastLoginAt = Date.now();
    await existingUser.save();

    const token = signUser(existingUser);
    return res.status(200).json({
      message: 'Login successful',
      user: { id: existingUser._id, name: existingUser.name, email: existingUser.email, role: existingUser.role },
      token
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
// Optional: Logout (client-side token destruction)
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};