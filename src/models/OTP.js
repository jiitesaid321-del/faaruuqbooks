const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  name: { type: String },
  password: { type: String },
  role: { type: String, default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('OTP', otpSchema);