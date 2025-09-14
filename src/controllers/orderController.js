const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { createPaymentSession, verifyPayment } = require('../utils/waafiClient');
const axios = require('axios');

exports.createOrder = async (req, res) => {
  let order = null;
  let cart = null;

  try {
    cart = await Cart.findOne({ user: req.user.id }).populate('items.book');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const items = cart.items.map(item => ({
      book: item.book._id,
      title: item.title,
      price: item.price,
      qty: item.qty
    }));

    order = new Order({
      user: req.user.id,
      items,
      amount: cart.total,
      currency: "USD",
      status: "pending",
      gateway: "waafi",
      shippingAddress: req.body.shippingAddress
    });

    await order.save();
    console.log("✅ Order created:", order._id);

    for (let item of cart.items) {
      await Book.findByIdAndUpdate(item.book._id, { $inc: { stock: -item.qty } });
    }
    console.log("✅ Stock reduced");

    const payment = await createPaymentSession({
      amount: cart.total,
      orderId: order._id.toString(),
      customerTel: req.body.shippingAddress.phone
    });

    order.paymentRef = payment.referenceId || payment.transactionInfo?.referenceId;
    await order.save();

    await Cart.deleteOne({ user: req.user.id });
    console.log("✅ Cart cleared");

    return res.status(201).json({
      success: true,
      orderId: order._id,
      paymentUrl: payment.paymentUrl || "https://waafi.com/pay/" + order._id,
      message: "Payment approved. Redirecting to checkout..."
    });

  } catch (error) {
    console.error("❌ Order creation failed:", error.message);

    if (order && order._id) {
      console.log("🧹 Cleaning up failed order:", order._id);
      await Order.findByIdAndDelete(order._id);
      if (cart) {
        for (let item of cart.items) {
          await Book.findByIdAndUpdate(item.book._id, { $inc: { stock: item.qty } });
        }
      }
    }

    return res.status(500).json({
      success: false,
      error: "Payment failed. Please try again."
    });
  }
};

exports.verifyOrderPayment = async (req, res) => {
  try {
    const { referenceId, state } = req.body;

    if (!referenceId) {
      return res.status(400).json({ error: "Missing referenceId" });
    }

    const orderStatus = state === "APPROVED" ? "paid" : "failed";
    const result = await Order.findOneAndUpdate(
      { paymentRef: referenceId },
      { status: orderStatus },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      orderId: result._id,
      status: result.status
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error.message);
    return res.status(500).json({ error: "Payment verification failed" });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const { referenceId, state } = req.body;

    if (!referenceId) {
      return res.status(400).json({ error: "Missing referenceId" });
    }

    const orderStatus = state === "APPROVED" ? "paid" : "failed";
    const result = await Order.findOneAndUpdate(
      { paymentRef: referenceId },
      { status: orderStatus },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      orderId: result._id,
      status: result.status
    });

  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// 👇 ADD THESE TWO FUNCTIONS

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};