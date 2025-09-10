const mongoose = require('mongoose');
const validator = require('validator');

const addressSchema = new mongoose.Schema({
  label: { type: String },
  country: { type: String, default: 'Somalia' },
  city: { type: String },
  district: { type: String },
  street: { type: String },
  phone: { type: String },
  default: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, validate: [validator.isEmail, 'Invalid email'] },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String },
  avatarUrl: { type: String },
  isVerified: { type: Boolean, default: false },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  lastLoginAt: { type: Date },
  resetToken: { type: String },
  resetTokenExp: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);