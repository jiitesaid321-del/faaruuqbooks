const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Coupon = require('../models/Coupon');

exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate('items.book', 'title price');
  if (!cart) cart = new Cart({ user: req.user.id });
  res.json(cart);
};

exports.addToCart = async (req, res) => {
  const { bookId, qty = 1 } = req.body;
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (book.stock < qty) return res.status(400).json({ error: 'Insufficient stock' });

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id });

  const existing = cart.items.find(item => item.book.toString() === bookId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({
      book: bookId,
      title: book.title,
      price: book.price,
      qty
    });
  }

  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  cart.total = cart.subtotal - cart.discount;

  await cart.save();
  res.json(cart);
};

exports.updateCartItem = async (req, res) => {
  const { bookId, qty } = req.body;
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  const item = cart.items.find(i => i.book.toString() === bookId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });

  const book = await Book.findById(bookId);
  if (book.stock < qty) return res.status(400).json({ error: 'Insufficient stock' });

  item.qty = qty;
  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  cart.total = cart.subtotal - cart.discount;

  await cart.save();
  res.json(cart);
};

exports.removeFromCart = async (req, res) => {
  const { bookId } = req.params;
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  cart.items = cart.items.filter(item => item.book.toString() !== bookId);
  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  cart.total = cart.subtotal - cart.discount;

  await cart.save();
  res.json(cart);
};

exports.applyCoupon = async (req, res) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({
    code,
    active: true,
    startsAt: { $lte: new Date() },
    $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }]
  });

  if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon' });

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  if (cart.subtotal < coupon.minSubtotal) return res.status(400).json({ error: 'Minimum subtotal not met' });

  cart.coupon = coupon._id;
  cart.discount = coupon.type === 'percent' ? (cart.subtotal * coupon.value / 100) : coupon.value;
  cart.total = cart.subtotal - cart.discount;

  await cart.save();
  res.json(cart);
};

exports.clearCart = async (req, res) => {
  await Cart.deleteOne({ user: req.user.id });
  res.json({ message: 'Cart cleared' });
};