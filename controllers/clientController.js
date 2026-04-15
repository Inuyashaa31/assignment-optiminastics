const mongoose = require("mongoose");
const axios = require("axios");

const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");
const Order = require("../models/Order");

// CHECK BALANCE
exports.getBalance = async (req, res) => {
  try {
    const client_id = req.headers["client_id"]; // from header

    if (!client_id) {
      return res.status(400).json({
        error: "client_id header is required"
      });
    }

    const wallet = await Wallet.findOne({ client_id });

    if (!wallet) {
      return res.status(404).json({
        error: "Invalid client ID"
      });
    }

    res.json({
      client_id,
      balance: wallet.balance
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE ORDER (ATOMIC)
exports.createOrder = async (req, res) => {
  try {
    const client_id = req.headers["client_id"]; // from header
    const { amount, order_id } = req.body;      // from body

    if (!client_id) {
      return res.status(400).json({ error: "client_id header is required" });
    }

    if (!amount || !order_id) {
      return res.status(400).json({ error: "amount and order_id are required" });
    }

    // Step 1: Atomic deduction
    const wallet = await Wallet.findOneAndUpdate(
      { client_id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!wallet) {
      return res.status(400).json({
        error: "Invalid client ID or Insufficient funds"
      });
    }

    // Step 2: Ledger entry
    await Ledger.create({
      client_id,
      type: "debit",
      amount,
      balance_after: wallet.balance
    });

    // Step 3: External API call
    let fulfillment_id;

    try {
      const response = await axios.post(
        "https://jsonplaceholder.typicode.com/posts",
        {
          userId: client_id,
          title: order_id
        }
      );

      fulfillment_id = response.data.id;

    } catch (err) {
      // rollback balance
      await Wallet.updateOne(
        { client_id },
        { $inc: { balance: amount } }
      );

      return res.status(500).json({
        error: "External API failed, rollback done"
      });
    }

    // Step 4: Save order
    await Order.create({
      client_id,
      order_id,
      amount,
      fulfillment_id
    });

    res.json({
      message: "Order created successfully",
      fulfillment_id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const client_id = req.headers["client_id"]; // from header
    const { order_id } = req.params;

    if (!client_id) {
      return res.status(400).json({ error: "client_id header is required" });
    }

    // Find order
    const order = await Order.findOne({ order_id, client_id });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      order_id: order.order_id,
      client_id: order.client_id,
      amount: order.amount,
      fulfillment_id: order.fulfillment_id,
      createdAt: order.createdAt
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};