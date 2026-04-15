const mongoose = require("mongoose");
const axios = require("axios");

const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");
const Order = require("../models/Order");

// CHECK BALANCE
exports.getBalance = async (req, res) => {
  try {
    const { client_id } = req.params;

    const wallet = await Wallet.findOne({ client_id });

    if (!wallet) {
      return res.status(404).json({ error: "Invalid client ID" });
    }

    res.json({ balance: wallet.balance });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE ORDER (ATOMIC)
exports.createOrder = async (req, res) => {
  try {
    const { client_id, amount, order_id } = req.body;

    // Step 1: Atomic balance check + deduction (prevents race condition)
    const wallet = await Wallet.findOneAndUpdate(
      { client_id, balance: { $gte: amount } }, // condition
      { $inc: { balance: -amount } },           // deduction
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
      // Manual rollback (important)
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