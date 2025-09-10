const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { createPaymentSession, verifyPayment } = require('../utils/waafiClient');

exports.createOrder = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.book');
  if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  const items = cart.items.map(item => ({
    book: item.book._id,
    title: item.title,
    price: item.price,
    qty: item.qty
  }));

  const order = new Order({
    user: req.user.id,
    items,
    amount: cart.total,
    shippingAddress: req.body.shippingAddress
  });

  await order.save();

  // Reduce book stock
  for (let item of cart.items) {
    await Book.findByIdAndUpdate(item.book._id, { $inc: { stock: -item.qty } });
  }

  // Create Waafi payment
  const payment = await createPaymentSession({
    amount: cart.total,
    orderId: order._id.toString(),
    customerTel: req.body.shippingAddress.phone
  });

  order.paymentRef = payment.reference;
  await order.save();

  // Clear cart
  await Cart.deleteOne({ user: req.user.id });

  res.status(201).json({
    order,
    paymentUrl: payment.payment_url
  });
};

exports.verifyOrderPayment = async (req, res) => {
  const { reference } = req.body;
  const payment = await verifyPayment(reference);

  if (payment.status !== 'success') {
    await Order.findOneAndUpdate({ paymentRef: reference }, { status: 'failed' });
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  const order = await Order.findOneAndUpdate(
    { paymentRef: reference, status: 'pending' },
    { status: 'paid' },
    { new: true }
  );

  if (!order) return res.status(404).json({ error: 'Order not found or already processed' });

  res.json({ message: 'Payment verified, order confirmed', order });
};

// Webhook from Waafi
exports.paymentWebhook = async (req, res) => {
  const { reference, status } = req.body;
  const orderStatus = status === 'success' ? 'paid' : 'failed';

  await Order.findOneAndUpdate({ paymentRef: reference }, { status: orderStatus });
  res.status(200).json({ received: true });
};

exports.getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

// Admin only
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
  res.json(orders);
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};