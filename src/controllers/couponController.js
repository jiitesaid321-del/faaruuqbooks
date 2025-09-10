const Coupon = require('../models/Coupon');

// Admin only
exports.createCoupon = async (req, res) => {
  const coupon = new Coupon(req.body);
  await coupon.save();
  res.status(201).json(coupon);
};

exports.getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find();
  res.json(coupons);
};

exports.getCouponByCode = async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code });
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  res.json(coupon);
};

exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  res.json(coupon);
};

exports.deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  res.json({ message: 'Coupon deleted' });
};